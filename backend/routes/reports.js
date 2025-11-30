const express = require('express');
const router = express.Router();

const { store, SUBSCRIPTION_PLANS, AVAILABLE_MODULES } = require('../models/store');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/reports/dashboard
 * Get dashboard summary data
 */
router.get('/dashboard', authenticate, (req, res) => {
  const companyId = req.user.companyId;
  const company = store.companies.find(c => c.id === companyId);
  
  // Calculate metrics
  const customers = store.customers.filter(c => c.companyId === companyId);
  const products = store.products.filter(p => p.companyId === companyId);
  const invoices = store.invoices.filter(i => i.companyId === companyId);
  const posOrders = store.posOrders.filter(o => o.companyId === companyId);
  const employees = (store.employees || []).filter(e => e.companyId === companyId);
  const projects = (store.projects || []).filter(p => p.companyId === companyId);

  const today = new Date().toISOString().split('T')[0];
  const todayPOS = posOrders.filter(o => o.createdAt.startsWith(today) && o.status === 'closed');

  // Trial info
  let trialInfo = null;
  if (company && company.status === 'trial') {
    const daysRemaining = Math.ceil((new Date(company.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    trialInfo = {
      daysRemaining: Math.max(0, daysRemaining),
      expiresAt: company.trialEndsAt,
      isExpiring: daysRemaining <= 7
    };
  }

  res.json({
    success: true,
    data: {
      summary: {
        customers: customers.length,
        products: products.length,
        employees: employees.filter(e => e.status === 'active').length,
        activeProjects: projects.filter(p => p.status === 'in_progress').length
      },
      finance: {
        totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.grandTotal, 0),
        pendingInvoices: invoices.filter(i => ['draft', 'sent'].includes(i.status)).length,
        outstandingAmount: invoices.filter(i => ['draft', 'sent'].includes(i.status)).reduce((sum, i) => sum + (i.grandTotal - i.paidAmount), 0)
      },
      pos: {
        todayOrders: todayPOS.length,
        todayRevenue: todayPOS.reduce((sum, o) => sum + o.grandTotal, 0),
        openOrders: posOrders.filter(o => o.status === 'open').length
      },
      inventory: {
        totalProducts: products.length,
        lowStock: products.filter(p => p.trackInventory && p.stock <= p.minStock).length,
        totalValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0)
      },
      subscription: company ? {
        plan: company.plan,
        status: company.status,
        activeModules: company.activeModules.length
      } : null,
      trialInfo
    }
  });
});

/**
 * GET /api/reports/sales
 * Get sales reports
 */
router.get('/sales', authenticate, (req, res) => {
  const companyId = req.user.companyId;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const invoices = store.invoices.filter(i => 
    i.companyId === companyId && 
    i.status === 'paid'
  );

  const posOrders = store.posOrders.filter(o => 
    o.companyId === companyId && 
    o.status === 'closed'
  );

  // Group by date
  const salesByDate = {};
  
  [...invoices, ...posOrders].forEach(item => {
    const date = item.createdAt.split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = { date, invoices: 0, pos: 0, total: 0 };
    }
    if (item.invoiceNumber) {
      salesByDate[date].invoices += item.grandTotal;
    } else {
      salesByDate[date].pos += item.grandTotal;
    }
    salesByDate[date].total += item.grandTotal;
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalInvoiceRevenue: invoices.reduce((sum, i) => sum + i.grandTotal, 0),
        totalPOSRevenue: posOrders.reduce((sum, o) => sum + o.grandTotal, 0),
        totalRevenue: invoices.reduce((sum, i) => sum + i.grandTotal, 0) + posOrders.reduce((sum, o) => sum + o.grandTotal, 0),
        invoiceCount: invoices.length,
        posOrderCount: posOrders.length
      },
      byDate: Object.values(salesByDate).sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  });
});

/**
 * GET /api/reports/products
 * Get product performance reports
 */
router.get('/products', authenticate, (req, res) => {
  const companyId = req.user.companyId;
  const products = store.products.filter(p => p.companyId === companyId);
  const posOrders = store.posOrders.filter(o => o.companyId === companyId && o.status === 'closed');

  // Calculate product sales
  const productSales = {};
  posOrders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          name: item.name,
          quantitySold: 0,
          revenue: 0
        };
      }
      productSales[item.productId].quantitySold += item.quantity;
      productSales[item.productId].revenue += item.total;
    });
  });

  res.json({
    success: true,
    data: {
      topSelling: Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      lowStock: products
        .filter(p => p.trackInventory && p.stock <= p.minStock)
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock
        })),
      inventoryValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0)
    }
  });
});

/**
 * GET /api/reports/customers
 * Get customer reports
 */
router.get('/customers', authenticate, (req, res) => {
  const companyId = req.user.companyId;
  const customers = store.customers.filter(c => c.companyId === companyId);
  const invoices = store.invoices.filter(i => i.companyId === companyId && i.status === 'paid');

  // Calculate customer revenue
  const customerRevenue = {};
  invoices.forEach(inv => {
    if (inv.customerId) {
      if (!customerRevenue[inv.customerId]) {
        customerRevenue[inv.customerId] = {
          customerId: inv.customerId,
          customerName: inv.customerName,
          invoiceCount: 0,
          totalSpent: 0
        };
      }
      customerRevenue[inv.customerId].invoiceCount++;
      customerRevenue[inv.customerId].totalSpent += inv.grandTotal;
    }
  });

  res.json({
    success: true,
    data: {
      totalCustomers: customers.length,
      newThisMonth: customers.filter(c => {
        const created = new Date(c.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      topCustomers: Object.values(customerRevenue)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10),
      byType: {
        individual: customers.filter(c => c.type === 'individual').length,
        business: customers.filter(c => c.type === 'business').length
      }
    }
  });
});

module.exports = router;
