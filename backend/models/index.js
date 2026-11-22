const sequelize = require('../config/database');
const User = require('./User');
const Company = require('./Company');
const WhatsappAccount = require('./WhatsappAccount');
const Contact = require('./Contact');
const Chat = require('./Chat');
const Message = require('./Message');
const Campaign = require('./Campaign');
const MessageTemplate = require('./MessageTemplate');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const ContactGroup = require('./ContactGroup');
const ContactGroupMember = require('./ContactGroupMember');

// Company <-> User
Company.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId' });

// User hierarchy (reseller -> users)
User.belongsTo(User, { as: 'parent', foreignKey: 'parentId' });
User.hasMany(User, { as: 'children', foreignKey: 'parentId' });

// Company <-> WhatsappAccount
Company.hasMany(WhatsappAccount, { foreignKey: 'companyId' });
WhatsappAccount.belongsTo(Company, { foreignKey: 'companyId' });
WhatsappAccount.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(WhatsappAccount, { foreignKey: 'createdBy' });

// Company <-> Contact
Company.hasMany(Contact, { foreignKey: 'companyId' });
Contact.belongsTo(Company, { foreignKey: 'companyId' });

// Chat associations
Chat.belongsTo(Company, { foreignKey: 'companyId' });
Chat.belongsTo(Contact, { foreignKey: 'contactId' });
Chat.belongsTo(WhatsappAccount, { foreignKey: 'whatsappAccountId' });
Contact.hasMany(Chat, { foreignKey: 'contactId' });
WhatsappAccount.hasMany(Chat, { foreignKey: 'whatsappAccountId' });

// Message associations
Message.belongsTo(Chat, { foreignKey: 'chatId' });
Message.belongsTo(WhatsappAccount, { foreignKey: 'whatsappAccountId' });
Message.belongsTo(Contact, { foreignKey: 'contactId' });
Chat.hasMany(Message, { foreignKey: 'chatId' });

// Campaign associations
Campaign.belongsTo(Company, { foreignKey: 'companyId' });
Campaign.belongsTo(WhatsappAccount, { foreignKey: 'whatsappAccountId' });
Campaign.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// MessageTemplate associations
MessageTemplate.belongsTo(Company, { foreignKey: 'companyId' });
Company.hasMany(MessageTemplate, { foreignKey: 'companyId' });

// Wallet associations
Wallet.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Wallet, { foreignKey: 'userId' });

// Transaction associations
Transaction.belongsTo(Wallet, { foreignKey: 'walletId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });
Transaction.belongsTo(User, { as: 'performer', foreignKey: 'performedBy' });
Transaction.belongsTo(Message, { foreignKey: 'messageId' });
Transaction.belongsTo(Campaign, { foreignKey: 'campaignId' });
Wallet.hasMany(Transaction, { foreignKey: 'walletId' });

// ContactGroup associations
ContactGroup.belongsTo(Company, { foreignKey: 'companyId' });
ContactGroup.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Company.hasMany(ContactGroup, { foreignKey: 'companyId' });

// ContactGroup <-> Contact (many-to-many through ContactGroupMember)
ContactGroup.belongsToMany(Contact, { through: ContactGroupMember, foreignKey: 'groupId', otherKey: 'contactId' });
Contact.belongsToMany(ContactGroup, { through: ContactGroupMember, foreignKey: 'contactId', otherKey: 'groupId' });
ContactGroup.hasMany(ContactGroupMember, { foreignKey: 'groupId' });
ContactGroupMember.belongsTo(ContactGroup, { foreignKey: 'groupId' });
ContactGroupMember.belongsTo(Contact, { foreignKey: 'contactId' });

module.exports = {
  sequelize,
  User,
  Company,
  WhatsappAccount,
  Contact,
  Chat,
  Message,
  Campaign,
  MessageTemplate,
  Wallet,
  Transaction,
  ContactGroup,
  ContactGroupMember,
};
