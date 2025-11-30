const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/invoices
 * List all invoices
 */
router.get('/', authenticate, checkModuleAccess('finance'), (req, res) => {
  const invoices = store.invoices.filter(i => i.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    count: invoices.length
  });
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', authenticate, checkModuleAccess('finance'), (req, res) => {
  const invoice = store.invoices.find(
    i => i.id === req.params.id && i.companyId === req.user.companyId
  );

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: 'Fatura bulunamadı'
    });
  }

  res.json({
    success: true,
    data: invoice
  });
});

/**
 * POST /api/invoices
 * Create new invoice
 */
router.post('/', authenticate, checkModuleAccess('finance'), (req, res) => {
  const { 
    customerId,
    customerName,
    type = 'sales', // 'sales' or 'purchase'
    items = [],
    dueDate,
    notes,
    discount = 0
  } = req.body;

  if (!items.length) {
    return res.status(400).json({
      success: false,
      error: 'En az bir ürün gerekli'
    });
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;

  const processedItems = items.map(item => {
    const itemSubtotal = item.quantity * item.price;
    const itemTax = itemSubtotal * (item.taxRate || 18) / 100;
    subtotal += itemSubtotal;
    totalTax += itemTax;

    return {
      ...item,
      subtotal: itemSubtotal,
      tax: itemTax,
      total: itemSubtotal + itemTax
    };
  });

  const discountAmount = discount > 0 ? (subtotal * discount / 100) : 0;
  const grandTotal = subtotal + totalTax - discountAmount;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(store.invoices.length + 1).padStart(6, '0')}`;

  const newInvoice = {
    id: uuidv4(),
    companyId: req.user.companyId,
    invoiceNumber,
    type,
    customerId,
    customerName,
    items: processedItems,
    subtotal,
    discount,
    discountAmount,
    taxTotal: totalTax,
    grandTotal,
    status: 'draft', // draft, sent, paid, cancelled
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes,
    payments: [],
    paidAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.id
  };

  store.invoices.push(newInvoice);

  res.status(201).json({
    success: true,
    data: newInvoice
  });
});

/**
 * PUT /api/invoices/:id/status
 * Update invoice status
 */
router.put('/:id/status', authenticate, checkModuleAccess('finance'), (req, res) => {
  const invoice = store.invoices.find(
    i => i.id === req.params.id && i.companyId === req.user.companyId
  );

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: 'Fatura bulunamadı'
    });
  }

  const { status } = req.body;
  const validStatuses = ['draft', 'sent', 'paid', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz durum'
    });
  }

  invoice.status = status;
  invoice.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: invoice
  });
});

/**
 * POST /api/invoices/:id/payment
 * Add payment to invoice
 */
router.post('/:id/payment', authenticate, checkModuleAccess('finance'), (req, res) => {
  const invoice = store.invoices.find(
    i => i.id === req.params.id && i.companyId === req.user.companyId
  );

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: 'Fatura bulunamadı'
    });
  }

  const { amount, method = 'cash', reference, notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Geçerli bir tutar giriniz'
    });
  }

  const payment = {
    id: uuidv4(),
    amount: parseFloat(amount),
    method, // cash, card, transfer, check
    reference,
    notes,
    date: new Date().toISOString(),
    createdBy: req.user.id
  };

  invoice.payments.push(payment);
  invoice.paidAmount += payment.amount;
  
  if (invoice.paidAmount >= invoice.grandTotal) {
    invoice.status = 'paid';
  }

  invoice.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: invoice
  });
});

/**
 * GET /api/invoices/stats
 * Get invoice statistics
 */
router.get('/stats/summary', authenticate, checkModuleAccess('finance'), (req, res) => {
  const invoices = store.invoices.filter(i => i.companyId === req.user.companyId);

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    cancelled: invoices.filter(i => i.status === 'cancelled').length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.grandTotal, 0),
    outstandingAmount: invoices.filter(i => ['draft', 'sent'].includes(i.status)).reduce((sum, i) => sum + (i.grandTotal - i.paidAmount), 0)
  };

  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;
