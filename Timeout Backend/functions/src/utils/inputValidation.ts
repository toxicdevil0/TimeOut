/**
 * Backend Input Validation & Sanitization Middleware
 * Comprehensive validation for Firebase Cloud Functions
 */

import Joi from 'joi';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Validation schemas for different data types
 */
export const ValidationSchemas = {
  
  // User data validation
  userProfile: Joi.object({
    displayName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z0-9\s\-_.]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
      }),
    
    email: Joi.string()
      .email()
      .max(320) // RFC 5321 limit
      .required(),
    
    role: Joi.string()
      .valid('student', 'teacher')
      .required(),
    
    preferences: Joi.object({
      notifications: Joi.boolean().default(true),
      theme: Joi.string().valid('light', 'dark', 'system').default('system'),
      language: Joi.string().length(2).default('en')
    }).optional()
  }),

  // Study room validation  
  studyRoom: Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .pattern(/^[\w\s\-_.!?()[\]{}#@&*+=":;,.<>~`|\\\/\u{1F300}-\u{1F9FF}]+$/u)
      .required()
      .messages({
        'string.pattern.base': 'Room name contains invalid characters'
      }),
    
    description: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow(''),
    
    visibility: Joi.string()
      .valid('public', 'private')
      .default('public'),
    
    maxParticipants: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10),
    
    studyDuration: Joi.number()
      .integer()
      .min(5) // 5 minutes minimum
      .max(480) // 8 hours maximum
      .required(),
    
    breakDuration: Joi.number()
      .integer()
      .min(1)
      .max(60)
      .default(10),
    
    tags: Joi.array()
      .items(
        Joi.string()
          .trim()
          .min(1)
          .max(20)
          .pattern(/^[a-zA-Z0-9\-_]+$/)
      )
      .max(10)
      .optional(),
    
    hostId: Joi.string()
      .required()
  }),

  // Session data validation
  studySession: Joi.object({
    roomId: Joi.string()
      .required(),
    
    userId: Joi.string()
      .required(),
    
    startTime: Joi.date()
      .iso()
      .required(),
    
    endTime: Joi.date()
      .iso()
      .greater(Joi.ref('startTime'))
      .optional(),
    
    duration: Joi.number()
      .integer()
      .min(1)
      .max(28800) // 8 hours in minutes
      .optional(),
    
    sessionType: Joi.string()
      .valid('study', 'break', 'focus')
      .default('study'),
    
    tokensEarned: Joi.number()
      .integer()
      .min(0)
      .max(1000)
      .default(0)
  }),

  // Token transaction validation
  tokenTransaction: Joi.object({
    userId: Joi.string()
      .required(),
    
    amount: Joi.number()
      .integer()
      .min(-1000)
      .max(1000)
      .required(),
    
    type: Joi.string()
      .valid('earned', 'spent', 'bonus', 'penalty', 'reward')
      .required(),
    
    description: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .required(),
    
    metadata: Joi.object({
      sessionId: Joi.string().optional(),
      roomId: Joi.string().optional(),
      achievementId: Joi.string().optional()
    }).optional()
  }),

  // Digital detox validation
  appRestriction: Joi.object({
    userId: Joi.string()
      .required(),
    
    appIdentifier: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z0-9\-_.]+$/)
      .required(),
    
    restrictionType: Joi.string()
      .valid('time_limit', 'block_completely', 'schedule_based')
      .required(),
    
    dailyLimitMinutes: Joi.number()
      .integer()
      .min(0)
      .max(1440) // 24 hours
      .when('restrictionType', {
        is: 'time_limit',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    
    blockedHours: Joi.array()
      .items(Joi.number().integer().min(0).max(23))
      .unique()
      .max(24)
      .when('restrictionType', {
        is: 'schedule_based', 
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    
    isActive: Joi.boolean()
      .default(true)
  })
};

/**
 * Validation middleware factory
 */
export const validateInput = (schema: Joi.ObjectSchema) => {
  return (data: any) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new HttpsError('invalid-argument', `Validation failed: ${errorMessage}`);
    }

    return value;
  };
};

/**
 * Sanitize string input to prevent injection attacks
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove potentially dangerous characters
    .replace(/[<>'"&]/g, '')
    // Remove SQL injection patterns
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|SCRIPT)\b)/gi, '')
    // Remove NoSQL injection patterns  
    .replace(/(\$where|\$regex|\$ne|\$gt|\$lt|\$in|\$nin)/gi, '')
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous protocols
    .replace(/(javascript|data|vbscript|file):/gi, 'blocked:');
};

/**
 * Validate Firebase document ID
 */
export const validateDocumentId = (docId: string): string => {
  if (!docId || typeof docId !== 'string') {
    throw new HttpsError('invalid-argument', 'Document ID is required');
  }

  // Firebase document ID constraints
  if (docId.length > 1500) {
    throw new HttpsError('invalid-argument', 'Document ID too long');
  }

  if (/^\./.test(docId) || /\.$/.test(docId)) {
    throw new HttpsError('invalid-argument', 'Document ID cannot start or end with a period');
  }

  if (/\//.test(docId)) {
    throw new HttpsError('invalid-argument', 'Document ID cannot contain forward slashes');
  }

  // Sanitize the ID
  return docId.replace(/[^\w\-_.]/g, '_');
};

/**
 * Validate and sanitize collection path
 */
export const validateCollectionPath = (path: string): string => {
  if (!path || typeof path !== 'string') {
    throw new HttpsError('invalid-argument', 'Collection path is required');
  }

  const sanitized = path.replace(/[^a-zA-Z0-9/_-]/g, '');
  
  if (!sanitized) {
    throw new HttpsError('invalid-argument', 'Invalid collection path');
  }

  return sanitized;
};

/**
 * Rate limiting for input validation
 */
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (userId: string, maxRequests = 100, windowMs = 60000): void => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove expired requests
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    throw new HttpsError('resource-exhausted', 'Too many requests. Please slow down.');
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
};

/**
 * Validate file upload data
 */
export const validateFileUpload = (fileData: {
  name: string;
  size: number;
  contentType: string;
}): void => {
  const { name, size, contentType } = fileData;
  
  // Validate file name
  if (!name || typeof name !== 'string') {
    throw new HttpsError('invalid-argument', 'File name is required');
  }
  
  if (name.length > 255) {
    throw new HttpsError('invalid-argument', 'File name too long');
  }
  
  // Check for dangerous file extensions
  const dangerousExtensions = /\.(exe|bat|cmd|scr|pif|com|js|html|htm|php|asp|jsp)$/i;
  if (dangerousExtensions.test(name)) {
    throw new HttpsError('invalid-argument', 'File type not allowed');
  }
  
  // Validate file size (5MB limit)
  if (!size || size > 5 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'File size must be less than 5MB');
  }
  
  // Validate content type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    throw new HttpsError('invalid-argument', 'Only JPEG, PNG, GIF, and WebP images are allowed');
  }
};

/**
 * Specific validation functions
 */
export const validateTokenTransaction = (data: any) => {
  const tokenTransactionSchema = Joi.object({
    tokenStats: Joi.object({
      totalTokens: Joi.number().integer().min(0).max(999999999).required(),
      availableTokens: Joi.number().integer().min(0).max(999999999).required(),
      todayTokens: Joi.number().integer().min(0).max(10000).required(),
      weeklyTokens: Joi.number().integer().min(0).max(70000).required(),
      currentStreak: Joi.number().integer().min(0).max(365).required(),
      longestStreak: Joi.number().integer().min(0).max(365).required(),
      rank: Joi.object({
        daily: Joi.number().integer().min(0).required(),
        weekly: Joi.number().integer().min(0).required(),
        allTime: Joi.number().integer().min(0).required()
      }).required(),
      achievements: Joi.array().items(Joi.string().max(50)).max(100).required()
    }).required(),
    
    transactions: Joi.array().items(
      Joi.object({
        id: Joi.string().max(50).required(),
        type: Joi.string().valid('earned', 'spent', 'penalty').required(),
        amount: Joi.number().integer().min(-10000).max(10000).required(),
        reason: Joi.string().max(200).required(),
        category: Joi.string().valid('focus', 'goal', 'streak', 'social', 'achievement', 'shop').required(),
        timestamp: Joi.alternatives().try(
          Joi.date().iso(),
          Joi.string().isoDate()
        ).required(),
        metadata: Joi.object({
          sessionId: Joi.string().max(50).optional(),
          duration: Joi.number().integer().min(0).max(28800).optional(),
          multiplier: Joi.number().min(0).max(10).optional()
        }).optional()
      })
    ).max(1000).required()
  });

  return validateInput(tokenTransactionSchema)(data);
};

export const validateCreateRoom = (data: any) => {
  // Custom schema for room creation that matches the expected input format
  const createRoomSchema = Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .pattern(/^[\w\s\-_.!?()[\]{}#@&*+=":;,.<>~`|\\\/\u{1F300}-\u{1F9FF}]+$/u)
      .required()
      .messages({
        'string.pattern.base': 'Room name contains invalid characters'
      }),
    
    description: Joi.string()
      .trim()
      .max(500)
      .default('')
      .allow(''),
    
    visibility: Joi.string()
      .valid('public', 'private')
      .default('public'),
    
    maxParticipants: Joi.number()
      .integer()
      .min(2)
      .max(20)
      .default(8),
    
    subject: Joi.string()
      .trim()
      .max(50)
      .default('')
      .allow(''),
    
    focusTime: Joi.number()
      .integer()
      .min(5)
      .max(120)
      .default(25),
    
    shortBreakTime: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(5),
    
    longBreakTime: Joi.number()
      .integer()
      .min(5)
      .max(60)
      .default(15)
  });

  return validateInput(createRoomSchema)(data);
};

/**
 * Common validation utilities export
 */
export const InputValidation = {
  schemas: ValidationSchemas,
  validate: validateInput,
  validateCreateRoom,
  validateTokenTransaction,
  sanitizeString,
  validateDocumentId,
  validateCollectionPath,
  checkRateLimit,
  validateFileUpload
};

export default InputValidation;