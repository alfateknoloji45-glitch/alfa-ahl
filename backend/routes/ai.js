const express = require('express');
const router = express.Router();

const { store, AVAILABLE_MODULES, SUBSCRIPTION_PLANS } = require('../models/store');
const { authenticate } = require('../middleware/auth');

/**
 * AI Assistant Service
 * Provides intelligent responses and analysis
 */

const generateAIResponse = (message, context) => {
  const lowerMessage = message.toLowerCase();
  
  // Sales related queries
  if (lowerMessage.includes('satış') || lowerMessage.includes('ciro') || lowerMessage.includes('gelir')) {
    const revenue = context.invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.grandTotal, 0);
    const posRevenue = context.posOrders
      .filter(o => o.status === 'closed')
      .reduce((sum, o) => sum + o.grandTotal, 0);
    
    return {
      message: `📊 Satış Analizi:\n\nToplam Fatura Geliri: ₺${revenue.toLocaleString('tr-TR')}\nPOS Satışları: ₺${posRevenue.toLocaleString('tr-TR')}\nToplam Ciro: ₺${(revenue + posRevenue).toLocaleString('tr-TR')}\n\nÖneri: Satışlarınızı artırmak için CRM modülünü kullanarak müşteri segmentasyonu yapabilirsiniz.`,
      type: 'analysis'
    };
  }

  // Stock related queries
  if (lowerMessage.includes('stok') || lowerMessage.includes('envanter') || lowerMessage.includes('ürün')) {
    const lowStock = context.products.filter(p => p.trackInventory && p.stock <= p.minStock);
    const outOfStock = context.products.filter(p => p.trackInventory && p.stock <= 0);
    
    return {
      message: `📦 Stok Durumu:\n\nToplam Ürün: ${context.products.length}\nDüşük Stok: ${lowStock.length} ürün\nTükenen: ${outOfStock.length} ürün\n\n${lowStock.length > 0 ? '⚠️ Dikkat: Stok seviyeleri düşük olan ürünler var!' : '✅ Stok seviyeleri normal görünüyor.'}\n\nÖneri: Otomatik yeniden sipariş kuralları oluşturarak stok yönetimini optimize edebilirsiniz.`,
      type: 'analysis'
    };
  }

  // Customer related queries
  if (lowerMessage.includes('müşteri') || lowerMessage.includes('crm')) {
    return {
      message: `👥 Müşteri Analizi:\n\nToplam Müşteri: ${context.customers.length}\nBireysel: ${context.customers.filter(c => c.type === 'individual').length}\nKurumsal: ${context.customers.filter(c => c.type === 'business').length}\n\nÖneri: Müşteri sadakat programı oluşturarak tekrarlayan satışları artırabilirsiniz.`,
      type: 'analysis'
    };
  }

  // Subscription/plan queries
  if (lowerMessage.includes('abonelik') || lowerMessage.includes('plan') || lowerMessage.includes('modül') || lowerMessage.includes('paket')) {
    const company = context.company;
    const plan = SUBSCRIPTION_PLANS[company?.plan];
    
    return {
      message: `📋 Abonelik Bilgileri:\n\nMevcut Plan: ${plan?.name || 'Tanımsız'}\nDurum: ${company?.status === 'trial' ? 'Deneme Sürümü' : 'Aktif'}\nAktif Modüller: ${company?.activeModules?.length || 0}\n\n${company?.status === 'trial' ? `⏰ Deneme süreniz ${Math.ceil((new Date(company.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} gün sonra dolacak.` : ''}\n\nÖneri: İhtiyaçlarınıza göre modül ekleyerek sistemi özelleştirebilirsiniz.`,
      type: 'info'
    };
  }

  // Help queries
  if (lowerMessage.includes('yardım') || lowerMessage.includes('nasıl') || lowerMessage.includes('ne yapabilirim')) {
    return {
      message: `🤖 ALFAI Asistan - Yardım\n\nSize şu konularda yardımcı olabilirim:\n\n📊 Satış Analizi - "Satışlarım nasıl?" diye sorun\n📦 Stok Durumu - "Stok durumum nedir?" diye sorun\n👥 Müşteri Analizi - "Müşterilerim hakkında bilgi ver"\n📋 Abonelik - "Planım hakkında bilgi" diye sorun\n💡 Öneriler - "Öneriler ver" diye sorun\n\nHerhangi bir konuda detaylı bilgi için modül adını yazabilirsiniz.`,
      type: 'help'
    };
  }

  // Recommendations
  if (lowerMessage.includes('öneri') || lowerMessage.includes('tavsiye')) {
    const recommendations = [];
    
    if (context.products.filter(p => p.stock <= p.minStock).length > 0) {
      recommendations.push('• Düşük stoklu ürünleriniz var, sipariş vermeyi düşünün');
    }
    if (context.invoices.filter(i => i.status === 'sent').length > 0) {
      recommendations.push('• Ödenmemiş faturalarınız var, takip edin');
    }
    if (context.company?.status === 'trial') {
      recommendations.push('• Deneme süreniz devam ediyor, bir plan seçmeyi unutmayın');
    }
    if (context.customers.length < 10) {
      recommendations.push('• Müşteri veritabanınızı genişletin');
    }

    return {
      message: `💡 Öneriler:\n\n${recommendations.length > 0 ? recommendations.join('\n') : 'Şu an için önemli bir öneri bulunmuyor. İşleriniz yolunda görünüyor! ✅'}`,
      type: 'recommendations'
    };
  }

  // Default response
  return {
    message: `Merhaba! Ben ALFAI yapay zeka asistanınızım. 🤖\n\nSize satış, stok, müşteri ve abonelik konularında yardımcı olabilirim.\n\n"Yardım" yazarak tüm komutları görebilirsiniz.`,
    type: 'greeting'
  };
};

/**
 * POST /api/ai/chat
 * Chat with AI assistant
 */
router.post('/chat', authenticate, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Mesaj gerekli'
    });
  }

  const companyId = req.user.companyId;
  const context = {
    company: store.companies.find(c => c.id === companyId),
    customers: store.customers.filter(c => c.companyId === companyId),
    products: store.products.filter(p => p.companyId === companyId),
    invoices: store.invoices.filter(i => i.companyId === companyId),
    posOrders: store.posOrders.filter(o => o.companyId === companyId),
    employees: (store.employees || []).filter(e => e.companyId === companyId),
    projects: (store.projects || []).filter(p => p.companyId === companyId)
  };

  const response = generateAIResponse(message, context);

  res.json({
    success: true,
    data: {
      query: message,
      response: response.message,
      type: response.type,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/ai/cfo-analysis
 * Get CFO-level financial analysis
 */
router.get('/cfo-analysis', authenticate, (req, res) => {
  const companyId = req.user.companyId;
  
  const invoices = store.invoices.filter(i => i.companyId === companyId);
  const posOrders = store.posOrders.filter(o => o.companyId === companyId);
  const products = store.products.filter(p => p.companyId === companyId);
  const employees = (store.employees || []).filter(e => e.companyId === companyId && e.status === 'active');

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const closedOrders = posOrders.filter(o => o.status === 'closed');

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.grandTotal, 0) +
                       closedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  
  const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const payroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);

  const outstandingReceivables = invoices
    .filter(i => ['draft', 'sent'].includes(i.status))
    .reduce((sum, i) => sum + (i.grandTotal - i.paidAmount), 0);

  res.json({
    success: true,
    data: {
      financialSummary: {
        totalRevenue,
        grossProfit: totalRevenue * 0.35, // Estimated
        netProfit: totalRevenue * 0.15, // Estimated
        operatingExpenses: payroll
      },
      cashFlow: {
        inflow: totalRevenue,
        outflow: payroll + (inventoryValue * 0.1),
        net: totalRevenue - payroll - (inventoryValue * 0.1)
      },
      balanceSheet: {
        assets: {
          inventory: inventoryValue,
          receivables: outstandingReceivables,
          total: inventoryValue + outstandingReceivables
        },
        liabilities: {
          payables: 0,
          total: 0
        }
      },
      kpis: {
        revenueGrowth: '+12%', // Placeholder
        profitMargin: '15%',
        inventoryTurnover: '4.2x',
        daysReceivables: '30 days'
      },
      recommendations: [
        outstandingReceivables > 0 ? 'Tahsil edilmemiş alacaklarınız var, takip edilmeli' : null,
        inventoryValue > totalRevenue * 0.5 ? 'Stok değeriniz yüksek, optimize edilebilir' : null,
        'Aylık nakit akışı pozitif, büyüme yatırımları değerlendirilebilir'
      ].filter(Boolean),
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * GET /api/ai/insights
 * Get AI-generated business insights
 */
router.get('/insights', authenticate, (req, res) => {
  const companyId = req.user.companyId;
  
  const products = store.products.filter(p => p.companyId === companyId);
  const posOrders = store.posOrders.filter(o => o.companyId === companyId && o.status === 'closed');
  const customers = store.customers.filter(c => c.companyId === companyId);

  const insights = [];

  // Low stock insight
  const lowStock = products.filter(p => p.trackInventory && p.stock <= p.minStock);
  if (lowStock.length > 0) {
    insights.push({
      type: 'warning',
      category: 'inventory',
      title: 'Düşük Stok Uyarısı',
      message: `${lowStock.length} üründe stok seviyesi kritik. Hemen sipariş vermeyi düşünün.`,
      action: 'Stok Yönetimi',
      priority: 'high'
    });
  }

  // Sales trend insight
  const today = new Date().toISOString().split('T')[0];
  const todaySales = posOrders.filter(o => o.createdAt.startsWith(today));
  if (todaySales.length > 0) {
    insights.push({
      type: 'success',
      category: 'sales',
      title: 'Bugünkü Satışlar',
      message: `Bugün ${todaySales.length} satış gerçekleşti, toplam ₺${todaySales.reduce((s, o) => s + o.grandTotal, 0).toLocaleString('tr-TR')}`,
      priority: 'medium'
    });
  }

  // Customer growth insight
  if (customers.length > 0) {
    insights.push({
      type: 'info',
      category: 'crm',
      title: 'Müşteri Portföyü',
      message: `${customers.length} aktif müşteriniz var. Müşteri sadakat programı oluşturabilirsiniz.`,
      action: 'CRM',
      priority: 'low'
    });
  }

  res.json({
    success: true,
    data: {
      insights,
      generatedAt: new Date().toISOString()
    }
  });
});

module.exports = router;
