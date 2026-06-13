ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'admin category' NOT NULL;

UPDATE categories
SET category_type = 'admin category'
WHERE category_type IS NULL;

INSERT INTO categories (name, code, category_type, description, icon, sort_order, is_active) VALUES
    ('General', 'general', 'admin category', 'General application settings', 'settings', 10, 1),
    ('External URL', 'external-url', 'admin category', 'External integration URL settings', 'globe', 20, 1),
    ('Stub URL', 'stub-url', 'admin category', 'Stub integration URL settings', 'globe', 30, 1),
    ('UI', 'ui', 'admin category', 'User interface settings', 'settings', 40, 1),
    ('UI Theme', 'ui-theme', 'admin category', 'Theme and color settings', 'palette', 50, 1),
    ('Security', 'security', 'admin category', 'Security settings', 'shield', 60, 1),
    ('Email', 'email', 'admin category', 'Email settings', 'mail', 70, 1),
    ('Storage', 'storage', 'admin category', 'Storage settings', 'database', 80, 1),
    ('Integration', 'integration', 'admin category', 'Integration settings', 'layers', 90, 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category_type = VALUES(category_type),
    description = VALUES(description),
    icon = VALUES(icon),
    sort_order = VALUES(sort_order),
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP;
