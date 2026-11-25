import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiBriefcase, FiX } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const BmCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', plan: 'free', maxCampaignsPerDay: 5 });

  const fetchCompanies = useCallback(async () => {
    try { const res = await api.get('/bulkmail/companies'); setCompanies(res.data.companies || []); }
    catch { alert.error('Failed to load companies'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const createCompany = async () => {
    if (!form.name) { alert.error('Name is required'); return; }
    try {
      await api.post('/bulkmail/companies', form);
      alert.success('Company created'); setShowCreate(false); setForm({ name: '', plan: 'free', maxCampaignsPerDay: 5 }); fetchCompanies();
    } catch { alert.error('Failed to create'); }
  };

  const planColors = { free: '#6b7280', basic: '#3b82f6', pro: '#7c3aed', enterprise: '#e8b931' };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Companies</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{companies.length} companies</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add Company</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Create Company</h3>
              <button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <div style={styles.field}><label style={styles.label}>Company Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. Acme Corp" /></div>
                <div style={styles.field}>
                  <label style={styles.label}>Plan</label>
                  <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={styles.input}>
                    <option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div style={styles.field}><label style={styles.label}>Max Campaigns/Day</label><input type="number" value={form.maxCampaignsPerDay} onChange={e => setForm({ ...form, maxCampaignsPerDay: parseInt(e.target.value) })} style={styles.input} /></div>
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button><button onClick={createCompany} style={styles.primaryBtn}>Create</button></div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {companies.map(c => (
          <div key={c.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.companyIcon}><FiBriefcase size={18} /></div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111827' }}>{c.name}</h3>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: (planColors[c.plan] || '#6b7280') + '20', color: planColors[c.plan] || '#6b7280' }}>{c.plan}</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 15, color: '#6b7280' }}>Owner: {c.owner?.name || 'N/A'} ({c.owner?.email || ''})</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 15, color: '#9ca3af' }}>
              <span>Campaigns/Day: <strong style={{ color: '#374151' }}>{c.maxCampaignsPerDay || 5}</strong></span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: c.isActive ? '#22c55e20' : '#ef444420', color: c.isActive ? '#22c55e' : '#ef4444' }}>{c.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiBriefcase size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No companies yet</h3>
          <p style={{ margin: 0, fontSize: 16 }}>Create a company to get started.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  companyIcon: { width: 38, height: 38, borderRadius: 10, background: ACCENT, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
};

export default BmCompanies;
