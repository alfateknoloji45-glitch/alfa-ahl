const express = require('express');
const router = express.Router();

const { AVAILABLE_MODULES, YEARLY_DISCOUNT_MULTIPLIER } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/modules
 * Get all available modules
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(AVAILABLE_MODULES).map(([key, module]) => ({
      id: key,
      ...module,
      yearlyPrice: Math.round(module.price * 12 * YEARLY_DISCOUNT_MULTIPLIER)
    }))
  });
});

/**
 * GET /api/modules/accessible
 * Get modules accessible to current user/company
 */
router.get('/accessible', authenticate, (req, res) => {
  const company = req.company;
  
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Şirket bulunamadı'
    });
  }

  const allAccessibleModules = [
    ...company.activeModules,
    ...(company.extraModules || [])
  ];

  const accessibleModulesDetails = allAccessibleModules.map(moduleId => ({
    id: moduleId,
    ...AVAILABLE_MODULES[moduleId],
    source: company.activeModules.includes(moduleId) ? 'plan' : 'extra'
  }));

  const unavailableModules = Object.entries(AVAILABLE_MODULES)
    .filter(([key]) => !allAccessibleModules.includes(key))
    .map(([key, module]) => ({
      id: key,
      ...module,
      yearlyPrice: Math.round(module.price * 12 * YEARLY_DISCOUNT_MULTIPLIER)
    }));

  res.json({
    success: true,
    data: {
      accessible: accessibleModulesDetails,
      unavailable: unavailableModules,
      trialActive: company.status === 'trial',
      trialEndsAt: company.trialEndsAt
    }
  });
});

/**
 * GET /api/modules/:moduleId/check
 * Check if user has access to specific module
 */
router.get('/:moduleId/check', authenticate, (req, res) => {
  const { moduleId } = req.params;
  const company = req.company;

  if (!AVAILABLE_MODULES[moduleId]) {
    return res.status(404).json({
      success: false,
      error: 'Modül bulunamadı'
    });
  }

  const hasAccess = company.activeModules.includes(moduleId) || 
                    (company.extraModules && company.extraModules.includes(moduleId));

  // Check trial expiration
  let trialExpired = false;
  if (company.status === 'trial' && new Date(company.trialEndsAt) < new Date()) {
    trialExpired = true;
  }

  res.json({
    success: true,
    data: {
      moduleId,
      hasAccess: hasAccess && !trialExpired,
      module: AVAILABLE_MODULES[moduleId],
      reason: trialExpired ? 'trial_expired' : (hasAccess ? 'included' : 'not_purchased'),
      canPurchase: !hasAccess && !AVAILABLE_MODULES[moduleId].included
    }
  });
});

module.exports = router;
