const { SmsTemplate, SmsSenderId, SmsRoute, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };

    const where = { companyId };
    if (req.query.templateType) where.templateType = req.query.templateType;
    if (req.query.status) where.status = req.query.status;

    const templates = await SmsTemplate.findAll({
      where,
      include: [
        { model: SmsSenderId, attributes: ['id', 'senderId'] },
        { model: SmsRoute, attributes: ['id', 'name', 'routeType'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const template = await SmsTemplate.findByPk(req.params.id, {
      include: [
        { model: SmsSenderId, attributes: ['id', 'senderId'] },
        { model: SmsRoute, attributes: ['id', 'name', 'routeType'] },
      ],
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, body, senderIdId, routeId, dltContentId, entityId, templateType, isUnicode } = req.body;
    if (!name || !body) return res.status(400).json({ error: 'Name and body are required' });

    const template = await SmsTemplate.create({
      companyId,
      createdBy: req.user.id,
      name, body, senderIdId: senderIdId || null, routeId: routeId || null,
      dltContentId: dltContentId || null, entityId: entityId || null,
      templateType: templateType || 'transactional',
      isUnicode: isUnicode || false,
      status: req.user.role === 'super_admin' ? 'approved' : 'pending',
    });
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await SmsTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, body, senderIdId, routeId, dltContentId, entityId, templateType, isUnicode, status } = req.body;
    await template.update({
      ...(name && { name }),
      ...(body && { body }),
      ...(senderIdId !== undefined && { senderIdId }),
      ...(routeId !== undefined && { routeId }),
      ...(dltContentId !== undefined && { dltContentId }),
      ...(entityId !== undefined && { entityId }),
      ...(templateType && { templateType }),
      ...(isUnicode !== undefined && { isUnicode }),
      ...(req.user.role === 'super_admin' && status && { status }),
    });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const template = await SmsTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(template.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
