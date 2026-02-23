import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import { AuthController }    from '../controllers/auth.controller';
import { UserController }    from '../controllers/user.controller';
import { RoleController, DepartmentController, DesignationController } from '../controllers/master.controller';
import { authenticate, authorize, departmentScope, selfOrAdmin } from '@prasad-rtns/shared';
import { authRateLimit } from '@prasad-rtns/shared';
import {
  registerValidator, loginValidator, updateUserValidator,
  changePasswordValidator, paginationValidator, uuidParamValidator,
} from '../validators/auth.validator';

// ─── Auth Router ──────────────────────────────────────────────────────────────
export const authRouter = Router();

authRouter.post('/register',        authRateLimit, registerValidator,       asyncHandler(AuthController.register));
authRouter.post('/login',           authRateLimit, loginValidator,          asyncHandler(AuthController.login));
authRouter.post('/refresh',                                                 asyncHandler(AuthController.refresh));
authRouter.post('/logout',          authenticate,                           asyncHandler(AuthController.logout));
authRouter.post('/logout-all',      authenticate,                           asyncHandler(AuthController.logoutAll));
authRouter.get ('/me',              authenticate,                           asyncHandler(AuthController.me));
authRouter.post('/change-password', authenticate, changePasswordValidator,  asyncHandler(UserController.changePassword));

// ─── User Router ──────────────────────────────────────────────────────────────
export const userRouter = Router();

userRouter.get   ('/dashboard', authenticate, departmentScope,                             asyncHandler(UserController.dashboard));
userRouter.get   ('/',          authenticate, departmentScope, paginationValidator,        asyncHandler(UserController.list));
userRouter.post  ('/',          authenticate, authorize('admin'), registerValidator,       asyncHandler(UserController.create));
userRouter.get   ('/:id',       authenticate, selfOrAdmin, uuidParamValidator,            asyncHandler(UserController.getById));
userRouter.put   ('/:id',       authenticate, selfOrAdmin, uuidParamValidator, updateUserValidator, asyncHandler(UserController.update));
userRouter.delete('/:id',       authenticate, authorize('admin'), uuidParamValidator,     asyncHandler(UserController.remove));
userRouter.patch ('/:id/status',authenticate, authorize('admin', 'lead'), uuidParamValidator, asyncHandler(UserController.changeStatus));

// ─── Master Data Router ───────────────────────────────────────────────────────
export const masterAuthRouter = Router();

masterAuthRouter.get   ('/roles',            asyncHandler(RoleController.list));
masterAuthRouter.post  ('/roles',            authenticate, authorize('admin'), asyncHandler(RoleController.create));
masterAuthRouter.put   ('/roles/:id',        authenticate, authorize('admin'), asyncHandler(RoleController.update));
masterAuthRouter.delete('/roles/:id',        authenticate, authorize('admin'), asyncHandler(RoleController.remove));

masterAuthRouter.get   ('/departments',      asyncHandler(DepartmentController.list));
masterAuthRouter.get   ('/departments/:id',  asyncHandler(DepartmentController.getById));
masterAuthRouter.post  ('/departments',      authenticate, authorize('admin'), asyncHandler(DepartmentController.create));
masterAuthRouter.put   ('/departments/:id',  authenticate, authorize('admin'), asyncHandler(DepartmentController.update));
masterAuthRouter.delete('/departments/:id',  authenticate, authorize('admin'), asyncHandler(DepartmentController.remove));

masterAuthRouter.get   ('/designations',     asyncHandler(DesignationController.list));
masterAuthRouter.get   ('/designations/:id', asyncHandler(DesignationController.getById));
masterAuthRouter.post  ('/designations',     authenticate, authorize('admin'), asyncHandler(DesignationController.create));
masterAuthRouter.put   ('/designations/:id', authenticate, authorize('admin'), asyncHandler(DesignationController.update));
masterAuthRouter.delete('/designations/:id', authenticate, authorize('admin'), asyncHandler(DesignationController.remove));
