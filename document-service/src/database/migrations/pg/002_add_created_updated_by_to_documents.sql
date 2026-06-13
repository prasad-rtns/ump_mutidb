ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS documents_created_by_idx ON documents(created_by);
CREATE INDEX IF NOT EXISTS documents_updated_by_idx ON documents(updated_by);

UPDATE documents
SET created_by = COALESCE(created_by, uploaded_by),
    updated_by = COALESCE(updated_by, uploaded_by)
WHERE created_by IS NULL
   OR updated_by IS NULL;
