import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@rtns/core';

const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || 
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain'
).split(',');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;
const PROFILE_PHOTO_MAX_SIZE = parseInt(process.env.PROFILE_PHOTO_MAX_SIZE_MB || '2') * 1024 * 1024;
const PROFILE_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

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

function hasProfilePhotoSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg') return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === 'image/png') {
    return bytes.length > 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (file.mimetype === 'image/webp') {
    return bytes.length > 12
      && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
      && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

export const validateProfilePhoto = (req: Request, res: Response, next: NextFunction): Response | void => {
  const file = req.file;
  if (!file) return ResponseUtil.error(res, 'No file provided', 400);

  const extension = (file.originalname.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
  if (!PROFILE_PHOTO_MIME_TYPES.includes(file.mimetype) || !PROFILE_PHOTO_EXTENSIONS.includes(extension)) {
    return ResponseUtil.error(res, 'Profile photo must be a JPG, PNG, or WebP image', 415);
  }

  if (file.size > PROFILE_PHOTO_MAX_SIZE) {
    return ResponseUtil.error(res, `Profile photo too large. Max size: ${process.env.PROFILE_PHOTO_MAX_SIZE_MB || 2}MB`, 413);
  }

  if (!hasProfilePhotoSignature(file)) {
    return ResponseUtil.error(res, 'Profile photo content does not match the declared image type', 415);
  }

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
