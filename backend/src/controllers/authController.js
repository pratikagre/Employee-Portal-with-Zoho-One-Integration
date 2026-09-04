const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');
const zohoService = require('../services/zohoService');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = UserModel.findByEmail(email);
    if (!user) {
      AuditModel.create({
        userEmail: email,
        role: 'Unknown',
        action: 'LOGIN',
        resource: '/api/auth/login',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: 'Failed login attempt: User does not exist.',
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.is_active) {
      AuditModel.create({
        userId: user.id,
        userEmail: user.email,
        role: user.roles.join(', '),
        action: 'LOGIN',
        resource: '/api/auth/login',
        status: 'FORBIDDEN',
        ipAddress,
        userAgent,
        details: 'Failed login attempt: Account is deactivated.',
      });

      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an Administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      AuditModel.create({
        userId: user.id,
        userEmail: user.email,
        role: user.roles.join(', '),
        action: 'LOGIN',
        resource: '/api/auth/login',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: 'Failed login attempt: Incorrect password.',
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
      name: `${user.first_name} ${user.last_name}`,
    };

    const secret = process.env.JWT_SECRET || 'zoho_portal_jwt_secret_key_production_grade_super_secure_2026';
    const token = jwt.sign(tokenPayload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // Record successful login in audit logs
    AuditModel.create({
      userId: user.id,
      userEmail: user.email,
      role: user.roles.join(', '),
      action: 'LOGIN',
      resource: '/api/auth/login',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: `Successful login as role: [${user.roles.join(', ')}]`,
    });

    // Sanitize user object
    const { password_hash, ...safeUser } = user;

    // Fetch authorized Zoho apps
    const authorizedServices = zohoService.getAuthorizedServices(user.roles);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        ...safeUser,
        authorizedServices,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred during authentication.',
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = req.user;
    const { password_hash, ...safeUser } = user;
    const authorizedServices = zohoService.getAuthorizedServices(user.roles);

    return res.status(200).json({
      success: true,
      user: {
        ...safeUser,
        authorizedServices,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      AuditModel.create({
        userId: req.user.id,
        userEmail: req.user.email,
        role: req.user.roles.join(', '),
        action: 'LOGOUT',
        resource: '/api/auth/logout',
        status: 'SUCCESS',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        details: 'User logged out of employee portal.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process logout.',
    });
  }
};
