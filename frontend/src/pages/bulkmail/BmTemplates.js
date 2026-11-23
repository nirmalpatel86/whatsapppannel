import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';

const ACCENT = '#EF4444';

const BmTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [editForm, setEditForm] = useState({ name: '', subject: '', body: '' });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/bulkmail/templates');
      setTemplates(res.data.templates || []);
    } catch { alert.error('Failed to load templates'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const createTemplate = async () => {
    if (!form.name.trim() || !form.subject.trim()) { alert.error('Name and subject are required'); return; }
    try {
      await api.post('/bulkmail/templates', form);
      alert.success('Template created');
      setShowCreate(false);
      setForm({ name: '', subject: '', body: '' });
      fetchTemplates();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const openEdit = (t) => {
    setEditTemplate(t);
    setEditForm({ name: t.name, subject: t.subject || '', body: t.body || '' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) { alert.error('Name is required'); return; }
    try {
      await api.put(`/bulkmail/templates/${editTemplate.id}`, editForm);
      alert.success('Template updated');
      setEditTemplate(null);
      fetchTemplates();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to update'); }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/bulkmail/templates/${id}`);
      alert.success('Template deleted');
      fetchTemplates();
    } catch { alert.error('Failed to delete'); }
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Email Templates</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{templates.length} templates</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> New Template</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Create Template</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Template Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. Welcome Email" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={styles.input} placeholder="Email subject line" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Body (HTML)</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ ...styles.input, minHeight: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} placeholder="<h1>Hello {{name}}</h1>" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={createTemplate} style={styles.primaryBtn}>Create Template</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {editTemplate && (
        <div style={styles.modalOverlay} onClick={() => setEditTemplate(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Template</h3>
              <button onClick={() => setEditTemplate(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Subject</label>
                  <input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div>
                <label style={styles.label}>Body (HTML)</label>
                <textarea value={editForm.body} onChange={e => setEditForm({ ...editForm, body: e.target.value })} style={{ ...styles.input, minHeight: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setEditTemplate(null)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={saveEdit} style={styles.primaryBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div style={styles.modalOverlay} onClick={() => setPreview(null)}>
          <div style={{ ...styles.modal, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Preview: {preview.name}</h3>
              <button onClick={() => setPreview(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '12px 24px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <strong style={{ fontSize: 13, color: '#374151' }}>Subject:</strong> <span style={{ fontSize: 13, color: '#6b7280' }}>{preview.subject}</span>
            </div>
            <div style={{ padding: 24, minHeight: 200 }} dangerouslySetInnerHTML={{ __html: preview.body || '<p style="color:#9ca3af">No body content</p>' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {templates.map(t => (
          <div key={t.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.tplIcon}><FiFileText size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.subject || 'No subject'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPreview(t)} style={styles.actionBtn}><FiEye size={14} color="#3b82f6" /></button>
                <button onClick={() => openEdit(t)} style={styles.actionBtn}><FiEdit2 size={14} color="#2563eb" /></button>
                <button onClick={() => deleteTemplate(t.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
              Created: {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiFileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No templates yet</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Create email templates for your campaigns.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(239,68,68,0.25)',
  },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  tplIcon: { width: 38, height: 38, borderRadius: 10, background: `${ACCENT}12`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 },
  modalBody: { padding: '20px 24px', overflow: 'auto', flex: 1 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb', flexShrink: 0 },
};

export default BmTemplates;
