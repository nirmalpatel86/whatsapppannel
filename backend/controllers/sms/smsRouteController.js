const { SmsRoute } = require('../../models/sms');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.routeType) where.routeType = req.query.routeType;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const routes = await SmsRoute.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const route = await SmsRoute.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, routeType, smscId, apiUrl, apiUsername, apiPassword, dlrUrl, costPerSms } = req.body;
    if (!name || !routeType) {
      return res.status(400).json({ error: 'Name and route type are required' });
    }
    const route = await SmsRoute.create({
      name, routeType, smscId, apiUrl, apiUsername, apiPassword, dlrUrl,
      costPerSms: costPerSms || 0,
    });
    res.status(201).json({ route });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const route = await SmsRoute.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    const { name, routeType, smscId, apiUrl, apiUsername, apiPassword, dlrUrl, costPerSms, isActive } = req.body;
    await route.update({
      ...(name && { name }),
      ...(routeType && { routeType }),
      ...(smscId !== undefined && { smscId }),
      ...(apiUrl !== undefined && { apiUrl }),
      ...(apiUsername !== undefined && { apiUsername }),
      ...(apiPassword !== undefined && { apiPassword }),
      ...(dlrUrl !== undefined && { dlrUrl }),
      ...(costPerSms !== undefined && { costPerSms }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const route = await SmsRoute.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    await route.destroy();
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
