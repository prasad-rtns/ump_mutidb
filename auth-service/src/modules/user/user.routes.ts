import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import { UserController } from '../../modules/user/user.controller';
import { registerValidator } from '../auth/auth.validator';
import { authenticate, departmentScope, requireAnyPermission, selfOrAnyPermission } from '../../middleware/auth.middleware';
import {
  updateUserValidator,
  paginationValidator,
  uuidParamValidator,
} from '../user/user.validator';

const router = Router();

router.get('/dashboard', authenticate, departmentScope, asyncHandler(UserController.dashboard));
router.get('/', authenticate, departmentScope, paginationValidator, asyncHandler(UserController.list));
router.post(
  '/',
  authenticate,
  requireAnyPermission('users:*', 'users:create', 'external-users:*', 'external-users:create', 'internal-users:*', 'internal-users:create', 'admin-users:*', 'admin-users:create'),
  registerValidator,
  asyncHandler(UserController.create)
);
router.get(
  '/:id',
  authenticate,
  selfOrAnyPermission('users:*', 'users:read', 'external-users:*', 'external-users:read', 'internal-users:*', 'internal-users:read', 'admin-users:*', 'admin-users:read'),
  uuidParamValidator,
  asyncHandler(UserController.getById)
);
router.put(
  '/:id',
  authenticate,
  selfOrAnyPermission('users:*', 'users:update', 'external-users:*', 'external-users:update', 'internal-users:*', 'internal-users:update', 'admin-users:*', 'admin-users:update'),
  uuidParamValidator,
  updateUserValidator,
  asyncHandler(UserController.update)
);
router.delete(
  '/:id',
  authenticate,
  requireAnyPermission('users:*', 'users:delete', 'external-users:*', 'external-users:delete', 'internal-users:*', 'internal-users:delete', 'admin-users:*', 'admin-users:delete'),
  uuidParamValidator,
  asyncHandler(UserController.remove)
);
router.patch(
  '/:id/status',
  authenticate,
  requireAnyPermission('users:*', 'users:update', 'external-users:*', 'external-users:update', 'internal-users:*', 'internal-users:update', 'admin-users:*', 'admin-users:update'),
  uuidParamValidator,
  asyncHandler(UserController.changeStatus)
);

export default router;
