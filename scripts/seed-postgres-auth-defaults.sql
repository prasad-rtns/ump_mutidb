INSERT INTO roles (id, name, slug, description, permissions) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Administrator', 'admin', 'Full system access', '["users:*","external-users:*","internal-users:*","admin-users:*","roles:*","companies:*","departments:*","designations:*","modules:*","master:*","documents:*","settings:*"]'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Team Lead', 'lead', 'Department-level access', '["countries:read","dashboard:read","documents:*","master:read","external-users:read"]')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

UPDATE roles
SET permissions = '["dashboard:read"]', updated_at = NOW()
WHERE slug = 'user' AND jsonb_typeof(permissions) <> 'array';

INSERT INTO company_or_utilities (id, name, code, type, description)
VALUES ('990e8400-e29b-41d4-a716-446655440001', 'Default Company', 'DEFAULT', 'company', 'Default company/utility for seeded users')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO departments (id, name, code, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Engineering', 'ENG', 'Engineering Department'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Human Resources', 'HR', 'Human Resources Department'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Finance', 'FIN', 'Finance Department'),
  ('660e8400-e29b-41d4-a716-446655440004', 'IT', 'IT', 'Information Technology Department'),
  ('660e8400-e29b-41d4-a716-446655440005', 'Operations', 'OPS', 'Operations Department')
ON CONFLICT (code) DO NOTHING;

INSERT INTO designations (id, name, code, department_id, level)
SELECT '770e8400-e29b-41d4-a716-446655440001', 'Software Engineer', 'SWE', id, 2 FROM departments WHERE code = 'ENG'
ON CONFLICT (code) DO NOTHING;
INSERT INTO designations (id, name, code, department_id, level)
SELECT '770e8400-e29b-41d4-a716-446655440002', 'Senior Software Engineer', 'SSWE', id, 3 FROM departments WHERE code = 'ENG'
ON CONFLICT (code) DO NOTHING;
INSERT INTO designations (id, name, code, department_id, level)
SELECT '770e8400-e29b-41d4-a716-446655440003', 'Engineering Manager', 'ENG_MGR', id, 5 FROM departments WHERE code = 'ENG'
ON CONFLICT (code) DO NOTHING;
INSERT INTO designations (id, name, code, department_id, level)
SELECT '770e8400-e29b-41d4-a716-446655440004', 'HR Executive', 'HR_EXEC', id, 2 FROM departments WHERE code = 'HR'
ON CONFLICT (code) DO NOTHING;
INSERT INTO designations (id, name, code, department_id, level)
SELECT '770e8400-e29b-41d4-a716-446655440005', 'HR Manager', 'HR_MGR', id, 4 FROM departments WHERE code = 'HR'
ON CONFLICT (code) DO NOTHING;
INSERT INTO designations (id, name, code, department_id, level)
SELECT '770e8400-e29b-41d4-a716-446655440006', 'System Administrator', 'SYS_ADMIN', id, 5 FROM departments WHERE code = 'OPS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (
  id, username, email, password, first_name, last_name,
  role_id, company_id, department_id, designation_id, user_category, status, is_email_verified
)
SELECT
  '880e8400-e29b-41d4-a716-446655440001',
  'admin', 'admin@ump-platform.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Uhr5k5ZWEaFt3bE.S',
  'System', 'Administrator',
  '550e8400-e29b-41d4-a716-446655440001',
  '990e8400-e29b-41d4-a716-446655440001',
  d.id,
  g.id,
  'admin',
  'active', TRUE
FROM departments d
JOIN designations g ON g.code = 'SYS_ADMIN'
WHERE d.code = 'OPS'
ON CONFLICT (email) DO NOTHING;

UPDATE users
SET role_id = (SELECT id FROM roles WHERE slug = 'admin'),
    user_category = 'admin',
    updated_at = NOW()
WHERE email = 'john@example.com';
