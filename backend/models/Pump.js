const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Pump = sequelize.define('Pump', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  waitTime: {
    type: DataTypes.STRING,
    defaultValue: '10-15 mins'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  openTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  closeTime: {
    type: DataTypes.TIME,
    allowNull: false
  }
});

module.exports = Pump; 