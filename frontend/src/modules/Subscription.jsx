import React, { useState, useEffect } from 'react';
import { saasApi, subscriptionApi, modulesApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, CreditCard, Package, Clock, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { company, trialInfo } = useAuth();
  const [plans, setPlans] = useState([]);
  const [modules, setModules] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState('monthly');
  const [showModulesModal, setShowModulesModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, modulesRes, subRes] = await Promise.all([
        saasApi.getPlans(),
        modulesApi.getAccessible(),
        subscriptionApi.getCurrent()
      ]);
      
      if (plansRes.data.success) setPlans(plansRes.data.data.plans);
      if (modulesRes.data.success) setModules(modulesRes.data.data);
      if (subRes.data.success) setCurrentSubscription(subRes.data.data);
    } catch (error) {
      console.error('Abonelik verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const response = await subscriptionApi.upgrade(planId, selectedBilling);
      if (response.data.success) {
        toast.success(response.data.message);
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const handleAddModule = async (moduleId) => {
    try {
      const response = await subscriptionApi.addModule(moduleId, selectedBilling);
      if (response.data.success) {
        toast.success(response.data.message);
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Abonelik bilgileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Abonelik Yönetimi</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Planınızı yükseltin veya modül ekleyin</p>
      </div>

      {/* Trial Banner */}
      {trialInfo && !trialInfo.isExpired && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
          border: '1px solid #fcd34d',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Clock size={24} style={{ color: '#92400e' }} />
              <div>
                <h3 style={{ color: '#92400e', marginBottom: '0.25rem' }}>Deneme Süreniz</h3>
                <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  <strong>{trialInfo.daysRemaining} gün</strong> kaldı. Tüm modüllere erişiminiz var!
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#92400e' }}>
                {trialInfo.daysRemaining}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400e' }}>gün kaldı</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Mevcut Plan</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', textTransform: 'capitalize' }}>
              {currentSubscription?.subscription?.plan?.name || company?.plan}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className={`badge ${company?.status === 'trial' ? 'badge-warning' : 'badge-success'}`}>
                {company?.status === 'trial' ? 'Deneme' : 'Aktif'}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {currentSubscription?.subscription?.activeModules?.length || 0} modül aktif
              </span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModulesModal(true)}>
            <Package size={18} />
            Modül Ekle
          </button>
        </div>
      </div>

      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          background: 'var(--background)', 
          borderRadius: '8px', 
          padding: '4px'
        }}>
          <button
            className={`btn ${selectedBilling === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedBilling('monthly')}
            style={{ borderRadius: '6px' }}
          >
            Aylık
          </button>
          <button
            className={`btn ${selectedBilling === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedBilling('yearly')}
            style={{ borderRadius: '6px' }}
          >
            Yıllık <span style={{ fontSize: '0.75rem' }}>(%20 indirim)</span>
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="pricing-grid">
        {plans.filter(p => p.id !== 'custom').map((plan) => (
          <div 
            key={plan.id}
            className={`pricing-card ${plan.id === 'professional' ? 'recommended' : ''}`}
          >
            {plan.id === 'professional' && (
              <div className="pricing-badge">
                <Star size={12} style={{ marginRight: '4px' }} /> En Popüler
              </div>
            )}
            
            <div className="pricing-name">{plan.name}</div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="pricing-price">
                {formatCurrency(selectedBilling === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice)}
              </span>
              <span className="pricing-period">/ ay</span>
              {selectedBilling === 'yearly' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                  {formatCurrency(plan.yearlyPrice)} / yıl
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {plan.description}
            </p>

            <div className="pricing-features">
              <div className="pricing-feature">
                <Check size={18} />
                <span>{plan.maxUsers === -1 ? 'Sınırsız' : plan.maxUsers} kullanıcı</span>
              </div>
              <div className="pricing-feature">
                <Check size={18} />
                <span>{plan.maxCompanies === -1 ? 'Sınırsız' : plan.maxCompanies} şirket</span>
              </div>
              <div className="pricing-feature">
                <Check size={18} />
                <span>{plan.modules.length} modül</span>
              </div>
              {plan.id === 'enterprise' && (
                <>
                  <div className="pricing-feature">
                    <Check size={18} />
                    <span>Öncelikli destek</span>
                  </div>
                  <div className="pricing-feature">
                    <Check size={18} />
                    <span>Özel entegrasyonlar</span>
                  </div>
                </>
              )}
            </div>

            <button 
              className={`btn ${company?.plan === plan.id ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
              onClick={() => handleUpgrade(plan.id)}
              disabled={company?.plan === plan.id}
            >
              {company?.plan === plan.id ? 'Mevcut Plan' : 'Bu Planı Seç'}
            </button>
          </div>
        ))}
      </div>

      {/* Active Modules */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Aktif Modülleriniz</h3>
        </div>
        <div className="module-grid">
          {modules.accessible?.map((module) => (
            <div key={module.id} className="module-card active">
              <div className="module-header">
                <div className="module-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="module-name">{module.name}</div>
                  <div className="module-price">
                    {module.source === 'plan' ? 'Plan dahilinde' : 'Ekstra modül'}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {module.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Module Modal */}
      {showModulesModal && (
        <div className="modal-overlay" onClick={() => setShowModulesModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Modül Ekle</h3>
              <button className="modal-close" onClick={() => setShowModulesModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Planınıza dahil olmayan modülleri ekstra olarak satın alabilirsiniz.
              </p>
              
              <div className="module-grid">
                {modules.unavailable?.map((module) => (
                  <div key={module.id} className="module-card">
                    <div className="module-header">
                      <div className="module-icon">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="module-name">{module.name}</div>
                        <div className="module-price">
                          {formatCurrency(selectedBilling === 'yearly' ? module.yearlyPrice / 12 : module.price)} / ay
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {module.description}
                    </p>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%' }}
                      onClick={() => handleAddModule(module.id)}
                    >
                      Ekle
                    </button>
                  </div>
                ))}
              </div>

              {modules.unavailable?.length === 0 && (
                <div className="empty-state">
                  <Check size={48} />
                  <h3>Tüm modüller aktif!</h3>
                  <p>Planınızda tüm modüller zaten dahil.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
