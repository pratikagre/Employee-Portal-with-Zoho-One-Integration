const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('./db');

async function seed() {
  console.log('🌱 Starting database seeding...');
  initializeDatabase();

  // 1. Roles
  const roles = [
    {
      name: 'Admin',
      description: 'Full portal access, user management, audit logs, and all Zoho One applications',
      zoho_app_name: 'Zoho One Suite (All Services)',
      zoho_app_url: 'https://one.zoho.com',
      icon: 'ShieldAlert',
    },
    {
      name: 'HR',
      description: 'Access to human resources, employee directory, and attendance management',
      zoho_app_name: 'Zoho People',
      zoho_app_url: 'https://people.zoho.com',
      icon: 'Users',
    },
    {
      name: 'Sales',
      description: 'Access to customer relations, deal pipelines, and leads tracking',
      zoho_app_name: 'Zoho CRM',
      zoho_app_url: 'https://crm.zoho.com',
      icon: 'TrendingUp',
    },
    {
      name: 'Support',
      description: 'Access to customer support desk, ticket resolution, and customer satisfaction',
      zoho_app_name: 'Zoho Desk',
      zoho_app_url: 'https://desk.zoho.com',
      icon: 'Headphones',
    },
    {
      name: 'Finance',
      description: 'Access to accounting, invoicing, cash flow, and financial statements',
      zoho_app_name: 'Zoho Books',
      zoho_app_url: 'https://books.zoho.com',
      icon: 'Receipt',
    },
    {
      name: 'Manager',
      description: 'Access to departmental reports and multi-team overviews',
      zoho_app_name: 'Zoho Analytics & Team Views',
      zoho_app_url: 'https://analytics.zoho.com',
      icon: 'Briefcase',
    },
  ];

  const insertRoleStmt = db.prepare(`
    INSERT OR IGNORE INTO Roles (name, description, zoho_app_name, zoho_app_url, icon)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const role of roles) {
    insertRoleStmt.run(role.name, role.description, role.zoho_app_name, role.zoho_app_url, role.icon);
  }
  console.log('✅ Roles seeded.');

  // 2. Permissions
  const permissions = [
    { name: 'Admin Full Control', code: 'admin:all', description: 'Superuser control over all portal features', module: 'System' },
    { name: 'Manage Users', code: 'users:manage', description: 'Create, update, and delete employees', module: 'Users' },
    { name: 'Manage Roles', code: 'roles:manage', description: 'Assign roles and configure permissions', module: 'Roles' },
    { name: 'View Audit Logs', code: 'audit:view', description: 'Inspect system access, login, and security logs', module: 'Audit' },
    
    // Zoho Specific Permissions
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
  console.log('✅ Permissions seeded.');

  // 3. Map Role Permissions
  const allRoles = db.prepare('SELECT id, name FROM Roles').all();
  const allPerms = db.prepare('SELECT id, code FROM Permissions').all();

  const roleMap = Object.fromEntries(allRoles.map(r => [r.name, r.id]));
  const permMap = Object.fromEntries(allPerms.map(p => [p.code, p.id]));

  const insertRolePermStmt = db.prepare(`
    INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
    VALUES (?, ?)
  `);

  const rolePermMappings = {
    Admin: Object.keys(permMap), // Admin has all permissions
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
  console.log('✅ Role permissions mapped.');

  // 4. Seed Users
  const defaultPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const users = [
    {
      email: 'admin@company.com',
      firstName: 'Sarah',
      lastName: 'Connor',
      department: 'Executive / IT',
      role: 'Admin',
    },
    {
      email: 'hr@company.com',
      firstName: 'Jessica',
      lastName: 'Pearson',
      department: 'Human Resources',
      role: 'HR',
    },
    {
      email: 'sales@company.com',
      firstName: 'Harvey',
      lastName: 'Specter',
      department: 'Sales & Growth',
      role: 'Sales',
    },
    {
      email: 'support@company.com',
      firstName: 'Donna',
      lastName: 'Paulsen',
      department: 'Customer Success',
      role: 'Support',
    },
    {
      email: 'finance@company.com',
      firstName: 'Louis',
      lastName: 'Litt',
      department: 'Accounting & Finance',
      role: 'Finance',
    },
    {
      email: 'manager@company.com',
      firstName: 'Michael',
      lastName: 'Ross',
      department: 'Operations',
      role: 'Manager',
    },
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
  console.log('✅ Users & user-role relationships seeded.');

  // 5. Initial Audit Log
  const insertAuditStmt = db.prepare(`
    INSERT INTO AuditLogs (user_id, user_email, role, action, resource, status, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAuditStmt.run(
    1,
    'admin@company.com',
    'Admin',
    'SYSTEM_INIT',
    'Database Seed',
    'SUCCESS',
    '127.0.0.1',
    'SeedScript/Node.js',
    'System initialized with standard roles, permissions, and default accounts.'
  );

  console.log('🎉 Seeding completed successfully!');
  console.log('\nDefault credentials for testing:');
  users.forEach(u => {
    console.log(`- Role: ${u.role.padEnd(8)} | Email: ${u.email.padEnd(22)} | Password: ${defaultPassword}`);
  });
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
