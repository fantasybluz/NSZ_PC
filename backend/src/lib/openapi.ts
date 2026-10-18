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

// 後台 API 由 Cloudflare Access 保護：通過 Access 的請求會帶 Cf-Access-Jwt-Assertion
const authSecurity = [{ CloudflareAccess: [] }];

// 網站文字裡前台已經不顯示的舊欄位
const RETIRED_FIELD = '舊欄位，前台不顯示、不必填；沒帶就沿用原本的值';

// 出機紀錄的欄位：後台（Order）有 serviceFee，公開 API（PublicOrder）拿掉
const ORDER_PROPERTIES: Record<string, unknown> = {
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
  images: {
    type: 'array',
    items: { type: 'string' },
  },
  location: { type: 'string' },
  salePrice: { type: 'number', minimum: 0, example: 53900 },
  serviceFee: { type: 'number', minimum: 0, example: 1500 },
  status: {
    type: 'string',
    enum: ['pending', 'shipping', 'delivered', 'cancelled'],
  },
  cpu: { type: 'string', example: 'Ryzen 7 7800X3D' },
  motherboard: { type: 'string', example: 'MSI B650 Tomahawk' },
  ram: { type: 'string', example: 'DDR5 32GB' },
  storage: { type: 'string', example: '2TB Gen4 SSD' },
  gpu: { type: 'string', example: 'RTX 4070 Super' },
  psu: { type: 'string', example: '750W 80+ Gold' },
  cooler: { type: 'string', example: 'Thermalright Peerless Assassin 120' },
  pcCase: { type: 'string', example: 'Darkflash DY470 White' },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
};

const ORDER_REQUIRED = [
  'id',
  'date',
  'item',
  'requirementIntro',
  'tags',
  'location',
  'salePrice',
  'serviceFee',
  'status',
  'cpu',
  'motherboard',
  'ram',
  'storage',
  'gpu',
  'psu',
  'cooler',
  'pcCase',
  'createdAt',
  'updatedAt',
];

const withoutServiceFee = <T extends Record<string, unknown>>(properties: T): Omit<T, 'serviceFee'> => {
  const { serviceFee: _serviceFee, ...rest } = properties;
  return rest;
};

export const getOpenApiDocument = (origin: string): OpenApiObject => ({
  openapi: '3.0.3',
  info: {
    title: 'NSZPC Backend API',
    version: '1.1.0',
    description:
      'NSZPC 官網 API：公開資料讀取（推薦配單、分類、出機紀錄、技術文章、網站文字）與後台 CRUD（builds/categories/orders/blog-posts、網站文字）。後台 API 要先通過 Cloudflare Access。',
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
      head: {
        tags: ['Health'],
        summary: 'Health check (status code only)',
        responses: {
          200: { description: 'Service is healthy' },
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
        description: '新增的在最前面。不含 serviceFee。',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: '1～100 筆（預設 5）；`all` 是全部',
            schema: {
              oneOf: [
                { type: 'integer', minimum: 1, maximum: 100, default: 5 },
                { type: 'string', enum: ['all'] },
              ],
            },
          },
        ],
        responses: {
          200: {
            description: 'Order list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/PublicOrder' },
              }),
            ),
          },
        },
      },
    },
    '/api/public/orders/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Public'],
        summary: 'Get order by id',
        description: '出機詳細頁用。不含 serviceFee。',
        responses: {
          200: {
            description: 'Order',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/PublicOrder' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/public/blog-posts': {
      get: {
        tags: ['Public'],
        summary: 'List blog posts',
        description: '發布日新的在前面。',
        responses: {
          200: {
            description: 'Blog post list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/BlogPost' },
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
        description: '也會刪掉這筆照片在 R2 的檔案（/media/orders/...，別筆還在用的不刪）。',
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
    '/api/admin/blog-posts': {
      get: {
        tags: ['Admin'],
        summary: 'List blog posts',
        security: authSecurity,
        responses: {
          200: {
            description: 'Blog post list',
            content: jsonContent(
              dataEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/BlogPost' },
              }),
            ),
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create blog post',
        description: 'slug 不能跟別篇重複（重複回 422）。',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/BlogPostCreateRequest' }),
        },
        responses: {
          201: {
            description: 'Blog post created',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/BlogPost' })),
          },
          422: {
            description: 'Validation failed (including duplicate slug)',
            content: jsonContent(errorEnvelope),
          },
        },
      },
    },
    '/api/admin/blog-posts/{id}': {
      parameters: [idPathParam],
      get: {
        tags: ['Admin'],
        summary: 'Get blog post by id',
        security: authSecurity,
        responses: {
          200: {
            description: 'Blog post',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/BlogPost' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update blog post',
        description: 'updatedAt 照送來的存（後台的「更新日」）。slug 不能跟別篇重複（重複回 422）。',
        security: authSecurity,
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/BlogPostCreateRequest' }),
        },
        responses: {
          200: {
            description: 'Blog post updated',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/BlogPost' })),
          },
          404: {
            description: 'Not found',
            content: jsonContent(errorEnvelope),
          },
          422: {
            description: 'Validation failed (including duplicate slug)',
            content: jsonContent(errorEnvelope),
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete blog post',
        security: authSecurity,
        responses: {
          200: {
            description: 'Deleted blog post',
            content: jsonContent(dataEnvelope({ $ref: '#/components/schemas/BlogPost' })),
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
      CloudflareAccess: {
        type: 'apiKey',
        in: 'header',
        name: 'Cf-Access-Jwt-Assertion',
        description: 'Cloudflare Access 加上的 JWT；瀏覽器登入 Access 後由 Cloudflare 自動帶上',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'email' },
          username: { type: 'string', format: 'email' },
          role: { type: 'string', example: 'admin' },
          createdAt: { type: 'string', description: '固定是空字串（帳號由 Cloudflare Access 管理）' },
        },
        required: ['id', 'username', 'role', 'createdAt'],
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
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          cpu: { type: 'string', example: 'Ryzen 7 7800X3D' },
          motherboard: { type: 'string', example: 'MSI B650 Tomahawk' },
          ram: { type: 'string', example: 'DDR5 32GB' },
          storage: { type: 'string', example: '2TB Gen4 SSD' },
          gpu: { type: 'string', example: 'RTX 4070 Super' },
          psu: { type: 'string', example: '750W 80+ Gold' },
          pcCase: { type: 'string', example: 'Darkflash DY470 White' },
          accessories: {
            type: 'array',
            items: { type: 'string' },
          },
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
          'tags',
          'cpu',
          'motherboard',
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
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          cpu: { type: 'string' },
          motherboard: { type: 'string' },
          ram: { type: 'string' },
          storage: { type: 'string' },
          gpu: { type: 'string' },
          psu: { type: 'string' },
          pcCase: { type: 'string' },
          accessories: {
            type: 'array',
            items: { type: 'string' },
          },
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
          'tags',
          'cpu',
          'motherboard',
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
        properties: ORDER_PROPERTIES,
        required: ORDER_REQUIRED,
      },
      PublicOrder: {
        type: 'object',
        description: '公開 API 的出機紀錄：沒有 serviceFee',
        properties: withoutServiceFee(ORDER_PROPERTIES),
        required: ORDER_REQUIRED.filter((key) => key !== 'serviceFee'),
      },
      BlogSection: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          paragraphs: { type: 'array', items: { type: 'string' }, minItems: 1 },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['heading', 'paragraphs', 'bullets'],
      },
      BlogPost: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'gaming-pc-budget', description: '文章網址 /blog/<slug>，不會重複' },
          title: { type: 'string' },
          summary: { type: 'string' },
          coverImage: { type: 'string' },
          publishedAt: { type: 'string', example: '2026-02-20', description: 'YYYY-MM-DD' },
          updatedAt: { type: 'string', example: '2026-03-01', description: 'YYYY-MM-DD（後台填的更新日）' },
          authorName: { type: 'string' },
          readingMinutes: { type: 'integer', minimum: 1 },
          tags: { type: 'array', items: { type: 'string' }, minItems: 1 },
          youtubeEmbedUrl: { type: 'string' },
          sections: { type: 'array', items: { $ref: '#/components/schemas/BlogSection' }, minItems: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'slug',
          'title',
          'summary',
          'coverImage',
          'publishedAt',
          'updatedAt',
          'authorName',
          'readingMinutes',
          'tags',
          'youtubeEmbedUrl',
          'sections',
          'createdAt',
        ],
      },
      BlogPostCreateRequest: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: '不能跟別篇重複' },
          title: { type: 'string' },
          summary: { type: 'string' },
          coverImage: { type: 'string' },
          publishedAt: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          updatedAt: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          authorName: { type: 'string' },
          readingMinutes: { type: 'integer', minimum: 1 },
          tags: { type: 'array', items: { type: 'string' }, minItems: 1 },
          youtubeEmbedUrl: { type: 'string' },
          sections: { type: 'array', items: { $ref: '#/components/schemas/BlogSection' }, minItems: 1 },
        },
        required: [
          'slug',
          'title',
          'summary',
          'coverImage',
          'publishedAt',
          'updatedAt',
          'authorName',
          'readingMinutes',
          'tags',
          'sections',
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
          images: {
            type: 'array',
            items: { type: 'string' },
          },
          location: { type: 'string' },
          salePrice: { type: 'number', minimum: 0 },
          serviceFee: { type: 'number', minimum: 0 },
          status: {
            type: 'string',
            enum: ['pending', 'shipping', 'delivered', 'cancelled'],
          },
          cpu: { type: 'string' },
          motherboard: { type: 'string' },
          ram: { type: 'string' },
          storage: { type: 'string' },
          gpu: { type: 'string' },
          psu: { type: 'string' },
          cooler: { type: 'string' },
          pcCase: { type: 'string' },
        },
        required: [
          'date',
          'item',
          'requirementIntro',
          'tags',
          'location',
          'salePrice',
          'serviceFee',
          'status',
          'cpu',
          'motherboard',
          'ram',
          'storage',
          'gpu',
          'psu',
          'cooler',
          'pcCase',
        ],
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
          homeHeroKicker: { type: 'string', description: RETIRED_FIELD },
          homeHeroTitle: { type: 'string' },
          homeHeroSubtitle: { type: 'string', description: RETIRED_FIELD },
          homeCategorySubtitle: { type: 'string', description: RETIRED_FIELD },
          homeBuildSubtitle: { type: 'string', description: RETIRED_FIELD },
          homeWorkflowSubtitle: { type: 'string', description: RETIRED_FIELD },
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
          categoriesPortfolioTitle: { type: 'string', description: RETIRED_FIELD },
          categoriesPortfolioSubtitle: { type: 'string', description: RETIRED_FIELD },
          categoriesBrandPortfolios: {
            type: 'array',
            description: RETIRED_FIELD,
            items: { $ref: '#/components/schemas/BrandPortfolio' },
          },
          brandHeroTitle: { type: 'string' },
          brandHeroSubtitle: { type: 'string', description: RETIRED_FIELD },
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
            description: RETIRED_FIELD,
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
          contactAddress: { type: 'string', description: RETIRED_FIELD },
          contactPhone: { type: 'string', description: RETIRED_FIELD },
          contactLine: { type: 'string', description: RETIRED_FIELD },
        },
        required: [
          'homeHeroTitle',
          'homeContactSubtitle',
          'homeStats',
          'categoriesHeroSubtitle',
          'categoriesQuickTags',
          'brandHeroTitle',
          'shipmentTagCatalog',
          'shippingSteps',
          'testimonials',
          'contactChannels',
          'footerAddress',
          'footerSlogan',
        ],
      },
    },
  },
});
