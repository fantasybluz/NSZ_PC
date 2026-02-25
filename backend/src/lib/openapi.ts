type OpenApiObject = Record<string, unknown>;

const jsonContent = (schema: unknown): OpenApiObject => ({
  'application/json': {
    schema,
  },
});

const dataEnvelope = (schema: unknown): OpenApiObject => ({
  type: 'object',
  properties: {
    data: schema,
  },
  required: ['data'],
});

const errorEnvelope = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        details: {
          oneOf: [
            { type: 'string' },
            {
              type: 'array',
              items: { type: 'string' },
            },
          ],
        },
      },
      required: ['message'],
    },
  },
  required: ['error'],
};

const idPathParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const authSecurity = [{ BearerAuth: [] }];

export const getOpenApiDocument = (origin: string): OpenApiObject => ({
  openapi: '3.0.3',
  info: {
    title: 'NSZPC Backend API',
    version: '1.1.0',
    description:
      'NSZPC 後台 API 文件，包含登入、公開資料讀取與管理端 CRUD（builds/categories/orders/inventories/procurements/personal-procurements）。',
  },
  servers: [
    {
      url: origin,
      description: 'Current server',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Public' },
    { name: 'Admin' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: jsonContent({
              type: 'object',
              properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', format: 'date-time' },
              },
              required: ['status', 'timestamp'],
            }),
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Admin login',
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: '#/components/schemas/LoginRequest',
          }),
        },
        responses: {
          200: {
            description: 'Login success',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/LoginResult' })),
          },
          401: {
            description: 'Invalid credentials',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current admin',
        security: authSecurity,
        responses: {
          200: {
            description: 'Current user profile',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/User' })),
          },
          401: {
            description: 'Unauthorized',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/auth/password': {
      put: {
        tags: ['Auth'],
        summary: 'Change admin password',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: '#/components/schemas/PasswordChangeRequest',
          }),
        },
        responses: {
          200: {
            description: 'Password updated',
            content: jsonContent(
              dataEnvelope({
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                },
                required: ['success'],
              }),
            ),
          },
          401: {
            description: 'Unauthorized / current password mismatch',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/public/builds': {
      get: {
        tags: ['Public'],
        summary: 'List public builds',
        responses: {
          200: {
            description: 'Build list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Build' },
              }),
            ),
          },
        },
      },
    },
    '/api/public/categories': {
      get: {
        tags: ['Public'],
        summary: 'List public categories',
        responses: {
          200: {
            description: 'Category list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Category' },
              }),
            ),
          },
        },
      },
    },
    '/api/public/orders': {
      get: {
        tags: ['Public'],
        summary: 'List recent orders',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
          },
        ],
        responses: {
          200: {
            description: 'Order list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Order' },
              }),
            ),
          },
        },
      },
    },
    '/api/public/site-content': {
      get: {
        tags: ['Public'],
        summary: 'Get public site content',
        responses: {
          200: {
            description: 'Site content',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/SiteContent' })),
          },
        },
      },
    },
    '/api/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Get dashboard summary',
        security: authSecurity,
        responses: {
          200: {
            description: 'Dashboard summary',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Dashboard' })),
          },
          401: {
            description: 'Unauthorized',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/site-content': {
      get: {
        tags: ['Admin'],
        summary: 'Get editable site content',
        security: authSecurity,
        responses: {
          200: {
            description: 'Editable site content',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/SiteContent' })),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update site content',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/SiteContentUpdateRequest' }),
        },
        responses: {
          200: {
            description: 'Updated site content',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/SiteContent' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/builds': {
      get: {
        tags: ['Admin'],
        summary: 'List builds',
        security: authSecurity,
        responses: {
          200: {
            description: 'Build list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Build' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create build',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/BuildCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Build created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Build' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/builds/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get build by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Build',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Build' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update build',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/BuildCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Build updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Build' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete build',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted build',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Build' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/categories': {
      get: {
        tags: ['Admin'],
        summary: 'List categories',
        security: authSecurity,
        responses: {
          200: {
            description: 'Category list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Category' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create category',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/CategoryCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Category created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Category' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/categories/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get category by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Category',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Category' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update category',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/CategoryCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Category updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Category' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete category',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted category',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Category' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'List orders',
        security: authSecurity,
        responses: {
          200: {
            description: 'Order list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Order' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create order',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/OrderCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Order created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Order' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/orders/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get order by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Order',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Order' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update order',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/OrderCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Order updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Order' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete order',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted order',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Order' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/inventories': {
      get: {
        tags: ['Admin'],
        summary: 'List inventories',
        security: authSecurity,
        responses: {
          200: {
            description: 'Inventory list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Inventory' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create inventory item',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/InventoryCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Inventory created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Inventory' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/inventories/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get inventory by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Inventory',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Inventory' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update inventory',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/InventoryCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Inventory updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Inventory' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete inventory',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted inventory',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Inventory' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/procurements': {
      get: {
        tags: ['Admin'],
        summary: 'List procurements',
        security: authSecurity,
        responses: {
          200: {
            description: 'Procurement list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Procurement' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create procurement record',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/ProcurementCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Procurement created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Procurement' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/procurements/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get procurement by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Procurement',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Procurement' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update procurement',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/ProcurementCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Procurement updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Procurement' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete procurement',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted procurement',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/Procurement' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/personal-procurements': {
      get: {
        tags: ['Admin'],
        summary: 'List company procurements',
        security: authSecurity,
        responses: {
          200: {
            description: 'Company procurement list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/PersonalProcurement' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create company procurement record',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/PersonalProcurementCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Company procurement created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/PersonalProcurement' })),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/personal-procurements/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get company procurement by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Company procurement',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/PersonalProcurement' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update company procurement',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/PersonalProcurementCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Company procurement updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/PersonalProcurement' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete company procurement',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted company procurement',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/PersonalProcurement' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          role: { type: 'string', example: 'admin' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'username', 'role', 'createdAt'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
        required: ['username', 'password'],
      },
      LoginResult: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          expiresInHours: { type: 'integer', example: 8 },
          user: { $ref: '#/components/schemas/User' },
        },
        required: ['token', 'expiresInHours', 'user'],
      },
      PasswordChangeRequest: {
        type: 'object',
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
        required: ['currentPassword', 'newPassword'],
      },
      Build: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          detailIntro: { type: 'string' },
          requirementIntro: { type: 'string' },
          youtubeEmbedUrl: { type: 'string', description: 'Optional YouTube embed/watch/share URL' },
          price: { type: 'number' },
          dealDate: {
            type: 'string',
            pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
            example: '2026/02/12',
          },
          image: { type: 'string' },
          badge: { type: 'string' },
          cpu: { type: 'string', example: 'Ryzen 7 7800X3D' },
          ram: { type: 'string', example: 'DDR5 32GB' },
          storage: { type: 'string', example: '2TB Gen4 SSD' },
          gpu: { type: 'string', example: 'RTX 4070 Super' },
          psu: { type: 'string', example: '750W 80+ Gold' },
          pcCase: { type: 'string', example: 'Darkflash DY470 White' },
          specs: {
            type: 'array',
            items: { type: 'string' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'name',
          'description',
          'detailIntro',
          'requirementIntro',
          'price',
          'dealDate',
          'image',
          'cpu',
          'ram',
          'storage',
          'gpu',
          'psu',
          'pcCase',
          'specs',
          'createdAt',
          'updatedAt',
        ],
      },
      BuildCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          detailIntro: { type: 'string' },
          requirementIntro: { type: 'string' },
          youtubeEmbedUrl: { type: 'string', description: 'Optional YouTube embed/watch/share URL' },
          price: { type: 'number', minimum: 1 },
          dealDate: {
            type: 'string',
            pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
          },
          image: { type: 'string' },
          badge: { type: 'string' },
          cpu: { type: 'string' },
          ram: { type: 'string' },
          storage: { type: 'string' },
          gpu: { type: 'string' },
          psu: { type: 'string' },
          pcCase: { type: 'string' },
          specs: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: [
          'name',
          'description',
          'requirementIntro',
          'price',
          'dealDate',
          'image',
          'cpu',
          'ram',
          'storage',
          'gpu',
          'psu',
          'pcCase',
        ],
      },
      CategoryFaq: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          summary: { type: 'string' },
          primaryCategory: { type: 'string' },
          secondaryCategory: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          points: {
            type: 'array',
            items: { type: 'string' },
          },
          detailIntro: { type: 'string' },
          detailHeroImage: { type: 'string' },
          detailRecommendations: {
            type: 'array',
            items: { type: 'string' },
          },
          detailFaqs: {
            type: 'array',
            items: { $ref: '#/components/schemas/CategoryFaq' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'title',
          'summary',
          'primaryCategory',
          'secondaryCategory',
          'tags',
          'points',
          'detailIntro',
          'detailHeroImage',
          'detailRecommendations',
          'detailFaqs',
          'createdAt',
          'updatedAt',
        ],
      },
      CategoryCreateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          primaryCategory: { type: 'string' },
          secondaryCategory: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          points: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          detailIntro: { type: 'string' },
          detailHeroImage: { type: 'string' },
          detailRecommendations: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          detailFaqs: {
            type: 'array',
            items: { $ref: '#/components/schemas/CategoryFaq' },
            minItems: 1,
          },
        },
        required: [
          'title',
          'summary',
          'primaryCategory',
          'secondaryCategory',
          'tags',
          'points',
          'detailIntro',
          'detailHeroImage',
          'detailRecommendations',
          'detailFaqs',
        ],
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          date: { type: 'string' },
          item: { type: 'string' },
          requirementIntro: { type: 'string' },
          youtubeEmbedUrl: { type: 'string', description: 'Optional YouTube embed/watch/share URL' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          location: { type: 'string' },
          salePrice: { type: 'number', minimum: 0, example: 53900 },
          status: {
            type: 'string',
            enum: ['pending', 'shipping', 'delivered', 'cancelled'],
          },
          cpu: { type: 'string', example: 'Ryzen 7 7800X3D' },
          ram: { type: 'string', example: 'DDR5 32GB' },
          storage: { type: 'string', example: '2TB Gen4 SSD' },
          gpu: { type: 'string', example: 'RTX 4070 Super' },
          psu: { type: 'string', example: '750W 80+ Gold' },
          pcCase: { type: 'string', example: 'Darkflash DY470 White' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'date',
          'item',
          'requirementIntro',
          'tags',
          'location',
          'salePrice',
          'status',
          'cpu',
          'ram',
          'storage',
          'gpu',
          'psu',
          'pcCase',
          'createdAt',
          'updatedAt',
        ],
      },
      OrderCreateRequest: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          item: { type: 'string' },
          requirementIntro: { type: 'string' },
          youtubeEmbedUrl: { type: 'string', description: 'Optional YouTube embed/watch/share URL' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          location: { type: 'string' },
          salePrice: { type: 'number', minimum: 0 },
          status: {
            type: 'string',
            enum: ['pending', 'shipping', 'delivered', 'cancelled'],
          },
          cpu: { type: 'string' },
          ram: { type: 'string' },
          storage: { type: 'string' },
          gpu: { type: 'string' },
          psu: { type: 'string' },
          pcCase: { type: 'string' },
        },
        required: [
          'date',
          'item',
          'requirementIntro',
          'tags',
          'location',
          'salePrice',
          'status',
          'cpu',
          'ram',
          'storage',
          'gpu',
          'psu',
          'pcCase',
        ],
      },
      Inventory: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          category: {
            type: 'string',
            enum: ['cpu', 'motherboard', 'gpu', 'ram', 'ssd', 'hdd', 'cooler', 'psu', 'case'],
          },
          brand: { type: 'string', example: 'ASUS' },
          productName: { type: 'string', example: 'ROG STRIX B650-A GAMING WIFI' },
          motherboardFormFactor: { type: 'string', example: 'ATX' },
          quantity: { type: 'integer', minimum: 0 },
          taxIncluded: {
            type: 'boolean',
            description: '是否為含稅價格。若為 false，前端會以未稅金額直接計算。',
          },
          retailPrice: { type: 'number', minimum: 0 },
          costPrice: { type: 'number', minimum: 0 },
          note: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'category',
          'brand',
          'productName',
          'motherboardFormFactor',
          'quantity',
          'taxIncluded',
          'retailPrice',
          'costPrice',
          'note',
          'createdAt',
          'updatedAt',
        ],
      },
      InventoryCreateRequest: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['cpu', 'motherboard', 'gpu', 'ram', 'ssd', 'hdd', 'cooler', 'psu', 'case'],
          },
          brand: { type: 'string' },
          productName: { type: 'string' },
          motherboardFormFactor: { type: 'string', description: '主機板分類大小，例如 ATX/MATX/ITX' },
          quantity: { type: 'integer', minimum: 0 },
          taxIncluded: { type: 'boolean', default: true },
          retailPrice: { type: 'number', minimum: 0 },
          costPrice: { type: 'number', minimum: 0 },
          note: { type: 'string' },
        },
        required: ['category', 'brand', 'productName', 'quantity', 'taxIncluded', 'retailPrice', 'costPrice'],
      },
      ProcurementItem: {
        type: 'object',
        properties: {
          productName: { type: 'string', example: 'Ryzen 7 9700X' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0 },
          taxIncluded: {
            type: 'boolean',
            description: '此品項是否為含稅價格（可與整筆預設不同）',
          },
        },
        required: ['productName', 'quantity', 'unitPrice', 'taxIncluded'],
      },
      Procurement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          date: {
            type: 'string',
            pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
            example: '2026/02/13',
          },
          peerName: { type: 'string', example: '高雄同行 A' },
          supplierName: { type: 'string', example: '原價屋建國店' },
          source: { type: 'string', example: '門市現貨' },
          taxIncluded: { type: 'boolean' },
          settledThisWeek: { type: 'boolean' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProcurementItem' },
          },
          note: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'date',
          'peerName',
          'supplierName',
          'source',
          'taxIncluded',
          'settledThisWeek',
          'items',
          'note',
          'createdAt',
          'updatedAt',
        ],
      },
      ProcurementCreateRequest: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
          },
          peerName: { type: 'string' },
          supplierName: { type: 'string' },
          source: { type: 'string' },
          taxIncluded: { type: 'boolean' },
          settledThisWeek: { type: 'boolean' },
          items: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/ProcurementItem' },
          },
          note: { type: 'string' },
        },
        required: ['date', 'peerName', 'supplierName', 'source', 'taxIncluded', 'settledThisWeek', 'items'],
      },
      PersonalProcurement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          date: {
            type: 'string',
            pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
            example: '2026/02/13',
          },
          supplierName: { type: 'string', example: '原價屋建國店' },
          source: { type: 'string', example: '門市現貨' },
          taxIncluded: { type: 'boolean' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProcurementItem' },
          },
          note: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'date',
          'supplierName',
          'source',
          'taxIncluded',
          'items',
          'note',
          'createdAt',
          'updatedAt',
        ],
      },
      PersonalProcurementCreateRequest: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
          },
          supplierName: { type: 'string' },
          source: { type: 'string' },
          taxIncluded: { type: 'boolean' },
          items: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/ProcurementItem' },
          },
          note: { type: 'string' },
        },
        required: ['date', 'supplierName', 'source', 'taxIncluded', 'items'],
      },
      SiteStat: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['value', 'label'],
      },
      ShippingStep: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['title', 'description'],
      },
      Testimonial: {
        type: 'object',
        properties: {
          quote: { type: 'string' },
          name: { type: 'string' },
          tag: { type: 'string' },
        },
        required: ['quote', 'name', 'tag'],
      },
      ContactChannel: {
        type: 'object',
        properties: {
          icon: { type: 'string', example: 'fa-brands fa-line' },
          label: { type: 'string', example: 'LINE' },
          value: { type: 'string', example: '@nightstarzpc' },
          href: { type: 'string', example: 'https://line.me/R/ti/p/@nightstarzpc' },
        },
        required: ['icon', 'label', 'value', 'href'],
      },
      BrandPortfolio: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          tagline: { type: 'string' },
          focus: {
            type: 'array',
            items: { type: 'string' },
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          images: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['id', 'name', 'tagline', 'focus', 'tags', 'images'],
      },
      SiteContent: {
        type: 'object',
        properties: {
          homeHeroKicker: { type: 'string' },
          homeHeroTitle: { type: 'string' },
          homeHeroSubtitle: { type: 'string' },
          homeCategorySubtitle: { type: 'string' },
          homeBuildSubtitle: { type: 'string' },
          homeWorkflowSubtitle: { type: 'string' },
          homeContactSubtitle: { type: 'string' },
          homeStats: {
            type: 'array',
            items: { $ref: '#/components/schemas/SiteStat' },
          },
          categoriesHeroSubtitle: { type: 'string' },
          categoriesQuickTags: {
            type: 'array',
            items: { type: 'string' },
          },
          categoriesPortfolioTitle: { type: 'string' },
          categoriesPortfolioSubtitle: { type: 'string' },
          categoriesBrandPortfolios: {
            type: 'array',
            items: { $ref: '#/components/schemas/BrandPortfolio' },
          },
          brandHeroTitle: { type: 'string' },
          brandHeroSubtitle: { type: 'string' },
          shipmentTagCatalog: {
            type: 'array',
            items: { type: 'string' },
          },
          shippingSteps: {
            type: 'array',
            items: { $ref: '#/components/schemas/ShippingStep' },
          },
          serviceHighlights: {
            type: 'array',
            items: { type: 'string' },
          },
          testimonials: {
            type: 'array',
            items: { $ref: '#/components/schemas/Testimonial' },
          },
          contactChannels: {
            type: 'array',
            items: { $ref: '#/components/schemas/ContactChannel' },
          },
          footerAddress: { type: 'string' },
          footerSlogan: { type: 'string' },
          contactAddress: { type: 'string' },
          contactPhone: { type: 'string' },
          contactLine: { type: 'string' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'homeHeroKicker',
          'homeHeroTitle',
          'homeHeroSubtitle',
          'homeCategorySubtitle',
          'homeBuildSubtitle',
          'homeWorkflowSubtitle',
          'homeContactSubtitle',
          'homeStats',
          'categoriesHeroSubtitle',
          'categoriesQuickTags',
          'categoriesPortfolioTitle',
          'categoriesPortfolioSubtitle',
          'categoriesBrandPortfolios',
          'brandHeroTitle',
          'brandHeroSubtitle',
          'shipmentTagCatalog',
          'shippingSteps',
          'serviceHighlights',
          'testimonials',
          'contactChannels',
          'footerAddress',
          'footerSlogan',
          'contactAddress',
          'contactPhone',
          'contactLine',
          'updatedAt',
        ],
      },
      SiteContentUpdateRequest: {
        type: 'object',
        properties: {
          homeHeroKicker: { type: 'string' },
          homeHeroTitle: { type: 'string' },
          homeHeroSubtitle: { type: 'string' },
          homeCategorySubtitle: { type: 'string' },
          homeBuildSubtitle: { type: 'string' },
          homeWorkflowSubtitle: { type: 'string' },
          homeContactSubtitle: { type: 'string' },
          homeStats: {
            type: 'array',
            items: { $ref: '#/components/schemas/SiteStat' },
          },
          categoriesHeroSubtitle: { type: 'string' },
          categoriesQuickTags: {
            type: 'array',
            items: { type: 'string' },
          },
          categoriesPortfolioTitle: { type: 'string' },
          categoriesPortfolioSubtitle: { type: 'string' },
          categoriesBrandPortfolios: {
            type: 'array',
            items: { $ref: '#/components/schemas/BrandPortfolio' },
          },
          brandHeroTitle: { type: 'string' },
          brandHeroSubtitle: { type: 'string' },
          shipmentTagCatalog: {
            type: 'array',
            items: { type: 'string' },
          },
          shippingSteps: {
            type: 'array',
            items: { $ref: '#/components/schemas/ShippingStep' },
          },
          serviceHighlights: {
            type: 'array',
            items: { type: 'string' },
          },
          testimonials: {
            type: 'array',
            items: { $ref: '#/components/schemas/Testimonial' },
          },
          contactChannels: {
            type: 'array',
            items: { $ref: '#/components/schemas/ContactChannel' },
          },
          footerAddress: { type: 'string' },
          footerSlogan: { type: 'string' },
          contactAddress: { type: 'string' },
          contactPhone: { type: 'string' },
          contactLine: { type: 'string' },
        },
        required: [
          'homeHeroKicker',
          'homeHeroTitle',
          'homeHeroSubtitle',
          'homeCategorySubtitle',
          'homeBuildSubtitle',
          'homeWorkflowSubtitle',
          'homeContactSubtitle',
          'homeStats',
          'categoriesHeroSubtitle',
          'categoriesQuickTags',
          'categoriesPortfolioTitle',
          'categoriesPortfolioSubtitle',
          'categoriesBrandPortfolios',
          'brandHeroTitle',
          'brandHeroSubtitle',
          'shipmentTagCatalog',
          'shippingSteps',
          'serviceHighlights',
          'testimonials',
          'contactChannels',
          'footerAddress',
          'footerSlogan',
          'contactAddress',
          'contactPhone',
          'contactLine',
        ],
      },
      Dashboard: {
        type: 'object',
        properties: {
          totals: {
            type: 'object',
            properties: {
              builds: { type: 'integer' },
              categories: { type: 'integer' },
              orders: { type: 'integer' },
              users: { type: 'integer' },
            },
            required: ['builds', 'categories', 'orders', 'users'],
          },
          recentOrders: {
            type: 'array',
            items: { $ref: '#/components/schemas/Order' },
          },
          lastUpdatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['totals', 'recentOrders', 'lastUpdatedAt'],
      },
    },
  },
});
