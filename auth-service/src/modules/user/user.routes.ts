import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import { UserController } from '../../modules/user/user.controller';
import { registerValidator } from '../auth/auth.validator';
import { authenticate, authorize, departmentScope, selfOrAdmin } from '../../middleware/auth.middleware';
import {
  updateUserValidator,
  paginationValidator,
  uuidParamValidator,
} from '../user/user.validator';

const router = Router();

router.get('/dashboard', authenticate, departmentScope, asyncHandler(UserController.dashboard));
router.get('/', authenticate, departmentScope, paginationValidator, asyncHandler(UserController.list));
router.post('/', authenticate, authorize('admin'), registerValidator, asyncHandler(UserController.create));
router.get('/:id', authenticate, selfOrAdmin, uuidParamValidator, asyncHandler(UserController.getById));
router.put('/:id', authenticate, selfOrAdmin, uuidParamValidator, updateUserValidator, asyncHandler(UserController.update));
router.delete('/:id', authenticate, authorize('admin'), uuidParamValidator, asyncHandler(UserController.remove));
router.patch('/:id/status', authenticate, authorize('admin', 'lead'), uuidParamValidator, asyncHandler(UserController.changeStatus));

export default router;
