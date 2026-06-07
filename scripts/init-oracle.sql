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
  slug         VARCHAR2(100) NOT NULL UNIQUE,
  description  VARCHAR2(500),
  permissions  CLOB          DEFAULT '[]',
  is_active    NUMBER(1)     DEFAULT 1 NOT NULL,
  created_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- â”€â”€â”€ Company / Utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE company_or_utilities (
  id           VARCHAR2(36)  PRIMARY KEY,
  name         VARCHAR2(200) NOT NULL,
  code         VARCHAR2(50)  NOT NULL UNIQUE,
  type         VARCHAR2(20)  DEFAULT 'company' NOT NULL
                            CHECK (type IN ('company','utility')),
  description  VARCHAR2(500),
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
  middle_name               VARCHAR2(100),
  last_name                 VARCHAR2(100) NOT NULL,
  phone                     VARCHAR2(20),
  avatar                    VARCHAR2(500),
  role_id                   VARCHAR2(36)  NOT NULL REFERENCES roles(id),
  company_id                VARCHAR2(36)  REFERENCES company_or_utilities(id),
  department_id             VARCHAR2(36)  NOT NULL REFERENCES departments(id),
  designation_id            VARCHAR2(36)  NOT NULL REFERENCES designations(id),
  user_category             VARCHAR2(20)  DEFAULT 'internal' NOT NULL
                              CHECK (user_category IN ('external','internal','admin')),
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
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_dept   ON users(department_id);

-- â”€â”€â”€ Module Menus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE module_menus (
  id           VARCHAR2(36)  PRIMARY KEY,
  name         VARCHAR2(150) NOT NULL,
  code         VARCHAR2(100) NOT NULL UNIQUE,
  route        VARCHAR2(300),
  icon         VARCHAR2(100),
  parent_id    VARCHAR2(36),
  module_type  VARCHAR2(20)  DEFAULT 'admin' NOT NULL CHECK (module_type IN ('admin', 'internal', 'external')),
  sort_order   NUMBER(6)     DEFAULT 0 NOT NULL,
  permissions  CLOB          DEFAULT '[]',
  is_active    NUMBER(1)     DEFAULT 1 NOT NULL,
  created_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_module_menus_parent ON module_menus(parent_id);

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
VALUES ('Team Lead', 'lead', 'Department-scoped management', '["countries:read","dashboard:read","documents:*","master:read","external-users:read"]', 1);

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

INSERT INTO company_or_utilities (id, name, code, type, description, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440001', 'Default Company', 'DEFAULT', 'company', 'Default company/utility for seeded users', 1);

INSERT INTO module_menus (id, name, code, route, icon, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440101', 'Dashboard', 'dashboard', '/dashboard', 'LayoutDashboard', 10, '["dashboard:read"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440102', 'Master Data', 'master-data', '#', 'Database', NULL, 20, '["master:read"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440111', 'Country', 'countries', '/master/countries', 'Globe', '990e8400-e29b-41d4-a716-446655440102', 10, '["countries:read","countries:create","countries:update","countries:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440112', 'State', 'states', '/master/states', 'Map', '990e8400-e29b-41d4-a716-446655440102', 20, '["states:read","states:create","states:update","states:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440113', 'City', 'cities', '/master/cities', 'Building2', '990e8400-e29b-41d4-a716-446655440102', 30, '["cities:read","cities:create","cities:update","cities:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440114', 'Categories', 'categories', '/master/categories', 'Tag', '990e8400-e29b-41d4-a716-446655440102', 40, '["categories:read","categories:create","categories:update","categories:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440115', 'Tags', 'tags', '/master/tags', 'Hash', '990e8400-e29b-41d4-a716-446655440102', 50, '["tags:read","tags:create","tags:update","tags:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440116', 'Document Types', 'document-types', '/master/document-types', 'FileText', '990e8400-e29b-41d4-a716-446655440102', 60, '["document-types:read","document-types:create","document-types:update","document-types:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440117', 'Service Types', 'service-types', '/master/service-types', 'Layers', '990e8400-e29b-41d4-a716-446655440102', 70, '["service-types:read","service-types:create","service-types:update","service-types:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440118', 'Settings', 'settings', '/master/settings', 'Settings', '990e8400-e29b-41d4-a716-446655440102', 80, '["settings:read","settings:create","settings:update","settings:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440103', 'User Management', 'user-management', '#', 'ShieldCheck', NULL, 30, '["user-management:read"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440121', 'Roles', 'roles', '/user-management/roles', 'ShieldCheck', '990e8400-e29b-41d4-a716-446655440103', 10, '["roles:read","roles:create","roles:update","roles:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440122', 'Company', 'companies', '/user-management/companies', 'Building2', '990e8400-e29b-41d4-a716-446655440103', 20, '["companies:read","companies:create","companies:update","companies:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440123', 'Departments', 'departments', '/user-management/departments', 'FolderTree', '990e8400-e29b-41d4-a716-446655440103', 30, '["departments:read","departments:create","departments:update","departments:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440124', 'Designations', 'designations', '/user-management/designations', 'BadgeCheck', '990e8400-e29b-41d4-a716-446655440103', 40, '["designations:read","designations:create","designations:update","designations:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440125', 'Modules', 'modules', '/user-management/modules', 'MenuSquare', '990e8400-e29b-41d4-a716-446655440103', 50, '["modules:read","modules:create","modules:update","modules:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440126', 'External Users', 'external-users', '/users/external', 'Users', '990e8400-e29b-41d4-a716-446655440103', 60, '["external-users:read","external-users:create","external-users:update","external-users:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440127', 'Internal Users', 'internal-users', '/users/internal', 'UserCheck', '990e8400-e29b-41d4-a716-446655440103', 70, '["internal-users:read","internal-users:create","internal-users:update","internal-users:delete"]', 1);

INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440128', 'Admin Users', 'admin-users', '/users/admin', 'UserCog', '990e8400-e29b-41d4-a716-446655440103', 80, '["admin-users:read","admin-users:create","admin-users:update","admin-users:delete"]', 1);

-- Admin user (password: Admin@1234)
INSERT INTO users (id, username, email, password, first_name, last_name,
                   role_id, company_id, department_id, designation_id, user_category, status, is_email_verified)
SELECT SYS_GUID(), 'sysadmin', 'admin@ump-platform.com',
       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCaBxHxOmqhStX6ND.LPzJW',
       'System', 'Admin',
       (SELECT id FROM roles WHERE slug = 'admin'),
       (SELECT id FROM company_or_utilities WHERE code = 'DEFAULT'),
       (SELECT id FROM departments WHERE code = 'OPS'),
       (SELECT id FROM designations WHERE code = 'SYS_ADM'),
       'admin',
       'active', 1
FROM DUAL;

COMMIT;
