import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleAuth, signInWithEmail, getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('staypulse_token');
      const savedUser = localStorage.getItem('staypulse_user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const profile = await getProfile();
          setUser(profile);
          localStorage.setItem('staypulse_user', JSON.stringify(profile));
        } catch (e) {
          console.warn('Session expired or invalid:', e);
          localStorage.removeItem('staypulse_token');
          localStorage.removeItem('staypulse_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithGoogle = async (credential) => {
    try {
      const data = await googleAuth(credential);
      localStorage.setItem('staypulse_token', data.access_token);
      localStorage.setItem('staypulse_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email, name = null) => {
    try {
      const data = await signInWithEmail(email, name);
      localStorage.setItem('staypulse_token', data.access_token);
      localStorage.setItem('staypulse_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Email signin error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('staypulse_token');
    localStorage.removeItem('staypulse_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        loginWithGoogle,
        loginWithEmail,
        logout,
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
