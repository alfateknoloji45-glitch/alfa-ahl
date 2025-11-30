import React, { useState, useEffect } from 'react';
import { productsApi } from '../api';
import { Plus, Search, Edit, Trash2, Package, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    taxRate: '18',
    unit: 'adet',
    stock: '0',
    minStock: '0',
    trackInventory: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
        toast.success('Ürün güncellendi');
      } else {
        await productsApi.create(formData);
        toast.success('Ürün eklendi');
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', sku: '', barcode: '', description: '', category: '',
      price: '', cost: '', taxRate: '18', unit: 'adet', stock: '0', minStock: '0', trackInventory: true
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
      taxRate: product.taxRate?.toString() || '18',
      unit: product.unit || 'adet',
      stock: product.stock?.toString() || '0',
      minStock: product.minStock?.toString() || '0',
      trackInventory: product.trackInventory !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Ürün silindi');
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Ürünler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Ürünler</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{products.length} ürün</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Yeni Ürün
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Ürün, SKU veya barkod ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>Henüz ürün yok</h3>
            <p>İlk ürününüzü ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>SKU</th>
                  <th>Fiyat</th>
                  <th>Stok</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{product.name}</div>
                        {product.category && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{product.category}</div>}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', background: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {product.sku}
                      </code>
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {product.trackInventory && product.stock <= product.minStock && (
                          <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                        )}
                        <span>{product.stock} {product.unit}</span>
                      </div>
                    </td>
                    <td>
                      {!product.trackInventory ? (
                        <span className="badge badge-info">Stok Takipsiz</span>
                      ) : product.stock <= 0 ? (
                        <span className="badge badge-danger">Tükendi</span>
                      ) : product.stock <= product.minStock ? (
                        <span className="badge badge-warning">Düşük Stok</span>
                      ) : (
                        <span className="badge badge-success">Stokta</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(product)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingProduct(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Ürün Adı *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Örn: Yiyecek, İçecek"
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Otomatik oluşturulur"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Barkod</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">Satış Fiyatı *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maliyet</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">KDV %</label>
                    <select
                      className="form-select"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    >
                      <option value="0">%0</option>
                      <option value="1">%1</option>
                      <option value="8">%8</option>
                      <option value="18">%18</option>
                      <option value="20">%20</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">Stok Miktarı</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min. Stok</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Birim</label>
                    <select
                      className="form-select"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="adet">Adet</option>
                      <option value="kg">Kilogram</option>
                      <option value="gr">Gram</option>
                      <option value="lt">Litre</option>
                      <option value="ml">Mililitre</option>
                      <option value="m">Metre</option>
                      <option value="m2">Metrekare</option>
                      <option value="paket">Paket</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.trackInventory}
                      onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                    />
                    Stok takibi yap
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingProduct(null); }}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
