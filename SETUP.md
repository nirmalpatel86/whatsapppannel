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
Opens at the URL react-scripts prints (reads `PORT` from `frontend/.env`, default `3000`; this repo's local setup uses `4000` to avoid port clashes — see `frontend/.env`).

### 4. Logging In
The login page has a service selector (WhatsApp / SMS / BulkMail). Pick a service, then sign in with that service's credentials — each service keeps its own users, wallet balance, and data, isolated in its own database.

## Deploying to a Server (Production)

Assumes a fresh Ubuntu/Debian VPS with a domain pointed at it. Run as a non-root user with sudo.

### 1. Install prerequisites on the server
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs mysql-server nginx git
sudo npm install -g pm2
```

### 2. Clone the repo
```bash
git clone -b main https://github.com/nirmalpatel86/whatsapppannel.git
cd whatsapppannel
```
(Use `-b dev` instead of `-b main` if you want to deploy the dev branch.)

### 3. Set up the databases
```bash
sudo mysql -e "CREATE DATABASE whatsapp_panel; CREATE DATABASE sms_panel; CREATE DATABASE bulkmail_panel;"
sudo mysql -e "CREATE USER 'panel_app'@'localhost' IDENTIFIED BY 'a_strong_password'; GRANT ALL ON whatsapp_panel.* TO 'panel_app'@'localhost'; GRANT ALL ON sms_panel.* TO 'panel_app'@'localhost'; GRANT ALL ON bulkmail_panel.* TO 'panel_app'@'localhost'; FLUSH PRIVILEGES;"
```

### 4. Configure and start the backend
```bash
cd backend
cp .env.example .env
nano .env   # set DB_USER/DB_PASSWORD (and SMS_DB_*/BULKMAIL_DB_*) to panel_app's credentials,
            # and change JWT_SECRET to a long random string — do not use the example value in production
npm install --production
pm2 start server.js --name whatsapp-panel-api
pm2 save
pm2 startup   # follow the printed command once, so pm2 restarts the app on server reboot
```
The backend listens on `PORT` from `.env` (default `3001`; this repo's local setup uses `4001` to avoid port clashes). It auto-creates all tables and seeds the default super admins on first run — **log in once per service and change the `admin123` password immediately.**

### 5. Build and serve the frontend
The frontend needs to know the backend's public URL *before* building (it's baked into the static bundle):
```bash
cd ../frontend
echo "REACT_APP_API_URL=https://yourdomain.com/api" > .env
npm install
npm run build
```
This produces a static `build/` folder — it is not a running server, so serve it with nginx.

### 6. Nginx: serve the frontend + reverse-proxy the API
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/whatsapppannel/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;   # React Router needs this fallback
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;   # needed for the WhatsApp chat Socket.IO connection
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
```bash
sudo nano /etc/nginx/sites-available/whatsapp-panel   # paste the config above
sudo ln -s /etc/nginx/sites-available/whatsapp-panel /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com   # free HTTPS cert, auto-configures nginx for SSL
```

### 7. Pulling future updates
```bash
cd whatsapppannel
git pull origin main
cd backend && npm install && pm2 restart whatsapp-panel-api
cd ../frontend && npm install && npm run build   # nginx picks up the new build/ immediately, no reload needed
```

### Useful pm2 commands
- `pm2 logs whatsapp-panel-api` — tail backend logs
- `pm2 restart whatsapp-panel-api` — restart after a code/env change
- `pm2 status` — check it's running

## Architecture

### Services
| Service | Database | Accent Color | API Prefix |
|---------|----------|---------------|------------|
| WhatsApp | `whatsapp_panel` | `#25D366` | `/api/*` |
| SMS | `sms_panel` | `#3B82F6` | `/api/sms/*` |
| BulkMail | `bulkmail_panel` | `#EF4444` | `/api/bulkmail/*` |

Each service is fully independent end to end: separate Sequelize connection, separate models, separate auth middleware, separate JWT (`service` field in the token), and separate frontend pages (`frontend/src/pages/sms/`, `frontend/src/pages/bulkmail/`). A token issued for one service is rejected by the other services' auth middleware.

### WhatsApp Media Storage
Chat/campaign attachments — both sent and received — are saved to `backend/uploads/` on local disk (served at `/uploads/*`). Incoming media is downloaded automatically for every message, so this folder grows on its own regardless of server capacity. To keep it from filling the disk, `backend/utils/cleanupUploads.js` runs once on server start and then daily at 3 AM, deleting any file older than `UPLOAD_RETENTION_DAYS` (`.env`, default 30). Raise this value if you need to keep media longer, or move to S3/R2-backed storage if you need it kept indefinitely at scale.

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
