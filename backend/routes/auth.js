const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store, SUBSCRIPTION_PLANS, AVAILABLE_MODULES } = require('../models/store');
const { generateToken, authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email ve şifre gerekli'
      });
    }

    // Find user
    const user = store.users.find(u => u.email === email);
    
    // For demo purposes, allow 'demo' password
    if (!user || (password !== 'demo' && !await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz email veya şifre'
      });
    }

    const company = store.companies.find(c => c.id === user.companyId);
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        company: company ? {
          id: company.id,
          name: company.name,
          plan: company.plan,
          status: company.status,
          trialEndsAt: company.trialEndsAt,
          activeModules: company.activeModules
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/register
 * Register new company with 30-day free trial
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName, subdomain } = req.body;

    if (!email || !password || !name || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar gerekli'
      });
    }

    // Check if email exists
    if (store.users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        error: 'Bu email zaten kayıtlı'
      });
    }

    // Check subdomain availability
    const subdomainToUse = subdomain || companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (store.companies.find(c => c.subdomain === subdomainToUse)) {
      return res.status(400).json({
        success: false,
        error: 'Bu subdomain kullanılıyor'
      });
    }

    // Create company with 30-day trial and ALL modules
    const companyId = uuidv4();
    const newCompany = {
      id: companyId,
      name: companyName,
      subdomain: subdomainToUse,
      plan: 'enterprise', // All modules during trial
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      activeModules: Object.keys(AVAILABLE_MODULES), // All modules for trial
      extraModules: [],
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    };
    store.companies.push(newCompany);

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      companyId,
      createdAt: new Date().toISOString()
    };
    store.users.push(newUser);

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: '30 günlük ücretsiz deneme sürümünüz başladı! Tüm modüllere erişiminiz var.',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        company: {
          id: newCompany.id,
          name: newCompany.name,
          subdomain: newCompany.subdomain,
          plan: newCompany.plan,
          status: newCompany.status,
          trialEndsAt: newCompany.trialEndsAt,
          activeModules: newCompany.activeModules
        },
        trialInfo: {
          daysRemaining: 30,
          expiresAt: newCompany.trialEndsAt,
          allModulesIncluded: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, (req, res) => {
  const company = store.companies.find(c => c.id === req.user.companyId);
  
  // Calculate trial days remaining
  let trialInfo = null;
  if (company && company.status === 'trial') {
    const daysRemaining = Math.ceil((new Date(company.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    trialInfo = {
      daysRemaining: Math.max(0, daysRemaining),
      expiresAt: company.trialEndsAt,
      isExpired: daysRemaining <= 0
    };
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      },
      company: company ? {
        id: company.id,
        name: company.name,
        plan: company.plan,
        status: company.status,
        activeModules: company.activeModules,
        extraModules: company.extraModules || []
      } : null,
      trialInfo
    }
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Çıkış yapıldı'
  });
});

module.exports = router;
