-- ─── Create databases ─────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS ump_auth;
CREATE DATABASE IF NOT EXISTS ump_master;

GRANT ALL PRIVILEGES ON ump_auth.* TO 'ump_user'@'%';
GRANT ALL PRIVILEGES ON ump_master.* TO 'ump_user'@'%';
FLUSH PRIVILEGES;

USE ump_auth;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    slug ENUM('admin','lead','user') NOT NULL UNIQUE,
    description TEXT,
    permissions JSON DEFAULT ('[]'),
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_id CHAR(36),
    manager_id CHAR(36),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Designations
CREATE TABLE IF NOT EXISTS designations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id CHAR(36) NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role_id CHAR(36) NOT NULL,
    department_id CHAR(36) NOT NULL,
    designation_id CHAR(36) NOT NULL,
    status ENUM('active','inactive','suspended') DEFAULT 'active' NOT NULL,
    is_email_verified TINYINT(1) DEFAULT 0 NOT NULL,
    failed_login_attempts INT DEFAULT 0 NOT NULL,
    two_factor_enabled TINYINT(1) DEFAULT 0 NOT NULL,
    last_login_at DATETIME,
    last_login_ip VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
    INDEX idx_dept_id (department_id),
    INDEX idx_status (status),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (designation_id) REFERENCES designations(id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    refresh_token TEXT NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked TINYINT(1) DEFAULT 0 NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed roles
INSERT IGNORE INTO roles (id, name, slug, description, permissions) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Administrator', 'admin', 'Full system access', '["users:*","master:*","documents:*"]'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Team Lead', 'lead', 'Department-level access', '["users:read","documents:*"]'),
    ('550e8400-e29b-41d4-a716-446655440003', 'User', 'user', 'Self-service access', '["users:self"]');

-- Seed departments
INSERT IGNORE INTO departments (id, name, code, description) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Engineering', 'ENG', 'Software Engineering'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Human Resources', 'HR', 'HR Department'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Finance', 'FIN', 'Finance Department'),
    ('660e8400-e29b-41d4-a716-446655440005', 'Operations', 'OPS', 'Operations');

-- Seed designations
INSERT IGNORE INTO designations (id, name, code, department_id, level) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Software Engineer', 'SWE', '660e8400-e29b-41d4-a716-446655440001', 2),
    ('770e8400-e29b-41d4-a716-446655440006', 'System Administrator', 'SYS_ADMIN', '660e8400-e29b-41d4-a716-446655440005', 5);
