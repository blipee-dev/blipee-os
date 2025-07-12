// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { 
  mockSupabaseClient, 
  mockRedisClient, 
  mockOpenAIClient,
  mockAnthropicClient,
  mockDeepSeekClient,
  mockCrypto,
  mockFetch,
  MockWebSocket,
  mockRouter,
  mockHeaders,
  mockCookies
} from './src/test/setup/mocks';

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = mockFetch;
global.WebSocket = MockWebSocket;

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = 'test-password';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.OPENWEATHER_API_KEY = 'test-weather-key';
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.RATE_LIMIT_ENABLED = 'true';
process.env.NODE_ENV = 'test';

// Mock modules before they're imported
jest.mock('isows', () => ({
  WebSocket: MockWebSocket,
}));

jest.mock('ws', () => ({
  WebSocket: MockWebSocket,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  SupabaseClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => mockSupabaseClient),
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient);
});

// Redis mock removed - using ioredis instead

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => mockOpenAIClient),
  OpenAI: jest.fn().mockImplementation(() => mockOpenAIClient),
}));

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => mockAnthropicClient),
  Anthropic: jest.fn().mockImplementation(() => mockAnthropicClient),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  ...mockCrypto,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: () => mockHeaders,
  cookies: () => mockCookies,
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
}));

// Mock SimpleWebAuthn
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({
    challenge: 'test-challenge',
    rp: { name: 'Test', id: 'localhost' },
    user: { id: 'user-id', name: 'test@example.com', displayName: 'Test User' },
    pubKeyCredParams: [],
    timeout: 60000,
    attestation: 'none',
  }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credentialID: 'credential-id',
      credentialPublicKey: Buffer.from('public-key'),
      counter: 0,
    },
  }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({
    challenge: 'test-challenge',
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials: [],
  }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 1,
    },
  }),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    button: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    section: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <section {...rest}>{children}</section>;
    },
    main: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <main {...rest}>{children}</main>;
    },
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useInView: () => [null, true],
  useMotionValue: (initial) => ({
    get: () => initial,
    set: jest.fn(),
    subscribe: jest.fn(),
  }),
  useSpring: (initial) => ({
    get: () => initial,
    set: jest.fn(),
    subscribe: jest.fn(),
  }),
  useTransform: (value, input, output) => ({
    get: () => output[0],
    set: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  default: {
    sanitize: jest.fn((input) => {
      if (typeof input !== 'string') return input;
      // Simple HTML stripping for tests
      return input.replace(/<[^>]*>/g, '');
    }),
    setConfig: jest.fn(),
    isSupported: true,
  },
  DOMPurify: {
    sanitize: jest.fn((input) => {
      if (typeof input !== 'string') return input;
      // Simple HTML stripping for tests
      return input.replace(/<[^>]*>/g, '');
    }),
    setConfig: jest.fn(),
    isSupported: true,
  },
}));

// Mock isomorphic-dompurify
jest.mock('isomorphic-dompurify', () => {
  const sanitize = jest.fn((input, config) => {
    if (typeof input !== 'string') return input;
    // Simple HTML stripping for tests
    return input.replace(/<[^>]*>/g, '');
  });
  
  // Create DOMPurify object with sanitize method
  const DOMPurify = {
    sanitize,
    setConfig: jest.fn(),
    clearConfig: jest.fn(),
    isSupported: true,
    version: '2.0.0',
    removed: [],
    isValidAttribute: jest.fn(() => true),
    addHook: jest.fn(),
    removeHook: jest.fn(),
    removeHooks: jest.fn(),
    removeAllHooks: jest.fn(),
  };
  
  // Return as default export
  return {
    __esModule: true,
    default: DOMPurify,
  };
});

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Suppress console errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: You are using the simple'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});