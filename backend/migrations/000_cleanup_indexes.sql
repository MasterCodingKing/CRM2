-- Clean up script - Remove excess indexes from activities table
-- Run this BEFORE starting the server with alter: true

-- Drop all custom indexes on activities table (keep only primary and foreign keys)
ALTER TABLE `activities` 
  DROP INDEX IF EXISTS `activities_organization_id_created_at`,
  DROP INDEX IF EXISTS `activities_contact_id`,
  DROP INDEX IF EXISTS `activities_deal_id`,
  DROP INDEX IF EXISTS `activities_assigned_to`,
  DROP INDEX IF EXISTS `activities_type_is_completed`,
  DROP INDEX IF EXISTS `activities_ticket_number`,
  DROP INDEX IF EXISTS `activities_sla_due_at`,
  DROP INDEX IF EXISTS `activities_scheduled_at`,
  DROP INDEX IF EXISTS `idx_activities_assigned_to`,
  DROP INDEX IF EXISTS `idx_activities_type_completed`,
  DROP INDEX IF EXISTS `idx_activities_sla_due`,
  DROP INDEX IF EXISTS `idx_activities_due_date`;

-- Note: The server will create the necessary indexes when it starts
