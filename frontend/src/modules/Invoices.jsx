import React, { useState, useEffect } from 'react';
import { invoicesApi } from '../api';
import { Plus, Search, FileText, X, DollarSign, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    items: [{ name: '', quantity: 1, price: 0, taxRate: 18 }],
    notes: '',
    discount: 0
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoicesApi.getAll();
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (error) {
      console.error('Faturalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, price: 0, taxRate: 18 }]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await invoicesApi.create(formData);
      toast.success('Fatura oluşturuldu');
      setShowModal(false);
      setFormData({
        customerName: '',
        items: [{ name: '', quantity: 1, price: 0, taxRate: 18 }],
        notes: '',
        discount: 0
      });
      loadInvoices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoicesApi.updateStatus(id, status);
      toast.success('Fatura durumu güncellendi');
      loadInvoices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-info', text: 'Taslak' },
      sent: { class: 'badge-warning', text: 'Gönderildi' },
      paid: { class: 'badge-success', text: 'Ödendi' },
      cancelled: { class: 'badge-danger', text: 'İptal' }
    };
    return badges[status] || badges.draft;
  };

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Faturalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Faturalar</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{invoices.length} fatura</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Yeni Fatura
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Fatura no veya müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>Henüz fatura yok</h3>
            <p>İlk faturanızı oluşturarak başlayın</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const badge = getStatusBadge(invoice.status);
                  return (
                    <tr key={invoice.id}>
                      <td>
                        <code style={{ fontSize: '0.75rem', background: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {invoice.invoiceNumber}
                        </code>
                      </td>
                      <td>{invoice.customerName || 'Bilinmiyor'}</td>
                      <td style={{ fontWeight: '500' }}>{formatCurrency(invoice.grandTotal)}</td>
                      <td>{formatDate(invoice.createdAt)}</td>
                      <td>
                        <span className={`badge ${badge.class}`}>{badge.text}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setViewInvoice(invoice)}>
                            <Eye size={14} />
                          </button>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <button 
                              className="btn btn-success btn-sm" 
                              onClick={() => handleStatusChange(invoice.id, 'paid')}
                            >
                              <DollarSign size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Yeni Fatura</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Müşteri Adı *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Kalemler</label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-4" style={{ gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ürün/Hizmet"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Adet"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          placeholder="Fiyat"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                          required
                        />
                      </div>
                      <button 
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                    <Plus size={14} /> Kalem Ekle
                  </button>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">İndirim (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notlar</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Fatura Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Fatura: {viewInvoice.invoiceNumber}</h3>
              <button className="modal-close" onClick={() => setViewInvoice(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <strong>Müşteri:</strong> {viewInvoice.customerName || 'Bilinmiyor'}
              </div>
              
              <table className="table" style={{ marginBottom: '1rem' }}>
                <thead>
                  <tr>
                    <th>Ürün/Hizmet</th>
                    <th>Adet</th>
                    <th>Fiyat</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                <div>Ara Toplam: {formatCurrency(viewInvoice.subtotal)}</div>
                <div>KDV: {formatCurrency(viewInvoice.taxTotal)}</div>
                {viewInvoice.discountAmount > 0 && (
                  <div style={{ color: 'var(--success)' }}>İndirim: -{formatCurrency(viewInvoice.discountAmount)}</div>
                )}
                <div style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '0.5rem' }}>
                  Toplam: {formatCurrency(viewInvoice.grandTotal)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
