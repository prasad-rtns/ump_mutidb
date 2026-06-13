ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'admin category' NOT NULL;

UPDATE categories
SET category_type = 'admin category'
WHERE category_type IS NULL;

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
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category_type = EXCLUDED.category_type,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();
