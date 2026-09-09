import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('playsport_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('playsport_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('playsport_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth verification error", err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    let res;
    try {
      res = await authAPI.login(email, password);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        try {
          res = await authAPI.adminLogin(email, password);
        } catch (adminErr) {
          throw err;
        }
      } else {
        throw err;
      }
    }
    
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('playsport_token', access_token);
    localStorage.setItem('playsport_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const { access_token, user: newUser } = res.data;
    setToken(access_token);
    setUser(newUser);
    localStorage.setItem('playsport_token', access_token);
    localStorage.setItem('playsport_user', JSON.stringify(newUser));
    return newUser;
  };

  const registerOwner = async (ownerData) => {
    const res = await authAPI.registerOwner(ownerData);
    const { access_token, user: newOwner } = res.data;
    if (access_token) {
      setToken(access_token);
      setUser(newOwner);
      localStorage.setItem('playsport_token', access_token);
      localStorage.setItem('playsport_user', JSON.stringify(newOwner));
    }
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('playsport_token');
    localStorage.removeItem('playsport_user');
  };

  // Quick Demo account switcher for convenient live presentation
  const switchDemoRole = async (roleType) => {
    try {
      if (roleType === 'ADMIN') {
        await login('admin@playsport.com', 'Admin@123', true);
      } else if (roleType === 'OWNER') {
        await login('owner.kochi@playsport.com', 'Owner@123', false);
      } else {
        await login('arjun.nair@example.com', 'Customer@123', false);
      }
    } catch (e) {
      console.error("Demo switch error", e);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isOwner: user?.role === 'OWNER',
    isCustomer: user?.role === 'CUSTOMER',
    login,
    register,
    registerOwner,
    logout,
    switchDemoRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
