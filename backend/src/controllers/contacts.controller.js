const { Contact, User } = require('../models');
const { Op } = require('sequelize');

const getContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, owner_id, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { organization_id: req.tenancy.organization_id };

    if (status) {
      where.status = status;
    }

    if (owner_id) {
      where.owner_id = owner_id;
    }

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'email'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      contacts: rows,
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

const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      },
      include: [{ model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name', 'email'] }]
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    next(error);
  }
};

const createContact = async (req, res, next) => {
  try {
    const contactData = {
      ...req.body,
      organization_id: req.tenancy.organization_id,
      owner_id: req.body.owner_id || req.user.id
    };

    const contact = await Contact.create(contactData);

    res.status(201).json({
      message: 'Contact created successfully',
      contact
    });
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.update(req.body);

    res.json({
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: req.params.id,
        organization_id: req.tenancy.organization_id
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.destroy();

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
};
