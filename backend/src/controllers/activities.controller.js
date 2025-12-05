const { Activity, User, Contact, Deal } = require('../models');

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

module.exports = {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  completeActivity,
  deleteActivity
};
