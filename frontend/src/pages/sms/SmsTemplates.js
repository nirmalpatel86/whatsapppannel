import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';

const SmsTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [senderIds, setSenderIds] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ name: '', body: '', senderIdId: '', routeId: '', dltContentId: '', entityId: '', templateType: 'transactional', isUnicode: false });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms/templates');
      setTemplates(res.data.templates || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load templates', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const loadFormData = async () => {
    try {
      const [sidRes, routeRes] = await Promise.all([api.get('/sms/sender-ids'), api.get('/sms/routes')]);
      setSenderIds(sidRes.data.senderIds || []);
      setRoutes(routeRes.data.routes || []);
    } catch (err) {}
  };

  const openCreate = () => {
    loadFormData();
    setForm({ name: '', body: '', senderIdId: '', routeId: '', dltContentId: '', entityId: '', templateType: 'transactional', isUnicode: false });
    setEditItem(null);
    setShowCreate(true);
  };

  const openEdit = (t) => {
    loadFormData();
    setForm({ name: t.name, body: t.body, senderIdId: t.senderIdId || '', routeId: t.routeId || '', dltContentId: t.dltContentId || '', entityId: t.entityId || '', templateType: t.templateType, isUnicode: t.isUnicode });
    setEditItem(t);
    setShowCreate(true);
  };

  const saveTemplate = async () => {
    if (!form.name || !form.body) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Name and body are required' });
      return;
    }
    try {
      const payload = { ...form, senderIdId: form.senderIdId || null, routeId: form.routeId || null };
      if (editItem) {
        await api.put(`/sms/templates/${editItem.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
      } else {
        await api.post('/sms/templates', payload);
        Swal.fire({ icon: 'success', title: 'Created!', timer: 1200, showConfirmButton: false });
      }
      setShowCreate(false);
      fetchTemplates();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to save' });
    }
  };

  const deleteTemplate = async (id, name) => {
    const result = await Swal.fire({ title: 'Delete Template?', text: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/sms/templates/${id}`);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
      fetchTemplates();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' });
    }
  };

  const statusColors = { pending: { bg: '#fef3c7', color: '#92400e' }, approved: { bg: '#d1fae5', color: '#065f46' }, rejected: { bg: '#fee2e2', color: '#991b1b' } };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Templates</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{templates.length} templates</p>
        </div>
        <button onClick={openCreate} style={styles.primaryBtn}><FiPlus size={18} /> New Template</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{editItem ? 'Edit Template' : 'Create Template'}</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={styles.input} placeholder="Template name" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select value={form.templateType} onChange={e => setForm(f => ({ ...f, templateType: e.target.value }))} style={styles.input}>
                <option value="transactional">Transactional</option>
                <option value="promotional">Promotional</option>
                <option value="otp">OTP</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Sender ID</label>
              <select value={form.senderIdId} onChange={e => setForm(f => ({ ...f, senderIdId: e.target.value }))} style={styles.input}>
                <option value="">Select...</option>
                {senderIds.map(s => <option key={s.id} value={s.id}>{s.senderId}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Route</label>
              <select value={form.routeId} onChange={e => setForm(f => ({ ...f, routeId: e.target.value }))} style={styles.input}>
                <option value="">Auto</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.routeType})</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>DLT Content ID</label>
              <input value={form.dltContentId} onChange={e => setForm(f => ({ ...f, dltContentId: e.target.value }))} style={styles.input} placeholder="DLT template ID" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Entity ID</label>
              <input value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} style={styles.input} placeholder="Entity ID" />
            </div>
          </div>
          <div style={{ ...styles.field, marginBottom: 14 }}>
            <label style={styles.label}>Message Body *</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} style={{ ...styles.input, minHeight: 100, resize: 'vertical' }} placeholder="Type your template message..." />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{form.body.length} chars</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isUnicode} onChange={e => setForm(f => ({ ...f, isUnicode: e.target.checked }))} /> Unicode
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={saveTemplate} style={styles.primaryBtn}>{editItem ? 'Update Template' : 'Create Template'}</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {templates.map(t => {
          const sc = statusColors[t.status] || statusColors.pending;
          return (
            <div key={t.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#111827' }}>{t.name}</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{t.status}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#f3f4f6', color: '#6b7280' }}>{t.templateType}</span>
                    {t.isUnicode && <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#ede9fe', color: '#7c3aed' }}>Unicode</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(t)} style={styles.actionBtn}><FiEdit2 size={14} color="#3B82F6" /></button>
                  <button onClick={() => deleteTemplate(t.id, t.name)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
                </div>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', maxHeight: 80, overflow: 'hidden', lineHeight: 1.5 }}>{t.body}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: '#9ca3af' }}>
                {t.SmsSenderId && <span>Sender: {t.SmsSenderId.senderId}</span>}
                {t.SmsRoute && <span>Route: {t.SmsRoute.name}</span>}
                {t.dltContentId && <span>DLT: {t.dltContentId}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {templates.length === 0 && !loading && (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <FiFileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#6b7280' }}>No templates yet</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
};

export default SmsTemplates;
