
import { createClient } from 'redis';
import { promisify } from 'util'

// client.on()
class RedisClient {

  constructor() {
    this.client = createClient({connected: true});
    this.isConnected = false;
    this.client.on('error', (error) => {
      this.isConnected = false;
      console.log(`${error.message}`);
    });
    this.client.on('connect', async () => {
      this.isConnected = true
      });
  }

  isAlive = () => this.isConnected;
    // setTimeout(() => {
    //   return this.isConnected
    // }, 1000);

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    return await getAsync(key);
  }

  async set(key, value, duration) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    return await setAsync(key, duration, value);
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    return await delAsync(key);
  }
}

export default new RedisClient();