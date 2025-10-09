/**
 * Tests for Error Handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorHandler,
  AppError,
  ErrorCategory,
  ErrorSeverity,
  createNetworkError,
  createValidationError,
  createAuthError,
  createBusinessError,
  createAppError,
} from '../utils/errorHandler';

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock fetch
const mockFetch = vi.fn();

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    global.console = mockConsole as any;
    global.fetch = mockFetch;
    
    errorHandler = new ErrorHandler({
      enableReporting: false, // Disable reporting for tests
      maxRetries: 3,
      retryDelay: 100,
    });
  });

  describe('AppError', () => {
    it('should create app error with all properties', () => {
      const error = new AppError(
        'Test error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.HIGH,
        { field: 'email' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toEqual({ field: 'email' });
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(typeof error.id).toBe('string');
    });

    it('should have default values for optional properties', () => {
      const error = new AppError('Test error');

      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context).toEqual({});
    });
  });

  describe('Error Creation Helpers', () => {
    it('should create network error', () => {
      const error = createNetworkError('Failed to fetch', { url: '/api/test' });
      
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.message).toBe('Failed to fetch');
      expect(error.context).toEqual({ url: '/api/test' });
    });

    it('should create validation error', () => {
      const error = createValidationError('Invalid email', { field: 'email' });
      
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.message).toBe('Invalid email');
    });

    it('should create auth error', () => {
      const error = createAuthError('Unauthorized access');
      
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.message).toBe('Unauthorized access');
    });

    it('should create business error', () => {
      const error = createBusinessError('Room is full');
      
      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.message).toBe('Room is full');
    });
  });

  describe('Error Handling', () => {
    it('should handle AppError', async () => {
      const error = new AppError('Test error', ErrorCategory.VALIDATION);
      
      await errorHandler.handleError(error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.any(Object)
      );
    });

    it('should handle regular Error', async () => {
      const error = new Error('Regular error');
      
      await errorHandler.handleError(error);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle string errors', async () => {
      await errorHandler.handleError('String error');
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle unknown error types', async () => {
      await errorHandler.handleError({ unknown: 'object' });
      
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let callCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await errorHandler.retryOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Permanent failure'));

      await expect(
        errorHandler.retryOperation(operation, 2, 10)
      ).rejects.toThrow('Permanent failure');
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Error Recovery', () => {
    it('should attempt recovery for recoverable errors', async () => {
      const error = new AppError(
        'Network error',
        ErrorCategory.NETWORK,
        ErrorSeverity.HIGH,
        {},
        true // recoverable
      );

      const recoveryFn = vi.fn().mockResolvedValue(true);
      const handleResult = await errorHandler.handleError(error, recoveryFn);

      expect(handleResult).toBe(true);
      expect(recoveryFn).toHaveBeenCalled();
    });

    it('should not attempt recovery for non-recoverable errors', async () => {
      const error = new AppError(
        'Validation error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        {},
        false // not recoverable
      );

      const recoveryFn = vi.fn();
      await errorHandler.handleError(error, recoveryFn);

      expect(recoveryFn).not.toHaveBeenCalled();
    });
  });

  describe('Error Reporting', () => {
    it('should report errors when enabled', async () => {
      const reportingHandler = new ErrorHandler({
        enableReporting: true,
        reportingEndpoint: '/api/errors',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const error = new AppError('Test error', ErrorCategory.NETWORK);
      await reportingHandler.handleError(error);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test error'),
        })
      );
    });

    it('should handle reporting failures gracefully', async () => {
      const reportingHandler = new ErrorHandler({
        enableReporting: true,
        reportingEndpoint: '/api/errors',
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const error = new AppError('Test error');
      
      // Should not throw even if reporting fails
      await expect(reportingHandler.handleError(error)).resolves.toBeUndefined();
    });
  });

  describe('Global Error Handlers', () => {
    it('should install global error handlers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      errorHandler.installGlobalHandlers();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  describe('User Feedback', () => {
    it('should show user-friendly messages for different error types', async () => {
      const showToastSpy = vi.fn();
      const feedbackHandler = new ErrorHandler({
        userFeedback: {
          showToast: showToastSpy,
        },
      });

      const networkError = createNetworkError('Connection failed');
      await feedbackHandler.handleError(networkError);

      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('connection'),
        'error'
      );
    });
  });
});