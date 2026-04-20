import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import {
  RoleController,
  DepartmentController,
  DesignationController,
} from '../../modules/master/master.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

/* Roles */
router.get('/roles', asyncHandler(RoleController.list));
router.post('/roles', authenticate, authorize('admin'), asyncHandler(RoleController.create));
router.put('/roles/:id', authenticate, authorize('admin'), asyncHandler(RoleController.update));
router.delete('/roles/:id', authenticate, authorize('admin'), asyncHandler(RoleController.remove));

/* Departments */
router.get('/departments', asyncHandler(DepartmentController.list));
router.get('/departments/:id', asyncHandler(DepartmentController.getById));
router.post('/departments', authenticate, authorize('admin'), asyncHandler(DepartmentController.create));
router.put('/departments/:id', authenticate, authorize('admin'), asyncHandler(DepartmentController.update));
router.delete('/departments/:id', authenticate, authorize('admin'), asyncHandler(DepartmentController.remove));

/* Designations */
router.get('/designations', asyncHandler(DesignationController.list));
router.get('/designations/:id', asyncHandler(DesignationController.getById));
router.post('/designations', authenticate, authorize('admin'), asyncHandler(DesignationController.create));
router.put('/designations/:id', authenticate, authorize('admin'), asyncHandler(DesignationController.update));
router.delete('/designations/:id', authenticate, authorize('admin'), asyncHandler(DesignationController.remove));

export default router;
