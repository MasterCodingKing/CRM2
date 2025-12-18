const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FacebookLead = sequelize.define('FacebookLead', {
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
  facebook_lead_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Facebook Lead ID'
  },
  form_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Facebook Lead Form ID'
  },
  form_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ad_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Facebook Ad ID that generated this lead'
  },
  ad_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  campaign_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  campaign_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Lead Data
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  job_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zip_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Custom fields from form
  field_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full field data in JSON format'
  },
  // CRM Integration
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'contacts',
      key: 'id'
    },
    comment: 'Auto-created or linked contact'
  },
  deal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'deals',
      key: 'id'
    },
    comment: 'Auto-created or linked deal'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User assigned to handle this lead'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'disqualified'),
    defaultValue: 'new'
  },
  quality_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Lead quality score (1-100)'
  },
  is_organic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if from organic post, not ad'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of tags'
  },
  fb_created_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When lead was created on Facebook'
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When lead was processed by CRM'
  }
}, {
  tableName: 'facebook_leads',
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
      fields: ['facebook_lead_id']
    },
    {
      fields: ['form_id']
    },
    {
      fields: ['email']
    },
    {
      fields: ['contact_id']
    },
    {
      fields: ['deal_id']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['status']
    },
    {
      fields: ['fb_created_time']
    }
  ]
});

module.exports = FacebookLead;
