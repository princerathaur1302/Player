
import { z } from 'zod';
import { insertHistorySchema, history, streamRequestSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/history' as const,
      responses: {
        200: z.array(z.custom<typeof history.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/history' as const,
      input: insertHistorySchema,
      responses: {
        201: z.custom<typeof history.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/history' as const,
      responses: {
        204: z.void(),
      },
    }
  },
  proxy: {
    manifest: {
      method: 'GET' as const,
      path: '/api/proxy/manifest' as const,
      // Input via query params
      input: z.object({
        url: z.string().url(),
        referrer: z.string().optional(),
      }),
      responses: {
        200: z.any(), // Returns the m3u8 content
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    segment: {
      method: 'GET' as const,
      path: '/api/proxy/segment' as const,
      input: z.object({
        url: z.string().url(),
        referrer: z.string().optional(),
      }),
      responses: {
        200: z.any(), // Returns binary data
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
