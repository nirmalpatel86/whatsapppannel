# Leadofy Panel - Setup Guide

A unified communication platform covering three services — **WhatsApp**, **SMS**, and **BulkMail** — sharing one React frontend and one Node backend, each with its own MySQL database.

## Prerequisites
- Node.js 18+
- MySQL 8.0+ (or MariaDB 10.4+)

## Quick Start

### 1. Database Setup
Create the three MySQL databases (one per service):
```sql
CREATE DATABASE whatsapp_panel;
CREATE DATABASE sms_panel;
CREATE DATABASE bulkmail_panel;
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials for all three databases
npm install
npm start
```
The server auto-creates all tables in all three databases and seeds a default super admin **per service**:
- Phone: `9999999999`
- Password: `admin123`

(WhatsApp's super admin also has email `admin@admin.com`.)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Opens at http://localhost:3000

### 4. Logging In
The login page has a service selector (WhatsApp / SMS / BulkMail). Pick a service, then sign in with that service's credentials — each service keeps its own users, wallet balance, and data, isolated in its own database.

## Architecture

### Services
| Service | Database | Accent Color | API Prefix |
|---------|----------|---------------|------------|
| WhatsApp | `whatsapp_panel` | `#25D366` | `/api/*` |
| SMS | `sms_panel` | `#3B82F6` | `/api/sms/*` |
| BulkMail | `bulkmail_panel` | `#EF4444` | `/api/bulkmail/*` |

Each service is fully independent end to end: separate Sequelize connection, separate models, separate auth middleware, separate JWT (`service` field in the token), and separate frontend pages (`frontend/src/pages/sms/`, `frontend/src/pages/bulkmail/`). A token issued for one service is rejected by the other services' auth middleware.

### Roles & Permissions (same hierarchy across all 3 services)
| Feature | Super Admin | Reseller | User |
|---------|-------------|----------|------|
| Manage Companies | Yes | No | No |
| Manage Users | All | Own company | No |
| Routes / SMTP / Sender IDs | All | Approve/own company | View only |
| Templates | All | Own company | No |
| Campaigns | All | Own company | Own company |
| Wallet Recharge | Recharge anyone | Recharge own users | No |

### Tech Stack
- **Frontend**: React 19, React Router, Socket.IO Client (WhatsApp only)
- **Backend**: Node.js, Express 5, Sequelize ORM
- **Database**: MySQL — 3 separate schemas, no cross-database joins
- **WhatsApp**: Baileys (designed for Meta Cloud API migration)
- **SMS**: HTTP gateway routes (kannel-style), DLT-aware templates/sender IDs
- **BulkMail**: Nodemailer over configurable SMTP servers, sender rotation, open/click/unsubscribe tracking
- **Real-time**: Socket.IO (WhatsApp chats only)

### Module Breakdown

**SMS** (migrated from the legacy `smsby2` Core PHP project)
- Routes (transactional/promotional/otp/premium), Sender IDs, DLT Templates
- Campaigns with per-recipient delivery tracking and SMS-count calculation (160-char GSM / 70-char Unicode boundaries)
- Contacts, Groups, Blocklist/DND, Wallet (balance in SMS units), API Keys

**BulkMail** (migrated from the legacy `bulkmail` CodeIgniter project)
- SMTP servers, Senders, Sender Groups (rotation), HTML Templates
- Campaigns with open-pixel tracking, link-click tracking, unsubscribe handling, variable substitution
- Contacts (with custom columns), Contact Groups, Wallet (balance in email units), Plans, API Keys

### Meta Cloud API Migration Path (WhatsApp)
The database schema includes fields for:
- `metaBusinessId`, `metaAccessToken` on Company
- `metaPhoneNumberId`, `metaWabaId`, `provider` on WhatsappAccount
- `metaTemplateId` on MessageTemplate
- Template approval workflow (draft -> pending -> approved)
- Embedded Signup fields ready for Meta onboarding

### Conventions
- All entity references use numeric IDs (foreign keys) — no hardcoded names anywhere in business logic.
- Each service's models, controllers, and routes live under their own subfolder (`models/sms`, `controllers/sms`, `routes/sms`, etc.) mirroring the WhatsApp originals 1:1.
