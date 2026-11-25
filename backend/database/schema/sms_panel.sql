-- Schema for sms_panel -- generated from Sequelize models by scripts/generateSchemaSql.js
-- Generated 2026-11-24T16:55:20.519Z
-- Apply with: mysql -u USER -p sms_panel < database/schema/sms_panel.sql
-- Re-run the generator (not sequelize.sync({ alter: true })) whenever models change.

CREATE DATABASE IF NOT EXISTS `sms_panel`;
USE `sms_panel`;

CREATE TABLE IF NOT EXISTS `sms_users` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `phone` VARCHAR(255) NOT NULL UNIQUE, `email` VARCHAR(255), `password` VARCHAR(255) NOT NULL, `role` ENUM('super_admin', 'admin', 'reseller', 'user') DEFAULT 'user', `companyId` INTEGER, `parentId` INTEGER, `isActive` TINYINT(1) DEFAULT true, `maxUsers` INTEGER DEFAULT 0, `companyName` VARCHAR(255), `address` TEXT, `websiteUrl` VARCHAR(255), `apiKey` TEXT, `entityId` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_companies` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `ownerId` INTEGER NOT NULL, `plan` ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free', `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_routes` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `routeType` ENUM('transactional', 'promotional', 'otp', 'premium') NOT NULL, `smscId` VARCHAR(255), `apiUrl` TEXT, `apiUsername` VARCHAR(255), `apiPassword` VARCHAR(255), `dlrUrl` TEXT, `costPerSms` DECIMAL(10,4) DEFAULT 0, `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_sender_ids` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `senderId` VARCHAR(11) NOT NULL, `routeId` INTEGER, `entityId` VARCHAR(255), `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending', `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_templates` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `body` MEDIUMTEXT NOT NULL, `senderIdId` INTEGER, `routeId` INTEGER, `dltContentId` VARCHAR(255), `entityId` VARCHAR(255), `templateType` ENUM('transactional', 'promotional', 'otp') DEFAULT 'transactional', `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft', `isUnicode` TINYINT(1) DEFAULT false, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_campaigns` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `templateId` INTEGER, `senderIdId` INTEGER, `routeId` INTEGER, `message` MEDIUMTEXT, `recipients` JSON NOT NULL, `totalRecipients` INTEGER DEFAULT 0, `sentCount` INTEGER DEFAULT 0, `deliveredCount` INTEGER DEFAULT 0, `failedCount` INTEGER DEFAULT 0, `status` ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed') DEFAULT 'draft', `messageType` ENUM('text', 'unicode', 'flash') DEFAULT 'text', `dltContentId` VARCHAR(255), `entityId` VARCHAR(255), `scheduledAt` DATETIME, `startedAt` DATETIME, `completedAt` DATETIME, `delayBetweenMessages` INTEGER DEFAULT 100, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_campaign_messages` (`id` INTEGER auto_increment , `campaignId` INTEGER NOT NULL, `phone` VARCHAR(20) NOT NULL, `status` ENUM('pending', 'sent', 'delivered', 'failed', 'rejected', 'expired') DEFAULT 'pending', `responseCode` TEXT, `smscId` VARCHAR(255), `sentAt` DATETIME, `deliveredAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `sms_campaign_messages` ADD INDEX `sms_campaign_messages_campaign_id` (`campaignId`);

ALTER TABLE `sms_campaign_messages` ADD INDEX `sms_campaign_messages_phone` (`phone`);

ALTER TABLE `sms_campaign_messages` ADD INDEX `sms_campaign_messages_status` (`status`);

CREATE TABLE IF NOT EXISTS `sms_contacts` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `phone` VARCHAR(20) NOT NULL, `name` VARCHAR(255), `email` VARCHAR(255), `state` VARCHAR(255), `city` VARCHAR(255), `address` TEXT, `tags` JSON, `isBlocked` TINYINT(1) DEFAULT false, `isDnd` TINYINT(1) DEFAULT false, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `sms_contacts` ADD UNIQUE INDEX `sms_contacts_company_id_phone` (`companyId`, `phone`);

CREATE TABLE IF NOT EXISTS `sms_contact_groups` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `description` TEXT, `contactCount` INTEGER DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_contact_group_members` (`id` INTEGER auto_increment , `groupId` INTEGER NOT NULL, `contactId` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, UNIQUE `sms_contact_group_members_contactId_groupId_unique` (`groupId`, `contactId`), PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `sms_contact_group_members` ADD UNIQUE INDEX `sms_contact_group_members_group_id_contact_id` (`groupId`, `contactId`);

CREATE TABLE IF NOT EXISTS `sms_wallets` (`id` INTEGER auto_increment , `userId` INTEGER NOT NULL UNIQUE, `balance` DECIMAL(12,4) DEFAULT 0, `currency` VARCHAR(3) DEFAULT 'INR', `totalRecharged` DECIMAL(12,4) DEFAULT 0, `totalSpent` DECIMAL(12,4) DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_transactions` (`id` INTEGER auto_increment , `walletId` INTEGER NOT NULL, `userId` INTEGER NOT NULL, `type` ENUM('recharge', 'deduction', 'refund') NOT NULL, `amount` DECIMAL(12,4) NOT NULL, `balanceAfter` DECIMAL(12,4) NOT NULL, `description` VARCHAR(255), `campaignId` INTEGER, `smsCount` INTEGER, `routeId` INTEGER, `performedBy` INTEGER, `reference` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `sms_transactions` ADD INDEX `sms_transactions_wallet_id` (`walletId`);

ALTER TABLE `sms_transactions` ADD INDEX `sms_transactions_user_id` (`userId`);

ALTER TABLE `sms_transactions` ADD INDEX `sms_transactions_type` (`type`);

ALTER TABLE `sms_transactions` ADD INDEX `sms_transactions_created_at` (`createdAt`);

CREATE TABLE IF NOT EXISTS `sms_api_keys` (`id` INTEGER auto_increment , `userId` INTEGER NOT NULL, `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `apiKey` VARCHAR(64) NOT NULL UNIQUE, `senderIdId` INTEGER, `routeId` INTEGER, `isActive` TINYINT(1) DEFAULT true, `lastUsedAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_blocklist` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `phone` VARCHAR(20) NOT NULL, `reason` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `sms_blocklist` ADD UNIQUE INDEX `sms_blocklist_company_id_phone` (`companyId`, `phone`);

CREATE TABLE IF NOT EXISTS `sms_impersonation_logs` (`id` INTEGER auto_increment , `actorId` INTEGER NOT NULL, `actorRole` VARCHAR(255) NOT NULL, `targetUserId` INTEGER NOT NULL, `companyId` INTEGER, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `sms_users` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_users` CHANGE `phone` `phone` VARCHAR(255) NOT NULL UNIQUE;

ALTER TABLE `sms_users` CHANGE `email` `email` VARCHAR(255);

ALTER TABLE `sms_users` CHANGE `password` `password` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_users` CHANGE `role` `role` ENUM('super_admin', 'admin', 'reseller', 'user') DEFAULT 'user';

ALTER TABLE `sms_users` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_users` ADD FOREIGN KEY (`parentId`) REFERENCES `sms_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_users` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `sms_users` CHANGE `maxUsers` `maxUsers` INTEGER DEFAULT 0;

ALTER TABLE `sms_users` CHANGE `companyName` `companyName` VARCHAR(255);

ALTER TABLE `sms_users` CHANGE `address` `address` TEXT;

ALTER TABLE `sms_users` CHANGE `websiteUrl` `websiteUrl` VARCHAR(255);

ALTER TABLE `sms_users` CHANGE `apiKey` `apiKey` TEXT;

ALTER TABLE `sms_users` CHANGE `entityId` `entityId` VARCHAR(255);

ALTER TABLE `sms_users` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_users` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_companies` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_companies` ADD FOREIGN KEY (`ownerId`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_companies` CHANGE `plan` `plan` ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free';

ALTER TABLE `sms_companies` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `sms_companies` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_companies` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_routes` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_routes` CHANGE `routeType` `routeType` ENUM('transactional', 'promotional', 'otp', 'premium') NOT NULL;

ALTER TABLE `sms_routes` CHANGE `smscId` `smscId` VARCHAR(255);

ALTER TABLE `sms_routes` CHANGE `apiUrl` `apiUrl` TEXT;

ALTER TABLE `sms_routes` CHANGE `apiUsername` `apiUsername` VARCHAR(255);

ALTER TABLE `sms_routes` CHANGE `apiPassword` `apiPassword` VARCHAR(255);

ALTER TABLE `sms_routes` CHANGE `dlrUrl` `dlrUrl` TEXT;

ALTER TABLE `sms_routes` CHANGE `costPerSms` `costPerSms` DECIMAL(10,4) DEFAULT 0;

ALTER TABLE `sms_routes` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `sms_routes` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_routes` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_sender_ids` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sms_sender_ids` CHANGE `senderId` `senderId` VARCHAR(11) NOT NULL;

ALTER TABLE `sms_sender_ids` ADD FOREIGN KEY (`routeId`) REFERENCES `sms_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_sender_ids` CHANGE `entityId` `entityId` VARCHAR(255);

ALTER TABLE `sms_sender_ids` CHANGE `status` `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

ALTER TABLE `sms_sender_ids` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `sms_sender_ids` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_sender_ids` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_templates` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sms_templates` ADD FOREIGN KEY (`createdBy`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_templates` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_templates` CHANGE `body` `body` MEDIUMTEXT NOT NULL;

ALTER TABLE `sms_templates` ADD FOREIGN KEY (`senderIdId`) REFERENCES `sms_sender_ids` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_templates` ADD FOREIGN KEY (`routeId`) REFERENCES `sms_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_templates` CHANGE `dltContentId` `dltContentId` VARCHAR(255);

ALTER TABLE `sms_templates` CHANGE `entityId` `entityId` VARCHAR(255);

ALTER TABLE `sms_templates` CHANGE `templateType` `templateType` ENUM('transactional', 'promotional', 'otp') DEFAULT 'transactional';

ALTER TABLE `sms_templates` CHANGE `status` `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft';

ALTER TABLE `sms_templates` CHANGE `isUnicode` `isUnicode` TINYINT(1) DEFAULT false;

ALTER TABLE `sms_templates` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_templates` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_campaigns` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_campaigns` ADD FOREIGN KEY (`createdBy`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_campaigns` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_campaigns` ADD FOREIGN KEY (`templateId`) REFERENCES `sms_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_campaigns` ADD FOREIGN KEY (`senderIdId`) REFERENCES `sms_sender_ids` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_campaigns` ADD FOREIGN KEY (`routeId`) REFERENCES `sms_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_campaigns` CHANGE `message` `message` MEDIUMTEXT;

ALTER TABLE `sms_campaigns` CHANGE `recipients` `recipients` JSON NOT NULL;

ALTER TABLE `sms_campaigns` CHANGE `totalRecipients` `totalRecipients` INTEGER DEFAULT 0;

ALTER TABLE `sms_campaigns` CHANGE `sentCount` `sentCount` INTEGER DEFAULT 0;

ALTER TABLE `sms_campaigns` CHANGE `deliveredCount` `deliveredCount` INTEGER DEFAULT 0;

ALTER TABLE `sms_campaigns` CHANGE `failedCount` `failedCount` INTEGER DEFAULT 0;

ALTER TABLE `sms_campaigns` CHANGE `status` `status` ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed') DEFAULT 'draft';

ALTER TABLE `sms_campaigns` CHANGE `messageType` `messageType` ENUM('text', 'unicode', 'flash') DEFAULT 'text';

ALTER TABLE `sms_campaigns` CHANGE `dltContentId` `dltContentId` VARCHAR(255);

ALTER TABLE `sms_campaigns` CHANGE `entityId` `entityId` VARCHAR(255);

ALTER TABLE `sms_campaigns` CHANGE `scheduledAt` `scheduledAt` DATETIME;

ALTER TABLE `sms_campaigns` CHANGE `startedAt` `startedAt` DATETIME;

ALTER TABLE `sms_campaigns` CHANGE `completedAt` `completedAt` DATETIME;

ALTER TABLE `sms_campaigns` CHANGE `delayBetweenMessages` `delayBetweenMessages` INTEGER DEFAULT 100;

ALTER TABLE `sms_campaigns` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_campaigns` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_campaign_messages` ADD FOREIGN KEY (`campaignId`) REFERENCES `sms_campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sms_campaign_messages` CHANGE `phone` `phone` VARCHAR(20) NOT NULL;

ALTER TABLE `sms_campaign_messages` CHANGE `status` `status` ENUM('pending', 'sent', 'delivered', 'failed', 'rejected', 'expired') DEFAULT 'pending';

ALTER TABLE `sms_campaign_messages` CHANGE `responseCode` `responseCode` TEXT;

ALTER TABLE `sms_campaign_messages` CHANGE `smscId` `smscId` VARCHAR(255);

ALTER TABLE `sms_campaign_messages` CHANGE `sentAt` `sentAt` DATETIME;

ALTER TABLE `sms_campaign_messages` CHANGE `deliveredAt` `deliveredAt` DATETIME;

ALTER TABLE `sms_campaign_messages` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_campaign_messages` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_contacts` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sms_contacts` CHANGE `phone` `phone` VARCHAR(20) NOT NULL;

ALTER TABLE `sms_contacts` CHANGE `name` `name` VARCHAR(255);

ALTER TABLE `sms_contacts` CHANGE `email` `email` VARCHAR(255);

ALTER TABLE `sms_contacts` CHANGE `state` `state` VARCHAR(255);

ALTER TABLE `sms_contacts` CHANGE `city` `city` VARCHAR(255);

ALTER TABLE `sms_contacts` CHANGE `address` `address` TEXT;

ALTER TABLE `sms_contacts` CHANGE `tags` `tags` JSON;

ALTER TABLE `sms_contacts` CHANGE `isBlocked` `isBlocked` TINYINT(1) DEFAULT false;

ALTER TABLE `sms_contacts` CHANGE `isDnd` `isDnd` TINYINT(1) DEFAULT false;

ALTER TABLE `sms_contacts` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_contacts` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_contact_groups` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_contact_groups` ADD FOREIGN KEY (`createdBy`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_contact_groups` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_contact_groups` CHANGE `description` `description` TEXT;

ALTER TABLE `sms_contact_groups` CHANGE `contactCount` `contactCount` INTEGER DEFAULT 0;

ALTER TABLE `sms_contact_groups` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_contact_groups` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_contact_group_members` ADD FOREIGN KEY (`groupId`) REFERENCES `sms_contact_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sms_contact_group_members` ADD FOREIGN KEY (`contactId`) REFERENCES `sms_contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sms_contact_group_members` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_contact_group_members` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_wallets` ADD FOREIGN KEY (`userId`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_wallets` CHANGE `balance` `balance` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `sms_wallets` CHANGE `currency` `currency` VARCHAR(3) DEFAULT 'INR';

ALTER TABLE `sms_wallets` CHANGE `totalRecharged` `totalRecharged` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `sms_wallets` CHANGE `totalSpent` `totalSpent` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `sms_wallets` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_wallets` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_transactions` ADD FOREIGN KEY (`walletId`) REFERENCES `sms_wallets` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_transactions` ADD FOREIGN KEY (`userId`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_transactions` CHANGE `type` `type` ENUM('recharge', 'deduction', 'refund') NOT NULL;

ALTER TABLE `sms_transactions` CHANGE `amount` `amount` DECIMAL(12,4) NOT NULL;

ALTER TABLE `sms_transactions` CHANGE `balanceAfter` `balanceAfter` DECIMAL(12,4) NOT NULL;

ALTER TABLE `sms_transactions` CHANGE `description` `description` VARCHAR(255);

ALTER TABLE `sms_transactions` ADD FOREIGN KEY (`campaignId`) REFERENCES `sms_campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_transactions` CHANGE `smsCount` `smsCount` INTEGER;

ALTER TABLE `sms_transactions` ADD FOREIGN KEY (`routeId`) REFERENCES `sms_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_transactions` ADD FOREIGN KEY (`performedBy`) REFERENCES `sms_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_transactions` CHANGE `reference` `reference` VARCHAR(255);

ALTER TABLE `sms_transactions` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_transactions` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_api_keys` ADD FOREIGN KEY (`userId`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_api_keys` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_api_keys` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_api_keys` CHANGE `apiKey` `apiKey` VARCHAR(64) NOT NULL UNIQUE;

ALTER TABLE `sms_api_keys` ADD FOREIGN KEY (`senderIdId`) REFERENCES `sms_sender_ids` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_api_keys` ADD FOREIGN KEY (`routeId`) REFERENCES `sms_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sms_api_keys` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `sms_api_keys` CHANGE `lastUsedAt` `lastUsedAt` DATETIME;

ALTER TABLE `sms_api_keys` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_api_keys` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_blocklist` ADD FOREIGN KEY (`companyId`) REFERENCES `sms_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_blocklist` CHANGE `phone` `phone` VARCHAR(20) NOT NULL;

ALTER TABLE `sms_blocklist` CHANGE `reason` `reason` VARCHAR(255);

ALTER TABLE `sms_blocklist` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_blocklist` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `sms_impersonation_logs` ADD FOREIGN KEY (`actorId`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_impersonation_logs` CHANGE `actorRole` `actorRole` VARCHAR(255) NOT NULL;

ALTER TABLE `sms_impersonation_logs` ADD FOREIGN KEY (`targetUserId`) REFERENCES `sms_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `sms_impersonation_logs` CHANGE `companyId` `companyId` INTEGER;

ALTER TABLE `sms_impersonation_logs` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `sms_impersonation_logs` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;
