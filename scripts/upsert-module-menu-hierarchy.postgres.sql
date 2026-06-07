INSERT INTO module_menus (id, name, code, route, icon, parent_id, sort_order, permissions, is_active)
VALUES
  ('990e8400-e29b-41d4-a716-446655440101', 'Dashboard', 'dashboard', '/dashboard', 'LayoutDashboard', NULL, 10, '["dashboard:read"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440102', 'Master Data', 'master-data', '#', 'Database', NULL, 20, '["master:read"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440111', 'Country', 'countries', '/master/countries', 'Globe', '990e8400-e29b-41d4-a716-446655440102', 10, '["countries:read","countries:create","countries:update","countries:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440112', 'State', 'states', '/master/states', 'Map', '990e8400-e29b-41d4-a716-446655440102', 20, '["states:read","states:create","states:update","states:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440113', 'City', 'cities', '/master/cities', 'Building2', '990e8400-e29b-41d4-a716-446655440102', 30, '["cities:read","cities:create","cities:update","cities:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440114', 'Categories', 'categories', '/master/categories', 'Tag', '990e8400-e29b-41d4-a716-446655440102', 40, '["categories:read","categories:create","categories:update","categories:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440115', 'Tags', 'tags', '/master/tags', 'Hash', '990e8400-e29b-41d4-a716-446655440102', 50, '["tags:read","tags:create","tags:update","tags:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440116', 'Document Types', 'document-types', '/master/document-types', 'FileText', '990e8400-e29b-41d4-a716-446655440102', 60, '["document-types:read","document-types:create","document-types:update","document-types:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440117', 'Service Types', 'service-types', '/master/service-types', 'Layers', '990e8400-e29b-41d4-a716-446655440102', 70, '["service-types:read","service-types:create","service-types:update","service-types:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440118', 'Settings', 'settings', '/master/settings', 'Settings', '990e8400-e29b-41d4-a716-446655440102', 80, '["settings:read","settings:create","settings:update","settings:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440103', 'User Management', 'user-management', '#', 'ShieldCheck', NULL, 30, '["users:read"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440121', 'Roles', 'roles', '/user-management/roles', 'ShieldCheck', '990e8400-e29b-41d4-a716-446655440103', 10, '["roles:read","roles:create","roles:update","roles:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440122', 'Company', 'companies', '/user-management/companies', 'Building2', '990e8400-e29b-41d4-a716-446655440103', 20, '["companies:read","companies:create","companies:update","companies:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440123', 'Departments', 'departments', '/user-management/departments', 'FolderTree', '990e8400-e29b-41d4-a716-446655440103', 30, '["departments:read","departments:create","departments:update","departments:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440124', 'Designations', 'designations', '/user-management/designations', 'BadgeCheck', '990e8400-e29b-41d4-a716-446655440103', 40, '["designations:read","designations:create","designations:update","designations:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440125', 'Modules', 'modules', '/user-management/modules', 'MenuSquare', '990e8400-e29b-41d4-a716-446655440103', 50, '["modules:read","modules:create","modules:update","modules:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440126', 'External Users', 'external-users', '/users/external', 'Users', '990e8400-e29b-41d4-a716-446655440103', 60, '["users:read","users:create","users:update","users:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440127', 'Internal Users', 'internal-users', '/users/internal', 'UserCheck', '990e8400-e29b-41d4-a716-446655440103', 70, '["users:read","users:create","users:update","users:delete"]', TRUE),
  ('990e8400-e29b-41d4-a716-446655440128', 'Admin Users', 'admin-users', '/users/admin', 'UserCog', '990e8400-e29b-41d4-a716-446655440103', 80, '["admin-users:read","admin-users:create","admin-users:update","admin-users:delete"]', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  route = EXCLUDED.route,
  icon = EXCLUDED.icon,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE roles
SET permissions = '["countries:read","dashboard:read","documents:*","master:read","users:read"]',
    updated_at = NOW()
WHERE slug = 'lead';
