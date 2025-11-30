# 🚀 ALFAI Enterprise ERP

Modern, güçlü ve ölçeklenebilir kurumsal kaynak planlama (ERP) sistemi.

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Modüller](#modüller)
- [API Dokümantasyonu](#api-dokümantasyonu)

## ✨ Özellikler

### 🎯 Temel Modüller
- ✅ **Dashboard** - Kapsamlı iş zekası paneli
- ✅ **Finans** - Fatura, ödeme ve finansal raporlama
- ✅ **Envanter** - Stok yönetimi ve takibi
- ✅ **CRM** - Müşteri ilişkileri yönetimi
- ✅ **Satış** - Satış süreçleri ve sipariş yönetimi
- ✅ **Satın Alma** - Tedarikçi ve satın alma süreçleri
- ✅ **İnsan Kaynakları** - Çalışan yönetimi
- ✅ **Üretim** - Üretim planlama ve takibi
- ✅ **Projeler** - Proje yönetimi
- ✅ **Bakım** - Bakım talepleri ve takibi
- ✅ **Helpdesk** - Müşteri destek sistemi
- ✅ **Lojistik** - Kargo ve teslimat takibi

### 🤖 AI Özellikleri
- ✅ **AI Asistan** - Akıllı iş asistanı
- ✅ **CFO Analizi** - Otomatik finansal analiz
- ✅ **Sohbet AI** - Doğal dil ile komut verme
- ✅ **Tahmin Modelleri** - Satış ve stok tahminleri

### 📊 Gelişmiş Özellikler
- ✅ **Raporlama** - PDF/Excel rapor oluşturma
- ✅ **Analytics** - Gelişmiş iş analitiği
- ✅ **Workflow** - İş akışı otomasyonu
- ✅ **Teklif Sistemi** - Hızlı teklif oluşturma
- ✅ **Abonelik Yönetimi** - SaaS faturalandırma
- ✅ **Multi-tenant** - Çoklu şirket desteği

### 🛡️ Sistem Özellikleri
- ✅ **Admin Panel** - Sistem yönetimi
- ✅ **Güvenlik** - Role-based access control
- ✅ **Bildirimler** - Real-time bildirim sistemi
- ✅ **Hata Takibi** - Otomatik hata loglama
- ✅ **Dark Mode** - Karanlık tema desteği
- ✅ **PWA Ready** - Progressive Web App

## 🛠️ Teknolojiler

### Backend
- **Node.js** v18+
- **Express.js** - Web framework
- **Axios** - HTTP client
- **Odoo XML-RPC** - ERP entegrasyonu

### Frontend
- **React** 18.2
- **Vite** - Build tool
- **Lucide Icons** - Modern icon seti
- **Chart.js** - Grafik ve görselleştirme
- **jsPDF** - PDF oluşturma
- **XLSX** - Excel işlemleri

## 🚀 Kurulum

### Gereksinimler
- Node.js 18 veya üzeri
- npm veya yarn
- Odoo ERP (opsiyonel, local mode desteklenir)

### Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm start
```

Backend varsayılan olarak http://localhost:5002 adresinde çalışacaktır.

### Frontend Kurulumu

```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run dev
```

Frontend varsayılan olarak http://localhost:5173 adresinde çalışacaktır.

## 📖 Kullanım

### Geliştirme Modu

```bash
# Backend
cd backend && npm run dev

# Frontend (yeni terminal)
cd frontend && npm run dev
```

### Production Build

```bash
# Frontend build
cd frontend
npm run build
npm run preview

# Backend production
cd backend
NODE_ENV=production npm start
```

## 📦 Modüller

### Core Modules (src/modules/)
- `Dashboard.jsx` - Ana gösterge paneli
- `Finance.jsx` - Finansal yönetim
- `Inventory.jsx` - Envanter kontrolü
- `Customers.jsx` - Müşteri yönetimi
- `Sales.jsx` - Satış modülü
- `Purchase.jsx` - Satın alma
- `HR.jsx` - İnsan kaynakları
- `Manufacturing.jsx` - Üretim
- `Projects.jsx` - Proje yönetimi
- `Maintenance.jsx` - Bakım
- `Helpdesk.jsx` - Destek sistemi
- `CRM.jsx` - Müşteri ilişkileri
- `Logistics.jsx` - Lojistik
- `AI.jsx` - AI asistan
- `ChatAI.jsx` - AI sohbet
- `Analytics.jsx` - Analizler
- `Reports.jsx` - Raporlama
- `QuoteBuilder.jsx` - Teklif oluşturucu
- `SubscriptionManagement.jsx` - Abonelikler
- `InvoiceSystem.jsx` - Fatura sistemi

### External Features (external_features/)
- `AdminPanel.jsx` - Admin kontrolü
- `CompanySetup.jsx` - Şirket ayarları
- `NotificationCenter.jsx` - Bildirimler
- `ErrorBoundary.jsx` - Hata yönetimi
- `ErrorTracking.jsx` - Hata takibi
- `HelpCenter.jsx` - Yardım merkezi
- `OnboardingWizard.jsx` - Kullanıcı onboarding
- `SecurityHardening.jsx` - Güvenlik
- `PerformanceProfiler.jsx` - Performans analizi
- Ve 25+ ek modül...

## 🔌 API Dokümantasyonu

### Temel Endpoint'ler

#### Health Check
```
GET /api/health
```

#### Authentication
```
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
```

#### Odoo Integration
```
GET /api/odoo/version
GET /api/odoo/summary
GET /api/odoo/finance
GET /api/odoo/inventory
GET /api/odoo/products
POST /api/odoo/invoice
POST /api/odoo/invoice/:id/payment
```

#### AI Assistant
```
POST /api/ai/chat
POST /api/ai/cfo-analysis
```

#### Customers & Products
```
GET /api/customers
POST /api/customers
PUT /api/customers/:id
DELETE /api/customers/:id

GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
```

#### Quotes
```
GET /api/quotes
POST /api/quotes
PUT /api/quotes/:id/status
```

#### Subscriptions
```
GET /api/subscriptions/current
POST /api/subscriptions/create
POST /api/subscriptions/:id/cancel
GET /api/subscriptions/usage
```

#### SaaS Management
```
GET /api/saas/companies
POST /api/saas/companies
PUT /api/saas/companies/:id/status
PUT /api/saas/companies/:id/plan
DELETE /api/saas/companies/:id
GET /api/saas/subdomain/:name/available
```

#### Error Tracking
```
GET /api/errors
POST /api/errors
```

## 🎨 Tema ve Özelleştirme

### Dark Mode
```javascript
// Tema değiştirme
localStorage.setItem('alfai_theme', 'dark'); // veya 'light'
```

### Rol Tabanlı Erişim
```javascript
// Rolleri yapılandırma
localStorage.setItem('alfai_role', 'admin'); // admin, user, manager
```

### Profile Seçimi
```javascript
// Profil belirleme
localStorage.setItem('alfai_profile', 'sales-demo'); // veya diğer profiller
```

## 🔒 Güvenlik

- JWT token bazlı kimlik doğrulama
- Role-based access control (RBAC)
- CORS yapılandırması
- XSS koruması
- SQL injection koruması
- Rate limiting (planlı)

## 📊 Performans

- Lazy loading modüller
- API response caching
- Optimized bundle size
- Code splitting
- Image optimization (planlı)
- CDN integration (planlı)

## 🧪 Test

```bash
# Unit tests (planlı)
npm test

# E2E tests (planlı)
npm run test:e2e
```

## 📝 Lisans

Bu proje özel lisans altındadır. Kullanım için izin gereklidir.

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 Destek

- Email: support@alfai.com
- Documentation: https://docs.alfai.com
- GitHub Issues: https://github.com/alfai/enterprise/issues

## 🗺️ Roadmap

### Q1 2024
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Blockchain integration

### Q2 2024
- [ ] AI-powered automation
- [ ] Advanced reporting
- [ ] Third-party integrations
- [ ] White-label solution

## 📈 Versiyon Geçmişi

### v1.0.0 (Current)
- ✅ Initial release
- ✅ 32+ core modules
- ✅ Odoo integration
- ✅ AI assistant
- ✅ Multi-tenant support

---

**Made with ❤️ by ALFAI Team**
