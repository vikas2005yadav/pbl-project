const Redis = require('redis');
const logger = require('./logger');

const redisClient = Redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD
});

redisClient.connect().catch(console.error);

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

const setCache = async (key, value, expiration = DEFAULT_EXPIRATION) => {
  try {
    await redisClient.setEx(key, expiration, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis set error:', error);
  }
};

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis delete error:', error);
  }
};

const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Redis clear error:', error);
  }
};

module.exports = {
  redisClient,
  setCache,
  getCache,
  deleteCache,
  clearCache
}; 