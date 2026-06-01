import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes a string value using DOMPurify
 * @param {string} val 
 * @returns {string}
 */
export const sanitizeString = (val) => {
  if (typeof val !== 'string') return val;
  return DOMPurify.sanitize(val);
};

/**
 * Recursively traverses and sanitizes all string properties in an object/array
 * @param {Object|Array} obj 
 * @returns {Object|Array}
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        obj[key] = sanitizeString(val);
      } else if (typeof val === 'object' && val !== null) {
        obj[key] = sanitizeObject(val);
      }
    }
  }
  
  return obj;
};

/**
 * Express middleware to automatically sanitize req.body text inputs to prevent XSS
 */
export const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};
