/**
 * Test Utilities
 * Common utilities and helpers for testing React components
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock user data for testing
export const mockUser = {
  id: 'test_user_123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock auth state
export const mockAuthContext = {
  isSignedIn: true,
  userId: 'test_user_123',
  user: mockUser,
  signOut: vi.fn(),
  isLoaded: true,
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authState?: Partial<typeof mockAuthContext>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    initialEntries = ['/'],
    authState = mockAuthContext,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock Firebase services
export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test_user_123',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
};

export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        exists: true,
        data: () => ({ name: 'Test Data' }),
      })),
      set: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      onSnapshot: vi.fn(),
    })),
    add: vi.fn(() => Promise.resolve({ id: 'test_doc_id' })),
    where: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        docs: [
          {
            id: 'test_doc_1',
            data: () => ({ name: 'Test Doc 1' }),
          },
        ],
      })),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        docs: [],
      })),
    })),
    limit: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        docs: [],
      })),
    })),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({
      exists: true,
      data: () => ({ name: 'Test Data' }),
    })),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  })),
  runTransaction: vi.fn(),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
};

// Mock room data
export const mockRoom = {
  id: 'test_room_123',
  name: 'Test Study Room',
  description: 'A test room for studying',
  createdBy: 'test_user_123',
  members: ['test_user_123'],
  isActive: true,
  settings: {
    maxMembers: 5,
    isPublic: true,
    allowChat: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock session data
export const mockSession = {
  id: 'test_session_123',
  roomId: 'test_room_123',
  duration: 1500, // 25 minutes
  type: 'focus',
  startTime: new Date().toISOString(),
  participants: ['test_user_123'],
  isActive: true,
};

// Mock notification data
export const mockNotification = {
  id: 'test_notification_123',
  userId: 'test_user_123',
  type: 'room_invite',
  title: 'Room Invitation',
  message: 'You have been invited to join a study room',
  isRead: false,
  createdAt: new Date().toISOString(),
  data: {
    roomId: 'test_room_123',
    roomName: 'Test Study Room',
  },
};

// Test data factories
export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
});

export const createMockRoom = (overrides: Partial<typeof mockRoom> = {}) => ({
  ...mockRoom,
  ...overrides,
});

export const createMockSession = (overrides: Partial<typeof mockSession> = {}) => ({
  ...mockSession,
  ...overrides,
});

export const createMockNotification = (overrides: Partial<typeof mockNotification> = {}) => ({
  ...mockNotification,
  ...overrides,
});

// Mock API responses
export const mockApiResponses = {
  createRoom: {
    success: true,
    data: mockRoom,
  },
  joinRoom: {
    success: true,
    message: 'Successfully joined room',
  },
  leaveRoom: {
    success: true,
    message: 'Successfully left room',
  },
  startSession: {
    success: true,
    data: mockSession,
  },
  endSession: {
    success: true,
    message: 'Session ended successfully',
  },
  error: {
    success: false,
    error: 'Something went wrong',
    message: 'An error occurred',
  },
};

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to simulate user interactions
export const simulateUserAction = async (action: () => void | Promise<void>) => {
  await action();
  await waitFor(0); // Allow React to process state updates
};

// Mock performance timing
export const mockPerformanceTiming = {
  navigationStart: 1000,
  fetchStart: 1100,
  domainLookupStart: 1200,
  domainLookupEnd: 1250,
  connectStart: 1250,
  connectEnd: 1300,
  requestStart: 1300,
  responseStart: 1400,
  responseEnd: 1500,
  domLoading: 1500,
  domInteractive: 1800,
  domContentLoadedEventStart: 1900,
  domContentLoadedEventEnd: 1950,
  loadEventStart: 2000,
  loadEventEnd: 2100,
};

// Mock intersection observer entries
export const createMockIntersectionObserverEntry = (isIntersecting: boolean = true) => ({
  isIntersecting,
  intersectionRatio: isIntersecting ? 1 : 0,
  target: document.createElement('div'),
  boundingClientRect: {
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
  },
  intersectionRect: {
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
  },
  rootBounds: {
    top: 0,
    left: 0,
    bottom: 800,
    right: 1200,
    width: 1200,
    height: 800,
  },
  time: Date.now(),
});

// Helper to test error boundaries
export const ThrowError = ({ shouldThrow = false }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Export everything for easy imports
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { vi } from 'vitest';