// redisClient: small wrapper around Redis that tries to connect but does not make connection failures fatal.
// Exposes safe `get` and `set` helpers and `rawClient` when low-level access is needed.
const redis = require('redis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const client = redis.createClient({ url });

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connect failed (will continue without Redis):', err.message || err);
  }
})();

module.exports = {
  get: async (key) => {
    try {
      if (!client.isOpen) return null;
      return await client.get(key);
    } catch (err) {
      console.warn('Redis get failed:', err.message || err);
      return null;
    }
  },
  set: async (key, value, options) => {
    try {
      if (!client.isOpen) return null;
      if (options) return await client.set(key, value, options);
      return await client.set(key, value);
    } catch (err) {
      console.warn('Redis set failed:', err.message || err);
      return null;
    }
  },
  rawClient: client
};

