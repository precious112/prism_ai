import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema } from '../modules/auth/auth.validation';
import { createUserSchema, updateUserSchema } from '../modules/users/users.validation';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Schemas
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

registry.register('User', UserSchema);

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// --- Auth Routes ---
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login a user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
                user: UserSchema,
                accessToken: z.string()
            })
          }),
        },
      },
    },
    400: { description: 'Validation Error' },
    401: { description: 'Invalid credentials' },
  },
});

// --- User Routes ---
registry.registerPath({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  summary: 'Register a new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: {
        'application/json': {
            schema: z.object({
                success: z.boolean(),
                data: z.object({
                    user: UserSchema,
                    accessToken: z.string()
                })
            })
        }
      }
    },
    400: { description: 'Validation Error' },
    409: { description: 'Email already exists' },
  },
});

registry.registerPath({
    method: 'put',
    path: '/users/{id}',
    tags: ['Users'],
    summary: 'Update a user',
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                'application/json': {
                    schema: updateUserSchema.shape.body
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User updated',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({ user: UserSchema })
                    })
                }
            }
        }
    }
})

registry.registerPath({
    method: 'get',
    path: '/users/{id}',
    tags: ['Users'],
    summary: 'Get user by ID',
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() })
    },
    responses: {
        200: {
            description: 'User found',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({ user: UserSchema })
                    })
                }
            }
        }
    }
})

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh access token',
  responses: {
    200: {
      description: 'Token refreshed',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ accessToken: z.string() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Logout user',
  responses: {
    200: {
      description: 'Logged out successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ message: z.string() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Request password reset',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ email: z.string().email() })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Reset email sent',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ message: z.string() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Auth'],
  summary: 'Reset password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ token: z.string(), password: z.string().min(6) })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Password reset successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ message: z.string() })
          })
        }
      }
    }
  }
});

export const generateOpenAPI = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Prism AI API',
      description: 'API Documentation for Prism AI',
    },
    servers: [{ url: '/api' }],
  });
};
