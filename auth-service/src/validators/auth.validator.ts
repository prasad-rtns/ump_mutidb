import { body, query, param } from 'express-validator';

export const registerValidator = [
  body('username')
    .trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 chars')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscore'),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special char'),
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('roleId').notEmpty().isUUID().withMessage('Valid role ID required'),
  body('departmentId').notEmpty().isUUID().withMessage('Valid department ID required'),
  body('designationId').notEmpty().isUUID().withMessage('Valid designation ID required'),
];

export const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('deviceInfo').optional().isString(),
  body('twoFactorCode').optional().isLength({ min: 6, max: 6 }).isNumeric(),
];

export const updateUserValidator = [
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('roleId').optional().isUUID(),
  body('departmentId').optional().isUUID(),
  body('designationId').optional().isUUID(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword')
    .notEmpty().withMessage('New password required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special char'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
];

export const uuidParamValidator = [
  param('id').isUUID().withMessage('Invalid ID format'),
];
