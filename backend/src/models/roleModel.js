const { db } = require('../config/db');

class RoleModel {
  static getAllRoles() {
    const roles = db.prepare(`
      SELECT r.id, r.name, r.description, r.zoho_app_name, r.zoho_app_url, r.icon, r.created_at,
             COUNT(DISTINCT ur.user_id) AS user_count
      FROM Roles r
      LEFT JOIN UserRoles ur ON ur.role_id = r.id
      GROUP BY r.id
      ORDER BY r.id ASC
    `).all();

    return roles.map(role => {
      const permissions = db.prepare(`
        SELECT p.id, p.name, p.code, p.module, p.description
        FROM Permissions p
        INNER JOIN RolePermissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `).all(role.id);

      return {
        ...role,
        permissions,
      };
    });
  }

  static getRoleById(id) {
    const role = db.prepare(`
      SELECT id, name, description, zoho_app_name, zoho_app_url, icon, created_at
      FROM Roles
      WHERE id = ?
    `).get(id);

    if (!role) return null;

    const permissions = db.prepare(`
      SELECT p.id, p.name, p.code, p.module, p.description
      FROM Permissions p
      INNER JOIN RolePermissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `).all(id);

    return {
      ...role,
      permissions,
    };
  }

  static getAllPermissions() {
    return db.prepare(`
      SELECT id, name, code, description, module, created_at
      FROM Permissions
      ORDER BY module ASC, name ASC
    `).all();
  }

  static updateRolePermissions(roleId, permissionIds) {
    const role = db.prepare('SELECT id FROM Roles WHERE id = ?').get(roleId);
    if (!role) return null;

    db.prepare('DELETE FROM RolePermissions WHERE role_id = ?').run(roleId);

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
      VALUES (?, ?)
    `);

    for (const permId of permissionIds) {
      insertStmt.run(roleId, Number(permId));
    }

    return this.getRoleById(roleId);
  }

  static createRole({ name, description, zoho_app_name, zoho_app_url, icon = 'Shield', permissionIds = [] }) {
    const insert = db.prepare(`
      INSERT INTO Roles (name, description, zoho_app_name, zoho_app_url, icon)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(name.trim(), description || '', zoho_app_name || '', zoho_app_url || '', icon);
    const roleId = Number(result.lastInsertRowid);

    if (permissionIds.length > 0) {
      this.updateRolePermissions(roleId, permissionIds);
    }

    return this.getRoleById(roleId);
  }
}

module.exports = RoleModel;
