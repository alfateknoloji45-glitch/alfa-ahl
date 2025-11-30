/**
 * In-memory data store for ALFAI Enterprise
 * In production, this would be replaced with a real database
 */

const { v4: uuidv4 } = require('uuid');

// Available modules with pricing
const AVAILABLE_MODULES = {
  dashboard: { name: 'Dashboard', price: 0, included: true, description: 'Ana gösterge paneli' },
  finance: { name: 'Finans', price: 199, included: false, description: 'Fatura ve finansal yönetim' },
  inventory: { name: 'Envanter', price: 149, included: false, description: 'Stok yönetimi ve takibi' },
  crm: { name: 'CRM', price: 249, included: false, description: 'Müşteri ilişkileri yönetimi' },
  sales: { name: 'Satış', price: 199, included: false, description: 'Satış süreçleri yönetimi' },
  pos: { name: 'POS/Adisyon', price: 299, included: false, description: 'Kasa ve adisyon sistemi' },
  purchase: { name: 'Satın Alma', price: 149, included: false, description: 'Tedarikçi ve satın alma' },
  hr: { name: 'İnsan Kaynakları', price: 199, included: false, description: 'Çalışan yönetimi' },
  manufacturing: { name: 'Üretim', price: 349, included: false, description: 'Üretim planlama ve takibi' },
  projects: { name: 'Projeler', price: 179, included: false, description: 'Proje yönetimi' },
  maintenance: { name: 'Bakım', price: 129, included: false, description: 'Bakım talepleri' },
  helpdesk: { name: 'Helpdesk', price: 149, included: false, description: 'Müşteri destek' },
  logistics: { name: 'Lojistik', price: 199, included: false, description: 'Kargo ve teslimat' },
  analytics: { name: 'Analitik', price: 249, included: false, description: 'İş zekası ve raporlar' },
  ai: { name: 'AI Asistan', price: 399, included: false, description: 'Yapay zeka asistanı' },
  accounting: { name: 'Muhasebe', price: 299, included: false, description: 'Gelişmiş muhasebe' },
  ecommerce: { name: 'E-Ticaret', price: 349, included: false, description: 'Online satış entegrasyonu' },
  restaurant: { name: 'Restoran', price: 249, included: false, description: 'Restoran yönetimi' },
  hotel: { name: 'Otel', price: 349, included: false, description: 'Otel yönetimi' },
  fleet: { name: 'Filo Yönetimi', price: 199, included: false, description: 'Araç takibi' }
};

// Subscription plans
const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    modules: ['dashboard', 'finance', 'inventory', 'crm'],
    maxUsers: 3,
    maxCompanies: 1,
    description: 'Küçük işletmeler için ideal başlangıç paketi'
  },
  professional: {
    name: 'Professional',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    modules: ['dashboard', 'finance', 'inventory', 'crm', 'sales', 'pos', 'purchase', 'hr'],
    maxUsers: 10,
    maxCompanies: 3,
    description: 'Büyüyen işletmeler için profesyonel çözüm'
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    modules: Object.keys(AVAILABLE_MODULES),
    maxUsers: -1, // Unlimited
    maxCompanies: -1, // Unlimited
    description: 'Kurumsal şirketler için tam özellikli paket'
  },
  custom: {
    name: 'Özel Paket',
    monthlyPrice: 0,
    yearlyPrice: 0,
    modules: ['dashboard'],
    maxUsers: 1,
    maxCompanies: 1,
    description: 'İhtiyaçlarınıza göre özelleştirilebilir paket'
  }
};

// Demo company for trials
const createDemoCompany = () => ({
  id: uuidv4(),
  name: 'Demo Şirket',
  subdomain: 'demo',
  plan: 'enterprise',
  status: 'trial',
  trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  activeModules: Object.keys(AVAILABLE_MODULES),
  createdAt: new Date().toISOString()
});

// In-memory stores
const store = {
  users: [
    {
      id: '1',
      email: 'demo@alfai.com',
      password: '$2a$10$xxxxxxxxxxx', // bcrypt hash of 'demo'
      name: 'Demo Kullanıcı',
      role: 'admin',
      companyId: 'demo-company-1',
      createdAt: new Date().toISOString()
    }
  ],
  companies: [
    {
      id: 'demo-company-1',
      name: 'Demo Şirket A.Ş.',
      subdomain: 'demo',
      plan: 'enterprise',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      activeModules: Object.keys(AVAILABLE_MODULES),
      extraModules: [],
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    }
  ],
  subscriptions: [],
  moduleSubscriptions: [],
  customers: [],
  products: [],
  invoices: [],
  posOrders: [],
  inventory: [],
  employees: [],
  projects: [],
  reports: []
};

module.exports = {
  AVAILABLE_MODULES,
  SUBSCRIPTION_PLANS,
  createDemoCompany,
  store
};
