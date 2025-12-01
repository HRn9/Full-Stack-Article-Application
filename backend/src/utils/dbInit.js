const { sequelize } = require('../models');

/**
 * Initialize database connection and test it
 */
async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    return true;
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error.message);
    throw error;
  }
}

/**
 * Sync all models with database (use with caution in production)
 * This is mainly for development purposes
 */
async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('✓ Database synchronized successfully');
  } catch (error) {
    console.error('✗ Error synchronizing database:', error.message);
    throw error;
  }
}

/**
 * Close database connection gracefully
 */
async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error closing database connection:', error.message);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  syncDatabase,
  closeDatabase,
  sequelize,
};
