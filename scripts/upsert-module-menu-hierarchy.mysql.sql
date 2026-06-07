USE ump_auth;

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

SET @module_type_column_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'module_menus'
      AND COLUMN_NAME = 'module_type'
);
SET @module_type_sql := IF(
    @module_type_column_exists = 0,
    'ALTER TABLE module_menus ADD COLUMN module_type ENUM(''admin'',''internal'',''external'') DEFAULT ''admin'' NOT NULL AFTER parent_id',
    'SELECT 1'
);
PREPARE module_type_stmt FROM @module_type_sql;
EXECUTE module_type_stmt;
DEALLOCATE PREPARE module_type_stmt;

INSERT INTO company_or_utilities (id, name, code, type, description) VALUES
    ('990e8400-e29b-41d4-a716-446655440001', 'Default Company', 'DEFAULT', 'company', 'Default company/utility for seeded users')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    type = VALUES(type),
    description = VALUES(description),
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP;

UPDATE roles
SET permissions = '["categories:create","categories:delete","categories:read","categories:update","dashboard:read","external-users:create","external-users:read","master:read"]',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'lead';

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

UPDATE users
SET company_id = '990e8400-e29b-41d4-a716-446655440001',
    updated_at = CURRENT_TIMESTAMP
WHERE company_id IS NULL
  AND email IN ('admin@ump-platform.com', 'john@example.com');

UPDATE module_menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE code IN ('ServiceType', 'users');
