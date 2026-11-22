const jwt = require('jsonwebtoken');
const { SmsUser, SmsCompany } = require('../models/sms');

const smsAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.service !== 'sms') {
      return res.status(401).json({ error: 'Invalid service token' });
    }
    const user = await SmsUser.findByPk(decoded.id, {
      include: [{ model: SmsCompany }],
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const smsAuthorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const smsCompanyAccess = async (req, res, next) => {
  if (req.user.role === 'super_admin') {
    return next();
  }
  if (!req.user.companyId) {
    return res.status(403).json({ error: 'No company assigned' });
  }
  req.companyId = req.user.companyId;
  next();
};

module.exports = { smsAuthenticate, smsAuthorize, smsCompanyAccess };
