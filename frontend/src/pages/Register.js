import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { FiUser, FiPhone, FiLock, FiBriefcase, FiMessageSquare, FiMail, FiSmartphone } from 'react-icons/fi';

const SERVICES = [
  { id: 'whatsapp', label: 'WhatsApp', icon: FiSmartphone, color: '#3B82F6' },
  { id: 'sms', label: 'SMS', icon: FiMessageSquare, color: '#3B82F6' },
  { id: 'bulkmail', label: 'Bulk Mail', icon: FiMail, color: '#3B82F6' },
];

const SERVICE_DASHBOARD = {
  whatsapp: '/dashboard',
  sms: '/sms/dashboard',
  bulkmail: '/bulkmail/dashboard',
};

const Register = () => {
  const [form, setForm] = useState({ name: '', phone: '', password: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('whatsapp');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.phone, form.password, form.companyName, selectedService);
      Swal.fire({ icon: 'success', title: 'Account Created!', text: 'Welcome to Leadofy', timer: 1500, showConfirmButton: false });
      navigate(SERVICE_DASHBOARD[selectedService]);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.response?.data?.error || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const activeService = SERVICES.find(s => s.id === selectedService);

  const fields = [
    { key: 'name', label: 'Full Name', icon: FiUser, type: 'text', required: true },
    { key: 'phone', label: 'Mobile Number', icon: FiPhone, type: 'tel', required: true, placeholder: '919876543210' },
    { key: 'password', label: 'Password', icon: FiLock, type: 'password', required: true, min: 6 },
    { key: 'companyName', label: 'Company Name', icon: FiBriefcase, type: 'text', required: true },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div>
          <div style={styles.logoWrapper}>
            <span style={styles.logoText}>Leadofy</span>
            <div style={styles.logoUnderline} />
          </div>
          <p style={styles.tagline}>Simplifying Business Communication</p>
        </div>
      </div>
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>Select a service to get started</p>
          </div>

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
                <service.icon size={18} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{service.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {fields.map(f => (
              <div key={f.key} style={styles.field}>
                <label style={styles.label}>{f.label}</label>
                <div style={styles.inputWrapper}>
                  <f.icon size={16} color="#9ca3af" />
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={update(f.key)}
                    style={styles.input}
                    required={f.required}
                    minLength={f.min}
                    placeholder={f.placeholder || ''}
                  />
                </div>
              </div>
            ))}
            <button
              type="submit"
              style={{ ...styles.button, background: activeService?.color || '#e8b931' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : `Create ${activeService?.label} Account`}
            </button>
          </form>
          <p style={styles.footer}>
            Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
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
  logoWrapper: { display: 'inline-block', marginBottom: 16 },
  logoText: { fontSize: 44, fontWeight: 800, color: '#ffffff', letterSpacing: -1 },
  logoUnderline: { height: 4, background: '#e8b931', borderRadius: 2, marginTop: 4 },
  tagline: { fontSize: 18, color: '#9ca3af', margin: 0, fontStyle: 'italic' },
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f1f5f9', padding: 48,
  },
  card: {
    background: 'white', borderRadius: 16, padding: 40,
    width: 460, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  header: { marginBottom: 24 },
  title: { margin: 0, color: '#111827', fontSize: 28, fontWeight: 700 },
  subtitle: { margin: '6px 0 0', color: '#6b7280', fontSize: 16 },
  serviceSelector: { display: 'flex', gap: 8, marginBottom: 20 },
  serviceBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '10px 8px', border: '2px solid #e5e7eb', borderRadius: 10,
    cursor: 'pointer', transition: 'all 0.2s', background: '#fff', fontSize: 15,
  },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  inputWrapper: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
    border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb',
  },
  input: {
    flex: 1, padding: '11px 0', border: 'none', background: 'none',
    fontSize: 16, outline: 'none', color: '#111827',
  },
  button: {
    width: '100%', padding: 12, background: '#e8b931', color: '#ffffff',
    border: 'none', borderRadius: 10, fontSize: 17, fontWeight: 700,
    cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  footer: { textAlign: 'center', marginTop: 24, color: '#6b7280', fontSize: 16 },
  link: { color: '#e8b931', fontWeight: 600 },
};

export default Register;
