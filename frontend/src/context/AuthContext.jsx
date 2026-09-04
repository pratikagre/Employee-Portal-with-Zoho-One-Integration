import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authService.getCurrentUser();
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await authService.getCurrentUser();
      setUser(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles = []) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('Admin')) return true; // Superuser override
    return roles.some(r => user.roles.includes(r));
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    if (user.roles?.includes('Admin') || user.permissions.includes('admin:all')) return true;
    return user.permissions.includes(permission);
  };

  const isAuthorizedForService = (serviceId) => {
    if (!user) return false;
    if (user.roles?.includes('Admin')) return true;
    const services = user.authorizedServices || [];
    return services.some(s => s.id === serviceId.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        logout,
        refreshProfile,
        hasRole,
        hasAnyRole,
        hasPermission,
        isAuthorizedForService,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
