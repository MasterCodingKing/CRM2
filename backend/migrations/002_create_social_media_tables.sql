-- Social Media Tables Migration
-- Run this to create tables for social media marketing features

-- Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'linkedin', 'youtube')),
  account_name VARCHAR(255),
  page_id VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  followers_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_accounts_org ON social_media_accounts(organization_id);
CREATE INDEX idx_social_accounts_platform ON social_media_accounts(platform);

-- Social Media Posts Table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'linkedin', 'youtube')),
  external_id VARCHAR(255),
  external_url VARCHAR(500),
  content TEXT NOT NULL,
  media_url VARCHAR(500),
  media_type VARCHAR(20) DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video', 'link')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_posts_org ON social_media_posts(organization_id);
CREATE INDEX idx_social_posts_account ON social_media_posts(account_id);
CREATE INDEX idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX idx_social_posts_status ON social_media_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_media_posts(scheduled_at);

-- Social Media Comments Table
CREATE TABLE IF NOT EXISTS social_media_comments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES social_media_posts(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  author_name VARCHAR(255) NOT NULL,
  author_id VARCHAR(255),
  author_image VARCHAR(500),
  message TEXT NOT NULL,
  parent_id INTEGER REFERENCES social_media_comments(id) ON DELETE CASCADE,
  is_reply BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_comments_org ON social_media_comments(organization_id);
CREATE INDEX idx_social_comments_post ON social_media_comments(post_id);
CREATE INDEX idx_social_comments_parent ON social_media_comments(parent_id);

-- Update timestamp trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_media_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_comments_updated_at BEFORE UPDATE ON social_media_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
