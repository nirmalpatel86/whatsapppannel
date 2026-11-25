import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const BmTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/bulkmail/templates');
      setTemplates(res.data.templates || []);
    } catch { alert.error('Failed to load templates'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

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
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Email Templates</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{templates.length} templates</p>
        </div>
        <button onClick={() => navigate('/bulkmail/templates/new')} style={styles.primaryBtn}><FiPlus size={18} /> New Template</button>
      </div>

      {preview && (
        <div style={styles.modalOverlay} onClick={() => setPreview(null)}>
          <div style={{ ...styles.modal, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Preview: {preview.name}</h3>
              <button onClick={() => setPreview(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '12px 24px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <strong style={{ fontSize: 15, color: '#374151' }}>Subject:</strong> <span style={{ fontSize: 15, color: '#6b7280' }}>{preview.subject}</span>
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
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>{t.name}</div>
                  <div style={{ fontSize: 14, color: '#9ca3af' }}>{t.subject || 'No subject'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPreview(t)} style={styles.actionBtn}><FiEye size={14} color="#3b82f6" /></button>
                <button onClick={() => navigate(`/bulkmail/templates/${t.id}/edit`)} style={styles.actionBtn}><FiEdit2 size={14} color="#2563eb" /></button>
                <button onClick={() => deleteTemplate(t.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, color: '#9ca3af' }}>
              Created: {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiFileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No templates yet</h3>
          <p style={{ margin: 0, fontSize: 16 }}>Create email templates for your campaigns.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  tplIcon: { width: 38, height: 38, borderRadius: 10, background: `${ACCENT}12`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 },
};

export default BmTemplates;
