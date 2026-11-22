import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiEdit2, FiBriefcase } from 'react-icons/fi';

const SmsCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', plan: 'basic' });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms/companies');
      setCompanies(res.data.companies || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const save = async () => {
    if (!form.name.trim()) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Company name required' }); return; }
    try {
      if (editItem) {
        await api.put(`/sms/companies/${editItem.id}`, form);
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
      } else {
        await api.post('/sms/companies', form);
        Swal.fire({ icon: 'success', title: 'Created!', timer: 1200, showConfirmButton: false });
      }
      setShowCreate(false); setEditItem(null); fetchCompanies();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' }); }
  };

  const planColors = { basic: '#6b7280', professional: '#3B82F6', enterprise: '#8b5cf6' };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Companies</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{companies.length} companies</p>
        </div>
        <button onClick={() => { setForm({ name: '', plan: 'basic' }); setEditItem(null); setShowCreate(true); }} style={styles.primaryBtn}><FiPlus size={18} /> Add Company</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{editItem ? 'Edit Company' : 'Add Company'}</h3>
            <button onClick={() => { setShowCreate(false); setEditItem(null); }} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}><label style={styles.label}>Company Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={styles.input} placeholder="Company name" /></div>
            <div style={styles.field}><label style={styles.label}>Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} style={styles.input}>
                <option value="basic">Basic</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={save} style={styles.primaryBtn}>{editItem ? 'Update' : 'Create'}</button>
            <button onClick={() => { setShowCreate(false); setEditItem(null); }} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Company</th><th style={styles.th}>Owner</th><th style={styles.th}>Plan</th><th style={styles.th}>Users</th><th style={styles.th}>Status</th><th style={styles.th}>Created</th><th style={styles.th}>Actions</th></tr></thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={styles.td}><span style={{ fontWeight: 600, color: '#111827' }}>{c.name}</span></td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{c.owner?.name || '-'}</td>
                <td style={styles.td}><span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: `${planColors[c.plan] || '#6b7280'}15`, color: planColors[c.plan] || '#6b7280', textTransform: 'capitalize' }}>{c.plan}</span></td>
                <td style={styles.td}>{c.userCount || 0}</td>
                <td style={styles.td}><span style={{ color: c.isActive ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 12 }}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td style={styles.td}>
                  <button onClick={() => { setForm({ name: c.name, plan: c.plan }); setEditItem(c); setShowCreate(true); }} style={styles.actionBtn}><FiEdit2 size={14} color="#3B82F6" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}><FiBriefcase size={36} style={{ opacity: 0.3, marginBottom: 8 }} /><p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No companies</p></div>
        )}
      </div>
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
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151' },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
};

export default SmsCompanies;
