const User = require('./User');
const Pump = require('./Pump');
const Booking = require('./Booking');

// User-Booking relationship
User.hasMany(Booking, {
  foreignKey: 'userId',
  as: 'bookings'
});
Booking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Pump-Booking relationship
Pump.hasMany(Booking, {
  foreignKey: 'pumpId',
  as: 'bookings'
});
Booking.belongsTo(Pump, {
  foreignKey: 'pumpId',
  as: 'pump'
});

module.exports = {
  User,
  Pump,
  Booking
}; 