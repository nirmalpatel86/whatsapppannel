const { SmsContact, SmsBlocklist, SmsUser } = require('../../models/sms');
const { Op } = require('sequelize');
const { parse } = require('csv-parse/sync');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };

    const where = { companyId };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const contacts = await SmsContact.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      contacts: contacts.rows,
      total: contacts.count,
      page: parseInt(page),
      totalPages: Math.ceil(contacts.count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const contact = await SmsContact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(contact.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { name, phone, email, state, city, address, isDnd } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const existing = await SmsContact.findOne({ where: { companyId, phone } });
    if (existing) return res.status(409).json({ error: 'Contact with this phone already exists', contact: existing });

    const contact = await SmsContact.create({
      companyId, phone, name: name || phone, email, state, city, address,
      isDnd: isDnd || false,
    });
    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const contact = await SmsContact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(contact.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { name, email, state, city, address, tags, isBlocked, isDnd } = req.body;
    await contact.update({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(state !== undefined && { state }),
      ...(city !== undefined && { city }),
      ...(address !== undefined && { address }),
      ...(tags !== undefined && { tags }),
      ...(isBlocked !== undefined && { isBlocked }),
      ...(isDnd !== undefined && { isDnd }),
    });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const contact = await SmsContact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(contact.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await contact.destroy();
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true, skip_empty_lines: true, trim: true, bom: true,
    });

    if (!records.length) return res.status(400).json({ error: 'CSV file is empty' });

    const results = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const phone = (row['Mobile'] || row['Phone'] || row['phone'] || row['mobile'] || '').replace(/\D/g, '');
        if (!phone) {
          results.errors.push({ row: i + 2, reason: 'Missing phone number' });
          results.skipped++;
          continue;
        }

        const existing = await SmsContact.findOne({ where: { companyId, phone } });
        if (existing) {
          results.skipped++;
          continue;
        }

        await SmsContact.create({
          companyId, phone,
          name: row['Name'] || row['name'] || phone,
          email: row['Email'] || row['email'] || null,
          state: row['State'] || row['state'] || null,
          city: row['City'] || row['city'] || null,
        });
        results.imported++;
      } catch (rowErr) {
        results.errors.push({ row: i + 2, reason: rowErr.message });
        results.skipped++;
      }
    }

    res.json({
      message: `Imported ${results.imported} contacts, ${results.skipped} skipped`,
      ...results, total: records.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No contact IDs provided' });

    const companyFilter = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };

    const deleted = await SmsContact.destroy({
      where: { id: { [Op.in]: ids }, companyId: companyFilter },
    });
    res.json({ message: `${deleted} contacts deleted`, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Blocklist
exports.getBlocklist = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(SmsUser, req.user) };

    const blocklist = await SmsBlocklist.findAll({ where: { companyId }, order: [['createdAt', 'DESC']] });
    res.json({ blocklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToBlocklist = async (req, res) => {
  try {
    const companyId = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : req.user.companyId;

    const { phone, reason } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const [record, created] = await SmsBlocklist.findOrCreate({
      where: { companyId, phone },
      defaults: { reason },
    });

    if (!created) return res.status(409).json({ error: 'Phone already in blocklist' });
    res.status(201).json({ blocklist: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromBlocklist = async (req, res) => {
  try {
    const record = await SmsBlocklist.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Blocklist entry not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(SmsUser, req.user);
      if (!visibleCompanyIds.includes(record.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await record.destroy();
    res.json({ message: 'Removed from blocklist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
