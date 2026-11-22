import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const SERVICE_API_PREFIX = {
  whatsapp: '/auth',
  sms: '/sms/auth',
  bulkmail: '/bulkmail/auth',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState(localStorage.getItem('activeService') || 'whatsapp');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedService = localStorage.getItem('activeService') || 'whatsapp';
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setActiveService(savedService);
      if (savedService === 'whatsapp') {
        connectSocket(token);
      }
      const prefix = SERVICE_API_PREFIX[savedService];
      api.get(`${prefix}/me`).then(res => {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }).catch(() => {
        logout();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone, password, service = 'whatsapp') => {
    const prefix = SERVICE_API_PREFIX[service];
    const res = await api.post(`${prefix}/login`, { phone, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('activeService', service);
    setUser(user);
    setActiveService(service);
    if (service === 'whatsapp') {
      connectSocket(token);
    }
    return user;
  };

  const register = async (name, phone, password, companyName, service = 'whatsapp') => {
    const prefix = SERVICE_API_PREFIX[service];
    const res = await api.post(`${prefix}/register`, { name, phone, password, companyName });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('activeService', service);
    setUser(user);
    setActiveService(service);
    if (service === 'whatsapp') {
      connectSocket(token);
    }
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeService');
    setUser(null);
    setActiveService('whatsapp');
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, activeService, setActiveService }}>
      {children}
    </AuthContext.Provider>
  );
};
