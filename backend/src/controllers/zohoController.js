const zohoService = require('../services/zohoService');
const AuditModel = require('../models/auditModel');

exports.getAuthorizedServices = (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const services = zohoService.getAuthorizedServices(userRoles);

    return res.status(200).json({
      success: true,
      roles: userRoles,
      services,
    });
  } catch (error) {
    console.error('Error fetching authorized services:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve authorized services.',
    });
  }
};

exports.getServiceData = async (req, res) => {
  const { service } = req.params;
  const { action = 'overview' } = req.query;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  try {
    const data = await zohoService.fetchServiceData(service.toLowerCase(), action);

    // Record authorized access in audit log
    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.roles.join(', '),
      action: `ZOHO_${service.toUpperCase()}_ACCESS`,
      resource: `/api/zoho/${service}`,
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: `Successfully accessed Zoho ${service.toUpperCase()} data (Action: ${action}, Mode: ${data.mode})`,
    });

    return res.status(200).json({
      success: true,
      service,
      data,
    });
  } catch (error) {
    console.error(`Error querying Zoho ${service}:`, error);

    AuditModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.roles.join(', '),
      action: `ZOHO_${service.toUpperCase()}_ERROR`,
      resource: `/api/zoho/${service}`,
      status: 'FAILURE',
      ipAddress,
      userAgent,
      details: error.message,
    });

    return res.status(500).json({
      success: false,
      message: `Failed to fetch data from Zoho ${service.toUpperCase()}: ${error.message}`,
    });
  }
};

exports.getIntegrationStatus = (req, res) => {
  try {
    const status = zohoService.getStatus();
    return res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Zoho integration status.',
    });
  }
};

exports.launchService = (req, res) => {
  const { service } = req.params;
  const serviceMap = {
    people: 'https://people.zoho.com',
    crm: 'https://crm.zoho.com',
    desk: 'https://desk.zoho.com',
    books: 'https://books.zoho.com',
  };

  const url = serviceMap[service.toLowerCase()];
  if (!url) {
    return res.status(404).json({ success: false, message: 'Unknown Zoho application' });
  }

  AuditModel.create({
    userId: req.user.id,
    userEmail: req.user.email,
    role: req.user.roles.join(', '),
    action: `ZOHO_${service.toUpperCase()}_LAUNCH`,
    resource: `/api/zoho/${service}/launch`,
    status: 'SUCCESS',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || '',
    details: `User launched external Zoho portal: ${url}`,
  });

  return res.status(200).json({
    success: true,
    service,
    url,
  });
};
