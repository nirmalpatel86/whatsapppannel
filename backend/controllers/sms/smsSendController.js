const { SmsWallet, SmsTransaction } = require('../../models/sms');
const http = require('http');
const https = require('https');

function calculateSmsCount(text, isUnicode) {
  let len = text.length;
  const newlineCount = (text.match(/\n/g) || []).length;
  len -= newlineCount;

  if (isUnicode) {
    if (len < 71) return 1;
    if (len < 135) return 2;
    if (len < 202) return 3;
    if (len < 269) return 4;
    if (len < 336) return 5;
    if (len < 403) return 6;
    if (len < 470) return 7;
    if (len < 537) return 8;
    return 8 + Math.ceil((len - 536) / 63);
  }

  if (len < 161) return 1;
  if (len < 307) return 2;
  if (len < 460) return 3;
  if (len < 613) return 4;
  if (len < 766) return 5;
  if (len < 919) return 6;
  if (len < 1072) return 7;
  if (len < 1225) return 8;
  if (len < 1378) return 9;
  return 9 + Math.ceil((len - 1377) / 153);
}

function sendHttpSms(apiUrl, params) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(apiUrl);
    const searchParams = new URLSearchParams(parsed.search);
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
    parsed.search = searchParams.toString();

    const protocol = parsed.protocol === 'https:' ? https : http;
    protocol.get(parsed.toString(), (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

exports.sendMessage = async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'to and message are required' });
    }

    const apiKeyRecord = req.apiKeyRecord;
    const route = apiKeyRecord.SmsRoute;
    if (!route || !route.apiUrl) {
      return res.status(400).json({ success: false, error: 'No SMS route configured for this API key' });
    }

    const isUnicode = /[^\u0000-\u007F]/.test(message);
    const smsCount = calculateSmsCount(message, isUnicode);
    const costPerSms = parseFloat(route.costPerSms) || 0;
    const cost = smsCount * costPerSms;

    const wallet = await SmsWallet.findOne({ where: { userId: apiKeyRecord.userId } });
    if (!wallet || wallet.balance < cost) {
      return res.status(402).json({ success: false, error: 'Insufficient balance', balance: wallet?.balance || 0 });
    }

    const params = {
      to,
      text: message,
      from: apiKeyRecord.SmsSenderId ? apiKeyRecord.SmsSenderId.senderId : '',
    };

    const response = await sendHttpSms(route.apiUrl, params);

    const newBalance = wallet.balance - cost;
    await wallet.update({ balance: newBalance, totalSpent: parseFloat(wallet.totalSpent) + cost });
    await SmsTransaction.create({
      walletId: wallet.id,
      userId: apiKeyRecord.userId,
      type: 'deduction',
      amount: cost,
      balanceAfter: newBalance,
      description: `API send to ${to}`,
      smsCount,
      routeId: route.id,
    });
    await apiKeyRecord.update({ lastUsedAt: new Date() });

    res.json({
      success: true,
      message: 'SMS sent successfully',
      to,
      smsCount,
      cost: cost.toFixed(4),
      balance: newBalance,
      providerResponse: response,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
