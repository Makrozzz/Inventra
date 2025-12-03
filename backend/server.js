const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for React app
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests for development, 100 for production
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.56.1:3000',
      'http://172.16.0.2:3000',
      'https://inventra.ivms2006.com',
      'http://inventra.ivms2006.com',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Allow any origin from local network in development
    if (process.env.NODE_ENV !== 'production' && origin) {
      const isLocalNetwork = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+):3000$/.test(origin);
      if (isLocalNetwork) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow in production to prevent issues
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  const frontendPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(frontendPath));
  
  logger.info(`📁 Serving frontend from: ${frontendPath}`);
}

// API routes
app.use('/api/v1', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Inventra API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Serve React app for all other routes (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
    res.sendFile(frontendPath, (err) => {
      if (err) {
        logger.error('Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
} else {
  // In development, show a message
  app.get('*', (req, res) => {
    res.json({
      success: true,
      message: 'Inventra API Server - Development Mode',
      note: 'Frontend should be running on http://localhost:3000',
      apiEndpoint: '/api/v1'
    });
  });
}

// Global error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Try to initialize database connection (but don't fail if it doesn't work)
    await initializeDatabase();
    
    // Start server regardless of database connection status
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Inventra Backend Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN}`);
      logger.info(`🌍 Server accessible on all network interfaces (0.0.0.0)`);
    });
    
    server.on('error', (error) => {
      logger.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    logger.warn('Database initialization failed, but server will continue:', error.message);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;