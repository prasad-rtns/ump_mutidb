-- Create databases
CREATE DATABASE IF NOT EXISTS ump_auth;
CREATE DATABASE IF NOT EXISTS ump_master;
CREATE DATABASE IF NOT EXISTS ump_documents;

GRANT ALL PRIVILEGES ON ump_auth.* TO 'ump_user'@'%';
GRANT ALL PRIVILEGES ON ump_master.* TO 'ump_user'@'%';
GRANT ALL PRIVILEGES ON ump_documents.* TO 'ump_user'@'%';
FLUSH PRIVILEGES;

USE ump_auth;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON DEFAULT ('[]'),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS company_or_utilities (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('company','utility') DEFAULT 'company' NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_id CHAR(36),
    manager_id CHAR(36),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Designations
CREATE TABLE IF NOT EXISTS designations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id CHAR(36) NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role_id CHAR(36) NOT NULL,
    company_id CHAR(36),
    department_id CHAR(36) NOT NULL,
    designation_id CHAR(36) NOT NULL,
    user_category ENUM('external','internal','admin') DEFAULT 'internal' NOT NULL,
    status ENUM('active','inactive','suspended') DEFAULT 'active' NOT NULL,
    is_email_verified TINYINT(1) DEFAULT 0 NOT NULL,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    failed_login_attempts INT DEFAULT 0 NOT NULL,
    lock_until DATETIME,
    two_factor_secret VARCHAR(255),
    two_factor_enabled TINYINT(1) DEFAULT 0 NOT NULL,
    last_login_at DATETIME,
    last_login_ip VARCHAR(45),
    created_by CHAR(36),
    updated_by CHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
    INDEX idx_company_id (company_id),
    INDEX idx_dept_id (department_id),
    INDEX idx_user_category (user_category),
    INDEX idx_status (status),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (company_id) REFERENCES company_or_utilities(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (designation_id) REFERENCES designations(id)
);

CREATE TABLE IF NOT EXISTS module_menus (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    route VARCHAR(300) NOT NULL,
    icon VARCHAR(100),
    parent_id CHAR(36),
    module_type ENUM('admin','internal','external') DEFAULT 'admin' NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    permissions JSON DEFAULT ('[]'),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_module_parent_id (parent_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    refresh_token TEXT NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked TINYINT(1) DEFAULT 0 NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id CHAR(36) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_entity (entity, entity_id),
    INDEX idx_audit_created_at (created_at)
);

-- Seed roles
INSERT IGNORE INTO roles (id, name, slug, description, permissions) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Administrator', 'admin', 'Full system access', '["users:*","master:*","documents:*","settings:*"]'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Team Lead', 'lead', 'Department-level access', '["countries:read","dashboard:read","documents:*","master:read","external-users:read"]'),
    ('550e8400-e29b-41d4-a716-446655440003', 'User', 'user', 'Self-service access', '["users:self","documents:own"]');

INSERT INTO company_or_utilities (id, name, code, type, description) VALUES
    ('990e8400-e29b-41d4-a716-446655440001', 'Default Company', 'DEFAULT', 'company', 'Default company/utility for seeded users')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    type = VALUES(type),
    description = VALUES(description),
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO module_menus (id, name, code, route, icon, parent_id, module_type, sort_order, permissions, is_active) VALUES
    ('990e8400-e29b-41d4-a716-446655440101', 'Dashboard', 'dashboard', '/dashboard', 'LayoutDashboard', NULL, 'admin', 10, '["dashboard:read"]', 1),
    ('990e8400-e29b-41d4-a716-446655440102', 'Master Data', 'master-data', '#', 'Database', NULL, 'admin', 20, '["master:read"]', 1),
    ('990e8400-e29b-41d4-a716-446655440111', 'Country', 'countries', '/master/countries', 'Globe', '990e8400-e29b-41d4-a716-446655440102', 'admin', 10, '["countries:read","countries:create","countries:update","countries:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440112', 'State', 'states', '/master/states', 'Map', '990e8400-e29b-41d4-a716-446655440102', 'admin', 20, '["states:read","states:create","states:update","states:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440113', 'City', 'cities', '/master/cities', 'Building2', '990e8400-e29b-41d4-a716-446655440102', 'admin', 30, '["cities:read","cities:create","cities:update","cities:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440114', 'Categories', 'categories', '/master/categories', 'Tag', '990e8400-e29b-41d4-a716-446655440102', 'admin', 40, '["categories:read","categories:create","categories:update","categories:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440115', 'Tags', 'tags', '/master/tags', 'Hash', '990e8400-e29b-41d4-a716-446655440102', 'admin', 50, '["tags:read","tags:create","tags:update","tags:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440116', 'Document Types', 'document-types', '/master/document-types', 'FileText', '990e8400-e29b-41d4-a716-446655440102', 'admin', 60, '["document-types:read","document-types:create","document-types:update","document-types:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440117', 'Service Types', 'service-types', '/master/service-types', 'Layers', '990e8400-e29b-41d4-a716-446655440102', 'admin', 70, '["service-types:read","service-types:create","service-types:update","service-types:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440118', 'Settings', 'settings', '/master/settings', 'Settings', '990e8400-e29b-41d4-a716-446655440102', 'admin', 80, '["settings:read","settings:create","settings:update","settings:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440103', 'User Management', 'user-management', '#', 'ShieldCheck', NULL, 'admin', 30, '["user-management:read"]', 1),
    ('990e8400-e29b-41d4-a716-446655440121', 'Roles', 'roles', '/user-management/roles', 'ShieldCheck', '990e8400-e29b-41d4-a716-446655440103', 'admin', 10, '["roles:read","roles:create","roles:update","roles:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440122', 'Company', 'companies', '/user-management/companies', 'Building2', '990e8400-e29b-41d4-a716-446655440103', 'admin', 20, '["companies:read","companies:create","companies:update","companies:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440123', 'Departments', 'departments', '/user-management/departments', 'FolderTree', '990e8400-e29b-41d4-a716-446655440103', 'admin', 30, '["departments:read","departments:create","departments:update","departments:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440124', 'Designations', 'designations', '/user-management/designations', 'BadgeCheck', '990e8400-e29b-41d4-a716-446655440103', 'admin', 40, '["designations:read","designations:create","designations:update","designations:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440125', 'Modules', 'modules', '/user-management/modules', 'MenuSquare', '990e8400-e29b-41d4-a716-446655440103', 'admin', 50, '["modules:read","modules:create","modules:update","modules:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440126', 'External Users', 'external-users', '/users/external', 'Users', '990e8400-e29b-41d4-a716-446655440103', 'admin', 60, '["external-users:read","external-users:create","external-users:update","external-users:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440127', 'Internal Users', 'internal-users', '/users/internal', 'UserCheck', '990e8400-e29b-41d4-a716-446655440103', 'admin', 70, '["internal-users:read","internal-users:create","internal-users:update","internal-users:delete"]', 1),
    ('990e8400-e29b-41d4-a716-446655440128', 'Admin Users', 'admin-users', '/users/admin', 'UserCog', '990e8400-e29b-41d4-a716-446655440103', 'admin', 80, '["admin-users:read","admin-users:create","admin-users:update","admin-users:delete"]', 1)
ON DUPLICATE KEY UPDATE
    id = VALUES(id),
    name = VALUES(name),
    route = VALUES(route),
    icon = VALUES(icon),
    parent_id = VALUES(parent_id),
    module_type = VALUES(module_type),
    sort_order = VALUES(sort_order),
    permissions = VALUES(permissions),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

UPDATE module_menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE code IN ('ServiceType', 'users');

-- Seed departments
INSERT IGNORE INTO departments (id, name, code, description) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Engineering', 'ENG', 'Software Engineering Department'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Human Resources', 'HR', 'HR Department'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Finance', 'FIN', 'Finance Department'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Marketing', 'MKT', 'Marketing Department'),
    ('660e8400-e29b-41d4-a716-446655440005', 'Operations', 'OPS', 'Operations Department');

-- Seed designations
INSERT IGNORE INTO designations (id, name, code, department_id, level) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Software Engineer', 'SWE', '660e8400-e29b-41d4-a716-446655440001', 2),
    ('770e8400-e29b-41d4-a716-446655440002', 'Senior Software Engineer', 'SSWE', '660e8400-e29b-41d4-a716-446655440001', 3),
    ('770e8400-e29b-41d4-a716-446655440003', 'Engineering Manager', 'ENG_MGR', '660e8400-e29b-41d4-a716-446655440001', 5),
    ('770e8400-e29b-41d4-a716-446655440004', 'HR Executive', 'HR_EXEC', '660e8400-e29b-41d4-a716-446655440002', 2),
    ('770e8400-e29b-41d4-a716-446655440005', 'HR Manager', 'HR_MGR', '660e8400-e29b-41d4-a716-446655440002', 4),
    ('770e8400-e29b-41d4-a716-446655440006', 'System Administrator', 'SYS_ADMIN', '660e8400-e29b-41d4-a716-446655440005', 5);

-- Admin user (password: Admin@1234)
INSERT IGNORE INTO users (
    id, username, email, password, first_name, last_name,
    role_id, company_id, department_id, designation_id, user_category, status, is_email_verified
) VALUES (
    '880e8400-e29b-41d4-a716-446655440001',
    'admin', 'admin@ump-platform.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Uhr5k5ZWEaFt3bE.S',
    'System', 'Administrator',
    '550e8400-e29b-41d4-a716-446655440001',
    '990e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440005',
    '770e8400-e29b-41d4-a716-446655440006',
    'admin',
    'active', 1
);

USE ump_master;

CREATE TABLE IF NOT EXISTS countries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) NOT NULL UNIQUE,
    dial_code VARCHAR(10),
    flag VARCHAR(10),
    currency VARCHAR(10),
    currency_symbol VARCHAR(10),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS states (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    country_id CHAR(36) NOT NULL,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_states_country_id (country_id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS cities (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    state_id CHAR(36) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_cities_state_id (state_id),
    FOREIGN KEY (state_id) REFERENCES states(id)
);

CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_type VARCHAR(50) DEFAULT 'admin category' NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0 NOT NULL,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS document_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    allowed_mime_types JSON NOT NULL,
    max_size_mb INT DEFAULT 10 NOT NULL,
    is_required TINYINT(1) DEFAULT 0 NOT NULL,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `key` VARCHAR(200) NOT NULL UNIQUE,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string' NOT NULL,
    description TEXT,
    is_public TINYINT(1) DEFAULT 0 NOT NULL,
    category VARCHAR(100) DEFAULT 'general' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    variables JSON DEFAULT ('[]'),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS service_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    route_link VARCHAR(500),
    icon VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Seed countries
INSERT IGNORE INTO countries (name, code, dial_code, flag, currency, currency_symbol) VALUES
    ('United States', 'US', '+1', 'US', 'USD', '$'),
    ('United Kingdom', 'GB', '+44', 'GB', 'GBP', 'GBP'),
    ('India', 'IN', '+91', 'IN', 'INR', 'INR'),
    ('Canada', 'CA', '+1', 'CA', 'CAD', 'CA$'),
    ('Australia', 'AU', '+61', 'AU', 'AUD', 'A$'),
    ('Germany', 'DE', '+49', 'DE', 'EUR', 'EUR'),
    ('France', 'FR', '+33', 'FR', 'EUR', 'EUR'),
    ('Japan', 'JP', '+81', 'JP', 'JPY', 'JPY'),
    ('Singapore', 'SG', '+65', 'SG', 'SGD', 'S$'),
    ('UAE', 'AE', '+971', 'AE', 'AED', 'AED');

-- Seed document types
INSERT IGNORE INTO document_types (name, code, allowed_mime_types, max_size_mb) VALUES
    ('Identity Document', 'ID_DOC', '["image/jpeg","image/png","application/pdf"]', 5),
    ('Profile Photo', 'PROFILE_PHOTO', '["image/jpeg","image/png","image/webp"]', 2),
    ('Contract', 'CONTRACT', '["application/pdf","application/msword"]', 20),
    ('Invoice', 'INVOICE', '["application/pdf","image/jpeg"]', 10),
    ('Report', 'REPORT', '["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 50);

-- Seed service types
INSERT IGNORE INTO service_types (name, code, description, route_link, icon) VALUES
    ('Employee Services', 'EMPLOYEE_SERVICES', 'Employee onboarding and profile management services', '/services/employees', 'users'),
    ('Document Services', 'DOCUMENT_SERVICES', 'Document upload, review, and approval services', '/services/documents', 'file-text'),
    ('Master Data Services', 'MASTER_DATA_SERVICES', 'Reference data and platform configuration services', '/services/master-data', 'layers');

-- Seed admin categories used by configurable settings
INSERT IGNORE INTO categories (name, code, category_type, description, icon, sort_order, is_active) VALUES
    ('General', 'general', 'admin category', 'General application settings', 'settings', 10, 1),
    ('External URL', 'external-url', 'admin category', 'External integration URL settings', 'globe', 20, 1),
    ('Stub URL', 'stub-url', 'admin category', 'Stub integration URL settings', 'globe', 30, 1),
    ('UI', 'ui', 'admin category', 'User interface settings', 'settings', 40, 1),
    ('UI Theme', 'ui-theme', 'admin category', 'Theme and color settings', 'palette', 50, 1),
    ('Security', 'security', 'admin category', 'Security settings', 'shield', 60, 1),
    ('Email', 'email', 'admin category', 'Email settings', 'mail', 70, 1),
    ('Storage', 'storage', 'admin category', 'Storage settings', 'database', 80, 1),
    ('Integration', 'integration', 'admin category', 'Integration settings', 'layers', 90, 1);

-- Seed system settings
INSERT IGNORE INTO system_settings (`key`, value, type, description, is_public, category) VALUES
    ('app.name', 'User Management Platform', 'string', 'Application name', 1, 'general'),
    ('app.version', '1.0.0', 'string', 'Application version', 1, 'general'),
    ('auth.max_login_attempts', '5', 'number', 'Max failed login attempts before lockout', 0, 'security'),
    ('auth.lock_duration_minutes', '30', 'number', 'Account lock duration in minutes', 0, 'security'),
    ('email.from', 'noreply@ump-platform.com', 'string', 'Default sender email', 0, 'email'),
    ('storage.provider', 'local', 'string', 'Default storage provider', 0, 'storage'),
    ('ui.grid.rowsPerPage', '20', 'integer', 'Rows shown per page in all frontend grids and tables', 1, 'ui'),
    ('ui.theme.background', '#F2F5F4', 'color', 'Application page background color', 1, 'ui-theme'),
    ('ui.theme.foreground', '#173531', 'color', 'Application primary text color', 1, 'ui-theme'),
    ('ui.theme.card', '#FFFFFF', 'color', 'Card and popover background color', 1, 'ui-theme'),
    ('ui.theme.cardForeground', '#173531', 'color', 'Card and popover text color', 1, 'ui-theme'),
    ('ui.theme.primary', '#0F7E6D', 'color', 'Primary action color', 1, 'ui-theme'),
    ('ui.theme.primaryForeground', '#FFFFFF', 'color', 'Primary action text color', 1, 'ui-theme'),
    ('ui.theme.border', '#C2D5D2', 'color', 'Border and input color', 1, 'ui-theme'),
    ('ui.theme.sidebar.background', '#1A2322', 'color', 'Left menu background color', 1, 'ui-theme'),
    ('ui.theme.sidebar.foreground', '#E3E8E8', 'color', 'Left menu text color', 1, 'ui-theme'),
    ('ui.theme.sidebar.active', '#0E7968', 'color', 'Left menu active item color', 1, 'ui-theme'),
    ('ui.theme.sidebar.activeForeground', '#FFFFFF', 'color', 'Left menu active item text color', 1, 'ui-theme'),
    ('ui.theme.sidebar.accent', '#263332', 'color', 'Left menu hover color', 1, 'ui-theme'),
    ('ui.theme.sidebar.accentForeground', '#E3E8E8', 'color', 'Left menu hover text color', 1, 'ui-theme'),
    ('ui.theme.footer.background', '#FFFFFF', 'color', 'Footer background color', 1, 'ui-theme'),
    ('ui.theme.footer.foreground', '#497970', 'color', 'Footer text color', 1, 'ui-theme'),
    ('external.apim.devportalUrl', 'https://localhost:9443/devportal', 'url', 'External API manager developer portal URL', 1, 'external-url'),
    ('stub.userProfileUrl', 'http://localhost:8083', 'url', 'Stub endpoint for user profile integration', 0, 'stub-url');

USE ump_documents;

CREATE TABLE IF NOT EXISTS documents (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    url TEXT NOT NULL,
    `key` VARCHAR(512) NOT NULL,
    provider ENUM('s3', 'cloudinary', 'local') NOT NULL,
    public_id VARCHAR(255),
    uploaded_by VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    folder VARCHAR(255),
    tags JSON DEFAULT ('[]'),
    metadata JSON,
    status ENUM('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending' NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0 NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY documents_key_idx (`key`),
    KEY documents_uploaded_by_idx (uploaded_by),
    KEY documents_entity_idx (entity_type, entity_id),
    KEY documents_status_idx (status),
    KEY documents_provider_idx (provider),
    KEY documents_is_deleted_idx (is_deleted),
    KEY documents_created_by_idx (created_by),
    KEY documents_updated_by_idx (updated_by),
    KEY documents_created_at_idx (created_at)
);
