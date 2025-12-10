-- COMPLETE MIGRATION SCRIPT FOR ACTIVITIES MODULE
-- Run this script in your MySQL database to update the activities table
-- WARNING: This will drop and recreate the activities table (data will be lost)
-- If you want to preserve data, backup the table first

-- Step 1: Backup existing data (optional)
-- CREATE TABLE activities_backup AS SELECT * FROM activities;

-- Step 2: Drop the activities table
DROP TABLE IF EXISTS `activities`;

-- Step 3: Recreate the activities table with all new columns
CREATE TABLE `activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `organization_id` INT NOT NULL,
  `user_id` INT NULL,
  `contact_id` INT NULL,
  `deal_id` INT NULL,
  `type` ENUM('note', 'call', 'email', 'meeting', 'task', 'demo', 'proposal', 'support_ticket') NOT NULL,
  `subject` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `scheduled_at` DATETIME NULL,
  `due_date` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `is_completed` BOOLEAN DEFAULT FALSE,
  
  -- Task Management Fields
  `assigned_to` INT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `estimated_hours` DECIMAL(10, 2) NULL,
  `actual_hours` DECIMAL(10, 2) NULL,
  `progress` INT DEFAULT 0,
  `parent_activity_id` INT NULL,
  
  -- Recurring Task Fields
  `is_recurring` BOOLEAN DEFAULT FALSE,
  `recurrence_pattern` ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
  `recurrence_interval` INT DEFAULT 1,
  `recurrence_end_date` DATETIME NULL,
  `next_occurrence` DATETIME NULL,
  
  -- Meeting Fields
  `meeting_type` ENUM('in_person', 'virtual', 'phone') NULL,
  `location` VARCHAR(500) NULL,
  `meeting_link` VARCHAR(500) NULL,
  `conference_provider` ENUM('zoom', 'teams', 'google_meet', 'webex', 'other') NULL,
  `meeting_agenda` TEXT NULL,
  `meeting_notes` TEXT NULL,
  
  -- Call Fields
  `call_duration` INT NULL COMMENT 'in seconds',
  `call_outcome` ENUM('answered', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'callback_requested') NULL,
  `call_direction` ENUM('inbound', 'outbound') DEFAULT 'outbound',
  
  -- Demo/Proposal Fields
  `products_shown` JSON NULL,
  `proposal_value` DECIMAL(15, 2) NULL,
  `proposal_status` ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired') NULL,
  
  -- Support Ticket Fields
  `ticket_number` VARCHAR(50) NULL,
  `issue_category` ENUM('bug', 'feature_request', 'billing', 'technical', 'general', 'complaint') NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NULL,
  `ticket_status` ENUM('open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed') DEFAULT 'open',
  `sla_due_at` DATETIME NULL,
  `sla_breached` BOOLEAN DEFAULT FALSE,
  `first_response_at` DATETIME NULL,
  `resolution_time` INT NULL COMMENT 'in minutes',
  `escalated_to` INT NULL,
  `escalated_at` DATETIME NULL,
  `customer_satisfaction` INT NULL,
  
  -- Reminder Fields
  `reminder_type` ENUM('email', 'sms', 'push', 'in_app') NULL,
  `reminder_minutes_before` INT DEFAULT 30,
  `reminder_sent` BOOLEAN DEFAULT FALSE,
  `reminder_sent_at` DATETIME NULL,
  `snoozed_until` DATETIME NULL,
  
  -- JSON Fields
  `checklist` JSON NULL,
  `attendees` JSON NULL,
  `custom_fields` JSON NULL,
  
  -- Timestamps
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  
  -- Foreign Keys
  CONSTRAINT `fk_activities_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activities_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activities_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activities_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activities_parent` FOREIGN KEY (`parent_activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activities_escalated_to` FOREIGN KEY (`escalated_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes (limited to avoid "too many keys" error)
  INDEX `idx_organization` (`organization_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_scheduled` (`scheduled_at`),
  UNIQUE INDEX `idx_ticket_number` (`ticket_number`),
  
  -- Check Constraints
  CONSTRAINT `chk_progress` CHECK (`progress` >= 0 AND `progress` <= 100),
  CONSTRAINT `chk_satisfaction` CHECK (`customer_satisfaction` IS NULL OR (`customer_satisfaction` >= 1 AND `customer_satisfaction` <= 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Restore data (if backed up)
-- INSERT INTO activities SELECT * FROM activities_backup;
-- DROP TABLE activities_backup;

SELECT 'Activities table has been recreated successfully!' AS status;
