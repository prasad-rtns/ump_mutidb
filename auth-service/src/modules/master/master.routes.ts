import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import {
  RoleController,
  CompanyOrUtilityController,
  DepartmentController,
  DesignationController,
  ModuleMenuController,
} from '../../modules/master/master.controller';
import { authenticate, requireAnyPermission } from '../../middleware/auth.middleware';

const router = Router();

/* Roles */
router.get('/roles', asyncHandler(RoleController.list));
router.post('/roles', authenticate, requireAnyPermission('roles:*', 'roles:create'), asyncHandler(RoleController.create));
router.put('/roles/:id', authenticate, requireAnyPermission('roles:*', 'roles:update'), asyncHandler(RoleController.update));
router.delete('/roles/:id', authenticate, requireAnyPermission('roles:*', 'roles:delete'), asyncHandler(RoleController.remove));

/* Companies / Utilities */
router.get('/companies', asyncHandler(CompanyOrUtilityController.list));
router.get('/companies/:id', asyncHandler(CompanyOrUtilityController.getById));
router.post('/companies', authenticate, requireAnyPermission('companies:*', 'companies:create'), asyncHandler(CompanyOrUtilityController.create));
router.put('/companies/:id', authenticate, requireAnyPermission('companies:*', 'companies:update'), asyncHandler(CompanyOrUtilityController.update));
router.delete('/companies/:id', authenticate, requireAnyPermission('companies:*', 'companies:delete'), asyncHandler(CompanyOrUtilityController.remove));

/* Departments */
router.get('/departments', asyncHandler(DepartmentController.list));
router.get('/departments/:id', asyncHandler(DepartmentController.getById));
router.post('/departments', authenticate, requireAnyPermission('departments:*', 'departments:create'), asyncHandler(DepartmentController.create));
router.put('/departments/:id', authenticate, requireAnyPermission('departments:*', 'departments:update'), asyncHandler(DepartmentController.update));
router.delete('/departments/:id', authenticate, requireAnyPermission('departments:*', 'departments:delete'), asyncHandler(DepartmentController.remove));

/* Designations */
router.get('/designations', asyncHandler(DesignationController.list));
router.get('/designations/:id', asyncHandler(DesignationController.getById));
router.post('/designations', authenticate, requireAnyPermission('designations:*', 'designations:create'), asyncHandler(DesignationController.create));
router.put('/designations/:id', authenticate, requireAnyPermission('designations:*', 'designations:update'), asyncHandler(DesignationController.update));
router.delete('/designations/:id', authenticate, requireAnyPermission('designations:*', 'designations:delete'), asyncHandler(DesignationController.remove));

/* Module Menus */
router.get('/modules/permissions', asyncHandler(ModuleMenuController.permissions));
router.get('/modules', asyncHandler(ModuleMenuController.list));
router.get('/modules/:id', asyncHandler(ModuleMenuController.getById));
router.post('/modules', authenticate, requireAnyPermission('modules:*', 'modules:create'), asyncHandler(ModuleMenuController.create));
router.put('/modules/:id', authenticate, requireAnyPermission('modules:*', 'modules:update'), asyncHandler(ModuleMenuController.update));
router.delete('/modules/:id', authenticate, requireAnyPermission('modules:*', 'modules:delete'), asyncHandler(ModuleMenuController.remove));

export default router;
