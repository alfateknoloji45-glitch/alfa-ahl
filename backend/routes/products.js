const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/products
 * List all products
 */
router.get('/', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const products = store.products.filter(p => p.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: products,
    count: products.length
  });
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const product = store.products.find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Ürün bulunamadı'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * POST /api/products
 * Create new product
 */
router.post('/', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const { 
    name, 
    sku, 
    barcode,
    description, 
    category, 
    price, 
    cost,
    taxRate = 18,
    unit = 'adet',
    stock = 0,
    minStock = 0,
    trackInventory = true
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      error: 'Ürün adı ve fiyat gerekli'
    });
  }

  const newProduct = {
    id: uuidv4(),
    companyId: req.user.companyId,
    name,
    sku: sku || `SKU-${Date.now()}`,
    barcode,
    description,
    category,
    price: parseFloat(price),
    cost: cost ? parseFloat(cost) : 0,
    taxRate: parseFloat(taxRate),
    unit,
    stock: parseInt(stock),
    minStock: parseInt(minStock),
    trackInventory,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.products.push(newProduct);

  res.status(201).json({
    success: true,
    data: newProduct
  });
});

/**
 * PUT /api/products/:id
 * Update product
 */
router.put('/:id', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const product = store.products.find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Ürün bulunamadı'
    });
  }

  const allowedFields = ['name', 'sku', 'barcode', 'description', 'category', 'price', 'cost', 'taxRate', 'unit', 'stock', 'minStock', 'trackInventory', 'active'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });
  
  product.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: product
  });
});

/**
 * DELETE /api/products/:id
 * Delete product
 */
router.delete('/:id', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const index = store.products.findIndex(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Ürün bulunamadı'
    });
  }

  store.products.splice(index, 1);

  res.json({
    success: true,
    message: 'Ürün silindi'
  });
});

/**
 * PUT /api/products/:id/stock
 * Update product stock
 */
router.put('/:id/stock', authenticate, checkModuleAccess('inventory'), (req, res) => {
  const product = store.products.find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Ürün bulunamadı'
    });
  }

  const { quantity, type = 'set', reason } = req.body;
  
  if (type === 'add') {
    product.stock += parseInt(quantity);
  } else if (type === 'subtract') {
    product.stock -= parseInt(quantity);
  } else {
    product.stock = parseInt(quantity);
  }

  product.updatedAt = new Date().toISOString();

  // Log stock movement
  if (!store.inventory) store.inventory = [];
  store.inventory.push({
    id: uuidv4(),
    companyId: req.user.companyId,
    productId: product.id,
    productName: product.name,
    type,
    quantity: parseInt(quantity),
    reason,
    newStock: product.stock,
    createdAt: new Date().toISOString(),
    createdBy: req.user.id
  });

  res.json({
    success: true,
    data: product
  });
});

module.exports = router;
