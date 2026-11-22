const jwt = require('jsonwebtoken');
const { BmUser, BmCompany } = require('../models/bulkmail');

const bmAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.service !== 'bulkmail') {
      return res.status(401).json({ error: 'Invalid service token' });
    }
    const user = await BmUser.findByPk(decoded.id, {
      include: [{ model: BmCompany }],
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

const bmAuthorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const bmCompanyAccess = async (req, res, next) => {
  if (req.user.role === 'super_admin') {
    return next();
  }
  if (!req.user.companyId) {
    return res.status(403).json({ error: 'No company assigned' });
  }
  req.companyId = req.user.companyId;
  next();
};

module.exports = { bmAuthenticate, bmAuthorize, bmCompanyAccess };
