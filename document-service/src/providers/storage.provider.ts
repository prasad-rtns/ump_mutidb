import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

export interface UploadResult {
  url: string;
  key: string;
  provider: 's3' | 'cloudinary' | 'local';
  publicId?: string;
  size: number;
  mimeType: string;
  originalName: string;
}

// ─── S3 Provider ─────────────────────────────────────────────────────────────
export class S3Provider {
  private client: S3Client;
  private bucket: string;
  private cloudfrontUrl?: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL;
  }

  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: `inline; filename="${file.originalname}"`,
      Metadata: { 'original-name': file.originalname },
    }));

    const url = this.cloudfrontUrl
      ? `${this.cloudfrontUrl}/${key}`
      : `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { url, key, provider: 's3', size: file.size, mimeType: file.mimetype, originalName: file.originalname };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

// ─── Cloudinary Provider ──────────────────────────────────────────────────────
export class CloudinaryProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(file: Express.Multer.File, folder = 'ump-documents'): Promise<UploadResult> {
    const result = await new Promise<import('cloudinary').UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto', use_filename: true, unique_filename: true },
        (error, result) => { if (error) reject(error); else resolve(result!); }
      ).end(file.buffer);
    });

    return {
      url: result.secure_url,
      key: result.public_id,
      provider: 'cloudinary',
      publicId: result.public_id,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  getSignedUrl(publicId: string, expiresInSeconds = 3600): string {
    return cloudinary.utils.private_download_url(publicId, 'auto', { expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds });
  }
}

// ─── Local Storage Provider ───────────────────────────────────────────────────
export class LocalProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    this.baseUrl = `http://localhost:${process.env.PORT || 3003}/uploads`;
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async upload(file: Express.Multer.File, folder = 'general'): Promise<UploadResult> {
    const folderPath = path.join(this.uploadDir, folder);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
    const filepath = path.join(folderPath, filename);
    const key = `${folder}/${filename}`;

    fs.writeFileSync(filepath, file.buffer);

    return {
      url: `${this.baseUrl}/${key}`,
      key,
      provider: 'local',
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async delete(key: string): Promise<void> {
    const filepath = path.join(this.uploadDir, key);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  getSignedUrl(key: string): string {
    return `${this.baseUrl}/${key}?token=local`;
  }
}

// ─── Storage Factory ──────────────────────────────────────────────────────────
export type StorageProviderType = 's3' | 'cloudinary' | 'local';

export function getStorageProvider(type?: StorageProviderType) {
  const providerType = type || (process.env.STORAGE_PROVIDER as StorageProviderType) || 'local';
  switch (providerType) {
    case 's3': return new S3Provider();
    case 'cloudinary': return new CloudinaryProvider();
    case 'local': return new LocalProvider();
    default: return new LocalProvider();
  }
}
