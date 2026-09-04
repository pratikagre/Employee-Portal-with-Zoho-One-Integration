const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middlewares/auth');
const { verifyRole } = require('../middlewares/rbac');

// All admin routes require valid JWT and Admin role
router.use(authenticateToken);
router.use(verifyRole(['Admin']));

// System stats
router.get('/stats', adminController.getSystemStats);

// User management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Roles and permissions management
router.get('/roles', adminController.getRoles);
router.put('/roles/:roleId/permissions', adminController.updateRolePermissions);
router.get('/permissions', adminController.getPermissions);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
