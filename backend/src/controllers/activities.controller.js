const { Activity, User, Contact, Deal } = require('../models');
const { sendActivityEmail } = require('../utils/emailService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Get all activities with advanced filtering
const getActivities = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      contact_id, 
      deal_id, 
      is_completed,
      assigned_to,
      priority,
      ticket_status,
      severity,
      is_overdue,
      date_from,
      date_to,
      search
    } = req.query;
    const offset = (page - 1) * limit;

    const where = { organization_id: req.tenancy.organization_id };

    if (type) {
      where.type = type;
    }

    if (contact_id) {
      where.contact_id = contact_id;
    }

    if (deal_id) {
      where.deal_id = deal_id;
    }

    if (is_completed !== undefined) {
      where.is_completed = is_completed === 'true';
    }

    // Only add these filters if columns exist (after migration)
    if (assigned_to) {
      try { where.assigned_to = assigned_to; } catch(e) {}
    }

    if (priority) {
      try { where.priority = priority; } catch(e) {}
    }

    if (ticket_status) {
      try { where.ticket_status = ticket_status; } catch(e) {}
    }

    if (severity) {
      try { where.severity = severity; } catch(e) {}
    }

    if (is_overdue === 'true') {
      try {
        where.due_date = { [Op.lt]: new Date() };
        where.is_completed = false;
      } catch(e) {
        // Fallback if due_date doesn't exist
        where.scheduled_at = { [Op.lt]: new Date() };
        where.is_completed = false;
      }
    }

    if (date_from || date_to) {
      where.scheduled_at = {};
      if (date_from) where.scheduled_at[Op.gte] = new Date(date_from);
      if (date_to) where.scheduled_at[Op.lte] = new Date(date_to);
    }

    if (search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build include array - only include associations that exist
    const include = [
      { model: User, attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'], required: false },
      { model: Deal, attributes: ['id', 'title', 'value', 'stage'], required: false }
    ];

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      activities: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get activity by ID
const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'], required: false },
        { model: Deal, attributes: ['id', 'title', 'value', 'stage'], required: false }
      ]
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ activity });
  } catch (error) {
    next(error);
  }
};

// Create new activity
const createActivity = async (req, res, next) => {
  try {
    const activityData = {
      ...req.body,
      organization_id: req.tenancy.organization_id,
      user_id: req.user.id
    };

    const activity = await Activity.create(activityData);

    // If it's an email activity and has email address, send the email
    if (activity.type === 'email' && activity.custom_fields?.email_address) {
      try {
        const user = await User.findByPk(req.user.id);
        const fromName = `${user.first_name} ${user.last_name}`;
        
        await sendActivityEmail({
          to: activity.custom_fields.email_address,
          subject: activity.subject || 'Message from CRM',
          description: activity.description || '',
          from: fromName
        });

        await activity.update({
          custom_fields: {
            ...activity.custom_fields,
            email_sent: true,
            email_sent_at: new Date()
          }
        });

        logger.info('Email sent successfully for activity', { activityId: activity.id });
      } catch (emailError) {
        logger.error('Failed to send email for activity', { 
          activityId: activity.id, 
          error: emailError.message 
        });
        await activity.update({
          custom_fields: {
            ...activity.custom_fields,
            email_sent: false,
            email_error: emailError.message
          }
        });
      }
    }

    // Send assignment notification
    if (activity.assigned_to && activity.assigned_to !== req.user.id) {
      try {
        const assignedUser = await User.findByPk(activity.assigned_to);
        if (assignedUser && assignedUser.email) {
          await sendActivityEmail({
            to: assignedUser.email,
            subject: `New ${activity.type} assigned to you: ${activity.subject}`,
            description: `You have been assigned a new ${activity.type}.\n\nSubject: ${activity.subject}\nDescription: ${activity.description || 'No description'}\nDue: ${activity.due_date ? new Date(activity.due_date).toLocaleString() : 'Not set'}`,
            from: 'CRM System'
          });
        }
      } catch (emailError) {
        logger.error('Failed to send assignment notification', { error: emailError.message });
      }
    }

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Update activity
const updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const oldAssignedTo = activity.assigned_to;
    await activity.update(req.body);

    // Send reassignment notification
    if (req.body.assigned_to && req.body.assigned_to !== oldAssignedTo) {
      try {
        const assignedUser = await User.findByPk(req.body.assigned_to);
        if (assignedUser && assignedUser.email) {
          await sendActivityEmail({
            to: assignedUser.email,
            subject: `${activity.type} reassigned to you: ${activity.subject}`,
            description: `A ${activity.type} has been reassigned to you.\n\nSubject: ${activity.subject}`,
            from: 'CRM System'
          });
        }
      } catch (emailError) {
        logger.error('Failed to send reassignment notification', { error: emailError.message });
      }
    }

    res.json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Complete activity
const completeActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const updateData = {
      is_completed: true,
      completed_at: new Date(),
      progress: 100
    };

    // Calculate actual hours if estimated hours exist
    if (activity.estimated_hours && activity.createdAt) {
      const hoursSpent = (new Date() - new Date(activity.createdAt)) / (1000 * 60 * 60);
      updateData.actual_hours = Math.round(hoursSpent * 100) / 100;
    }

    // For recurring tasks, create next occurrence
    if (activity.is_recurring && activity.recurrence_pattern) {
      const nextDate = calculateNextOccurrence(activity);
      if (nextDate && (!activity.recurrence_end_date || nextDate <= new Date(activity.recurrence_end_date))) {
        await Activity.create({
          ...activity.toJSON(),
          id: undefined,
          is_completed: false,
          completed_at: null,
          progress: 0,
          scheduled_at: nextDate,
          due_date: nextDate,
          next_occurrence: null,
          createdAt: undefined,
          updatedAt: undefined
        });
      }
    }

    await activity.update(updateData);

    res.json({
      message: 'Activity marked as completed',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Calculate next occurrence for recurring activities
function calculateNextOccurrence(activity) {
  const baseDate = activity.scheduled_at ? new Date(activity.scheduled_at) : new Date();
  const interval = activity.recurrence_interval || 1;
  
  switch (activity.recurrence_pattern) {
    case 'daily':
      baseDate.setDate(baseDate.getDate() + interval);
      break;
    case 'weekly':
      baseDate.setDate(baseDate.getDate() + (7 * interval));
      break;
    case 'monthly':
      baseDate.setMonth(baseDate.getMonth() + interval);
      break;
    case 'yearly':
      baseDate.setFullYear(baseDate.getFullYear() + interval);
      break;
    default:
      return null;
  }
  
  return baseDate;
}

// Delete activity
const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await activity.destroy();
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Send email for activity
const sendActivityEmailNow = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      },
      include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'] }]
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.type !== 'email') {
      return res.status(400).json({ error: 'Activity is not an email type' });
    }

    const emailAddress = activity.custom_fields?.email_address;
    if (!emailAddress) {
      return res.status(400).json({ error: 'No email address found in activity' });
    }

    const user = activity.User || await User.findByPk(req.user.id);
    const fromName = `${user.first_name} ${user.last_name}`;

    await sendActivityEmail({
      to: emailAddress,
      subject: activity.subject || 'Message from CRM',
      description: activity.description || '',
      from: fromName
    });

    await activity.update({
      custom_fields: {
        ...activity.custom_fields,
        email_sent: true,
        email_sent_at: new Date()
      }
    });

    res.json({
      message: 'Email sent successfully',
      activity
    });
  } catch (error) {
    logger.error('Failed to send email', { error: error.message });
    next(error);
  }
};

// Update checklist item
const updateChecklist = async (req, res, next) => {
  try {
    const { itemId, completed, text } = req.body;
    
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    let checklist = activity.checklist || [];
    const itemIndex = checklist.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1 && text) {
      // Add new item
      checklist.push({
        id: Date.now().toString(),
        text,
        completed: false,
        completedAt: null
      });
    } else if (itemIndex !== -1) {
      if (completed !== undefined) {
        checklist[itemIndex].completed = completed;
        checklist[itemIndex].completedAt = completed ? new Date() : null;
      }
      if (text !== undefined) {
        checklist[itemIndex].text = text;
      }
    }

    // Calculate progress based on checklist
    const completedItems = checklist.filter(item => item.completed).length;
    const progress = checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0;

    await activity.update({ checklist, progress });

    res.json({
      message: 'Checklist updated successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Log call
const logCall = async (req, res, next) => {
  try {
    const { duration, outcome, notes, contact_id, deal_id, phone_number } = req.body;

    const activity = await Activity.create({
      organization_id: req.tenancy.organization_id,
      user_id: req.user.id,
      type: 'call',
      subject: `Call - ${outcome || 'Completed'}`,
      description: notes,
      contact_id,
      deal_id,
      call_duration: duration,
      call_outcome: outcome,
      call_direction: 'outbound',
      is_completed: true,
      completed_at: new Date(),
      custom_fields: { phone_number }
    });

    res.status(201).json({
      message: 'Call logged successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Update meeting attendee status
const updateAttendeeStatus = async (req, res, next) => {
  try {
    const { attendeeId, status } = req.body;
    
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id,
        type: 'meeting'
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let attendees = activity.attendees || [];
    const attendeeIndex = attendees.findIndex(a => a.id === attendeeId || a.email === attendeeId);
    
    if (attendeeIndex !== -1) {
      attendees[attendeeIndex].status = status;
      await activity.update({ attendees });
    }

    res.json({
      message: 'Attendee status updated',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Escalate support ticket
const escalateTicket = async (req, res, next) => {
  try {
    const { escalate_to, reason } = req.body;
    
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id,
        type: 'support_ticket'
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    await activity.update({
      ticket_status: 'escalated',
      escalated_to: escalate_to,
      escalated_at: new Date(),
      custom_fields: {
        ...activity.custom_fields,
        escalation_reason: reason
      }
    });

    // Notify escalation target
    if (escalate_to) {
      try {
        const escalateUser = await User.findByPk(escalate_to);
        if (escalateUser && escalateUser.email) {
          await sendActivityEmail({
            to: escalateUser.email,
            subject: `Ticket Escalated: ${activity.ticket_number} - ${activity.subject}`,
            description: `A support ticket has been escalated to you.\n\nTicket: ${activity.ticket_number}\nSubject: ${activity.subject}\nSeverity: ${activity.severity}\nReason: ${reason || 'Not specified'}`,
            from: 'CRM System'
          });
        }
      } catch (emailError) {
        logger.error('Failed to send escalation notification', { error: emailError.message });
      }
    }

    res.json({
      message: 'Ticket escalated successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Rate customer satisfaction
const rateTicket = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id,
        type: 'support_ticket'
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    await activity.update({
      customer_satisfaction: rating,
      custom_fields: {
        ...activity.custom_fields,
        satisfaction_feedback: feedback
      }
    });

    res.json({
      message: 'Rating submitted successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

// Snooze reminder
const snoozeReminder = async (req, res, next) => {
  try {
    const { snooze_minutes } = req.body;
    
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const snoozedUntil = new Date(Date.now() + (snooze_minutes || 15) * 60 * 1000);
    
    await activity.update({
      snoozed_until: snoozedUntil,
      reminder_sent: false
    });

    res.json({
      message: 'Reminder snoozed successfully',
      activity,
      snoozed_until: snoozedUntil
    });
  } catch (error) {
    next(error);
  }
};

// Get overdue activities
const getOverdueActivities = async (req, res, next) => {
  try {
    // Fallback to scheduled_at if due_date/sla_due_at don't exist yet
    const activities = await Activity.findAll({
      where: {
        organization_id: req.tenancy.organization_id,
        is_completed: false,
        scheduled_at: { [Op.lt]: new Date() }
      },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
        { model: Contact, attributes: ['id', 'first_name', 'last_name'], required: false }
      ],
      order: [['scheduled_at', 'ASC']]
    }).catch(() => []);

    res.json({ activities: activities || [] });
  } catch (error) {
    next(error);
  }
};

// Get activities dashboard stats
const getActivityStats = async (req, res, next) => {
  try {
    const orgId = req.tenancy.organization_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Default stats in case of database errors (before migration)
    let stats = {
      tasks: { total: 0, completed: 0, overdue: 0, completion_rate: 0 },
      meetings: { today: 0 },
      tickets: { open: 0, sla_breach: 0 },
      calls: { today: 0 }
    };

    try {
      const [
        totalTasks,
        completedTasks,
        overdueTasks,
        todayMeetings,
        openTickets,
        slaBreach,
        callsToday
      ] = await Promise.all([
        Activity.count({ where: { organization_id: orgId, type: 'task' } }).catch(() => 0),
        Activity.count({ where: { organization_id: orgId, type: 'task', is_completed: true } }).catch(() => 0),
        Activity.count({ 
          where: { 
            organization_id: orgId, 
            type: 'task', 
            is_completed: false,
            due_date: { [Op.lt]: new Date() }
          } 
        }).catch(() => 0),
        Activity.count({ 
          where: { 
            organization_id: orgId, 
            type: 'meeting',
            scheduled_at: { [Op.gte]: today, [Op.lt]: tomorrow }
          } 
        }).catch(() => 0),
        Activity.count({ 
          where: { 
            organization_id: orgId, 
            type: 'support_ticket',
            ticket_status: { [Op.notIn]: ['resolved', 'closed'] }
          } 
        }).catch(() => 0),
        Activity.count({ 
          where: { 
            organization_id: orgId, 
            type: 'support_ticket',
            sla_breached: true,
            is_completed: false
          } 
        }).catch(() => 0),
        Activity.count({ 
          where: { 
            organization_id: orgId, 
            type: 'call',
            createdAt: { [Op.gte]: today }
          } 
        }).catch(() => 0)
      ]);

      stats = {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        meetings: {
          today: todayMeetings
        },
        tickets: {
          open: openTickets,
          sla_breach: slaBreach
        },
        calls: {
          today: callsToday
        }
      };
    } catch (queryError) {
      logger.warn('Stats query failed (DB not migrated yet?)', { error: queryError.message });
    }

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// Get team members for assignment
const getTeamMembers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        organization_id: req.tenancy.organization_id,
        is_active: true
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role']
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  completeActivity,
  deleteActivity,
  sendActivityEmailNow,
  updateChecklist,
  logCall,
  updateAttendeeStatus,
  escalateTicket,
  rateTicket,
  snoozeReminder,
  getOverdueActivities,
  getActivityStats,
  getTeamMembers
};
