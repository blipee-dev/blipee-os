// ESM Mock for @supabase/supabase-js
const mockAuth = {
  getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signInWithOAuth: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  signUp: jest.fn(() => Promise.resolve({ data: null, error: null })),
  updateUser: jest.fn(() => Promise.resolve({ data: null, error: null })),
  resetPasswordForEmail: jest.fn(() => Promise.resolve({ data: null, error: null })),
  onAuthStateChange: jest.fn(() => ({ 
    data: { subscription: { unsubscribe: jest.fn() } } 
  }))
};

const mockFrom = jest.fn((table) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
  throwOnError: jest.fn().mockReturnThis(),
  then: jest.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb))
}));

const mockStorage = {
  from: jest.fn((bucket) => ({
    upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
    download: jest.fn(() => Promise.resolve({ data: null, error: null })),
    remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } }))
  }))
};

const mockRealtime = {
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => 'subscribed'),
    unsubscribe: jest.fn()
  }))
};

export const createClient = jest.fn(() => ({
  auth: mockAuth,
  from: mockFrom,
  storage: mockStorage,
  realtime: mockRealtime,
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  functions: {
    invoke: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }
}));

export default { createClient };