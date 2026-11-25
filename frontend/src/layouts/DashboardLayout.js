import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import alert from '../utils/alert';
import {
  FiHome, FiMessageSquare, FiUsers, FiSend, FiSmartphone,
  FiLogOut, FiMenu, FiFileText, FiBriefcase, FiCreditCard, FiList,
  FiFolder, FiSearch, FiMail, FiSettings, FiKey, FiBarChart2,
  FiServer, FiHash, FiNavigation, FiGrid, FiUserCheck, FiCornerUpLeft,
  FiChevronDown, FiCheck, FiUser
} from 'react-icons/fi';

const SWITCHER_SERVICES = [
  { id: 'whatsapp', label: 'WhatsApp', icon: FiSmartphone, color: '#3B82F6' },
  { id: 'sms', label: 'SMS', icon: FiMessageSquare, color: '#3B82F6' },
  { id: 'bulkmail', label: 'Mail', icon: FiMail, color: '#3B82F6' },
];

const SERVICE_COLORS = {
  whatsapp: '#3B82F6',
  sms: '#3B82F6',
  bulkmail: '#3B82F6',
};

const SERVICE_LABELS = {
  whatsapp: 'WhatsApp Panel',
  sms: 'SMS Panel',
  bulkmail: 'BulkMail Panel',
};

const SERVICE_WALLET_ENDPOINTS = {
  whatsapp: '/wallet/me',
  sms: '/sms/wallet/me',
  bulkmail: '/bulkmail/wallet/me',
};

const getNavItems = (service) => {
  if (service === 'sms') {
    return [
      { to: '/sms/dashboard', icon: FiHome, label: 'Dashboard' },
      { to: '/sms/send', icon: FiSend, label: 'Send SMS' },
      { to: '/sms/campaigns', icon: FiNavigation, label: 'Campaigns' },
      { to: '/sms/templates', icon: FiFileText, label: 'Templates', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/sms/sender-ids', icon: FiHash, label: 'Sender IDs', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/sms/routes', icon: FiGrid, label: 'Routes', roles: ['super_admin', 'admin'] },
      { to: '/sms/contacts', icon: FiUsers, label: 'Contacts' },
      { to: '/sms/groups', icon: FiFolder, label: 'Groups' },
      { to: '/sms/reports', icon: FiBarChart2, label: 'Reports' },
      { to: '/sms/users', icon: FiUsers, label: 'Users', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/sms/companies', icon: FiBriefcase, label: 'Companies', roles: ['super_admin'] },
      { to: '/sms/recharge', icon: FiCreditCard, label: 'Recharge', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/sms/transactions', icon: FiList, label: 'Transactions' },
      { to: '/sms/api-keys', icon: FiKey, label: 'API Keys' },
    ];
  }
  if (service === 'bulkmail') {
    return [
      { to: '/bulkmail/dashboard', icon: FiHome, label: 'Dashboard' },
      { to: '/bulkmail/send', icon: FiSend, label: 'Send Email' },
      { to: '/bulkmail/campaigns', icon: FiNavigation, label: 'Campaigns' },
      { to: '/bulkmail/templates', icon: FiFileText, label: 'Templates', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/bulkmail/senders', icon: FiMail, label: 'Senders', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/bulkmail/smtp', icon: FiServer, label: 'SMTP Servers', roles: ['super_admin', 'admin'] },
      { to: '/bulkmail/contacts', icon: FiUsers, label: 'Contacts' },
      { to: '/bulkmail/contact-groups', icon: FiFolder, label: 'Contact Groups' },
      { to: '/bulkmail/reports', icon: FiBarChart2, label: 'Reports' },
      { to: '/bulkmail/users', icon: FiUsers, label: 'Users', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/bulkmail/companies', icon: FiBriefcase, label: 'Companies', roles: ['super_admin'] },
      { to: '/bulkmail/recharge', icon: FiCreditCard, label: 'Recharge', roles: ['super_admin', 'admin', 'reseller'] },
      { to: '/bulkmail/transactions', icon: FiList, label: 'Transactions' },
      { to: '/bulkmail/plans', icon: FiSettings, label: 'Plans', roles: ['super_admin', 'admin'] },
      { to: '/bulkmail/api-keys', icon: FiKey, label: 'API Keys' },
    ];
  }
  // whatsapp
  return [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/whatsapp', icon: FiSmartphone, label: 'WhatsApp' },
    { to: '/inbox', icon: FiMessageSquare, label: 'Inbox' },
    { to: '/contacts', icon: FiUsers, label: 'Contacts' },
    { to: '/groups', icon: FiFolder, label: 'Groups' },
    { to: '/campaigns', icon: FiSend, label: 'Campaigns' },
    { to: '/templates', icon: FiFileText, label: 'Templates', roles: ['super_admin', 'admin', 'reseller'] },
    { to: '/users', icon: FiUsers, label: 'Users', roles: ['super_admin', 'admin', 'reseller'] },
    { to: '/companies', icon: FiBriefcase, label: 'Companies', roles: ['super_admin'] },
    { to: '/recharge', icon: FiCreditCard, label: 'Recharge', roles: ['super_admin', 'admin', 'reseller'] },
    { to: '/transactions', icon: FiList, label: 'Transactions' },
    { to: '/reports', icon: FiBarChart2, label: 'Reports' },
    { to: '/api-keys', icon: FiKey, label: 'API Keys' },
  ];
};

const SERVICE_DASHBOARD = {
  whatsapp: '/dashboard',
  sms: '/sms/dashboard',
  bulkmail: '/bulkmail/dashboard',
};

const DashboardLayout = () => {
  const { user, logout, activeService, isImpersonating, stopImpersonation, switchService, cachedServices } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [walletBalance, setWalletBalance] = useState(null);
  const [searchMenu, setSearchMenu] = useState('');
  const [switching, setSwitching] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const switcherRef = useRef(null);
  const userMenuRef = useRef(null);

  const accentColor = SERVICE_COLORS[activeService] || '#e8b931';

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const endpoint = SERVICE_WALLET_ENDPOINTS[activeService];
    const fetchBalance = () => {
      api.get(endpoint).then(res => setWalletBalance(res.data.wallet?.balance)).catch(() => {});
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [activeService]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReturnToAdmin = () => {
    stopImpersonation();
    navigate(SERVICE_DASHBOARD[localStorage.getItem('activeService')] || '/dashboard');
  };

  const handleSwitchService = async (service) => {
    setSwitcherOpen(false);
    if (service === activeService || switching) return;
    if (isImpersonating) {
      alert.warning('Return to admin before switching panels');
      return;
    }
    setSwitching(true);
    try {
      const result = await switchService(service);
      if (result.ok) {
        navigate(SERVICE_DASHBOARD[service]);
      } else {
        navigate('/login', { state: { service, fromSwitcher: true } });
      }
    } finally {
      setSwitching(false);
    }
  };

  const navItems = getNavItems(activeService);

  const filteredNav = navItems.filter(item => {
    if (item.roles && !item.roles.includes(user?.role)) return false;
    if (searchMenu && !item.label.toLowerCase().includes(searchMenu.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9' }}>
      {isImpersonating && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '8px 16px', background: '#92400e', color: 'white', fontSize: 15, fontWeight: 600, flexShrink: 0,
        }}>
          <FiUserCheck size={15} />
          Viewing as {user?.name} ({user?.role?.replace('_', ' ')})
          <button
            onClick={handleReturnToAdmin}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10, padding: '4px 12px',
              background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            <FiCornerUpLeft size={13} /> Return to admin
          </button>
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        background: '#111827',
        color: 'white',
        transition: 'width 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Logo + Service indicator */}
        <div style={{
          padding: sidebarOpen ? '20px 16px 12px' : '20px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          borderBottom: '1px solid #1f2937',
          minHeight: sidebarOpen ? 80 : 68,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: -0.5 }}>
                  Leadofy
                </span>
                <div style={{ width: 60, height: 3, background: accentColor, borderRadius: 2, position: 'relative', top: 12, left: -60 }} />
              </div>
            )}
            {!sidebarOpen && (
              <span style={{ fontSize: 22, fontWeight: 800, color: accentColor }}>L</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}
            >
              <FiMenu size={18} />
            </button>
          </div>
          {sidebarOpen && (
            <div style={{
              marginTop: 8, padding: '4px 10px', borderRadius: 6,
              background: `${accentColor}20`, color: accentColor,
              fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              display: 'inline-block', alignSelf: 'flex-start',
            }}>
              {SERVICE_LABELS[activeService]}
            </div>
          )}
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div style={{ padding: '12px 12px 8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: '#1f2937', borderRadius: 8,
              border: '1px solid #374151',
            }}>
              <FiSearch size={14} color="#6b7280" />
              <input
                value={searchMenu}
                onChange={e => setSearchMenu(e.target.value)}
                placeholder="Search menu..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#d1d5db', fontSize: 15,
                }}
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 0', overflow: 'auto' }}>
          {filteredNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: sidebarOpen ? '10px 16px' : '10px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                color: isActive ? accentColor : '#ffffff',
                textDecoration: 'none',
                background: isActive ? '#1f2937' : 'transparent',
                borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                gap: 12,
                transition: 'all 0.15s ease',
                fontSize: 15,
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <item.icon size={18} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        {sidebarOpen && ['super_admin', 'admin', 'reseller'].includes(user?.role) && (
          <div style={{ borderTop: '1px solid #1f2937', padding: '12px 12px' }}>
            <button
              onClick={() => {
                const rechargeRoutes = { whatsapp: '/recharge', sms: '/sms/recharge', bulkmail: '/bulkmail/recharge' };
                navigate(rechargeRoutes[activeService]);
              }}
              style={{
                width: '100%', padding: '8px 0', background: accentColor, color: '#ffffff',
                border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <FiCreditCard size={14} /> Recharge now
            </button>
          </div>
        )}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header (AdminLTE-style navbar) */}
        <header style={{
          height: 58, background: '#ffffff', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px', flexShrink: 0, position: 'relative', zIndex: 30,
        }}>
          {/* Left: sidebar toggle + panel switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 6 }}
              title="Toggle sidebar"
            >
              <FiMenu size={18} />
            </button>
            <div style={{ width: 1, height: 22, background: '#e5e7eb' }} />
            <div ref={switcherRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setSwitcherOpen(o => !o)}
                disabled={switching}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                  background: `${accentColor}14`, border: `1px solid ${accentColor}40`,
                  borderRadius: 8, cursor: switching ? 'default' : 'pointer',
                }}
              >
                {(() => {
                  const current = SWITCHER_SERVICES.find(s => s.id === activeService);
                  const Icon = current?.icon || FiGrid;
                  return <Icon size={15} color={accentColor} />;
                })()}
                <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                  {SERVICE_LABELS[activeService]}
                </span>
                <FiChevronDown size={14} color="#6b7280" />
              </button>
              {switcherOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 220,
                  background: '#ffffff', borderRadius: 10, border: '1px solid #e5e7eb',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', padding: 6,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 10px 4px' }}>
                    Switch Panel
                  </div>
                  {SWITCHER_SERVICES.map(s => {
                    const isActive = s.id === activeService;
                    const hasSession = cachedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSwitchService(s.id)}
                        disabled={switching}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 10px', background: isActive ? `${s.color}14` : 'transparent',
                          border: 'none', borderRadius: 8, cursor: switching ? 'default' : 'pointer', textAlign: 'left',
                        }}
                      >
                        <s.icon size={16} color={s.color} />
                        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#111827' }}>{s.label}</span>
                        {isActive ? (
                          <FiCheck size={14} color={s.color} />
                        ) : (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: hasSession ? '#22c55e' : '#d1d5db',
                          }} title={hasSession ? 'Signed in' : 'Not signed in'} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: wallet + user profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {walletBalance !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: walletBalance > 0 ? '#f3f4f6' : '#fef2f2',
                border: walletBalance > 0 ? '1px solid #e5e7eb' : '1px solid #fecaca',
                borderRadius: 8,
              }}>
                <FiCreditCard size={13} color={walletBalance > 0 ? accentColor : '#dc2626'} />
                <span style={{ fontSize: 15, fontWeight: 700, color: walletBalance > 0 ? '#111827' : '#dc2626' }}>
                  {activeService === 'sms' ? `${walletBalance?.toFixed(0)} SMS` : `₹${walletBalance?.toFixed(2)}`}
                </span>
              </div>
            )}

            <div ref={userMenuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                onClick={() => navigate('/profile')}
                title="My Profile"
                style={{
                  display: 'flex', alignItems: 'center', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: accentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, color: '#ffffff', flexShrink: 0,
                }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <FiChevronDown size={14} color="#6b7280" />
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 220,
                  background: '#ffffff', borderRadius: 10, border: '1px solid #e5e7eb',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280', textTransform: 'capitalize' }}>
                      {user?.role?.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#111827', textAlign: 'left',
                    }}
                  >
                    <FiUser size={15} /> My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#dc2626', textAlign: 'left',
                      borderTop: '1px solid #f3f4f6',
                    }}
                  >
                    <FiLogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', background: '#f1f5f9' }}>
          <Outlet />
        </main>
      </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
