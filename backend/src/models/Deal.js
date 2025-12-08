const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deal = sequelize.define('Deal', {
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
  contact_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'contacts',
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
  pipeline_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'pipelines',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  stage: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  probability: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expected_close_date: {
    type: DataTypes.DATEONLY
  },
  closed_at: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('open', 'won', 'lost'),
    defaultValue: 'open'
  },
  lost_reason: {
    type: DataTypes.TEXT
  },
  custom_fields: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'deals',
  timestamps: true,
  indexes: [
    {
      fields: ['organization_id', 'status', 'stage']
    }
  ]
});

module.exports = Deal;
