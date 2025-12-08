const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
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
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contact_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  deal_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'deals',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('note', 'call', 'email', 'meeting', 'task'),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255)
  },
  description: {
    type: DataTypes.TEXT
  },
  scheduled_at: {
    type: DataTypes.DATE
  },
  completed_at: {
    type: DataTypes.DATE
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  custom_fields: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'activities',
  timestamps: true,
  indexes: [
    {
      fields: ['organization_id', 'created_at']
    },
    {
      fields: ['contact_id']
    },
    {
      fields: ['deal_id']
    }
  ]
});

module.exports = Activity;
