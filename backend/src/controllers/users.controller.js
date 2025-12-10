const { User } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { ROLES, getRoleInfo, getAllRoles } = require('../middlewares/rbac.middleware');

// Get all users (admin/super_admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { organization_id: req.user.organization_id };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.is_active = status === 'active';
    }

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: {
        id,
        organization_id: req.user.organization_id
      },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user (admin/super_admin only)
const createUser = async (req, res) => {
  try {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      role = 'sales_agent',
      phone,
      permissions = {}
    } = req.body;

    // Validation
    if (!email || !password_hash || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ 
      where: { 
        email,
        organization_id: req.user.organization_id 
      } 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Validate role
    if (!ROLES[role]) {
      return res.status(400).json({ 
        error: 'Invalid role',
        available_roles: Object.keys(ROLES)
      });
    }

    // Only super_admin can create super_admin
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super administrators can create super admin accounts' 
      });
    }

    // Only super_admin and admin can create admin
    if (role === 'admin' && !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Only administrators can create admin accounts' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    // Create user
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      role,
      phone,
      permissions,
      organization_id: req.user.organization_id,
      created_by: req.user.id,
      is_active: true
    });

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info('User created', {
      userId: user.id,
      email: user.email,
      role: user.role,
      createdBy: req.user.id
    });

    res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      role,
      permissions,
      is_active
    } = req.body;

    const user = await User.findOne({
      where: {
        id,
        organization_id: req.user.organization_id
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if trying to modify own role
    if (role && user.id === req.user.id) {
      return res.status(403).json({ 
        error: 'You cannot modify your own role' 
      });
    }

    // Role change restrictions
    if (role && role !== user.role) {
      if (!ROLES[role]) {
        return res.status(400).json({ 
          error: 'Invalid role',
          available_roles: Object.keys(ROLES)
        });
      }

      // Only super_admin can change to/from super_admin
      if ((role === 'super_admin' || user.role === 'super_admin') && req.user.role !== 'super_admin') {
        return res.status(403).json({ 
          error: 'Only super administrators can modify super admin roles' 
        });
      }

      // Only super_admin and admin can change to/from admin
      if ((role === 'admin' || user.role === 'admin') && !['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Only administrators can modify admin roles' 
        });
      }
    }

    // Update fields
    const updates = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (role) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (is_active !== undefined) updates.is_active = is_active;

    await user.update(updates);

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    logger.info('User updated', {
      userId: user.id,
      updatedBy: req.user.id,
      changes: Object.keys(updates)
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters' 
      });
    }

    const user = await User.findOne({
      where: {
        id,
        organization_id: req.user.organization_id
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If changing own password, verify current password
    if (user.id === req.user.id) {
      if (!current_password) {
        return res.status(400).json({ 
          error: 'Current password is required' 
        });
      }

      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } 
    // If admin changing another user's password
    else {
      if (!['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'You can only change your own password' 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashedPassword });

    logger.info('Password changed', {
      userId: user.id,
      changedBy: req.user.id
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Delete user (super_admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ 
        error: 'You cannot delete your own account' 
      });
    }

    const user = await User.findOne({
      where: {
        id,
        organization_id: req.user.organization_id
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only super_admin can delete super_admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super administrators can delete super admin accounts' 
      });
    }

    await user.destroy();

    logger.info('User deleted', {
      userId: user.id,
      email: user.email,
      deletedBy: req.user.id
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get available roles
const getRoles = async (req, res) => {
  try {
    const roles = getAllRoles();

    // Filter roles based on current user's permissions
    let availableRoles = roles;
    
    if (req.user.role !== 'super_admin') {
      availableRoles = roles.filter(r => r.value !== 'super_admin');
    }

    if (!['super_admin', 'admin'].includes(req.user.role)) {
      availableRoles = roles.filter(r => !['super_admin', 'admin'].includes(r.value));
    }

    res.json(availableRoles);
  } catch (error) {
    logger.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getRoles,
  getCurrentUser
};
