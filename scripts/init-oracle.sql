-- ─────────────────────────────────────────────────────────────────────────────
--  UMP Platform — Oracle DB Init Script
--  Run as DBA or as the ump_user after granting privileges.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Create schema user (run as SYS/SYSTEM) ───────────────────────────────────
-- CREATE USER ump_user IDENTIFIED BY "ump_pass_2024";
-- GRANT CONNECT, RESOURCE, CREATE SESSION TO ump_user;
-- GRANT CREATE TABLE, CREATE INDEX, CREATE SEQUENCE TO ump_user;
-- GRANT UNLIMITED TABLESPACE TO ump_user;
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
  id           VARCHAR2(36)  DEFAULT SYS_GUID() PRIMARY KEY,
  name         VARCHAR2(100) NOT NULL,
  slug         VARCHAR2(50)  NOT NULL UNIQUE,
  description  VARCHAR2(500),
  permissions  CLOB          DEFAULT '[]',
  is_active    NUMBER(1)     DEFAULT 1 NOT NULL,
  created_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- ─── Departments ──────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id           VARCHAR2(36)  DEFAULT SYS_GUID() PRIMARY KEY,
  name         VARCHAR2(150) NOT NULL,
  code         VARCHAR2(50)  NOT NULL UNIQUE,
  parent_id    VARCHAR2(36)  REFERENCES departments(id),
  manager_id   VARCHAR2(36),
  description  VARCHAR2(500),
  is_active    NUMBER(1)     DEFAULT 1 NOT NULL,
  created_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- ─── Designations ─────────────────────────────────────────────────────────────
CREATE TABLE designations (
  id             VARCHAR2(36)  DEFAULT SYS_GUID() PRIMARY KEY,
  name           VARCHAR2(150) NOT NULL,
  code           VARCHAR2(50)  NOT NULL UNIQUE,
  department_id  VARCHAR2(36)  NOT NULL REFERENCES departments(id),
  level          NUMBER(3)     DEFAULT 1 NOT NULL,
  description    VARCHAR2(500),
  is_active      NUMBER(1)     DEFAULT 1 NOT NULL,
  created_at     TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at     TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                        VARCHAR2(36)  PRIMARY KEY,
  username                  VARCHAR2(50)  NOT NULL UNIQUE,
  email                     VARCHAR2(255) NOT NULL UNIQUE,
  password                  VARCHAR2(255) NOT NULL,
  first_name                VARCHAR2(100) NOT NULL,
  last_name                 VARCHAR2(100) NOT NULL,
  phone                     VARCHAR2(20),
  avatar                    VARCHAR2(500),
  role_id                   VARCHAR2(36)  NOT NULL REFERENCES roles(id),
  department_id             VARCHAR2(36)  NOT NULL REFERENCES departments(id),
  designation_id            VARCHAR2(36)  NOT NULL REFERENCES designations(id),
  status                    VARCHAR2(20)  DEFAULT 'active' NOT NULL
                              CHECK (status IN ('active','inactive','suspended')),
  is_email_verified         NUMBER(1)     DEFAULT 0 NOT NULL,
  email_verification_token  VARCHAR2(255),
  password_reset_token      VARCHAR2(255),
  password_reset_expires    TIMESTAMP,
  failed_login_attempts     NUMBER(3)     DEFAULT 0 NOT NULL,
  lock_until                TIMESTAMP,
  two_factor_secret         VARCHAR2(255),
  two_factor_enabled        NUMBER(1)     DEFAULT 0 NOT NULL,
  last_login_at             TIMESTAMP,
  last_login_ip             VARCHAR2(50),
  created_by                VARCHAR2(36),
  updated_by                VARCHAR2(36),
  created_at                TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at                TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_uname  ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_dept   ON users(department_id);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id             VARCHAR2(36)  PRIMARY KEY,
  user_id        VARCHAR2(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token  VARCHAR2(500) NOT NULL UNIQUE,
  device_info    VARCHAR2(500),
  ip_address     VARCHAR2(50),
  user_agent     VARCHAR2(500),
  is_revoked     NUMBER(1)     DEFAULT 0 NOT NULL,
  expires_at     TIMESTAMP     NOT NULL,
  created_at     TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user    ON sessions(user_id);
CREATE INDEX idx_sessions_token   ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          VARCHAR2(36)  DEFAULT SYS_GUID() PRIMARY KEY,
  user_id     VARCHAR2(36),
  action      VARCHAR2(100) NOT NULL,
  entity      VARCHAR2(100) NOT NULL,
  entity_id   VARCHAR2(36),
  old_values  CLOB,
  new_values  CLOB,
  ip_address  VARCHAR2(50),
  user_agent  VARCHAR2(500),
  created_at  TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- ─── Seed Data ────────────────────────────────────────────────────────────────
INSERT INTO roles (name, slug, description, permissions, is_active)
VALUES ('Administrator', 'admin', 'Full system access', '["*"]', 1);

INSERT INTO roles (name, slug, description, permissions, is_active)
VALUES ('Team Lead', 'lead', 'Department-scoped management', '["read:users","write:users"]', 1);

INSERT INTO roles (name, slug, description, permissions, is_active)
VALUES ('User', 'user', 'Standard access', '["read:self","write:self"]', 1);

INSERT INTO departments (name, code) VALUES ('Engineering', 'ENG');
INSERT INTO departments (name, code) VALUES ('Human Resources', 'HR');
INSERT INTO departments (name, code) VALUES ('Finance', 'FIN');
INSERT INTO departments (name, code) VALUES ('Marketing', 'MKT');
INSERT INTO departments (name, code) VALUES ('Operations', 'OPS');

INSERT INTO designations (name, code, department_id, level)
  SELECT 'Software Engineer', 'SWE', id, 1 FROM departments WHERE code = 'ENG';
INSERT INTO designations (name, code, department_id, level)
  SELECT 'System Administrator', 'SYS_ADM', id, 3 FROM departments WHERE code = 'OPS';

-- Admin user (password: Admin@1234)
INSERT INTO users (id, username, email, password, first_name, last_name,
                   role_id, department_id, designation_id, status, is_email_verified)
SELECT SYS_GUID(), 'sysadmin', 'admin@ump-platform.com',
       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCaBxHxOmqhStX6ND.LPzJW',
       'System', 'Admin',
       (SELECT id FROM roles WHERE slug = 'admin'),
       (SELECT id FROM departments WHERE code = 'OPS'),
       (SELECT id FROM designations WHERE code = 'SYS_ADM'),
       'active', 1
FROM DUAL;

COMMIT;
