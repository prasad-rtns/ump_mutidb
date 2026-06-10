CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_category AS ENUM ('external', 'internal', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE company_utility_type AS ENUM ('company', 'utility');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE module_type AS ENUM ('admin', 'internal', 'external');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE roles
  ALTER COLUMN slug TYPE VARCHAR(100) USING slug::TEXT;

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

CREATE UNIQUE INDEX IF NOT EXISTS company_or_utilities_code_idx
  ON company_or_utilities (code);

INSERT INTO company_or_utilities (id, name, code, type, description, is_active)
VALUES ('990e8400-e29b-41d4-a716-446655440001', 'Default Company', 'DEFAULT', 'company', 'Default company for seeded users', TRUE)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS user_category user_category DEFAULT 'internal' NOT NULL;

UPDATE users
SET company_id = '990e8400-e29b-41d4-a716-446655440001'
WHERE company_id IS NULL;

DO $$ BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_company_id_company_or_utilities_id_fk
    FOREIGN KEY (company_id) REFERENCES company_or_utilities(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS users_company_idx ON users (company_id);

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

CREATE UNIQUE INDEX IF NOT EXISTS module_menus_code_idx ON module_menus (code);
CREATE INDEX IF NOT EXISTS module_menus_parent_idx ON module_menus (parent_id);
