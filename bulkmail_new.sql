-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 22, 2026 at 04:22 PM
-- Server version: 10.6.22-MariaDB-0ubuntu0.22.04.1
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bulkmail_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `email_queue`
--

CREATE TABLE `email_queue` (
  `id` int(11) NOT NULL,
  `to_email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `template` text NOT NULL,
  `sender_name` varchar(100) DEFAULT NULL,
  `sender_email` varchar(255) DEFAULT NULL,
  `reply_to_email` varchar(255) DEFAULT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_donwload_log`
--

CREATE TABLE `report_donwload_log` (
  `sno` int(11) NOT NULL,
  `id_has` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `id_hass` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_download`
--

CREATE TABLE `report_download` (
  `sno` int(11) NOT NULL,
  `company_id` varchar(250) DEFAULT NULL,
  `user_id` varchar(250) DEFAULT NULL,
  `contact_id` varchar(250) DEFAULT NULL,
  `report_id` varchar(255) DEFAULT NULL,
  `file` varchar(255) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(250) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_api`
--

CREATE TABLE `sm_api` (
  `id` int(11) NOT NULL,
  `name` varchar(125) DEFAULT NULL,
  `api_key` varchar(64) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `id_hash` varchar(64) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_balance`
--

CREATE TABLE `sm_balance` (
  `id` int(11) NOT NULL,
  `balance_cr` int(11) DEFAULT NULL,
  `balance_dr` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `camp_id` varchar(255) DEFAULT NULL,
  `add_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_campaign`
--

CREATE TABLE `sm_campaign` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `contact_id` int(11) NOT NULL,
  `sender_id` varchar(255) DEFAULT NULL,
  `temp_id` int(11) DEFAULT NULL,
  `total` int(11) NOT NULL,
  `id_hash` varchar(64) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `template` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unsubscribe` int(11) NOT NULL,
  `emails` longblob NOT NULL,
  `schedule_time` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `add_date` datetime NOT NULL,
  `sender_group_id` int(11) DEFAULT NULL,
  `campaign_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_campaign2`
--

CREATE TABLE `sm_campaign2` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `contact_id` int(11) NOT NULL,
  `sender_id` varchar(255) DEFAULT NULL,
  `temp_id` int(11) DEFAULT NULL,
  `total` int(11) NOT NULL,
  `id_hash` varchar(64) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `template` longtext DEFAULT NULL,
  `unsubscribe` int(11) NOT NULL,
  `emails` longblob NOT NULL,
  `schedule_time` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `add_date` datetime NOT NULL,
  `sender_group_id` int(11) DEFAULT NULL,
  `campaign_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_campaign_email`
--

CREATE TABLE `sm_campaign_email` (
  `id` int(11) NOT NULL,
  `camp_id` varchar(64) DEFAULT NULL,
  `email` varchar(125) DEFAULT NULL,
  `delivered` int(11) DEFAULT 0,
  `undelivered` int(11) NOT NULL DEFAULT 0,
  `bounce` int(11) NOT NULL DEFAULT 0,
  `unknown_b` int(11) NOT NULL DEFAULT 0,
  `open` int(11) NOT NULL DEFAULT 0,
  `open_mult` int(11) NOT NULL DEFAULT 0,
  `open_link` int(11) NOT NULL DEFAULT 0,
  `response_code` text DEFAULT NULL,
  `track_email_code` varchar(64) DEFAULT NULL,
  `user_ip` varchar(64) DEFAULT NULL,
  `user_ip_total` text DEFAULT NULL,
  `cutting` int(11) DEFAULT NULL,
  `add_date` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `sender_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_campaign_email_history`
--

CREATE TABLE `sm_campaign_email_history` (
  `id` int(11) NOT NULL,
  `camp_id` varchar(64) DEFAULT NULL,
  `email` varchar(125) DEFAULT NULL,
  `delivered` int(11) DEFAULT NULL,
  `undelivered` int(11) DEFAULT NULL,
  `bounce` int(11) DEFAULT NULL,
  `unknown_b` int(11) DEFAULT NULL,
  `open` int(11) DEFAULT NULL,
  `open_mult` int(11) DEFAULT NULL,
  `open_link` int(11) DEFAULT NULL,
  `response_code` text DEFAULT NULL,
  `track_email_code` varchar(64) DEFAULT NULL,
  `user_ip` varchar(64) DEFAULT NULL,
  `user_ip_total` text DEFAULT NULL,
  `cutting` int(11) DEFAULT NULL,
  `add_date` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `sender_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_campaign_final`
--

CREATE TABLE `sm_campaign_final` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `contact_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `temp_id` int(11) DEFAULT NULL,
  `total` int(11) NOT NULL,
  `id_hash` varchar(64) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `template` longtext DEFAULT NULL,
  `unsubscribe` int(11) NOT NULL,
  `emails` longblob NOT NULL,
  `schedule_time` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `add_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_campaign_remove_muds_rename`
--

CREATE TABLE `sm_campaign_remove_muds_rename` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `contact_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `temp_id` int(11) DEFAULT NULL,
  `total` int(11) NOT NULL,
  `id_hash` varchar(64) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `template` longtext DEFAULT NULL,
  `unsubscribe` int(11) NOT NULL,
  `emails` longblob NOT NULL,
  `schedule_time` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `add_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_contacts`
--

CREATE TABLE `sm_contacts` (
  `id` int(11) NOT NULL,
  `id_hash` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `emails` longtext DEFAULT NULL,
  `add_date` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `proffesion` varchar(255) DEFAULT NULL,
  `col_1` varchar(255) DEFAULT NULL,
  `col_2` varchar(255) DEFAULT NULL,
  `col_3` varchar(255) DEFAULT NULL,
  `col_4` varchar(255) DEFAULT NULL,
  `col_5` varchar(255) DEFAULT NULL,
  `col_6` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_contacts_list`
--

CREATE TABLE `sm_contacts_list` (
  `id` int(11) NOT NULL,
  `id_hash` varchar(64) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `contact_id` int(11) DEFAULT NULL,
  `name` varchar(125) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `email_hash` varchar(64) NOT NULL,
  `status` int(11) DEFAULT NULL,
  `subscribe` int(11) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `proffesion` varchar(255) DEFAULT NULL,
  `col_1` varchar(255) DEFAULT NULL,
  `col_2` varchar(255) DEFAULT NULL,
  `col_3` varchar(255) DEFAULT NULL,
  `col_4` varchar(255) DEFAULT NULL,
  `col_5` varchar(255) DEFAULT NULL,
  `col_6` varchar(255) DEFAULT NULL,
  `col_7` varchar(255) DEFAULT NULL,
  `col_8` varchar(255) DEFAULT NULL,
  `col_9` varchar(255) DEFAULT NULL,
  `col_10` varchar(255) DEFAULT NULL,
  `col_11` varchar(255) DEFAULT NULL,
  `col_12` varchar(255) DEFAULT NULL,
  `add_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_cutting`
--

CREATE TABLE `sm_cutting` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `cutting_min` int(11) NOT NULL,
  `total_cutting` int(11) DEFAULT NULL,
  `delivered` int(11) DEFAULT NULL,
  `undelivered` int(11) DEFAULT NULL,
  `open_mail` int(11) DEFAULT NULL,
  `link_click` int(11) DEFAULT NULL,
  `bounce_mail` int(11) DEFAULT NULL,
  `unknown_b` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_images`
--

CREATE TABLE `sm_images` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `image` varchar(50) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `id_hash` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_plan_email`
--

CREATE TABLE `sm_plan_email` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email_count` int(11) DEFAULT NULL,
  `remain_email` int(11) DEFAULT NULL,
  `c_id` int(11) DEFAULT NULL,
  `id_hash` varchar(64) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `expire_date` datetime DEFAULT NULL,
  `user_ip` varchar(255) NOT NULL,
  `status` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_register`
--

CREATE TABLE `sm_register` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `id_hash` varchar(64) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `business_name` varchar(125) NOT NULL,
  `business_email` varchar(125) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `brand` varchar(125) NOT NULL,
  `logo` varchar(255) NOT NULL,
  `user_pass` varchar(255) DEFAULT NULL,
  `billing_address` varchar(255) NOT NULL,
  `account_type` varchar(255) NOT NULL,
  `acc_connections` varchar(255) NOT NULL,
  `email_plan` varchar(255) NOT NULL,
  `root_conn` varchar(250) DEFAULT NULL,
  `root_conn_api` varchar(250) NOT NULL,
  `root_conn_quick` varchar(250) DEFAULT NULL,
  `per_hr_limit` int(11) NOT NULL,
  `availble_blnce` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `add_date` datetime NOT NULL,
  `status` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_sender`
--

CREATE TABLE `sm_sender` (
  `id` int(11) NOT NULL,
  `id_hash` varchar(64) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `reply_name` varchar(125) NOT NULL,
  `reply_email` varchar(125) NOT NULL,
  `sender_smpt` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `add_date` datetime DEFAULT NULL,
  `sender_smpt_grup` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_spam_words`
--

CREATE TABLE `sm_spam_words` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` varchar(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sm_templates`
--

CREATE TABLE `sm_templates` (
  `id` int(11) NOT NULL,
  `id_hash` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `template` longtext DEFAULT NULL,
  `add_date` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_contacts_list`
--

CREATE TABLE `tbl_contacts_list` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(125) DEFAULT NULL,
  `email_hash` varchar(64) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `subscribe` int(11) DEFAULT NULL,
  `add_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_coupon`
--

CREATE TABLE `tbl_coupon` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `dis_type` int(11) DEFAULT NULL,
  `amount` varchar(32) DEFAULT NULL,
  `discount_for` varchar(64) NOT NULL,
  `s_date` date DEFAULT NULL,
  `e_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_coupon_history`
--

CREATE TABLE `tbl_coupon_history` (
  `id` int(11) NOT NULL,
  `coupon_id` int(11) DEFAULT NULL,
  `user_ip` varchar(32) DEFAULT NULL,
  `order_id` varchar(32) DEFAULT NULL,
  `status` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_plan_email`
--

CREATE TABLE `tbl_plan_email` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` int(11) DEFAULT NULL,
  `valid` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `status` varchar(8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sender_group`
--

CREATE TABLE `tbl_sender_group` (
  `id` int(11) NOT NULL,
  `group_name` text DEFAULT NULL,
  `sender` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_smtp`
--

CREATE TABLE `tbl_smtp` (
  `id` int(11) NOT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_user` varchar(255) DEFAULT NULL,
  `smtp_pass` varchar(255) DEFAULT NULL,
  `smtp_port` varchar(255) DEFAULT NULL,
  `smtp_user_id` varchar(255) DEFAULT NULL,
  `smtp_type` varchar(125) DEFAULT NULL,
  `smtp_secure` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user`
--

CREATE TABLE `tbl_user` (
  `id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `photo` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL,
  `permission_menu` text NOT NULL,
  `permission_sub_menu` text NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tract_send`
--

CREATE TABLE `tract_send` (
  `id` int(11) NOT NULL,
  `camp_id` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `email_queue`
--
ALTER TABLE `email_queue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `report_donwload_log`
--
ALTER TABLE `report_donwload_log`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `report_download`
--
ALTER TABLE `report_download`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `sm_api`
--
ALTER TABLE `sm_api`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_api_id_hash` (`id_hash`);

--
-- Indexes for table `sm_balance`
--
ALTER TABLE `sm_balance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_balance_user_id_add_date` (`user_id`,`add_date`);

--
-- Indexes for table `sm_campaign`
--
ALTER TABLE `sm_campaign`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_campaign_id_hash` (`id_hash`),
  ADD KEY `idx_sm_campaign_status` (`status`),
  ADD KEY `idx_sm_campaign_schedule_time` (`schedule_time`);

--
-- Indexes for table `sm_campaign2`
--
ALTER TABLE `sm_campaign2`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_campaign2_id_hash` (`id_hash`),
  ADD KEY `idx_sm_campaign2_user_id` (`user_id`),
  ADD KEY `idx_sm_campaign2_contact_id` (`contact_id`),
  ADD KEY `idx_sm_campaign2_sender_id` (`sender_id`),
  ADD KEY `idx_sm_campaign2_temp_id` (`temp_id`),
  ADD KEY `idx_sm_campaign2_status` (`status`);

--
-- Indexes for table `sm_campaign_email`
--
ALTER TABLE `sm_campaign_email`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_campaign_email_track_email_code` (`track_email_code`),
  ADD KEY `status` (`status`),
  ADD KEY `idx_id_status` (`id`,`status`);

--
-- Indexes for table `sm_campaign_email_history`
--
ALTER TABLE `sm_campaign_email_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_track_email_code` (`track_email_code`),
  ADD KEY `idx_sm_campaign_email_history_camp_id` (`camp_id`),
  ADD KEY `idx_sm_campaign_email_history_email` (`email`),
  ADD KEY `idx_sm_campaign_email_history_status` (`status`),
  ADD KEY `idx_sm_campaign_email_history_add_date` (`add_date`),
  ADD KEY `idx_sm_campaign_email_history_camp_status` (`camp_id`,`status`),
  ADD KEY `idx_sm_campaign_email_history_camp_date` (`camp_id`,`add_date`);

--
-- Indexes for table `sm_campaign_final`
--
ALTER TABLE `sm_campaign_final`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_campaign_final_id_hash` (`id_hash`);

--
-- Indexes for table `sm_campaign_remove_muds_rename`
--
ALTER TABLE `sm_campaign_remove_muds_rename`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sm_contacts`
--
ALTER TABLE `sm_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_contacts_user_id` (`user_id`);

--
-- Indexes for table `sm_contacts_list`
--
ALTER TABLE `sm_contacts_list`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_contacts_list_contact_id` (`contact_id`),
  ADD KEY `email_hash` (`email_hash`);

--
-- Indexes for table `sm_cutting`
--
ALTER TABLE `sm_cutting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sm_images`
--
ALTER TABLE `sm_images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sm_plan_email`
--
ALTER TABLE `sm_plan_email`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_plan_email_user_id` (`user_id`);

--
-- Indexes for table `sm_register`
--
ALTER TABLE `sm_register`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sm_register_id` (`id`);

--
-- Indexes for table `sm_sender`
--
ALTER TABLE `sm_sender`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sm_spam_words`
--
ALTER TABLE `sm_spam_words`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sm_templates`
--
ALTER TABLE `sm_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_contacts_list`
--
ALTER TABLE `tbl_contacts_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_coupon`
--
ALTER TABLE `tbl_coupon`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_coupon_history`
--
ALTER TABLE `tbl_coupon_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_plan_email`
--
ALTER TABLE `tbl_plan_email`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_sender_group`
--
ALTER TABLE `tbl_sender_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_smtp`
--
ALTER TABLE `tbl_smtp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tract_send`
--
ALTER TABLE `tract_send`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `email_queue`
--
ALTER TABLE `email_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_donwload_log`
--
ALTER TABLE `report_donwload_log`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_download`
--
ALTER TABLE `report_download`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_api`
--
ALTER TABLE `sm_api`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_balance`
--
ALTER TABLE `sm_balance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_campaign`
--
ALTER TABLE `sm_campaign`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_campaign2`
--
ALTER TABLE `sm_campaign2`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_campaign_email`
--
ALTER TABLE `sm_campaign_email`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_campaign_email_history`
--
ALTER TABLE `sm_campaign_email_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_campaign_final`
--
ALTER TABLE `sm_campaign_final`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_campaign_remove_muds_rename`
--
ALTER TABLE `sm_campaign_remove_muds_rename`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_contacts`
--
ALTER TABLE `sm_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_contacts_list`
--
ALTER TABLE `sm_contacts_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_cutting`
--
ALTER TABLE `sm_cutting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_images`
--
ALTER TABLE `sm_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_plan_email`
--
ALTER TABLE `sm_plan_email`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_register`
--
ALTER TABLE `sm_register`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_sender`
--
ALTER TABLE `sm_sender`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_spam_words`
--
ALTER TABLE `sm_spam_words`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sm_templates`
--
ALTER TABLE `sm_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_contacts_list`
--
ALTER TABLE `tbl_contacts_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_coupon`
--
ALTER TABLE `tbl_coupon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_coupon_history`
--
ALTER TABLE `tbl_coupon_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_plan_email`
--
ALTER TABLE `tbl_plan_email`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_sender_group`
--
ALTER TABLE `tbl_sender_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_smtp`
--
ALTER TABLE `tbl_smtp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_user`
--
ALTER TABLE `tbl_user`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tract_send`
--
ALTER TABLE `tract_send`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
