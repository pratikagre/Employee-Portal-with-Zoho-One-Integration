const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const defaultDbPath = isVercel ? '/tmp/portal.db' : './data/portal.db';
const dbPath = process.env.DB_PATH || defaultDbPath;
const resolvedDbPath = isVercel ? path.resolve('/tmp', 'portal.db') : path.resolve(__dirname, '../../', dbPath);
const dbDir = path.dirname(resolvedDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(resolvedDbPath);

// Enable foreign keys and WAL mode for better concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      department TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      zoho_app_name TEXT,
      zoho_app_url TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      module TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS UserRoles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
      UNIQUE(user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS RolePermissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE,
      UNIQUE(role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS AuditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      role TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      status TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user_id ON AuditLogs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLogs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created_at ON AuditLogs(created_at);
  `);

  // Auto-seed if database is fresh
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get();
    if (!userCount || userCount.count === 0) {
      seedInitialDataSync();
    }
  } catch (err) {
    console.error('Error during auto-seeding check:', err);
  }
}

function seedInitialDataSync() {
  console.log('🌱 Database is empty. Auto-seeding initial roles, permissions, and demo users...');

  // Roles
  const roles = [
    { name: 'Admin', description: 'Full portal access, user management, audit logs, and all Zoho One applications', zoho_app_name: 'Zoho One Suite (All Services)', zoho_app_url: 'https://one.zoho.com', icon: 'ShieldAlert' },
    { name: 'HR', description: 'Access to human resources, employee directory, and attendance management', zoho_app_name: 'Zoho People', zoho_app_url: 'https://people.zoho.com', icon: 'Users' },
    { name: 'Sales', description: 'Access to customer relations, deal pipelines, and leads tracking', zoho_app_name: 'Zoho CRM', zoho_app_url: 'https://crm.zoho.com', icon: 'TrendingUp' },
    { name: 'Support', description: 'Access to customer support desk, ticket resolution, and customer satisfaction', zoho_app_name: 'Zoho Desk', zoho_app_url: 'https://desk.zoho.com', icon: 'Headphones' },
    { name: 'Finance', description: 'Access to accounting, invoicing, cash flow, and financial statements', zoho_app_name: 'Zoho Books', zoho_app_url: 'https://books.zoho.com', icon: 'Receipt' },
    { name: 'Manager', description: 'Access to departmental reports and multi-team overviews', zoho_app_name: 'Zoho Analytics & Team Views', zoho_app_url: 'https://analytics.zoho.com', icon: 'Briefcase' },
  ];

  const insertRoleStmt = db.prepare(`
    INSERT OR IGNORE INTO Roles (name, description, zoho_app_name, zoho_app_url, icon)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const role of roles) {
    insertRoleStmt.run(role.name, role.description, role.zoho_app_name, role.zoho_app_url, role.icon);
  }

  // Permissions
  const permissions = [
    { name: 'Admin Full Control', code: 'admin:all', description: 'Superuser control over all portal features', module: 'System' },
    { name: 'Manage Users', code: 'users:manage', description: 'Create, update, and delete employees', module: 'Users' },
    { name: 'Manage Roles', code: 'roles:manage', description: 'Assign roles and configure permissions', module: 'Roles' },
    { name: 'View Audit Logs', code: 'audit:view', description: 'Inspect system access, login, and security logs', module: 'Audit' },
    { name: 'Zoho People Read', code: 'zoho:people:read', description: 'View HR records and employee directories', module: 'Zoho People' },
    { name: 'Zoho People Write', code: 'zoho:people:write', description: 'Manage leave requests and employee profiles', module: 'Zoho People' },
    { name: 'Zoho CRM Read', code: 'zoho:crm:read', description: 'View leads, accounts, and deals', module: 'Zoho CRM' },
    { name: 'Zoho CRM Write', code: 'zoho:crm:write', description: 'Create and update leads and sales pipeline', module: 'Zoho CRM' },
    { name: 'Zoho Desk Read', code: 'zoho:desk:read', description: 'View support tickets and customer queries', module: 'Zoho Desk' },
    { name: 'Zoho Desk Write', code: 'zoho:desk:write', description: 'Resolve, reply, and reassign support tickets', module: 'Zoho Desk' },
    { name: 'Zoho Books Read', code: 'zoho:books:read', description: 'View invoices, bills, and payments', module: 'Zoho Books' },
    { name: 'Zoho Books Write', code: 'zoho:books:write', description: 'Generate invoices and record payments', module: 'Zoho Books' },
  ];

  const insertPermStmt = db.prepare(`
    INSERT OR IGNORE INTO Permissions (name, code, description, module)
    VALUES (?, ?, ?, ?)
  `);

  for (const perm of permissions) {
    insertPermStmt.run(perm.name, perm.code, perm.description, perm.module);
  }

  // Role permissions map
  const allRoles = db.prepare('SELECT id, name FROM Roles').all();
  const allPerms = db.prepare('SELECT id, code FROM Permissions').all();
  const roleMap = Object.fromEntries(allRoles.map(r => [r.name, r.id]));
  const permMap = Object.fromEntries(allPerms.map(p => [p.code, p.id]));

  const insertRolePermStmt = db.prepare(`
    INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
    VALUES (?, ?)
  `);

  const rolePermMappings = {
    Admin: Object.keys(permMap),
    HR: ['zoho:people:read', 'zoho:people:write'],
    Sales: ['zoho:crm:read', 'zoho:crm:write'],
    Support: ['zoho:desk:read', 'zoho:desk:write'],
    Finance: ['zoho:books:read', 'zoho:books:write'],
    Manager: ['zoho:people:read', 'zoho:crm:read', 'zoho:desk:read'],
  };

  for (const [roleName, permCodes] of Object.entries(rolePermMappings)) {
    const roleId = roleMap[roleName];
    if (roleId) {
      for (const code of permCodes) {
        const permId = permMap[code];
        if (permId) {
          insertRolePermStmt.run(roleId, permId);
        }
      }
    }
  }

  // Seed Users
  const passwordHash = bcrypt.hashSync('Password@123', 10);
  const users = [
    { email: 'admin@company.com', firstName: 'Sarah', lastName: 'Connor', department: 'Executive / IT', role: 'Admin' },
    { email: 'hr@company.com', firstName: 'Jessica', lastName: 'Pearson', department: 'Human Resources', role: 'HR' },
    { email: 'sales@company.com', firstName: 'Harvey', lastName: 'Specter', department: 'Sales & Growth', role: 'Sales' },
    { email: 'support@company.com', firstName: 'Donna', lastName: 'Paulsen', department: 'Customer Success', role: 'Support' },
    { email: 'finance@company.com', firstName: 'Louis', lastName: 'Litt', department: 'Accounting & Finance', role: 'Finance' },
    { email: 'manager@company.com', firstName: 'Michael', lastName: 'Ross', department: 'Operations', role: 'Manager' },
  ];

  const insertUserStmt = db.prepare(`
    INSERT OR IGNORE INTO Users (email, password_hash, first_name, last_name, department, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const insertUserRoleStmt = db.prepare(`
    INSERT OR IGNORE INTO UserRoles (user_id, role_id)
    VALUES (?, ?)
  `);

  for (const u of users) {
    insertUserStmt.run(u.email, passwordHash, u.firstName, u.lastName, u.department);
    const userRow = db.prepare('SELECT id FROM Users WHERE email = ?').get(u.email);
    const roleId = roleMap[u.role];
    if (userRow && roleId) {
      insertUserRoleStmt.run(userRow.id, roleId);
    }
  }

  // Seed Audit log
  db.prepare(`
    INSERT INTO AuditLogs (user_id, user_email, role, action, resource, status, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    'admin@company.com',
    'Admin',
    'SYSTEM_INIT',
    'Database Seed',
    'SUCCESS',
    '127.0.0.1',
    'SystemAutoSeed',
    'Auto-seeded standard roles, permissions, and test accounts.'
  );

  console.log('✅ Auto-seeding completed successfully!');
}

module.exports = {
  db,
  initializeDatabase,
};
