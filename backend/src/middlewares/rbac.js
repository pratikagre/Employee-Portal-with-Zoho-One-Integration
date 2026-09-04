const AuditModel = require('../models/auditModel');

/**
 * RBAC Role Verification Middleware
 * Matches prompt example and extends it with multi-role checks and automatic security audit logging.
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User context missing' });
    }

    const userRoles = req.user.roles || [];
    
    // Check if user has any of the allowed roles (Admin is permitted everywhere)
    const hasRole = allowedRoles.some(role => userRoles.includes(role)) || userRoles.includes('Admin');

    if (!hasRole) {
      // Audit log the forbidden attempt
      AuditModel.create({
        userId: req.user.id,
        userEmail: req.user.email,
        role: userRoles.join(', '),
        action: 'UNAUTHORIZED_ATTEMPT',
        resource: req.originalUrl,
        status: 'FORBIDDEN',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        details: `Forbidden role access. Required: [${allowedRoles.join(', ')}], User has: [${userRoles.join(', ')}]`,
      });

      return res.status(403).json({
        success: false,
        message: `Access Denied: Insufficient Permissions. Your role (${userRoles.join(', ')}) is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}`,
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
};

/**
 * RBAC Fine-Grained Permission Verification Middleware
 */
const verifyPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User context missing' });
    }

    const userPermissions = req.user.permissions || [];
    const isSuperAdmin = (req.user.roles || []).includes('Admin') || userPermissions.includes('admin:all');

    if (!isSuperAdmin && !userPermissions.includes(requiredPermission)) {
      AuditModel.create({
        userId: req.user.id,
        userEmail: req.user.email,
        role: (req.user.roles || []).join(', '),
        action: 'UNAUTHORIZED_ATTEMPT',
        resource: req.originalUrl,
        status: 'FORBIDDEN',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        details: `Forbidden permission access. Required: ${requiredPermission}`,
      });

      return res.status(403).json({
        success: false,
        message: `Access Denied: Missing permission '${requiredPermission}'`,
        code: 'FORBIDDEN_PERMISSION',
      });
    }

    next();
  };
};

/**
 * Middleware to enforce Zoho Service access strictly based on role
 * HR -> Zoho People
 * Sales -> Zoho CRM
 * Support -> Zoho Desk
 * Finance -> Zoho Books
 * Admin -> All
 */
const verifyZohoServiceAccess = (req, res, next) => {
  const service = req.params.service ? req.params.service.toLowerCase() : '';
  const userRoles = req.user.roles || [];

  if (userRoles.includes('Admin')) {
    return next();
  }

  const roleServiceMap = {
    people: ['HR', 'Manager'],
    crm: ['Sales', 'Manager'],
    desk: ['Support', 'Manager'],
    books: ['Finance'],
  };

  const allowedRoles = roleServiceMap[service];

  if (!allowedRoles || !allowedRoles.some(r => userRoles.includes(r))) {
    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: userRoles.join(', '),
      action: 'UNAUTHORIZED_ZOHO_ACCESS',
      resource: `/api/zoho/${service}`,
      status: 'FORBIDDEN',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: `User attempted to access unauthorized Zoho application: '${service}'`,
    });

    return res.status(403).json({
      success: false,
      message: `Access Denied: You do not have authorization to access the Zoho ${service.toUpperCase()} application.`,
      code: 'UNAUTHORIZED_ZOHO_SERVICE',
    });
  }

  next();
};

module.exports = {
  verifyRole,
  verifyPermission,
  verifyZohoServiceAccess,
};
