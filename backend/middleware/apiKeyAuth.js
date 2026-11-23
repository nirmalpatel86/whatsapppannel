const { SmsApiKey, SmsSenderId, SmsRoute } = require('../models/sms');
const { BmApiKey, BmSender, BmSmtp } = require('../models/bulkmail');
const { WhatsappApiKey, WhatsappAccount, User } = require('../models');

const smsApiKeyAuth = async (req, res, next) => {
  try {
    const key = req.headers['x-api-key'] || req.body.api_key || req.query.api_key;
    if (!key) return res.status(401).json({ success: false, error: 'API key is required' });

    const apiKeyRecord = await SmsApiKey.findOne({
      where: { apiKey: key },
      include: [{ model: SmsSenderId }, { model: SmsRoute }],
    });
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    }

    req.apiKeyRecord = apiKeyRecord;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const bmApiKeyAuth = async (req, res, next) => {
  try {
    const key = req.headers['x-api-key'] || req.body.api_key || req.query.api_key;
    if (!key) return res.status(401).json({ success: false, error: 'API key is required' });

    const apiKeyRecord = await BmApiKey.findOne({
      where: { apiKey: key },
      include: [{ model: BmSender, include: [{ model: BmSmtp }] }],
    });
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    }

    req.apiKeyRecord = apiKeyRecord;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const waApiKeyAuth = async (req, res, next) => {
  try {
    const key = req.headers['x-api-key'] || req.body.api_key || req.query.api_key;
    if (!key) return res.status(401).json({ success: false, error: 'API key is required' });

    const apiKeyRecord = await WhatsappApiKey.findOne({
      where: { apiKey: key },
      include: [{ model: WhatsappAccount }, { model: User, attributes: ['id', 'countryCode'] }],
    });
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    }

    req.apiKeyRecord = apiKeyRecord;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { smsApiKeyAuth, bmApiKeyAuth, waApiKeyAuth };
