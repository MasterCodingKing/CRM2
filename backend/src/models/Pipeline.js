const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pipeline = sequelize.define('Pipeline', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stages: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'pipelines',
  timestamps: true,
  indexes: [
    {
      fields: ['organization_id']
    }
  ]
});

module.exports = Pipeline;
