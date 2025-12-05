const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subdomain: {
    type: DataTypes.STRING(100),
    unique: true
  },
  plan: {
    type: DataTypes.STRING(50),
    defaultValue: 'starter'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'cancelled'),
    defaultValue: 'active'
  },
  trial_ends_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'organizations',
  timestamps: true
});

module.exports = Organization;
