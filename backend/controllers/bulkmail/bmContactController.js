const { BmContact, BmContactGroup, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { parse } = require('csv-parse/sync');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const { search, groupId, page = 1, limit = 50 } = req.query;
    const companyId = req.user.role === 'super_admin'
      ? (req.query.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };

    const where = { companyId };
    if (groupId) where.groupId = groupId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const contacts = await BmContact.findAndCountAll({
      where,
      include: [{ model: BmContactGroup, attributes: ['id', 'name'] }],
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
    const contact = await BmContact.findByPk(req.params.id, {
      include: [{ model: BmContactGroup }],
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
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

    const { name, email, phone, groupId, companyName, profession, col1, col2, col3, col4, col5 } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const contact = await BmContact.create({
      companyId, groupId: groupId || null, name: name || email, email, phone,
      companyName, profession, col1, col2, col3, col4, col5,
    });

    if (groupId) {
      await BmContactGroup.increment('contactCount', { where: { id: groupId } });
    }

    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const contact = await BmContact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(contact.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, email, phone, groupId, companyName, profession, col1, col2, col3, col4, col5, isSubscribed, isActive } = req.body;
    await contact.update({
      ...(name !== undefined && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(groupId !== undefined && { groupId }),
      ...(companyName !== undefined && { companyName }),
      ...(profession !== undefined && { profession }),
      ...(col1 !== undefined && { col1 }),
      ...(col2 !== undefined && { col2 }),
      ...(col3 !== undefined && { col3 }),
      ...(col4 !== undefined && { col4 }),
      ...(col5 !== undefined && { col5 }),
      ...(isSubscribed !== undefined && { isSubscribed }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ contact });
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

    const groupId = req.body.groupId || null;

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true, skip_empty_lines: true, trim: true, bom: true,
    });

    if (!records.length) return res.status(400).json({ error: 'CSV file is empty' });

    const results = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const email = row['Email'] || row['email'] || '';
        if (!email) {
          results.errors.push({ row: i + 2, reason: 'Missing email' });
          results.skipped++;
          continue;
        }

        await BmContact.create({
          companyId, groupId,
          name: row['Name'] || row['name'] || email,
          email,
          phone: row['Phone'] || row['phone'] || null,
          companyName: row['Company'] || row['company_name'] || null,
          profession: row['Profession'] || row['profession'] || null,
          col1: row['Col1'] || row['col_1'] || null,
          col2: row['Col2'] || row['col_2'] || null,
          col3: row['Col3'] || row['col_3'] || null,
          col4: row['Col4'] || row['col_4'] || null,
          col5: row['Col5'] || row['col_5'] || null,
        });
        results.imported++;
      } catch (rowErr) {
        results.errors.push({ row: i + 2, reason: rowErr.message });
        results.skipped++;
      }
    }

    if (groupId && results.imported > 0) {
      await BmContactGroup.increment('contactCount', { by: results.imported, where: { id: groupId } });
    }

    res.json({
      message: `Imported ${results.imported} contacts, ${results.skipped} skipped`,
      ...results, total: records.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const contact = await BmContact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(contact.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const groupId = contact.groupId;
    await contact.destroy();
    if (groupId) {
      await BmContactGroup.decrement('contactCount', { where: { id: groupId } });
    }
    res.json({ message: 'Contact deleted' });
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
      : { [Op.in]: await getVisibleCompanyIds(BmUser, req.user) };

    const deleted = await BmContact.destroy({
      where: { id: { [Op.in]: ids }, companyId: companyFilter },
    });

    res.json({ message: `${deleted} contacts deleted`, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
