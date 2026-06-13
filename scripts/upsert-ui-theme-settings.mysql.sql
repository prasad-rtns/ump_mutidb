INSERT INTO system_settings (`key`, value, type, description, is_public, category) VALUES
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
    ('ui.theme.footer.foreground', '#497970', 'color', 'Footer text color', 1, 'ui-theme')
ON DUPLICATE KEY UPDATE
    value = VALUES(value),
    type = VALUES(type),
    description = VALUES(description),
    is_public = VALUES(is_public),
    category = VALUES(category),
    updated_at = CURRENT_TIMESTAMP;
