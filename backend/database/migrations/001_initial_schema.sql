-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Create sessions table for JWT token management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- Ensure ASSET table exists (based on your existing structure)
CREATE TABLE IF NOT EXISTS ASSET (
    Asset_ID INT AUTO_INCREMENT PRIMARY KEY,
    Serial_Number VARCHAR(100) UNIQUE NOT NULL,
    Asset_ModelName VARCHAR(255) NOT NULL,
    Asset_ModelDesc TEXT,
    Asset_Manufacturer VARCHAR(255),
    Asset_Status ENUM('Available', 'In Use', 'Maintenance', 'Retired', 'Lost', 'Damaged') DEFAULT 'Available',
    Asset_Location VARCHAR(255),
    Asset_Category VARCHAR(100),
    Purchase_Date DATE,
    Purchase_Price DECIMAL(10,2),
    Warranty_Date DATE,
    Assigned_To VARCHAR(255),
    Notes TEXT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_serial (Serial_Number),
    INDEX idx_status (Asset_Status),
    INDEX idx_category (Asset_Category),
    INDEX idx_location (Asset_Location)
);

-- Create projects table (if needed)
CREATE TABLE IF NOT EXISTS projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled') DEFAULT 'Planning',
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES users(user_id),
    INDEX idx_status (status),
    INDEX idx_manager (manager_id)
);

-- Create asset_assignments table for tracking asset assignments
CREATE TABLE IF NOT EXISTS asset_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL,
    assigned_to_user INT,
    assigned_to_project INT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    returned_date TIMESTAMP NULL,
    notes TEXT,
    created_by INT,
    
    FOREIGN KEY (serial_number) REFERENCES ASSET(Serial_Number) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user) REFERENCES users(user_id),
    FOREIGN KEY (assigned_to_project) REFERENCES projects(project_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    
    INDEX idx_serial (serial_number),
    INDEX idx_user (assigned_to_user),
    INDEX idx_project (assigned_to_project),
    INDEX idx_active (returned_date)
);

-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS maintenance_records (
    maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL,
    maintenance_type ENUM('Preventive', 'Corrective', 'Inspection') NOT NULL,
    description TEXT NOT NULL,
    maintenance_date DATE NOT NULL,
    performed_by VARCHAR(255),
    cost DECIMAL(10,2),
    next_maintenance_date DATE,
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (serial_number) REFERENCES ASSET(Serial_Number) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    
    INDEX idx_serial (serial_number),
    INDEX idx_date (maintenance_date),
    INDEX idx_status (status),
    INDEX idx_next_date (next_maintenance_date)
);

-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_table (table_name),
    INDEX idx_created (created_at)
);