const { BmSmtp, BmUser } = require('../../models/bulkmail');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };
    const servers = await BmSmtp.findAll({ where: { companyId } });
    res.json({ servers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const server = await BmSmtp.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: 'SMTP server not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(server.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ server });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, host, port, username, password, secure, maxPerHour } = req.body;
    if (!host || !username || !password) {
      return res.status(400).json({ error: 'Host, username and password are required' });
    }

    const server = await BmSmtp.create({
      companyId, name: name || host, host, port: port || 587,
      username, password, secure: secure || 'tls',
      maxPerHour: maxPerHour || 100,
    });
    res.status(201).json({ server });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const server = await BmSmtp.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: 'SMTP server not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(server.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, host, port, username, password, secure, maxPerHour, isActive } = req.body;
    await server.update({
      ...(name && { name }),
      ...(host && { host }),
      ...(port && { port }),
      ...(username && { username }),
      ...(password && { password }),
      ...(secure && { secure }),
      ...(maxPerHour !== undefined && { maxPerHour }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ server });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.test = async (req, res) => {
  try {
    const server = await BmSmtp.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: 'SMTP server not found' });

    const transporter = nodemailer.createTransport({
      host: server.host,
      port: server.port,
      secure: server.secure === 'ssl',
      auth: { user: server.username, pass: server.password },
      ...(server.secure === 'tls' && { tls: { rejectUnauthorized: false } }),
    });

    await transporter.verify();
    res.json({ message: 'SMTP connection successful' });
  } catch (err) {
    res.status(400).json({ error: `SMTP test failed: ${err.message}` });
  }
};

exports.remove = async (req, res) => {
  try {
    const server = await BmSmtp.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: 'SMTP server not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(server.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await server.destroy();
    res.json({ message: 'SMTP server deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
