const { BmSender, BmSmtp, BmSenderGroup, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };
    const senders = await BmSender.findAll({
      where: { companyId },
      include: [
        { model: BmSmtp, attributes: ['id', 'name', 'host'] },
        { model: BmSenderGroup, attributes: ['id', 'name'] },
      ],
    });
    res.json({ senders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const sender = await BmSender.findByPk(req.params.id, {
      include: [{ model: BmSmtp }, { model: BmSenderGroup }],
    });
    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(sender.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ sender });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, email, replyName, replyEmail, smtpId, senderGroupId } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const sender = await BmSender.create({
      companyId, name, email,
      replyName: replyName || null, replyEmail: replyEmail || null,
      smtpId: smtpId || null, senderGroupId: senderGroupId || null,
    });
    res.status(201).json({ sender });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const sender = await BmSender.findByPk(req.params.id);
    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(sender.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, email, replyName, replyEmail, smtpId, senderGroupId, isActive } = req.body;
    await sender.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(replyName !== undefined && { replyName }),
      ...(replyEmail !== undefined && { replyEmail }),
      ...(smtpId !== undefined && { smtpId }),
      ...(senderGroupId !== undefined && { senderGroupId }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ sender });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const sender = await BmSender.findByPk(req.params.id);
    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(sender.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await sender.destroy();
    res.json({ message: 'Sender deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
