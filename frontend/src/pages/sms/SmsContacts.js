import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiSearch, FiEdit2, FiTrash2, FiUpload, FiDownload, FiUsers, FiCheckSquare, FiSquare } from 'react-icons/fi';

const SmsContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', isDnd: false });
  const [submitting, setSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const bulkRef = useRef(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms/contacts', { params: { search: search || undefined, page, limit: 50 } });
      setContacts(res.data.contacts || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { setSelected(new Set()); }, [contacts]);

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selected.size === contacts.length ? setSelected(new Set()) : setSelected(new Set(contacts.map(c => c.id)));

  const addContact = async () => {
    if (!form.phone.trim()) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Phone number is required' }); return; }
    setSubmitting(true);
    try {
      await api.post('/sms/contacts', form);
      Swal.fire({ icon: 'success', title: 'Added!', timer: 1200, showConfirmButton: false });
      setShowAdd(false); setForm({ name: '', phone: '', email: '', isDnd: false }); fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' });
    } finally { setSubmitting(false); }
  };

  const saveEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/sms/contacts/${editItem.id}`, form);
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
      setEditItem(null); fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' });
    } finally { setSubmitting(false); }
  };

  const deleteContact = async (id) => {
    const r = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!r.isConfirmed) return;
    try { await api.delete(`/sms/contacts/${id}`); fetchContacts(); } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed' }); }
  };

  const bulkDelete = async () => {
    const r = await Swal.fire({ title: `Delete ${selected.size} contacts?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: `Delete ${selected.size}` });
    if (!r.isConfirmed) return;
    try { await api.post('/sms/contacts/bulk-delete', { ids: [...selected] }); setSelected(new Set()); fetchContacts(); } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }); }
  };

  const bulkUpload = async () => {
    if (!bulkFile) return;
    setSubmitting(true); setBulkResult(null);
    try {
      const fd = new FormData(); fd.append('file', bulkFile);
      const res = await api.post('/sms/contacts/bulk-import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkResult(res.data); fetchContacts();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: 'Upload failed' }); }
    finally { setSubmitting(false); }
  };

  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', isDnd: c.isDnd || false }); };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Contacts</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{total} contacts</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={styles.searchBox}>
            <FiSearch size={15} color="#9ca3af" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." style={styles.searchInput} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><FiX size={14} /></button>}
          </div>
          <button onClick={() => { setBulkFile(null); setBulkResult(null); setShowBulk(true); }} style={styles.outlineBtn}><FiUpload size={15} /> Bulk Upload</button>
          <button onClick={() => { setForm({ name: '', phone: '', email: '', isDnd: false }); setShowAdd(true); }} style={styles.primaryBtn}><FiPlus size={18} /> Add Contact</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.size} selected</span>
          <button onClick={bulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><FiTrash2 size={14} /> Delete</button>
          <button onClick={() => setSelected(new Set())} style={styles.outlineBtn}>Clear</button>
        </div>
      )}

      {(showAdd || editItem) && (
        <div style={styles.modalOverlay} onClick={() => { setShowAdd(false); setEditItem(null); }}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>{editItem ? 'Edit Contact' : 'Add Contact'}</h3>
              <button onClick={() => { setShowAdd(false); setEditItem(null); }} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8 }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={styles.field}><label style={styles.label}>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={styles.input} placeholder="Name" /></div>
                <div style={styles.field}><label style={styles.label}>Phone *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={styles.input} placeholder="919876543210" disabled={!!editItem} /></div>
                <div style={styles.field}><label style={styles.label}>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={styles.input} placeholder="email@example.com" /></div>
                <div style={{ ...styles.field, display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isDnd} onChange={e => setForm(f => ({ ...f, isDnd: e.target.checked }))} /> DND (Do Not Disturb)
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <button onClick={() => { setShowAdd(false); setEditItem(null); }} style={styles.outlineBtn}>Cancel</button>
              <button onClick={editItem ? saveEdit : addContact} disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Saving...' : (editItem ? 'Save' : 'Add Contact')}</button>
            </div>
          </div>
        </div>
      )}

      {showBulk && (
        <div style={styles.modalOverlay} onClick={() => setShowBulk(false)}>
          <div style={{ ...styles.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Bulk Upload</h3>
              <button onClick={() => setShowBulk(false)} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8 }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <input ref={bulkRef} type="file" accept=".csv" onChange={e => { setBulkFile(e.target.files[0] || null); setBulkResult(null); }} style={{ display: 'none' }} />
                <button onClick={() => bulkRef.current?.click()} style={styles.outlineBtn}>Choose CSV File</button>
                {bulkFile && <div style={{ marginTop: 10, fontSize: 13, color: '#111827' }}>{bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)</div>}
              </div>
              {bulkResult && (
                <div style={{ marginTop: 16, padding: 16, background: bulkResult.imported > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 12, border: `1px solid ${bulkResult.imported > 0 ? '#bbf7d0' : '#fecaca'}` }}>
                  <div style={{ fontSize: 13 }}>Imported: <b>{bulkResult.imported}</b> | Skipped: <b>{bulkResult.skipped}</b></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <button onClick={() => setShowBulk(false)} style={styles.outlineBtn}>Close</button>
              <button onClick={bulkUpload} disabled={!bulkFile || submitting} style={{ ...styles.primaryBtn, opacity: !bulkFile ? 0.5 : 1 }}>{submitting ? 'Uploading...' : 'Upload & Import'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 40, textAlign: 'center' }}>
                <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {selected.size === contacts.length && contacts.length > 0 ? <FiCheckSquare size={16} color="#3B82F6" /> : <FiSquare size={16} color="#d1d5db" />}
                </button>
              </th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>DND</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', background: selected.has(c.id) ? '#eff6ff' : 'transparent' }}>
                <td style={{ ...styles.td, width: 40, textAlign: 'center' }}>
                  <button onClick={() => toggleSelect(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                    {selected.has(c.id) ? <FiCheckSquare size={16} color="#3B82F6" /> : <FiSquare size={16} color="#d1d5db" />}
                  </button>
                </td>
                <td style={styles.td}><span style={{ fontWeight: 500, color: '#111827' }}>{c.name || '-'}</span></td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>{c.phone}</td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 13 }}>{c.email || '-'}</td>
                <td style={styles.td}>{c.isDnd ? <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>DND</span> : '-'}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={styles.actionBtn}><FiEdit2 size={14} color="#3B82F6" /></button>
                    <button onClick={() => deleteContact(c.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiUsers size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No contacts found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>Prev</button>
          <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  outlineBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, width: 180, color: '#111827' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 580, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 16px', fontSize: 14 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  pageBtn: { padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
};

export default SmsContacts;
