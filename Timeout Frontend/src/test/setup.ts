import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Mock environment variables for testing
  vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_mock_key');
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'mock_api_key');
  vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'mock-project.firebaseapp.com');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'mock-project');
  vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'mock-project.appspot.com');
  vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
  vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef123456');
  
  // Mock Firebase
  vi.mock('../config/firebase', () => ({
    auth: {},
    db: {},
    app: {},
  }));

  // Mock Clerk
  vi.mock('@clerk/clerk-react', () => ({
    useAuth: () => ({
      isSignedIn: true,
      userId: 'test_user_123',
      signOut: vi.fn(),
    }),
    useUser: () => ({
      user: {
        id: 'test_user_123',
        firstName: 'Test',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      },
    }),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
    SignIn: () => <div data-testid="sign-in">Sign In Mock</div>,
    SignUp: () => <div data-testid="sign-up">Sign Up Mock</div>,
    UserButton: () => <div data-testid="user-button">User Button Mock</div>,
  }));

  // Mock performance APIs
  Object.defineProperty(window, 'performance', {
    value: {
      ...window.performance,
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
      now: () => Date.now(),
      mark: vi.fn(),
      measure: vi.fn(),
    },
  });

  // Mock PerformanceObserver
  global.PerformanceObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  // Mock fetch
  global.fetch = vi.fn();

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  });

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });

  // Mock CSS.supports for CSS feature detection
  Object.defineProperty(window, 'CSS', {
    value: {
      supports: vi.fn().mockReturnValue(true),
    },
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Custom matchers for testing
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeInTheDocument(): T;
      toHaveClass(className: string): T;
      toHaveStyle(style: string | object): T;
      toBeVisible(): T;
      toBeDisabled(): T;
      toHaveValue(value: string | number): T;
    }
  }
}