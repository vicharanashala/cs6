import permissions from "../config/permissions.js";

const allow = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User role not specified"
      });
    }

    const userRole = req.user.role;
    const userPermissions = permissions[userRole];

    if (!userPermissions || !userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission: ${requiredPermission}`
      });
    }

    next();
  };
};

export default allow;
