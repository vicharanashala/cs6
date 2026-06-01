import crypto from 'crypto';

// Helper to parse cookies from headers
const parseCookies = (cookieHeader) => {
  const list = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    });
  }
  return list;
};

/**
 * Double-submit cookie CSRF validation middleware
 */
export const csrfProtection = (req, res, next) => {
  // Skip check for safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookies = parseCookies(req.headers.cookie);
  const csrfCookie = cookies['_csrf'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_ERROR',
        message: 'CSRF token validation failed. Please refresh and try again.'
      }
    });
  }

  next();
};

/**
 * Endpoint controller to generate and send a new CSRF token
 */
export const getCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set cookie
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('_csrf', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour expiry
  });

  return res.status(200).json({
    success: true,
    data: {
      csrfToken: token
    }
  });
};
