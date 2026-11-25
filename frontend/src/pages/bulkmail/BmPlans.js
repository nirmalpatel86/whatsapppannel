import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const BmPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ name: '', emailCount: '', validityDays: 30, price: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', emailCount: '', validityDays: 30, price: '', description: '' });

  const fetchPlans = useCallback(async () => {
    try { const res = await api.get('/bulkmail/plans'); setPlans(res.data.plans || []); }
    catch { alert.error('Failed to load plans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const createPlan = async () => {
    if (!form.name.trim() || !form.emailCount || !form.price) { alert.error('Name, email count and price are required'); return; }
    try {
      await api.post('/bulkmail/plans', { ...form, emailCount: parseInt(form.emailCount), validityDays: parseInt(form.validityDays), price: parseFloat(form.price) });
      alert.success('Plan created'); setShowCreate(false); setForm({ name: '', emailCount: '', validityDays: 30, price: '', description: '' }); fetchPlans();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const openEdit = (p) => {
    setEditPlan(p);
    setEditForm({ name: p.name, emailCount: p.emailCount, validityDays: p.validityDays || 30, price: p.price, description: p.description || '' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) { alert.error('Name is required'); return; }
    try {
      await api.put(`/bulkmail/plans/${editPlan.id}`, { ...editForm, emailCount: parseInt(editForm.emailCount), validityDays: parseInt(editForm.validityDays), price: parseFloat(editForm.price) });
      alert.success('Plan updated'); setEditPlan(null); fetchPlans();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to update'); }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try { await api.delete(`/bulkmail/plans/${id}`); alert.success('Deleted'); fetchPlans(); }
    catch { alert.error('Failed to delete'); }
  };

  const toggleActive = async (id, isActive) => {
    try { await api.put(`/bulkmail/plans/${id}`, { isActive: !isActive }); alert.success(isActive ? 'Plan deactivated' : 'Plan activated'); fetchPlans(); }
    catch { alert.error('Failed to update'); }
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  const renderForm = (f, setF) => (
    <div style={styles.formGrid}>
      <div style={styles.field}><label style={styles.label}>Plan Name *</label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} style={styles.input} placeholder="e.g. Starter" /></div>
      <div style={styles.field}><label style={styles.label}>Email Count *</label><input type="number" value={f.emailCount} onChange={e => setF({ ...f, emailCount: e.target.value })} style={styles.input} placeholder="10000" /></div>
      <div style={styles.field}><label style={styles.label}>Validity (Days) *</label><input type="number" value={f.validityDays} onChange={e => setF({ ...f, validityDays: e.target.value })} style={styles.input} /></div>
      <div style={styles.field}><label style={styles.label}>Price (₹) *</label><input type="number" step="0.01" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} style={styles.input} placeholder="499" /></div>
      <div style={{ ...styles.field, gridColumn: '1 / -1' }}><label style={styles.label}>Description</label><input value={f.description} onChange={e => setF({ ...f, description: e.target.value })} style={styles.input} placeholder="Optional description" /></div>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Email Plans</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{plans.length} plans</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> New Plan</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Create Plan</h3><button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button></div>
            <div style={{ padding: '20px 24px' }}>{renderForm(form, setForm)}</div>
            <div style={styles.modalFooter}><button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button><button onClick={createPlan} style={styles.primaryBtn}>Create Plan</button></div>
          </div>
        </div>
      )}

      {editPlan && (
        <div style={styles.modalOverlay} onClick={() => setEditPlan(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Edit Plan</h3><button onClick={() => setEditPlan(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button></div>
            <div style={{ padding: '20px 24px' }}>{renderForm(editForm, setEditForm)}</div>
            <div style={styles.modalFooter}><button onClick={() => setEditPlan(null)} style={styles.secondaryBtn}>Cancel</button><button onClick={saveEdit} style={styles.primaryBtn}>Save Changes</button></div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {plans.map(p => (
          <div key={p.id} style={{ ...styles.card, borderTop: `3px solid ${p.isActive !== false ? ACCENT : '#d1d5db'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.planIcon}><FiPackage size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 14, color: '#9ca3af' }}>{p.description}</div>}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: p.isActive !== false ? '#22c55e20' : '#ef444420', color: p.isActive !== false ? '#22c55e' : '#ef4444' }}>{p.isActive !== false ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: ACCENT }}>₹{parseFloat(p.price).toFixed(0)}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>{p.validityDays} days validity</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#374151' }}>{(p.emailCount || 0).toLocaleString()}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>emails</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
              <button onClick={() => openEdit(p)} style={styles.actionBtn}><FiEdit2 size={14} color="#2563eb" /></button>
              <button onClick={() => toggleActive(p.id, p.isActive !== false)} style={{ ...styles.actionBtn, fontSize: 13, padding: '4px 10px' }}>{p.isActive !== false ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => deletePlan(p.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiPackage size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No plans yet</h3>
          <p style={{ margin: 0, fontSize: 16 }}>Create email plans for your users.</p>
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
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  planIcon: { width: 42, height: 42, borderRadius: 10, background: `${ACCENT}12`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
};

export default BmPlans;
