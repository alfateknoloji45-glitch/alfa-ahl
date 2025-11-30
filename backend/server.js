require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const saasRoutes = require('./routes/saas');
const subscriptionRoutes = require('./routes/subscriptions');
const modulesRoutes = require('./routes/modules');
const customersRoutes = require('./routes/customers');
const productsRoutes = require('./routes/products');
const invoicesRoutes = require('./routes/invoices');
const posRoutes = require('./routes/pos');
const inventoryRoutes = require('./routes/inventory');
const hrRoutes = require('./routes/hr');
const projectsRoutes = require('./routes/projects');
const reportsRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5002;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login attempts per 15 minutes
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - Apply stricter rate limit to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 ALFAI Enterprise ERP Server                         ║
  ║                                                           ║
  ║   Server running on: http://localhost:${PORT}              ║
  ║   Health check: http://localhost:${PORT}/api/health        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
