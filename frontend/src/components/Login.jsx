import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = ({ onRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Giriş başarılı!');
      } else {
        toast.error(result.error || 'Giriş başarısız');
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
        
        <h2 className="auth-title">Hesabınıza Giriş Yapın</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@sirket.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        
        <div className="auth-footer">
          Hesabınız yok mu?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onRegister(); }}>
            30 Gün Ücretsiz Deneyin
          </a>
        </div>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.875rem' }}>
          <strong>Demo Giriş:</strong><br />
          Email: demo@alfai.com<br />
          Şifre: demo
        </div>
      </div>
    </div>
  );
};

export default Login;
