export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authentication credentials'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: Requires role: ${allowedRoles.join(' or ')}`
        }
      });
    }

    next();
  };
};

export const requireOwnerOrRole = (Model, authorField = 'author', roles = ['admin', 'moderator']) => {
  return async (req, res, next) => {
    try {
      // Look for standard params: aid, id, targetId
      const id = req.params.aid || req.params.id || req.params.targetId;
      
      const doc = await Model.findById(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found'
          }
        });
      }

      // Check if user is creator
      const docAuthorId = doc[authorField] ? doc[authorField].toString() : null;
      const isOwner = docAuthorId && docAuthorId === req.user.userId;
      
      // Check if user has admin/mod privileges
      const hasPrivilege = roles.includes(req.user.role);

      if (!isOwner && !hasPrivilege) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Forbidden: You must be the owner of this resource or have administrative privileges.'
          }
        });
      }

      req.resource = doc; // Cache resource on request to avoid double querying
      next();
    } catch (error) {
      next(error);
    }
  };
};
