-- Migration: Update Users table for RBAC implementation
-- Run this migration BEFORE restarting the server
-- This will update the users table with new role enum and additional fields

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSON DEFAULT NULL COMMENT 'Custom user permissions';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INT DEFAULT NULL COMMENT 'User who created this account';

-- Step 2: Update role enum to include new roles
-- First, check what roles exist in your data
SELECT DISTINCT role FROM users;

-- Temporarily allow all text for role column
ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'sales_agent';

-- Update existing roles to new naming convention (if needed)
-- Map old roles to new roles
UPDATE users SET role = 'admin' WHERE role = 'admin';
UPDATE users SET role = 'manager' WHERE role = 'manager';
UPDATE users SET role = 'sales_agent' WHERE role = 'user'; -- Convert 'user' to 'sales_agent'

-- Step 3: Apply the new enum constraint
ALTER TABLE users MODIFY COLUMN role ENUM(
  'super_admin',
  'admin', 
  'manager',
  'sales_agent',
  'support',
  'read_only'
) NOT NULL DEFAULT 'sales_agent';

-- Step 4: Add foreign key for created_by
ALTER TABLE users 
ADD CONSTRAINT fk_user_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 5: Create an index on created_by for performance
CREATE INDEX idx_users_created_by ON users(created_by);

-- Step 6: Verify the changes
DESCRIBE users;
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  role, 
  created_by,
  is_active,
  created_at 
FROM users;

-- Optional: Create a super admin user if you don't have one
-- UNCOMMENT AND MODIFY THE FOLLOWING LINES TO CREATE YOUR SUPER ADMIN
-- Make sure to replace the values with your actual organization_id and desired credentials

/*
-- Get your organization_id first
SELECT id, name FROM organizations;

-- Then create super admin (replace values as needed)
INSERT INTO users (
  email,
  password_hash, -- This is bcrypt hashed password for 'admin123'
  first_name,
  last_name,
  role,
  organization_id,
  is_active
) VALUES (
  'admin@example.com',
  '$2a$10$rqQ9Y0UZj5J4vN6vZYv5YOZJxT0X0x0x0x0x0x0x0x0x0x0x0x0x0', -- CHANGE THIS
  'Super',
  'Admin',
  'super_admin',
  1, -- CHANGE THIS to your organization_id
  1
);
*/

-- Verification queries
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) as total_users, role, is_active FROM users GROUP BY role, is_active;
