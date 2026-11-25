import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import alert from '../../utils/alert';
import { FiCreditCard, FiArrowRight } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const SmsRecharge = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [smsCount, setSmsCount] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myWallet, setMyWallet] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, walletRes] = await Promise.all([
        api.get('/sms/wallet/rechargeable-users'),
        api.get('/sms/wallet/me'),
      ]);
      setUsers(usersRes.data.users);
      setMyWallet(walletRes.data.wallet);
    } catch (err) {
      alert.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecharge = async () => {
    if (!selectedUser || !smsCount || parseInt(smsCount) <= 0) {
      alert.error('Select a user and enter valid SMS count');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/sms/wallet/recharge', {
        userId: selectedUser.id,
        amount: parseInt(smsCount),
        reference,
      });
      alert.success(`Recharged ${smsCount} SMS to ${selectedUser.name}`);
      setSmsCount('');
      setReference('');
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      alert.error(err.response?.data?.error || 'Recharge failed');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>SMS Recharge</h2>
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>
          {user?.role === 'super_admin' ? 'Recharge any reseller or user SMS balance' : "Recharge your users' SMS balance"}
        </p>
      </div>

      <div style={styles.walletCard}>
        <div>
          <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 4 }}>Your SMS Balance</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: ACCENT }}>
            {myWallet?.balance || 0} SMS
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Total Recharged: {myWallet?.totalRecharged || 0}</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Total Spent: {myWallet?.totalSpent || 0}</div>
        </div>
      </div>

      <div style={styles.rechargePanel}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#111827' }}>Recharge User</h3>

        <div style={styles.field}>
          <label style={styles.label}>Select User *</label>
          <div style={styles.userGrid}>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{
                  ...styles.userItem,
                  borderColor: selectedUser?.id === u.id ? ACCENT : '#e5e7eb',
                  background: selectedUser?.id === u.id ? ACCENT + '08' : 'white',
                }}
              >
                <div style={styles.avatar}>{u.name[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>{u.name}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{u.email}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{u.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>
                    {u.SmsWallet?.balance || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>SMS</div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', gridColumn: '1 / -1' }}>No users available to recharge</div>
            )}
          </div>
        </div>

        {selectedUser && (
          <>
            <div style={styles.selectedBanner}>
              <FiArrowRight size={16} />
              Recharging: <strong>{selectedUser.name}</strong> — Current: <strong>{selectedUser.SmsWallet?.balance || 0} SMS</strong>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>SMS Count *</label>
              <input
                type="number"
                value={smsCount}
                onChange={e => setSmsCount(e.target.value)}
                style={styles.input}
                placeholder="Enter SMS count"
                min="1"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {quickAmounts.map(qa => (
                  <button key={qa} onClick={() => setSmsCount(String(qa))} style={styles.quickBtn}>+{qa}</button>
                ))}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Reference / Note (optional)</label>
              <input value={reference} onChange={e => setReference(e.target.value)} style={styles.input} placeholder="e.g. Payment received" />
            </div>

            {smsCount && parseInt(smsCount) > 0 && (
              <div style={styles.summaryBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#111827' }}>
                  <span>Recharge Amount</span>
                  <span style={{ fontWeight: 700 }}>{parseInt(smsCount)} SMS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#6b7280' }}>
                  <span>New Balance</span>
                  <span>{(selectedUser.SmsWallet?.balance || 0) + parseInt(smsCount)} SMS</span>
                </div>
              </div>
            )}

            <button onClick={handleRecharge} style={styles.primaryBtn} disabled={submitting}>
              <FiCreditCard size={18} />
              {submitting ? 'Processing...' : `Recharge ${smsCount || '0'} SMS`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  walletCard: { background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16, border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rechargePanel: { background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  userGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10, maxHeight: 320, overflow: 'auto' },
  userItem: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '2px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 17, flexShrink: 0 },
  selectedBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: ACCENT + '10', border: `1px solid ${ACCENT}`, borderRadius: 10, fontSize: 16, marginBottom: 16, color: '#111827' },
  quickBtn: { padding: '6px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: ACCENT },
  summaryBox: { padding: 16, background: '#f9fafb', borderRadius: 10, marginBottom: 16, fontSize: 16, border: '1px solid #f3f4f6' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: ACCENT, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 17, width: '100%', justifyContent: 'center', boxShadow: `0 2px 8px ${ACCENT}40` },
};

export default SmsRecharge;
