import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import alert from '../utils/alert';
import { FiUser, FiMail, FiPhone, FiLock, FiSave } from 'react-icons/fi';

const SERVICE_COLORS = {
  whatsapp: '#3B82F6',
  sms: '#3B82F6',
  bulkmail: '#3B82F6',
};

const Profile = () => {
  const { user, activeService, updateProfile } = useAuth();
  const accentColor = SERVICE_COLORS[activeService] || '#e8b931';

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      alert.error('New password and confirm password do not match');
      return;
    }
    if (newPassword && !currentPassword) {
      alert.error('Enter your current password to set a new one');
      return;
    }

    const payload = { name, email };
    if (newPassword) {
      payload.password = newPassword;
      payload.currentPassword = currentPassword;
    }

    setSaving(true);
    try {
      await updateProfile(payload);
      alert.success('Profile updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 640 }}>
      <div style={{ marginBottom: 26 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>My Profile</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>View and edit your account details</p>
      </div>

      <div style={{
        background: 'white', borderRadius: 14, padding: 26, marginBottom: 22,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 22, color: '#ffffff', flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'capitalize' }}>
            {user?.role?.replace('_', ' ')} {user?.Company?.name ? `· ${user.Company.name}` : ''}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white', borderRadius: 14, padding: 26, marginBottom: 18,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
        }}>
          <h3 style={{ margin: '0 0 18px', color: '#111827', fontSize: 16, fontWeight: 600 }}>Account Details</h3>

          <Field label="Full Name" icon={FiUser}>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          </Field>

          <Field label="Email" icon={FiMail}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
          </Field>

          <Field label="Mobile Number" icon={FiPhone}>
            <input value={user?.phone || ''} disabled style={{ ...inputStyle, color: '#9ca3af', cursor: 'not-allowed' }} />
          </Field>
        </div>

        <div style={{
          background: 'white', borderRadius: 14, padding: 26, marginBottom: 18,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
        }}>
          <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: 16, fontWeight: 600 }}>Change Password</h3>
          <p style={{ margin: '0 0 18px', color: '#9ca3af', fontSize: 13 }}>Leave blank to keep your current password</p>

          <Field label="Current Password" icon={FiLock}>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="Required to set a new password" />
          </Field>

          <Field label="New Password" icon={FiLock}>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Confirm New Password" icon={FiLock}>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px',
            background: accentColor, color: '#ffffff', border: 'none', borderRadius: 10,
            fontWeight: 600, fontSize: 15, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

const Field = ({ label, icon: Icon, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 }}>{label}</label>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
      border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb',
    }}>
      <Icon size={16} color="#9ca3af" />
      {children}
    </div>
  </div>
);

const inputStyle = {
  flex: 1, padding: '11px 0', border: 'none', background: 'none',
  fontSize: 16, outline: 'none', color: '#111827',
};

export default Profile;
