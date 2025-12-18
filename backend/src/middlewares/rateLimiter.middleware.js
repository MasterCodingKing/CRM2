const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime.getTime() - Date.now()) / 1000;
    const minutes = Math.ceil(retryAfter / 60);
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: `You've exceeded the maximum login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      retryAfter: retryAfter, // seconds
      retryAfterMinutes: minutes,
      limit: req.rateLimit.limit,
      current: req.rateLimit.current
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime.getTime() - Date.now()) / 1000;
    const minutes = Math.ceil(retryAfter / 60);
    
    res.status(429).json({
      error: 'Too many requests',
      message: `You've exceeded the request limit. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      retryAfter: retryAfter, // seconds
      retryAfterMinutes: minutes,
      limit: req.rateLimit.limit,
      current: req.rateLimit.current
    });
  }
});

module.exports = { authLimiter, apiLimiter };
