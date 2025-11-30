import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TrialBanner from './components/TrialBanner';
import Dashboard from './modules/Dashboard';
import Customers from './modules/Customers';
import Products from './modules/Products';
import POS from './modules/POS';
import Invoices from './modules/Invoices';
import Inventory from './modules/Inventory';
import HR from './modules/HR';
import Projects from './modules/Projects';
import Subscription from './modules/Subscription';
import AIAssistant from './modules/AIAssistant';
import './App.css';

const AppContent = () => {
  const { user, loading, isAuthenticated, trialInfo } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>ALFAI Enterprise yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onBackToLogin={() => setShowRegister(false)} />;
    }
    return <Login onRegister={() => setShowRegister(true)} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'products':
        return <Products />;
      case 'pos':
        return <POS />;
      case 'invoices':
        return <Invoices />;
      case 'inventory':
        return <Inventory />;
      case 'hr':
        return <HR />;
      case 'projects':
        return <Projects />;
      case 'subscription':
        return <Subscription />;
      case 'ai':
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {trialInfo && <TrialBanner trialInfo={trialInfo} onUpgrade={() => setActiveModule('subscription')} />}
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSubscriptionClick={() => setActiveModule('subscription')}
        />
        <main className="content">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
