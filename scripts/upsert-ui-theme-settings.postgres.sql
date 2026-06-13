INSERT INTO system_settings (key, value, type, description, is_public, category) VALUES
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
    ('ui.theme.footer.foreground', '#497970', 'color', 'Footer text color', TRUE, 'ui-theme')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    category = EXCLUDED.category,
    updated_at = NOW();
