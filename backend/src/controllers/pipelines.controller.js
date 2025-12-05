const { Pipeline } = require('../models');

const getPipelines = async (req, res, next) => {
  try {
    const pipelines = await Pipeline.findAll({
      where: { organization_id: req.tenancy.organization_id },
      order: [['is_default', 'DESC'], ['created_at', 'ASC']]
    });

    res.json({ pipelines });
  } catch (error) {
    next(error);
  }
};

const getPipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({ pipeline });
  } catch (error) {
    next(error);
  }
};

const createPipeline = async (req, res, next) => {
  try {
    const { name, stages, is_default } = req.body;

    if (!name || !stages || !Array.isArray(stages)) {
      return res.status(400).json({ error: 'Name and stages are required' });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await Pipeline.update(
        { is_default: false },
        { where: { organization_id: req.tenancy.organization_id } }
      );
    }

    const pipeline = await Pipeline.create({
      organization_id: req.tenancy.organization_id,
      name,
      stages,
      is_default: is_default || false
    });

    res.status(201).json({
      message: 'Pipeline created successfully',
      pipeline
    });
  } catch (error) {
    next(error);
  }
};

const updatePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // If setting as default, unset other defaults
    if (req.body.is_default) {
      await Pipeline.update(
        { is_default: false },
        { where: { organization_id: req.tenancy.organization_id, id: { [require('sequelize').Op.ne]: pipeline.id } } }
      );
    }

    await pipeline.update(req.body);

    res.json({
      message: 'Pipeline updated successfully',
      pipeline
    });
  } catch (error) {
    next(error);
  }
};

const setDefaultPipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Unset all defaults
    await Pipeline.update(
      { is_default: false },
      { where: { organization_id: req.tenancy.organization_id } }
    );

    // Set this as default
    await pipeline.update({ is_default: true });

    res.json({
      message: 'Default pipeline set successfully',
      pipeline
    });
  } catch (error) {
    next(error);
  }
};

const deletePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (pipeline.is_default) {
      return res.status(400).json({ error: 'Cannot delete default pipeline' });
    }

    await pipeline.destroy();

    res.json({ message: 'Pipeline deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  setDefaultPipeline,
  deletePipeline
};
