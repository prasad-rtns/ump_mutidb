INSERT INTO roles (
  id,
  name,
  slug,
  permissions
) VALUES (
  '1',
  'Administrator',
  'admin',
  '{
    "user": ["create","update","delete","read"],
	"department": ["create","update","delete","read"],
	"designation": ["create","update","delete","read"],
    "role": ["manage"]
  }'::jsonb
);

INSERT INTO departments (
  name,
  code,
  parent_id,
  manager_id,
  description,
  is_active
) VALUES
(
  'Head Office',
  'HO',
  NULL,
  NULL,
  'Corporate head office',
  true
),
(
  'Information Technology',
  'IT',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NULL,
  'IT Department',
  true
),
(
  'Human Resources',
  'HR',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NULL,
  'HR Department',
  true
);

INSERT INTO designations (
  name,
  code,
  department_id,
  level,
  description,
  is_active
) VALUES
(
  'Senior Director',
  'SD001',
  'fde02dfd-f10a-46c3-82ac-3ec24c649313',
  3,
  'Handles complex development tasks',
  true
),
(
  'Junior Developer',
  'JD001',
  'b74057dc-d328-408b-b92c-6e13864bdd90',
  1,
  'Entry level developer',
  true
),
(
  'HR Manager',
  'HRM001',
  '33197928-a03b-4e63-b08b-da6de4b093dd',
  2,
  'Manages HR operations',
  true
);