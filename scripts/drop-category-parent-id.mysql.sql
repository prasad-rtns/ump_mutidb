SET @drop_category_parent_index = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'categories'
              AND index_name = 'idx_categories_parent_id'
        ),
        'ALTER TABLE categories DROP INDEX idx_categories_parent_id',
        'SELECT 1'
    )
);
PREPARE stmt FROM @drop_category_parent_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_category_parent_column = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'categories'
              AND column_name = 'parent_id'
        ),
        'ALTER TABLE categories DROP COLUMN parent_id',
        'SELECT 1'
    )
);
PREPARE stmt FROM @drop_category_parent_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
