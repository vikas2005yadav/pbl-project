const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Connect to database without syncing models (we use database.js for schema)
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL database connection established successfully.');
    
    // Don't sync models since we're handling schema with database.js
    // await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB }; 