const { BmWallet, BmTransaction } = require('../../models/bulkmail');
const nodemailer = require('nodemailer');

const COST_PER_EMAIL = 0.10;

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ success: false, error: 'to, subject and message are required' });
    }

    const apiKeyRecord = req.apiKeyRecord;
    const sender = apiKeyRecord.BmSender;
    if (!sender || !sender.BmSmtp) {
      return res.status(400).json({ success: false, error: 'No sender/SMTP configured for this API key' });
    }

    const wallet = await BmWallet.findOne({ where: { userId: apiKeyRecord.userId } });
    if (!wallet || wallet.balance < COST_PER_EMAIL) {
      return res.status(402).json({ success: false, error: 'Insufficient balance', balance: wallet?.balance || 0 });
    }

    const smtp = sender.BmSmtp;
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure === 'ssl',
      auth: { user: smtp.username, pass: smtp.password },
      ...(smtp.secure === 'tls' && { tls: { rejectUnauthorized: false } }),
    });

    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      replyTo: sender.replyEmail || sender.email,
      to,
      subject,
      html: message,
    });

    const newBalance = wallet.balance - COST_PER_EMAIL;
    await wallet.update({ balance: newBalance, totalSpent: parseFloat(wallet.totalSpent) + COST_PER_EMAIL });
    await BmTransaction.create({
      walletId: wallet.id,
      userId: apiKeyRecord.userId,
      type: 'deduction',
      amount: COST_PER_EMAIL,
      balanceAfter: newBalance,
      description: `API send to ${to}`,
      emailCount: 1,
    });
    await apiKeyRecord.update({ lastUsedAt: new Date() });

    res.json({
      success: true,
      message: 'Email sent successfully',
      to,
      cost: COST_PER_EMAIL,
      balance: newBalance,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
