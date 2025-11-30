import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('alfai_token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.me();
      if (response.data.success) {
        setUser(response.data.data.user);
        setCompany(response.data.data.company);
        setTrialInfo(response.data.data.trialInfo);
      }
    } catch (error) {
      localStorage.removeItem('alfai_token');
      localStorage.removeItem('alfai_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    if (response.data.success) {
      localStorage.setItem('alfai_token', response.data.data.token);
      setUser(response.data.data.user);
      setCompany(response.data.data.company);
      return { success: true };
    }
    return { success: false, error: response.data.error };
  };

  const register = async (data) => {
    const response = await authApi.register(data);
    if (response.data.success) {
      localStorage.setItem('alfai_token', response.data.data.token);
      setUser(response.data.data.user);
      setCompany(response.data.data.company);
      setTrialInfo(response.data.data.trialInfo);
      return { success: true, message: response.data.message };
    }
    return { success: false, error: response.data.error };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem('alfai_token');
    localStorage.removeItem('alfai_user');
    setUser(null);
    setCompany(null);
    setTrialInfo(null);
  };

  const hasModuleAccess = (moduleId) => {
    if (!company) return false;
    return company.activeModules?.includes(moduleId) || 
           company.extraModules?.includes(moduleId);
  };

  const value = {
    user,
    company,
    trialInfo,
    loading,
    login,
    register,
    logout,
    hasModuleAccess,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
