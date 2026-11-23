import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import alert from '../utils/alert';
import { FiPlus, FiTrash2, FiKey, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import ApiDocCard from '../components/ApiDocCard';

const ACCENT = '#e8b931';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const WhatsappApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', whatsappAccountId: '' });
  const [visibleKeys, setVisibleKeys] = useState(new Set());

  const fetchKeys = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/api-keys');
      setKeys(res.data.apiKeys || []);
    } catch { alert.error('Failed to load API keys'); }
    finally { setLoading(false); }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/accounts');
      setAccounts(res.data.accounts || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchKeys(); fetchAccounts(); }, [fetchKeys, fetchAccounts]);

  const createKey = async () => {
    if (!form.name.trim()) { alert.error('Name is required'); return; }
    try {
      await api.post('/whatsapp/api-keys', {
        name: form.name,
        whatsappAccountId: form.whatsappAccountId || null,
      });
      alert.success('API key created');
      setShowCreate(false);
      setForm({ name: '', whatsappAccountId: '' });
      fetchKeys();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const deleteKey = async (id) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    try { await api.delete(`/whatsapp/api-keys/${id}`); alert.success('Key deleted'); fetchKeys(); }
    catch { alert.error('Failed to delete'); }
  };

  const toggleActive = async (id, isActive) => {
    try { await api.put(`/whatsapp/api-keys/${id}`, { isActive: !isActive }); alert.success(isActive ? 'Key deactivated' : 'Key activated'); fetchKeys(); }
    catch { alert.error('Failed to update'); }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    alert.success('API key copied to clipboard');
  };

  const toggleVisible = (id) => {
    setVisibleKeys(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>WhatsApp API Keys</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{keys.length} keys</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Generate Key</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827' }}>Generate New API Key</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={styles.label}>Key Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. Production API Key" />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={styles.label}>WhatsApp Account</label>
              <select value={form.whatsappAccountId} onChange={e => setForm({ ...form, whatsappAccountId: e.target.value })} style={styles.input}>
                <option value="">Select account to send from</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} {a.phone ? `(${a.phone})` : ''}</option>
                ))}
              </select>
            </div>
            <button onClick={createKey} style={styles.primaryBtn}>Generate</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keys.map(k => (
          <div key={k.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={styles.keyIcon}><FiKey size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{k.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
                      {visibleKeys.has(k.id) ? k.apiKey : `${k.apiKey?.substring(0, 8)}${'•'.repeat(24)}`}
                    </code>
                    <button onClick={() => toggleVisible(k.id)} style={styles.miniBtn}>
                      {visibleKeys.has(k.id) ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                    </button>
                    <button onClick={() => copyKey(k.apiKey)} style={styles.miniBtn}><FiCopy size={13} /></button>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    {k.WhatsappAccount ? `Linked to: ${k.WhatsappAccount.name}${k.WhatsappAccount.phone ? ` (${k.WhatsappAccount.phone})` : ''}` : 'No account linked'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: k.isActive !== false ? '#22c55e20' : '#ef444420', color: k.isActive !== false ? '#22c55e' : '#ef4444' }}>
                  {k.isActive !== false ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggleActive(k.id, k.isActive !== false)} style={{ ...styles.actionBtn, fontSize: 11, padding: '4px 10px' }}>
                  {k.isActive !== false ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteKey(k.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
              <span>Created: {k.createdAt ? new Date(k.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
              {k.lastUsedAt && <span>Last used: {new Date(k.lastUsedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>
        ))}
      </div>

      {keys.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiKey size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No API keys</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Generate an API key to send WhatsApp messages from your own apps.</p>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <ApiDocCard
          title="Send Message API"
          endpoint={`${API_BASE}/whatsapp/send-message`}
          headers={[{ key: 'Content-Type', value: 'application/json' }]}
          parameters={[
            { field: 'api_key', type: 'string', description: 'Your WhatsApp API Key' },
            { field: 'to', type: 'string', description: 'Mobile number with country code' },
            { field: 'message', type: 'string', description: 'Text message' },
            { field: 'media_url', type: 'string (optional)', description: 'Public URL of an image/video/audio/document to send' },
          ]}
          curlCode={`curl --location '${API_BASE}/whatsapp/send-message' \\\n--header 'Content-Type: application/json' \\\n--data '{\n    "api_key": "Your API Key",\n    "to": "917862XXXXXX",\n    "message": "Text Message"\n}'`}
          accent={ACCENT}
        />
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
          Check wallet balance: <code>GET {API_BASE}/whatsapp/get-balance?api_key=Your API Key</code>
        </p>
      </div>
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#111827', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(232,185,49,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  keyIcon: { width: 42, height: 42, borderRadius: 10, background: `${ACCENT}30`, color: '#92650a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  miniBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, display: 'flex', alignItems: 'center' },
};

export default WhatsappApiKeys;
