import React, { useState, useEffect } from 'react';
import { posApi, productsApi } from '../api';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, X, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('pos'); // 'pos' or 'tables'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, tablesRes, ordersRes] = await Promise.all([
        productsApi.getAll(),
        posApi.getTables(),
        posApi.getActiveOrders()
      ]);
      
      if (productsRes.data.success) setProducts(productsRes.data.data);
      if (tablesRes.data.success) setTables(tablesRes.data.data);
      if (ordersRes.data.success) setActiveOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Veri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        taxRate: product.taxRate || 18,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + (itemTotal * item.taxRate / 100);
    }, 0);
    const discountAmount = subtotal * discount / 100;
    const total = subtotal + tax - discountAmount;
    return { subtotal, tax, discountAmount, total };
  };

  const handleOpenOrder = async (tableNumber) => {
    if (cart.length === 0) {
      toast.error('Sepet boş');
      return;
    }

    try {
      const response = await posApi.createOrder({
        tableNumber,
        tableName: `Masa ${tableNumber}`,
        items: cart
      });
      
      if (response.data.success) {
        toast.success('Adisyon açıldı');
        setCart([]);
        setSelectedTable(null);
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const handleCloseOrder = async (orderId, paymentMethod) => {
    try {
      const response = await posApi.closeOrder(orderId, paymentMethod, discount);
      if (response.data.success) {
        toast.success('Adisyon kapatıldı');
        setShowPaymentModal(false);
        setDiscount(0);
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>POS yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>POS / Kasa</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Hızlı satış ve adisyon yönetimi</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${view === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('pos')}
          >
            <ShoppingCart size={18} />
            Satış
          </button>
          <button 
            className={`btn ${view === 'tables' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('tables')}
          >
            <Receipt size={18} />
            Masalar ({activeOrders.length})
          </button>
        </div>
      </div>

      {view === 'tables' ? (
        <div className="grid grid-4">
          {tables.map((table) => (
            <div
              key={table.number}
              className="card"
              style={{
                cursor: 'pointer',
                border: table.status === 'occupied' ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: table.status === 'occupied' ? '#dbeafe' : 'var(--surface)'
              }}
              onClick={() => {
                if (table.order) {
                  setSelectedTable(table);
                  setShowPaymentModal(true);
                }
              }}
            >
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {table.name}
                </div>
                <span className={`badge ${table.status === 'occupied' ? 'badge-info' : 'badge-success'}`}>
                  {table.status === 'occupied' ? 'Dolu' : 'Boş'}
                </span>
                {table.order && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <strong>{formatCurrency(table.order.grandTotal)}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pos-container">
          {/* Products Grid */}
          <div className="pos-products">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Ürünler</h3>
              </div>
              <div className="product-grid">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => addToCart(product)}
                  >
                    <div className="product-card-name">{product.name}</div>
                    <div className="product-card-price">{formatCurrency(product.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="pos-cart">
            <div className="pos-cart-header">
              <ShoppingCart size={18} style={{ marginRight: '0.5rem' }} />
              Sepet ({cart.reduce((sum, item) => sum + item.quantity, 0)} ürün)
            </div>

            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <ShoppingCart size={32} />
                  <p>Sepet boş</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="pos-cart-item">
                    <div>
                      <div style={{ fontWeight: '500' }}>{item.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(item.price)} x {item.quantity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pos-cart-footer">
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Ara Toplam:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>KDV:</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--success)' }}>
                    <span>İndirim ({discount}%):</span>
                    <span>-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}
              </div>
              
              <div className="pos-total">
                <span>Toplam:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-select"
                  value={selectedTable || ''}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Masa Seç</option>
                  {tables.filter(t => t.status === 'available').map(t => (
                    <option key={t.number} value={t.number}>Masa {t.number}</option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary"
                  onClick={() => selectedTable && handleOpenOrder(parseInt(selectedTable))}
                  disabled={cart.length === 0 || !selectedTable}
                >
                  Adisyon Aç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTable?.order && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedTable.name} - Ödeme</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                {selectedTable.order.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              
              <div className="form-group">
                <label className="form-label">İndirim (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={discount}
                  onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: '600', textAlign: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
                Toplam: {formatCurrency(selectedTable.order.grandTotal * (1 - discount / 100))}
              </div>
            </div>
            <div className="modal-footer" style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className="btn btn-success btn-lg" 
                style={{ width: '100%' }}
                onClick={() => handleCloseOrder(selectedTable.order.id, 'cash')}
              >
                <Banknote size={20} />
                Nakit Ödeme
              </button>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%' }}
                onClick={() => handleCloseOrder(selectedTable.order.id, 'card')}
              >
                <CreditCard size={20} />
                Kart ile Ödeme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
