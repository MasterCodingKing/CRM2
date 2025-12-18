-- Enhanced Social Media Tables Migration
-- Run this migration after the initial social media tables are created

-- Add new columns to social_media_accounts if they don't exist
ALTER TABLE social_media_accounts 
ADD COLUMN IF NOT EXISTS platform_user_id VARCHAR(255) NULL AFTER account_name,
ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL AFTER page_id,
ADD COLUMN IF NOT EXISTS account_data TEXT NULL AFTER token_expires_at;

-- Add tiktok to platform enum (MySQL syntax)
-- First check if tiktok is not already in the enum
-- ALTER TABLE social_media_accounts MODIFY COLUMN platform ENUM('facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok') NOT NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform_user_id ON social_media_accounts(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_page_id ON social_media_accounts(page_id);

-- Create table for storing social media leads from Facebook Lead Ads
CREATE TABLE IF NOT EXISTS social_media_leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    account_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'facebook',
    lead_id VARCHAR(255) NOT NULL UNIQUE,
    form_id VARCHAR(255),
    form_name VARCHAR(255),
    ad_id VARCHAR(255),
    ad_name VARCHAR(255),
    campaign_id VARCHAR(255),
    campaign_name VARCHAR(255),
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(100),
    company VARCHAR(255),
    job_title VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    raw_data TEXT,
    is_imported BOOLEAN DEFAULT FALSE,
    imported_contact_id INT NULL,
    created_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (imported_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    INDEX idx_leads_org (organization_id),
    INDEX idx_leads_account (account_id),
    INDEX idx_leads_form (form_id),
    INDEX idx_leads_email (email),
    INDEX idx_leads_imported (is_imported)
);

-- Create table for storing social media conversations (Messenger/DMs)
CREATE TABLE IF NOT EXISTS social_media_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    account_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    participant_id VARCHAR(255),
    participant_name VARCHAR(255),
    participant_profile_pic TEXT,
    unread_count INT DEFAULT 0,
    last_message_text TEXT,
    last_message_time DATETIME,
    is_archived BOOLEAN DEFAULT FALSE,
    linked_contact_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    UNIQUE KEY unique_conversation (account_id, conversation_id),
    INDEX idx_conv_org (organization_id),
    INDEX idx_conv_account (account_id),
    INDEX idx_conv_participant (participant_id),
    INDEX idx_conv_linked_contact (linked_contact_id)
);

-- Create table for storing conversation messages
CREATE TABLE IF NOT EXISTS social_media_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    conversation_id INT NOT NULL,
    platform_message_id VARCHAR(255),
    sender_id VARCHAR(255),
    sender_name VARCHAR(255),
    sender_type ENUM('user', 'page', 'business') DEFAULT 'user',
    message_text TEXT,
    attachments JSON,
    is_outbound BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES social_media_conversations(id) ON DELETE CASCADE,
    INDEX idx_msg_conv (conversation_id),
    INDEX idx_msg_sent_at (sent_at)
);

-- Create table for ad accounts
CREATE TABLE IF NOT EXISTS social_ad_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    social_account_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'facebook',
    ad_account_id VARCHAR(255) NOT NULL,
    ad_account_name VARCHAR(255),
    currency VARCHAR(10),
    timezone VARCHAR(100),
    status VARCHAR(50),
    amount_spent DECIMAL(15, 2) DEFAULT 0,
    last_synced_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (social_account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ad_account (social_account_id, ad_account_id),
    INDEX idx_ad_acc_org (organization_id)
);

-- Create table for campaign insights cache
CREATE TABLE IF NOT EXISTS social_campaign_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    ad_account_id INT NOT NULL,
    campaign_id VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255),
    campaign_status VARCHAR(50),
    objective VARCHAR(100),
    date_start DATE,
    date_stop DATE,
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(15, 2) DEFAULT 0,
    cpc DECIMAL(10, 4) DEFAULT 0,
    cpm DECIMAL(10, 4) DEFAULT 0,
    ctr DECIMAL(10, 4) DEFAULT 0,
    conversions INT DEFAULT 0,
    cost_per_conversion DECIMAL(10, 4) DEFAULT 0,
    insights_data JSON,
    synced_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (ad_account_id) REFERENCES social_ad_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_campaign_date (ad_account_id, campaign_id, date_start, date_stop),
    INDEX idx_insights_campaign (campaign_id),
    INDEX idx_insights_date (date_start, date_stop)
);
