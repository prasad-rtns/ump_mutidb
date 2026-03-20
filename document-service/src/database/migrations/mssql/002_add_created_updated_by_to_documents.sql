IF COL_LENGTH('dbo.documents', 'created_by') IS NULL
BEGIN
  ALTER TABLE dbo.documents
  ADD created_by NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.documents', 'updated_by') IS NULL
BEGIN
  ALTER TABLE dbo.documents
  ADD updated_by NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_documents_created_by'
    AND object_id = OBJECT_ID(N'dbo.documents')
)
BEGIN
  CREATE INDEX IX_documents_created_by ON dbo.documents(created_by);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_documents_updated_by'
    AND object_id = OBJECT_ID(N'dbo.documents')
)
BEGIN
  CREATE INDEX IX_documents_updated_by ON dbo.documents(updated_by);
END
GO

UPDATE dbo.documents
SET created_by = COALESCE(created_by, uploaded_by),
    updated_by = COALESCE(updated_by, uploaded_by)
WHERE created_by IS NULL
   OR updated_by IS NULL;
GO
