import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Bell, CreditCard } from 'lucide-react';

const Header = ({ toggleSidebar, onSubscriptionClick }) => {
  const { user, company } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{company?.name || 'ALFAI Enterprise'}</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {company?.plan === 'enterprise' ? 'Enterprise' : 
             company?.plan === 'professional' ? 'Professional' : 
             company?.plan === 'starter' ? 'Starter' : 'Özel Paket'}
          </span>
        </div>
      </div>

      <div className="header-right">
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onSubscriptionClick}
        >
          <CreditCard size={16} />
          Abonelik
        </button>
        
        <button className="menu-toggle">
          <Bell size={20} />
        </button>

        <div className="user-menu">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="user-name">{user?.name || 'Kullanıcı'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role || 'user'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
