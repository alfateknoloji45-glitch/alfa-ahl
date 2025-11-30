const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/customers
 * List all customers for the company
 */
router.get('/', authenticate, checkModuleAccess('crm'), (req, res) => {
  const customers = store.customers.filter(c => c.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: customers,
    count: customers.length
  });
});

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get('/:id', authenticate, checkModuleAccess('crm'), (req, res) => {
  const customer = store.customers.find(
    c => c.id === req.params.id && c.companyId === req.user.companyId
  );

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Müşteri bulunamadı'
    });
  }

  res.json({
    success: true,
    data: customer
  });
});

/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', authenticate, checkModuleAccess('crm'), (req, res) => {
  const { name, email, phone, address, taxId, type = 'individual', notes } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Müşteri adı gerekli'
    });
  }

  const newCustomer = {
    id: uuidv4(),
    companyId: req.user.companyId,
    name,
    email,
    phone,
    address,
    taxId,
    type, // 'individual' or 'business'
    notes,
    totalPurchases: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.customers.push(newCustomer);

  res.status(201).json({
    success: true,
    data: newCustomer
  });
});

/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put('/:id', authenticate, checkModuleAccess('crm'), (req, res) => {
  const customer = store.customers.find(
    c => c.id === req.params.id && c.companyId === req.user.companyId
  );

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Müşteri bulunamadı'
    });
  }

  const { name, email, phone, address, taxId, type, notes } = req.body;
  
  if (name) customer.name = name;
  if (email !== undefined) customer.email = email;
  if (phone !== undefined) customer.phone = phone;
  if (address !== undefined) customer.address = address;
  if (taxId !== undefined) customer.taxId = taxId;
  if (type) customer.type = type;
  if (notes !== undefined) customer.notes = notes;
  customer.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: customer
  });
});

/**
 * DELETE /api/customers/:id
 * Delete customer
 */
router.delete('/:id', authenticate, checkModuleAccess('crm'), (req, res) => {
  const index = store.customers.findIndex(
    c => c.id === req.params.id && c.companyId === req.user.companyId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Müşteri bulunamadı'
    });
  }

  store.customers.splice(index, 1);

  res.json({
    success: true,
    message: 'Müşteri silindi'
  });
});

/**
 * GET /api/customers/:id/orders
 * Get customer orders
 */
router.get('/:id/orders', authenticate, checkModuleAccess('crm'), (req, res) => {
  const orders = store.posOrders.filter(
    o => o.customerId === req.params.id && o.companyId === req.user.companyId
  );

  res.json({
    success: true,
    data: orders,
    count: orders.length
  });
});

module.exports = router;
