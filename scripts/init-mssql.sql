-- ─────────────────────────────────────────────────────────────────────────────
--  UMP Platform — SQL Server Init Script
--  Runs automatically in Docker via /docker-entrypoint-initdb.d/
-- ─────────────────────────────────────────────────────────────────────────────

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ump_db')
  CREATE DATABASE ump_db;
GO

USE ump_db;
GO

-- ─── Roles ────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles' AND xtype='U')
CREATE TABLE roles (
  id             NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
  name           NVARCHAR(100) NOT NULL,
  slug           NVARCHAR(50)  NOT NULL UNIQUE,
  description    NVARCHAR(500),
  permissions    NVARCHAR(MAX) DEFAULT '[]',  -- JSON array stored as string
  is_active      BIT           NOT NULL DEFAULT 1,
  created_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
  updated_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ─── Departments ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='departments' AND xtype='U')
CREATE TABLE departments (
  id             NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
  name           NVARCHAR(150) NOT NULL,
  code           NVARCHAR(50)  NOT NULL UNIQUE,
  parent_id      NVARCHAR(36)  REFERENCES departments(id),
  manager_id     NVARCHAR(36),
  description    NVARCHAR(500),
  is_active      BIT           NOT NULL DEFAULT 1,
  created_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
  updated_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ─── Designations ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='designations' AND xtype='U')
CREATE TABLE designations (
  id             NVARCHAR(36)  PRIMARY KEY DEFAULT NEWID(),
  name           NVARCHAR(150) NOT NULL,
  code           NVARCHAR(50)  NOT NULL UNIQUE,
  department_id  NVARCHAR(36)  NOT NULL REFERENCES departments(id),
  level          INT           NOT NULL DEFAULT 1,
  description    NVARCHAR(500),
  is_active      BIT           NOT NULL DEFAULT 1,
  created_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
  updated_at     DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ─── Users ────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
  id                        NVARCHAR(36)  PRIMARY KEY,
  username                  NVARCHAR(50)  NOT NULL UNIQUE,
  email                     NVARCHAR(255) NOT NULL UNIQUE,
  password                  NVARCHAR(255) NOT NULL,
  first_name                NVARCHAR(100) NOT NULL,
  last_name                 NVARCHAR(100) NOT NULL,
  phone                     NVARCHAR(20),
  avatar                    NVARCHAR(500),
  role_id                   NVARCHAR(36)  NOT NULL REFERENCES roles(id),
  department_id             NVARCHAR(36)  NOT NULL REFERENCES departments(id),
  designation_id            NVARCHAR(36)  NOT NULL REFERENCES designations(id),
  status                    NVARCHAR(20)  NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','inactive','suspended')),
  is_email_verified         BIT           NOT NULL DEFAULT 0,
  email_verification_token  NVARCHAR(255),
  password_reset_token      NVARCHAR(255),
  password_reset_expires    DATETIME2,
  failed_login_attempts     INT           NOT NULL DEFAULT 0,
  lock_until                DATETIME2,
  two_factor_secret         NVARCHAR(255),
  two_factor_enabled        BIT           NOT NULL DEFAULT 0,
  last_login_at             DATETIME2,
  last_login_ip             NVARCHAR(50),
  created_by                NVARCHAR(36),
  updated_by                NVARCHAR(36),
  created_at                DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
  updated_at                DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_users_email      ON users(email);
CREATE INDEX IX_users_username   ON users(username);
CREATE INDEX IX_users_status     ON users(status);
CREATE INDEX IX_users_dept       ON users(department_id);
CREATE INDEX IX_users_role       ON users(role_id);
GO

-- ─── Sessions ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
CREATE TABLE sessions (
  id             NVARCHAR(36)   PRIMARY KEY,
  user_id        NVARCHAR(36)   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token  NVARCHAR(500)  NOT NULL UNIQUE,
  device_info    NVARCHAR(500),
  ip_address     NVARCHAR(50),
  user_agent     NVARCHAR(500),
  is_revoked     BIT            NOT NULL DEFAULT 0,
  expires_at     DATETIME2      NOT NULL,
  created_at     DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_sessions_user     ON sessions(user_id);
CREATE INDEX IX_sessions_token    ON sessions(refresh_token);
CREATE INDEX IX_sessions_expires  ON sessions(expires_at);
GO

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
CREATE TABLE audit_logs (
  id          NVARCHAR(36)   PRIMARY KEY DEFAULT NEWID(),
  user_id     NVARCHAR(36),
  action      NVARCHAR(100)  NOT NULL,
  entity      NVARCHAR(100)  NOT NULL,
  entity_id   NVARCHAR(36),
  old_values  NVARCHAR(MAX),
  new_values  NVARCHAR(MAX),
  ip_address  NVARCHAR(50),
  user_agent  NVARCHAR(500),
  created_at  DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ─────────────────────────────────────────────────────────────────────────────
--  Seed Data
-- ─────────────────────────────────────────────────────────────────────────────
-- Roles
IF NOT EXISTS (SELECT 1 FROM roles WHERE slug = 'admin')
INSERT INTO roles (id, name, slug, description, permissions, is_active)
VALUES
  (NEWID(), 'Administrator', 'admin', 'Full system access', '["*"]', 1),
  (NEWID(), 'Team Lead', 'lead', 'Department-scoped management', '["read:users","write:users","manage:department"]', 1),
  (NEWID(), 'User', 'user', 'Standard access', '["read:self","write:self"]', 1);
GO

-- Departments
IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'ENG')
INSERT INTO departments (id, name, code, is_active) VALUES
  (NEWID(), 'Engineering',  'ENG',  1),
  (NEWID(), 'Human Resources', 'HR', 1),
  (NEWID(), 'Finance',      'FIN',  1),
  (NEWID(), 'Marketing',    'MKT',  1),
  (NEWID(), 'Operations',   'OPS',  1);
GO

-- Designations
DECLARE @engId NVARCHAR(36) = (SELECT id FROM departments WHERE code = 'ENG');
DECLARE @opsId NVARCHAR(36) = (SELECT id FROM departments WHERE code = 'OPS');
IF NOT EXISTS (SELECT 1 FROM designations WHERE code = 'SWE')
INSERT INTO designations (id, name, code, department_id, level) VALUES
  (NEWID(), 'Software Engineer', 'SWE', @engId, 1),
  (NEWID(), 'Senior SWE',        'SSWE', @engId, 2),
  (NEWID(), 'Engineering Manager','ENG_MGR', @engId, 3),
  (NEWID(), 'System Administrator','SYS_ADM', @opsId, 3);
GO

-- Admin user  (password: Admin@1234)
DECLARE @adminRoleId NVARCHAR(36) = (SELECT id FROM roles WHERE slug = 'admin');
DECLARE @opsDeptId   NVARCHAR(36) = (SELECT id FROM departments WHERE code = 'OPS');
DECLARE @sysDesigId  NVARCHAR(36) = (SELECT id FROM designations WHERE code = 'SYS_ADM');
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ump-platform.com')
INSERT INTO users (id, username, email, password, first_name, last_name, role_id, department_id, designation_id, status, is_email_verified)
VALUES (
  NEWID(), 'sysadmin', 'admin@ump-platform.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCaBxHxOmqhStX6ND.LPzJW',  -- Admin@1234
  'System', 'Admin', @adminRoleId, @opsDeptId, @sysDesigId, 'active', 1
);
GO
