const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store, SUBSCRIPTION_PLANS, AVAILABLE_MODULES, YEARLY_DISCOUNT_MULTIPLIER } = require('../models/store');
const { authenticate, adminOnly } = require('../middleware/auth');

/**
 * GET /api/saas/plans
 * Get all available subscription plans
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: {
      plans: Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
        id: key,
        ...plan,
        modulesDetails: plan.modules.map(m => ({
          id: m,
          ...AVAILABLE_MODULES[m]
        }))
      })),
      modules: Object.entries(AVAILABLE_MODULES).map(([key, module]) => ({
        id: key,
        ...module
      }))
    }
  });
});

/**
 * GET /api/saas/modules
 * Get all available modules with pricing
 */
router.get('/modules', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(AVAILABLE_MODULES).map(([key, module]) => ({
      id: key,
      ...module,
      yearlyPrice: Math.round(module.price * 12 * YEARLY_DISCOUNT_MULTIPLIER) // 20% discount for yearly
    }))
  });
});

/**
 * GET /api/saas/companies
 * Get all companies (admin only)
 */
router.get('/companies', authenticate, adminOnly, (req, res) => {
  res.json({
    success: true,
    data: store.companies
  });
});

/**
 * POST /api/saas/companies
 * Create new company
 */
router.post('/companies', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, subdomain, plan = 'starter' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Şirket adı gerekli'
      });
    }

    // Validate and generate subdomain
    let subdomainToUse = subdomain || name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Ensure subdomain is between 3-63 characters (DNS requirement)
    if (subdomainToUse.length < 3) {
      subdomainToUse = subdomainToUse + '-company';
    }
    if (subdomainToUse.length > 63) {
      subdomainToUse = subdomainToUse.substring(0, 63);
    }
    
    // Handle uniqueness by adding suffix if needed
    let finalSubdomain = subdomainToUse;
    let suffix = 1;
    while (store.companies.find(c => c.subdomain === finalSubdomain)) {
      finalSubdomain = `${subdomainToUse.substring(0, 58)}-${suffix}`;
      suffix++;
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.starter;
    
    const newCompany = {
      id: uuidv4(),
      name,
      subdomain: finalSubdomain,
      plan,
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      activeModules: Object.keys(AVAILABLE_MODULES), // All modules for trial - users will need to select a plan when trial ends
      extraModules: [],
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    };

    store.companies.push(newCompany);

    res.status(201).json({
      success: true,
      message: '30 günlük ücretsiz deneme başlatıldı!',
      data: newCompany
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/saas/companies/:id/plan
 * Upgrade/downgrade company plan
 */
router.put('/companies/:id/plan', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { plan, billingCycle = 'monthly' } = req.body;

  const company = store.companies.find(c => c.id === id);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const selectedPlan = SUBSCRIPTION_PLANS[plan];
  if (!selectedPlan) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz plan'
    });
  }

  company.plan = plan;
  company.billingCycle = billingCycle;
  company.status = 'active';
  company.activeModules = selectedPlan.modules;

  // Keep extra modules that were purchased separately
  const allModules = [...new Set([...company.activeModules, ...company.extraModules])];

  res.json({
    success: true,
    message: `Plan ${selectedPlan.name} olarak güncellendi`,
    data: {
      ...company,
      pricing: {
        monthly: selectedPlan.monthlyPrice,
        yearly: selectedPlan.yearlyPrice,
        selectedCycle: billingCycle,
        totalPrice: billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice
      }
    }
  });
});

/**
 * POST /api/saas/companies/:id/modules
 * Add extra module to company subscription
 */
router.post('/companies/:id/modules', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { moduleId, billingCycle = 'monthly' } = req.body;

  const company = store.companies.find(c => c.id === id);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const module = AVAILABLE_MODULES[moduleId];
  if (!module) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz modül'
    });
  }

  // Check if module is already included in plan
  if (company.activeModules.includes(moduleId)) {
    return res.status(400).json({
      success: false,
      error: 'Bu modül zaten planınıza dahil'
    });
  }

  // Check if module is already purchased as extra
  if (company.extraModules && company.extraModules.includes(moduleId)) {
    return res.status(400).json({
      success: false,
      error: 'Bu modül zaten satın alınmış'
    });
  }

  // Add module
  if (!company.extraModules) company.extraModules = [];
  company.extraModules.push(moduleId);

  // Calculate price
  const monthlyPrice = module.price;
  const yearlyPrice = Math.round(monthlyPrice * 12 * YEARLY_DISCOUNT_MULTIPLIER); // 20% discount

  // Create module subscription record
  store.moduleSubscriptions.push({
    id: uuidv4(),
    companyId: id,
    moduleId,
    moduleName: module.name,
    billingCycle,
    monthlyPrice,
    yearlyPrice,
    startDate: new Date().toISOString(),
    status: 'active'
  });

  res.json({
    success: true,
    message: `${module.name} modülü başarıyla eklendi`,
    data: {
      module: {
        id: moduleId,
        ...module,
        billingCycle,
        price: billingCycle === 'yearly' ? yearlyPrice : monthlyPrice
      },
      company: {
        ...company,
        allModules: [...company.activeModules, ...company.extraModules]
      }
    }
  });
});

/**
 * DELETE /api/saas/companies/:id/modules/:moduleId
 * Remove extra module from company subscription
 */
router.delete('/companies/:id/modules/:moduleId', authenticate, adminOnly, (req, res) => {
  const { id, moduleId } = req.params;

  const company = store.companies.find(c => c.id === id);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  if (!company.extraModules || !company.extraModules.includes(moduleId)) {
    return res.status(400).json({
      success: false,
      error: 'Bu modül ekstra modüllerinizde yok'
    });
  }

  company.extraModules = company.extraModules.filter(m => m !== moduleId);

  // Update subscription status
  const subscription = store.moduleSubscriptions.find(
    s => s.companyId === id && s.moduleId === moduleId && s.status === 'active'
  );
  if (subscription) {
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date().toISOString();
  }

  res.json({
    success: true,
    message: 'Modül aboneliği iptal edildi',
    data: company
  });
});

/**
 * GET /api/saas/subdomain/:name/available
 * Check if subdomain is available
 */
router.get('/subdomain/:name/available', (req, res) => {
  const { name } = req.params;
  const isAvailable = !store.companies.find(c => c.subdomain === name.toLowerCase());

  res.json({
    success: true,
    data: {
      subdomain: name.toLowerCase(),
      available: isAvailable
    }
  });
});

/**
 * GET /api/saas/billing/:companyId
 * Get billing summary for a company
 */
router.get('/billing/:companyId', authenticate, (req, res) => {
  const { companyId } = req.params;
  
  // Ensure user can only access their own company billing
  if (req.user.companyId !== companyId && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Bu bilgilere erişim yetkiniz yok'
    });
  }

  const company = store.companies.find(c => c.id === companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const plan = SUBSCRIPTION_PLANS[company.plan];
  const extraModuleSubs = store.moduleSubscriptions.filter(
    s => s.companyId === companyId && s.status === 'active'
  );

  const planCost = company.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const extraModulesCost = extraModuleSubs.reduce((sum, sub) => {
    return sum + (sub.billingCycle === 'yearly' ? sub.yearlyPrice : sub.monthlyPrice);
  }, 0);

  res.json({
    success: true,
    data: {
      company: {
        id: company.id,
        name: company.name,
        status: company.status
      },
      plan: {
        name: plan.name,
        billingCycle: company.billingCycle,
        cost: planCost
      },
      extraModules: extraModuleSubs.map(sub => ({
        moduleId: sub.moduleId,
        name: sub.moduleName,
        billingCycle: sub.billingCycle,
        cost: sub.billingCycle === 'yearly' ? sub.yearlyPrice : sub.monthlyPrice
      })),
      totalMonthlyCost: company.billingCycle === 'monthly' ? planCost + extraModulesCost : Math.round((planCost + extraModulesCost) / 12),
      totalYearlyCost: company.billingCycle === 'yearly' ? planCost + extraModulesCost : (planCost + extraModulesCost) * 12,
      nextBillingDate: company.status === 'trial' ? company.trialEndsAt : null
    }
  });
});

module.exports = router;
