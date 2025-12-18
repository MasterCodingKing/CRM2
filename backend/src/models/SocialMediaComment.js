const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialMediaComment = sequelize.define('SocialMediaComment', {
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
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_media_posts',
      key: 'id'
    }
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  author_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  author_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'social_media_comments',
      key: 'id'
    }
  },
  is_reply: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'social_media_comments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['post_id']
    },
    {
      fields: ['parent_id']
    }
  ]
});

module.exports = SocialMediaComment;
