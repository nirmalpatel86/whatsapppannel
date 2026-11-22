import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import alert from '../utils/alert';
import { FiDollarSign, FiArrowRight } from 'react-icons/fi';

const Recharge = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myWallet, setMyWallet] = useState(null);
  const [pricing, setPricing] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, walletRes] = await Promise.all([
        api.get('/wallet/rechargeable-users'),
        api.get('/wallet/me'),
      ]);
      setUsers(usersRes.data.users);
      setMyWallet(walletRes.data.wallet);
      setPricing(walletRes.data.pricing);
    } catch (err) {
      alert.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecharge = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      alert.error('Select a user and enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/wallet/recharge', {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        reference,
      });
      alert.success(`Recharged ₹${amount} to ${selectedUser.name}`);
      setAmount('');
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
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Recharge</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {user?.role === 'super_admin'
            ? 'Recharge any reseller or user wallet'
            : 'Recharge your users\' wallets'}
        </p>
      </div>

      <div style={styles.walletCard}>
        <div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Your Balance</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#e8b931' }}>
            ₹{myWallet?.balance?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Total Recharged: ₹{myWallet?.totalRecharged?.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Total Spent: ₹{myWallet?.totalSpent?.toFixed(2)}</div>
        </div>
      </div>

      <div style={styles.pricingCard}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Meta Pricing (per message)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(pricing).map(([key, val]) => (
            <div key={key} style={styles.priceTag}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#374151', fontSize: 12 }}>{key.replace('_', ' ')}</span>
              <span style={{ color: '#e8b931', fontWeight: 700, fontSize: 14 }}>₹{val.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.rechargePanel}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827' }}>Recharge User Wallet</h3>

        <div style={styles.field}>
          <label style={styles.label}>Select User *</label>
          <div style={styles.userGrid}>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{
                  ...styles.userItem,
                  borderColor: selectedUser?.id === u.id ? '#e8b931' : '#e5e7eb',
                  background: selectedUser?.id === u.id ? '#e8b93112' : 'white',
                }}
              >
                <div style={styles.avatar}>{u.name[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e8b931' }}>
                    ₹{u.Wallet?.balance?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>balance</div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', gridColumn: '1 / -1' }}>
                No users available to recharge
              </div>
            )}
          </div>
        </div>

        {selectedUser && (
          <>
            <div style={styles.selectedBanner}>
              <FiArrowRight size={16} />
              Recharging: <strong>{selectedUser.name}</strong> ({selectedUser.email})
              — Current balance: <strong>₹{selectedUser.Wallet?.balance?.toFixed(2) || '0.00'}</strong>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Amount (INR) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
                placeholder="Enter amount"
                min="1"
                step="0.01"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {quickAmounts.map(qa => (
                  <button key={qa} onClick={() => setAmount(String(qa))} style={styles.quickBtn}>
                    +₹{qa}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Reference / Note (optional)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                style={styles.input}
                placeholder="e.g. Payment received via UPI"
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div style={styles.summaryBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#111827' }}>
                  <span>Recharge Amount</span>
                  <span style={{ fontWeight: 700 }}>₹{parseFloat(amount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>New Balance</span>
                  <span>₹{((selectedUser.Wallet?.balance || 0) + parseFloat(amount)).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  <span>Approx. messages (text)</span>
                  <span>~{Math.floor(((selectedUser.Wallet?.balance || 0) + parseFloat(amount)) / (pricing.text_only || 0.5))}</span>
                </div>
              </div>
            )}

            <button onClick={handleRecharge} style={styles.primaryBtn} disabled={submitting}>
              <FiDollarSign size={18} />
              {submitting ? 'Processing...' : `Recharge ₹${amount || '0'}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  walletCard: {
    background: 'white', borderRadius: 14, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16, border: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  pricingCard: {
    background: 'white', borderRadius: 14, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16, border: '1px solid #e5e7eb',
  },
  priceTag: {
    display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 16px',
    background: '#f9fafb', borderRadius: 10, fontSize: 13, minWidth: 120, border: '1px solid #f3f4f6',
  },
  rechargePanel: {
    background: 'white', borderRadius: 14, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  userGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 10, maxHeight: 320, overflow: 'auto',
  },
  userItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
    border: '2px solid #e5e7eb', borderRadius: 12, cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: '#374151',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: 15, flexShrink: 0,
  },
  selectedBanner: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
    background: '#e8b93115', border: '1px solid #e8b931', borderRadius: 10, fontSize: 14,
    marginBottom: 16, color: '#111827',
  },
  quickBtn: {
    padding: '6px 14px', background: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#e8b931',
  },
  summaryBox: {
    padding: 16, background: '#f9fafb', borderRadius: 10, marginBottom: 16, fontSize: 14, border: '1px solid #f3f4f6',
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
    background: '#e8b931', color: '#111827', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 15, width: '100%', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(232,185,49,0.25)',
  },
};

export default Recharge;
