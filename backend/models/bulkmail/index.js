const bulkmailSequelize = require('../../config/bulkmailDatabase');
const BmUser = require('./BmUser');
const BmCompany = require('./BmCompany');
const BmSmtp = require('./BmSmtp');
const BmSender = require('./BmSender');
const BmSenderGroup = require('./BmSenderGroup');
const BmTemplate = require('./BmTemplate');
const BmCampaign = require('./BmCampaign');
const BmCampaignEmail = require('./BmCampaignEmail');
const BmContactGroup = require('./BmContactGroup');
const BmContact = require('./BmContact');
const BmWallet = require('./BmWallet');
const BmTransaction = require('./BmTransaction');
const BmPlan = require('./BmPlan');
const BmApiKey = require('./BmApiKey');
const BmImage = require('./BmImage');
const BmSpamWord = require('./BmSpamWord');
const BmImpersonationLog = require('./BmImpersonationLog');

// Company <-> User
BmCompany.belongsTo(BmUser, { as: 'owner', foreignKey: 'ownerId' });
BmCompany.hasMany(BmUser, { foreignKey: 'companyId', as: 'users' });
BmUser.belongsTo(BmCompany, { foreignKey: 'companyId' });

// User hierarchy
BmUser.belongsTo(BmUser, { as: 'parent', foreignKey: 'parentId' });
BmUser.hasMany(BmUser, { as: 'children', foreignKey: 'parentId' });

// Company <-> SMTP
BmCompany.hasMany(BmSmtp, { foreignKey: 'companyId' });
BmSmtp.belongsTo(BmCompany, { foreignKey: 'companyId' });

// Company <-> Senders
BmCompany.hasMany(BmSender, { foreignKey: 'companyId' });
BmSender.belongsTo(BmCompany, { foreignKey: 'companyId' });
BmSender.belongsTo(BmSmtp, { foreignKey: 'smtpId' });
BmSender.belongsTo(BmSenderGroup, { foreignKey: 'senderGroupId' });

// Company <-> SenderGroups
BmCompany.hasMany(BmSenderGroup, { foreignKey: 'companyId' });
BmSenderGroup.belongsTo(BmCompany, { foreignKey: 'companyId' });
BmSenderGroup.hasMany(BmSender, { foreignKey: 'senderGroupId' });

// Company <-> Templates
BmCompany.hasMany(BmTemplate, { foreignKey: 'companyId' });
BmTemplate.belongsTo(BmCompany, { foreignKey: 'companyId' });
BmTemplate.belongsTo(BmUser, { as: 'creator', foreignKey: 'createdBy' });

// Campaign associations
BmCampaign.belongsTo(BmCompany, { foreignKey: 'companyId' });
BmCampaign.belongsTo(BmUser, { as: 'creator', foreignKey: 'createdBy' });
BmCampaign.belongsTo(BmContactGroup, { foreignKey: 'contactGroupId' });
BmCampaign.belongsTo(BmSender, { foreignKey: 'senderId' });
BmCampaign.belongsTo(BmTemplate, { foreignKey: 'templateId' });
BmCampaign.belongsTo(BmSenderGroup, { foreignKey: 'senderGroupId' });
BmCampaign.hasMany(BmCampaignEmail, { foreignKey: 'campaignId' });
BmCampaignEmail.belongsTo(BmCampaign, { foreignKey: 'campaignId' });
BmCampaignEmail.belongsTo(BmSender, { foreignKey: 'senderId' });

// Company <-> Contact Groups
BmCompany.hasMany(BmContactGroup, { foreignKey: 'companyId' });
BmContactGroup.belongsTo(BmCompany, { foreignKey: 'companyId' });
BmContactGroup.belongsTo(BmUser, { as: 'creator', foreignKey: 'createdBy' });
BmContactGroup.hasMany(BmContact, { foreignKey: 'groupId' });
BmContact.belongsTo(BmContactGroup, { foreignKey: 'groupId' });
BmContact.belongsTo(BmCompany, { foreignKey: 'companyId' });

// Wallet
BmWallet.belongsTo(BmUser, { foreignKey: 'userId' });
BmUser.hasOne(BmWallet, { foreignKey: 'userId' });

// Transactions
BmTransaction.belongsTo(BmWallet, { foreignKey: 'walletId' });
BmTransaction.belongsTo(BmUser, { foreignKey: 'userId' });
BmTransaction.belongsTo(BmUser, { as: 'performer', foreignKey: 'performedBy' });
BmTransaction.belongsTo(BmCampaign, { foreignKey: 'campaignId' });
BmWallet.hasMany(BmTransaction, { foreignKey: 'walletId' });

// API Keys
BmApiKey.belongsTo(BmUser, { foreignKey: 'userId' });
BmApiKey.belongsTo(BmCompany, { foreignKey: 'companyId' });
BmApiKey.belongsTo(BmSender, { foreignKey: 'senderId' });

// Images
BmImage.belongsTo(BmCompany, { foreignKey: 'companyId' });

// Impersonation Logs
BmImpersonationLog.belongsTo(BmUser, { as: 'actor', foreignKey: 'actorId' });
BmImpersonationLog.belongsTo(BmUser, { as: 'target', foreignKey: 'targetUserId' });

module.exports = {
  bulkmailSequelize,
  BmUser,
  BmCompany,
  BmSmtp,
  BmSender,
  BmSenderGroup,
  BmTemplate,
  BmCampaign,
  BmCampaignEmail,
  BmContactGroup,
  BmContact,
  BmWallet,
  BmTransaction,
  BmPlan,
  BmApiKey,
  BmImage,
  BmSpamWord,
  BmImpersonationLog,
};
