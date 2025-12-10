-- Migration script for Activities module updates
-- Run this script in your MySQL database to add new columns

-- Add new columns to activities table
ALTER TABLE `activities` 
  -- Task Management Fields
  ADD COLUMN `assigned_to` INT NULL AFTER `user_id`,
  ADD COLUMN `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' AFTER `assigned_to`,
  ADD COLUMN `estimated_hours` DECIMAL(10, 2) NULL AFTER `priority`,
  ADD COLUMN `actual_hours` DECIMAL(10, 2) NULL AFTER `estimated_hours`,
  ADD COLUMN `progress` INT DEFAULT 0 AFTER `actual_hours`,
  ADD COLUMN `parent_activity_id` INT NULL AFTER `progress`,
  ADD COLUMN `due_date` DATETIME NULL AFTER `scheduled_at`,
  
  -- Recurring Task Fields
  ADD COLUMN `is_recurring` BOOLEAN DEFAULT FALSE AFTER `parent_activity_id`,
  ADD COLUMN `recurrence_pattern` ENUM('daily', 'weekly', 'monthly', 'yearly') NULL AFTER `is_recurring`,
  ADD COLUMN `recurrence_interval` INT DEFAULT 1 AFTER `recurrence_pattern`,
  ADD COLUMN `recurrence_end_date` DATETIME NULL AFTER `recurrence_interval`,
  ADD COLUMN `next_occurrence` DATETIME NULL AFTER `recurrence_end_date`,
  
  -- Meeting Fields
  ADD COLUMN `meeting_type` ENUM('in_person', 'virtual', 'phone') NULL AFTER `next_occurrence`,
  ADD COLUMN `location` VARCHAR(500) NULL AFTER `meeting_type`,
  ADD COLUMN `meeting_link` VARCHAR(500) NULL AFTER `location`,
  ADD COLUMN `conference_provider` ENUM('zoom', 'teams', 'google_meet', 'webex', 'other') NULL AFTER `meeting_link`,
  ADD COLUMN `meeting_agenda` TEXT NULL AFTER `conference_provider`,
  ADD COLUMN `meeting_notes` TEXT NULL AFTER `meeting_agenda`,
  
  -- Call Fields
  ADD COLUMN `call_duration` INT NULL COMMENT 'in seconds' AFTER `meeting_notes`,
  ADD COLUMN `call_outcome` ENUM('answered', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'callback_requested') NULL AFTER `call_duration`,
  ADD COLUMN `call_direction` ENUM('inbound', 'outbound') DEFAULT 'outbound' AFTER `call_outcome`,
  
  -- Demo/Proposal Fields
  ADD COLUMN `products_shown` JSON NULL AFTER `call_direction`,
  ADD COLUMN `proposal_value` DECIMAL(15, 2) NULL AFTER `products_shown`,
  ADD COLUMN `proposal_status` ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired') NULL AFTER `proposal_value`,
  
  -- Support Ticket Fields
  ADD COLUMN `ticket_number` VARCHAR(50) NULL UNIQUE AFTER `proposal_status`,
  ADD COLUMN `issue_category` ENUM('bug', 'feature_request', 'billing', 'technical', 'general', 'complaint') NULL AFTER `ticket_number`,
  ADD COLUMN `severity` ENUM('low', 'medium', 'high', 'critical') NULL AFTER `issue_category`,
  ADD COLUMN `ticket_status` ENUM('open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed') DEFAULT 'open' AFTER `severity`,
  ADD COLUMN `sla_due_at` DATETIME NULL AFTER `ticket_status`,
  ADD COLUMN `sla_breached` BOOLEAN DEFAULT FALSE AFTER `sla_due_at`,
  ADD COLUMN `first_response_at` DATETIME NULL AFTER `sla_breached`,
  ADD COLUMN `resolution_time` INT NULL COMMENT 'in minutes' AFTER `first_response_at`,
  ADD COLUMN `escalated_to` INT NULL AFTER `resolution_time`,
  ADD COLUMN `escalated_at` DATETIME NULL AFTER `escalated_to`,
  ADD COLUMN `customer_satisfaction` INT NULL AFTER `escalated_at`,
  
  -- Reminder Fields
  ADD COLUMN `reminder_type` ENUM('email', 'sms', 'push', 'in_app') NULL AFTER `customer_satisfaction`,
  ADD COLUMN `reminder_minutes_before` INT DEFAULT 30 AFTER `reminder_type`,
  ADD COLUMN `reminder_sent` BOOLEAN DEFAULT FALSE AFTER `reminder_minutes_before`,
  ADD COLUMN `reminder_sent_at` DATETIME NULL AFTER `reminder_sent`,
  ADD COLUMN `snoozed_until` DATETIME NULL AFTER `reminder_sent_at`,
  
  -- Checklist Items (JSON)
  ADD COLUMN `checklist` JSON NULL AFTER `snoozed_until`,
  
  -- Attendees (JSON)
  ADD COLUMN `attendees` JSON NULL AFTER `checklist`;

-- Update the type enum to include new types
ALTER TABLE `activities` 
  MODIFY COLUMN `type` ENUM('note', 'call', 'email', 'meeting', 'task', 'demo', 'proposal', 'support_ticket') NOT NULL;

-- Add foreign key constraints
ALTER TABLE `activities` 
  ADD CONSTRAINT `fk_activities_assigned_to` 
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  ADD CONSTRAINT `fk_activities_parent` 
  FOREIGN KEY (`parent_activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL,
  
  ADD CONSTRAINT `fk_activities_escalated_to` 
  FOREIGN KEY (`escalated_to`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX `idx_activities_assigned_to` ON `activities`(`assigned_to`);
CREATE INDEX `idx_activities_type_completed` ON `activities`(`type`, `is_completed`);
CREATE INDEX `idx_activities_ticket_number` ON `activities`(`ticket_number`);
CREATE INDEX `idx_activities_sla_due` ON `activities`(`sla_due_at`);
CREATE INDEX `idx_activities_scheduled` ON `activities`(`scheduled_at`);
CREATE INDEX `idx_activities_due_date` ON `activities`(`due_date`);

-- Add check constraints
ALTER TABLE `activities` 
  ADD CONSTRAINT `chk_progress` CHECK (`progress` >= 0 AND `progress` <= 100),
  ADD CONSTRAINT `chk_satisfaction` CHECK (`customer_satisfaction` >= 1 AND `customer_satisfaction` <= 5);
