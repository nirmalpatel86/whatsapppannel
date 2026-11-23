import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';

// WhatsApp pages
import Dashboard from './pages/Dashboard';
import WhatsappAccounts from './pages/WhatsappAccounts';
import Inbox from './pages/Inbox';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import Users from './pages/Users';
import Companies from './pages/Companies';
import Recharge from './pages/Recharge';
import Transactions from './pages/Transactions';
import ContactGroups from './pages/ContactGroups';
import WhatsappApiKeys from './pages/WhatsappApiKeys';
import WhatsappReports from './pages/WhatsappReports';

// SMS pages
import SmsDashboard from './pages/sms/SmsDashboard';
import SmsSendSms from './pages/sms/SmsSendSms';
import SmsCampaigns from './pages/sms/SmsCampaigns';
import SmsTemplates from './pages/sms/SmsTemplates';
import SmsSenderIds from './pages/sms/SmsSenderIds';
import SmsRoutes from './pages/sms/SmsRoutes';
import SmsContacts from './pages/sms/SmsContacts';
import SmsGroups from './pages/sms/SmsGroups';
import SmsUsers from './pages/sms/SmsUsers';
import SmsCompanies from './pages/sms/SmsCompanies';
import SmsRecharge from './pages/sms/SmsRecharge';
import SmsTransactions from './pages/sms/SmsTransactions';
import SmsApiKeys from './pages/sms/SmsApiKeys';
import SmsReports from './pages/sms/SmsReports';

// BulkMail pages
import BmDashboard from './pages/bulkmail/BmDashboard';
import BmSendEmail from './pages/bulkmail/BmSendEmail';
import BmCampaigns from './pages/bulkmail/BmCampaigns';
import BmTemplates from './pages/bulkmail/BmTemplates';
import BmSenders from './pages/bulkmail/BmSenders';
import BmSmtp from './pages/bulkmail/BmSmtp';
import BmContacts from './pages/bulkmail/BmContacts';
import BmContactGroups from './pages/bulkmail/BmContactGroups';
import BmUsers from './pages/bulkmail/BmUsers';
import BmCompanies from './pages/bulkmail/BmCompanies';
import BmRecharge from './pages/bulkmail/BmRecharge';
import BmTransactions from './pages/bulkmail/BmTransactions';
import BmPlans from './pages/bulkmail/BmPlans';
import BmApiKeys from './pages/bulkmail/BmApiKeys';
import BmReports from './pages/bulkmail/BmReports';

import './App.css';

const SERVICE_DASHBOARD = {
  whatsapp: '/dashboard',
  sms: '/sms/dashboard',
  bulkmail: '/bulkmail/dashboard',
};

const PrivateRoute = ({ children, roles }) => {
  const { user, loading, activeService } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={SERVICE_DASHBOARD[activeService] || '/dashboard'} />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading, activeService } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={SERVICE_DASHBOARD[activeService] || '/dashboard'} />;
  return children;
};

const DefaultRedirect = () => {
  const { activeService } = useAuth();
  return <Navigate to={SERVICE_DASHBOARD[activeService] || '/dashboard'} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<DefaultRedirect />} />

            {/* WhatsApp Routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="whatsapp" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller', 'user']}><WhatsappAccounts /></PrivateRoute>
            } />
            <Route path="inbox" element={<Inbox />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="groups" element={<ContactGroups />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="templates" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><Templates /></PrivateRoute>
            } />
            <Route path="users" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><Users /></PrivateRoute>
            } />
            <Route path="companies" element={
              <PrivateRoute roles={['super_admin']}><Companies /></PrivateRoute>
            } />
            <Route path="recharge" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><Recharge /></PrivateRoute>
            } />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<WhatsappReports />} />
            <Route path="api-keys" element={<WhatsappApiKeys />} />

            {/* SMS Routes */}
            <Route path="sms/dashboard" element={<SmsDashboard />} />
            <Route path="sms/send" element={<SmsSendSms />} />
            <Route path="sms/campaigns" element={<SmsCampaigns />} />
            <Route path="sms/templates" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><SmsTemplates /></PrivateRoute>
            } />
            <Route path="sms/sender-ids" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><SmsSenderIds /></PrivateRoute>
            } />
            <Route path="sms/routes" element={
              <PrivateRoute roles={['super_admin', 'admin']}><SmsRoutes /></PrivateRoute>
            } />
            <Route path="sms/contacts" element={<SmsContacts />} />
            <Route path="sms/groups" element={<SmsGroups />} />
            <Route path="sms/users" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><SmsUsers /></PrivateRoute>
            } />
            <Route path="sms/companies" element={
              <PrivateRoute roles={['super_admin']}><SmsCompanies /></PrivateRoute>
            } />
            <Route path="sms/recharge" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><SmsRecharge /></PrivateRoute>
            } />
            <Route path="sms/transactions" element={<SmsTransactions />} />
            <Route path="sms/api-keys" element={<SmsApiKeys />} />
            <Route path="sms/reports" element={<SmsReports />} />

            {/* BulkMail Routes */}
            <Route path="bulkmail/dashboard" element={<BmDashboard />} />
            <Route path="bulkmail/send" element={<BmSendEmail />} />
            <Route path="bulkmail/campaigns" element={<BmCampaigns />} />
            <Route path="bulkmail/templates" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><BmTemplates /></PrivateRoute>
            } />
            <Route path="bulkmail/senders" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><BmSenders /></PrivateRoute>
            } />
            <Route path="bulkmail/smtp" element={
              <PrivateRoute roles={['super_admin', 'admin']}><BmSmtp /></PrivateRoute>
            } />
            <Route path="bulkmail/contacts" element={<BmContacts />} />
            <Route path="bulkmail/contact-groups" element={<BmContactGroups />} />
            <Route path="bulkmail/users" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><BmUsers /></PrivateRoute>
            } />
            <Route path="bulkmail/companies" element={
              <PrivateRoute roles={['super_admin']}><BmCompanies /></PrivateRoute>
            } />
            <Route path="bulkmail/recharge" element={
              <PrivateRoute roles={['super_admin', 'admin', 'reseller']}><BmRecharge /></PrivateRoute>
            } />
            <Route path="bulkmail/transactions" element={<BmTransactions />} />
            <Route path="bulkmail/plans" element={
              <PrivateRoute roles={['super_admin', 'admin']}><BmPlans /></PrivateRoute>
            } />
            <Route path="bulkmail/api-keys" element={<BmApiKeys />} />
            <Route path="bulkmail/reports" element={<BmReports />} />
          </Route>

          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
