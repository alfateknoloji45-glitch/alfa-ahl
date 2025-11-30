import React, { useState, useEffect } from 'react';
import { projectsApi } from '../api';
import { Plus, Search, Edit, Trash2, FolderKanban, X, CheckCircle, Clock, Pause } from 'lucide-react';
import toast from 'react-hot-toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerName: '',
    budget: '',
    priority: 'medium',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        projectsApi.getAll(),
        projectsApi.getStats()
      ]);
      
      if (projectsRes.data.success) setProjects(projectsRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectsApi.update(editingProject.id, formData);
        toast.success('Proje güncellendi');
      } else {
        await projectsApi.create(formData);
        toast.success('Proje oluşturuldu');
      }
      setShowModal(false);
      setEditingProject(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', customerName: '', budget: '', priority: 'medium', endDate: ''
    });
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      customerName: project.customerName || '',
      budget: project.budget?.toString() || '',
      priority: project.priority || 'medium',
      endDate: project.endDate ? project.endDate.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    try {
      await projectsApi.delete(id);
      toast.success('Proje silindi');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await projectsApi.update(id, { status });
      toast.success('Proje durumu güncellendi');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      planning: { class: 'badge-info', text: 'Planlama', icon: Clock },
      in_progress: { class: 'badge-warning', text: 'Devam Ediyor', icon: Clock },
      on_hold: { class: 'badge-danger', text: 'Beklemede', icon: Pause },
      completed: { class: 'badge-success', text: 'Tamamlandı', icon: CheckCircle },
      cancelled: { class: 'badge-danger', text: 'İptal', icon: X }
    };
    return badges[status] || badges.planning;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { class: 'badge-info', text: 'Düşük' },
      medium: { class: 'badge-warning', text: 'Orta' },
      high: { class: 'badge-danger', text: 'Yüksek' },
      urgent: { class: 'badge-danger', text: 'Acil' }
    };
    return badges[priority] || badges.medium;
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Projeler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Projeler</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{projects.length} proje</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Yeni Proje
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <FolderKanban size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Proje</div>
            <div className="stat-value">{stats?.total || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Devam Eden</div>
            <div className="stat-value">{stats?.byStatus?.inProgress || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tamamlanan</div>
            <div className="stat-value">{stats?.byStatus?.completed || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FolderKanban size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Ort. İlerleme</div>
            <div className="stat-value">{stats?.averageProgress || 0}%</div>
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
              placeholder="Proje veya müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={48} />
            <h3>Henüz proje yok</h3>
            <p>İlk projenizi oluşturarak başlayın</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Proje</th>
                  <th>Müşteri</th>
                  <th>Öncelik</th>
                  <th>İlerleme</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const statusBadge = getStatusBadge(project.status);
                  const priorityBadge = getPriorityBadge(project.priority);
                  return (
                    <tr key={project.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '500' }}>{project.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{project.projectNumber}</div>
                        </div>
                      </td>
                      <td>{project.customerName || '-'}</td>
                      <td>
                        <span className={`badge ${priorityBadge.class}`}>{priorityBadge.text}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '100px', 
                            height: '8px', 
                            background: 'var(--border)', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${project.progress}%`, 
                              height: '100%', 
                              background: project.progress >= 100 ? 'var(--success)' : 'var(--primary)',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.875rem' }}>{project.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(project)}>
                            <Edit size={14} />
                          </button>
                          {project.status !== 'completed' && (
                            <button 
                              className="btn btn-success btn-sm" 
                              onClick={() => handleStatusChange(project.id, 'completed')}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project.id)}>
                            <Trash2 size={14} />
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProject ? 'Proje Düzenle' : 'Yeni Proje'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingProject(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Proje Adı *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Müşteri</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bütçe</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Öncelik</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingProject(null); }}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
