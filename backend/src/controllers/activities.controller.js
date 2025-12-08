const { Activity, User, Contact, Deal } = require('../models');
const { sendActivityEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const getActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, contact_id, deal_id, is_completed } = req.query;
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

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Deal, attributes: ['id', 'title', 'value'] }
      ],
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

const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Deal, attributes: ['id', 'title', 'value'] }
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

        // Update activity to mark email as sent
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
        // Don't fail the activity creation if email fails
        await activity.update({
          custom_fields: {
            ...activity.custom_fields,
            email_sent: false,
            email_error: emailError.message
          }
        });
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

    await activity.update(req.body);

    res.json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

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

    await activity.update({
      is_completed: true,
      completed_at: new Date()
    });

    res.json({
      message: 'Activity marked as completed',
      activity
    });
  } catch (error) {
    next(error);
  }
};

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

    // Update activity to mark email as sent
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

module.exports = {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  completeActivity,
  deleteActivity,
  sendActivityEmailNow
};
