-- Schema for whatsapp_panel -- generated from Sequelize models by scripts/generateSchemaSql.js
-- Generated 2026-11-23T17:34:20.601Z
-- Apply with: mysql -u USER -p whatsapp_panel < database/schema/whatsapp_panel.sql
-- Re-run the generator (not sequelize.sync({ alter: true })) whenever models change.

CREATE DATABASE IF NOT EXISTS `whatsapp_panel`;
USE `whatsapp_panel`;

CREATE TABLE IF NOT EXISTS `Users` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `phone` VARCHAR(255) NOT NULL UNIQUE, `email` VARCHAR(255) UNIQUE, `password` VARCHAR(255) NOT NULL, `role` ENUM('super_admin', 'admin', 'reseller', 'user') DEFAULT 'user', `companyId` INTEGER, `parentId` INTEGER, `isActive` TINYINT(1) DEFAULT true, `maxWhatsappAccounts` INTEGER DEFAULT 1, `maxUsers` INTEGER DEFAULT 0, `countryCode` VARCHAR(5) DEFAULT '91', `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Companies` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `ownerId` INTEGER NOT NULL, `plan` ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free', `maxWhatsappAccounts` INTEGER DEFAULT 2, `maxCampaignsPerDay` INTEGER DEFAULT 5, `isActive` TINYINT(1) DEFAULT true, `metaBusinessId` VARCHAR(255), `metaAccessToken` TEXT, `metaWebhookSecret` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `WhatsappAccounts` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER, `name` VARCHAR(255) NOT NULL, `phone` VARCHAR(255), `status` ENUM('disconnected', 'connecting', 'connected', 'qr_pending') DEFAULT 'disconnected', `sessionData` LONGTEXT, `metaPhoneNumberId` VARCHAR(255), `metaWabaId` VARCHAR(255), `provider` ENUM('baileys', 'meta_cloud') DEFAULT 'baileys', `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Contacts` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `phone` VARCHAR(255) NOT NULL, `name` VARCHAR(255), `firstName` VARCHAR(255), `lastName` VARCHAR(255), `alternateMobile` VARCHAR(255), `email` VARCHAR(255), `profession` VARCHAR(255), `contactType` VARCHAR(255), `dateOfBirth` DATE, `anniversary` DATE, `state` VARCHAR(255), `city` VARCHAR(255), `address` TEXT, `pushName` VARCHAR(255), `profilePicUrl` TEXT, `isBlocked` TINYINT(1) DEFAULT false, `tags` JSON, `lastMessageAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `Contacts` ADD UNIQUE INDEX `contacts_company_id_phone` (`companyId`, `phone`);

CREATE TABLE IF NOT EXISTS `Chats` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `contactId` INTEGER NOT NULL, `whatsappAccountId` INTEGER NOT NULL, `lastMessage` TEXT, `lastMessageAt` DATETIME, `unreadCount` INTEGER DEFAULT 0, `isArchived` TINYINT(1) DEFAULT false, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `Chats` ADD UNIQUE INDEX `chats_contact_id_whatsapp_account_id` (`contactId`, `whatsappAccountId`);

CREATE TABLE IF NOT EXISTS `Messages` (`id` INTEGER auto_increment , `chatId` INTEGER NOT NULL, `whatsappAccountId` INTEGER NOT NULL, `contactId` INTEGER NOT NULL, `companyId` INTEGER NOT NULL, `waMessageId` VARCHAR(255), `direction` ENUM('inbound', 'outbound') NOT NULL, `type` ENUM('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'template') DEFAULT 'text', `body` TEXT, `mediaUrl` TEXT, `mediaType` VARCHAR(255), `status` ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending', `sentBy` INTEGER, `timestamp` DATETIME, `isDeleted` TINYINT(1) DEFAULT false, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `Messages` ADD INDEX `messages_chat_id` (`chatId`);

ALTER TABLE `Messages` ADD INDEX `messages_wa_message_id` (`waMessageId`);

CREATE TABLE IF NOT EXISTS `Campaigns` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `whatsappAccountId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `status` ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed') DEFAULT 'draft', `type` ENUM('text', 'image', 'template') DEFAULT 'text', `messageBody` TEXT, `mediaUrl` TEXT, `templateName` VARCHAR(255), `templateLanguage` VARCHAR(255), `templateParams` JSON, `recipients` JSON NOT NULL, `totalRecipients` INTEGER DEFAULT 0, `sentCount` INTEGER DEFAULT 0, `failedCount` INTEGER DEFAULT 0, `deliveredCount` INTEGER DEFAULT 0, `scheduledAt` DATETIME, `startedAt` DATETIME, `completedAt` DATETIME, `delayBetweenMessages` INTEGER DEFAULT 3000, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `MessageTemplates` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `language` VARCHAR(255) DEFAULT 'en', `category` ENUM('marketing', 'utility', 'authentication') DEFAULT 'marketing', `body` TEXT NOT NULL, `header` TEXT, `footer` TEXT, `buttons` JSON, `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft', `metaTemplateId` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Wallets` (`id` INTEGER auto_increment , `userId` INTEGER NOT NULL UNIQUE, `balance` DECIMAL(12,4) DEFAULT 0, `currency` VARCHAR(3) DEFAULT 'INR', `totalRecharged` DECIMAL(12,4) DEFAULT 0, `totalSpent` DECIMAL(12,4) DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Transactions` (`id` INTEGER auto_increment , `walletId` INTEGER NOT NULL, `userId` INTEGER NOT NULL, `type` ENUM('recharge', 'deduction', 'refund') NOT NULL, `amount` DECIMAL(12,4) NOT NULL, `balanceAfter` DECIMAL(12,4) NOT NULL, `description` VARCHAR(255), `messageId` INTEGER, `campaignId` INTEGER, `messageCategory` ENUM('marketing', 'utility', 'authentication', 'service', 'text_only'), `recipientPhone` VARCHAR(255), `performedBy` INTEGER, `reference` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `Transactions` ADD INDEX `transactions_wallet_id` (`walletId`);

ALTER TABLE `Transactions` ADD INDEX `transactions_user_id` (`userId`);

ALTER TABLE `Transactions` ADD INDEX `transactions_type` (`type`);

ALTER TABLE `Transactions` ADD INDEX `transactions_created_at` (`createdAt`);

CREATE TABLE IF NOT EXISTS `ContactGroups` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `description` VARCHAR(255), `createdBy` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ContactGroupMembers` (`id` INTEGER auto_increment , `groupId` INTEGER NOT NULL, `contactId` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, UNIQUE `ContactGroupMembers_contactId_groupId_unique` (`groupId`, `contactId`), PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `ContactGroupMembers` ADD UNIQUE INDEX `contact_group_members_group_id_contact_id` (`groupId`, `contactId`);

CREATE TABLE IF NOT EXISTS `WhatsappApiKeys` (`id` INTEGER auto_increment , `userId` INTEGER NOT NULL, `companyId` INTEGER NOT NULL, `whatsappAccountId` INTEGER, `name` VARCHAR(255) NOT NULL, `apiKey` VARCHAR(64) NOT NULL UNIQUE, `isActive` TINYINT(1) DEFAULT true, `lastUsedAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ConnectionLogs` (`id` INTEGER auto_increment , `whatsappAccountId` INTEGER NOT NULL, `companyId` INTEGER NOT NULL, `event` ENUM('connecting', 'qr_pending', 'connected', 'disconnected') NOT NULL, `phone` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `ConnectionLogs` ADD INDEX `connection_logs_whatsapp_account_id` (`whatsappAccountId`);

CREATE TABLE IF NOT EXISTS `ImpersonationLogs` (`id` INTEGER auto_increment , `actorId` INTEGER NOT NULL, `actorRole` VARCHAR(255) NOT NULL, `targetUserId` INTEGER NOT NULL, `companyId` INTEGER, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `Users` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `Users` CHANGE `phone` `phone` VARCHAR(255) NOT NULL UNIQUE;

ALTER TABLE `Users` CHANGE `email` `email` VARCHAR(255) UNIQUE;

ALTER TABLE `Users` CHANGE `password` `password` VARCHAR(255) NOT NULL;

ALTER TABLE `Users` CHANGE `role` `role` ENUM('super_admin', 'admin', 'reseller', 'user') DEFAULT 'user';

ALTER TABLE `Users` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Users` ADD FOREIGN KEY (`parentId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Users` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `Users` CHANGE `maxWhatsappAccounts` `maxWhatsappAccounts` INTEGER DEFAULT 1;

ALTER TABLE `Users` CHANGE `maxUsers` `maxUsers` INTEGER DEFAULT 0;

ALTER TABLE `Users` CHANGE `countryCode` `countryCode` VARCHAR(5) DEFAULT '91';

ALTER TABLE `Users` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Users` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Companies` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `Companies` ADD FOREIGN KEY (`ownerId`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Companies` CHANGE `plan` `plan` ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free';

ALTER TABLE `Companies` CHANGE `maxWhatsappAccounts` `maxWhatsappAccounts` INTEGER DEFAULT 2;

ALTER TABLE `Companies` CHANGE `maxCampaignsPerDay` `maxCampaignsPerDay` INTEGER DEFAULT 5;

ALTER TABLE `Companies` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `Companies` CHANGE `metaBusinessId` `metaBusinessId` VARCHAR(255);

ALTER TABLE `Companies` CHANGE `metaAccessToken` `metaAccessToken` TEXT;

ALTER TABLE `Companies` CHANGE `metaWebhookSecret` `metaWebhookSecret` VARCHAR(255);

ALTER TABLE `Companies` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Companies` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `WhatsappAccounts` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `WhatsappAccounts` ADD FOREIGN KEY (`createdBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `WhatsappAccounts` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `WhatsappAccounts` CHANGE `phone` `phone` VARCHAR(255);

ALTER TABLE `WhatsappAccounts` CHANGE `status` `status` ENUM('disconnected', 'connecting', 'connected', 'qr_pending') DEFAULT 'disconnected';

ALTER TABLE `WhatsappAccounts` CHANGE `sessionData` `sessionData` LONGTEXT;

ALTER TABLE `WhatsappAccounts` CHANGE `metaPhoneNumberId` `metaPhoneNumberId` VARCHAR(255);

ALTER TABLE `WhatsappAccounts` CHANGE `metaWabaId` `metaWabaId` VARCHAR(255);

ALTER TABLE `WhatsappAccounts` CHANGE `provider` `provider` ENUM('baileys', 'meta_cloud') DEFAULT 'baileys';

ALTER TABLE `WhatsappAccounts` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `WhatsappAccounts` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Contacts` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Contacts` CHANGE `phone` `phone` VARCHAR(255) NOT NULL;

ALTER TABLE `Contacts` CHANGE `name` `name` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `firstName` `firstName` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `lastName` `lastName` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `alternateMobile` `alternateMobile` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `email` `email` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `profession` `profession` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `contactType` `contactType` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `dateOfBirth` `dateOfBirth` DATE;

ALTER TABLE `Contacts` CHANGE `anniversary` `anniversary` DATE;

ALTER TABLE `Contacts` CHANGE `state` `state` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `city` `city` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `address` `address` TEXT;

ALTER TABLE `Contacts` CHANGE `pushName` `pushName` VARCHAR(255);

ALTER TABLE `Contacts` CHANGE `profilePicUrl` `profilePicUrl` TEXT;

ALTER TABLE `Contacts` CHANGE `isBlocked` `isBlocked` TINYINT(1) DEFAULT false;

ALTER TABLE `Contacts` CHANGE `tags` `tags` JSON;

ALTER TABLE `Contacts` CHANGE `lastMessageAt` `lastMessageAt` DATETIME;

ALTER TABLE `Contacts` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Contacts` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Chats` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Chats` ADD FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Chats` ADD FOREIGN KEY (`whatsappAccountId`) REFERENCES `WhatsappAccounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Chats` CHANGE `lastMessage` `lastMessage` TEXT;

ALTER TABLE `Chats` CHANGE `lastMessageAt` `lastMessageAt` DATETIME;

ALTER TABLE `Chats` CHANGE `unreadCount` `unreadCount` INTEGER DEFAULT 0;

ALTER TABLE `Chats` CHANGE `isArchived` `isArchived` TINYINT(1) DEFAULT false;

ALTER TABLE `Chats` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Chats` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Messages` ADD FOREIGN KEY (`chatId`) REFERENCES `Chats` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Messages` ADD FOREIGN KEY (`whatsappAccountId`) REFERENCES `WhatsappAccounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Messages` ADD FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Messages` CHANGE `companyId` `companyId` INTEGER NOT NULL;

ALTER TABLE `Messages` CHANGE `waMessageId` `waMessageId` VARCHAR(255);

ALTER TABLE `Messages` CHANGE `direction` `direction` ENUM('inbound', 'outbound') NOT NULL;

ALTER TABLE `Messages` CHANGE `type` `type` ENUM('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'template') DEFAULT 'text';

ALTER TABLE `Messages` CHANGE `body` `body` TEXT;

ALTER TABLE `Messages` CHANGE `mediaUrl` `mediaUrl` TEXT;

ALTER TABLE `Messages` CHANGE `mediaType` `mediaType` VARCHAR(255);

ALTER TABLE `Messages` CHANGE `status` `status` ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending';

ALTER TABLE `Messages` CHANGE `sentBy` `sentBy` INTEGER;

ALTER TABLE `Messages` CHANGE `timestamp` `timestamp` DATETIME;

ALTER TABLE `Messages` CHANGE `isDeleted` `isDeleted` TINYINT(1) DEFAULT false;

ALTER TABLE `Messages` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Messages` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Campaigns` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Campaigns` ADD FOREIGN KEY (`whatsappAccountId`) REFERENCES `WhatsappAccounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Campaigns` ADD FOREIGN KEY (`createdBy`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Campaigns` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `Campaigns` CHANGE `status` `status` ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed') DEFAULT 'draft';

ALTER TABLE `Campaigns` CHANGE `type` `type` ENUM('text', 'image', 'template') DEFAULT 'text';

ALTER TABLE `Campaigns` CHANGE `messageBody` `messageBody` TEXT;

ALTER TABLE `Campaigns` CHANGE `mediaUrl` `mediaUrl` TEXT;

ALTER TABLE `Campaigns` CHANGE `templateName` `templateName` VARCHAR(255);

ALTER TABLE `Campaigns` CHANGE `templateLanguage` `templateLanguage` VARCHAR(255);

ALTER TABLE `Campaigns` CHANGE `templateParams` `templateParams` JSON;

ALTER TABLE `Campaigns` CHANGE `recipients` `recipients` JSON NOT NULL;

ALTER TABLE `Campaigns` CHANGE `totalRecipients` `totalRecipients` INTEGER DEFAULT 0;

ALTER TABLE `Campaigns` CHANGE `sentCount` `sentCount` INTEGER DEFAULT 0;

ALTER TABLE `Campaigns` CHANGE `failedCount` `failedCount` INTEGER DEFAULT 0;

ALTER TABLE `Campaigns` CHANGE `deliveredCount` `deliveredCount` INTEGER DEFAULT 0;

ALTER TABLE `Campaigns` CHANGE `scheduledAt` `scheduledAt` DATETIME;

ALTER TABLE `Campaigns` CHANGE `startedAt` `startedAt` DATETIME;

ALTER TABLE `Campaigns` CHANGE `completedAt` `completedAt` DATETIME;

ALTER TABLE `Campaigns` CHANGE `delayBetweenMessages` `delayBetweenMessages` INTEGER DEFAULT 3000;

ALTER TABLE `Campaigns` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Campaigns` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `MessageTemplates` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `MessageTemplates` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `MessageTemplates` CHANGE `language` `language` VARCHAR(255) DEFAULT 'en';

ALTER TABLE `MessageTemplates` CHANGE `category` `category` ENUM('marketing', 'utility', 'authentication') DEFAULT 'marketing';

ALTER TABLE `MessageTemplates` CHANGE `body` `body` TEXT NOT NULL;

ALTER TABLE `MessageTemplates` CHANGE `header` `header` TEXT;

ALTER TABLE `MessageTemplates` CHANGE `footer` `footer` TEXT;

ALTER TABLE `MessageTemplates` CHANGE `buttons` `buttons` JSON;

ALTER TABLE `MessageTemplates` CHANGE `status` `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft';

ALTER TABLE `MessageTemplates` CHANGE `metaTemplateId` `metaTemplateId` VARCHAR(255);

ALTER TABLE `MessageTemplates` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `MessageTemplates` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Wallets` ADD FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Wallets` CHANGE `balance` `balance` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `Wallets` CHANGE `currency` `currency` VARCHAR(3) DEFAULT 'INR';

ALTER TABLE `Wallets` CHANGE `totalRecharged` `totalRecharged` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `Wallets` CHANGE `totalSpent` `totalSpent` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `Wallets` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Wallets` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `Transactions` ADD FOREIGN KEY (`walletId`) REFERENCES `Wallets` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Transactions` ADD FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `Transactions` CHANGE `type` `type` ENUM('recharge', 'deduction', 'refund') NOT NULL;

ALTER TABLE `Transactions` CHANGE `amount` `amount` DECIMAL(12,4) NOT NULL;

ALTER TABLE `Transactions` CHANGE `balanceAfter` `balanceAfter` DECIMAL(12,4) NOT NULL;

ALTER TABLE `Transactions` CHANGE `description` `description` VARCHAR(255);

ALTER TABLE `Transactions` ADD FOREIGN KEY (`messageId`) REFERENCES `Messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Transactions` ADD FOREIGN KEY (`campaignId`) REFERENCES `Campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Transactions` CHANGE `messageCategory` `messageCategory` ENUM('marketing', 'utility', 'authentication', 'service', 'text_only');

ALTER TABLE `Transactions` CHANGE `recipientPhone` `recipientPhone` VARCHAR(255);

ALTER TABLE `Transactions` ADD FOREIGN KEY (`performedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Transactions` CHANGE `reference` `reference` VARCHAR(255);

ALTER TABLE `Transactions` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `Transactions` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `ContactGroups` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `ContactGroups` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `ContactGroups` CHANGE `description` `description` VARCHAR(255);

ALTER TABLE `ContactGroups` ADD FOREIGN KEY (`createdBy`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `ContactGroups` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `ContactGroups` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `ContactGroupMembers` ADD FOREIGN KEY (`groupId`) REFERENCES `ContactGroups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ContactGroupMembers` ADD FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ContactGroupMembers` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `ContactGroupMembers` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `WhatsappApiKeys` ADD FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `WhatsappApiKeys` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `WhatsappApiKeys` ADD FOREIGN KEY (`whatsappAccountId`) REFERENCES `WhatsappAccounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `WhatsappApiKeys` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `WhatsappApiKeys` CHANGE `apiKey` `apiKey` VARCHAR(64) NOT NULL UNIQUE;

ALTER TABLE `WhatsappApiKeys` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `WhatsappApiKeys` CHANGE `lastUsedAt` `lastUsedAt` DATETIME;

ALTER TABLE `WhatsappApiKeys` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `WhatsappApiKeys` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `ConnectionLogs` ADD FOREIGN KEY (`whatsappAccountId`) REFERENCES `WhatsappAccounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `ConnectionLogs` ADD FOREIGN KEY (`companyId`) REFERENCES `Companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `ConnectionLogs` CHANGE `event` `event` ENUM('connecting', 'qr_pending', 'connected', 'disconnected') NOT NULL;

ALTER TABLE `ConnectionLogs` CHANGE `phone` `phone` VARCHAR(255);

ALTER TABLE `ConnectionLogs` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `ConnectionLogs` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `ImpersonationLogs` ADD FOREIGN KEY (`actorId`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `ImpersonationLogs` CHANGE `actorRole` `actorRole` VARCHAR(255) NOT NULL;

ALTER TABLE `ImpersonationLogs` ADD FOREIGN KEY (`targetUserId`) REFERENCES `Users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `ImpersonationLogs` CHANGE `companyId` `companyId` INTEGER;

ALTER TABLE `ImpersonationLogs` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `ImpersonationLogs` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;
