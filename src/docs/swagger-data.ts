type SchemaObject = Record<string, unknown>;
type ResponseObject = Record<string, unknown>;
type OpenApiDocument = Record<string, unknown>;

const unauthorizedResponse: ResponseObject = {
  description: 'Unauthorized',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: {
            type: 'string',
            example: 'Authentication token is required',
          },
        },
      },
    },
  },
};

const okResponse = <T extends SchemaObject>(
  description: string,
  schema?: T,
  example?: unknown,
) => ({
  description,
  content: schema
    ? {
        'application/json': {
          schema,
          example,
        },
      }
    : undefined,
});

const apiErrorResponse = (_status: number, message: string) => ({
  description: message,
  content: {
    'application/json': {
      example: {
        success: false,
        message,
      },
    },
  },
});

export const openApiSpec: OpenApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Expense Tracker API',
    version: '1.0.0',
    description: 'REST API for personal finance management.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Categories' },
    { name: 'Transactions' },
    { name: 'Budgets' },
    { name: 'Savings Goals' },
    { name: 'Reports' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {},
          meta: { type: 'object', additionalProperties: true },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          currency: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'The type of the category.',
          },
          icon: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          amount: { type: 'number' },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'The type of the transaction.',
          },
          note: { type: 'string', nullable: true },
          date: { type: 'string', format: 'date-time' },
          tags: { type: 'array', items: { type: 'string' } },
          receiptUrl: { type: 'string', nullable: true },
          isRecurring: { type: 'boolean' },
          recurringRule: {
            type: 'string',
            enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
            nullable: true,
            description: 'The recurring rule for the transaction.',
          },
          categoryId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Budget: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          limit: { type: 'number' },
          alertThreshold: { type: 'integer' },
          month: { type: 'integer' },
          year: { type: 'integer' },
          categoryId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      SavingsGoal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          targetAmount: { type: 'number' },
          currentAmount: { type: 'number' },
          deadline: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid' },
          progressPercent: { type: 'number' },
        },
      },
      MonthlyReport: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number' },
          totalExpense: { type: 'number' },
          netSavings: { type: 'number' },
        },
      },
    },
    responses: {
      UnauthorizedError: unauthorizedResponse,
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Nazmul Hasan' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'nazmul@example.com',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'Password123!',
                  },
                  currency: { type: 'string', example: 'BDT' },
                },
              },
            },
          },
        },
        responses: {
          '201': okResponse(
            'Registered successfully',
            { type: 'object' },
            {
              message: 'Registered successfully',
              data: {
                user: {
                  id: 'f4b6b7c3-9d4d-4c08-90d8-0b8e5f3e8c2a',
                  name: 'Nazmul Hasan',
                  email: 'nazmul@example.com',
                  role: 'USER',
                  currency: 'BDT',
                },
                accessToken: 'eyJhbGciOi...',
                refreshToken: 'eyJhbGciOi...',
              },
            },
          ),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'nazmul@example.com',
                  },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': okResponse(
            'Logged in successfully',
            { type: 'object' },
            {
              message: 'Logged in successfully',
              data: {
                user: {
                  id: 'f4b6b7c3-9d4d-4c08-90d8-0b8e5f3e8c2a',
                  name: 'Nazmul Hasan',
                  email: 'nazmul@example.com',
                  role: 'USER',
                  currency: 'BDT',
                },
                accessToken: 'eyJhbGciOi...',
                refreshToken: 'eyJhbGciOi...',
              },
            },
          ),
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Rotate refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOi...' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Token refreshed') },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Revoke refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOi...' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Logged out successfully') },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Start password reset flow',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'nazmul@example.com',
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Reset mail sent if account exists') },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Reset password using token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', example: '8c5d7f1c...' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'NewPassword123!',
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Password reset successfully') },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current profile',
        responses: {
          '200': okResponse(
            'Profile fetched',
            { type: 'object' },
            {
              message: 'Profile fetched',
              data: {
                id: 'f4b6b7c3-9d4d-4c08-90d8-0b8e5f3e8c2a',
                name: 'Nazmul Hasan',
                email: 'nazmul@example.com',
                role: 'USER',
                currency: 'BDT',
                isActive: true,
              },
            },
          ),
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Nazmul Hasan' },
                  currency: { type: 'string', example: 'USD' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Profile updated') },
      },
    },
    '/users/me/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'Password123!' },
                  newPassword: {
                    type: 'string',
                    minLength: 8,
                    example: 'NewPassword123!',
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Password changed') },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        responses: {
          '200': okResponse(
            'Categories fetched',
            { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            [
              {
                id: '...',
                name: 'Food',
                type: 'EXPENSE',
                icon: 'utensils',
                color: '#f97316',
              },
            ],
          ),
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type'],
                properties: {
                  name: { type: 'string', example: 'Groceries' },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  icon: { type: 'string', example: 'shopping-bag' },
                  color: { type: 'string', example: '#22c55e' },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Category created') },
      },
    },
    '/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Update category',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Groceries' },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  icon: { type: 'string', example: 'shopping-bag' },
                  color: { type: 'string', example: '#22c55e' },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Category updated') },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Category deleted') },
      },
    },
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions',
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['date', 'amount', 'createdAt'],
              default: 'date',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: {
          '200': okResponse(
            'Transactions fetched',
            {
              type: 'array',
              items: { $ref: '#/components/schemas/Transaction' },
            },
            [
              {
                id: '...',
                amount: 1200,
                type: 'EXPENSE',
                note: 'Groceries',
                date: '2026-07-04T10:00:00.000Z',
                tags: ['food', 'monthly'],
                categoryId: '...',
                userId: '...',
              },
            ],
          ),
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'type', 'categoryId', 'date'],
                properties: {
                  amount: { type: 'number', example: 1250 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  note: { type: 'string', example: 'Salary for July' },
                  date: { type: 'string', format: 'date-time' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['salary', 'monthly'],
                  },
                  receiptUrl: {
                    type: 'string',
                    example: 'https://res.cloudinary.com/.../receipt.png',
                  },
                  isRecurring: { type: 'boolean', example: false },
                  recurringRule: {
                    type: 'string',
                    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
                  },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Transaction created') },
      },
    },
    '/transactions/import': {
      post: {
        tags: ['Transactions'],
        summary: 'Import transactions from CSV',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { '201': okResponse('Transactions imported') },
      },
    },
    '/transactions/{id}': {
      patch: {
        tags: ['Transactions'],
        summary: 'Update transaction',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', example: 1250 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  categoryId: { type: 'string', format: 'uuid' },
                  note: { type: 'string', example: 'Salary for July' },
                  date: { type: 'string', format: 'date-time' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['salary', 'monthly'],
                  },
                  receiptUrl: {
                    type: 'string',
                    example: 'https://res.cloudinary.com/.../receipt.png',
                  },
                  isRecurring: { type: 'boolean', example: false },
                  recurringRule: {
                    type: 'string',
                    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
                  },
                },
              },
            },
          },
        },
        responses: { '200': okResponse('Transaction updated') },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Delete transaction',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Transaction deleted') },
      },
    },
    '/budgets': {
      get: {
        tags: ['Budgets'],
        summary: 'List budgets',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': okResponse('Budgets fetched') },
      },
      post: {
        tags: ['Budgets'],
        summary: 'Create budget',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['limit', 'month', 'year', 'categoryId'],
                properties: {
                  limit: { type: 'number', example: 10000 },
                  alertThreshold: { type: 'integer', example: 80 },
                  month: { type: 'integer', example: 7 },
                  year: { type: 'integer', example: 2026 },
                  categoryId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Budget created') },
      },
    },
    '/budgets/alerts': {
      get: {
        tags: ['Budgets'],
        summary: 'Budget alerts',
        responses: { '200': okResponse('Budget alerts fetched') },
      },
    },
    '/budgets/{id}': {
      patch: {
        tags: ['Budgets'],
        summary: 'Update budget',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Budget updated') },
      },
    },
    '/savings-goals': {
      get: {
        tags: ['Savings Goals'],
        summary: 'List savings goals',
        responses: { '200': okResponse('Savings goals fetched') },
      },
      post: {
        tags: ['Savings Goals'],
        summary: 'Create savings goal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'targetAmount', 'deadline'],
                properties: {
                  title: { type: 'string', example: 'New Laptop' },
                  targetAmount: { type: 'number', example: 120000 },
                  deadline: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { '201': okResponse('Savings goal created') },
      },
    },
    '/savings-goals/{id}/contribute': {
      patch: {
        tags: ['Savings Goals'],
        summary: 'Add contribution',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: { amount: { type: 'number', example: 5000 } },
              },
            },
          },
        },
        responses: { '200': okResponse('Contribution added') },
      },
    },
    '/savings-goals/{id}': {
      delete: {
        tags: ['Savings Goals'],
        summary: 'Delete savings goal',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': okResponse('Savings goal deleted') },
      },
    },
    '/reports/monthly': {
      get: {
        tags: ['Reports'],
        summary: 'Monthly report',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 7 },
          },
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: {
          '200': okResponse(
            'Monthly report fetched',
            { $ref: '#/components/schemas/MonthlyReport' } as SchemaObject,
            {
              message: 'Monthly report fetched',
              data: {
                totalIncome: 50000,
                totalExpense: 24000,
                netSavings: 26000,
              },
            },
          ),
        },
      },
    },
    '/reports/yearly': {
      get: {
        tags: ['Reports'],
        summary: 'Yearly report',
        parameters: [
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: { '200': okResponse('Yearly report fetched') },
      },
    },
    '/reports/category-breakdown': {
      get: {
        tags: ['Reports'],
        summary: 'Category breakdown',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 7 },
          },
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: { '200': okResponse('Category breakdown fetched') },
      },
    },
    '/reports/trend': {
      get: {
        tags: ['Reports'],
        summary: 'Income vs expense trend',
        parameters: [
          {
            name: 'from',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: { '200': okResponse('Trend fetched') },
      },
    },
    '/reports/export': {
      get: {
        tags: ['Reports'],
        summary: 'Export report',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['pdf', 'csv'] },
          },
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'year',
            in: 'query',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: { '200': okResponse('Report exported') },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        responses: { '200': okResponse('Users fetched') },
      },
    },
    '/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate or deactivate user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean', example: true } },
              },
            },
          },
        },
        responses: { '200': okResponse('User status updated') },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform statistics',
        responses: { '200': okResponse('Platform stats fetched') },
      },
    },
  },
};

const hasPathParams = (path: string) => /\{[^}]+\}/.test(path);

for (const [path, pathItem] of Object.entries(
  openApiSpec.paths as Record<
    string,
    Record<string, Record<string, unknown>> | undefined
  >,
)) {
  if (!pathItem) continue;

  for (const [method, operation] of Object.entries(pathItem)) {
    const responses = (operation.responses ?? {}) as Record<string, unknown>;
    const inputValidation =
      method !== 'get' ||
      Boolean((operation as Record<string, unknown>).requestBody) ||
      Boolean((operation as Record<string, unknown>).parameters);
    const isPublicAuthRoute = path.startsWith('/auth');
    const isAdminRoute = path.startsWith('/admin');

    const injected: Record<string, unknown> = {
      500: apiErrorResponse(500, 'Internal server error'),
    };

    if (inputValidation) {
      injected[400] = apiErrorResponse(400, 'Validation failed');
    }

    if (!isPublicAuthRoute) {
      injected[401] = apiErrorResponse(401, 'Authentication token is required');
    }

    if (isAdminRoute) {
      injected[403] = apiErrorResponse(
        403,
        'You do not have permission to access this resource',
      );
    }

    if (hasPathParams(path)) {
      injected[404] = apiErrorResponse(404, 'Resource not found');
    }

    operation.responses = {
      ...injected,
      ...responses,
    };
  }
}
