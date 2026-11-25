import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import alert from '../../utils/alert';
import RichTextEditor from '../../components/RichTextEditor';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const ACCENT = '#3B82F6';

// Merge tags actually substituted by the campaign/quick-send pipeline
// (controllers/bulkmail/bmCampaignController.js & bmSendController.js).
const VARIABLES = [
  { label: 'Name', value: '{name}' },
  { label: 'Email', value: '{email}' },
  { label: 'Company', value: '{company}' },
  { label: 'Profession', value: '{profession}' },
  { label: 'Ext Column 1', value: '{col1}' },
  { label: 'Ext Column 2', value: '{col2}' },
  { label: 'Ext Column 3', value: '{col3}' },
  { label: 'Ext Column 4', value: '{col4}' },
  { label: 'Ext Column 5', value: '{col5}' },
];

const textContent = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || '').trim();
};

const BmTemplateForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/bulkmail/templates/${id}`)
      .then(res => {
        const t = res.data.template;
        setForm({ name: t.name || '', subject: t.subject || '', body: t.body || '' });
      })
      .catch(() => alert.error('Failed to load template'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!form.name.trim()) { alert.error('Template name is required'); return; }
    if (!form.subject.trim()) { alert.error('Subject is required'); return; }
    if (!textContent(form.body) && !/<img|<table/i.test(form.body)) { alert.error('Email body cannot be empty'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/bulkmail/templates/${id}`, form);
        alert.success('Template updated');
      } else {
        await api.post('/bulkmail/templates', form);
        alert.success('Template created');
      }
      navigate('/bulkmail/templates');
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900 }}>
      <button onClick={() => navigate('/bulkmail/templates')} style={styles.backBtn}>
        <FiArrowLeft size={15} /> Back to Templates
      </button>
      <h2 style={{ margin: '14px 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>
        {isEdit ? 'Edit Template' : 'New Template'}
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: '#6b7280' }}>
        Design the email that will be used in your campaigns.
      </p>

      <div style={styles.card}>
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

        <div style={{ marginBottom: 14 }}>
          <label style={styles.label}>Insert Variable</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {VARIABLES.map(v => (
              <button
                key={v.value}
                type="button"
                onClick={() => editorRef.current?.insertText(v.value)}
                style={styles.varBtn}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={styles.label}>Body *</label>
          <RichTextEditor
            ref={editorRef}
            value={form.body}
            onChange={html => setForm(f => ({ ...f, body: html }))}
            placeholder="Write your email... use the buttons above to insert contact variables"
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>
            <FiSave size={16} /> {saving ? 'Saving...' : 'Save Template'}
          </button>
          <button onClick={() => navigate('/bulkmail/templates')} style={styles.secondaryBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 500, padding: 0 },
  card: { background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  varBtn: { padding: '6px 12px', background: `${ACCENT}10`, border: `1px solid ${ACCENT}40`, borderRadius: 20, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: ACCENT },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '12px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
};

export default BmTemplateForm;
