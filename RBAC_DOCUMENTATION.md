# Role-Based Access Control (RBAC) System

## Overview

This CRM now implements a comprehensive Role-Based Access Control system with 6 distinct roles, each with specific permissions and access levels.

## Roles & Permissions

### 1. Super Admin (Level 100)

**Description**: Full system access with all permissions
**Can**:

- Create, edit, and delete any user (including other admins)
- Manage all data across all modules
- Access all features and settings
- View and modify organization settings
- Cannot be deleted or modified by other admins

**Use Cases**: System owners, technical administrators

### 2. Admin (Level 90)

**Description**: Full access to all data and settings
**Can**:

- Create and manage users (except super admins)
- Full CRUD on contacts, deals, activities
- View and export all reports
- Modify settings and configurations
- Cannot create or delete super admins

**Use Cases**: Business administrators, office managers

### 3. Manager (Level 70)

**Description**: View all data, assign leads, view reports
**Can**:

- View all users (read-only)
- Create and edit contacts, deals, activities
- Assign deals and activities to team members
- View all reports and export data
- View team performance metrics
- Cannot delete users or modify settings

**Use Cases**: Sales managers, team leads

### 4. Sales Agent (Level 50)

**Description**: Manage own clients and deals
**Can**:

- Create and manage own contacts
- Create and manage own deals
- Create and manage own activities
- View own performance reports
- Cannot view other agents' data (unless shared)

**Use Cases**: Sales representatives, account executives

### 5. Support (Level 40)

**Description**: Handle customer tickets and assigned customers
**Can**:

- View all contacts
- Create and manage support tickets
- View and update assigned activities
- View assigned customer information
- Cannot create or edit deals

**Use Cases**: Customer support agents, help desk staff

### 6. Read Only (Level 10)

**Description**: View-only access to data
**Can**:

- View contacts, deals, activities
- View reports
- Cannot create, edit, or delete anything

**Use Cases**: Auditors, stakeholders, reporting staff

## Permission System

### Permission Format

Permissions follow the pattern: `resource.action` or `resource.action.scope`

Examples:

- `users.create` - Can create users
- `contacts.read.own` - Can read own contacts only
- `reports.export` - Can export reports

### Scopes

- **No scope** - Apply to all resources
- `.own` - Apply only to user's own resources
- `.assigned` - Apply only to resources assigned to user

## Database Schema

### User Table Updates

```sql
ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL;
ALTER TABLE users ADD COLUMN created_by INT DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN role ENUM(
  'super_admin',
  'admin',
  'manager',
  'sales_agent',
  'support',
  'read_only'
) NOT NULL DEFAULT 'sales_agent';
```

## Implementation

### Backend

#### 1. RBAC Middleware (`backend/src/middlewares/rbac.middleware.js`)

```javascript
const { requirePermission } = require("../middlewares/rbac.middleware");

// Use in routes
router.post("/users", requirePermission("users.create"), createUser);
```

#### 2. Role-based Route Protection

```javascript
const { requireRole } = require("../middlewares/rbac.middleware");

// Only allow specific roles
router.get("/admin/reports", requireRole("super_admin", "admin"));
```

#### 3. Data Filtering

```javascript
const { applyRoleFilter } = require("../middlewares/rbac.middleware");

// Automatically filter data based on role
router.get("/contacts", applyRoleFilter, getContacts);
```

### Frontend

#### 1. Role-based UI (`frontend/src/components/layout/Sidebar.jsx`)

```javascript
import { useAuthStore } from "../../store/authStore";

const user = useAuthStore((state) => state.user);

if (user?.role === "super_admin" || user?.role === "admin") {
  // Show admin features
}
```

#### 2. User Management Page (`frontend/src/pages/Users.jsx`)

- Create, edit, and delete users
- Assign roles and permissions
- View user activity and status

## Setup Instructions

### 1. Run Database Migration

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database

# Run the migration
source backend/migrations/ADD_RBAC_TO_USERS.sql
```

### 2. Create Super Admin User

```bash
# Option A: Use SQL script (update values first)
source backend/migrations/CREATE_SUPER_ADMIN.sql

# Option B: Use Node.js to generate password hash
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword', 10));"

# Then insert manually with the hash
```

### 3. Restart Backend Server

```bash
cd backend
npm start
```

### 4. Login and Create Users

1. Login with super admin credentials
2. Navigate to Users page
3. Click "Add User" to create team members
4. Assign appropriate roles

## API Endpoints

### User Management

```
GET    /api/users              - List all users (admin+)
GET    /api/users/me           - Get current user profile
GET    /api/users/roles        - Get available roles
GET    /api/users/:id          - Get single user
POST   /api/users              - Create user (admin+)
PUT    /api/users/:id          - Update user (admin+)
PUT    /api/users/:id/password - Change password
DELETE /api/users/:id          - Delete user (super_admin only)
```

### Request Examples

#### Create User

```json
POST /api/users
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "sales_agent",
  "phone": "+1234567890"
}
```

#### Update User Role

```json
PUT /api/users/5
{
  "role": "manager",
  "is_active": true
}
```

## Security Considerations

### Role Change Rules

1. Users cannot modify their own role
2. Only super_admin can create/modify super_admin roles
3. Only super_admin and admin can create/modify admin roles
4. Users can only be deleted by super_admin
5. Users cannot delete themselves

### Password Security

- Passwords are hashed with bcrypt (10 rounds)
- Minimum 6 characters required
- Users can change their own password anytime
- Admins can reset user passwords

### Permission Checks

- Every protected route checks authentication first
- Then checks role/permission requirements
- Failed permission checks are logged
- Returns 403 Forbidden with clear error message

## Custom Permissions

You can assign custom permissions to individual users:

```json
PUT /api/users/5
{
  "permissions": {
    "contacts.delete": true,    // Grant specific permission
    "reports.export": false,    // Revoke specific permission
    "deals.update.own": true    // Scope-specific permission
  }
}
```

Custom permissions override role-based permissions.

## Testing

### Test Different Roles

1. Create test users with each role
2. Login as each user
3. Verify access to features matches role permissions
4. Test edge cases (e.g., editing own vs. others' data)

### Expected Behavior by Role

**Super Admin**:

- ✅ Can access Users page
- ✅ Can create/edit/delete all users
- ✅ Can view all data
- ✅ Can modify settings

**Admin**:

- ✅ Can access Users page
- ✅ Can create/edit users (except super admins)
- ✅ Can view all data
- ✅ Can modify settings

**Manager**:

- ✅ Can access Users page (read-only)
- ✅ Can view all contacts/deals
- ✅ Can assign deals to team
- ❌ Cannot create users
- ❌ Cannot modify settings

**Sales Agent**:

- ❌ Cannot access Users page
- ✅ Can view/edit own contacts
- ✅ Can view/edit own deals
- ❌ Cannot view other agents' data

**Support**:

- ❌ Cannot access Users page
- ✅ Can view contacts
- ✅ Can create/manage tickets
- ❌ Cannot create deals

**Read Only**:

- ❌ Cannot access Users page
- ✅ Can view all data
- ❌ Cannot create/edit anything

## Troubleshooting

### Issue: "Insufficient permissions" error

- **Check**: User's role in database
- **Check**: Route permission requirements
- **Solution**: Update user role or adjust route permissions

### Issue: Cannot see Users page

- **Check**: User role is admin/super_admin/manager
- **Check**: Sidebar logic includes user check
- **Solution**: Update Sidebar.jsx condition

### Issue: Super admin cannot be created

- **Check**: Database migration completed
- **Check**: Role enum includes 'super_admin'
- **Solution**: Run ADD_RBAC_TO_USERS.sql migration

### Issue: Password hash incorrect

- **Generate new hash**:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword', 10));"
```

## Best Practices

1. **Start with One Super Admin**: Create one super admin account first
2. **Use Least Privilege**: Assign minimum necessary role for each user
3. **Regular Audits**: Review user roles and permissions regularly
4. **Password Policy**: Enforce strong passwords (add validation if needed)
5. **Activity Logging**: Monitor user actions (already logged via logger.js)
6. **Deactivate, Don't Delete**: Set is_active=false instead of deleting users
7. **Document Custom Permissions**: Keep track of any custom permission assignments

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Session management and timeout
- [ ] Password expiration policy
- [ ] Role-based dashboard widgets
- [ ] Audit trail for user actions
- [ ] Bulk user import/export
- [ ] Custom role creation
- [ ] Permission templates

## Migration Checklist

- [ ] Backup database before migration
- [ ] Run ADD_RBAC_TO_USERS.sql migration
- [ ] Verify users table structure
- [ ] Create super admin account
- [ ] Test login with super admin
- [ ] Create test users with different roles
- [ ] Test permissions for each role
- [ ] Update existing users' roles if needed
- [ ] Restart backend server
- [ ] Test frontend Users page
- [ ] Document your super admin credentials securely
