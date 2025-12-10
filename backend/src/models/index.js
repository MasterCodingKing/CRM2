const sequelize = require('../config/database');
const Organization = require('./Organization');
const User = require('./User');
const Contact = require('./Contact');
const Deal = require('./Deal');
const Activity = require('./Activity');
const Pipeline = require('./Pipeline');
const CustomField = require('./CustomField');
const Email = require('./Email');

// Define associations
Organization.hasMany(User, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
User.belongsTo(Organization, { foreignKey: 'organization_id' });

// User created by another user (for user management tracking)
User.hasMany(User, { foreignKey: 'created_by', as: 'CreatedUsers', onDelete: 'SET NULL' });
User.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedBy' });

Organization.hasMany(Contact, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Contact.belongsTo(Organization, { foreignKey: 'organization_id' });

User.hasMany(Contact, { foreignKey: 'owner_id', onDelete: 'SET NULL' });
Contact.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });

Organization.hasMany(Deal, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Deal.belongsTo(Organization, { foreignKey: 'organization_id' });

Contact.hasMany(Deal, { foreignKey: 'contact_id', onDelete: 'SET NULL' });
Deal.belongsTo(Contact, { foreignKey: 'contact_id' });

User.hasMany(Deal, { foreignKey: 'owner_id', onDelete: 'SET NULL' });
Deal.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });

Pipeline.hasMany(Deal, { foreignKey: 'pipeline_id', onDelete: 'SET NULL' });
Deal.belongsTo(Pipeline, { foreignKey: 'pipeline_id' });

Organization.hasMany(Activity, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Activity.belongsTo(Organization, { foreignKey: 'organization_id' });

User.hasMany(Activity, { foreignKey: 'user_id', onDelete: 'SET NULL' });
Activity.belongsTo(User, { foreignKey: 'user_id' });

// NOTE: These associations require database migration to be run first
// Uncomment after running migrations/RECREATE_ACTIVITIES_TABLE.sql
// Assigned user association for activities
// User.hasMany(Activity, { foreignKey: 'assigned_to', as: 'AssignedActivities', onDelete: 'SET NULL' });
// Activity.belongsTo(User, { foreignKey: 'assigned_to', as: 'AssignedUser' });

// Escalated to user association for support tickets
// User.hasMany(Activity, { foreignKey: 'escalated_to', as: 'EscalatedActivities', onDelete: 'SET NULL' });
// Activity.belongsTo(User, { foreignKey: 'escalated_to', as: 'EscalatedToUser' });

Contact.hasMany(Activity, { foreignKey: 'contact_id', onDelete: 'CASCADE' });
Activity.belongsTo(Contact, { foreignKey: 'contact_id' });

Deal.hasMany(Activity, { foreignKey: 'deal_id', onDelete: 'CASCADE' });
Activity.belongsTo(Deal, { foreignKey: 'deal_id' });

Organization.hasMany(Pipeline, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Pipeline.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(CustomField, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Organization.hasMany(CustomField, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
CustomField.belongsTo(Organization, { foreignKey: 'organization_id' });

// Email associations
Organization.hasMany(Email, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Email.belongsTo(Organization, { foreignKey: 'organization_id' });

User.hasMany(Email, { foreignKey: 'user_id', onDelete: 'SET NULL' });
Email.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Organization,
  User,
  Contact,
  Deal,
  Activity,
  Pipeline,
  CustomField,
  Email
};
