const jwt = require('jsonwebtoken');
const { store } = require('../models/store');

const JWT_SECRET = process.env.JWT_SECRET || 'alfai-enterprise-secret-key';

/**
 * Authentication middleware
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Yetkilendirme başlığı gerekli'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = store.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    req.user = user;
    req.company = store.companies.find(c => c.id === user.companyId);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Geçersiz token'
    });
  }
};

/**
 * Check if user has access to specific module
 */
const checkModuleAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.company) {
      return res.status(403).json({
        success: false,
        error: 'Şirket bilgisi bulunamadı'
      });
    }

    const { activeModules, extraModules, status, trialEndsAt } = req.company;
    
    // Check if trial has expired
    if (status === 'trial' && new Date(trialEndsAt) < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Deneme süreniz dolmuştur. Lütfen bir paket satın alın.',
        code: 'TRIAL_EXPIRED'
      });
    }

    // Check if module is accessible
    const hasAccess = activeModules.includes(moduleName) || 
                      (extraModules && extraModules.includes(moduleName));
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: `Bu modüle erişiminiz yok: ${moduleName}`,
        code: 'MODULE_NOT_ACCESSIBLE',
        moduleRequired: moduleName
      });
    }

    next();
  };
};

/**
 * Admin only middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Bu işlem için yönetici yetkisi gerekli'
    });
  }
  next();
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      companyId: user.companyId
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticate,
  checkModuleAccess,
  adminOnly,
  generateToken,
  JWT_SECRET
};
