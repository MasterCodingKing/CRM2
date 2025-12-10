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
    type: DataTypes.ENUM('note', 'call', 'email', 'meeting', 'task', 'demo', 'proposal', 'support_ticket'),
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
  due_date: {
    type: DataTypes.DATE
  },
  completed_at: {
    type: DataTypes.DATE
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Task Management Fields
  assigned_to: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(10, 2)
  },
  actual_hours: {
    type: DataTypes.DECIMAL(10, 2)
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  parent_activity_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'activities',
      key: 'id'
    }
  },
  
  // Recurring Task Fields
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurrence_pattern: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: true
  },
  recurrence_interval: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  recurrence_end_date: {
    type: DataTypes.DATE
  },
  next_occurrence: {
    type: DataTypes.DATE
  },
  
  // Meeting Fields
  meeting_type: {
    type: DataTypes.ENUM('in_person', 'virtual', 'phone'),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(500)
  },
  meeting_link: {
    type: DataTypes.STRING(500)
  },
  conference_provider: {
    type: DataTypes.ENUM('zoom', 'teams', 'google_meet', 'webex', 'other'),
    allowNull: true
  },
  meeting_agenda: {
    type: DataTypes.TEXT
  },
  meeting_notes: {
    type: DataTypes.TEXT
  },
  
  // Call Fields
  call_duration: {
    type: DataTypes.INTEGER  // in seconds
  },
  call_outcome: {
    type: DataTypes.ENUM('answered', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'callback_requested'),
    allowNull: true
  },
  call_direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    defaultValue: 'outbound'
  },
  
  // Demo/Proposal Fields
  products_shown: {
    type: DataTypes.JSON  // Array of product IDs or names
  },
  proposal_value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  proposal_status: {
    type: DataTypes.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
    allowNull: true
  },
  
  // Support Ticket Fields
  ticket_number: {
    type: DataTypes.STRING(50),
    unique: true
  },
  issue_category: {
    type: DataTypes.ENUM('bug', 'feature_request', 'billing', 'technical', 'general', 'complaint'),
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true
  },
  ticket_status: {
    type: DataTypes.ENUM('open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  sla_due_at: {
    type: DataTypes.DATE
  },
  sla_breached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  first_response_at: {
    type: DataTypes.DATE
  },
  resolution_time: {
    type: DataTypes.INTEGER  // in minutes
  },
  escalated_to: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  escalated_at: {
    type: DataTypes.DATE
  },
  customer_satisfaction: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  
  // Reminder Fields
  reminder_type: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'in_app'),
    allowNull: true
  },
  reminder_minutes_before: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_sent_at: {
    type: DataTypes.DATE
  },
  snoozed_until: {
    type: DataTypes.DATE
  },
  
  // Checklist Items (for tasks)
  checklist: {
    type: DataTypes.JSON  // Array of { id, text, completed, completedAt }
  },
  
  // Attendees (for meetings)
  attendees: {
    type: DataTypes.JSON  // Array of { userId, email, name, status: 'pending'|'accepted'|'declined'|'tentative' }
  },
  
  custom_fields: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'activities',
  timestamps: true,
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['scheduled_at']
    }
  ],
  hooks: {
    beforeCreate: async (activity) => {
      // Generate ticket number for support tickets
      if (activity.type === 'support_ticket' && !activity.ticket_number) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        activity.ticket_number = `TKT-${timestamp}-${random}`;
      }
      
      // Set SLA due date for support tickets based on severity
      if (activity.type === 'support_ticket' && activity.severity && !activity.sla_due_at) {
        const slaHours = {
          critical: 1,
          high: 4,
          medium: 8,
          low: 24
        };
        const hours = slaHours[activity.severity] || 24;
        activity.sla_due_at = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    },
    beforeUpdate: async (activity) => {
      // Check SLA breach
      if (activity.type === 'support_ticket' && activity.sla_due_at) {
        if (new Date() > new Date(activity.sla_due_at) && !activity.is_completed) {
          activity.sla_breached = true;
        }
      }
      
      // Calculate resolution time when ticket is resolved
      if (activity.type === 'support_ticket' && activity.is_completed && !activity.resolution_time) {
        const createdAt = new Date(activity.createdAt);
        const now = new Date();
        activity.resolution_time = Math.round((now - createdAt) / 60000);
      }
    }
  }
});

// Self-referencing association for task dependencies
// NOTE: Uncomment after running database migration
// Activity.hasMany(Activity, { as: 'SubTasks', foreignKey: 'parent_activity_id' });
// Activity.belongsTo(Activity, { as: 'ParentTask', foreignKey: 'parent_activity_id' });

module.exports = Activity;
