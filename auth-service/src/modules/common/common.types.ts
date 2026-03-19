export interface ISession {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateSessionDTO {
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}