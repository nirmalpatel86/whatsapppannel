const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Deletes files in backend/uploads/ older than RETENTION_DAYS (env UPLOAD_RETENTION_DAYS, default 30).
 * This is WhatsApp chat/campaign media (both sent and received) — the only thing written to local
 * disk by this app. Without this, the uploads folder grows forever since incoming media is saved
 * automatically for every chat, regardless of how much disk space is available.
 */
function cleanupOldUploads() {
  const retentionDays = parseInt(process.env.UPLOAD_RETENTION_DAYS) || 30;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  if (!fs.existsSync(UPLOADS_DIR)) return;

  let deleted = 0;
  let freedBytes = 0;

  for (const fileName of fs.readdirSync(UPLOADS_DIR)) {
    const filePath = path.join(UPLOADS_DIR, fileName);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
      if (stat.mtimeMs < cutoff) {
        freedBytes += stat.size;
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch (err) {
      console.error(`Upload cleanup: failed to process ${fileName}:`, err.message);
    }
  }

  if (deleted > 0) {
    console.log(`Upload cleanup: deleted ${deleted} file(s) older than ${retentionDays} days, freed ${(freedBytes / 1024 / 1024).toFixed(2)} MB`);
  }
}

module.exports = { cleanupOldUploads };
