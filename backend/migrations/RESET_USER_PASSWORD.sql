-- Reset Password for Specific User
-- This script will update the password for a user

-- Step 1: Check existing user
SELECT id, email, first_name, last_name, role, is_active FROM users WHERE email = 'user@gmail.com';

-- Step 2: Update password
-- Generate a new hash using: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourNewPassword', 10));"
-- Or run the generate-password-hash.ps1 script

-- Example: Reset password to 'newpassword123'
UPDATE users 
SET password_hash = '$2a$10$7ZqrJ.qHMxPmKdN8FvQyYO1Kv5bR5TZ0PqO7cY5wLZqL3j.6XxZ8O',
    updated_at = NOW()
WHERE email = 'user@gmail.com';

-- Step 3: Verify the update
SELECT id, email, first_name, last_name, role, is_active, updated_at 
FROM users 
WHERE email = 'user@gmail.com';

-- Note: Generate your own hash by running:
-- cd backend
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourNewPassword', 10));"
