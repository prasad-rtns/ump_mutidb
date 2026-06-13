import { body, query, param } from 'express-validator';

export const updateUserValidator = [
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  body('phone').optional({ nullable: true, checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  body('avatar').optional({ nullable: true, checkFalsy: true }).isURL({ require_tld: false, protocols: ['http', 'https'] }).isLength({ max: 2048 }).withMessage('Invalid avatar URL'),
  body('roleId').optional().isUUID(),
  body('companyId').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('departmentId').optional().isUUID(),
  body('designationId').optional().isUUID(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  body('isEmailVerified').optional().isBoolean().toBoolean(),
  body('twoFactorEnabled').optional().isBoolean().toBoolean(),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('userCategory').optional().isIn(['external', 'internal', 'admin']).withMessage('Invalid user category'),
];

export const uuidParamValidator = [
  param('id').isUUID().withMessage('Invalid ID format'),
];
