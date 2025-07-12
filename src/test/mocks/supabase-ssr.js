// ESM Mock for @supabase/ssr
export const createServerClient = jest.fn((url, anonKey, options) => {
  const mockCookies = new Map();
  
  return {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      updateUser: jest.fn(() => Promise.resolve({ data: null, error: null }))
    },
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        download: jest.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file' } }))
      }))
    }
  };
});

export const createBrowserClient = jest.fn((url, anonKey) => ({
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: jest.fn(() => ({ 
      data: { subscription: { unsubscribe: jest.fn() } } 
    }))
  },
  from: jest.fn((table) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    then: jest.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb))
  }))
}));