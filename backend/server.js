require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const connectDB = require('./config/db');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Load environment variables
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '*** (set)' : 'NOT SET');
console.log('MONGO_URI:', process.env.MONGO_URI ? '*** (set)' : 'NOT SET');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    if (NODE_ENV === 'production') {
        process.exit(1);
    } else {
        console.warn('Running in development mode with missing variables. This may cause issues.');
    }
}

// CORS configuration
const isDevelopment = NODE_ENV !== 'production';

// Define allowed origins for both environments
const devOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost/coinz-main',
    'http://127.0.0.1/coinz-main',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:80',
    'http://127.0.0.1:80',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

const prodOrigins = [
    'https://spinmycoin.netlify.app',
    'https://www.spinmycoin.netlify.app',
    'https://coinz-tcfm.onrender.com'
];

// Combine all allowed origins
const allowedOrigins = [...new Set([...devOrigins, ...prodOrigins])];

// CORS configuration with security headers
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = NODE_ENV !== 'production'
      ? [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:5500',
          'http://127.0.0.1:5500',
          'http://localhost:8080',
          'http://127.0.0.1:8080',
          'http://localhost',
          'http://127.0.0.1',
          'http://localhost/coinz-main',
          'http://127.0.0.1/coinz-main',
          'http://localhost:8000',
          'http://127.0.0.1:8000',
          'http://localhost:80',
          'http://127.0.0.1:80',
          'http://localhost:3001',
          'http://127.0.0.1:3001'
        ]
      : [
          'https://spinmycoin.netlify.app',
          'https://www.spinmycoin.netlify.app',
          'https://coinz-tcfm.onrender.com'
        ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 600 // 10 minutes
};

// Create CORS middleware with error handling
const corsMiddleware = (req, res, next) => {
  const origin = req.get('origin');
  const path = req.path || '';
  
  // Log the request
  console.log(`[${new Date().toISOString()}] ${req.method} ${path} - Origin: ${origin || 'none'}`);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apply CORS with our options
  return cors(corsOptions)(req, res, next);
};

// Apply CORS middleware
app.use(corsMiddleware);
app.options('*', corsMiddleware);

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // 100 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    // Add whitelisted parameters here
  ]
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.your-domain.com;");
  next();
});

// Security middleware
app.use((req, res, next) => {
    // Set security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // For preflight requests, end the response
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    next();
});

// Enhanced request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log('Request headers:', req.headers); // Debug log
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} ${duration}ms`);
    });
    
    // Log request body for non-production environments
    if (NODE_ENV !== 'production' && req.body) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Error handling middleware (should be after all routes)
app.use(globalErrorHandler);

// Serve static frontend files
app.use(express.static('../'));

// Health check endpoint with CORS support
app.get('/health', (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const uptime = process.uptime();
        
        // Log the health check request for debugging
        console.log(`[${new Date().toISOString()}] Health check from: ${req.headers.origin || 'unknown'}`);
        
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: uptime,
            database: dbStatus,
            environment: NODE_ENV
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        body: req.body
    });

    // Handle CORS errors
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'Not allowed by CORS',
            error: err.message
        });
    }

    // Handle other errors
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Handle 404 - Not Found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Not Found',
        error: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Connect to MongoDB and start the server
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${NODE_ENV}`);
            console.log(`MongoDB Connected: ${process.env.MONGO_URI?.split('@')[1]?.split('/')[0] || 'Unknown'}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use`);
            } else {
                console.error('Server error:', error);
            }
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Database connection event handlers
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Export the app for testing
module.exports = app;
