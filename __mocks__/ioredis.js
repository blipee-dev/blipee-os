// Mock for ioredis
class Redis {
  constructor(options) {
    this.options = options;
    this.data = new Map();
    this.connected = true;
    
    // Basic Redis commands
    this.get = jest.fn(async (key) => this.data.get(key) || null);
    this.set = jest.fn(async (key, value) => {
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
    
    // Connection commands
    this.ping = jest.fn(async () => 'PONG');
    this.quit = jest.fn(async () => {
      this.connected = false;
      return 'OK';
    });
    this.disconnect = jest.fn(() => {
      this.connected = false;
    });
    
    // Event emitter
    this.on = jest.fn();
    this.off = jest.fn();
    this.emit = jest.fn();
    
    // Pipeline/Multi
    this.pipeline = jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn(async () => [[null, 'OK']]),
    }));
    
    this.multi = jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn(async () => [[null, 'OK']]),
    }));
  }
}

// Cluster support
Redis.Cluster = class Cluster extends Redis {
  constructor(nodes, options) {
    super(options);
    this.nodes = nodes;
  }
};

module.exports = Redis;
module.exports.default = Redis;