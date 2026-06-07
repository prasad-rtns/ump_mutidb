import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import {
  CountryController, StateController, CityController,
  CategoryController, TagController, DocumentTypeController, SettingsController,
  ServiceTypeController,
} from './coredata.controller';
import { authenticate, requireAnyPermission, userAuthenticate } from '../../middleware/auth.middleware';

const router = Router();
//router.use(userAuthenticate);
// Countries
router.get   ('/countries',       authenticate, requireAnyPermission('master:*', 'countries:*', 'countries:read'), asyncHandler(CountryController.list));
router.get   ('/countries/:id',   authenticate, requireAnyPermission('master:*', 'countries:*', 'countries:read'), asyncHandler(CountryController.getById));
router.post  ('/countries',       userAuthenticate, requireAnyPermission('master:*', 'countries:*', 'countries:create'), asyncHandler(CountryController.create));
router.put   ('/countries/:id',   userAuthenticate, requireAnyPermission('master:*', 'countries:*', 'countries:update'), asyncHandler(CountryController.update));

// States
router.get   ('/states',          authenticate, requireAnyPermission('master:*', 'states:*', 'states:read'), asyncHandler(StateController.list));
router.get   ('/states/:id',      authenticate, requireAnyPermission('master:*', 'states:*', 'states:read'), asyncHandler(StateController.getById));
router.post  ('/states',          authenticate, requireAnyPermission('master:*', 'states:*', 'states:create'), asyncHandler(StateController.create));

// Cities
router.get   ('/cities',          authenticate, requireAnyPermission('master:*', 'cities:*', 'cities:read'), asyncHandler(CityController.list));
router.get   ('/cities/:id',      authenticate, requireAnyPermission('master:*', 'cities:*', 'cities:read'), asyncHandler(CityController.getById));
router.post  ('/cities',          authenticate, requireAnyPermission('master:*', 'cities:*', 'cities:create'), asyncHandler(CityController.create));

// Categories
router.get   ('/categories',      authenticate, requireAnyPermission('master:*', 'categories:*', 'categories:read'), asyncHandler(CategoryController.list));
router.get   ('/categories/:id',  authenticate, requireAnyPermission('master:*', 'categories:*', 'categories:read'), asyncHandler(CategoryController.getById));
router.post  ('/categories',      authenticate, requireAnyPermission('master:*', 'categories:*', 'categories:create'), asyncHandler(CategoryController.create));
router.put   ('/categories/:id',  authenticate, requireAnyPermission('master:*', 'categories:*', 'categories:update'), asyncHandler(CategoryController.update));
router.delete('/categories/:id',  authenticate, requireAnyPermission('master:*', 'categories:*', 'categories:delete'), asyncHandler(CategoryController.remove));

// Tags
router.get   ('/tags',            authenticate, requireAnyPermission('master:*', 'tags:*', 'tags:read'), asyncHandler(TagController.list));
router.post  ('/tags',            authenticate, requireAnyPermission('master:*', 'tags:*', 'tags:create'), asyncHandler(TagController.create));
router.delete('/tags/:id',        authenticate, requireAnyPermission('master:*', 'tags:*', 'tags:delete'), asyncHandler(TagController.remove));

// Document Types
router.get   ('/document-types',  authenticate, requireAnyPermission('master:*', 'document-types:*', 'document-types:read'), asyncHandler(DocumentTypeController.list));
router.get   ('/document-types/:id', authenticate, requireAnyPermission('master:*', 'document-types:*', 'document-types:read'), asyncHandler(DocumentTypeController.getById));
router.post  ('/document-types',  authenticate, requireAnyPermission('master:*', 'document-types:*', 'document-types:create'), asyncHandler(DocumentTypeController.create));

// System Settings
router.get   ('/settings',        authenticate, requireAnyPermission('master:*', 'settings:*', 'settings:read'), asyncHandler(SettingsController.listPublic));
router.get   ('/settings/all',    authenticate, requireAnyPermission('master:*', 'settings:*', 'settings:read'), asyncHandler(SettingsController.listAll));
router.post  ('/settings',        authenticate, requireAnyPermission('master:*', 'settings:*', 'settings:create', 'settings:update'), asyncHandler(SettingsController.upsert));
router.delete('/settings/:key',   authenticate, requireAnyPermission('master:*', 'settings:*', 'settings:delete'), asyncHandler(SettingsController.remove));

// Service Types
router.get   ('/service-types',     authenticate, requireAnyPermission('master:*', 'service-types:*', 'service-types:read'), asyncHandler(ServiceTypeController.list));
router.get   ('/service-types/:id', authenticate, requireAnyPermission('master:*', 'service-types:*', 'service-types:read'), asyncHandler(ServiceTypeController.getById));
router.post  ('/service-types',     userAuthenticate, requireAnyPermission('master:*', 'service-types:*', 'service-types:create'), asyncHandler(ServiceTypeController.create));
router.put   ('/service-types/:id', userAuthenticate, requireAnyPermission('master:*', 'service-types:*', 'service-types:update'), asyncHandler(ServiceTypeController.update));
router.delete('/service-types/:id', userAuthenticate, requireAnyPermission('master:*', 'service-types:*', 'service-types:delete'), asyncHandler(ServiceTypeController.remove));

export default router;
