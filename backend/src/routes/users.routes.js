const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/rbac.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get current user profile (all authenticated users)
router.get('/me', usersController.getCurrentUser);

// Get available roles
router.get('/roles', usersController.getRoles);

// Get all users (admin and super_admin only)
router.get('/', 
  requireRole('super_admin', 'admin', 'manager'),
  usersController.getAllUsers
);

// Get single user
router.get('/:id', 
  requirePermission('users.read'),
  usersController.getUserById
);

// Create new user (admin and super_admin only)
router.post('/', 
  requirePermission('users.create'),
  usersController.createUser
);

// Update user
router.put('/:id', 
  requirePermission('users.update'),
  usersController.updateUser
);

// Change password
router.put('/:id/password', 
  usersController.changePassword
);

// Delete user (super_admin only)
router.delete('/:id', 
  requireRole('super_admin'),
  usersController.deleteUser
);

module.exports = router;
