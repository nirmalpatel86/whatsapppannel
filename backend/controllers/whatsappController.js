const { WhatsappAccount, Company, User } = require('../models');
const sessionManager = require('../whatsapp/sessionManager');
const QRCode = require('qrcode');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.listAccounts = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'super_admin') {
      where.companyId = req.query.companyId || req.user.companyId;
    } else if (req.user.role === 'admin' || req.user.role === 'reseller') {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(User, req.user) };
    } else {
      where.createdBy = req.user.id;
    }

    const accounts = await WhatsappAccount.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const userLimit = req.user.maxWhatsappAccounts || 1;
    const existingCount = await WhatsappAccount.count({ where: { createdBy: req.user.id } });

    if (existingCount >= userLimit) {
      return res.status(400).json({ error: `Maximum WhatsApp accounts reached (${userLimit})` });
    }

    const account = await WhatsappAccount.create({
      companyId,
      createdBy: req.user.id,
      name: req.body.name || 'WhatsApp Account',
      provider: 'baileys',
    });
    res.status(201).json({ account });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.connectAccount = async (req, res) => {
  try {
    const account = await WhatsappAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (req.user.role === 'user' && account.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'user') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(account.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await account.update({ status: 'connecting' });
    await sessionManager.createSession(account.id);
    res.json({ message: 'Connection initiated. Watch for QR code via WebSocket.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disconnectAccount = async (req, res) => {
  try {
    const account = await WhatsappAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (req.user.role === 'user' && account.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'user') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(account.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await sessionManager.disconnectSession(account.id);
    await account.update({ status: 'disconnected' });
    res.json({ message: 'Disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const account = await WhatsappAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ status: account.status, phone: account.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const account = await WhatsappAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (req.user.role === 'user' && account.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'user') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(account.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (sessionManager.isConnected(account.id)) {
      await sessionManager.disconnectSession(account.id);
    }
    await account.destroy();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
