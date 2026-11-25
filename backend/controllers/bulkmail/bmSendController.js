const { BmWallet, BmTransaction, BmSender, BmSmtp, BmContact, BmUser } = require('../../models/bulkmail');
const { Op } = require('sequelize');
const { getVisibleCompanyIds } = require('../../utils/scopeHelper');
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

const mergeTags = (text, r) => (text || '')
  .replace(/\{name\}/gi, r.name || '')
  .replace(/\{email\}/gi, r.email || '')
  .replace(/\{company\}/gi, r.companyName || '')
  .replace(/\{profession\}/gi, r.profession || '')
  .replace(/\{col1\}/gi, r.col1 || '')
  .replace(/\{col2\}/gi, r.col2 || '')
  .replace(/\{col3\}/gi, r.col3 || '')
  .replace(/\{col4\}/gi, r.col4 || '')
  .replace(/\{col5\}/gi, r.col5 || '');

// Dashboard "Send Email" page — a one-off send to selected contact groups and/or
// manually entered addresses, authenticated as the logged-in user (unlike sendEmail
// above, which is the public API-key route for external integrations).
exports.quickSend = async (req, res) => {
  try {
    const { senderId, groupIds, emails, subject, body } = req.body;
    if (!senderId) return res.status(400).json({ error: 'Sender is required' });
    if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required' });

    const sender = await BmSender.findByPk(senderId, { include: [{ model: BmSmtp }] });
    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (req.user.role !== 'super_admin') {
      const visibleCompanyIds = await getVisibleCompanyIds(BmUser, req.user);
      if (!visibleCompanyIds.includes(sender.companyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (!sender.BmSmtp) return res.status(400).json({ error: 'Selected sender has no SMTP server configured' });

    const recipients = [];
    if (Array.isArray(groupIds) && groupIds.length) {
      const contacts = await BmContact.findAll({
        where: { groupId: { [Op.in]: groupIds }, isSubscribed: true, isActive: true },
      });
      for (const c of contacts) recipients.push(c.toJSON());
    }
    if (Array.isArray(emails) && emails.length) {
      for (const email of emails) {
        if (email && !recipients.some(r => r.email === email)) recipients.push({ email });
      }
    }
    if (!recipients.length) {
      return res.status(400).json({ error: 'No recipients found — pick a group or enter email addresses' });
    }

    const wallet = await BmWallet.findOne({ where: { userId: req.user.id } });
    const estimatedCost = recipients.length * COST_PER_EMAIL;
    if (!wallet || wallet.balance < estimatedCost) {
      return res.status(402).json({
        error: `Insufficient balance. Need ₹${estimatedCost.toFixed(2)}, have ₹${(wallet?.balance || 0).toFixed(2)}`,
      });
    }

    const smtp = sender.BmSmtp;
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure === 'ssl',
      auth: { user: smtp.username, pass: smtp.password },
      ...(smtp.secure === 'tls' && { tls: { rejectUnauthorized: false } }),
    });

    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      try {
        await transporter.sendMail({
          from: `"${sender.name}" <${sender.email}>`,
          replyTo: sender.replyEmail || sender.email,
          to: r.email,
          subject: mergeTags(subject, r),
          html: mergeTags(body, r),
        });
        sent++;
      } catch (_) {
        failed++;
      }
    }

    if (sent > 0) {
      const totalCost = sent * COST_PER_EMAIL;
      const newBalance = Math.max(0, wallet.balance - totalCost);
      await wallet.update({ balance: newBalance, totalSpent: parseFloat(wallet.totalSpent) + totalCost });
      await BmTransaction.create({
        walletId: wallet.id, userId: req.user.id, type: 'deduction',
        amount: totalCost, balanceAfter: newBalance,
        description: `Quick send: ${subject} (${sent} emails)`, emailCount: sent,
      });
    }

    res.json({
      message: `Sent ${sent} of ${recipients.length} email${recipients.length === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}`,
      sent, failed, total: recipients.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
