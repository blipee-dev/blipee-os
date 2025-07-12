// Comprehensive mocks for all external dependencies

// Mock Supabase Client
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
    count: jest.fn().mockResolvedValue({ count: 0, error: null }),
  })),
  storage: {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file' } }),
    })),
  },
  realtime: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockReturnThis(),
    }),
  },
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock Redis Client
export const mockRedisClient = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([]),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  incr: jest.fn().mockResolvedValue(1),
  decr: jest.fn().mockResolvedValue(0),
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(1),
  hdel: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({}),
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  sismember: jest.fn().mockResolvedValue(0),
  zadd: jest.fn().mockResolvedValue(1),
  zrem: jest.fn().mockResolvedValue(1),
  zrange: jest.fn().mockResolvedValue([]),
  zrevrange: jest.fn().mockResolvedValue([]),
  flushdb: jest.fn().mockResolvedValue('OK'),
  quit: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

// Mock OpenAI Client
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'test-completion',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Test response',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    },
  },
  embeddings: {
    create: jest.fn().mockResolvedValue({
      object: 'list',
      data: [{
        object: 'embedding',
        embedding: Array(1536).fill(0),
        index: 0,
      }],
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: 8,
        total_tokens: 8,
      },
    }),
  },
};

// Mock Anthropic Client
export const mockAnthropicClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      id: 'test-message',
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: 'Test response',
      }],
      model: 'claude-3-opus-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    }),
  },
};

// Mock DeepSeek Client
export const mockDeepSeekClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'test-deepseek',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Test response',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    },
  },
};

// Mock crypto for encryption
export const mockCrypto = {
  randomBytes: jest.fn((size: number) => Buffer.alloc(size)),
  createCipheriv: jest.fn(() => ({
    update: jest.fn().mockReturnValue(Buffer.from('encrypted')),
    final: jest.fn().mockReturnValue(Buffer.from('final')),
    getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag')),
  })),
  createDecipheriv: jest.fn(() => ({
    setAuthTag: jest.fn(),
    update: jest.fn().mockReturnValue(Buffer.from('decrypted')),
    final: jest.fn().mockReturnValue(Buffer.from('final')),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed'),
  })),
  pbkdf2Sync: jest.fn().mockReturnValue(Buffer.from('derived-key')),
  scryptSync: jest.fn().mockReturnValue(Buffer.from('derived-key')),
};

// Mock fetch for API calls
export const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  blob: jest.fn().mockResolvedValue(new Blob()),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  formData: jest.fn().mockResolvedValue(new FormData()),
  clone: jest.fn(),
});

// Mock WebSocket
export class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  close() {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  send(data: string | ArrayBuffer | Blob) {
    // Mock send
  }

  addEventListener(type: string, listener: EventListener) {
    // Mock addEventListener
  }

  removeEventListener(type: string, listener: EventListener) {
    // Mock removeEventListener
  }
}

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Mock Next.js headers
export const mockHeaders = {
  get: jest.fn((key: string) => null),
  has: jest.fn((key: string) => false),
  set: jest.fn(),
  delete: jest.fn(),
  entries: jest.fn().mockReturnValue([]),
  forEach: jest.fn(),
  keys: jest.fn().mockReturnValue([]),
  values: jest.fn().mockReturnValue([]),
};

// Mock Next.js cookies
export const mockCookies = {
  get: jest.fn((key: string) => null),
  getAll: jest.fn().mockReturnValue([]),
  has: jest.fn((key: string) => false),
  set: jest.fn(),
  delete: jest.fn(),
};