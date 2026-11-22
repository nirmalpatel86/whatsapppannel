const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');

const generateToken = (user, service = 'whatsapp') => {
  return jwt.sign(
    { id: user.id, role: user.role, companyId: user.companyId, service },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, phone, password, companyName } = req.body;

    if (!phone || !password || !name) {
      return res.status(400).json({ error: 'Name, phone and password are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const existing = await User.findOne({ where: { phone: cleanPhone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const user = await User.create({ name, phone: cleanPhone, password, role: 'reseller' });
    const company = await Company.create({ name: companyName || `${name}'s Company`, ownerId: user.id });
    await user.update({ companyId: company.id });

    const token = generateToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '');

    const user = await User.findOne({
      where: { phone: cleanPhone },
      include: [{ model: Company }],
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    const token = generateToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};
