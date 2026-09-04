const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const RoleModel = require('../models/roleModel');
const AuditModel = require('../models/auditModel');

// --- USER MANAGEMENT ---

exports.getUsers = (req, res) => {
  try {
    const users = UserModel.getAllUsers();
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user list.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, roleIds } = req.body;

    if (!email || !password || !firstName || !lastName || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields (email, password, firstName, lastName, department) are required.',
      });
    }

    const existing = UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = UserModel.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      department,
      roleIds: roleIds || [],
    });

    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.roles.join(', '),
      action: 'CREATE_USER',
      resource: `/api/admin/users/${newUser.id}`,
      status: 'SUCCESS',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: `Created new user ${email} with roles: [${newUser.roles.join(', ')}]`,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, department, is_active, roleIds } = req.body;

    const updated = UserModel.updateUser(Number(id), {
      email,
      firstName,
      lastName,
      department,
      is_active,
      roleIds,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.roles.join(', '),
      action: 'UPDATE_USER',
      resource: `/api/admin/users/${id}`,
      status: 'SUCCESS',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: `Updated user ID ${id} (${updated.email}). Roles: [${updated.roles.join(', ')}]`,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updated,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own active account.',
      });
    }

    const success = UserModel.deleteUser(Number(id));
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.roles.join(', '),
      action: 'DELETE_USER',
      resource: `/api/admin/users/${id}`,
      status: 'SUCCESS',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: `Deleted user with ID ${id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

// --- ROLES & PERMISSIONS ---

exports.getRoles = (req, res) => {
  try {
    const roles = RoleModel.getAllRoles();
    return res.status(200).json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve roles.' });
  }
};

exports.getPermissions = (req, res) => {
  try {
    const permissions = RoleModel.getAllPermissions();
    return res.status(200).json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve permissions.' });
  }
};

exports.updateRolePermissions = (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ success: false, message: 'permissionIds must be an array of IDs.' });
    }

    const updated = RoleModel.updateRolePermissions(Number(roleId), permissionIds);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.roles.join(', '),
      action: 'UPDATE_ROLE_PERMISSIONS',
      resource: `/api/admin/roles/${roleId}/permissions`,
      status: 'SUCCESS',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      details: `Updated permissions for role ${updated.name} (Role ID: ${roleId})`,
    });

    return res.status(200).json({
      success: true,
      message: `Permissions updated for role ${updated.name}`,
      role: updated,
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return res.status(500).json({ success: false, message: 'Failed to update role permissions.' });
  }
};

// --- AUDIT LOGS & STATS ---

exports.getAuditLogs = (req, res) => {
  try {
    const { limit = 50, offset = 0, action, userEmail, status, startDate, endDate } = req.query;

    const result = AuditModel.getLogs({
      limit: Number(limit),
      offset: Number(offset),
      action,
      userEmail,
      status,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};

exports.getSystemStats = (req, res) => {
  try {
    const users = UserModel.getAllUsers();
    const roles = RoleModel.getAllRoles();
    const auditStats = AuditModel.getStats();

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        totalRoles: roles.length,
        ...auditStats,
      },
    });
  } catch (error) {
    console.error('Error retrieving system stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve system statistics.' });
  }
};
