import { Request, Response }   from 'express';
import { DocumentService, UploadInput } from './document.service';
import { ResponseUtil }         from '@prasad-rtns/shared';
import { DocumentFilter, DocumentStatus } from './document.types';
import { StorageProviderType }  from '../../providers/storage.provider';

export class DocumentController {
  // POST /api/documents/upload
  static async uploadSingle(req: Request, res: Response) {
    if (!req.file) return ResponseUtil.error(res, 'No file provided', 400);
    const svc  = await DocumentService.create();
    const tags = req.body.tags
      ? (Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags as string).split(','))
      : undefined;
    const input: UploadInput = {
      file: req.file,
      provider: req.query.provider as StorageProviderType,
      folder: req.body.folder,
      name: req.body.name,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      tags,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
      uploadedBy: req.user!.sub,
    };
    const doc = await svc.uploadSingle(input);
    return ResponseUtil.created(res, doc, 'Document uploaded successfully');
  }

  // POST /api/documents/upload/profile-photo
  static async uploadProfilePhoto(req: Request, res: Response) {
    if (!req.file) return ResponseUtil.error(res, 'No file provided', 400);
    const svc = await DocumentService.create();
    const input: UploadInput = {
      file: req.file,
      provider: req.query.provider as StorageProviderType,
      folder: 'user-photos',
      name: req.body.name || req.file.originalname,
      entityType: 'user-profile',
      entityId: req.body.entityId,
      tags: ['profile-photo'],
      metadata: { purpose: 'user-profile-photo' },
      uploadedBy: req.user!.sub,
    };
    const doc = await svc.uploadSingle(input);
    return ResponseUtil.created(res, doc, 'Profile photo uploaded successfully');
  }

  // POST /api/documents/upload-bulk
  static async uploadBulk(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return ResponseUtil.error(res, 'No files provided', 400);
    const svc    = await DocumentService.create();
    const inputs: UploadInput[] = files.map(file => ({
      file,
      provider: req.query.provider as StorageProviderType,
      folder: req.body.folder,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      uploadedBy: req.user!.sub,
    }));
    const docs = await svc.uploadBulk(inputs);
    return ResponseUtil.created(res, { documents: docs, count: docs.length }, `${docs.length} files uploaded`);
  }

  // GET /api/documents
  static async list(req: Request, res: Response) {
    const role    = req.user!.role;
    const userId  = req.user!.sub;
    const filter: DocumentFilter = {
      page:       parseInt(req.query.page  as string) || 1,
      limit:      parseInt(req.query.limit as string) || 10,
      entityType: req.query.entityType as string,
      entityId:   req.query.entityId   as string,
      status:     req.query.status     as DocumentStatus,
      isDeleted:  false,
    };
    // Scope: users only see own documents; admin/lead see all or specific uploader
    if (role !== 'admin' && role !== 'lead') filter.uploadedBy = userId;
    else if (req.query.uploadedBy)           filter.uploadedBy = req.query.uploadedBy as string;
    const svc    = await DocumentService.create();
    const result = await svc.listDocuments(filter);
    return ResponseUtil.paginate(res, result.data, result.total, filter.page!, filter.limit!);
  }

  // GET /api/documents/:id
  static async getById(req: Request, res: Response) {
    const svc = await DocumentService.create();
    const doc = await svc.getById(req.params.id, req.user!.sub, req.user!.role);
    return ResponseUtil.success(res, doc);
  }

  // GET /api/documents/:id/download
  static async getDownloadUrl(req: Request, res: Response) {
    const svc = await DocumentService.create();
    const url = await svc.getDownloadUrl(req.params.id, req.user!.sub, req.user!.role);
    return ResponseUtil.success(res, { url, expiresIn: '1 hour' });
  }

  // PATCH /api/documents/:id/status
  static async updateStatus(req: Request, res: Response) {
    const { status } = req.body;
    if (!['pending','approved','rejected','archived'].includes(status))
      return ResponseUtil.validationError(res, [{ field: 'status', message: 'Invalid status' }]);
    const svc = await DocumentService.create();
    const doc = await svc.updateStatus(req.params.id, status as DocumentStatus, req.user!.sub);
    return ResponseUtil.success(res, doc, 'Status updated');
  }

  // DELETE /api/documents/:id
  static async remove(req: Request, res: Response) {
    const svc    = await DocumentService.create();
    const result = await svc.deleteDocument(req.params.id, req.user!.sub, req.user!.role);
    return ResponseUtil.success(res, result);
  }
}
