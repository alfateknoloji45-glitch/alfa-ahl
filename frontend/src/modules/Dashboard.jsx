import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api';
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle,
  Clock,
  FolderKanban
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await reportsApi.getDashboard();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Dashboard yükleniyor...</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>İşletmenizin genel durumu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Müşteri</div>
            <div className="stat-value">{data?.summary?.customers || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ürün</div>
            <div className="stat-value">{data?.summary?.products || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Gelir</div>
            <div className="stat-value">{formatCurrency(data?.finance?.totalRevenue)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bugünkü Satış</div>
            <div className="stat-value">{formatCurrency(data?.pos?.todayRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bekleyen Fatura</div>
            <div className="stat-value">{data?.finance?.pendingInvoices || 0}</div>
            <div className="stat-change">{formatCurrency(data?.finance?.outstandingAmount)} alacak</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Düşük Stok</div>
            <div className="stat-value">{data?.inventory?.lowStock || 0}</div>
            <div className="stat-change negative">Dikkat gerektirir</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FolderKanban size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Aktif Proje</div>
            <div className="stat-value">{data?.summary?.activeProjects || 0}</div>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Günlük Özet</h3>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Bugünkü Sipariş</span>
              <strong>{data?.pos?.todayOrders || 0} adet</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Bugünkü Ciro</span>
              <strong>{formatCurrency(data?.pos?.todayRevenue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Açık Adisyon</span>
              <strong>{data?.pos?.openOrders || 0} adet</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
              <span>Aktif Çalışan</span>
              <strong>{data?.summary?.employees || 0} kişi</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💼 Abonelik Durumu</h3>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Plan</span>
              <strong style={{ textTransform: 'capitalize' }}>{data?.subscription?.plan || 'Bilinmiyor'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Durum</span>
              <span className={`badge ${data?.subscription?.status === 'trial' ? 'badge-warning' : 'badge-success'}`}>
                {data?.subscription?.status === 'trial' ? 'Deneme' : 'Aktif'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Aktif Modül</span>
              <strong>{data?.subscription?.activeModules || 0} modül</strong>
            </div>
            {data?.trialInfo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', background: '#fef3c7', margin: '0.75rem -1.5rem -1.5rem', padding: '1rem 1.5rem', borderRadius: '0 0 12px 12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} />
                  Kalan Süre
                </span>
                <strong>{data?.trialInfo?.daysRemaining} gün</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
