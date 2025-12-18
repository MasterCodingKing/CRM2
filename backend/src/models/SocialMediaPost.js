const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialMediaPost = sequelize.define('SocialMediaPost', {
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
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_media_accounts',
      key: 'id'
    }
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'twitter', 'instagram', 'linkedin', 'youtube'),
    allowNull: false
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  external_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  media_type: {
    type: DataTypes.ENUM('none', 'image', 'video', 'link'),
    defaultValue: 'none'
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'published', 'failed'),
    defaultValue: 'draft'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comments_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shares_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  engagement_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  tableName: 'social_media_posts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['account_id']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['status']
    },
    {
      fields: ['scheduled_at']
    }
  ]
});

module.exports = SocialMediaPost;
