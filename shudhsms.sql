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
-- Database: `shudhsms`
--

-- --------------------------------------------------------

--
-- Table structure for table `banner`
--

CREATE TABLE `banner` (
  `sno` int(5) DEFAULT NULL,
  `banner` text DEFAULT NULL,
  `main` varchar(1000) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blocklist_num`
--

CREATE TABLE `blocklist_num` (
  `sno` int(11) NOT NULL,
  `num` varchar(12) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cron_limit`
--

CREATE TABLE `cron_limit` (
  `id` int(11) NOT NULL,
  `per_cron_limit` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dlrurl`
--

CREATE TABLE `dlrurl` (
  `sno` int(11) NOT NULL,
  `url` varchar(200) DEFAULT NULL,
  `recurl` varchar(200) DEFAULT NULL,
  `status` int(1) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invalid_attempts`
--

CREATE TABLE `invalid_attempts` (
  `id` int(11) NOT NULL,
  `userid` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kannel_status`
--

CREATE TABLE `kannel_status` (
  `sno` int(11) NOT NULL,
  `status_code` int(11) DEFAULT NULL,
  `status_text` varchar(30) DEFAULT NULL,
  `status_color` varchar(7) DEFAULT NULL,
  `level` int(1) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE `login` (
  `uid` int(10) NOT NULL,
  `loginid` varchar(125) DEFAULT NULL,
  `password` varchar(125) DEFAULT NULL,
  `enc_password` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_login` varchar(125) DEFAULT NULL,
  `cur_login` varchar(125) DEFAULT NULL,
  `level` varchar(20) DEFAULT NULL,
  `parent_id` varchar(40) DEFAULT NULL,
  `status` int(11) DEFAULT 0,
  `mobile` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `acc_manager` varchar(255) DEFAULT NULL,
  `otp` int(11) DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `new_sms_status`
--

CREATE TABLE `new_sms_status` (
  `sno` int(11) NOT NULL,
  `status_name` varchar(25) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `new_trans2`
--

CREATE TABLE `new_trans2` (
  `id` int(11) NOT NULL,
  `sno` int(50) DEFAULT NULL,
  `tid` int(50) DEFAULT NULL,
  `num` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `new_trans_status`
--

CREATE TABLE `new_trans_status` (
  `sno` int(11) NOT NULL,
  `status_name` varchar(25) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phonebook`
--

CREATE TABLE `phonebook` (
  `sno` int(5) NOT NULL,
  `usid` varchar(30) DEFAULT NULL,
  `nums` longtext DEFAULT NULL,
  `gpname` varchar(30) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sent1`
--

CREATE TABLE `sent1` (
  `parid` varchar(30) DEFAULT NULL,
  `userid` varchar(40) DEFAULT NULL,
  `cnt` int(20) DEFAULT NULL,
  `route` varchar(20) DEFAULT NULL,
  `msgdate` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sent2`
--

CREATE TABLE `sent2` (
  `parid` varchar(30) DEFAULT NULL,
  `loginid` varchar(40) DEFAULT NULL,
  `cnt` decimal(32,0) DEFAULT NULL,
  `msgdate` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sent_cnt`
--

CREATE TABLE `sent_cnt` (
  `sno` int(20) NOT NULL,
  `loginid` varchar(30) DEFAULT NULL,
  `cnt` int(20) DEFAULT NULL,
  `msgdate` date DEFAULT NULL,
  `route` varchar(20) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `smsc`
--

CREATE TABLE `smsc` (
  `sno` int(11) NOT NULL,
  `sid` varchar(20) DEFAULT NULL,
  `route` varchar(20) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `summery_report`
--

CREATE TABLE `summery_report` (
  `id` int(11) NOT NULL,
  `sno` int(11) DEFAULT NULL,
  `total_count_o` int(11) DEFAULT NULL,
  `delivered_o` int(11) DEFAULT NULL,
  `undelivered_o` int(11) DEFAULT NULL,
  `pending_o` int(11) DEFAULT NULL,
  `failed_o` int(11) DEFAULT NULL,
  `rejected_o` int(11) DEFAULT NULL,
  `submitted_o` int(11) DEFAULT NULL,
  `expired_o` int(11) DEFAULT NULL,
  `total_count_f` int(11) DEFAULT NULL,
  `delivered_f` int(11) DEFAULT NULL,
  `undelivered_f` int(11) DEFAULT NULL,
  `pending_f` int(11) DEFAULT NULL,
  `failed_f` int(11) DEFAULT NULL,
  `rejected_f` int(11) DEFAULT NULL,
  `submitted_f` int(11) DEFAULT NULL,
  `expired_f` int(11) DEFAULT NULL,
  `logtime` varchar(50) DEFAULT NULL,
  `msgcnt` int(11) DEFAULT NULL,
  `sche` varchar(50) DEFAULT NULL,
  `userid` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `route` varchar(100) DEFAULT NULL,
  `sender_id` varchar(100) DEFAULT NULL,
  `smsc` varchar(100) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_camp`
--

CREATE TABLE `tbl_camp` (
  `id` int(11) NOT NULL,
  `camp_id` int(11) DEFAULT NULL,
  `username` varchar(125) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `template` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sender` varchar(255) DEFAULT NULL,
  `routes` varchar(32) DEFAULT NULL,
  `sche` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  `dlt_contnt_id` varchar(256) DEFAULT NULL,
  `entity_id` varchar(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_class`
--

CREATE TABLE `tbl_class` (
  `id` int(11) NOT NULL,
  `class_name` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_dyn_camp`
--

CREATE TABLE `tbl_dyn_camp` (
  `id` int(11) NOT NULL,
  `username` varchar(124) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `mobile_column` text DEFAULT NULL,
  `template` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `exclName` text DEFAULT NULL,
  `tbl_name` text DEFAULT NULL,
  `sender` varchar(125) DEFAULT NULL,
  `routes` varchar(32) DEFAULT NULL,
  `sche` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  `dlt_contnt_id` varchar(256) DEFAULT NULL,
  `entity_id` varchar(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_otp`
--

CREATE TABLE `tbl_otp` (
  `id` int(11) NOT NULL,
  `mobile` varchar(32) DEFAULT NULL,
  `otp` int(11) DEFAULT NULL,
  `user_ip` varchar(64) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `add_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reports`
--

CREATE TABLE `tbl_reports` (
  `id` int(11) NOT NULL,
  `userid` varchar(255) DEFAULT NULL,
  `file_sno` int(11) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_section`
--

CREATE TABLE `tbl_section` (
  `id` int(11) NOT NULL,
  `section_name` varchar(255) DEFAULT NULL,
  `class_name` int(11) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shree`
--

CREATE TABLE `tbl_shree` (
  `id` int(11) NOT NULL,
  `remarks` text DEFAULT NULL,
  `message` text DEFAULT NULL,
  `vds` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sms_api_push`
--

CREATE TABLE `tbl_sms_api_push` (
  `id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `senderid` varchar(255) DEFAULT NULL,
  `pswd` varchar(255) DEFAULT NULL,
  `mobile` varchar(64) DEFAULT NULL,
  `message` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `route` varchar(32) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `from_file` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sms_api_push_fake`
--

CREATE TABLE `tbl_sms_api_push_fake` (
  `id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `senderid` varchar(255) DEFAULT NULL,
  `pswd` varchar(255) DEFAULT NULL,
  `mobile` varchar(64) DEFAULT NULL,
  `message` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `route` varchar(32) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `content_id` varchar(100) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT current_timestamp(),
  `from_file` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_student`
--

CREATE TABLE `tbl_student` (
  `id` int(11) NOT NULL,
  `student_roll_no` varchar(255) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `student_mobile` varchar(32) DEFAULT NULL,
  `section_name` int(11) DEFAULT NULL,
  `class_name` int(11) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_student_send`
--

CREATE TABLE `tbl_student_send` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `student_roll_no` varchar(255) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `student_mobile` varchar(255) DEFAULT NULL,
  `camp_id` varchar(64) DEFAULT NULL,
  `class_name` int(11) DEFAULT NULL,
  `section_name` int(11) DEFAULT NULL,
  `user_id` varchar(64) DEFAULT NULL,
  `add_date` datetime DEFAULT NULL,
  `mobiles` longblob DEFAULT NULL,
  `total_count` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `uid` varchar(125) DEFAULT NULL,
  `template` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `dlt_contnt_id` varchar(125) DEFAULT NULL,
  `sender_id` varchar(125) DEFAULT NULL,
  `sno` int(11) NOT NULL,
  `tmp_type` int(11) DEFAULT NULL,
  `temp_name` varchar(256) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `templates_app`
--

CREATE TABLE `templates_app` (
  `uid` varchar(125) DEFAULT NULL,
  `sender_id` varchar(64) DEFAULT NULL,
  `format` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sno` int(8) NOT NULL,
  `status` varchar(10) NOT NULL DEFAULT 'active',
  `entity_id` varchar(64) DEFAULT NULL,
  `dlt_contnt_id` varchar(64) DEFAULT NULL,
  `temp_id` int(11) DEFAULT NULL,
  `temp_name` varchar(256) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test123`
--

CREATE TABLE `test123` (
  `sno` int(11) NOT NULL,
  `dt` varchar(40) DEFAULT NULL,
  `state` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `stat` varchar(20) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `testtest`
--

CREATE TABLE `testtest` (
  `sno` int(11) NOT NULL,
  `n_name` varchar(100) DEFAULT NULL,
  `c_name` varchar(50) DEFAULT NULL,
  `c_address` text DEFAULT NULL,
  `c_phone` varchar(20) DEFAULT NULL,
  `c_mobile` varchar(20) DEFAULT NULL,
  `c_email` varchar(100) DEFAULT NULL,
  `c_state` varchar(50) DEFAULT NULL,
  `c_city` varchar(50) DEFAULT NULL,
  `c_website` varchar(50) DEFAULT NULL,
  `c_stat` varchar(20) DEFAULT NULL,
  `dtimt` timestamp NOT NULL DEFAULT current_timestamp(),
  `dtdt` varchar(30) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trans`
--

CREATE TABLE `trans` (
  `sno` int(11) NOT NULL,
  `route` varchar(20) DEFAULT NULL,
  `userid` varchar(40) DEFAULT NULL,
  `parid` varchar(30) DEFAULT NULL,
  `incrcount` varchar(20) DEFAULT NULL,
  `logtime` timestamp NOT NULL DEFAULT current_timestamp(),
  `decrcount` varchar(20) DEFAULT NULL,
  `AME` varchar(10) DEFAULT NULL,
  `price` varchar(5) DEFAULT NULL,
  `totalcost` varchar(10) DEFAULT NULL,
  `paid` varchar(10) DEFAULT NULL,
  `od` varchar(10) DEFAULT NULL,
  `remarks` varchar(100) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trans2`
--

CREATE TABLE `trans2` (
  `sno` bigint(20) NOT NULL,
  `tid` bigint(20) DEFAULT NULL,
  `numbbe` varchar(15) DEFAULT NULL,
  `statuss` varchar(15) DEFAULT NULL,
  `updon` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bd` varchar(1) NOT NULL DEFAULT 'o',
  `SMSC` varchar(20) DEFAULT NULL,
  `ns` varchar(3) DEFAULT NULL,
  `dlt_contnt_id` varchar(64) DEFAULT NULL,
  `entity_id` varchar(125) DEFAULT NULL,
  `submit_status` tinyint(2) NOT NULL DEFAULT 0 COMMENT 'status for cron '
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trans2_bckup`
--

CREATE TABLE `trans2_bckup` (
  `id` int(11) NOT NULL,
  `sno` bigint(20) DEFAULT NULL,
  `tid` bigint(20) DEFAULT NULL,
  `numbbe` varchar(32) DEFAULT NULL,
  `statuss` varchar(15) DEFAULT NULL,
  `updon` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bd` varchar(1) DEFAULT NULL,
  `SMSC` varchar(20) DEFAULT NULL,
  `ns` varchar(3) DEFAULT NULL,
  `dlt_contnt_id` varchar(64) DEFAULT NULL,
  `entity_id` varchar(125) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `trans3`
-- (See below for the actual view)
--
CREATE TABLE `trans3` (
`userid` varchar(40)
,`incrcount` double
,`logtime` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `transections`
--

CREATE TABLE `transections` (
  `sno` int(20) NOT NULL,
  `userid` varchar(40) DEFAULT NULL,
  `nums` longtext DEFAULT NULL,
  `msg` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `route` varchar(20) DEFAULT NULL,
  `logtime` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `msgcnt` int(11) DEFAULT NULL,
  `msgtype` varchar(10) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `resp` varchar(30) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `sche` datetime DEFAULT NULL,
  `senttime` datetime DEFAULT NULL,
  `dnd_recredit` varchar(5) NOT NULL DEFAULT 'no' COMMENT 'dnd recredit',
  `smsc` varchar(30) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transections_bckup`
--

CREATE TABLE `transections_bckup` (
  `sno` int(20) NOT NULL,
  `userid` varchar(40) DEFAULT NULL,
  `nums` longtext DEFAULT NULL,
  `msg` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `route` varchar(20) DEFAULT NULL,
  `logtime` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `msgcnt` int(11) DEFAULT NULL,
  `msgtype` varchar(10) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `resp` varchar(30) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `sche` datetime DEFAULT NULL,
  `senttime` datetime DEFAULT NULL,
  `dnd_recredit` varchar(5) NOT NULL DEFAULT 'no' COMMENT 'dnd recredit',
  `smsc` varchar(30) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `transview`
-- (See below for the actual view)
--
CREATE TABLE `transview` (
`parid` varchar(30)
,`userid` varchar(40)
);

-- --------------------------------------------------------

--
-- Table structure for table `trans_template`
--

CREATE TABLE `trans_template` (
  `uid` varchar(125) DEFAULT NULL,
  `sender_id` varchar(125) DEFAULT NULL,
  `format` varchar(1000) DEFAULT NULL,
  `sno` int(8) NOT NULL,
  `route` varchar(20) NOT NULL DEFAULT 'Transectional',
  `status` varchar(10) NOT NULL DEFAULT 'active',
  `edefault` int(1) DEFAULT NULL,
  `report` text DEFAULT NULL,
  `entity_id` varchar(125) DEFAULT NULL,
  `dlt_contnt_id` varchar(64) DEFAULT NULL,
  `tm_id` varchar(100) DEFAULT NULL,
  `hash_value` varchar(255) DEFAULT NULL COMMENT 'Hash make 256 id',
  `temp_id` int(11) DEFAULT NULL,
  `temp_name` varchar(256) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `sno` int(11) NOT NULL,
  `login` varchar(125) DEFAULT NULL,
  `name` varchar(125) DEFAULT NULL,
  `company_name` varchar(125) DEFAULT NULL,
  `email_id` varchar(125) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(32) DEFAULT NULL,
  `ecode` varchar(10) DEFAULT NULL,
  `acc_mngr` varchar(40) DEFAULT NULL,
  `acc_mail` varchar(100) DEFAULT NULL,
  `website_url` varchar(125) DEFAULT NULL,
  `blog` varchar(100) DEFAULT NULL,
  `facebook` varchar(100) DEFAULT NULL,
  `linkedin` varchar(100) DEFAULT NULL,
  `twitter` varchar(100) DEFAULT NULL,
  `terms` varchar(100) DEFAULT NULL,
  `privacy` varchar(100) DEFAULT NULL,
  `dnd_bal` int(20) DEFAULT 0,
  `non_dnd_bal` int(12) DEFAULT 0,
  `trans_bal` int(12) DEFAULT 0,
  `prem_bal` int(12) NOT NULL DEFAULT 0,
  `voice_bal` int(12) DEFAULT 0,
  `dnd_bal_exp` date DEFAULT NULL,
  `credate` varchar(20) DEFAULT NULL,
  `expdate` varchar(20) DEFAULT NULL,
  `aboutus` text DEFAULT NULL,
  `pricing` text DEFAULT NULL,
  `services` text DEFAULT NULL,
  `contactus` text DEFAULT NULL,
  `home` text DEFAULT NULL,
  `prem-smsc` varchar(20) DEFAULT NULL,
  `trans-smsc` varchar(20) DEFAULT NULL,
  `rad_smsc` varchar(20) DEFAULT NULL,
  `cutting` int(11) NOT NULL DEFAULT 0,
  `login_id` int(11) DEFAULT NULL,
  `trans_cut` int(20) NOT NULL DEFAULT 10,
  `prem_cut` int(10) NOT NULL DEFAULT 10,
  `filter` varchar(5) NOT NULL DEFAULT 'no',
  `rfilter` varchar(5) NOT NULL DEFAULT 'no',
  `whitelist_st` varchar(8) NOT NULL DEFAULT 'enable',
  `blocklist_st` varchar(8) NOT NULL DEFAULT 'enable',
  `theme_set` varchar(20) DEFAULT NULL,
  `api_key` text DEFAULT NULL,
  `cfilter` varchar(250) DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_bkp`
--

CREATE TABLE `user_bkp` (
  `login` varchar(40) DEFAULT NULL,
  `name` varchar(40) DEFAULT NULL,
  `company_name` varchar(40) DEFAULT NULL,
  `email_id` varchar(40) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `ecode` varchar(10) DEFAULT NULL,
  `acc_mngr` varchar(40) DEFAULT NULL,
  `acc_mail` varchar(100) DEFAULT NULL,
  `website_url` varchar(40) DEFAULT NULL,
  `blog` varchar(100) DEFAULT NULL,
  `facebook` varchar(100) DEFAULT NULL,
  `linkedin` varchar(100) DEFAULT NULL,
  `twitter` varchar(100) DEFAULT NULL,
  `terms` varchar(100) DEFAULT NULL,
  `privacy` varchar(100) DEFAULT NULL,
  `dnd_bal` int(20) DEFAULT NULL,
  `non_dnd_bal` int(12) DEFAULT NULL,
  `trans_bal` int(12) DEFAULT NULL,
  `prem_bal` int(12) NOT NULL DEFAULT 0,
  `voice_bal` int(12) DEFAULT NULL,
  `dnd_bal_exp` date DEFAULT NULL,
  `credate` varchar(20) DEFAULT NULL,
  `expdate` varchar(20) DEFAULT NULL,
  `aboutus` text DEFAULT NULL,
  `pricing` text DEFAULT NULL,
  `services` text DEFAULT NULL,
  `contactus` text DEFAULT NULL,
  `home` text DEFAULT NULL,
  `prem-smsc` varchar(20) DEFAULT NULL,
  `trans-smsc` varchar(20) DEFAULT NULL,
  `rad_smsc` varchar(20) DEFAULT NULL,
  `cutting` int(11) NOT NULL DEFAULT 0,
  `trans_cut` int(20) NOT NULL DEFAULT 10,
  `filter` varchar(5) NOT NULL DEFAULT 'no',
  `rfilter` varchar(5) NOT NULL DEFAULT 'yes'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_bkp2`
--

CREATE TABLE `user_bkp2` (
  `login` varchar(40) DEFAULT NULL,
  `name` varchar(40) DEFAULT NULL,
  `company_name` varchar(40) DEFAULT NULL,
  `email_id` varchar(40) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `ecode` varchar(10) DEFAULT NULL,
  `acc_mngr` varchar(40) DEFAULT NULL,
  `acc_mail` varchar(100) DEFAULT NULL,
  `website_url` varchar(40) DEFAULT NULL,
  `blog` varchar(100) DEFAULT NULL,
  `facebook` varchar(100) DEFAULT NULL,
  `linkedin` varchar(100) DEFAULT NULL,
  `twitter` varchar(100) DEFAULT NULL,
  `terms` varchar(100) DEFAULT NULL,
  `privacy` varchar(100) DEFAULT NULL,
  `dnd_bal` int(20) DEFAULT NULL,
  `non_dnd_bal` int(12) DEFAULT NULL,
  `trans_bal` int(12) DEFAULT NULL,
  `prem_bal` int(12) NOT NULL DEFAULT 0,
  `voice_bal` int(12) DEFAULT NULL,
  `dnd_bal_exp` date DEFAULT NULL,
  `credate` varchar(20) DEFAULT NULL,
  `expdate` varchar(20) DEFAULT NULL,
  `aboutus` text DEFAULT NULL,
  `pricing` text DEFAULT NULL,
  `services` text DEFAULT NULL,
  `contactus` text DEFAULT NULL,
  `home` text DEFAULT NULL,
  `prem-smsc` varchar(20) DEFAULT NULL,
  `trans-smsc` varchar(20) DEFAULT NULL,
  `rad_smsc` varchar(20) DEFAULT NULL,
  `cutting` int(11) NOT NULL DEFAULT 0,
  `trans_cut` int(20) NOT NULL DEFAULT 10,
  `prem_cut` int(10) NOT NULL DEFAULT 10,
  `filter` varchar(5) NOT NULL DEFAULT 'no',
  `rfilter` varchar(5) NOT NULL DEFAULT 'yes',
  `whitelist_st` varchar(8) NOT NULL DEFAULT 'enable',
  `blocklist_st` varchar(8) NOT NULL DEFAULT 'enable',
  `theme_set` varchar(20) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_register`
--

CREATE TABLE `user_register` (
  `id` int(11) NOT NULL,
  `login` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `email_id` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(255) DEFAULT NULL,
  `credate` varchar(255) DEFAULT NULL,
  `expdate` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `page_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voice_api`
--

CREATE TABLE `voice_api` (
  `sno` int(11) NOT NULL,
  `userid` varchar(20) DEFAULT NULL,
  `callerId` varchar(10) NOT NULL DEFAULT 'Default',
  `format` varchar(1000) NOT NULL DEFAULT 'http://www.routevoice.com/httpApi/genCalls.php?user=goodpicsvoice&pwd=good123&jobType=http-audio&dest=[number@$]&msg=[msg@$]&campName=[camp@$]',
  `report` varchar(1000) NOT NULL DEFAULT 'http://routevoice.com/httpApi/cdr.php?user=goodpicsvoice&pwd=good123&dtDate=$date',
  `status` varchar(10) NOT NULL DEFAULT 'active',
  `pulse` int(5) NOT NULL DEFAULT 30,
  `filter` varchar(20) NOT NULL DEFAULT 'NDND',
  `push_type` varchar(20) NOT NULL DEFAULT 'Submission'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voice_report`
--

CREATE TABLE `voice_report` (
  `sno` bigint(20) NOT NULL,
  `tid` bigint(20) DEFAULT NULL,
  `callerId` varchar(15) DEFAULT NULL,
  `number` varchar(15) DEFAULT NULL,
  `operator` varchar(30) DEFAULT NULL,
  `circle` varchar(30) DEFAULT NULL,
  `pulse` varchar(5) DEFAULT NULL,
  `duration` varchar(10) DEFAULT NULL,
  `cost` varchar(10) DEFAULT NULL,
  `status` varchar(15) DEFAULT NULL,
  `update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `statuscode` int(15) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voice_report1`
--

CREATE TABLE `voice_report1` (
  `sno` bigint(20) NOT NULL,
  `tid` bigint(20) DEFAULT NULL,
  `destination` varchar(15) DEFAULT NULL,
  `source` varchar(15) DEFAULT NULL,
  `operator` varchar(20) DEFAULT NULL,
  `circle` varchar(20) DEFAULT NULL,
  `pulses` int(5) DEFAULT NULL,
  `duration` int(5) DEFAULT NULL,
  `totalcost` float DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `sdate` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voice_trans`
--

CREATE TABLE `voice_trans` (
  `sno` int(11) NOT NULL,
  `userid` varchar(20) DEFAULT NULL,
  `callerId` varchar(10) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `camptype` varchar(20) DEFAULT NULL,
  `nums` longtext DEFAULT NULL,
  `numcnt` int(10) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  `logtime` datetime DEFAULT NULL,
  `schetime` datetime DEFAULT NULL,
  `audioLink` text DEFAULT NULL,
  `pulse` int(5) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `whitelist_num`
--

CREATE TABLE `whitelist_num` (
  `sno` int(11) NOT NULL,
  `num` varchar(12) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blocklist_num`
--
ALTER TABLE `blocklist_num`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `cron_limit`
--
ALTER TABLE `cron_limit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dlrurl`
--
ALTER TABLE `dlrurl`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `invalid_attempts`
--
ALTER TABLE `invalid_attempts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kannel_status`
--
ALTER TABLE `kannel_status`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`uid`);

--
-- Indexes for table `new_sms_status`
--
ALTER TABLE `new_sms_status`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `new_trans2`
--
ALTER TABLE `new_trans2`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `new_trans_status`
--
ALTER TABLE `new_trans_status`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `phonebook`
--
ALTER TABLE `phonebook`
  ADD UNIQUE KEY `sno` (`sno`);

--
-- Indexes for table `sent_cnt`
--
ALTER TABLE `sent_cnt`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `smsc`
--
ALTER TABLE `smsc`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `summery_report`
--
ALTER TABLE `summery_report`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_camp`
--
ALTER TABLE `tbl_camp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_class`
--
ALTER TABLE `tbl_class`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_dyn_camp`
--
ALTER TABLE `tbl_dyn_camp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_otp`
--
ALTER TABLE `tbl_otp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_reports`
--
ALTER TABLE `tbl_reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_section`
--
ALTER TABLE `tbl_section`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_shree`
--
ALTER TABLE `tbl_shree`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_sms_api_push`
--
ALTER TABLE `tbl_sms_api_push`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_sms_api_push_fake`
--
ALTER TABLE `tbl_sms_api_push_fake`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_student`
--
ALTER TABLE `tbl_student`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_student_send`
--
ALTER TABLE `tbl_student_send`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `templates_app`
--
ALTER TABLE `templates_app`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `test123`
--
ALTER TABLE `test123`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `testtest`
--
ALTER TABLE `testtest`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `trans`
--
ALTER TABLE `trans`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `trans2`
--
ALTER TABLE `trans2`
  ADD PRIMARY KEY (`sno`),
  ADD KEY `tid` (`tid`),
  ADD KEY `numbbe` (`numbbe`);

--
-- Indexes for table `trans2_bckup`
--
ALTER TABLE `trans2_bckup`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transections`
--
ALTER TABLE `transections`
  ADD PRIMARY KEY (`sno`),
  ADD KEY `sno` (`sno`);

--
-- Indexes for table `transections_bckup`
--
ALTER TABLE `transections_bckup`
  ADD PRIMARY KEY (`sno`),
  ADD KEY `sno` (`sno`);

--
-- Indexes for table `trans_template`
--
ALTER TABLE `trans_template`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`sno`),
  ADD KEY `login` (`login`),
  ADD KEY `website_url` (`website_url`);

--
-- Indexes for table `user_bkp`
--
ALTER TABLE `user_bkp`
  ADD KEY `login` (`login`),
  ADD KEY `website_url` (`website_url`),
  ADD KEY `login_2` (`login`);

--
-- Indexes for table `user_bkp2`
--
ALTER TABLE `user_bkp2`
  ADD KEY `login` (`login`),
  ADD KEY `website_url` (`website_url`);

--
-- Indexes for table `user_register`
--
ALTER TABLE `user_register`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `voice_api`
--
ALTER TABLE `voice_api`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `voice_report`
--
ALTER TABLE `voice_report`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `voice_report1`
--
ALTER TABLE `voice_report1`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `voice_trans`
--
ALTER TABLE `voice_trans`
  ADD PRIMARY KEY (`sno`);

--
-- Indexes for table `whitelist_num`
--
ALTER TABLE `whitelist_num`
  ADD PRIMARY KEY (`sno`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blocklist_num`
--
ALTER TABLE `blocklist_num`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cron_limit`
--
ALTER TABLE `cron_limit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dlrurl`
--
ALTER TABLE `dlrurl`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invalid_attempts`
--
ALTER TABLE `invalid_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kannel_status`
--
ALTER TABLE `kannel_status`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `uid` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `new_sms_status`
--
ALTER TABLE `new_sms_status`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `new_trans2`
--
ALTER TABLE `new_trans2`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `new_trans_status`
--
ALTER TABLE `new_trans_status`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phonebook`
--
ALTER TABLE `phonebook`
  MODIFY `sno` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sent_cnt`
--
ALTER TABLE `sent_cnt`
  MODIFY `sno` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `smsc`
--
ALTER TABLE `smsc`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `summery_report`
--
ALTER TABLE `summery_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_camp`
--
ALTER TABLE `tbl_camp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_class`
--
ALTER TABLE `tbl_class`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_dyn_camp`
--
ALTER TABLE `tbl_dyn_camp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_otp`
--
ALTER TABLE `tbl_otp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reports`
--
ALTER TABLE `tbl_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_section`
--
ALTER TABLE `tbl_section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_shree`
--
ALTER TABLE `tbl_shree`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_sms_api_push`
--
ALTER TABLE `tbl_sms_api_push`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_sms_api_push_fake`
--
ALTER TABLE `tbl_sms_api_push_fake`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_student`
--
ALTER TABLE `tbl_student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_student_send`
--
ALTER TABLE `tbl_student_send`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `templates`
--
ALTER TABLE `templates`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `templates_app`
--
ALTER TABLE `templates_app`
  MODIFY `sno` int(8) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `test123`
--
ALTER TABLE `test123`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `testtest`
--
ALTER TABLE `testtest`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trans`
--
ALTER TABLE `trans`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trans2`
--
ALTER TABLE `trans2`
  MODIFY `sno` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trans2_bckup`
--
ALTER TABLE `trans2_bckup`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transections`
--
ALTER TABLE `transections`
  MODIFY `sno` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transections_bckup`
--
ALTER TABLE `transections_bckup`
  MODIFY `sno` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trans_template`
--
ALTER TABLE `trans_template`
  MODIFY `sno` int(8) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_register`
--
ALTER TABLE `user_register`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voice_api`
--
ALTER TABLE `voice_api`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voice_report`
--
ALTER TABLE `voice_report`
  MODIFY `sno` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voice_report1`
--
ALTER TABLE `voice_report1`
  MODIFY `sno` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voice_trans`
--
ALTER TABLE `voice_trans`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `whitelist_num`
--
ALTER TABLE `whitelist_num`
  MODIFY `sno` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `trans3`
--
DROP TABLE IF EXISTS `trans3`;

CREATE ALGORITHM=UNDEFINED DEFINER=`smsby2`@`localhost` SQL SECURITY DEFINER VIEW `trans3`  AS SELECT `trans`.`userid` AS `userid`, sum(`trans`.`incrcount`) AS `incrcount`, `trans`.`logtime` AS `logtime` FROM `trans` GROUP BY `trans`.`userid` ;

-- --------------------------------------------------------

--
-- Structure for view `transview`
--
DROP TABLE IF EXISTS `transview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`smsby2`@`localhost` SQL SECURITY DEFINER VIEW `transview`  AS SELECT DISTINCT `trans`.`parid` AS `parid`, `trans`.`userid` AS `userid` FROM `trans` ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
