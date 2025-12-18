-- Facebook Integration Tables Migration
-- Run this after running 003_enhance_social_media_tables.sql

-- =====================================================
-- Facebook Pages Table
-- Stores connected Facebook Pages with access tokens
-- =====================================================

CREATE TABLE IF NOT EXISTS `facebook_pages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `organization_id` INT NOT NULL,
  `social_account_id` INT NOT NULL,
  `facebook_page_id` VARCHAR(255) NOT NULL UNIQUE,
  `page_name` VARCHAR(255) NOT NULL,
  `page_access_token` TEXT NOT NULL,
  `category` VARCHAR(255) DEFAULT NULL,
  `about` TEXT DEFAULT NULL,
  `fan_count` INT DEFAULT 0,
  `picture_url` TEXT DEFAULT NULL,
  `cover_url` TEXT DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `is_webhooks_subscribed` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `instagram_business_account_id` VARCHAR(255) DEFAULT NULL COMMENT 'Connected Instagram Business Account ID',
  `last_synced_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_id` (`organization_id`),
  KEY `idx_social_account_id` (`social_account_id`),
  KEY `idx_facebook_page_id` (`facebook_page_id`),
  CONSTRAINT `fk_facebook_pages_organization` 
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facebook_pages_social_account` 
    FOREIGN KEY (`social_account_id`) REFERENCES `social_media_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Facebook Messages Table
-- Stores Messenger conversations and messages
-- =====================================================

CREATE TABLE IF NOT EXISTS `facebook_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `organization_id` INT NOT NULL,
  `facebook_page_id` INT NOT NULL,
  `conversation_id` VARCHAR(255) NOT NULL COMMENT 'Facebook Conversation ID',
  `message_id` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Facebook Message ID',
  `direction` ENUM('incoming', 'outgoing') NOT NULL,
  `sender_id` VARCHAR(255) NOT NULL COMMENT 'Facebook User ID or Page ID',
  `recipient_id` VARCHAR(255) NOT NULL COMMENT 'Facebook User ID or Page ID',
  `sender_name` VARCHAR(255) DEFAULT NULL,
  `message_text` TEXT DEFAULT NULL,
  `attachments` TEXT DEFAULT NULL COMMENT 'JSON array of attachments',
  `quick_reply_payload` VARCHAR(255) DEFAULT NULL,
  `postback_payload` VARCHAR(255) DEFAULT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `is_echo` BOOLEAN DEFAULT FALSE COMMENT 'True if echo of sent message',
  `contact_id` INT DEFAULT NULL COMMENT 'Linked CRM Contact',
  `assigned_to` INT DEFAULT NULL COMMENT 'User assigned to conversation',
  `tags` TEXT DEFAULT NULL COMMENT 'JSON array of tags',
  `metadata` TEXT DEFAULT NULL COMMENT 'Additional metadata in JSON',
  `timestamp` DATETIME NOT NULL COMMENT 'Message timestamp from Facebook',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_id` (`organization_id`),
  KEY `idx_facebook_page_id` (`facebook_page_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_facebook_messages_organization` 
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facebook_messages_page` 
    FOREIGN KEY (`facebook_page_id`) REFERENCES `facebook_pages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facebook_messages_contact` 
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facebook_messages_assigned` 
    FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Facebook Leads Table
-- Stores leads from Facebook Lead Ads
-- =====================================================

CREATE TABLE IF NOT EXISTS `facebook_leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `organization_id` INT NOT NULL,
  `facebook_page_id` INT NOT NULL,
  `facebook_lead_id` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Facebook Lead ID',
  `form_id` VARCHAR(255) NOT NULL COMMENT 'Facebook Lead Form ID',
  `form_name` VARCHAR(255) DEFAULT NULL,
  `ad_id` VARCHAR(255) DEFAULT NULL COMMENT 'Facebook Ad ID',
  `ad_name` VARCHAR(255) DEFAULT NULL,
  `campaign_id` VARCHAR(255) DEFAULT NULL,
  `campaign_name` VARCHAR(255) DEFAULT NULL,
  
  -- Lead Data Fields
  `first_name` VARCHAR(255) DEFAULT NULL,
  `last_name` VARCHAR(255) DEFAULT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `job_title` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `state` VARCHAR(255) DEFAULT NULL,
  `country` VARCHAR(255) DEFAULT NULL,
  `zip_code` VARCHAR(20) DEFAULT NULL,
  
  -- Custom & Meta Fields
  `field_data` TEXT DEFAULT NULL COMMENT 'Full field data in JSON',
  
  -- CRM Integration
  `contact_id` INT DEFAULT NULL COMMENT 'Auto-created or linked contact',
  `deal_id` INT DEFAULT NULL COMMENT 'Auto-created or linked deal',
  `assigned_to` INT DEFAULT NULL COMMENT 'User assigned to lead',
  `status` ENUM('new', 'contacted', 'qualified', 'converted', 'disqualified') DEFAULT 'new',
  `quality_score` INT DEFAULT NULL COMMENT 'Lead quality score (1-100)',
  `is_organic` BOOLEAN DEFAULT FALSE COMMENT 'From organic post, not ad',
  `notes` TEXT DEFAULT NULL,
  `tags` TEXT DEFAULT NULL COMMENT 'JSON array of tags',
  
  -- Timestamps
  `fb_created_time` DATETIME NOT NULL COMMENT 'When lead created on Facebook',
  `processed_at` DATETIME DEFAULT NULL COMMENT 'When processed by CRM',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_organization_id` (`organization_id`),
  KEY `idx_facebook_page_id` (`facebook_page_id`),
  KEY `idx_facebook_lead_id` (`facebook_lead_id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_email` (`email`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_status` (`status`),
  KEY `idx_fb_created_time` (`fb_created_time`),
  CONSTRAINT `fk_facebook_leads_organization` 
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facebook_leads_page` 
    FOREIGN KEY (`facebook_page_id`) REFERENCES `facebook_pages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facebook_leads_contact` 
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facebook_leads_deal` 
    FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facebook_leads_assigned` 
    FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_messages_page_conversation` ON `facebook_messages` (`facebook_page_id`, `conversation_id`);
CREATE INDEX `idx_messages_contact_timestamp` ON `facebook_messages` (`contact_id`, `timestamp`);
CREATE INDEX `idx_leads_status_created` ON `facebook_leads` (`status`, `fb_created_time`);
CREATE INDEX `idx_leads_email_org` ON `facebook_leads` (`email`, `organization_id`);

-- =====================================================
-- Success Message
-- =====================================================

SELECT 'Facebook integration tables created successfully!' AS message;
