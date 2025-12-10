require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const emailReceiver = require('./src/utils/emailReceiver');

const PORT = process.env.PORT || 5000;

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models - only sync new tables, don't alter existing ones
    if (process.env.NODE_ENV === 'development') {
      // IMPORTANT: First time after adding new columns, you may need to:
      // 1. Drop the activities table manually: DROP TABLE activities;
      // 2. Or run: await sequelize.sync({ force: true }); (WARNING: deletes all data)
      // 3. Then change back to: await sequelize.sync({ alter: true });
      
      // For now, skip sync if it fails - you'll need to manually update the DB
      try {
        await sequelize.sync({ alter: true });
        logger.info('Database models synchronized');
      } catch (syncError) {
        logger.warn('Database sync failed. Please manually update the database schema.');
        logger.warn('See migrations folder for SQL scripts.');
        logger.warn(syncError.message);
      }
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Initialize email receiver to check for incoming emails
      emailReceiver.initialize();
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  emailReceiver.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  emailReceiver.stop();
  process.exit(0);
});
