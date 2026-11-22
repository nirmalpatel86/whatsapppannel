import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { FiPhone, FiLock, FiMessageSquare, FiMail, FiSmartphone } from 'react-icons/fi';

const SERVICES = [
  { id: 'whatsapp', label: 'WhatsApp', icon: FiSmartphone, color: '#25D366', desc: 'WhatsApp messaging & campaigns' },
  { id: 'sms', label: 'SMS', icon: FiMessageSquare, color: '#3B82F6', desc: 'Bulk SMS & transactional messaging' },
  { id: 'bulkmail', label: 'Bulk Mail', icon: FiMail, color: '#EF4444', desc: 'Email campaigns & marketing' },
];

const SERVICE_DASHBOARD = {
  whatsapp: '/dashboard',
  sms: '/sms/dashboard',
  bulkmail: '/bulkmail/dashboard',
};

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('whatsapp');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password, selectedService);
      Swal.fire({ icon: 'success', title: 'Welcome!', text: 'Login successful', timer: 1500, showConfirmButton: false });
      navigate(SERVICE_DASHBOARD[selectedService]);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Login Failed', text: err.response?.data?.error || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  const activeService = SERVICES.find(s => s.id === selectedService);

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoText}>Leadofy</span>
            <div style={styles.logoUnderline} />
          </div>
          <p style={styles.tagline}>Simplifying Business Communication</p>
          <div style={styles.features}>
            <div style={styles.featureItem}>Multi-channel WhatsApp messaging</div>
            <div style={styles.featureItem}>Bulk SMS & transactional routes</div>
            <div style={styles.featureItem}>Email campaigns with tracking</div>
            <div style={styles.featureItem}>Wallet-based billing system</div>
          </div>
        </div>
      </div>
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>Select a service and sign in</p>
          </div>

          {/* Service Selector */}
          <div style={styles.serviceSelector}>
            {SERVICES.map(service => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedService(service.id)}
                style={{
                  ...styles.serviceBtn,
                  borderColor: selectedService === service.id ? service.color : '#e5e7eb',
                  background: selectedService === service.id ? `${service.color}10` : '#fff',
                  color: selectedService === service.id ? service.color : '#6b7280',
                }}
              >
                <service.icon size={20} />
                <span style={styles.serviceBtnLabel}>{service.label}</span>
              </button>
            ))}
          </div>
          <p style={styles.serviceDesc}>{activeService?.desc}</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Mobile Number</label>
              <div style={styles.inputWrapper}>
                <FiPhone size={16} color="#9ca3af" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.input}
                  required
                  placeholder="919876543210"
                />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <FiLock size={16} color="#9ca3af" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                  placeholder="Enter your password"
                />
              </div>
            </div>
            <button
              type="submit"
              style={{ ...styles.button, background: activeService?.color || '#e8b931' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : `Sign In to ${activeService?.label}`}
            </button>
          </form>
          <p style={styles.footer}>
            Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex' },
  leftPanel: {
    flex: 1, background: '#111827', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 48,
  },
  brandContent: { maxWidth: 400 },
  logoWrapper: { display: 'inline-block', marginBottom: 16 },
  logoText: { fontSize: 42, fontWeight: 800, color: '#ffffff', letterSpacing: -1 },
  logoUnderline: { height: 4, background: '#e8b931', borderRadius: 2, marginTop: 4 },
  tagline: { fontSize: 16, color: '#9ca3af', margin: '0 0 40px', fontStyle: 'italic' },
  features: { display: 'flex', flexDirection: 'column', gap: 14 },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 10, color: '#d1d5db',
    fontSize: 14, paddingLeft: 16, borderLeft: '2px solid #e8b931',
  },
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f1f5f9', padding: 48,
  },
  card: {
    background: 'white', borderRadius: 16, padding: 40,
    width: 460, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  header: { marginBottom: 24 },
  title: { margin: 0, color: '#111827', fontSize: 26, fontWeight: 700 },
  subtitle: { margin: '6px 0 0', color: '#6b7280', fontSize: 14 },
  serviceSelector: {
    display: 'flex', gap: 8, marginBottom: 8,
  },
  serviceBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '12px 8px', border: '2px solid #e5e7eb', borderRadius: 12,
    cursor: 'pointer', transition: 'all 0.2s', background: '#fff', fontSize: 13,
  },
  serviceBtnLabel: { fontWeight: 600, fontSize: 12 },
  serviceDesc: {
    textAlign: 'center', fontSize: 12, color: '#9ca3af', marginBottom: 20, marginTop: 4,
  },
  field: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  inputWrapper: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
    border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb',
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1, padding: '11px 0', border: 'none', background: 'none',
    fontSize: 14, outline: 'none', color: '#111827',
  },
  button: {
    width: '100%', padding: 12, background: '#e8b931', color: '#ffffff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  footer: { textAlign: 'center', marginTop: 24, color: '#6b7280', fontSize: 14 },
  link: { color: '#e8b931', fontWeight: 600 },
};

export default Login;
