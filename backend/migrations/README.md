# Database Migration Instructions for Activities Module

## Problem

The database table 'activities' needs to be updated with new columns, but automatic sync is failing due to "too many keys" error in MySQL.

## Solution Options

### Option 1: Run the Complete Recreation Script (RECOMMENDED - Quick but loses data)

1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or command line)
2. Connect to your CRM database
3. Run the SQL file: `migrations/RECREATE_ACTIVITIES_TABLE.sql`

This will:

- Drop the existing activities table
- Recreate it with all new columns and proper structure
- ⚠️ WARNING: This will DELETE all existing activity data

### Option 2: Backup and Restore (Preserves data)

1. **Backup existing data:**

   ```sql
   CREATE TABLE activities_backup AS SELECT * FROM activities;
   ```

2. **Run the recreation script:**
   Execute: `migrations/RECREATE_ACTIVITIES_TABLE.sql`

3. **Restore compatible data:**

   ```sql
   INSERT INTO activities (
     id, organization_id, user_id, contact_id, deal_id,
     type, subject, description, scheduled_at, completed_at,
     is_completed, custom_fields, createdAt, updatedAt
   )
   SELECT
     id, organization_id, user_id, contact_id, deal_id,
     type, subject, description, scheduled_at, completed_at,
     is_completed, custom_fields, createdAt, updatedAt
   FROM activities_backup;
   ```

4. **Clean up:**
   ```sql
   DROP TABLE activities_backup;
   ```

### Option 3: Manual Column Addition (Complex but preserves all data)

Run the SQL file: `migrations/001_update_activities_table.sql`

This adds columns one by one to the existing table.

## After Running Migration

1. Stop the backend server (Ctrl+C)
2. Update `backend/server.js` line 18-19 to use simple sync:
   ```javascript
   await sequelize.sync();
   ```
3. Restart the server: `npm run dev`

## Verification

After migration, verify the table structure:

```sql
DESCRIBE activities;
```

You should see all new columns including:

- assigned_to, priority, estimated_hours, actual_hours
- meeting_type, meeting_link, meeting_agenda
- call_duration, call_outcome
- ticket_number, severity, ticket_status, sla_due_at
- And many more...

## Current Server Status

The server is currently running but WITHOUT the new columns in the database.
This means:

- ✅ Old activities features will work
- ❌ New features (tasks, meetings, tickets) will fail when saving

You MUST run the migration to use the new features.
