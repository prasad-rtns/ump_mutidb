USE master;
GO

IF DB_ID(N'ump_auth') IS NULL
BEGIN
  CREATE DATABASE ump_auth;
END
GO

IF DB_ID(N'ump_master') IS NULL
BEGIN
  CREATE DATABASE ump_master;
END
GO

IF DB_ID(N'ump_documents') IS NULL
BEGIN
  CREATE DATABASE ump_documents;
END
GO

USE ump_auth;
GO

IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.roles (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    slug NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.departments', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.departments (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    parent_id NVARCHAR(36) NULL,
    manager_id NVARCHAR(36) NULL,
    description NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.designations', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.designations (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    department_id NVARCHAR(36) NOT NULL,
    level INT NOT NULL DEFAULT 1,
    description NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_designations_department FOREIGN KEY (department_id) REFERENCES dbo.departments(id)
  );
END
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    middle_name NVARCHAR(100) NULL,
    last_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    avatar NVARCHAR(500) NULL,
    role_id NVARCHAR(36) NOT NULL,
    department_id NVARCHAR(36) NOT NULL,
    designation_id NVARCHAR(36) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active',
    is_email_verified BIT NOT NULL DEFAULT 0,
    email_verification_token NVARCHAR(255) NULL,
    password_reset_token NVARCHAR(255) NULL,
    password_reset_expires DATETIME2 NULL,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lock_until DATETIME2 NULL,
    two_factor_secret NVARCHAR(255) NULL,
    two_factor_enabled BIT NOT NULL DEFAULT 0,
    last_login_at DATETIME2 NULL,
    last_login_ip NVARCHAR(50) NULL,
    created_by NVARCHAR(36) NULL,
    updated_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_users_status CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT FK_users_role FOREIGN KEY (role_id) REFERENCES dbo.roles(id),
    CONSTRAINT FK_users_department FOREIGN KEY (department_id) REFERENCES dbo.departments(id),
    CONSTRAINT FK_users_designation FOREIGN KEY (designation_id) REFERENCES dbo.designations(id)
  );
END
GO

IF OBJECT_ID(N'dbo.sessions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sessions (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL,
    refresh_token NVARCHAR(500) NOT NULL UNIQUE,
    device_info NVARCHAR(500) NULL,
    ip_address NVARCHAR(50) NULL,
    user_agent NVARCHAR(500) NULL,
    is_revoked BIT NOT NULL DEFAULT 0,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_sessions_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
  );
END
GO

IF OBJECT_ID(N'dbo.audit_logs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.audit_logs (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    user_id NVARCHAR(36) NULL,
    action NVARCHAR(100) NOT NULL,
    entity NVARCHAR(100) NOT NULL,
    entity_id NVARCHAR(36) NULL,
    old_values NVARCHAR(MAX) NULL,
    new_values NVARCHAR(MAX) NULL,
    ip_address NVARCHAR(50) NULL,
    user_agent NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE slug = 'admin')
BEGIN
  INSERT INTO dbo.roles (id, name, slug, description, permissions, is_active, created_at, updated_at)
  VALUES
    (N'550e8400-e29b-41d4-a716-446655440001', N'Administrator', N'admin', N'Full system access', N'["users:*","master:*","documents:*","settings:*"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'550e8400-e29b-41d4-a716-446655440002', N'Team Lead', N'lead', N'Department-scoped management', N'["users:read","users:update","documents:*","master:read"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'550e8400-e29b-41d4-a716-446655440003', N'User', N'user', N'Standard access', N'["users:self","documents:own"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE code = 'OPS')
BEGIN
  INSERT INTO dbo.departments (id, name, code, description, is_active, created_at, updated_at)
  VALUES
    (N'660e8400-e29b-41d4-a716-446655440001', N'Engineering', N'ENG', N'Software Engineering Department', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'660e8400-e29b-41d4-a716-446655440002', N'Human Resources', N'HR', N'HR Department', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'660e8400-e29b-41d4-a716-446655440003', N'Finance', N'FIN', N'Finance Department', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'660e8400-e29b-41d4-a716-446655440004', N'Marketing', N'MKT', N'Marketing Department', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'660e8400-e29b-41d4-a716-446655440005', N'Operations', N'OPS', N'Operations Department', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.designations WHERE code = 'SYS_ADMIN')
BEGIN
  INSERT INTO dbo.designations (id, name, code, department_id, level, description, is_active, created_at, updated_at)
  VALUES
    (N'770e8400-e29b-41d4-a716-446655440001', N'Software Engineer', N'SWE', N'660e8400-e29b-41d4-a716-446655440001', 2, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'770e8400-e29b-41d4-a716-446655440002', N'Senior Software Engineer', N'SSWE', N'660e8400-e29b-41d4-a716-446655440001', 3, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'770e8400-e29b-41d4-a716-446655440003', N'Engineering Manager', N'ENG_MGR', N'660e8400-e29b-41d4-a716-446655440001', 5, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'770e8400-e29b-41d4-a716-446655440004', N'HR Executive', N'HR_EXEC', N'660e8400-e29b-41d4-a716-446655440002', 2, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'770e8400-e29b-41d4-a716-446655440005', N'HR Manager', N'HR_MGR', N'660e8400-e29b-41d4-a716-446655440002', 4, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'770e8400-e29b-41d4-a716-446655440006', N'System Administrator', N'SYS_ADMIN', N'660e8400-e29b-41d4-a716-446655440005', 5, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@ump-platform.com')
BEGIN
  INSERT INTO dbo.users (
    id, username, email, password, first_name, last_name,
    role_id, department_id, designation_id, status, is_email_verified,
    created_at, updated_at
  )
  VALUES (
    N'880e8400-e29b-41d4-a716-446655440001',
    N'admin',
    N'admin@ump-platform.com',
    N'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Uhr5k5ZWEaFt3bE.S',
    N'System',
    N'Administrator',
    N'550e8400-e29b-41d4-a716-446655440001',
    N'660e8400-e29b-41d4-a716-446655440005',
    N'770e8400-e29b-41d4-a716-446655440006',
    N'active',
    1,
    SYSUTCDATETIME(),
    SYSUTCDATETIME()
  );
END
GO

USE ump_master;
GO

IF OBJECT_ID(N'dbo.countries', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.countries (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(3) NOT NULL UNIQUE,
    dial_code NVARCHAR(10) NULL,
    flag NVARCHAR(10) NULL,
    currency NVARCHAR(10) NULL,
    currency_symbol NVARCHAR(10) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.states', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.states (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(10) NOT NULL,
    country_id NVARCHAR(36) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_states_country FOREIGN KEY (country_id) REFERENCES dbo.countries(id)
  );
  CREATE INDEX IX_states_country_id ON dbo.states(country_id);
END
GO

IF OBJECT_ID(N'dbo.cities', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cities (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    state_id NVARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_cities_state FOREIGN KEY (state_id) REFERENCES dbo.states(id)
  );
  CREATE INDEX IX_cities_state_id ON dbo.cities(state_id);
END
GO

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.categories (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    parent_id NVARCHAR(36) NULL,
    description NVARCHAR(MAX) NULL,
    icon NVARCHAR(100) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    metadata NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_categories_parent_id ON dbo.categories(parent_id);
END
GO

IF OBJECT_ID(N'dbo.tags', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.tags (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    slug NVARCHAR(100) NOT NULL UNIQUE,
    color NVARCHAR(20) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.document_types', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.document_types (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(MAX) NULL,
    allowed_mime_types NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    max_size_mb INT NOT NULL DEFAULT 10,
    is_required BIT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.system_settings', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.system_settings (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    [key] NVARCHAR(200) NOT NULL UNIQUE,
    value NVARCHAR(MAX) NULL,
    [type] NVARCHAR(50) NOT NULL DEFAULT 'string',
    description NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NOT NULL DEFAULT 'general',
    is_public BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

USE ump_documents;
GO

IF OBJECT_ID(N'dbo.documents', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.documents (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    original_name NVARCHAR(255) NOT NULL,
    mime_type NVARCHAR(255) NOT NULL,
    size INT NOT NULL,
    url NVARCHAR(MAX) NOT NULL,
    [key] NVARCHAR(850) NOT NULL UNIQUE,
    provider NVARCHAR(50) NOT NULL,
    public_id NVARCHAR(255) NULL,
    uploaded_by NVARCHAR(255) NOT NULL,
    entity_type NVARCHAR(100) NULL,
    entity_id NVARCHAR(255) NULL,
    folder NVARCHAR(255) NULL,
    tags NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    metadata NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    deleted_by NVARCHAR(255) NULL,
    created_by NVARCHAR(255) NULL,
    updated_by NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_documents_status CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    CONSTRAINT CHK_documents_provider CHECK (provider IN ('s3', 'cloudinary', 'local'))
  );
  CREATE INDEX IX_documents_uploaded_by ON dbo.documents(uploaded_by);
  CREATE INDEX IX_documents_created_by ON dbo.documents(created_by);
  CREATE INDEX IX_documents_updated_by ON dbo.documents(updated_by);
  CREATE INDEX IX_documents_entity ON dbo.documents(entity_type, entity_id);
  CREATE INDEX IX_documents_status ON dbo.documents(status);
  CREATE INDEX IX_documents_provider ON dbo.documents(provider);
  CREATE INDEX IX_documents_is_deleted ON dbo.documents(is_deleted);
  CREATE INDEX IX_documents_created_at ON dbo.documents(created_at);
END
GO
