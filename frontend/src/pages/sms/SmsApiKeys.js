import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiTrash2, FiKey, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import ApiDocCard from '../../components/ApiDocCard';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const SmsApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [visibleKeys, setVisibleKeys] = useState(new Set());

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms/api-keys');
      setKeys(res.data.apiKeys || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!form.name.trim()) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Key name is required' }); return; }
    try {
      const res = await api.post('/sms/api-keys', form);
      Swal.fire({ icon: 'success', title: 'API Key Created', html: `<p style="font-size:13px">Your API key:</p><code style="font-size:12px;word-break:break-all">${res.data.apiKey?.key || 'Created'}</code><p style="font-size:12px;color:#ef4444;margin-top:12px">Save this key now! It won't be shown again.</p>` });
      setShowCreate(false); setForm({ name: '' }); fetchKeys();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' }); }
  };

  const deleteKey = async (id, name) => {
    const r = await Swal.fire({ title: 'Delete API Key?', text: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!r.isConfirmed) return;
    try { await api.delete(`/sms/api-keys/${id}`); fetchKeys(); } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }); }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    Swal.fire({ icon: 'success', title: 'Copied!', timer: 800, showConfirmButton: false });
  };

  const toggleVisible = (id) => setVisibleKeys(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS API Keys</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{keys.length} API keys</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Create Key</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827' }}>Create API Key</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Key Name *</label>
              <input value={form.name} onChange={e => setForm({ name: e.target.value })} style={styles.input} placeholder="e.g. Production API" />
            </div>
            <button onClick={createKey} style={styles.primaryBtn}>Create</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr><th style={styles.th}>Name</th><th style={styles.th}>API Key</th><th style={styles.th}>Active</th><th style={styles.th}>Created</th><th style={styles.th}>Last Used</th><th style={styles.th}>Actions</th></tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={styles.td}><span style={{ fontWeight: 500, color: '#111827' }}>{k.name}</span></td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ fontSize: 12, color: '#6b7280', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {visibleKeys.has(k.id) ? k.key : `${k.key?.substring(0, 8)}${'*'.repeat(24)}`}
                    </code>
                    <button onClick={() => toggleVisible(k.id)} style={styles.iconBtn}>
                      {visibleKeys.has(k.id) ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                    <button onClick={() => copyKey(k.key)} style={styles.iconBtn}><FiCopy size={14} /></button>
                  </div>
                </td>
                <td style={styles.td}><span style={{ color: k.isActive ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 12 }}>{k.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>{new Date(k.createdAt).toLocaleDateString('en-IN')}</td>
                <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('en-IN') : 'Never'}</td>
                <td style={styles.td}>
                  <button onClick={() => deleteKey(k.id, k.name)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {keys.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiKey size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No API keys yet</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <ApiDocCard
          title="Send SMS API"
          endpoint={`${API_BASE}/sms/send-message`}
          headers={[{ key: 'Content-Type', value: 'application/json' }]}
          parameters={[
            { field: 'api_key', type: 'string', description: 'Your SMS API Key' },
            { field: 'to', type: 'string', description: 'Mobile number with country code' },
            { field: 'message', type: 'string', description: 'Text message' },
          ]}
          curlCode={`curl --location '${API_BASE}/sms/send-message' \\\n--header 'Content-Type: application/json' \\\n--data '{\n    "api_key": "Your API Key",\n    "to": "917862XXXXXX",\n    "message": "Text Message"\n}'`}
          accent="#3B82F6"
        />
      </div>
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151' },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
};

export default SmsApiKeys;
