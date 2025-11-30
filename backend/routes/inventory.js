const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/inventory
 * Get inventory overview
 */
router.get('/', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const products = store.products.filter(p => p.companyId === req.user.companyId);
  
  const summary = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0),
    lowStock: products.filter(p => p.trackInventory && p.stock <= p.minStock).length,
    outOfStock: products.filter(p => p.trackInventory && p.stock <= 0).length
  };

  res.json({
    success: true,
    data: {
      summary,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        value: p.stock * p.cost,
        status: p.stock <= 0 ? 'out_of_stock' : (p.stock <= p.minStock ? 'low_stock' : 'in_stock')
      }))
    }
  });
});

/**
 * GET /api/inventory/movements
 * Get stock movements history
 */
router.get('/movements', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const movements = (store.inventory || []).filter(m => m.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    count: movements.length
  });
});

/**
 * POST /api/inventory/adjustment
 * Create stock adjustment
 */
router.post('/adjustment', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const { productId, quantity, type = 'adjustment', reason } = req.body;

  const product = store.products.find(
    p => p.id === productId && p.companyId === req.user.companyId
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Ürün bulunamadı'
    });
  }

  const adjustment = parseInt(quantity);
  const previousStock = product.stock;

  if (type === 'add') {
    product.stock += adjustment;
  } else if (type === 'subtract') {
    product.stock -= adjustment;
  } else {
    product.stock = adjustment;
  }

  product.updatedAt = new Date().toISOString();

  // Log movement
  if (!store.inventory) store.inventory = [];
  const movement = {
    id: uuidv4(),
    companyId: req.user.companyId,
    productId: product.id,
    productName: product.name,
    type,
    previousStock,
    quantity: adjustment,
    newStock: product.stock,
    reason,
    createdAt: new Date().toISOString(),
    createdBy: req.user.id
  };
  store.inventory.push(movement);

  res.json({
    success: true,
    data: {
      product,
      movement
    }
  });
});

/**
 * GET /api/inventory/low-stock
 * Get products with low stock
 */
router.get('/low-stock', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const products = store.products.filter(
    p => p.companyId === req.user.companyId && p.trackInventory && p.stock <= p.minStock
  );
  
  res.json({
    success: true,
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.stock,
      minStock: p.minStock,
      deficit: p.minStock - p.stock
    })),
    count: products.length
  });
});

/**
 * GET /api/inventory/valuation
 * Get inventory valuation report
 */
router.get('/valuation', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const products = store.products.filter(p => p.companyId === req.user.companyId);
  
  const categories = {};
  let totalCost = 0;
  let totalRetail = 0;

  products.forEach(p => {
    const costValue = p.stock * p.cost;
    const retailValue = p.stock * p.price;
    
    totalCost += costValue;
    totalRetail += retailValue;

    const cat = p.category || 'Kategorisiz';
    if (!categories[cat]) {
      categories[cat] = { count: 0, costValue: 0, retailValue: 0 };
    }
    categories[cat].count++;
    categories[cat].costValue += costValue;
    categories[cat].retailValue += retailValue;
  });

  res.json({
    success: true,
    data: {
      totalProducts: products.length,
      totalCostValue: totalCost,
      totalRetailValue: totalRetail,
      potentialProfit: totalRetail - totalCost,
      byCategory: Object.entries(categories).map(([name, data]) => ({
        category: name,
        ...data
      }))
    }
  });
});

module.exports = router;
