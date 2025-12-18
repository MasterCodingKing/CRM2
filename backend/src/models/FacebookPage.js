const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FacebookPage = sequelize.define('FacebookPage', {
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
  social_account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_media_accounts',
      key: 'id'
    }
  },
  facebook_page_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  page_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  page_access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  about: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fan_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  picture_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cover_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_webhooks_subscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  instagram_business_account_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Connected Instagram Business Account ID'
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'facebook_pages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['social_account_id']
    },
    {
      fields: ['facebook_page_id']
    }
  ]
});

module.exports = FacebookPage;
