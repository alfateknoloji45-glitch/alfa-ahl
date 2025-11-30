import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Warehouse } from 'lucide-react';

const Inventory = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview'); // 'overview' or 'movements'
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, movementsRes] = await Promise.all([
        inventoryApi.getOverview(),
        inventoryApi.getMovements()
      ]);
      
      if (overviewRes.data.success) setData(overviewRes.data.data);
      if (movementsRes.data.success) setMovements(movementsRes.data.data);
    } catch (error) {
      console.error('Envanter yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Envanter yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Envanter</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Stok durumu ve hareketleri</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${view === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('overview')}
          >
            Genel Bakış
          </button>
          <button 
            className={`btn ${view === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('movements')}
          >
            Hareketler
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Ürün</div>
            <div className="stat-value">{data?.summary?.totalProducts || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Warehouse size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Stok Değeri</div>
            <div className="stat-value">{formatCurrency(data?.summary?.totalValue)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Düşük Stok</div>
            <div className="stat-value">{data?.summary?.lowStock || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tükenen</div>
            <div className="stat-value">{data?.summary?.outOfStock || 0}</div>
          </div>
        </div>
      </div>

      {view === 'overview' ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Stok Durumu</h3>
          </div>
          
          {data?.products?.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <h3>Henüz ürün yok</h3>
              <p>Ürünler modülünden ürün ekleyerek başlayın</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>SKU</th>
                    <th>Stok</th>
                    <th>Min. Stok</th>
                    <th>Değer</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.products?.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: '500' }}>{product.name}</td>
                      <td>
                        <code style={{ fontSize: '0.75rem', background: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {product.sku}
                        </code>
                      </td>
                      <td>{product.stock} {product.unit}</td>
                      <td>{product.minStock} {product.unit}</td>
                      <td>{formatCurrency(product.value)}</td>
                      <td>
                        {product.status === 'out_of_stock' ? (
                          <span className="badge badge-danger">Tükendi</span>
                        ) : product.status === 'low_stock' ? (
                          <span className="badge badge-warning">Düşük</span>
                        ) : (
                          <span className="badge badge-success">Stokta</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Stok Hareketleri</h3>
          </div>
          
          {movements.length === 0 ? (
            <div className="empty-state">
              <TrendingUp size={48} />
              <h3>Henüz hareket yok</h3>
              <p>Stok değişiklikleri burada görünecek</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Ürün</th>
                    <th>İşlem</th>
                    <th>Miktar</th>
                    <th>Yeni Stok</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td style={{ fontSize: '0.875rem' }}>{formatDate(movement.createdAt)}</td>
                      <td style={{ fontWeight: '500' }}>{movement.productName}</td>
                      <td>
                        {movement.type === 'add' ? (
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <TrendingUp size={14} /> Giriş
                          </span>
                        ) : movement.type === 'subtract' ? (
                          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <TrendingDown size={14} /> Çıkış
                          </span>
                        ) : (
                          <span>Düzeltme</span>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          color: movement.type === 'add' ? 'var(--success)' : 
                                 movement.type === 'subtract' ? 'var(--danger)' : 'var(--text)'
                        }}>
                          {movement.type === 'add' ? '+' : movement.type === 'subtract' ? '-' : ''}
                          {movement.quantity}
                        </span>
                      </td>
                      <td>{movement.newStock}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {movement.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;
