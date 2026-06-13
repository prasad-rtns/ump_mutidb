-- ─── Create databases ─────────────────────────────────────────────────────────
SELECT 'CREATE DATABASE ump_auth'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'ump_auth')\gexec
SELECT 'CREATE DATABASE ump_master'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'ump_master')\gexec
SELECT 'CREATE DATABASE ump_documents'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'ump_documents')\gexec

-- ─── Grant privileges ──────────────────────────────────────────────────────────
GRANT ALL PRIVILEGES ON DATABASE ump_auth TO ump_user;
GRANT ALL PRIVILEGES ON DATABASE ump_master TO ump_user;
GRANT ALL PRIVILEGES ON DATABASE ump_documents TO ump_user;

-- ─── Connect to ump_auth ───────────────────────────────────────────────────────
\c ump_auth;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE user_role_slug AS ENUM ('admin', 'lead', 'user');
CREATE TYPE user_category AS ENUM ('external', 'internal', 'admin');
CREATE TYPE company_utility_type AS ENUM ('company', 'utility');
CREATE TYPE module_type AS ENUM ('admin', 'internal', 'external');

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Company / Utilities
CREATE TABLE IF NOT EXISTS company_or_utilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type company_utility_type DEFAULT 'company' NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_id UUID,
    manager_id UUID,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Designations
CREATE TABLE IF NOT EXISTS designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id),
    level INTEGER DEFAULT 1 NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role_id UUID NOT NULL REFERENCES roles(id),
    company_id UUID REFERENCES company_or_utilities(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    designation_id UUID NOT NULL REFERENCES designations(id),
    user_category user_category DEFAULT 'internal' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    lock_until TIMESTAMP,
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_user_category ON users(user_category);
CREATE INDEX idx_users_status ON users(status);

-- Module menus
CREATE TABLE IF NOT EXISTS module_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    route VARCHAR(300),
    icon VARCHAR(100),
    parent_id UUID,
    module_type module_type DEFAULT 'admin' NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_module_menus_parent_id ON module_menus(parent_id);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);

-- ─── Seed data ─────────────────────────────────────────────────────────────────

-- Roles
INSERT INTO roles (id, name, slug, description, permissions) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Administrator', 'admin', 'Full system access', '["users:*","master:*","documents:*","settings:*"]'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Team Lead', 'lead', 'Department-level access', '["countries:read","dashboard:read","documents:*","master:read","external-users:read"]'),
    ('550e8400-e29b-41d4-a716-446655440003', 'User', 'user', 'Self-service access', '["users:self","documents:own"]')
ON CONFLICT (slug) DO NOTHING;

-- Departments
INSERT INTO departments (id, name, code, description) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Engineering', 'ENG', 'Software Engineering Department'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Human Resources', 'HR', 'HR Department'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Finance', 'FIN', 'Finance Department'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Marketing', 'MKT', 'Marketing Department'),
    ('660e8400-e29b-41d4-a716-446655440005', 'Operations', 'OPS', 'Operations Department')
ON CONFLICT (code) DO NOTHING;

-- Designations
INSERT INTO designations (id, name, code, department_id, level) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Software Engineer', 'SWE', '660e8400-e29b-41d4-a716-446655440001', 2),
    ('770e8400-e29b-41d4-a716-446655440002', 'Senior Software Engineer', 'SSWE', '660e8400-e29b-41d4-a716-446655440001', 3),
    ('770e8400-e29b-41d4-a716-446655440003', 'Engineering Manager', 'ENG_MGR', '660e8400-e29b-41d4-a716-446655440001', 5),
    ('770e8400-e29b-41d4-a716-446655440004', 'HR Executive', 'HR_EXEC', '660e8400-e29b-41d4-a716-446655440002', 2),
    ('770e8400-e29b-41d4-a716-446655440005', 'HR Manager', 'HR_MGR', '660e8400-e29b-41d4-a716-446655440002', 4),
    ('770e8400-e29b-41d4-a716-446655440006', 'System Administrator', 'SYS_ADMIN', '660e8400-e29b-41d4-a716-446655440005', 5)
ON CONFLICT (code) DO NOTHING;

-- Company / Utilities
INSERT INTO company_or_utilities (id, name, code, type, description) VALUES
    ('990e8400-e29b-41d4-a716-446655440001', 'Default Company', 'DEFAULT', 'company', 'Default company/utility for seeded users')
ON CONFLICT (code) DO NOTHING;

-- Module menus
INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions) VALUES
    ('990e8400-e29b-41d4-a716-446655440101', 'Dashboard', 'dashboard', '/dashboard', 'LayoutDashboard', NULL, 10, '["dashboard:read"]'),
    ('990e8400-e29b-41d4-a716-446655440102', 'Master Data', 'master-data', '#', 'Database', NULL, 20, '["master:read"]'),
    ('990e8400-e29b-41d4-a716-446655440111', 'Country', 'countries', '/master/countries', 'Globe', '990e8400-e29b-41d4-a716-446655440102', 10, '["countries:read","countries:create","countries:update","countries:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440112', 'State', 'states', '/master/states', 'Map', '990e8400-e29b-41d4-a716-446655440102', 20, '["states:read","states:create","states:update","states:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440113', 'City', 'cities', '/master/cities', 'Building2', '990e8400-e29b-41d4-a716-446655440102', 30, '["cities:read","cities:create","cities:update","cities:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440114', 'Categories', 'categories', '/master/categories', 'Tag', '990e8400-e29b-41d4-a716-446655440102', 40, '["categories:read","categories:create","categories:update","categories:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440115', 'Tags', 'tags', '/master/tags', 'Hash', '990e8400-e29b-41d4-a716-446655440102', 50, '["tags:read","tags:create","tags:update","tags:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440116', 'Document Types', 'document-types', '/master/document-types', 'FileText', '990e8400-e29b-41d4-a716-446655440102', 60, '["document-types:read","document-types:create","document-types:update","document-types:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440117', 'Service Types', 'service-types', '/master/service-types', 'Layers', '990e8400-e29b-41d4-a716-446655440102', 70, '["service-types:read","service-types:create","service-types:update","service-types:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440118', 'Settings', 'settings', '/master/settings', 'Settings', '990e8400-e29b-41d4-a716-446655440102', 80, '["settings:read","settings:create","settings:update","settings:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440103', 'User Management', 'user-management', '#', 'ShieldCheck', NULL, 30, '["user-management:read"]'),
    ('990e8400-e29b-41d4-a716-446655440121', 'Roles', 'roles', '/user-management/roles', 'ShieldCheck', '990e8400-e29b-41d4-a716-446655440103', 10, '["roles:read","roles:create","roles:update","roles:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440122', 'Company', 'companies', '/user-management/companies', 'Building2', '990e8400-e29b-41d4-a716-446655440103', 20, '["companies:read","companies:create","companies:update","companies:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440123', 'Departments', 'departments', '/user-management/departments', 'FolderTree', '990e8400-e29b-41d4-a716-446655440103', 30, '["departments:read","departments:create","departments:update","departments:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440124', 'Designations', 'designations', '/user-management/designations', 'BadgeCheck', '990e8400-e29b-41d4-a716-446655440103', 40, '["designations:read","designations:create","designations:update","designations:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440125', 'Modules', 'modules', '/user-management/modules', 'MenuSquare', '990e8400-e29b-41d4-a716-446655440103', 50, '["modules:read","modules:create","modules:update","modules:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440126', 'External Users', 'external-users', '/users/external', 'Users', '990e8400-e29b-41d4-a716-446655440103', 60, '["external-users:read","external-users:create","external-users:update","external-users:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440127', 'Internal Users', 'internal-users', '/users/internal', 'UserCheck', '990e8400-e29b-41d4-a716-446655440103', 70, '["internal-users:read","internal-users:create","internal-users:update","internal-users:delete"]'),
    ('990e8400-e29b-41d4-a716-446655440128', 'Admin Users', 'admin-users', '/users/admin', 'UserCog', '990e8400-e29b-41d4-a716-446655440103', 80, '["admin-users:read","admin-users:create","admin-users:update","admin-users:delete"]')
ON CONFLICT (code) DO NOTHING;

-- Admin user (password: Admin@1234)
INSERT INTO users (
    id, username, email, password, first_name, last_name,
    role_id, company_id, department_id, designation_id, user_category, status, is_email_verified
) VALUES (
    '880e8400-e29b-41d4-a716-446655440001',
    'admin', 'admin@ump-platform.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Uhr5k5ZWEaFt3bE.S',  -- Admin@1234
    'System', 'Administrator',
    '550e8400-e29b-41d4-a716-446655440001',
    '990e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440005',
    '770e8400-e29b-41d4-a716-446655440006',
    'admin',
    'active', TRUE
) ON CONFLICT (email) DO NOTHING;

-- ─── Connect to ump_master ─────────────────────────────────────────────────────
\c ump_master;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) NOT NULL UNIQUE,
    dial_code VARCHAR(10),
    flag VARCHAR(10),
    currency VARCHAR(10),
    currency_symbol VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    country_id UUID NOT NULL REFERENCES countries(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    state_id UUID NOT NULL REFERENCES states(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_type VARCHAR(50) DEFAULT 'admin category' NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    allowed_mime_types JSONB DEFAULT '[]',
    max_size_mb INTEGER DEFAULT 10,
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(200) NOT NULL UNIQUE,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    route_link VARCHAR(500),
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE service_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS route_link VARCHAR(500);
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
UPDATE service_types SET is_active = TRUE WHERE is_active IS NULL;

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed countries
INSERT INTO countries (name, code, dial_code, flag, currency, currency_symbol) VALUES
    ('United States', 'US', '+1', '🇺🇸', 'USD', '$'),
    ('United Kingdom', 'GB', '+44', '🇬🇧', 'GBP', '£'),
    ('India', 'IN', '+91', '🇮🇳', 'INR', '₹'),
    ('Canada', 'CA', '+1', '🇨🇦', 'CAD', 'CA$'),
    ('Australia', 'AU', '+61', '🇦🇺', 'AUD', 'A$'),
    ('Germany', 'DE', '+49', '🇩🇪', 'EUR', '€'),
    ('France', 'FR', '+33', '🇫🇷', 'EUR', '€'),
    ('Japan', 'JP', '+81', '🇯🇵', 'JPY', '¥'),
    ('Singapore', 'SG', '+65', '🇸🇬', 'SGD', 'S$'),
    ('UAE', 'AE', '+971', '🇦🇪', 'AED', 'د.إ')
ON CONFLICT (code) DO NOTHING;

-- Seed document types
INSERT INTO document_types (name, code, allowed_mime_types, max_size_mb) VALUES
    ('Identity Document', 'ID_DOC', '["image/jpeg","image/png","application/pdf"]', 5),
    ('Profile Photo', 'PROFILE_PHOTO', '["image/jpeg","image/png","image/webp"]', 2),
    ('Contract', 'CONTRACT', '["application/pdf","application/msword"]', 20),
    ('Invoice', 'INVOICE', '["application/pdf","image/jpeg"]', 10),
    ('Report', 'REPORT', '["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 50)
ON CONFLICT (code) DO NOTHING;

-- Seed service types
INSERT INTO service_types (name, code, description, route_link, icon) VALUES
    ('Employee Services', 'EMPLOYEE_SERVICES', 'Employee onboarding and profile management services', '/services/employees', 'users'),
    ('Document Services', 'DOCUMENT_SERVICES', 'Document upload, review, and approval services', '/services/documents', 'file-text'),
    ('Master Data Services', 'MASTER_DATA_SERVICES', 'Reference data and platform configuration services', '/services/master-data', 'layers')
ON CONFLICT (code) DO NOTHING;

-- Seed admin categories used by configurable settings
INSERT INTO categories (name, code, category_type, description, icon, sort_order, is_active) VALUES
    ('General', 'general', 'admin category', 'General application settings', 'settings', 10, TRUE),
    ('External URL', 'external-url', 'admin category', 'External integration URL settings', 'globe', 20, TRUE),
    ('Stub URL', 'stub-url', 'admin category', 'Stub integration URL settings', 'globe', 30, TRUE),
    ('UI', 'ui', 'admin category', 'User interface settings', 'settings', 40, TRUE),
    ('UI Theme', 'ui-theme', 'admin category', 'Theme and color settings', 'palette', 50, TRUE),
    ('Security', 'security', 'admin category', 'Security settings', 'shield', 60, TRUE),
    ('Email', 'email', 'admin category', 'Email settings', 'mail', 70, TRUE),
    ('Storage', 'storage', 'admin category', 'Storage settings', 'database', 80, TRUE),
    ('Integration', 'integration', 'admin category', 'Integration settings', 'layers', 90, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed system settings
INSERT INTO system_settings (key, value, type, description, is_public, category) VALUES
    ('app.name', 'User Management Platform', 'string', 'Application name', TRUE, 'general'),
    ('app.version', '1.0.0', 'string', 'Application version', TRUE, 'general'),
    ('auth.max_login_attempts', '5', 'integer', 'Max failed login attempts before lockout', FALSE, 'security'),
    ('auth.lock_duration_minutes', '30', 'integer', 'Account lock duration in minutes', FALSE, 'security'),
    ('email.from', 'noreply@ump-platform.com', 'string', 'Default sender email', FALSE, 'email'),
    ('storage.provider', 'local', 'string', 'Default storage provider', FALSE, 'storage'),
    ('ui.grid.rowsPerPage', '20', 'integer', 'Rows shown per page in all frontend grids and tables', TRUE, 'ui'),
    ('ui.theme.background', '#F2F5F4', 'color', 'Application page background color', TRUE, 'ui-theme'),
    ('ui.theme.foreground', '#173531', 'color', 'Application primary text color', TRUE, 'ui-theme'),
    ('ui.theme.card', '#FFFFFF', 'color', 'Card and popover background color', TRUE, 'ui-theme'),
    ('ui.theme.cardForeground', '#173531', 'color', 'Card and popover text color', TRUE, 'ui-theme'),
    ('ui.theme.primary', '#0F7E6D', 'color', 'Primary action color', TRUE, 'ui-theme'),
    ('ui.theme.primaryForeground', '#FFFFFF', 'color', 'Primary action text color', TRUE, 'ui-theme'),
    ('ui.theme.border', '#C2D5D2', 'color', 'Border and input color', TRUE, 'ui-theme'),
    ('ui.theme.sidebar.background', '#1A2322', 'color', 'Left menu background color', TRUE, 'ui-theme'),
    ('ui.theme.sidebar.foreground', '#E3E8E8', 'color', 'Left menu text color', TRUE, 'ui-theme'),
    ('ui.theme.sidebar.active', '#0E7968', 'color', 'Left menu active item color', TRUE, 'ui-theme'),
    ('ui.theme.sidebar.activeForeground', '#FFFFFF', 'color', 'Left menu active item text color', TRUE, 'ui-theme'),
    ('ui.theme.sidebar.accent', '#263332', 'color', 'Left menu hover color', TRUE, 'ui-theme'),
    ('ui.theme.sidebar.accentForeground', '#E3E8E8', 'color', 'Left menu hover text color', TRUE, 'ui-theme'),
    ('ui.theme.footer.background', '#FFFFFF', 'color', 'Footer background color', TRUE, 'ui-theme'),
    ('ui.theme.footer.foreground', '#497970', 'color', 'Footer text color', TRUE, 'ui-theme'),
    ('external.apim.devportalUrl', 'https://localhost:9443/devportal', 'url', 'External API manager developer portal URL', TRUE, 'external-url'),
    ('stub.userProfileUrl', 'http://localhost:8083', 'url', 'Stub endpoint for user profile integration', FALSE, 'stub-url')
ON CONFLICT (key) DO NOTHING;

-- Document service database
\c ump_documents;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE storage_provider AS ENUM ('s3', 'cloudinary', 'local');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    key TEXT NOT NULL,
    provider storage_provider NOT NULL,
    public_id VARCHAR(255),
    uploaded_by VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    folder VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB,
    status document_status DEFAULT 'pending' NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS documents_key_idx ON documents(key);
CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS documents_entity_idx ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
CREATE INDEX IF NOT EXISTS documents_provider_idx ON documents(provider);
CREATE INDEX IF NOT EXISTS documents_is_deleted_idx ON documents(is_deleted);
CREATE INDEX IF NOT EXISTS documents_created_by_idx ON documents(created_by);
CREATE INDEX IF NOT EXISTS documents_updated_by_idx ON documents(updated_by);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at);
