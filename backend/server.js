require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const { sequelize, User, Company, Wallet } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sessionManager = require('./whatsapp/sessionManager');

// SMS and BulkMail models
const { smsSequelize, SmsUser, SmsCompany, SmsWallet } = require('./models/sms');
const { bulkmailSequelize, BmUser, BmCompany, BmWallet } = require('./models/bulkmail');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WhatsApp Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/whatsapp/api-keys', require('./routes/whatsappApiKeys'));
app.use('/api/whatsapp/send-message', require('./routes/whatsappSend'));
app.use('/api/whatsapp/get-balance', require('./routes/whatsappBalance'));
app.use('/api/whatsapp/reports', require('./routes/whatsappReports'));

// SMS Routes
app.use('/api/sms/auth', require('./routes/sms/auth'));
app.use('/api/sms/users', require('./routes/sms/users'));
app.use('/api/sms/companies', require('./routes/sms/companies'));
app.use('/api/sms/routes', require('./routes/sms/routes'));
app.use('/api/sms/sender-ids', require('./routes/sms/senderIds'));
app.use('/api/sms/templates', require('./routes/sms/templates'));
app.use('/api/sms/campaigns', require('./routes/sms/campaigns'));
app.use('/api/sms/contacts', require('./routes/sms/contacts'));
app.use('/api/sms/groups', require('./routes/sms/groups'));
app.use('/api/sms/wallet', require('./routes/sms/wallet'));
app.use('/api/sms/transactions', require('./routes/sms/transactions'));
app.use('/api/sms/api-keys', require('./routes/sms/apiKeys'));
app.use('/api/sms/send-message', require('./routes/sms/send'));

// BulkMail Routes
app.use('/api/bulkmail/auth', require('./routes/bulkmail/auth'));
app.use('/api/bulkmail/users', require('./routes/bulkmail/users'));
app.use('/api/bulkmail/companies', require('./routes/bulkmail/companies'));
app.use('/api/bulkmail/smtp', require('./routes/bulkmail/smtp'));
app.use('/api/bulkmail/senders', require('./routes/bulkmail/senders'));
app.use('/api/bulkmail/sender-groups', require('./routes/bulkmail/senderGroups'));
app.use('/api/bulkmail/templates', require('./routes/bulkmail/templates'));
app.use('/api/bulkmail/campaigns', require('./routes/bulkmail/campaigns'));
app.use('/api/bulkmail/contacts', require('./routes/bulkmail/contacts'));
app.use('/api/bulkmail/contact-groups', require('./routes/bulkmail/contactGroups'));
app.use('/api/bulkmail/wallet', require('./routes/bulkmail/wallet'));
app.use('/api/bulkmail/transactions', require('./routes/bulkmail/transactions'));
app.use('/api/bulkmail/plans', require('./routes/bulkmail/plans'));
app.use('/api/bulkmail/api-keys', require('./routes/bulkmail/apiKeys'));
app.use('/api/bulkmail/send-email', require('./routes/bulkmail/send'));

// WhatsApp Stats endpoint
const { authenticate } = require('./middleware/auth');
const { WhatsappAccount: WA, Contact: ContactModel, Chat: ChatModel, Campaign: CampaignModel, Message: MessageModel, Wallet: WalletModel } = require('./models');

app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const companyId = req.user.companyId;

    let accountFilter, chatFilter, contactFilter, campaignFilter, messageFilter;

    if (role === 'super_admin') {
      accountFilter = { companyId };
      chatFilter = { companyId };
      contactFilter = { companyId };
      campaignFilter = { companyId };
      messageFilter = { companyId };
    } else if (role === 'reseller') {
      accountFilter = { companyId };
      chatFilter = { companyId };
      contactFilter = { companyId };
      campaignFilter = { companyId };
      messageFilter = { companyId };
    } else {
      const userAccountIds = (await WA.findAll({ where: { createdBy: userId }, attributes: ['id'], raw: true })).map(a => a.id);
      accountFilter = { createdBy: userId };
      chatFilter = { whatsappAccountId: { [require('sequelize').Op.in]: userAccountIds } };
      contactFilter = { companyId, id: { [require('sequelize').Op.in]: require('sequelize').literal(`(SELECT DISTINCT contactId FROM Chats WHERE whatsappAccountId IN (${userAccountIds.length ? userAccountIds.join(',') : 0}))`) } };
      campaignFilter = { createdBy: userId };
      messageFilter = { whatsappAccountId: { [require('sequelize').Op.in]: userAccountIds } };
    }

    const [accounts, chats, contacts, campaigns, wallet, msgStats] = await Promise.all([
      WA.count({ where: accountFilter }),
      ChatModel.count({ where: chatFilter }),
      ContactModel.count({ where: contactFilter }),
      CampaignModel.count({ where: campaignFilter }),
      WalletModel.findOne({ where: { userId } }),
      MessageModel.findAll({
        where: messageFilter,
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
          [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
          [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
          [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'read' THEN 1 ELSE 0 END")), 'readCount'],
          [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
          [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END")), 'inbound'],
          [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END")), 'outbound'],
        ],
        raw: true,
      }),
    ]);

    const stats = msgStats[0] || {};

    res.json({
      accounts,
      chats,
      contacts,
      campaigns,
      balance: wallet?.balance || 0,
      messages: {
        total: parseInt(stats.total) || 0,
        sent: parseInt(stats.sent) || 0,
        delivered: parseInt(stats.delivered) || 0,
        read: parseInt(stats.readCount) || 0,
        failed: parseInt(stats.failed) || 0,
        inbound: parseInt(stats.inbound) || 0,
        outbound: parseInt(stats.outbound) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SMS Stats endpoint
const { smsAuthenticate } = require('./middleware/smsAuth');
const { SmsCampaign, SmsCampaignMessage, SmsContact, SmsTemplate } = require('./models/sms');

app.get('/api/sms/stats', smsAuthenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    const role = req.user.role;

    const companyFilter = (role === 'super_admin' || role === 'reseller') ? { companyId } : { createdBy: userId };
    const contactFilter = { companyId };

    const [campaigns, contacts, templates, wallet, msgStats] = await Promise.all([
      SmsCampaign.count({ where: companyFilter }),
      SmsContact.count({ where: contactFilter }),
      SmsTemplate.count({ where: { companyId } }),
      SmsWallet.findOne({ where: { userId } }),
      SmsCampaignMessage.findAll({
        attributes: [
          [smsSequelize.fn('COUNT', smsSequelize.col('id')), 'total'],
          [smsSequelize.fn('SUM', smsSequelize.literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
          [smsSequelize.fn('SUM', smsSequelize.literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
          [smsSequelize.fn('SUM', smsSequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
          [smsSequelize.fn('SUM', smsSequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        ],
        raw: true,
      }),
    ]);

    const stats = msgStats[0] || {};
    res.json({
      campaigns,
      contacts,
      templates,
      balance: wallet?.balance || 0,
      messages: {
        total: parseInt(stats.total) || 0,
        sent: parseInt(stats.sent) || 0,
        delivered: parseInt(stats.delivered) || 0,
        failed: parseInt(stats.failed) || 0,
        pending: parseInt(stats.pending) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BulkMail Stats endpoint
const { bmAuthenticate } = require('./middleware/bmAuth');
const { BmCampaign, BmCampaignEmail, BmContact, BmTemplate, BmSender } = require('./models/bulkmail');

app.get('/api/bulkmail/stats', bmAuthenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    const role = req.user.role;

    const companyFilter = (role === 'super_admin' || role === 'reseller') ? { companyId } : { createdBy: userId };
    const contactFilter = { companyId };

    const [campaigns, contacts, templates, senders, wallet, emailStats] = await Promise.all([
      BmCampaign.count({ where: companyFilter }),
      BmContact.count({ where: contactFilter }),
      BmTemplate.count({ where: { companyId } }),
      BmSender.count({ where: { companyId } }),
      BmWallet.findOne({ where: { userId } }),
      BmCampaignEmail.findAll({
        attributes: [
          [bulkmailSequelize.fn('COUNT', bulkmailSequelize.col('id')), 'total'],
          [bulkmailSequelize.fn('SUM', bulkmailSequelize.literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
          [bulkmailSequelize.fn('SUM', bulkmailSequelize.literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
          [bulkmailSequelize.fn('SUM', bulkmailSequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
          [bulkmailSequelize.fn('SUM', bulkmailSequelize.literal("CASE WHEN status = 'bounced' THEN 1 ELSE 0 END")), 'bounced'],
          [bulkmailSequelize.fn('SUM', bulkmailSequelize.literal("CASE WHEN isOpened = 1 THEN 1 ELSE 0 END")), 'opened'],
          [bulkmailSequelize.fn('SUM', bulkmailSequelize.literal("CASE WHEN isLinkClicked = 1 THEN 1 ELSE 0 END")), 'clicked'],
        ],
        raw: true,
      }),
    ]);

    const stats = emailStats[0] || {};
    res.json({
      campaigns,
      contacts,
      templates,
      senders,
      balance: wallet?.balance || 0,
      emails: {
        total: parseInt(stats.total) || 0,
        sent: parseInt(stats.sent) || 0,
        delivered: parseInt(stats.delivered) || 0,
        failed: parseInt(stats.failed) || 0,
        bounced: parseInt(stats.bounced) || 0,
        opened: parseInt(stats.opened) || 0,
        clicked: parseInt(stats.clicked) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.IO auth and room joining
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return next(new Error('Invalid user'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  if (user.companyId) {
    socket.join(`company_${user.companyId}`);
  }
  if (user.role === 'super_admin') {
    socket.join('super_admin');
  }
  socket.on('disconnect', () => {});
});

sessionManager.setIO(io);

// Campaign scheduler
const cron = require('node-cron');
const { Campaign } = require('./models');
const { Op } = require('sequelize');
const { cleanupOldUploads } = require('./utils/cleanupUploads');

// Delete WhatsApp chat/campaign media older than UPLOAD_RETENTION_DAYS (default 30) —
// runs once on boot, then daily at 3 AM, so the uploads folder doesn't grow forever.
cleanupOldUploads();
cron.schedule('0 3 * * *', cleanupOldUploads);

cron.schedule('* * * * *', async () => {
  const now = new Date();
  // WhatsApp campaigns
  const waCampaigns = await Campaign.findAll({
    where: { status: 'scheduled', scheduledAt: { [Op.lte]: now } },
  });
  for (const campaign of waCampaigns) {
    await campaign.update({ status: 'running', startedAt: new Date() });
  }

  // SMS campaigns
  const smsCampaigns = await SmsCampaign.findAll({
    where: { status: 'scheduled', scheduledAt: { [Op.lte]: now } },
  });
  for (const campaign of smsCampaigns) {
    await campaign.update({ status: 'running', startedAt: new Date() });
  }

  // BulkMail campaigns
  const bmCampaigns = await BmCampaign.findAll({
    where: { status: 'scheduled', scheduledAt: { [Op.lte]: now } },
  });
  for (const campaign of bmCampaigns) {
    await campaign.update({ status: 'running', startedAt: new Date() });
  }
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Connect all databases
    await sequelize.authenticate();
    console.log('WhatsApp database connected');

    await smsSequelize.authenticate();
    console.log('SMS database connected');

    await bulkmailSequelize.authenticate();
    console.log('BulkMail database connected');

    // Sync all databases
    await sequelize.sync({ alter: true });
    console.log('WhatsApp database synced');

    await smsSequelize.sync({ alter: true });
    console.log('SMS database synced');

    await bulkmailSequelize.sync({ alter: true });
    console.log('BulkMail database synced');

    // Create default WhatsApp super admin if not exists
    const waAdminExists = await User.findOne({ where: { role: 'super_admin' } });
    if (!waAdminExists) {
      const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@admin.com',
        phone: '9999999999',
        password: 'admin123',
        role: 'super_admin',
      });
      const company = await Company.create({ name: 'Admin Company', ownerId: admin.id });
      await admin.update({ companyId: company.id });
      await Wallet.create({ userId: admin.id, balance: 0 });
      console.log('WhatsApp default super admin created: 9999999999 / admin123');
    }

    // Create default SMS super admin if not exists
    const smsAdminExists = await SmsUser.findOne({ where: { role: 'super_admin' } });
    if (!smsAdminExists) {
      const admin = await SmsUser.create({
        name: 'Super Admin',
        phone: '9999999999',
        password: 'admin123',
        role: 'super_admin',
      });
      const company = await SmsCompany.create({ name: 'Admin Company', ownerId: admin.id });
      await admin.update({ companyId: company.id });
      await SmsWallet.create({ userId: admin.id, balance: 0 });
      console.log('SMS default super admin created: 9999999999 / admin123');
    }

    // Create default BulkMail super admin if not exists
    const bmAdminExists = await BmUser.findOne({ where: { role: 'super_admin' } });
    if (!bmAdminExists) {
      const admin = await BmUser.create({
        name: 'Super Admin',
        phone: '9999999999',
        password: 'admin123',
        role: 'super_admin',
      });
      const company = await BmCompany.create({ name: 'Admin Company', ownerId: admin.id });
      await admin.update({ companyId: company.id });
      await BmWallet.create({ userId: admin.id, balance: 0 });
      console.log('BulkMail default super admin created: 9999999999 / admin123');
    }

    // Ensure all WhatsApp users have wallets
    const usersWithoutWallet = await User.findAll({
      include: [{ model: Wallet, required: false }],
      where: { '$Wallet.id$': null },
    });
    for (const u of usersWithoutWallet) {
      await Wallet.create({ userId: u.id, balance: 0 });
    }

    // Ensure all SMS users have wallets
    const smsUsersNoWallet = await SmsUser.findAll({
      include: [{ model: SmsWallet, required: false }],
      where: { '$SmsWallet.id$': null },
    });
    for (const u of smsUsersNoWallet) {
      await SmsWallet.create({ userId: u.id, balance: 0 });
    }

    // Ensure all BulkMail users have wallets
    const bmUsersNoWallet = await BmUser.findAll({
      include: [{ model: BmWallet, required: false }],
      where: { '$BmWallet.id$': null },
    });
    for (const u of bmUsersNoWallet) {
      await BmWallet.create({ userId: u.id, balance: 0 });
    }

    // Restore WhatsApp sessions
    await sessionManager.restoreSessions();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
