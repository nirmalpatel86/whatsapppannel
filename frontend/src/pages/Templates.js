import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import alert from '../utils/alert';
import { FiPlus, FiTrash2, FiFileText, FiX } from 'react-icons/fi';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', language: 'en', category: 'marketing', body: '', header: '', footer: '',
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates);
    } catch (err) {
      alert.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const createTemplate = async () => {
    if (!form.name || !form.body) {
      alert.error('Name and body are required');
      return;
    }
    try {
      await api.post('/templates', form);
      alert.success('Template created');
      setShowCreate(false);
      setForm({ name: '', language: 'en', category: 'marketing', body: '', header: '', footer: '' });
      fetchTemplates();
    } catch (err) {
      alert.error('Failed to create');
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      alert.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      alert.error('Failed to delete');
    }
  };

  const statusColors = { draft: '#6b7280', pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Message Templates</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>Prepare templates for Meta Cloud API approval</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>
          <FiPlus size={18} /> New Template
        </button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>Create Template</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Template Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. order_confirmation" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} style={styles.input}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input}>
                <option value="marketing">Marketing</option>
                <option value="utility">Utility</option>
                <option value="authentication">Authentication</option>
              </select>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Header (optional)</label>
            <input value={form.header} onChange={(e) => setForm({ ...form, header: e.target.value })} style={styles.input} placeholder="Header text" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Body *</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
              placeholder="Hello {{1}}, your order {{2}} has been shipped!" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Footer (optional)</label>
            <input value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} style={styles.input} placeholder="Footer text" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={createTemplate} style={styles.primaryBtn}>Create</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {templates.map(tpl => (
          <div key={tpl.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 600, color: '#111827' }}>{tpl.name}</h3>
              <span style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                background: (statusColors[tpl.status] || '#6b7280') + '20',
                color: statusColors[tpl.status] || '#6b7280',
              }}>
                {tpl.status}
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>
              {tpl.category} | {tpl.language}
            </div>
            {tpl.header && <div style={{ fontWeight: 600, marginBottom: 4, color: '#111827', fontSize: 16 }}>{tpl.header}</div>}
            <div style={{ fontSize: 16, background: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 8, color: '#374151', border: '1px solid #f3f4f6' }}>
              {tpl.body}
            </div>
            {tpl.footer && <div style={{ fontSize: 14, color: '#9ca3af' }}>{tpl.footer}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => deleteTemplate(tpl.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}>
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiFileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No templates yet</h3>
          <p style={{ margin: 0, fontSize: 16 }}>Create templates for Meta Cloud API campaigns.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: '#e8b931', color: '#111827', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(232,185,49,0.25)',
  },
  secondaryBtn: {
    padding: '10px 20px', background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16,
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: {
    background: 'white', borderRadius: 14, padding: 24, marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16,
  },
  field: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  card: {
    background: 'white', borderRadius: 14, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
    cursor: 'pointer', fontSize: 15,
  },
};

export default Templates;
