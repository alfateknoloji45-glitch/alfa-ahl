import React, { useState, useEffect } from 'react';
import { hrApi } from '../api';
import { Plus, Search, Edit, Trash2, Users, X, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const HR = () => {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    employmentType: 'full-time'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesRes, statsRes] = await Promise.all([
        hrApi.getEmployees(),
        hrApi.getStats()
      ]);
      
      if (employeesRes.data.success) setEmployees(employeesRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (error) {
      console.error('HR verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await hrApi.updateEmployee(editingEmployee.id, formData);
        toast.success('Çalışan güncellendi');
      } else {
        await hrApi.createEmployee(formData);
        toast.success('Çalışan eklendi');
      }
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '',
      department: '', position: '', salary: '', employmentType: 'full-time'
    });
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      salary: employee.salary?.toString() || '',
      employmentType: employee.employmentType || 'full-time'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu çalışanı pasif duruma almak istediğinize emin misiniz?')) return;
    try {
      await hrApi.deleteEmployee(id);
      toast.success('Çalışan pasif duruma alındı');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const filteredEmployees = employees.filter(e => 
    e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>İnsan Kaynakları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>İnsan Kaynakları</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{employees.length} çalışan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Yeni Çalışan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Çalışan</div>
            <div className="stat-value">{stats?.totalEmployees || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <UserCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Aktif</div>
            <div className="stat-value">{stats?.activeEmployees || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Departman</div>
            <div className="stat-value">{stats?.departments || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Bordro</div>
            <div className="stat-value">{formatCurrency(stats?.totalPayroll)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Çalışan, departman veya pozisyon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Henüz çalışan yok</h3>
            <p>İlk çalışanınızı ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Çalışan</th>
                  <th>Departman</th>
                  <th>Pozisyon</th>
                  <th>Çalışma Tipi</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600'
                        }}>
                          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{employee.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{employee.employeeNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td>{employee.department || '-'}</td>
                    <td>{employee.position || '-'}</td>
                    <td>
                      <span className="badge badge-info">
                        {employee.employmentType === 'full-time' ? 'Tam Zamanlı' :
                         employee.employmentType === 'part-time' ? 'Yarı Zamanlı' : 'Sözleşmeli'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {employee.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(employee)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(employee.id)}>
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
              <h3 className="modal-title">{editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingEmployee(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Ad *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Soyad *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefon</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Departman</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Örn: Satış, IT"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pozisyon</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Örn: Müdür, Uzman"
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Maaş</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Çalışma Tipi</label>
                    <select
                      className="form-select"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    >
                      <option value="full-time">Tam Zamanlı</option>
                      <option value="part-time">Yarı Zamanlı</option>
                      <option value="contract">Sözleşmeli</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingEmployee(null); }}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
