import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UMP Master Data Service API',
      version: '1.0.0',
      description: 'Master data management service - Countries, States, Cities, Categories, Tags, Document Types, Settings',
    },
    servers: [
      { url: 'http://localhost:6002', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      parameters: {
        DbType: {
          in: 'header', name: 'X-DB-Type',
          schema: { type: 'string', enum: ['postgres', 'mysql', 'mssql', 'mongodb'] },
        },
      },
    },
    tags: [
      { name: 'Countries' },
      { name: 'States' },
      { name: 'Cities' },
      { name: 'Categories' },
      { name: 'Tags' },
      { name: 'Document Types' },
      { name: 'Settings' },
      { name: 'Health' },
    ],
  },
  apis: ['./src/routes/*.ts'],
});
