const logger = require('../utils/logger');

// Role hierarchy and permissions
const ROLES = {
  super_admin: {
    level: 100,
    permissions: ['*'], // All permissions
    description: 'Super Administrator - Full system access'
  },
  admin: {
    level: 90,
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
      'deals.create', 'deals.read', 'deals.update', 'deals.delete',
      'activities.create', 'activities.read', 'activities.update', 'activities.delete',
      'reports.read', 'reports.export',
      'settings.read', 'settings.update',
      'organization.update'
    ],
    description: 'Administrator - Full access to all data and settings'
  },
  manager: {
    level: 70,
    permissions: [
      'users.read',
      'contacts.create', 'contacts.read', 'contacts.update',
      'deals.create', 'deals.read', 'deals.update', 'deals.assign',
      'activities.create', 'activities.read', 'activities.update',
      'reports.read', 'reports.export',
      'team.view_performance'
    ],
    description: 'Manager - View all data, assign leads, view reports'
  },
  sales_agent: {
    level: 50,
    permissions: [
      'contacts.create', 'contacts.read.own', 'contacts.update.own',
      'deals.create', 'deals.read.own', 'deals.update.own',
      'activities.create', 'activities.read.own', 'activities.update.own',
      'reports.read.own'
    ],
    description: 'Sales Agent - Manage own clients and deals'
  },
  support: {
    level: 40,
    permissions: [
      'contacts.read', 'contacts.read.assigned',
      'activities.create', 'activities.read', 'activities.update.assigned',
      'tickets.create', 'tickets.read', 'tickets.update',
      'customers.read.assigned'
    ],
    description: 'Support - Handle customer tickets and assigned customers'
  },
  read_only: {
    level: 10,
    permissions: [
      'contacts.read', 'deals.read', 'activities.read', 'reports.read'
    ],
    description: 'Read Only - View data only, no editing'
  }
};

// Check if user has permission
const hasPermission = (userRole, requiredPermission, userPermissions = {}) => {
  const role = ROLES[userRole];
  
  if (!role) {
    return false;
  }

  // Super admin has all permissions
  if (userRole === 'super_admin' || role.permissions.includes('*')) {
    return true;
  }

  // Check custom user permissions first
  if (userPermissions && userPermissions[requiredPermission] === true) {
    return true;
  }

  if (userPermissions && userPermissions[requiredPermission] === false) {
    return false;
  }

  // Check role permissions
  return role.permissions.includes(requiredPermission);
};

// Middleware to check permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission, req.user.permissions)) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        role: req.user.role,
        permission,
        path: req.path
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        role: req.user.role
      });
    }

    next();
  };
};

// Middleware to check role level
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Role check failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required_roles: allowedRoles,
        your_role: req.user.role
      });
    }

    next();
  };
};

// Middleware to check minimum role level
const requireRoleLevel = (minimumLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = ROLES[req.user.role];
    if (!userRole || userRole.level < minimumLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        minimum_level: minimumLevel,
        your_level: userRole?.level || 0
      });
    }

    next();
  };
};

// Check if user owns the resource or has higher permissions
const checkOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = ROLES[req.user.role];
    
    // Super admin, admin, and manager can access all resources
    if (['super_admin', 'admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    // Check if user owns the resource
    if (req.user.id === resourceUserId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'You can only access your own resources'
    });
  };
};

// Middleware to filter queries based on role
const applyRoleFilter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userRole = req.user.role;

  // Super admin, admin, and manager can see all data
  if (['super_admin', 'admin', 'manager'].includes(userRole)) {
    req.roleFilter = {}; // No filter
  } 
  // Sales agents can only see their own data
  else if (userRole === 'sales_agent') {
    req.roleFilter = { 
      user_id: req.user.id,
      owner_id: req.user.id
    };
  }
  // Support can see assigned data
  else if (userRole === 'support') {
    req.roleFilter = { 
      assigned_to: req.user.id
    };
  }
  // Read-only can see all but not modify
  else if (userRole === 'read_only') {
    req.roleFilter = {};
  }
  else {
    req.roleFilter = { user_id: req.user.id };
  }

  next();
};

// Get role information
const getRoleInfo = (roleName) => {
  return ROLES[roleName] || null;
};

// Get all available roles
const getAllRoles = () => {
  return Object.keys(ROLES).map(key => ({
    value: key,
    label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    level: ROLES[key].level,
    description: ROLES[key].description,
    permissions: ROLES[key].permissions
  }));
};

module.exports = {
  ROLES,
  hasPermission,
  requirePermission,
  requireRole,
  requireRoleLevel,
  checkOwnership,
  applyRoleFilter,
  getRoleInfo,
  getAllRoles
};
