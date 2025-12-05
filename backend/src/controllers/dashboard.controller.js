const { Contact, Deal, Activity } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const orgId = req.tenancy.organization_id;

    // Total contacts
    const totalContacts = await Contact.count({
      where: { organization_id: orgId }
    });

    // Total deals
    const totalDeals = await Deal.count({
      where: { organization_id: orgId, status: 'open' }
    });

    // Total revenue (won deals)
    const revenueResult = await Deal.sum('value', {
      where: { organization_id: orgId, status: 'won' }
    });
    const totalRevenue = revenueResult || 0;

    // Pipeline value (open deals)
    const pipelineResult = await Deal.sum('value', {
      where: { organization_id: orgId, status: 'open' }
    });
    const pipelineValue = pipelineResult || 0;

    // Deals by stage
    const dealsByStage = await Deal.findAll({
      where: { organization_id: orgId, status: 'open' },
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('value')), 'value']
      ],
      group: ['stage']
    });

    // Recent activities
    const recentActivities = await Activity.findAll({
      where: { organization_id: orgId },
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name'] },
        { model: Deal, attributes: ['id', 'title'] }
      ]
    });

    // Upcoming tasks
    const upcomingTasks = await Activity.findAll({
      where: {
        organization_id: orgId,
        type: 'task',
        is_completed: false,
        scheduled_at: { [Op.gte]: new Date() }
      },
      limit: 10,
      order: [['scheduled_at', 'ASC']]
    });

    // Win rate
    const wonDeals = await Deal.count({
      where: { organization_id: orgId, status: 'won' }
    });
    const lostDeals = await Deal.count({
      where: { organization_id: orgId, status: 'lost' }
    });
    const totalClosedDeals = wonDeals + lostDeals;
    const winRate = totalClosedDeals > 0 ? ((wonDeals / totalClosedDeals) * 100).toFixed(2) : 0;

    res.json({
      stats: {
        totalContacts,
        totalDeals,
        totalRevenue,
        pipelineValue,
        winRate
      },
      dealsByStage,
      recentActivities,
      upcomingTasks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
