const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { ensureTenancy } = require('../middlewares/tenancy.middleware');

const authRoutes = require('./auth.routes');
const contactsRoutes = require('./contacts.routes');
const dealsRoutes = require('./deals.routes');
const activitiesRoutes = require('./activities.routes');
const pipelinesRoutes = require('./pipelines.routes');
const dashboardRoutes = require('./dashboard.routes');
const emailRoutes = require('./email.routes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication and tenancy)
router.use('/contacts', authenticateToken, ensureTenancy, contactsRoutes);
router.use('/deals', authenticateToken, ensureTenancy, dealsRoutes);
router.use('/activities', authenticateToken, ensureTenancy, activitiesRoutes);
router.use('/pipelines', authenticateToken, ensureTenancy, pipelinesRoutes);
router.use('/dashboard', authenticateToken, ensureTenancy, dashboardRoutes);
router.use('/email', authenticateToken, ensureTenancy, emailRoutes);

module.exports = router;
