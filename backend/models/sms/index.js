const smsSequelize = require('../../config/smsDatabase');
const SmsUser = require('./SmsUser');
const SmsCompany = require('./SmsCompany');
const SmsRoute = require('./SmsRoute');
const SmsSenderId = require('./SmsSenderId');
const SmsTemplate = require('./SmsTemplate');
const SmsCampaign = require('./SmsCampaign');
const SmsCampaignMessage = require('./SmsCampaignMessage');
const SmsContact = require('./SmsContact');
const SmsContactGroup = require('./SmsContactGroup');
const SmsContactGroupMember = require('./SmsContactGroupMember');
const SmsWallet = require('./SmsWallet');
const SmsTransaction = require('./SmsTransaction');
const SmsApiKey = require('./SmsApiKey');
const SmsBlocklist = require('./SmsBlocklist');

// Company <-> User
SmsCompany.belongsTo(SmsUser, { as: 'owner', foreignKey: 'ownerId' });
SmsCompany.hasMany(SmsUser, { foreignKey: 'companyId', as: 'users' });
SmsUser.belongsTo(SmsCompany, { foreignKey: 'companyId' });

// User hierarchy
SmsUser.belongsTo(SmsUser, { as: 'parent', foreignKey: 'parentId' });
SmsUser.hasMany(SmsUser, { as: 'children', foreignKey: 'parentId' });

// Company <-> SenderIds
SmsCompany.hasMany(SmsSenderId, { foreignKey: 'companyId' });
SmsSenderId.belongsTo(SmsCompany, { foreignKey: 'companyId' });
SmsSenderId.belongsTo(SmsRoute, { foreignKey: 'routeId' });

// Company <-> Templates
SmsCompany.hasMany(SmsTemplate, { foreignKey: 'companyId' });
SmsTemplate.belongsTo(SmsCompany, { foreignKey: 'companyId' });
SmsTemplate.belongsTo(SmsUser, { as: 'creator', foreignKey: 'createdBy' });
SmsTemplate.belongsTo(SmsSenderId, { foreignKey: 'senderIdId' });
SmsTemplate.belongsTo(SmsRoute, { foreignKey: 'routeId' });

// Campaign associations
SmsCampaign.belongsTo(SmsCompany, { foreignKey: 'companyId' });
SmsCampaign.belongsTo(SmsUser, { as: 'creator', foreignKey: 'createdBy' });
SmsCampaign.belongsTo(SmsTemplate, { foreignKey: 'templateId' });
SmsCampaign.belongsTo(SmsSenderId, { foreignKey: 'senderIdId' });
SmsCampaign.belongsTo(SmsRoute, { foreignKey: 'routeId' });
SmsCampaign.hasMany(SmsCampaignMessage, { foreignKey: 'campaignId' });
SmsCampaignMessage.belongsTo(SmsCampaign, { foreignKey: 'campaignId' });

// Company <-> Contacts
SmsCompany.hasMany(SmsContact, { foreignKey: 'companyId' });
SmsContact.belongsTo(SmsCompany, { foreignKey: 'companyId' });

// Contact Groups
SmsContactGroup.belongsTo(SmsCompany, { foreignKey: 'companyId' });
SmsContactGroup.belongsTo(SmsUser, { as: 'creator', foreignKey: 'createdBy' });
SmsCompany.hasMany(SmsContactGroup, { foreignKey: 'companyId' });
SmsContactGroup.belongsToMany(SmsContact, { through: SmsContactGroupMember, foreignKey: 'groupId', otherKey: 'contactId' });
SmsContact.belongsToMany(SmsContactGroup, { through: SmsContactGroupMember, foreignKey: 'contactId', otherKey: 'groupId' });
SmsContactGroup.hasMany(SmsContactGroupMember, { foreignKey: 'groupId' });
SmsContactGroupMember.belongsTo(SmsContactGroup, { foreignKey: 'groupId' });
SmsContactGroupMember.belongsTo(SmsContact, { foreignKey: 'contactId' });

// Wallet
SmsWallet.belongsTo(SmsUser, { foreignKey: 'userId' });
SmsUser.hasOne(SmsWallet, { foreignKey: 'userId' });

// Transactions
SmsTransaction.belongsTo(SmsWallet, { foreignKey: 'walletId' });
SmsTransaction.belongsTo(SmsUser, { foreignKey: 'userId' });
SmsTransaction.belongsTo(SmsUser, { as: 'performer', foreignKey: 'performedBy' });
SmsTransaction.belongsTo(SmsCampaign, { foreignKey: 'campaignId' });
SmsTransaction.belongsTo(SmsRoute, { foreignKey: 'routeId' });
SmsWallet.hasMany(SmsTransaction, { foreignKey: 'walletId' });

// API Keys
SmsApiKey.belongsTo(SmsUser, { foreignKey: 'userId' });
SmsApiKey.belongsTo(SmsCompany, { foreignKey: 'companyId' });
SmsApiKey.belongsTo(SmsSenderId, { foreignKey: 'senderIdId' });
SmsApiKey.belongsTo(SmsRoute, { foreignKey: 'routeId' });

// Blocklist
SmsBlocklist.belongsTo(SmsCompany, { foreignKey: 'companyId' });

module.exports = {
  smsSequelize,
  SmsUser,
  SmsCompany,
  SmsRoute,
  SmsSenderId,
  SmsTemplate,
  SmsCampaign,
  SmsCampaignMessage,
  SmsContact,
  SmsContactGroup,
  SmsContactGroupMember,
  SmsWallet,
  SmsTransaction,
  SmsApiKey,
  SmsBlocklist,
};
