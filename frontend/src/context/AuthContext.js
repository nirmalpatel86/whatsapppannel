import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const SERVICE_API_PREFIX = {
  whatsapp: '/auth',
  sms: '/sms/auth',
  bulkmail: '/bulkmail/auth',
};

const ALL_SERVICES = ['whatsapp', 'sms', 'bulkmail'];
const sessionKey = (service) => `session_${service}`;

const readCachedServices = () => ALL_SERVICES.filter(s => !!localStorage.getItem(sessionKey(s)));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState(localStorage.getItem('activeService') || 'whatsapp');
  const [isImpersonating, setIsImpersonating] = useState(!!localStorage.getItem('impersonatorToken'));
  const [cachedServices, setCachedServices] = useState(readCachedServices());

  const refreshCachedServices = useCallback(() => setCachedServices(readCachedServices()), []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saves a service's token/user as its standing session, so switching back to it later needs no re-login.
  const saveSession = (service, token, sessionUser) => {
    localStorage.setItem(sessionKey(service), JSON.stringify({ token, user: sessionUser }));
    refreshCachedServices();
  };

  const activateSession = (service, token, sessionUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('activeService', service);
    setUser(sessionUser);
    setActiveService(service);
    if (service === 'whatsapp') {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  };

  const login = async (phone, password, service = 'whatsapp') => {
    const prefix = SERVICE_API_PREFIX[service];
    const res = await api.post(`${prefix}/login`, { phone, password });
    const { token, user: loggedInUser } = res.data;
    saveSession(service, token, loggedInUser);
    activateSession(service, token, loggedInUser);
    return loggedInUser;
  };

  const updateProfile = async (updates) => {
    const prefix = SERVICE_API_PREFIX[activeService];
    const res = await api.put(`${prefix}/me`, updates);
    const updatedUser = res.data.user;
    const token = localStorage.getItem('token');
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    saveSession(activeService, token, updatedUser);
    return updatedUser;
  };

  const register = async (name, phone, password, companyName, service = 'whatsapp') => {
    const prefix = SERVICE_API_PREFIX[service];
    const res = await api.post(`${prefix}/register`, { name, phone, password, companyName });
    const { token, user: registeredUser } = res.data;
    saveSession(service, token, registeredUser);
    activateSession(service, token, registeredUser);
    return registeredUser;
  };

  // Switches to a service we already have a cached session for, re-validating the token first.
  // Returns { ok: true } on success, or { ok: false, needsLogin: true } if there's no usable session —
  // the caller (UI) should then route to /login for that service.
  const switchService = async (service) => {
    if (service === activeService) return { ok: true };

    const cachedRaw = localStorage.getItem(sessionKey(service));
    if (!cachedRaw) return { ok: false, needsLogin: true };

    const prevToken = localStorage.getItem('token');
    const prevUser = localStorage.getItem('user');
    const prevService = activeService;

    try {
      const { token } = JSON.parse(cachedRaw);
      localStorage.setItem('token', token); // so the api interceptor sends this token for the /me check below
      const prefix = SERVICE_API_PREFIX[service];
      const res = await api.get(`${prefix}/me`);
      saveSession(service, token, res.data.user);
      activateSession(service, token, res.data.user);
      return { ok: true };
    } catch (err) {
      localStorage.removeItem(sessionKey(service));
      refreshCachedServices();
      localStorage.setItem('token', prevToken);
      localStorage.setItem('user', prevUser);
      localStorage.setItem('activeService', prevService);
      return { ok: false, needsLogin: true };
    }
  };

  const logout = () => {
    ALL_SERVICES.forEach(s => localStorage.removeItem(sessionKey(s)));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeService');
    localStorage.removeItem('impersonatorToken');
    localStorage.removeItem('impersonatorUser');
    localStorage.removeItem('impersonatorService');
    setUser(null);
    setActiveService('whatsapp');
    setIsImpersonating(false);
    setCachedServices([]);
    disconnectSocket();
  };

  const impersonate = (token, impersonatedUser, service) => {
    // Stash the current admin session so "return to admin" can restore it without re-login.
    localStorage.setItem('impersonatorToken', localStorage.getItem('token'));
    localStorage.setItem('impersonatorUser', localStorage.getItem('user'));
    localStorage.setItem('impersonatorService', activeService);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(impersonatedUser));
    localStorage.setItem('activeService', service);
    setUser(impersonatedUser);
    setActiveService(service);
    setIsImpersonating(true);
    if (service === 'whatsapp') {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  };

  const stopImpersonation = () => {
    const adminToken = localStorage.getItem('impersonatorToken');
    const adminUser = localStorage.getItem('impersonatorUser');
    const adminService = localStorage.getItem('impersonatorService') || 'whatsapp';
    if (!adminToken || !adminUser) return;

    localStorage.setItem('token', adminToken);
    localStorage.setItem('user', adminUser);
    localStorage.setItem('activeService', adminService);
    localStorage.removeItem('impersonatorToken');
    localStorage.removeItem('impersonatorUser');
    localStorage.removeItem('impersonatorService');

    setUser(JSON.parse(adminUser));
    setActiveService(adminService);
    setIsImpersonating(false);
    if (adminService === 'whatsapp') {
      connectSocket(adminToken);
    } else {
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, loading, activeService, setActiveService, updateProfile,
      impersonate, stopImpersonation, isImpersonating,
      switchService, cachedServices,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
