const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialMediaAccount = sequelize.define('SocialMediaAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'),
    allowNull: false
  },
  account_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  platform_user_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User ID on the social platform'
  },
  page_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Page/Business Account ID if applicable'
  },
  profile_picture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  account_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON data for pages, IG accounts, etc.'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  followers_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  posts_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'social_media_accounts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['platform_user_id']
    },
    {
      fields: ['page_id']
    }
  ]
});

module.exports = SocialMediaAccount;
