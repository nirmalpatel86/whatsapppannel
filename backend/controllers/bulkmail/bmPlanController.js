const { BmPlan } = require('../../models/bulkmail');

exports.list = async (req, res) => {
  try {
    const plans = await BmPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const plan = await BmPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, emailCount, validityDays, price, description } = req.body;
    if (!name || !emailCount || !validityDays || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const plan = await BmPlan.create({ name, emailCount, validityDays, price, description: description || null });
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const plan = await BmPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const { name, emailCount, validityDays, price, description, isActive } = req.body;
    await plan.update({
      ...(name && { name }),
      ...(emailCount && { emailCount }),
      ...(validityDays && { validityDays }),
      ...(price !== undefined && { price }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const plan = await BmPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    await plan.destroy();
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
