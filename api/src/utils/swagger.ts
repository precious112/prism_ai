import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema } from '../modules/auth/auth.validation';
import { createUserSchema, updateUserSchema } from '../modules/users/users.validation';
import { createChatSchema, updateChatSchema, createMessageSchema, createWorkerMessageSchema } from '../modules/chat/chat.validation';
import { createResearchResultSchema } from '../modules/research/research.validation';
import { updateOrganizationSchema, createInvitationSchema, updateMemberRoleSchema } from '../modules/organizations/organizations.validation';

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
    method: 'get',
    path: '/users/{id}/organizations/owned',
    tags: ['Users'],
    summary: 'List organizations owned by user',
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() })
    },
    responses: {
        200: {
            description: 'List of owned organizations',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({ organizations: z.array(z.any()) })
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

// --- Chat Routes ---

registry.registerPath({
  method: 'post',
  path: '/users/{userId}/chats',
  tags: ['Chats'],
  summary: 'Create a new chat',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: createChatSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Chat created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ chat: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/users/{userId}/chats',
  tags: ['Chats'],
  summary: 'List user chats',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string() }),
    query: z.object({ page: z.string().optional(), limit: z.string().optional() })
  },
  responses: {
    200: {
      description: 'List of chats',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ chats: z.array(z.any()) }),
            pagination: z.any()
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/chats/{id}',
  tags: ['Chats'],
  summary: 'Get chat details',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: {
      description: 'Chat details',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ chat: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'put',
  path: '/chats/{id}',
  tags: ['Chats'],
  summary: 'Update chat title',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: updateChatSchema.shape.body
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Chat updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ chat: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'delete',
  path: '/chats/{id}',
  tags: ['Chats'],
  summary: 'Delete chat',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: {
      description: 'Chat deleted',
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
  path: '/chats/{id}/messages',
  tags: ['Chats'],
  summary: 'Add message to chat',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: createMessageSchema.shape.body
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Message added',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ message: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/chats/{id}/messages',
  tags: ['Chats'],
  summary: 'List chat messages',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ page: z.string().optional(), limit: z.string().optional() })
  },
  responses: {
    200: {
      description: 'List of messages',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ messages: z.array(z.any()) }),
            pagination: z.any()
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/chats/{id}/messages/worker',
  tags: ['Chats'],
  summary: 'Add worker message to chat',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: createWorkerMessageSchema.shape.body
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Worker message added',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ message: z.any() })
          })
        }
      }
    }
  }
});

// --- Organization Routes ---

registry.registerPath({
  method: 'post',
  path: '/organizations/{orgId}/chats',
  tags: ['Organizations'],
  summary: 'Create a new chat in an organization',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ orgId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: createChatSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Chat created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ chat: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/organizations/{orgId}/chats',
  tags: ['Organizations'],
  summary: 'List organization chats',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ orgId: z.string() }),
    query: z.object({ page: z.string().optional(), limit: z.string().optional() })
  },
  responses: {
    200: {
      description: 'List of chats',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ chats: z.array(z.any()) }),
            pagination: z.any()
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'put',
  path: '/organizations/{orgId}',
  tags: ['Organizations'],
  summary: 'Update organization',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ orgId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: updateOrganizationSchema.shape.body
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Organization updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ organization: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/organizations/{orgId}/invitations',
  tags: ['Organizations'],
  summary: 'Invite user to organization',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ orgId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: createInvitationSchema.shape.body
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Invitation created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ invitation: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/organizations/invitations/{token}/accept',
  tags: ['Organizations'],
  summary: 'Accept invitation',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ token: z.string() })
  },
  responses: {
    200: {
      description: 'Invitation accepted',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ 
                organization: z.any(),
                member: z.any().optional()
            })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'patch',
  path: '/organizations/{orgId}/members/{userId}',
  tags: ['Organizations'],
  summary: 'Update member role',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ orgId: z.string(), userId: z.string() }),
    body: {
        content: {
            'application/json': {
                schema: updateMemberRoleSchema.shape.body
            }
        }
    }
  },
  responses: {
    200: {
      description: 'Member role updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ member: z.any() })
          })
        }
      }
    }
  }
});

// --- Research Routes ---

registry.registerPath({
  method: 'post',
  path: '/research/worker/result/{requestId}',
  tags: ['Research'],
  summary: 'Submit research result (Worker)',
  request: {
    params: z.object({ requestId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: createResearchResultSchema.shape.body
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Result submitted',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ result: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/research/{requestId}',
  tags: ['Research'],
  summary: 'Get research request details',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ requestId: z.string() })
  },
  responses: {
    200: {
      description: 'Research request details',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ request: z.any() })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/research/{requestId}/retry',
  tags: ['Research'],
  summary: 'Retry research request',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ requestId: z.string() })
  },
  responses: {
    200: {
      description: 'Research request retried',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ request: z.any() })
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
