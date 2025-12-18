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
const usersRoutes = require('./users.routes');
const socialIntegrationRoutes = require('./socialIntegration.routes');
const facebookRoutes = require('./facebook.routes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication and tenancy)
router.use('/contacts', authenticateToken, ensureTenancy, contactsRoutes);
router.use('/deals', authenticateToken, ensureTenancy, dealsRoutes);
router.use('/activities', authenticateToken, ensureTenancy, activitiesRoutes);
router.use('/pipelines', authenticateToken, ensureTenancy, pipelinesRoutes);
router.use('/dashboard', authenticateToken, ensureTenancy, dashboardRoutes);
router.use('/email', authenticateToken, ensureTenancy, emailRoutes);
router.use('/users', authenticateToken, ensureTenancy, usersRoutes);

// Social media routes (includes webhooks which need to be public)
router.use('/social-media', socialIntegrationRoutes);

// Facebook-specific routes (protected)
router.use('/facebook', authenticateToken, ensureTenancy, facebookRoutes);

module.exports = router;
