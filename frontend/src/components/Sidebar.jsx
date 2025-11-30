import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  Warehouse, 
  UserCircle,
  FolderKanban,
  CreditCard,
  Bot,
  Settings,
  LogOut,
  ChevronLeft
} from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule, isOpen, setIsOpen }) => {
  const { logout, company } = useAuth();

  const mainModules = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', name: 'Müşteriler', icon: Users },
    { id: 'products', name: 'Ürünler', icon: Package },
    { id: 'pos', name: 'POS / Kasa', icon: ShoppingCart },
    { id: 'invoices', name: 'Faturalar', icon: FileText },
    { id: 'inventory', name: 'Envanter', icon: Warehouse },
  ];

  const businessModules = [
    { id: 'hr', name: 'İnsan Kaynakları', icon: UserCircle },
    { id: 'projects', name: 'Projeler', icon: FolderKanban },
  ];

  const systemModules = [
    { id: 'subscription', name: 'Abonelik', icon: CreditCard },
    { id: 'ai', name: 'AI Asistan', icon: Bot },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">A</div>
        <span className="sidebar-title">ALFAI</span>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Ana Modüller</div>
          {mainModules.map((module) => (
            <div
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
            >
              <module.icon size={20} />
              <span className="nav-item-text">{module.name}</span>
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">İş Yönetimi</div>
          {businessModules.map((module) => (
            <div
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
            >
              <module.icon size={20} />
              <span className="nav-item-text">{module.name}</span>
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Sistem</div>
          {systemModules.map((module) => (
            <div
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
            >
              <module.icon size={20} />
              <span className="nav-item-text">{module.name}</span>
            </div>
          ))}
        </div>
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        {company?.status === 'trial' && (
          <div style={{ 
            background: '#fef3c7', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '0.75rem',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            <strong>Deneme Sürümü</strong><br />
            Tüm modüller aktif
          </div>
        )}
        <div
          className="nav-item"
          onClick={handleLogout}
          style={{ color: 'var(--danger)' }}
        >
          <LogOut size={20} />
          <span className="nav-item-text">Çıkış Yap</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
