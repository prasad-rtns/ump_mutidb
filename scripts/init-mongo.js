// MongoDB initialization script
db = db.getSiblingDB('ump_auth');

// Create collections with validators
db.createCollection('roles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'slug'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        slug: { enum: ['admin', 'lead', 'user'] },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('departments');
db.createCollection('designations');
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('audit_logs');

// Seed roles
db.roles.insertMany([
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Administrator',
    slug: 'admin',
    description: 'Full system access',
    permissions: ['users:*', 'master:*', 'documents:*', 'settings:*'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Team Lead',
    slug: 'lead',
    description: 'Department-level access',
    permissions: ['users:read', 'users:update', 'documents:*'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'User',
    slug: 'user',
    description: 'Self-service access',
    permissions: ['users:self', 'documents:own'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.departments.insertMany([
  { id: '660e8400-e29b-41d4-a716-446655440001', name: 'Engineering', code: 'ENG', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '660e8400-e29b-41d4-a716-446655440002', name: 'Human Resources', code: 'HR', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '660e8400-e29b-41d4-a716-446655440003', name: 'Finance', code: 'FIN', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '660e8400-e29b-41d4-a716-446655440005', name: 'Operations', code: 'OPS', isActive: true, createdAt: new Date(), updatedAt: new Date() }
]);

db.designations.insertMany([
  { id: '770e8400-e29b-41d4-a716-446655440001', name: 'Software Engineer', code: 'SWE', departmentId: '660e8400-e29b-41d4-a716-446655440001', level: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '770e8400-e29b-41d4-a716-446655440006', name: 'System Administrator', code: 'SYS_ADMIN', departmentId: '660e8400-e29b-41d4-a716-446655440005', level: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() }
]);

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ roleId: 1 });
db.users.createIndex({ departmentId: 1 });
db.users.createIndex({ status: 1 });

db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ refreshToken: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.roles.createIndex({ slug: 1 }, { unique: true });

// ump_documents database
db = db.getSiblingDB('ump_documents');
db.createCollection('documents');
db.documents.createIndex({ id: 1 }, { unique: true });
db.documents.createIndex({ uploadedBy: 1 });
db.documents.createIndex({ entityType: 1, entityId: 1 });
db.documents.createIndex({ status: 1 });
db.documents.createIndex({ createdAt: -1 });

print('MongoDB initialization completed');
