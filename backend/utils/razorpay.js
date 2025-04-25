const logger = require('./logger');

// Mock Razorpay implementation for development
const mockRazorpay = {
  orders: {
    create: async (options) => ({
      id: `order_${Date.now()}`,
      amount: options.amount,
      currency: options.currency
    })
  }
};

// Use mock implementation in development, real Razorpay in production
const razorpay = process.env.NODE_ENV === 'development' ? mockRazorpay : require('razorpay')({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (amount, currency = 'INR') => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    logger.error('Razorpay order creation error:', error);
    throw new Error('Payment initialization failed');
  }
};

const verifyPayment = (razorpayOrderId, razorpayPaymentId, signature) => {
  // In development, always return true
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = {
  razorpay,
  createOrder,
  verifyPayment
}; 