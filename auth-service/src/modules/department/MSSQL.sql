CREATE PROCEDURE sp_GetAllDepartments
AS
BEGIN
    SELECT * FROM departments;
END
GO

CREATE PROCEDURE sp_CreateDepartment
    @id UNIQUEIDENTIFIER,
    @name NVARCHAR(200),
    @code NVARCHAR(50),
    @description NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO departments (id, name, code, description, isActive, createdAt, updatedAt)
    VALUES (@id, @name, @code, @description, 1, GETDATE(), GETDATE());

    SELECT * FROM departments WHERE id = @id;
END
GO
#------------------------
CREATE PROCEDURE sp_UpdateDepartment
    @id UNIQUEIDENTIFIER,
    @name NVARCHAR(200) = NULL,
    @code NVARCHAR(50) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @isActive BIT = NULL
AS
BEGIN
    UPDATE departments
    SET
        name = COALESCE(@name, name),
        code = COALESCE(@code, code),
        description = COALESCE(@description, description),
        isActive = COALESCE(@isActive, isActive),
        updatedAt = GETDATE()
    WHERE id = @id;

    SELECT * FROM departments WHERE id = @id;
END
GO