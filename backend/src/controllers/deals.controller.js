const { Deal, Contact, User, Pipeline } = require('../models');
const { Op } = require('sequelize');

const getDeals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, stage, owner_id, pipeline_id } = req.query;
    const offset = (page - 1) * limit;

    const where = { organization_id: req.tenancy.organization_id };

    if (status) {
      where.status = status;
    }

    if (stage) {
      where.stage = stage;
    }

    if (owner_id) {
      where.owner_id = owner_id;
    }

    if (pipeline_id) {
      where.pipeline_id = pipeline_id;
    }

    const { count, rows } = await Deal.findAndCountAll({
      where,
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'company'] },
        { model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Pipeline, attributes: ['id', 'name', 'is_default'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      deals: rows,
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

const getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'company'] },
        { model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Pipeline, attributes: ['id', 'name', 'is_default'] }
      ]
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ deal });
  } catch (error) {
    next(error);
  }
};

const createDeal = async (req, res, next) => {
  try {
    const dealData = {
      ...req.body,
      organization_id: req.tenancy.organization_id,
      owner_id: req.body.owner_id || req.user.id
    };

    const deal = await Deal.create(dealData);

    res.status(201).json({
      message: 'Deal created successfully',
      deal
    });
  } catch (error) {
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await deal.update(req.body);

    res.json({
      message: 'Deal updated successfully',
      deal
    });
  } catch (error) {
    next(error);
  }
};

const updateDealStage = async (req, res, next) => {
  try {
    const { stage, probability } = req.body;

    const deal = await Deal.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await deal.update({ stage, probability });

    res.json({
      message: 'Deal stage updated successfully',
      deal
    });
  } catch (error) {
    next(error);
  }
};

const markDealWon = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await deal.update({
      status: 'won',
      closed_at: new Date(),
      probability: 100
    });

    res.json({
      message: 'Deal marked as won',
      deal
    });
  } catch (error) {
    next(error);
  }
};

const markDealLost = async (req, res, next) => {
  try {
    const { lost_reason } = req.body;

    const deal = await Deal.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await deal.update({
      status: 'lost',
      closed_at: new Date(),
      lost_reason,
      probability: 0
    });

    res.json({
      message: 'Deal marked as lost',
      deal
    });
  } catch (error) {
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await deal.destroy();

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  updateDealStage,
  markDealWon,
  markDealLost,
  deleteDeal
};
