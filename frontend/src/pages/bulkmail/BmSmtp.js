import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiServer } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const BmSmtp = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editServer, setEditServer] = useState(null);
  const [form, setForm] = useState({ host: '', port: 587, username: '', password: '', secure: 'tls', userId: '', type: 'general', maxPerHour: 100 });
  const [editForm, setEditForm] = useState({ host: '', port: 587, username: '', password: '', secure: 'tls', userId: '', type: 'general', maxPerHour: 100 });

  const fetchServers = useCallback(async () => {
    try {
      const res = await api.get('/bulkmail/smtp');
      setServers(res.data.servers || []);
    } catch { alert.error('Failed to load SMTP servers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  const createServer = async () => {
    if (!form.host.trim() || !form.username.trim()) { alert.error('Host and username are required'); return; }
    try {
      await api.post('/bulkmail/smtp', { ...form, port: parseInt(form.port), maxPerHour: parseInt(form.maxPerHour) });
      alert.success('SMTP server added');
      setShowCreate(false);
      setForm({ host: '', port: 587, username: '', password: '', secure: 'tls', userId: '', type: 'general', maxPerHour: 100 });
      fetchServers();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const openEdit = (s) => {
    setEditServer(s);
    setEditForm({ host: s.host, port: s.port, username: s.username, password: '', secure: s.secure || 'tls', userId: s.userId || '', type: s.type || 'general', maxPerHour: s.maxPerHour || 100 });
  };

  const saveEdit = async () => {
    if (!editForm.host.trim()) { alert.error('Host is required'); return; }
    try {
      const data = { host: editForm.host, port: parseInt(editForm.port), username: editForm.username, secure: editForm.secure, userId: editForm.userId, type: editForm.type, maxPerHour: parseInt(editForm.maxPerHour) };
      if (editForm.password) data.password = editForm.password;
      await api.put(`/bulkmail/smtp/${editServer.id}`, data);
      alert.success('SMTP server updated');
      setEditServer(null);
      fetchServers();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to update'); }
  };

  const deleteServer = async (id) => {
    if (!window.confirm('Delete this SMTP server?')) return;
    try { await api.delete(`/bulkmail/smtp/${id}`); alert.success('Deleted'); fetchServers(); }
    catch { alert.error('Failed to delete'); }
  };

  const testConnection = async (id) => {
    try {
      await api.post(`/bulkmail/smtp/${id}/test`);
      alert.success('Connection successful');
    } catch (err) {
      alert.error(err.response?.data?.error || 'Connection failed');
    }
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  const renderForm = (f, setF) => (
    <div style={styles.formGrid}>
      <div style={styles.field}>
        <label style={styles.label}>SMTP Host *</label>
        <input value={f.host} onChange={e => setF({ ...f, host: e.target.value })} style={styles.input} placeholder="smtp.gmail.com" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>SMTP User *</label>
        <input value={f.username} onChange={e => setF({ ...f, username: e.target.value })} style={styles.input} placeholder="user@gmail.com" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>SMTP Password/Token {editServer ? '(leave blank to keep)' : '*'}</label>
        <input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} style={styles.input} />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>SMTP Port *</label>
        <input type="number" value={f.port} onChange={e => setF({ ...f, port: e.target.value })} style={styles.input} />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>User Id</label>
        <input value={f.userId} onChange={e => setF({ ...f, userId: e.target.value })} style={styles.input} placeholder="Optional account/API user id" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>SMTP Secure</label>
        <select value={f.secure} onChange={e => setF({ ...f, secure: e.target.value })} style={styles.input}>
          <option value="tls">TLS</option>
          <option value="ssl">SSL</option>
          <option value="none">None</option>
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Max Emails/Hour</label>
        <input type="number" value={f.maxPerHour} onChange={e => setF({ ...f, maxPerHour: e.target.value })} style={styles.input} />
      </div>
      <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
        <label style={styles.label}>SMTP Type</label>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { value: 'sendgrid', label: 'Send Grid' },
            { value: 'sendclean', label: 'Send Clean' },
            { value: 'general', label: 'General SMTP' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#374151', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`smtp-type-${editServer ? editServer.id : 'new'}`}
                checked={f.type === opt.value}
                onChange={() => setF({ ...f, type: opt.value })}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>SMTP Servers</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{servers.length} servers configured</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add SMTP</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Add SMTP Server</h3>
              <button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>{renderForm(form, setForm)}</div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={createServer} style={styles.primaryBtn}>Add Server</button>
            </div>
          </div>
        </div>
      )}

      {editServer && (
        <div style={styles.modalOverlay} onClick={() => setEditServer(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Edit SMTP Server</h3>
              <button onClick={() => setEditServer(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>{renderForm(editForm, setEditForm)}</div>
            <div style={styles.modalFooter}>
              <button onClick={() => setEditServer(null)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={saveEdit} style={styles.primaryBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {servers.map(s => (
          <div key={s.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.serverIcon}><FiServer size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 17, color: '#111827' }}>{s.host}</div>
                  <div style={{ fontSize: 14, color: '#9ca3af' }}>Port {s.port} · {s.secure?.toUpperCase() || 'TLS'} · {s.username}</div>
                  {s.userId && <div style={{ fontSize: 13, color: '#9ca3af' }}>User Id: {s.userId}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => testConnection(s.id)} style={{ ...styles.actionBtn, fontSize: 13, padding: '4px 10px', color: '#10b981' }}>Test</button>
                <button onClick={() => openEdit(s)} style={styles.actionBtn}><FiEdit2 size={14} color="#2563eb" /></button>
                <button onClick={() => deleteServer(s.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 15, color: '#6b7280', alignItems: 'center' }}>
              <span>Max/hr: <strong style={{ color: '#374151' }}>{s.maxPerHour || 100}</strong></span>
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#3B82F620', color: '#3B82F6' }}>
                {{ sendgrid: 'Send Grid', sendclean: 'Send Clean', general: 'General SMTP' }[s.type] || 'General SMTP'}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: s.isActive !== false ? '#22c55e20' : '#ef444420',
                color: s.isActive !== false ? '#22c55e' : '#ef4444',
              }}>{s.isActive !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>

      {servers.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiServer size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No SMTP servers</h3>
          <p style={{ margin: 0, fontSize: 16 }}>Add an SMTP server to start sending emails.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  serverIcon: { width: 42, height: 42, borderRadius: 10, background: `${ACCENT}12`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
};

export default BmSmtp;
