import AuditLog from '../models/AuditLog.js';

/**
 * Helper to log security-sensitive events
 * @param {Object} params
 * @param {Object} [params.req] Optional Express request object to auto-extract IP/userAgent/user
 * @param {string} params.action Action performed (e.g. 'login_failed', 'role_changed')
 * @param {string} [params.performedBy] Optional user ID performing the action
 * @param {string} [params.targetType] Type of resource target
 * @param {string} [params.targetId] ID of target resource
 * @param {string} [params.ip] Optional IP address override
 * @param {string} [params.userAgent] Optional User-Agent string override
 * @param {Object} [params.details] Execution details/metadata
 */
export const logSecurityEvent = async ({
  req,
  action,
  performedBy,
  targetType = 'auth',
  targetId,
  ip,
  userAgent,
  details
}) => {
  try {
    const logIp = ip || (req ? req.ip || req.headers['x-forwarded-for'] : null);
    const logUserAgent = userAgent || (req ? req.headers['user-agent'] : null);
    const logUser = performedBy || (req && req.user ? req.user.userId : null);

    await AuditLog.create({
      action,
      performedBy: logUser,
      targetType,
      targetId,
      ip: logIp,
      userAgent: logUserAgent,
      details
    });
  } catch (error) {
    console.error('⚠️ Failed to write audit log:', error);
  }
};
