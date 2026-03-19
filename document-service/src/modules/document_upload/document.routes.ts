import { Router } from 'express';
import { asyncHandler } from '@prasad-rtns/shared';
import { DocumentController } from './document.controller';
import { uploadMiddleware, multerErrorHandler, virusScan } from '../../middleware/upload.middleware';
import { authenticate, authorize } from '@prasad-rtns/shared';

const router = Router();

router.post(
  '/upload',
  authenticate,
  uploadMiddleware.single('file'),
  virusScan,
  asyncHandler(DocumentController.uploadSingle),
  multerErrorHandler
);

router.post('/upload-bulk',
  authenticate,
  uploadMiddleware.array('files', 10), multerErrorHandler, virusScan,
  asyncHandler(DocumentController.uploadBulk)
);

router.get   ('/',             authenticate,                               asyncHandler(DocumentController.list));
router.get   ('/:id',          authenticate,                               asyncHandler(DocumentController.getById));
router.get   ('/:id/download', authenticate,                               asyncHandler(DocumentController.getDownloadUrl));
router.patch ('/:id/status',   authenticate, authorize('admin', 'lead'),   asyncHandler(DocumentController.updateStatus));
router.delete('/:id',          authenticate,                               asyncHandler(DocumentController.remove));

export default router;
