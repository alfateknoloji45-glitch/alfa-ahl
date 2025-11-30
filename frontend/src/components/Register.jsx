import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = ({ onBackToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    subdomain: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        toast.success(result.message || '30 günlük ücretsiz deneme başladı!');
      } else {
        toast.error(result.error || 'Kayıt başarısız');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">A</div>
          <div className="auth-logo-text">ALFAI Enterprise</div>
        </div>
        
        <h2 className="auth-title">30 Gün Ücretsiz Deneyin</h2>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          textAlign: 'center' 
        }}>
          <strong>✨ Tüm modüllere tam erişim</strong><br />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Kredi kartı gerekmez • Anında başlayın
          </span>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Adınız Soyadınız</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="ahmet@sirket.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="En az 6 karakter"
              minLength={6}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Şirket Adı</label>
            <input
              type="text"
              name="companyName"
              className="form-input"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Şirket A.Ş."
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Kayıt yapılıyor...' : 'Ücretsiz Denemeye Başla'}
          </button>
        </form>
        
        <div className="auth-footer">
          Zaten hesabınız var mı?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin(); }}>
            Giriş Yapın
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;
