const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/pos/orders
 * List all POS orders (adisyonlar)
 */
router.get('/orders', authenticate, checkModuleAccess('pos'), (req, res) => {
  const orders = store.posOrders.filter(o => o.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    count: orders.length
  });
});

/**
 * GET /api/pos/orders/active
 * Get active (open) orders
 */
router.get('/orders/active', authenticate, checkModuleAccess('pos'), (req, res) => {
  const activeOrders = store.posOrders.filter(
    o => o.companyId === req.user.companyId && o.status === 'open'
  );
  
  res.json({
    success: true,
    data: activeOrders,
    count: activeOrders.length
  });
});

/**
 * GET /api/pos/orders/:id
 * Get order by ID
 */
router.get('/orders/:id', authenticate, checkModuleAccess('pos'), (req, res) => {
  const order = store.posOrders.find(
    o => o.id === req.params.id && o.companyId === req.user.companyId
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Adisyon bulunamadı'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * POST /api/pos/orders
 * Create new POS order (adisyon aç)
 */
router.post('/orders', authenticate, checkModuleAccess('pos'), (req, res) => {
  const { 
    tableNumber,
    tableName,
    customerId,
    customerName,
    items = [],
    notes
  } = req.body;

  const orderNumber = `POS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(store.posOrders.length + 1).padStart(4, '0')}`;

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;

  const processedItems = items.map(item => {
    const itemSubtotal = item.quantity * item.price;
    const itemTax = itemSubtotal * (item.taxRate || 18) / 100;
    subtotal += itemSubtotal;
    totalTax += itemTax;

    return {
      id: uuidv4(),
      ...item,
      subtotal: itemSubtotal,
      tax: itemTax,
      total: itemSubtotal + itemTax,
      addedAt: new Date().toISOString()
    };
  });

  const newOrder = {
    id: uuidv4(),
    companyId: req.user.companyId,
    orderNumber,
    tableNumber,
    tableName: tableName || `Masa ${tableNumber}`,
    customerId,
    customerName,
    items: processedItems,
    subtotal,
    taxTotal: totalTax,
    discount: 0,
    discountAmount: 0,
    grandTotal: subtotal + totalTax,
    status: 'open', // open, closed, cancelled
    paymentMethod: null,
    paidAt: null,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.id
  };

  store.posOrders.push(newOrder);

  res.status(201).json({
    success: true,
    data: newOrder
  });
});

/**
 * POST /api/pos/orders/:id/items
 * Add items to existing order
 */
router.post('/orders/:id/items', authenticate, checkModuleAccess('pos'), (req, res) => {
  const order = store.posOrders.find(
    o => o.id === req.params.id && o.companyId === req.user.companyId
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Adisyon bulunamadı'
    });
  }

  if (order.status !== 'open') {
    return res.status(400).json({
      success: false,
      error: 'Kapalı adisyona ürün eklenemez'
    });
  }

  const { items = [] } = req.body;

  items.forEach(item => {
    const itemSubtotal = item.quantity * item.price;
    const itemTax = itemSubtotal * (item.taxRate || 18) / 100;

    order.items.push({
      id: uuidv4(),
      ...item,
      subtotal: itemSubtotal,
      tax: itemTax,
      total: itemSubtotal + itemTax,
      addedAt: new Date().toISOString()
    });

    order.subtotal += itemSubtotal;
    order.taxTotal += itemTax;
  });

  order.grandTotal = order.subtotal + order.taxTotal - order.discountAmount;
  order.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: order
  });
});

/**
 * DELETE /api/pos/orders/:id/items/:itemId
 * Remove item from order
 */
router.delete('/orders/:id/items/:itemId', authenticate, checkModuleAccess('pos'), (req, res) => {
  const order = store.posOrders.find(
    o => o.id === req.params.id && o.companyId === req.user.companyId
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Adisyon bulunamadı'
    });
  }

  if (order.status !== 'open') {
    return res.status(400).json({
      success: false,
      error: 'Kapalı adisyondan ürün silinemez'
    });
  }

  const itemIndex = order.items.findIndex(i => i.id === req.params.itemId);
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Ürün bulunamadı'
    });
  }

  const [removedItem] = order.items.splice(itemIndex, 1);
  
  order.subtotal -= removedItem.subtotal;
  order.taxTotal -= removedItem.tax;
  order.grandTotal = order.subtotal + order.taxTotal - order.discountAmount;
  order.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: order
  });
});

/**
 * POST /api/pos/orders/:id/close
 * Close order and process payment
 */
router.post('/orders/:id/close', authenticate, checkModuleAccess('pos'), (req, res) => {
  const order = store.posOrders.find(
    o => o.id === req.params.id && o.companyId === req.user.companyId
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Adisyon bulunamadı'
    });
  }

  if (order.status !== 'open') {
    return res.status(400).json({
      success: false,
      error: 'Bu adisyon zaten kapalı'
    });
  }

  const { paymentMethod = 'cash', discount = 0 } = req.body;

  // Apply discount
  if (discount > 0) {
    order.discount = discount;
    order.discountAmount = order.subtotal * discount / 100;
    order.grandTotal = order.subtotal + order.taxTotal - order.discountAmount;
  }

  order.status = 'closed';
  order.paymentMethod = paymentMethod;
  order.paidAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  // Update product stock if tracking inventory
  order.items.forEach(item => {
    const product = store.products.find(p => p.id === item.productId);
    if (product && product.trackInventory) {
      product.stock -= item.quantity;
    }
  });

  res.json({
    success: true,
    message: 'Adisyon kapatıldı',
    data: order
  });
});

/**
 * POST /api/pos/orders/:id/cancel
 * Cancel order
 */
router.post('/orders/:id/cancel', authenticate, checkModuleAccess('pos'), (req, res) => {
  const order = store.posOrders.find(
    o => o.id === req.params.id && o.companyId === req.user.companyId
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Adisyon bulunamadı'
    });
  }

  const { reason } = req.body;

  order.status = 'cancelled';
  order.cancelReason = reason;
  order.cancelledAt = new Date().toISOString();
  order.cancelledBy = req.user.id;
  order.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Adisyon iptal edildi',
    data: order
  });
});

/**
 * GET /api/pos/stats
 * Get POS statistics
 */
router.get('/stats', authenticate, checkModuleAccess('pos'), (req, res) => {
  const orders = store.posOrders.filter(o => o.companyId === req.user.companyId);
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const todayClosed = todayOrders.filter(o => o.status === 'closed');

  const stats = {
    today: {
      totalOrders: todayOrders.length,
      openOrders: todayOrders.filter(o => o.status === 'open').length,
      closedOrders: todayClosed.length,
      revenue: todayClosed.reduce((sum, o) => sum + o.grandTotal, 0),
      averageOrder: todayClosed.length > 0 ? todayClosed.reduce((sum, o) => sum + o.grandTotal, 0) / todayClosed.length : 0
    },
    paymentMethods: {
      cash: todayClosed.filter(o => o.paymentMethod === 'cash').length,
      card: todayClosed.filter(o => o.paymentMethod === 'card').length,
      other: todayClosed.filter(o => !['cash', 'card'].includes(o.paymentMethod)).length
    },
    allTime: {
      totalOrders: orders.length,
      totalRevenue: orders.filter(o => o.status === 'closed').reduce((sum, o) => sum + o.grandTotal, 0)
    }
  };

  res.json({
    success: true,
    data: stats
  });
});

/**
 * GET /api/pos/tables
 * Get table status
 */
router.get('/tables', authenticate, checkModuleAccess('pos'), (req, res) => {
  const activeOrders = store.posOrders.filter(
    o => o.companyId === req.user.companyId && o.status === 'open'
  );

  // Default tables (could be configurable)
  const tables = [];
  for (let i = 1; i <= 20; i++) {
    const activeOrder = activeOrders.find(o => o.tableNumber === i);
    tables.push({
      number: i,
      name: `Masa ${i}`,
      status: activeOrder ? 'occupied' : 'available',
      order: activeOrder || null
    });
  }

  res.json({
    success: true,
    data: tables
  });
});

module.exports = router;
