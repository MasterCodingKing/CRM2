const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FacebookMessage = sequelize.define('FacebookMessage', {
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
  facebook_page_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'facebook_pages',
      key: 'id'
    }
  },
  conversation_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Facebook Conversation ID'
  },
  message_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Facebook Message ID'
  },
  direction: {
    type: DataTypes.ENUM('incoming', 'outgoing'),
    allowNull: false
  },
  sender_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Facebook User ID or Page ID'
  },
  recipient_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Facebook User ID or Page ID'
  },
  sender_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of attachments (images, files, etc.)'
  },
  quick_reply_payload: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postback_payload: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_echo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if this is an echo of our sent message'
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'contacts',
      key: 'id'
    },
    comment: 'Linked CRM Contact'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User assigned to handle this conversation'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of tags'
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional metadata in JSON format'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Message timestamp from Facebook'
  }
}, {
  tableName: 'facebook_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['facebook_page_id']
    },
    {
      fields: ['conversation_id']
    },
    {
      fields: ['message_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['contact_id']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = FacebookMessage;
