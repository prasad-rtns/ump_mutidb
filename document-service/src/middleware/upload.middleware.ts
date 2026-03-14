import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@prasad-rtns/shared';

const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || 
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain'
).split(',');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

// ─── Memory storage (buffer for S3/Cloudinary) ─────────────────────────────
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
  fileFilter: (_req, file, cb): void => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error(
        `File type ${file.mimetype} not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  },
});

// ─── Multer error handler ────────────────────────────────────────────────────
export const multerErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ResponseUtil.error(
        res,
        `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 50}MB`,
        413
      );
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return ResponseUtil.error(
        res,
        'Too many files. Max: 10 files per request',
        413
      );
    }

    return ResponseUtil.error(res, err.message, 400);
  }

  if (err.message.includes('File type')) {
    return ResponseUtil.error(res, err.message, 415);
  }

  if (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
  
  return next(err);
};

// ─── Virus scan stub (integrate ClamAV or similar) ───────────────────────────
export const virusScan = async (_req: Request, _res: Response, next: NextFunction) => {
  // TODO: Integrate ClamAV: const scanner = new NodeClam();
  // For now, basic filename check
  next();
};

// ─── File metadata extractor ─────────────────────────────────────────────────
export const extractFileMetadata = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    encoding: file.encoding,
  };
};
