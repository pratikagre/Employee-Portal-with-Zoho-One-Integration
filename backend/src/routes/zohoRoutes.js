const express = require('express');
const router = express.Router();
const zohoController = require('../controllers/zohoController');
const authenticateToken = require('../middlewares/auth');
const { verifyZohoServiceAccess } = require('../middlewares/rbac');

// Base authentication applied to all Zoho endpoints
router.use(authenticateToken);

// Get overall integration status
router.get('/status', zohoController.getIntegrationStatus);

// Get list of authorized services for current user
router.get('/services', zohoController.getAuthorizedServices);

// Role-enforced endpoints for specific Zoho apps (HR -> People, Sales -> CRM, Support -> Desk, Finance -> Books, Admin -> All)
router.get('/:service', verifyZohoServiceAccess, zohoController.getServiceData);
router.get('/:service/launch', verifyZohoServiceAccess, zohoController.launchService);

module.exports = router;
