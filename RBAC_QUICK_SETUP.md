# Quick RBAC Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Run Database Migration

```powershell
# Connect to MySQL
mysql -u root -p

# Select your database
use your_crm_database;

# Run the RBAC migration
source backend/migrations/ADD_RBAC_TO_USERS.sql;
```

### Step 2: Create Your Super Admin Account

#### Option A: Generate Password Hash

```powershell
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourStrongPassword', 10));"
```

Copy the hash output, then run this SQL (replace the values):

```sql
INSERT INTO users (
  email, password, first_name, last_name,
  role, organization_id, is_active, created_at, updated_at
) VALUES (
  'your.email@company.com',           -- Your email
  '$2a$10$PASTE_YOUR_HASH_HERE',      -- Paste bcrypt hash here
  'Your',                              -- First name
  'Name',                              -- Last name
  'super_admin',
  1,                                   -- Your organization_id (check with: SELECT id FROM organizations;)
  1,
  NOW(),
  NOW()
);
```

#### Option B: Use Pre-made Script

```powershell
# Edit the script first with your details
# backend/migrations/CREATE_SUPER_ADMIN.sql
# Then run it:
mysql -u root -p your_database < backend/migrations/CREATE_SUPER_ADMIN.sql
```

### Step 3: Restart Your Servers

```powershell
# If servers are running, stop them (Ctrl+C) and restart
cd backend
npm start

# In another terminal
cd frontend
npm run dev
```

### Step 4: Login and Create Users

1. Go to http://localhost:5173
2. Login with your super admin credentials
3. Click "Users" in sidebar
4. Click "+ Add User" to create team members
5. Assign appropriate roles:
   - **Super Admin**: For you and system owners
   - **Admin**: For business administrators
   - **Manager**: For team leads
   - **Sales Agent**: For sales reps
   - **Support**: For customer service
   - **Read Only**: For stakeholders/viewers

## 🎯 Role Selection Guide

**Choose role based on what they need to do:**

| What they do                     | Role to assign |
| -------------------------------- | -------------- |
| Manage everything, create admins | Super Admin    |
| Manage users and all data        | Admin          |
| Lead a team, assign deals        | Manager        |
| Sell and manage own clients      | Sales Agent    |
| Handle support tickets           | Support        |
| Just view reports and data       | Read Only      |

## ✅ Verification Steps

After setup, verify everything works:

1. **Test Super Admin Access**:

   - ✅ Can access Users page
   - ✅ Can create/edit/delete users
   - ✅ Can assign any role including super_admin

2. **Test Regular User**:

   - Create a sales_agent user
   - Login as that user
   - ✅ Cannot see Users page in sidebar
   - ✅ Can only see own data

3. **Test Manager**:
   - Create a manager user
   - Login as manager
   - ✅ Can see Users page (read-only)
   - ✅ Can see all contacts/deals

## 🔧 Troubleshooting

### "Role enum doesn't include super_admin"

```sql
-- Fix: Update the enum
ALTER TABLE users MODIFY COLUMN role ENUM(
  'super_admin', 'admin', 'manager',
  'sales_agent', 'support', 'read_only'
) NOT NULL DEFAULT 'sales_agent';
```

### "Cannot see Users page"

- Check: Is user role admin/super_admin/manager?
- Check: Did you restart frontend after changes?
- Solution: Hard refresh browser (Ctrl+Shift+R)

### "Insufficient permissions" error

- Check: User's role in database
- Solution: Update role via SQL or as super admin in UI

## 📝 Default Login Info (if using CREATE_SUPER_ADMIN.sql as-is)

**Email**: superadmin@yourcompany.com  
**Password**: Admin@123

⚠️ **IMPORTANT**: Change these immediately after first login!

## 🔐 Security Notes

- Store super admin credentials securely (password manager)
- Don't share super admin accounts
- Use separate accounts for each person
- Set is_active=false to disable users (don't delete)
- Regularly review user roles and permissions

## 📊 Current System Status

After setup, you'll have:

- ✅ 6 role types (super_admin → read_only)
- ✅ User management UI (/users page)
- ✅ Permission-based access control
- ✅ Role-based sidebar menu
- ✅ Secure password hashing
- ✅ User creation tracking (created_by field)

## 🎉 You're Done!

Your CRM now has:

1. Super admin account for full control
2. Ability to create and manage users
3. Role-based access to features
4. Secure permission system

**Next Steps**:

1. Create user accounts for your team
2. Test different roles
3. Customize permissions as needed
4. Run the Activities migration when ready (RECREATE_ACTIVITIES_TABLE.sql)

Need help? Check RBAC_DOCUMENTATION.md for detailed information.
