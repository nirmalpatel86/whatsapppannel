const rateLimit = require('express-rate-limit');

// Brute-force protection on login: a handful of attempts per IP+phone combo
// isn't unusual (typos), but dozens in a few minutes is a password-guessing attempt.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
});

// Registration abuse (mass fake-account creation) is slower-moving than login
// guessing, so a stricter per-IP cap is fine.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' },
});

module.exports = { loginLimiter, registerLimiter };
