// ESM Mock for ioredis
class MockRedis {
  constructor(config) {
    this.config = config;
    this.data = new Map();
    this.connected = true;
    
    // Basic Redis commands
    this.get = jest.fn(async (key) => this.data.get(key) || null);
    this.set = jest.fn(async (key, value, ...args) => {
      this.data.set(key, value);
      return 'OK';
    });
    this.setex = jest.fn(async (key, seconds, value) => {
      this.data.set(key, value);
      return 'OK';
    });
    this.del = jest.fn(async (...keys) => {
      let deleted = 0;
      keys.forEach(key => {
        if (this.data.has(key)) {
          this.data.delete(key);
          deleted++;
        }
      });
      return deleted;
    });
    this.exists = jest.fn(async (key) => this.data.has(key) ? 1 : 0);
    this.expire = jest.fn(async (key, seconds) => 1);
    this.ttl = jest.fn(async (key) => this.data.has(key) ? 60 : -2);
    this.keys = jest.fn(async (pattern) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Array.from(this.data.keys()).filter(key => regex.test(key));
    });
    
    // Hash commands
    this.hset = jest.fn(async (key, field, value) => {
      const hash = this.data.get(key) || {};
      hash[field] = value;
      this.data.set(key, hash);
      return 1;
    });
    this.hget = jest.fn(async (key, field) => {
      const hash = this.data.get(key);
      return hash ? hash[field] : null;
    });
    this.hgetall = jest.fn(async (key) => this.data.get(key) || {});
    this.hdel = jest.fn(async (key, ...fields) => {
      const hash = this.data.get(key);
      if (!hash) return 0;
      let deleted = 0;
      fields.forEach(field => {
        if (field in hash) {
          delete hash[field];
          deleted++;
        }
      });
      return deleted;
    });
    
    // List commands
    this.lpush = jest.fn(async (key, ...values) => {
      const list = this.data.get(key) || [];
      list.unshift(...values);
      this.data.set(key, list);
      return list.length;
    });
    this.rpush = jest.fn(async (key, ...values) => {
      const list = this.data.get(key) || [];
      list.push(...values);
      this.data.set(key, list);
      return list.length;
    });
    this.lrange = jest.fn(async (key, start, stop) => {
      const list = this.data.get(key) || [];
      if (stop === -1) stop = list.length - 1;
      return list.slice(start, stop + 1);
    });
    
    // Connection commands
    this.ping = jest.fn(async () => 'PONG');
    this.quit = jest.fn(async () => {
      this.connected = false;
      return 'OK';
    });
    this.disconnect = jest.fn(() => {
      this.connected = false;
    });
    
    // Pipeline/Multi
    this.pipeline = jest.fn(() => this);
    this.multi = jest.fn(() => this);
    this.exec = jest.fn(async () => []);
    
    // Pub/Sub
    this.publish = jest.fn(async (channel, message) => 0);
    this.subscribe = jest.fn(async (...channels) => {});
    this.on = jest.fn();
    
    // Cluster
    this.cluster = jest.fn(() => this);
  }
}

export default MockRedis;
export { MockRedis as Redis };