import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import {
  CountryController, StateController, CityController,
  CategoryController, TagController, DocumentTypeController, SettingsController,
  ServiceTypeController,
} from './coredata.controller';
import { authenticate, authorize, userAuthenticate } from '../../middleware/auth.middleware';

const router = Router();
//router.use(userAuthenticate);
// Countries
router.get   ('/countries',       asyncHandler(CountryController.list));
router.get   ('/countries/:id',   asyncHandler(CountryController.getById));
router.post  ('/countries',       userAuthenticate, authorize('admin'), asyncHandler(CountryController.create));
router.put   ('/countries/:id',   userAuthenticate, authorize('admin'), asyncHandler(CountryController.update));

// States
router.get   ('/states',          asyncHandler(StateController.list));
router.get   ('/states/:id',      asyncHandler(StateController.getById));
router.post  ('/states',          authenticate, authorize('admin'), asyncHandler(StateController.create));

// Cities
router.get   ('/cities',          asyncHandler(CityController.list));
router.get   ('/cities/:id',      asyncHandler(CityController.getById));
router.post  ('/cities',          authenticate, authorize('admin'), asyncHandler(CityController.create));

// Categories
router.get   ('/categories',      asyncHandler(CategoryController.list));
router.get   ('/categories/:id',  asyncHandler(CategoryController.getById));
router.post  ('/categories',      authenticate, authorize('admin'), asyncHandler(CategoryController.create));
router.put   ('/categories/:id',  authenticate, authorize('admin'), asyncHandler(CategoryController.update));
router.delete('/categories/:id',  authenticate, authorize('admin'), asyncHandler(CategoryController.remove));

// Tags
router.get   ('/tags',            asyncHandler(TagController.list));
router.post  ('/tags',            authenticate, authorize('admin'), asyncHandler(TagController.create));
router.delete('/tags/:id',        authenticate, authorize('admin'), asyncHandler(TagController.remove));

// Document Types
router.get   ('/document-types',  asyncHandler(DocumentTypeController.list));
router.get   ('/document-types/:id', asyncHandler(DocumentTypeController.getById));
router.post  ('/document-types',  authenticate, authorize('admin'), asyncHandler(DocumentTypeController.create));

// System Settings
router.get   ('/settings',        asyncHandler(SettingsController.listPublic));
router.get   ('/settings/all',    authenticate, authorize('admin'), asyncHandler(SettingsController.listAll));
router.post  ('/settings',        authenticate, authorize('admin'), asyncHandler(SettingsController.upsert));
router.delete('/settings/:key',   authenticate, authorize('admin'), asyncHandler(SettingsController.remove));

// Service Types
router.get   ('/service-types',     asyncHandler(ServiceTypeController.list));
router.get   ('/service-types/:id', asyncHandler(ServiceTypeController.getById));
router.post  ('/service-types',     userAuthenticate, authorize('admin'), asyncHandler(ServiceTypeController.create));
router.put   ('/service-types/:id', userAuthenticate, authorize('admin'), asyncHandler(ServiceTypeController.update));
router.delete('/service-types/:id', userAuthenticate, authorize('admin'), asyncHandler(ServiceTypeController.remove));

export default router;
