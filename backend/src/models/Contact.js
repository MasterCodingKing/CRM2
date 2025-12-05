const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
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
  owner_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  first_name: {
    type: DataTypes.STRING(100)
  },
  last_name: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(255)
  },
  phone: {
    type: DataTypes.STRING(50)
  },
  company: {
    type: DataTypes.STRING(255)
  },
  job_title: {
    type: DataTypes.STRING(255)
  },
  source: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.ENUM('lead', 'qualified', 'customer', 'inactive'),
    defaultValue: 'lead'
  },
  tags: {
    type: DataTypes.JSON
  },
  custom_fields: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'contacts',
  timestamps: true,
  indexes: [
    {
      fields: ['organization_id', 'status']
    },
    {
      fields: ['owner_id']
    },
    {
      fields: ['email']
    }
  ]
});

module.exports = Contact;
