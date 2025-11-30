require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
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
