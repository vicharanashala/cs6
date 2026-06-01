import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields: Object.fromEntries(errors.array().map(e => [e.path || e.param, e.msg]))
      }
    });
  }
  next();
};

export const validateZod = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
      next();
    } catch (error) {
      // Guard against non-Zod errors (e.g. generic runtime errors)
      if (!error.issues) {
        return next(error);
      }

      const fields = {};
      error.issues.forEach(issue => {
        // Strip out 'body', 'query', or 'params' prefix from error path
        const path = issue.path.slice(1).join('.');
        fields[path || 'value'] = issue.message;
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields
        }
      });
    }
  };
};
