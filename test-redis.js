require('dotenv').config();
const redisHelper = require('./src/helper/redis.helper');

async function testRedis() {
  try {
    console.log('Connecting to Redis at', process.env.REDIS_HOST + ':' + process.env.REDIS_PORT);
    
    await redisHelper.connect();
    console.log('✅ Redis connected successfully!');

    // Test set
    await redisHelper.set('test_key', { message: 'Hello Redis!' });
    console.log('✅ Set test_key');

    // Test get
    const data = await redisHelper.get('test_key');
    console.log('✅ Get test_key:', data);

    // Test exists
    const exists = await redisHelper.exists('test_key');
    console.log('✅ Key exists:', exists);

    // Cleanup
    await redisHelper.delete('test_key');
    console.log('✅ Deleted test_key');

    await redisHelper.disconnect();
    console.log('✅ Redis disconnected');
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  }
}

testRedis();
