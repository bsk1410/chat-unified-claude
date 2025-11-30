// ============================================================================
// Persona Engine Server
// Hono-based API server for the persona engine
// ============================================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { ENV, APP, CORS } from './lib/constants';
import { logger, LOG_CATEGORIES } from './services/logger';
import { requestLoggerMiddleware } from './middleware/request-logger';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

// Routes
import personas from './routes/personas';
import conversations from './routes/conversations';
import chatRouter from './routes/chat';
import memory from './routes/memory';
import trades from './routes/trades';
import admin from './routes/admin';

// ----------------------------------------------------------------------------
// Create App
// ----------------------------------------------------------------------------

const app = new Hono();

// ----------------------------------------------------------------------------
// Global Middleware
// ----------------------------------------------------------------------------

// Security headers
app.use('*', secureHeaders());

// CORS
app.use('*', cors({
  origin: CORS.ALLOWED_ORIGINS,
  allowMethods: CORS.ALLOWED_METHODS,
  allowHeaders: CORS.ALLOWED_HEADERS,
  exposeHeaders: CORS.EXPOSE_HEADERS,
  maxAge: CORS.MAX_AGE,
  credentials: true,
}));

// Development logger
if (ENV.IS_DEVELOPMENT) {
  app.use('*', honoLogger());
}

// Request logging
app.use('*', requestLoggerMiddleware);

// ----------------------------------------------------------------------------
// Health Check (Public)
// ----------------------------------------------------------------------------

app.get('/', (c) => {
  return c.json({
    name: APP.NAME,
    version: APP.VERSION,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------------------------------
// API Routes (Protected)
// ----------------------------------------------------------------------------

const api = new Hono();

// Auth middleware for all API routes
api.use('*', authMiddleware);

// Mount route groups
api.route('/personas', personas);
api.route('/personas', memory); // Memory routes are nested under personas
api.route('/conversations', conversations);
api.route('/chat', chatRouter);
api.route('/trades', trades);
api.route('/admin', admin);

// Mount API under /api/v1
app.route('/api/v1', api);

// ----------------------------------------------------------------------------
// Error Handling
// ----------------------------------------------------------------------------

app.onError(errorHandler);
app.notFound(notFoundHandler);

// ----------------------------------------------------------------------------
// Start Server
// ----------------------------------------------------------------------------

const port = ENV.PORT;

logger.info(LOG_CATEGORIES.API, `${APP.NAME} v${APP.VERSION} starting`, {
  port,
  environment: ENV.NODE_ENV,
});

export default {
  port,
  fetch: app.fetch,
};

// For local development with Node.js
if (typeof Bun === 'undefined') {
  // Running with Node.js (tsx)
  const { serve } = await import('@hono/node-server');

  serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    logger.info(LOG_CATEGORIES.API, `Server running at http://localhost:${info.port}`);
  });
}
