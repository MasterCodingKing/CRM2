-- Quick Script: Create Super Admin User
-- Run this after the migration to create your first super admin account

-- Step 1: Check existing users and get organization_id
SELECT id, name FROM organizations;
SELECT id, email, first_name, last_name, role FROM users;

-- Step 2: Create super admin user
-- IMPORTANT: Update these values before running!
-- The password below is bcrypt hash for: Admin@123
-- You should generate your own hash or change password immediately after login

SET @org_id = 1; -- CHANGE THIS to your organization_id
SET @email = 'superadmin@yourcompany.com'; -- CHANGE THIS to your email
SET @first_name = 'Super'; -- CHANGE THIS
SET @last_name = 'Admin'; -- CHANGE THIS
-- Password hash for: Admin@123
SET @password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

-- Check if user already exists
SELECT 'Checking if user exists...' as step;
SELECT COUNT(*) as user_exists FROM users WHERE email = @email AND organization_id = @org_id;

-- Insert super admin (will fail if email already exists - this is good!)
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  organization_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  @email,
  @password,
  @first_name,
  @last_name,
  'super_admin',
  @org_id,
  1,
  NOW(),
  NOW()
);

-- Verify creation
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  organization_id,
  is_active,
  created_at
FROM users 
WHERE email = @email AND organization_id = @org_id;

-- Show login credentials
SELECT 
  'SUPER ADMIN CREATED SUCCESSFULLY!' as status,
  @email as login_email,
  'Admin@123' as temporary_password,
  'CHANGE THIS PASSWORD IMMEDIATELY!' as warning;

-- Generate bcrypt hash for a custom password (Node.js required)
-- Run this in your backend directory to generate a new password hash:
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPasswordHere', 10));"
