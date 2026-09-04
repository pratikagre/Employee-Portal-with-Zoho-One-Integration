const { db } = require('../config/db');

class UserModel {
  static findByEmail(email) {
    const user = db.prepare(`
      SELECT id, email, password_hash, first_name, last_name, department, is_active, created_at, updated_at
      FROM Users
      WHERE email = ?
    `).get(email.toLowerCase().trim());

    if (!user) return null;
    return this._enrichUser(user);
  }

  static findById(id) {
    const user = db.prepare(`
      SELECT id, email, first_name, last_name, department, is_active, created_at, updated_at
      FROM Users
      WHERE id = ?
    `).get(id);

    if (!user) return null;
    return this._enrichUser(user);
  }

  static _enrichUser(user) {
    // Fetch assigned roles
    const roles = db.prepare(`
      SELECT r.id, r.name, r.description, r.zoho_app_name, r.zoho_app_url, r.icon
      FROM Roles r
      INNER JOIN UserRoles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).all(user.id);

    // Fetch assigned permissions across all roles
    const permissions = db.prepare(`
      SELECT DISTINCT p.id, p.name, p.code, p.module
      FROM Permissions p
      INNER JOIN RolePermissions rp ON rp.permission_id = p.id
      INNER JOIN UserRoles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ?
    `).all(user.id);

    return {
      ...user,
      roles: roles.map(r => r.name),
      roleDetails: roles,
      permissions: permissions.map(p => p.code),
    };
  }

  static getAllUsers() {
    const users = db.prepare(`
      SELECT id, email, first_name, last_name, department, is_active, created_at, updated_at
      FROM Users
      ORDER BY id ASC
    `).all();

    return users.map(user => this._enrichUser(user));
  }

  static createUser({ email, passwordHash, firstName, lastName, department, roleIds = [] }) {
    const insertUser = db.prepare(`
      INSERT INTO Users (email, password_hash, first_name, last_name, department, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const result = insertUser.run(
      email.toLowerCase().trim(),
      passwordHash,
      firstName.trim(),
      lastName.trim(),
      department.trim()
    );

    const userId = Number(result.lastInsertRowid);

    if (roleIds && roleIds.length > 0) {
      const insertUserRole = db.prepare(`
        INSERT INTO UserRoles (user_id, role_id)
        VALUES (?, ?)
      `);
      for (const roleId of roleIds) {
        insertUserRole.run(userId, Number(roleId));
      }
    }

    return this.findById(userId);
  }

  static updateUser(id, { email, firstName, lastName, department, is_active, roleIds }) {
    const existing = db.prepare('SELECT id FROM Users WHERE id = ?').get(id);
    if (!existing) return null;

    if (email || firstName || lastName || department || is_active !== undefined) {
      const updates = [];
      const params = [];

      if (email) {
        updates.push('email = ?');
        params.push(email.toLowerCase().trim());
      }
      if (firstName) {
        updates.push('first_name = ?');
        params.push(firstName.trim());
      }
      if (lastName) {
        updates.push('last_name = ?');
        params.push(lastName.trim());
      }
      if (department) {
        updates.push('department = ?');
        params.push(department.trim());
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active ? 1 : 0);
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);

      db.prepare(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    if (Array.isArray(roleIds)) {
      // Reassign roles
      db.prepare('DELETE FROM UserRoles WHERE user_id = ?').run(id);
      const insertRole = db.prepare('INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)');
      for (const roleId of roleIds) {
        insertRole.run(id, Number(roleId));
      }
    }

    return this.findById(id);
  }

  static deleteUser(id) {
    const user = db.prepare('SELECT id FROM Users WHERE id = ?').get(id);
    if (!user) return false;

    db.prepare('DELETE FROM UserRoles WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM Users WHERE id = ?').run(id);
    return true;
  }
}

module.exports = UserModel;
