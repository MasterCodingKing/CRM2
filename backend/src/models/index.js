const sequelize = require('../config/database');
const Organization = require('./Organization');
const User = require('./User');
const Contact = require('./Contact');
const Deal = require('./Deal');
const Activity = require('./Activity');
const Pipeline = require('./Pipeline');
const CustomField = require('./CustomField');

// Define associations
Organization.hasMany(User, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
User.belongsTo(Organization, { foreignKey: 'organization_id' });

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

Contact.hasMany(Activity, { foreignKey: 'contact_id', onDelete: 'CASCADE' });
Activity.belongsTo(Contact, { foreignKey: 'contact_id' });

Deal.hasMany(Activity, { foreignKey: 'deal_id', onDelete: 'CASCADE' });
Activity.belongsTo(Deal, { foreignKey: 'deal_id' });

Organization.hasMany(Pipeline, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Pipeline.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(CustomField, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
CustomField.belongsTo(Organization, { foreignKey: 'organization_id' });

module.exports = {
  sequelize,
  Organization,
  User,
  Contact,
  Deal,
  Activity,
  Pipeline,
  CustomField
};
