import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UMP Auth & User Service API',
      version: '1.0.0',
      description: `
# User Management Platform - Auth Service

Multi-database supported authentication & user management microservice.

## Database Switching
Pass the \`X-DB-Type\` header to switch databases per request:
- \`postgres\` (default)
- \`mysql\`
- \`mssql\`
- \`oracle\`
- \`mongodb\`

## Role-Based Access
- **Admin**: Full access to all users across all departments
- **Lead**: Access to users in their department only
- **User**: Access to their own profile only

## Authentication
All protected endpoints require \`Authorization: Bearer <token>\` header.
      `,
      contact: { name: 'UMP Platform', email: 'admin@ump-platform.com' },
    },
    servers: [
      { url: 'http://localhost:6001', description: 'Development' },
      { url: 'https://api.ump-platform.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        DbType: {
          in: 'header',
          name: 'X-DB-Type',
          schema: { type: 'string', enum: ['postgres', 'mysql', 'mssql', 'oracle', 'mongodb'] },
          description: 'Target database type',
        },
        PageParam: { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        LimitParam: { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        SearchParam: { in: 'query', name: 'search', schema: { type: 'string' } },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstName', 'lastName', 'roleId', 'departmentId', 'designationId'],
          properties: {
            username: { type: 'string', example: 'john_doe', minLength: 3, maxLength: 50 },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'Secret@123', minLength: 8 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phone: { type: 'string', example: '+1234567890' },
            roleId: { type: 'string', format: 'uuid' },
            departmentId: { type: 'string', format: 'uuid' },
            designationId: { type: 'string', format: 'uuid' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'Secret@123' },
            deviceInfo: { type: 'string', example: 'Chrome on Windows' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
            isEmailVerified: { type: 'boolean' },
            role: { $ref: '#/components/schemas/RoleResponse' },
            department: { $ref: '#/components/schemas/DepartmentResponse' },
            designation: { $ref: '#/components/schemas/DesignationResponse' },
            lastLoginAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RoleResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string', enum: ['admin', 'lead', 'user'] },
            permissions: { type: 'array', items: { type: 'string' } },
          },
        },
        DepartmentResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        DesignationResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            level: { type: 'integer' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Health', description: 'Service health check' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
