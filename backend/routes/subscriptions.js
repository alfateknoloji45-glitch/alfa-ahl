const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store, SUBSCRIPTION_PLANS, AVAILABLE_MODULES, YEARLY_DISCOUNT_MULTIPLIER } = require('../models/store');
const { authenticate, adminOnly } = require('../middleware/auth');

/**
 * GET /api/subscriptions/current
 * Get current company subscription details
 */
router.get('/current', authenticate, (req, res) => {
  const company = store.companies.find(c => c.id === req.user.companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const plan = SUBSCRIPTION_PLANS[company.plan];
  const extraModuleSubs = store.moduleSubscriptions.filter(
    s => s.companyId === company.id && s.status === 'active'
  );

  // Calculate trial info
  let trialInfo = null;
  if (company.status === 'trial') {
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
      subscription: {
        plan: {
          id: company.plan,
          name: plan.name,
          description: plan.description,
          maxUsers: plan.maxUsers,
          maxCompanies: plan.maxCompanies
        },
        status: company.status,
        billingCycle: company.billingCycle,
        activeModules: company.activeModules.map(m => ({
          id: m,
          ...AVAILABLE_MODULES[m]
        })),
        extraModules: extraModuleSubs.map(sub => ({
          id: sub.moduleId,
          name: sub.moduleName,
          billingCycle: sub.billingCycle,
          monthlyPrice: sub.monthlyPrice,
          addedAt: sub.startDate
        }))
      },
      trialInfo,
      pricing: {
        planMonthly: plan.monthlyPrice,
        planYearly: plan.yearlyPrice,
        extraModulesTotal: extraModuleSubs.reduce((sum, s) => sum + s.monthlyPrice, 0)
      }
    }
  });
});

/**
 * POST /api/subscriptions/upgrade
 * Upgrade subscription plan
 */
router.post('/upgrade', authenticate, adminOnly, (req, res) => {
  const { planId, billingCycle = 'monthly' } = req.body;

  const company = store.companies.find(c => c.id === req.user.companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const newPlan = SUBSCRIPTION_PLANS[planId];
  if (!newPlan) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz plan'
    });
  }

  const oldPlan = company.plan;
  company.plan = planId;
  company.billingCycle = billingCycle;
  company.status = 'active';
  company.activeModules = newPlan.modules;
  company.updatedAt = new Date().toISOString();

  // Create subscription record
  store.subscriptions.push({
    id: uuidv4(),
    companyId: company.id,
    type: 'plan_upgrade',
    fromPlan: oldPlan,
    toPlan: planId,
    billingCycle,
    amount: billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Planınız ${newPlan.name} olarak yükseltildi!`,
    data: {
      newPlan: {
        id: planId,
        name: newPlan.name,
        modules: newPlan.modules,
        price: billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice
      },
      company: {
        id: company.id,
        name: company.name,
        status: company.status,
        activeModules: company.activeModules
      }
    }
  });
});

/**
 * POST /api/subscriptions/add-module
 * Purchase additional module
 */
router.post('/add-module', authenticate, adminOnly, (req, res) => {
  const { moduleId, billingCycle = 'monthly' } = req.body;

  const company = store.companies.find(c => c.id === req.user.companyId);
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

  // Check if already has access
  if (company.activeModules.includes(moduleId)) {
    return res.status(400).json({
      success: false,
      error: 'Bu modül planınıza zaten dahil'
    });
  }

  if (company.extraModules && company.extraModules.includes(moduleId)) {
    return res.status(400).json({
      success: false,
      error: 'Bu modül zaten satın alınmış'
    });
  }

  // Add module
  if (!company.extraModules) company.extraModules = [];
  company.extraModules.push(moduleId);

  const monthlyPrice = module.price;
  const yearlyPrice = Math.round(monthlyPrice * 12 * YEARLY_DISCOUNT_MULTIPLIER);

  // Create module subscription
  store.moduleSubscriptions.push({
    id: uuidv4(),
    companyId: company.id,
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
    message: `${module.name} modülü başarıyla eklendi!`,
    data: {
      module: {
        id: moduleId,
        name: module.name,
        description: module.description,
        price: billingCycle === 'yearly' ? yearlyPrice : monthlyPrice,
        billingCycle
      },
      allModules: [...company.activeModules, ...company.extraModules]
    }
  });
});

/**
 * DELETE /api/subscriptions/remove-module/:moduleId
 * Cancel extra module subscription
 */
router.delete('/remove-module/:moduleId', authenticate, adminOnly, (req, res) => {
  const { moduleId } = req.params;

  const company = store.companies.find(c => c.id === req.user.companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  if (!company.extraModules || !company.extraModules.includes(moduleId)) {
    return res.status(400).json({
      success: false,
      error: 'Bu modül satın alınmış modüllerinizde yok'
    });
  }

  company.extraModules = company.extraModules.filter(m => m !== moduleId);

  // Update subscription
  const sub = store.moduleSubscriptions.find(
    s => s.companyId === company.id && s.moduleId === moduleId && s.status === 'active'
  );
  if (sub) {
    sub.status = 'cancelled';
    sub.cancelledAt = new Date().toISOString();
  }

  res.json({
    success: true,
    message: 'Modül aboneliği dönem sonunda iptal edilecek',
    data: {
      moduleId,
      remainingModules: [...company.activeModules, ...company.extraModules]
    }
  });
});

/**
 * GET /api/subscriptions/usage
 * Get usage statistics
 */
router.get('/usage', authenticate, (req, res) => {
  const company = store.companies.find(c => c.id === req.user.companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const plan = SUBSCRIPTION_PLANS[company.plan];
  const usersCount = store.users.filter(u => u.companyId === company.id).length;

  res.json({
    success: true,
    data: {
      users: {
        current: usersCount,
        max: plan.maxUsers === -1 ? 'Sınırsız' : plan.maxUsers,
        percentage: plan.maxUsers === -1 ? 0 : Math.round((usersCount / plan.maxUsers) * 100)
      },
      modules: {
        active: company.activeModules.length + (company.extraModules?.length || 0),
        total: Object.keys(AVAILABLE_MODULES).length
      },
      storage: {
        used: '2.5 GB',
        max: plan.maxUsers === -1 ? 'Sınırsız' : '10 GB',
        percentage: 25
      }
    }
  });
});

/**
 * GET /api/subscriptions/history
 * Get subscription history
 */
router.get('/history', authenticate, (req, res) => {
  const subscriptionHistory = store.subscriptions.filter(
    s => s.companyId === req.user.companyId
  );

  const moduleHistory = store.moduleSubscriptions.filter(
    s => s.companyId === req.user.companyId
  );

  res.json({
    success: true,
    data: {
      planChanges: subscriptionHistory,
      moduleChanges: moduleHistory
    }
  });
});

module.exports = router;
