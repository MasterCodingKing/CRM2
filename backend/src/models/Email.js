const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Email = sequelize.define('Email', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for received emails from unknown senders
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  to_email: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  from_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },  
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('sent', 'received', 'reply'),
    defaultValue: 'sent',
  },
  is_bulk: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  message_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'failed', 'read'),
    defaultValue: 'sent',
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'emails',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Self-referencing association for replies
Email.hasMany(Email, { as: 'replies', foreignKey: 'parent_id' });
Email.belongsTo(Email, { as: 'parent', foreignKey: 'parent_id' });

module.exports = Email;
