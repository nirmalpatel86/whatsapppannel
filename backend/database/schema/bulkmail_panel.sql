-- Schema for bulkmail_panel -- generated from Sequelize models by scripts/generateSchemaSql.js
-- Generated 2026-11-23T17:34:27.206Z
-- Apply with: mysql -u USER -p bulkmail_panel < database/schema/bulkmail_panel.sql
-- Re-run the generator (not sequelize.sync({ alter: true })) whenever models change.

CREATE DATABASE IF NOT EXISTS `bulkmail_panel`;
USE `bulkmail_panel`;

CREATE TABLE IF NOT EXISTS `bm_users` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `phone` VARCHAR(255) NOT NULL UNIQUE, `email` VARCHAR(255), `password` VARCHAR(255) NOT NULL, `role` ENUM('super_admin', 'admin', 'reseller', 'user') DEFAULT 'user', `companyId` INTEGER, `parentId` INTEGER, `isActive` TINYINT(1) DEFAULT true, `maxUsers` INTEGER DEFAULT 0, `businessName` VARCHAR(255), `businessEmail` VARCHAR(255), `brand` VARCHAR(255), `logo` VARCHAR(255), `billingAddress` TEXT, `perHrLimit` INTEGER DEFAULT 100, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_companies` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `ownerId` INTEGER NOT NULL, `plan` ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free', `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_smtp_servers` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `host` VARCHAR(255) NOT NULL, `port` INTEGER NOT NULL DEFAULT 587, `username` VARCHAR(255) NOT NULL, `password` VARCHAR(255) NOT NULL, `secure` ENUM('none', 'ssl', 'tls') DEFAULT 'tls', `isActive` TINYINT(1) DEFAULT true, `maxPerHour` INTEGER DEFAULT 100, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_senders` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `email` VARCHAR(255) NOT NULL, `replyName` VARCHAR(255), `replyEmail` VARCHAR(255), `smtpId` INTEGER, `senderGroupId` INTEGER, `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_sender_groups` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_templates` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `subject` VARCHAR(255), `body` LONGTEXT NOT NULL, `status` ENUM('draft', 'active', 'archived') DEFAULT 'draft', `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_campaigns` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `contactGroupId` INTEGER, `senderId` INTEGER, `templateId` INTEGER, `subject` VARCHAR(255), `body` LONGTEXT, `totalRecipients` INTEGER DEFAULT 0, `sentCount` INTEGER DEFAULT 0, `deliveredCount` INTEGER DEFAULT 0, `failedCount` INTEGER DEFAULT 0, `openCount` INTEGER DEFAULT 0, `clickCount` INTEGER DEFAULT 0, `bounceCount` INTEGER DEFAULT 0, `unsubscribeCount` INTEGER DEFAULT 0, `status` ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed') DEFAULT 'draft', `campaignType` ENUM('regular', 'api', 'quick') DEFAULT 'regular', `senderGroupId` INTEGER, `scheduledAt` DATETIME, `startedAt` DATETIME, `completedAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_campaign_emails` (`id` INTEGER auto_increment , `campaignId` INTEGER NOT NULL, `email` VARCHAR(255) NOT NULL, `status` ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'unknown') DEFAULT 'pending', `isOpened` TINYINT(1) DEFAULT false, `openCount` INTEGER DEFAULT 0, `isLinkClicked` TINYINT(1) DEFAULT false, `responseCode` TEXT, `trackingCode` VARCHAR(64), `senderId` INTEGER, `sentAt` DATETIME, `openedAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `bm_campaign_emails` ADD INDEX `bm_campaign_emails_campaign_id` (`campaignId`);

ALTER TABLE `bm_campaign_emails` ADD INDEX `bm_campaign_emails_email` (`email`);

ALTER TABLE `bm_campaign_emails` ADD INDEX `bm_campaign_emails_status` (`status`);

ALTER TABLE `bm_campaign_emails` ADD INDEX `bm_campaign_emails_tracking_code` (`trackingCode`);

CREATE TABLE IF NOT EXISTS `bm_contact_groups` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `createdBy` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `description` TEXT, `contactCount` INTEGER DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_contacts` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `groupId` INTEGER, `name` VARCHAR(255), `email` VARCHAR(255) NOT NULL, `phone` VARCHAR(255), `companyName` VARCHAR(255), `profession` VARCHAR(255), `col1` VARCHAR(255), `col2` VARCHAR(255), `col3` VARCHAR(255), `col4` VARCHAR(255), `col5` VARCHAR(255), `isSubscribed` TINYINT(1) DEFAULT true, `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `bm_contacts` ADD INDEX `bm_contacts_company_id_email` (`companyId`, `email`);

ALTER TABLE `bm_contacts` ADD INDEX `bm_contacts_group_id` (`groupId`);

CREATE TABLE IF NOT EXISTS `bm_wallets` (`id` INTEGER auto_increment , `userId` INTEGER NOT NULL UNIQUE, `balance` DECIMAL(12,4) DEFAULT 0, `currency` VARCHAR(3) DEFAULT 'INR', `totalRecharged` DECIMAL(12,4) DEFAULT 0, `totalSpent` DECIMAL(12,4) DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_transactions` (`id` INTEGER auto_increment , `walletId` INTEGER NOT NULL, `userId` INTEGER NOT NULL, `type` ENUM('recharge', 'deduction', 'refund') NOT NULL, `amount` DECIMAL(12,4) NOT NULL, `balanceAfter` DECIMAL(12,4) NOT NULL, `description` VARCHAR(255), `campaignId` INTEGER, `emailCount` INTEGER, `performedBy` INTEGER, `reference` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `bm_transactions` ADD INDEX `bm_transactions_wallet_id` (`walletId`);

ALTER TABLE `bm_transactions` ADD INDEX `bm_transactions_user_id` (`userId`);

ALTER TABLE `bm_transactions` ADD INDEX `bm_transactions_type` (`type`);

ALTER TABLE `bm_transactions` ADD INDEX `bm_transactions_created_at` (`createdAt`);

CREATE TABLE IF NOT EXISTS `bm_plans` (`id` INTEGER auto_increment , `name` VARCHAR(255) NOT NULL, `emailCount` INTEGER NOT NULL, `validityDays` INTEGER NOT NULL, `price` DECIMAL(10,2) NOT NULL, `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_api_keys` (`id` INTEGER auto_increment , `userId` INTEGER NOT NULL, `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `apiKey` VARCHAR(64) NOT NULL UNIQUE, `senderId` INTEGER, `isActive` TINYINT(1) DEFAULT true, `lastUsedAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_images` (`id` INTEGER auto_increment , `companyId` INTEGER NOT NULL, `name` VARCHAR(255) NOT NULL, `filename` VARCHAR(255) NOT NULL, `url` TEXT, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_spam_words` (`id` INTEGER auto_increment , `word` VARCHAR(255) NOT NULL UNIQUE, `isActive` TINYINT(1) DEFAULT true, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bm_impersonation_logs` (`id` INTEGER auto_increment , `actorId` INTEGER NOT NULL, `actorRole` VARCHAR(255) NOT NULL, `targetUserId` INTEGER NOT NULL, `companyId` INTEGER, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;

ALTER TABLE `bm_users` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_users` CHANGE `phone` `phone` VARCHAR(255) NOT NULL UNIQUE;

ALTER TABLE `bm_users` CHANGE `email` `email` VARCHAR(255);

ALTER TABLE `bm_users` CHANGE `password` `password` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_users` CHANGE `role` `role` ENUM('super_admin', 'admin', 'reseller', 'user') DEFAULT 'user';

ALTER TABLE `bm_users` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_users` ADD FOREIGN KEY (`parentId`) REFERENCES `bm_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_users` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_users` CHANGE `maxUsers` `maxUsers` INTEGER DEFAULT 0;

ALTER TABLE `bm_users` CHANGE `businessName` `businessName` VARCHAR(255);

ALTER TABLE `bm_users` CHANGE `businessEmail` `businessEmail` VARCHAR(255);

ALTER TABLE `bm_users` CHANGE `brand` `brand` VARCHAR(255);

ALTER TABLE `bm_users` CHANGE `logo` `logo` VARCHAR(255);

ALTER TABLE `bm_users` CHANGE `billingAddress` `billingAddress` TEXT;

ALTER TABLE `bm_users` CHANGE `perHrLimit` `perHrLimit` INTEGER DEFAULT 100;

ALTER TABLE `bm_users` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_users` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_companies` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_companies` ADD FOREIGN KEY (`ownerId`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_companies` CHANGE `plan` `plan` ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free';

ALTER TABLE `bm_companies` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_companies` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_companies` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_smtp_servers` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bm_smtp_servers` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_smtp_servers` CHANGE `host` `host` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_smtp_servers` CHANGE `port` `port` INTEGER NOT NULL DEFAULT 587;

ALTER TABLE `bm_smtp_servers` CHANGE `username` `username` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_smtp_servers` CHANGE `password` `password` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_smtp_servers` CHANGE `secure` `secure` ENUM('none', 'ssl', 'tls') DEFAULT 'tls';

ALTER TABLE `bm_smtp_servers` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_smtp_servers` CHANGE `maxPerHour` `maxPerHour` INTEGER DEFAULT 100;

ALTER TABLE `bm_smtp_servers` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_smtp_servers` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_senders` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bm_senders` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_senders` CHANGE `email` `email` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_senders` CHANGE `replyName` `replyName` VARCHAR(255);

ALTER TABLE `bm_senders` CHANGE `replyEmail` `replyEmail` VARCHAR(255);

ALTER TABLE `bm_senders` ADD FOREIGN KEY (`smtpId`) REFERENCES `bm_smtp_servers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_senders` ADD FOREIGN KEY (`senderGroupId`) REFERENCES `bm_sender_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_senders` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_senders` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_senders` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_sender_groups` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bm_sender_groups` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_sender_groups` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_sender_groups` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_templates` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bm_templates` ADD FOREIGN KEY (`createdBy`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_templates` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_templates` CHANGE `subject` `subject` VARCHAR(255);

ALTER TABLE `bm_templates` CHANGE `body` `body` LONGTEXT NOT NULL;

ALTER TABLE `bm_templates` CHANGE `status` `status` ENUM('draft', 'active', 'archived') DEFAULT 'draft';

ALTER TABLE `bm_templates` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_templates` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_campaigns` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_campaigns` ADD FOREIGN KEY (`createdBy`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_campaigns` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_campaigns` ADD FOREIGN KEY (`contactGroupId`) REFERENCES `bm_contact_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_campaigns` ADD FOREIGN KEY (`senderId`) REFERENCES `bm_senders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_campaigns` ADD FOREIGN KEY (`templateId`) REFERENCES `bm_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_campaigns` CHANGE `subject` `subject` VARCHAR(255);

ALTER TABLE `bm_campaigns` CHANGE `body` `body` LONGTEXT;

ALTER TABLE `bm_campaigns` CHANGE `totalRecipients` `totalRecipients` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `sentCount` `sentCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `deliveredCount` `deliveredCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `failedCount` `failedCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `openCount` `openCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `clickCount` `clickCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `bounceCount` `bounceCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `unsubscribeCount` `unsubscribeCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaigns` CHANGE `status` `status` ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed') DEFAULT 'draft';

ALTER TABLE `bm_campaigns` CHANGE `campaignType` `campaignType` ENUM('regular', 'api', 'quick') DEFAULT 'regular';

ALTER TABLE `bm_campaigns` ADD FOREIGN KEY (`senderGroupId`) REFERENCES `bm_sender_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_campaigns` CHANGE `scheduledAt` `scheduledAt` DATETIME;

ALTER TABLE `bm_campaigns` CHANGE `startedAt` `startedAt` DATETIME;

ALTER TABLE `bm_campaigns` CHANGE `completedAt` `completedAt` DATETIME;

ALTER TABLE `bm_campaigns` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_campaigns` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_campaign_emails` ADD FOREIGN KEY (`campaignId`) REFERENCES `bm_campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bm_campaign_emails` CHANGE `email` `email` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_campaign_emails` CHANGE `status` `status` ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'unknown') DEFAULT 'pending';

ALTER TABLE `bm_campaign_emails` CHANGE `isOpened` `isOpened` TINYINT(1) DEFAULT false;

ALTER TABLE `bm_campaign_emails` CHANGE `openCount` `openCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_campaign_emails` CHANGE `isLinkClicked` `isLinkClicked` TINYINT(1) DEFAULT false;

ALTER TABLE `bm_campaign_emails` CHANGE `responseCode` `responseCode` TEXT;

ALTER TABLE `bm_campaign_emails` CHANGE `trackingCode` `trackingCode` VARCHAR(64);

ALTER TABLE `bm_campaign_emails` ADD FOREIGN KEY (`senderId`) REFERENCES `bm_senders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_campaign_emails` CHANGE `sentAt` `sentAt` DATETIME;

ALTER TABLE `bm_campaign_emails` CHANGE `openedAt` `openedAt` DATETIME;

ALTER TABLE `bm_campaign_emails` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_campaign_emails` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_contact_groups` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bm_contact_groups` ADD FOREIGN KEY (`createdBy`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_contact_groups` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_contact_groups` CHANGE `description` `description` TEXT;

ALTER TABLE `bm_contact_groups` CHANGE `contactCount` `contactCount` INTEGER DEFAULT 0;

ALTER TABLE `bm_contact_groups` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_contact_groups` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_contacts` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_contacts` ADD FOREIGN KEY (`groupId`) REFERENCES `bm_contact_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_contacts` CHANGE `name` `name` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `email` `email` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_contacts` CHANGE `phone` `phone` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `companyName` `companyName` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `profession` `profession` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `col1` `col1` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `col2` `col2` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `col3` `col3` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `col4` `col4` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `col5` `col5` VARCHAR(255);

ALTER TABLE `bm_contacts` CHANGE `isSubscribed` `isSubscribed` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_contacts` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_contacts` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_contacts` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_wallets` ADD FOREIGN KEY (`userId`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_wallets` CHANGE `balance` `balance` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `bm_wallets` CHANGE `currency` `currency` VARCHAR(3) DEFAULT 'INR';

ALTER TABLE `bm_wallets` CHANGE `totalRecharged` `totalRecharged` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `bm_wallets` CHANGE `totalSpent` `totalSpent` DECIMAL(12,4) DEFAULT 0;

ALTER TABLE `bm_wallets` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_wallets` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_transactions` ADD FOREIGN KEY (`walletId`) REFERENCES `bm_wallets` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_transactions` ADD FOREIGN KEY (`userId`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_transactions` CHANGE `type` `type` ENUM('recharge', 'deduction', 'refund') NOT NULL;

ALTER TABLE `bm_transactions` CHANGE `amount` `amount` DECIMAL(12,4) NOT NULL;

ALTER TABLE `bm_transactions` CHANGE `balanceAfter` `balanceAfter` DECIMAL(12,4) NOT NULL;

ALTER TABLE `bm_transactions` CHANGE `description` `description` VARCHAR(255);

ALTER TABLE `bm_transactions` ADD FOREIGN KEY (`campaignId`) REFERENCES `bm_campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_transactions` CHANGE `emailCount` `emailCount` INTEGER;

ALTER TABLE `bm_transactions` ADD FOREIGN KEY (`performedBy`) REFERENCES `bm_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_transactions` CHANGE `reference` `reference` VARCHAR(255);

ALTER TABLE `bm_transactions` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_transactions` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_plans` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_plans` CHANGE `emailCount` `emailCount` INTEGER NOT NULL;

ALTER TABLE `bm_plans` CHANGE `validityDays` `validityDays` INTEGER NOT NULL;

ALTER TABLE `bm_plans` CHANGE `price` `price` DECIMAL(10,2) NOT NULL;

ALTER TABLE `bm_plans` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_plans` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_plans` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_api_keys` ADD FOREIGN KEY (`userId`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_api_keys` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_api_keys` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_api_keys` CHANGE `apiKey` `apiKey` VARCHAR(64) NOT NULL UNIQUE;

ALTER TABLE `bm_api_keys` ADD FOREIGN KEY (`senderId`) REFERENCES `bm_senders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bm_api_keys` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_api_keys` CHANGE `lastUsedAt` `lastUsedAt` DATETIME;

ALTER TABLE `bm_api_keys` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_api_keys` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_images` ADD FOREIGN KEY (`companyId`) REFERENCES `bm_companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_images` CHANGE `name` `name` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_images` CHANGE `filename` `filename` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_images` CHANGE `url` `url` TEXT;

ALTER TABLE `bm_images` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_images` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_spam_words` CHANGE `word` `word` VARCHAR(255) NOT NULL UNIQUE;

ALTER TABLE `bm_spam_words` CHANGE `isActive` `isActive` TINYINT(1) DEFAULT true;

ALTER TABLE `bm_spam_words` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_spam_words` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;

ALTER TABLE `bm_impersonation_logs` ADD FOREIGN KEY (`actorId`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_impersonation_logs` CHANGE `actorRole` `actorRole` VARCHAR(255) NOT NULL;

ALTER TABLE `bm_impersonation_logs` ADD FOREIGN KEY (`targetUserId`) REFERENCES `bm_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE `bm_impersonation_logs` CHANGE `companyId` `companyId` INTEGER;

ALTER TABLE `bm_impersonation_logs` CHANGE `createdAt` `createdAt` DATETIME NOT NULL;

ALTER TABLE `bm_impersonation_logs` CHANGE `updatedAt` `updatedAt` DATETIME NOT NULL;
