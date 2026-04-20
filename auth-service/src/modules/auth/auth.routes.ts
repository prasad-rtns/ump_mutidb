import { Router } from 'express';
import { asyncHandler, authRateLimit } from '@prasad-rtns/shared';
import { AuthController } from '../../modules/auth/auth.controller';
import { UserController } from '../../modules/user/user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from './auth.validator';

const router = Router();

router.post('/register', authRateLimit, registerValidator, asyncHandler(AuthController.register));
router.post('/login', authRateLimit, loginValidator, asyncHandler(AuthController.login));
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', authenticate, asyncHandler(AuthController.logout));
router.post('/logout-all', authenticate, asyncHandler(AuthController.logoutAll));
router.get('/me', authenticate, asyncHandler(AuthController.me));
router.post('/change-password', authenticate, changePasswordValidator, asyncHandler(UserController.changePassword));

export default router;
