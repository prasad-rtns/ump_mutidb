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
    slug NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.company_or_utilities', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.company_or_utilities (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    [type] NVARCHAR(20) NOT NULL DEFAULT 'company',
    description NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_company_or_utilities_type CHECK ([type] IN ('company', 'utility'))
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
    company_id NVARCHAR(36) NULL,
    department_id NVARCHAR(36) NOT NULL,
    designation_id NVARCHAR(36) NOT NULL,
    user_category NVARCHAR(20) NOT NULL DEFAULT 'internal',
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
    CONSTRAINT CHK_users_category CHECK (user_category IN ('external', 'internal', 'admin')),
    CONSTRAINT CHK_users_status CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT FK_users_role FOREIGN KEY (role_id) REFERENCES dbo.roles(id),
    CONSTRAINT FK_users_company FOREIGN KEY (company_id) REFERENCES dbo.company_or_utilities(id),
    CONSTRAINT FK_users_department FOREIGN KEY (department_id) REFERENCES dbo.departments(id),
    CONSTRAINT FK_users_designation FOREIGN KEY (designation_id) REFERENCES dbo.designations(id)
  );
  CREATE INDEX IX_users_company_id ON dbo.users(company_id);
END
GO

IF OBJECT_ID(N'dbo.module_menus', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.module_menus (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    code NVARCHAR(100) NOT NULL UNIQUE,
    route NVARCHAR(300) NULL,
    icon NVARCHAR(100) NULL,
    parent_id NVARCHAR(36) NULL,
    module_type NVARCHAR(20) NOT NULL DEFAULT N'admin' CHECK (module_type IN (N'admin', N'internal', N'external')),
    sort_order INT NOT NULL DEFAULT 0,
    permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_module_menus_parent_id ON dbo.module_menus(parent_id);
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
    (N'550e8400-e29b-41d4-a716-446655440002', N'Team Lead', N'lead', N'Department-scoped management', N'["countries:read","dashboard:read","documents:*","master:read","external-users:read"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
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

IF NOT EXISTS (SELECT 1 FROM dbo.company_or_utilities WHERE code = 'DEFAULT')
BEGIN
  INSERT INTO dbo.company_or_utilities (id, name, code, [type], description, is_active, created_at, updated_at)
  VALUES (N'990e8400-e29b-41d4-a716-446655440001', N'Default Company', N'DEFAULT', N'company', N'Default company/utility for seeded users', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.module_menus WHERE code = 'dashboard')
BEGIN
  INSERT INTO dbo.module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active, created_at, updated_at)
  VALUES
    (N'990e8400-e29b-41d4-a716-446655440101', N'Dashboard', N'dashboard', N'/dashboard', N'LayoutDashboard', NULL, 10, N'["dashboard:read"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440102', N'Master Data', N'master-data', N'#', N'Database', NULL, 20, N'["master:read"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440111', N'Country', N'countries', N'/master/countries', N'Globe', N'990e8400-e29b-41d4-a716-446655440102', 10, N'["countries:read","countries:create","countries:update","countries:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440112', N'State', N'states', N'/master/states', N'Map', N'990e8400-e29b-41d4-a716-446655440102', 20, N'["states:read","states:create","states:update","states:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440113', N'City', N'cities', N'/master/cities', N'Building2', N'990e8400-e29b-41d4-a716-446655440102', 30, N'["cities:read","cities:create","cities:update","cities:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440114', N'Categories', N'categories', N'/master/categories', N'Tag', N'990e8400-e29b-41d4-a716-446655440102', 40, N'["categories:read","categories:create","categories:update","categories:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440115', N'Tags', N'tags', N'/master/tags', N'Hash', N'990e8400-e29b-41d4-a716-446655440102', 50, N'["tags:read","tags:create","tags:update","tags:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440116', N'Document Types', N'document-types', N'/master/document-types', N'FileText', N'990e8400-e29b-41d4-a716-446655440102', 60, N'["document-types:read","document-types:create","document-types:update","document-types:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440117', N'Service Types', N'service-types', N'/master/service-types', N'Layers', N'990e8400-e29b-41d4-a716-446655440102', 70, N'["service-types:read","service-types:create","service-types:update","service-types:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440118', N'Settings', N'settings', N'/master/settings', N'Settings', N'990e8400-e29b-41d4-a716-446655440102', 80, N'["settings:read","settings:create","settings:update","settings:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440103', N'User Management', N'user-management', N'#', N'ShieldCheck', NULL, 30, N'["user-management:read"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440121', N'Roles', N'roles', N'/user-management/roles', N'ShieldCheck', N'990e8400-e29b-41d4-a716-446655440103', 10, N'["roles:read","roles:create","roles:update","roles:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440122', N'Company', N'companies', N'/user-management/companies', N'Building2', N'990e8400-e29b-41d4-a716-446655440103', 20, N'["companies:read","companies:create","companies:update","companies:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440123', N'Departments', N'departments', N'/user-management/departments', N'FolderTree', N'990e8400-e29b-41d4-a716-446655440103', 30, N'["departments:read","departments:create","departments:update","departments:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440124', N'Designations', N'designations', N'/user-management/designations', N'BadgeCheck', N'990e8400-e29b-41d4-a716-446655440103', 40, N'["designations:read","designations:create","designations:update","designations:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440125', N'Modules', N'modules', N'/user-management/modules', N'MenuSquare', N'990e8400-e29b-41d4-a716-446655440103', 50, N'["modules:read","modules:create","modules:update","modules:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440126', N'External Users', N'external-users', N'/users/external', N'Users', N'990e8400-e29b-41d4-a716-446655440103', 60, N'["external-users:read","external-users:create","external-users:update","external-users:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440127', N'Internal Users', N'internal-users', N'/users/internal', N'UserCheck', N'990e8400-e29b-41d4-a716-446655440103', 70, N'["internal-users:read","internal-users:create","internal-users:update","internal-users:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'990e8400-e29b-41d4-a716-446655440128', N'Admin Users', N'admin-users', N'/users/admin', N'UserCog', N'990e8400-e29b-41d4-a716-446655440103', 80, N'["admin-users:read","admin-users:create","admin-users:update","admin-users:delete"]', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@ump-platform.com')
BEGIN
  INSERT INTO dbo.users (
    id, username, email, password, first_name, last_name,
    role_id, company_id, department_id, designation_id, user_category, status, is_email_verified,
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
    N'990e8400-e29b-41d4-a716-446655440001',
    N'660e8400-e29b-41d4-a716-446655440005',
    N'770e8400-e29b-41d4-a716-446655440006',
    N'admin',
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

IF NOT EXISTS (SELECT 1 FROM dbo.system_settings WHERE [key] = N'ui.grid.rowsPerPage')
BEGIN
  INSERT INTO dbo.system_settings (id, [key], value, [type], description, category, is_public)
  VALUES (CONVERT(NVARCHAR(36), NEWID()), N'ui.grid.rowsPerPage', N'20', N'number', N'Rows shown per page in all frontend grids and tables', N'ui', 1);
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
