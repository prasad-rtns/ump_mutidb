DROP INDEX IF EXISTS categories_parent_idx;
DROP INDEX IF EXISTS idx_categories_parent_id;

ALTER TABLE categories
    DROP COLUMN IF EXISTS parent_id;
