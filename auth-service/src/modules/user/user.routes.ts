import { Router } from 'express';
import { asyncHandler } from '@rtns/core';
import { UserController } from '../../modules/user/user.controller';
import { registerValidator } from '../auth/auth.validator';
import { authenticate, departmentScope, requireUserCategoryPermission, selfOrUserCategoryPermission } from '../../middleware/auth.middleware';
import {
  updateUserValidator,
  paginationValidator,
  uuidParamValidator,
} from '../user/user.validator';

const router = Router();

router.get('/dashboard', authenticate, departmentScope, asyncHandler(UserController.dashboard));
router.get('/', authenticate, departmentScope, requireUserCategoryPermission('read'), paginationValidator, asyncHandler(UserController.list));
router.post(
  '/',
  authenticate,
  requireUserCategoryPermission('create'),
  registerValidator,
  asyncHandler(UserController.create)
);
router.get(
  '/:id',
  authenticate,
  selfOrUserCategoryPermission('read'),
  uuidParamValidator,
  asyncHandler(UserController.getById)
);
router.put(
  '/:id',
  authenticate,
  selfOrUserCategoryPermission('update'),
  uuidParamValidator,
  updateUserValidator,
  asyncHandler(UserController.update)
);
router.delete(
  '/:id',
  authenticate,
  requireUserCategoryPermission('delete'),
  uuidParamValidator,
  asyncHandler(UserController.remove)
);
router.patch(
  '/:id/status',
  authenticate,
  requireUserCategoryPermission('update'),
  uuidParamValidator,
  asyncHandler(UserController.changeStatus)
);

export default router;
