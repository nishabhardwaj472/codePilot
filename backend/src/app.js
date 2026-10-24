import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/project.routes.js';

dotenv.config();

const app = express();

// CORS configuration supporting local development and deployed Vercel origins
const configuredFrontendUrl = process.env.FRONTEND_URL || 'https://code-pilot-topaz.vercel.app';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);

      if (
        origin === configuredFrontendUrl ||
        origin === 'https://code-pilot-topaz.vercel.app' ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for production visibility and debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logFn = res.statusCode >= 400 ? console.warn : console.log;
    logFn(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoints
app.get(['/api/health', '/health'], (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'CodePilot backend is running',
  });
});

// Project routes - mounted at both /api/projects and /projects for backward & forward compatibility
app.use('/api/projects', projectRoutes);
app.use('/projects', projectRoutes);

// Centralized 404 handler with informative diagnostics
app.use((req, res) => {
  console.warn(`[404 Not Found] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' not found. Supported routes are /api/projects/* and /projects/*`,
  });
});

// Centralized Express Error Handler with logging
app.use((err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

export default app;
