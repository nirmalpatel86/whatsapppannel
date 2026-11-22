const { Contact, Chat, Message, WhatsappAccount, User } = require('../models');
const { Op } = require('sequelize');
const { parse } = require('csv-parse/sync');
const { getVisibleCompanyIds } = require('../utils/scopeHelper');

exports.list = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const where = {};

    if (req.user.role === 'super_admin') {
      where.companyId = req.query.companyId || req.user.companyId;
    } else if (req.user.role === 'admin' || req.user.role === 'reseller') {
      where.companyId = { [Op.in]: await getVisibleCompanyIds(User, req.user) };
    } else {
      const userAccountIds = (await WhatsappAccount.findAll({ where: { createdBy: req.user.id }, attributes: ['id'], raw: true })).map(a => a.id);
      const contactIds = (await Chat.findAll({ where: { whatsappAccountId: { [Op.in]: userAccountIds } }, attributes: ['contactId'], raw: true, group: ['contactId'] })).map(c => c.contactId);
      where.id = { [Op.in]: contactIds };
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { pushName: { [Op.like]: `%${search}%` } },
      ];
    }

    const contacts = await Contact.findAndCountAll({
      where,
      order: [['lastMessageAt', 'DESC']],
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
    const contact = await Contact.findByPk(req.params.id, {
      include: [{ model: Chat }],
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
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

    const { firstName, lastName, phone, alternateMobile, email, profession, contactType, dateOfBirth, anniversary, state, city, address } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const name = [firstName, lastName].filter(Boolean).join(' ') || req.body.name || phone;

    const existing = await Contact.findOne({ where: { companyId, phone } });
    if (existing) return res.status(409).json({ error: 'Contact with this phone already exists', contact: existing });

    const contact = await Contact.create({
      companyId, phone, name, firstName, lastName, alternateMobile, email,
      profession, contactType, dateOfBirth: dateOfBirth || null, anniversary: anniversary || null,
      state, city, address,
    });

    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
      if (!visibleCompanyIds.includes(contact.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const { name, firstName, lastName, alternateMobile, email, profession, contactType, dateOfBirth, anniversary, state, city, address, tags, isBlocked } = req.body;
    const updates = {};
    if (firstName !== undefined) { updates.firstName = firstName; updates.name = [firstName, lastName || contact.lastName].filter(Boolean).join(' '); }
    if (lastName !== undefined) { updates.lastName = lastName; updates.name = [firstName || contact.firstName, lastName].filter(Boolean).join(' '); }
    if (name && !firstName && !lastName) updates.name = name;
    if (alternateMobile !== undefined) updates.alternateMobile = alternateMobile;
    if (email !== undefined) updates.email = email;
    if (profession !== undefined) updates.profession = profession;
    if (contactType !== undefined) updates.contactType = contactType;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (anniversary !== undefined) updates.anniversary = anniversary || null;
    if (state !== undefined) updates.state = state;
    if (city !== undefined) updates.city = city;
    if (address !== undefined) updates.address = address;
    if (tags) updates.tags = tags;
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;
    await contact.update(updates);
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

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
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

        const existing = await Contact.findOne({ where: { companyId, phone } });
        if (existing) {
          results.errors.push({ row: i + 2, reason: `Phone ${phone} already exists` });
          results.skipped++;
          continue;
        }

        const firstName = row['First Name'] || row['firstName'] || '';
        const lastName = row['Last Name'] || row['lastName'] || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || phone;

        await Contact.create({
          companyId, phone, name, firstName, lastName,
          alternateMobile: row['Alternate Mobile'] || row['alternateMobile'] || null,
          email: row['Email'] || row['email'] || null,
          profession: row['Profession'] || row['profession'] || null,
          contactType: row['Contact Type'] || row['contactType'] || null,
          dateOfBirth: row['Date of Birth'] || row['dateOfBirth'] || null,
          anniversary: row['Anniversary'] || row['anniversary'] || null,
          state: row['State'] || row['state'] || null,
          city: row['City'] || row['city'] || null,
          address: row['Address'] || row['address'] || null,
        });
        results.imported++;
      } catch (rowErr) {
        results.errors.push({ row: i + 2, reason: rowErr.message });
        results.skipped++;
      }
    }

    res.json({
      message: `Imported ${results.imported} contacts, ${results.skipped} skipped`,
      ...results,
      total: records.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(User, req.user);
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

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No contact IDs provided' });

    const companyFilter = req.user.role === 'super_admin'
      ? (req.body.companyId || req.user.companyId)
      : { [Op.in]: await getVisibleCompanyIds(User, req.user) };

    const deleted = await Contact.destroy({
      where: { id: { [Op.in]: ids }, companyId: companyFilter },
    });

    res.json({ message: `${deleted} contacts deleted`, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
