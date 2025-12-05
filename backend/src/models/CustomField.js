const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomField = sequelize.define('CustomField', {
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
  entity_type: {
    type: DataTypes.ENUM('contact', 'deal', 'company'),
    allowNull: false
  },
  field_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  field_label: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  field_type: {
    type: DataTypes.ENUM('text', 'number', 'date', 'select', 'multiselect', 'boolean'),
    allowNull: false
  },
  options: {
    type: DataTypes.JSON
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'custom_fields',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['organization_id', 'entity_type', 'field_name']
    }
  ]
});

module.exports = CustomField;
