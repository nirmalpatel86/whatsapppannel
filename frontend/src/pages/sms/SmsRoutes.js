import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiWifi } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const SmsRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', routeType: 'transactional', smscId: '', apiUrl: '', apiUsername: '', apiPassword: '', dlrUrl: '', costPerSms: '0' });

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await api.get('/sms/routes');
      setRoutes(res.data.routes);
    } catch (err) {
      alert.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const resetForm = () => setForm({ name: '', routeType: 'transactional', smscId: '', apiUrl: '', apiUsername: '', apiPassword: '', dlrUrl: '', costPerSms: '0' });

  const createRoute = async () => {
    if (!form.name || !form.routeType) { alert.error('Name and type are required'); return; }
    try {
      await api.post('/sms/routes', { ...form, costPerSms: parseFloat(form.costPerSms) || 0 });
      alert.success('Route created');
      setShowCreate(false);
      resetForm();
      fetchRoutes();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const openEdit = (r) => {
    setEditItem(r);
    setForm({ name: r.name, routeType: r.routeType, smscId: r.smscId || '', apiUrl: r.apiUrl || '', apiUsername: r.apiUsername || '', apiPassword: '', dlrUrl: r.dlrUrl || '', costPerSms: String(r.costPerSms || 0) });
    setShowCreate(false);
  };

  const saveEdit = async () => {
    try {
      const data = { ...form, costPerSms: parseFloat(form.costPerSms) || 0 };
      if (!data.apiPassword) delete data.apiPassword;
      await api.put(`/sms/routes/${editItem.id}`, data);
      alert.success('Route updated');
      setEditItem(null);
      resetForm();
      fetchRoutes();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to update'); }
  };

  const deleteRoute = async (id) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await api.delete(`/sms/routes/${id}`);
      alert.success('Route deleted');
      fetchRoutes();
    } catch (err) { alert.error('Failed to delete'); }
  };

  const typeColors = { transactional: '#3B82F6', promotional: '#f59e0b', otp: '#22c55e', premium: '#8b5cf6' };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  const formPanel = (isEdit) => (
    <div style={styles.createPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{isEdit ? 'Edit Route' : 'Add Route'}</h3>
        <button onClick={() => { isEdit ? setEditItem(null) : setShowCreate(false); resetForm(); }} style={styles.iconBtn}><FiX size={16} /></button>
      </div>
      <div style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label}>Route Name *</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. Airtel Trans" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Route Type *</label>
          <select value={form.routeType} onChange={e => setForm({ ...form, routeType: e.target.value })} style={styles.input}>
            <option value="transactional">Transactional</option>
            <option value="promotional">Promotional</option>
            <option value="otp">OTP</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>SMSC ID</label>
          <input value={form.smscId} onChange={e => setForm({ ...form, smscId: e.target.value })} style={styles.input} placeholder="SMSC identifier" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Cost Per SMS</label>
          <input type="number" step="0.001" value={form.costPerSms} onChange={e => setForm({ ...form, costPerSms: e.target.value })} style={styles.input} />
        </div>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>API URL</label>
        <input value={form.apiUrl} onChange={e => setForm({ ...form, apiUrl: e.target.value })} style={styles.input} placeholder="https://api.gateway.com/send" />
      </div>
      <div style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label}>API Username</label>
          <input value={form.apiUsername} onChange={e => setForm({ ...form, apiUsername: e.target.value })} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>API Password</label>
          <input type="password" value={form.apiPassword} onChange={e => setForm({ ...form, apiPassword: e.target.value })} style={styles.input} placeholder={isEdit ? '(unchanged)' : ''} />
        </div>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>DLR URL</label>
        <input value={form.dlrUrl} onChange={e => setForm({ ...form, dlrUrl: e.target.value })} style={styles.input} placeholder="Delivery report callback URL" />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={isEdit ? saveEdit : createRoute} style={styles.primaryBtn}>{isEdit ? 'Save Changes' : 'Create Route'}</button>
        <button onClick={() => { isEdit ? setEditItem(null) : setShowCreate(false); resetForm(); }} style={styles.secondaryBtn}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Routes</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{routes.length} routes configured</p>
        </div>
        <button onClick={() => { setShowCreate(true); setEditItem(null); resetForm(); }} style={styles.primaryBtn}>
          <FiPlus size={18} /> Add Route
        </button>
      </div>

      {showCreate && !editItem && formPanel(false)}
      {editItem && formPanel(true)}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {routes.map(r => (
          <div key={r.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#111827' }}>{r.name}</h3>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: (typeColors[r.routeType] || '#6b7280') + '15',
                  color: typeColors[r.routeType] || '#6b7280', textTransform: 'uppercase',
                }}>{r.routeType}</span>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: r.isActive ? '#dcfce7' : '#fef2f2',
                color: r.isActive ? '#16a34a' : '#dc2626',
              }}>{r.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
              {r.smscId && <div>SMSC: <strong>{r.smscId}</strong></div>}
              <div>Cost: <strong style={{ color: ACCENT }}>₹{(r.costPerSms || 0).toFixed(3)}/SMS</strong></div>
              {r.apiUrl && <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af', wordBreak: 'break-all' }}>{r.apiUrl}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => openEdit(r)} style={{ ...styles.actionBtn, color: ACCENT }}><FiEdit2 size={14} /> Edit</button>
              <button onClick={() => deleteRoute(r.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}><FiTrash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {routes.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiWifi size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No routes configured</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Add an SMS gateway route to start sending messages.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: `0 2px 8px ${ACCENT}40` },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
};

export default SmsRoutes;
