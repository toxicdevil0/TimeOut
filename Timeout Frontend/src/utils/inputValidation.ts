/**
 * Input Validation & Sanitization Utilities
 * Comprehensive security utilities for preventing XSS, injection attacks, and malicious input
 */

import DOMPurify from 'dompurify';
import validator from 'validator';

// Configure DOMPurify for React environment
const purify = DOMPurify(window);

// Configure strict sanitization for user input
const SANITIZE_CONFIG = {
  // Allow basic formatting tags only
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

// Configure very strict sanitization for dangerous contexts
const STRICT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string, strict = false): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const config = strict ? STRICT_SANITIZE_CONFIG : SANITIZE_CONFIG;
  return purify.sanitize(input, config);
};

/**
 * Sanitize text content (strip all HTML)
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return purify.sanitize(input, STRICT_SANITIZE_CONFIG);
};

/**
 * Validate and sanitize user input for different contexts
 */
export const InputValidator = {
  
  /**
   * Validate and sanitize display name
   */
  displayName: (input: string): { isValid: boolean; sanitized: string; errors: string[] } => {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('Display name is required');
      return { isValid: false, sanitized: '', errors };
    }
    
    const trimmed = input.trim();
    
    if (trimmed.length < 2) {
      errors.push('Display name must be at least 2 characters');
    }
    
    if (trimmed.length > 50) {
      errors.push('Display name must be less than 50 characters');
    }
    
    if (!validator.isAlphanumeric(trimmed, 'en-US', { ignore: ' -_.' })) {
      errors.push('Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods');
    }
    
    const sanitized = sanitizeText(trimmed);
    
    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  },

  /**
   * Validate and sanitize email
   */
  email: (input: string): { isValid: boolean; sanitized: string; errors: string[] } => {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('Email is required');
      return { isValid: false, sanitized: '', errors };
    }
    
    const trimmed = input.trim().toLowerCase();
    
    if (!validator.isEmail(trimmed)) {
      errors.push('Invalid email format');
    }
    
    const sanitized = sanitizeText(trimmed);
    
    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  },

  /**
   * Validate and sanitize room name
   */
  roomName: (input: string): { isValid: boolean; sanitized: string; errors: string[] } => {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('Room name is required');
      return { isValid: false, sanitized: '', errors };
    }
    
    const trimmed = input.trim();
    
    if (trimmed.length < 3) {
      errors.push('Room name must be at least 3 characters');
    }
    
    if (trimmed.length > 100) {
      errors.push('Room name must be less than 100 characters');
    }
    
    // Allow more characters for room names including emojis
    if (!/^[\w\s\-_.!?()[\]{}#@&*+="':;,.<>~`|\\\/\u{1F300}-\u{1F9FF}]+$/u.test(trimmed)) {
      errors.push('Room name contains invalid characters');
    }
    
    const sanitized = sanitizeText(trimmed);
    
    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  },

  /**
   * Validate and sanitize room description
   */
  roomDescription: (input: string): { isValid: boolean; sanitized: string; errors: string[] } => {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      // Description is optional
      return { isValid: true, sanitized: '', errors };
    }
    
    const trimmed = input.trim();
    
    if (trimmed.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    
    // Allow basic HTML formatting in descriptions but sanitize
    const sanitized = sanitizeHtml(trimmed, false);
    
    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  },

  /**
   * Validate study duration (in minutes)
   */
  studyDuration: (input: number | string): { isValid: boolean; sanitized: number; errors: string[] } => {
    const errors: string[] = [];
    
    const num = typeof input === 'string' ? parseInt(input, 10) : input;
    
    if (isNaN(num)) {
      errors.push('Study duration must be a number');
      return { isValid: false, sanitized: 0, errors };
    }
    
    if (num < 5) {
      errors.push('Study duration must be at least 5 minutes');
    }
    
    if (num > 480) { // 8 hours max
      errors.push('Study duration cannot exceed 8 hours (480 minutes)');
    }
    
    return {
      isValid: errors.length === 0,
      sanitized: Math.floor(num),
      errors
    };
  },

  /**
   * Validate file upload
   */
  fileUpload: (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }
    
    // Allowed image types for profile pictures
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, GIF, and WebP images are allowed');
    }
    
    // 5MB limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }
    
    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.(js|html|htm|php|asp|jsp)$/i,
      /[<>:"|?*]/,
      /^\./,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('File name contains invalid characters or suspicious extension');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Safe HTML rendering component props
 */
export interface SafeHtmlProps {
  content: string;
  allowBasicFormatting?: boolean;
  className?: string;
}

/**
 * Utility for safe innerHTML replacement in React
 * Use this instead of dangerouslySetInnerHTML
 */
export const createSafeHtml = (content: string, allowBasicFormatting = false) => {
  const sanitized = sanitizeHtml(content, !allowBasicFormatting);
  
  return {
    __html: sanitized
  };
};

/**
 * Validate URL for safety
 */
export const validateUrl = (url: string): { isValid: boolean; sanitized: string; errors: string[] } => {
  const errors: string[] = [];
  
  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, sanitized: '', errors };
  }
  
  const trimmed = url.trim();
  
  // Basic URL validation
  if (!validator.isURL(trimmed, {
    protocols: ['http', 'https'],
    require_protocol: true,
  })) {
    errors.push('Invalid URL format');
  }
  
  // Block dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    errors.push('Dangerous URL protocol detected');
  }
  
  const sanitized = sanitizeText(trimmed);
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};

/**
 * Rate limiting helper for input validation
 */
const rateLimitMap = new Map<string, number[]>();

export const rateLimitInput = (key: string, maxAttempts = 5, windowMs = 60000): boolean => {
  const now = Date.now();
  const attempts = rateLimitMap.get(key) || [];
  
  // Remove attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limited
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(key, recentAttempts);
  
  return true; // Allow
};

export default {
  sanitizeHtml,
  sanitizeText,
  InputValidator,
  createSafeHtml,
  validateUrl,
  rateLimitInput
};