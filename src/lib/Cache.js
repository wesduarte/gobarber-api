import Redis from 'ioredis';
import * as redis from '../config/redis';

class Cache {
  constructor() {
    this.redis = new Redis({
      host: redis.host,
      port: redis.port,
      keyPrefix: 'cache:',
    });
  }

  set(key, value) {
    return this.redis.set(key, JSON.stringify(value), 'EX', 60 * 60 * 24);
  }

  async get(key) {
    const cached = await this.redis.get(key);

    return cached ? JSON.parse(cached) : null;
  }

  invalidate(key) {
    return this.redis.del(key);
  }

  async invalidatePrefix(prefix) {
    const keys = await this.redis.keys(`cache:${prefix}:*`);

    console.log("TO AQUI", keys);
    const keysWithoutPrefix = keys.map(key => key.replace('cache:', ''));

    console.log("converti", keysWithoutPrefix);

    return keysWithoutPrefix.length > 0 ? this.redis.del([]) : null;
  }
}

export default new Cache();
