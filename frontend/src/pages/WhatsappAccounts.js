import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import alert from '../utils/alert';
import { FiPlus, FiWifi, FiWifiOff, FiTrash2, FiRefreshCw, FiX } from 'react-icons/fi';

const WhatsappAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [qrCodes, setQrCodes] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/accounts');
      setAccounts(res.data.accounts);
    } catch (err) {
      alert.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    const socket = getSocket();
    if (socket) {
      socket.on('qr', ({ accountId, qr }) => {
        setQrCodes(prev => ({ ...prev, [accountId]: qr }));
      });
      socket.on('connection_update', ({ accountId, status, phone }) => {
        setAccounts(prev => prev.map(a =>
          a.id === accountId ? { ...a, status, phone: phone || a.phone } : a
        ));
        if (status === 'connected') {
          setQrCodes(prev => { const n = { ...prev }; delete n[accountId]; return n; });
          alert.success('WhatsApp connected!');
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('qr');
        socket.off('connection_update');
      }
    };
  }, [fetchAccounts]);

  const createAccount = async () => {
    try {
      await api.post('/whatsapp/accounts', { name });
      alert.success('Account created');
      setShowCreate(false);
      setName('');
      fetchAccounts();
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const connectAccount = async (id) => {
    try {
      await api.post(`/whatsapp/accounts/${id}/connect`);
      alert.success('Connecting... scan QR code');
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'connecting' } : a));
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to connect');
    }
  };

  const disconnectAccount = async (id) => {
    try {
      await api.post(`/whatsapp/accounts/${id}/disconnect`);
      alert.success('Disconnected');
      fetchAccounts();
    } catch (err) {
      alert.error('Failed to disconnect');
    }
  };

  const deleteAccount = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      await api.delete(`/whatsapp/accounts/${id}`);
      alert.success('Account deleted');
      fetchAccounts();
    } catch (err) {
      alert.error('Failed to delete');
    }
  };

  const statusConfig = {
    connected: { color: '#10b981', bg: '#ecfdf5', label: 'Connected' },
    connecting: { color: '#f59e0b', bg: '#fffbeb', label: 'Connecting' },
    qr_pending: { color: '#f59e0b', bg: '#fffbeb', label: 'QR Pending' },
    disconnected: { color: '#ef4444', bg: '#fef2f2', label: 'Disconnected' },
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>WhatsApp Accounts</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{accounts.length} accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>
          <FiPlus size={18} /> Add Account
        </button>
      </div>

      {showCreate && (
        <div style={styles.createForm}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 17, color: '#111827' }}>New Account</span>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Account name (e.g. Sales)"
              style={styles.input}
            />
            <button onClick={createAccount} style={styles.primaryBtn}>Create</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {accounts.map(account => {
          const sc = statusConfig[account.status] || statusConfig.disconnected;
          return (
            <div key={account.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600, color: '#111827' }}>{account.name}</h3>
                  <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>
                    {account.phone || 'Not connected'}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                  background: sc.bg, color: sc.color,
                }}>
                  {sc.label}
                </span>
              </div>

              {qrCodes[account.id] && (
                <div style={{ textAlign: 'center', margin: '16px 0', padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600, color: '#111827' }}>Scan QR Code</p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodes[account.id])}`}
                    alt="QR Code"
                    style={{ width: 200, height: 200 }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {account.status === 'disconnected' && (
                  <button onClick={() => connectAccount(account.id)} style={{ ...styles.actionBtn, color: '#10b981' }}>
                    <FiWifi size={14} /> Connect
                  </button>
                )}
                {account.status === 'connected' && (
                  <button onClick={() => disconnectAccount(account.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}>
                    <FiWifiOff size={14} /> Disconnect
                  </button>
                )}
                {(account.status === 'connecting' || account.status === 'qr_pending') && (
                  <button onClick={() => connectAccount(account.id)} style={{ ...styles.actionBtn, color: '#f59e0b' }}>
                    <FiRefreshCw size={14} /> Retry
                  </button>
                )}
                <button onClick={() => deleteAccount(account.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}>
                  <FiTrash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <FiSmartphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px', color: '#6b7280' }}>No accounts yet</h3>
          <p style={{ margin: 0, fontSize: 16 }}>Add a WhatsApp account to get started.</p>
        </div>
      )}
    </div>
  );
};

const FiSmartphone = ({ size, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: '#e8b931', color: '#111827', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 16,
    boxShadow: '0 2px 8px rgba(232,185,49,0.25)',
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 },
  createForm: {
    padding: 20, background: 'white', borderRadius: 14, marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  input: {
    flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 16, outline: 'none', background: '#f9fafb',
  },
  card: {
    background: 'white', borderRadius: 14, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px',
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
    cursor: 'pointer', fontSize: 15, fontWeight: 500,
  },
};

export default WhatsappAccounts;
