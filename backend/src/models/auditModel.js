const { db } = require('../config/db');

class AuditModel {
  static create({
    userId = null,
    userEmail = 'Anonymous',
    role = 'None',
    action,
    resource = '',
    status = 'SUCCESS',
    ipAddress = '127.0.0.1',
    userAgent = '',
    details = '',
  }) {
    const stmt = db.prepare(`
      INSERT INTO AuditLogs (user_id, user_email, role, action, resource, status, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      userEmail,
      role,
      action,
      resource,
      status,
      ipAddress,
      userAgent,
      typeof details === 'object' ? JSON.stringify(details) : String(details)
    );

    return Number(result.lastInsertRowid);
  }

  static getLogs({ limit = 50, offset = 0, action, userEmail, status, startDate, endDate }) {
    const whereClauses = [];
    const params = [];

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }
    if (userEmail) {
      whereClauses.push('user_email LIKE ?');
      params.push(`%${userEmail}%`);
    }
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM AuditLogs ${whereSql}`);
    const total = countStmt.get(...params).total;

    const listStmt = db.prepare(`
      SELECT id, user_id, user_email, role, action, resource, status, ip_address, user_agent, details, created_at
      FROM AuditLogs
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);

    const logs = listStmt.all(...params, limit, offset);

    return {
      total,
      limit,
      offset,
      logs,
    };
  }

  static getStats() {
    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM AuditLogs').get().count;
    const logins = db.prepare("SELECT COUNT(*) as count FROM AuditLogs WHERE action = 'LOGIN' AND status = 'SUCCESS'").get().count;
    const securityViolations = db.prepare("SELECT COUNT(*) as count FROM AuditLogs WHERE status = 'FORBIDDEN' OR action = 'UNAUTHORIZED_ATTEMPT'").get().count;
    const zohoAccessCount = db.prepare("SELECT COUNT(*) as count FROM AuditLogs WHERE action LIKE 'ZOHO_%' AND status = 'SUCCESS'").get().count;

    return {
      totalLogs,
      logins,
      securityViolations,
      zohoAccessCount,
    };
  }
}

module.exports = AuditModel;
