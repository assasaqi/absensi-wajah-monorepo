import rateLimit from 'express-rate-limit'

/**
 * 3.3 Rate Limiting: /api/auth/login (max 5 req/min)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message:
      'Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit (maksimal 5 request/menit).',
  },
})

/**
 * 3.3 Rate Limiting: /api/attendance/scan (protects face vector computation against DDoS)
 */
export const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message:
      'Batas laju pemindaian wajah terlampaui. Silakan tunggu beberapa saat sebelum memindai ulang.',
  },
})
