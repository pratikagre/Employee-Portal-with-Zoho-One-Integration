import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { zohoService } from '../services/zohoService';
import UserModal from '../components/UserModal';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Filter,
  Check,
  Key
} from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [zohoStatus, setZohoStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState('');
  const [auditEmailFilter, setAuditEmailFilter] = useState('');
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, rolesRes, permsRes, auditRes, zohoRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getRoles(),
        adminService.getPermissions(),
        adminService.getAuditLogs({ limit: 40 }),
        zohoService.getIntegrationStatus(),
      ]);

      setStats(statsRes.stats);
      setUsers(usersRes.users || []);
      setRoles(rolesRes.roles || []);
      setPermissions(permsRes.permissions || []);
      setAuditLogs(auditRes.logs || []);
      setAuditTotal(auditRes.total || 0);
      setZohoStatus(zohoRes.status);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleFilterAuditLogs = async () => {
    try {
      const res = await adminService.getAuditLogs({
        action: auditActionFilter || undefined,
        status: auditStatusFilter || undefined,
        userEmail: auditEmailFilter || undefined,
        limit: 40,
      });
      setAuditLogs(res.logs || []);
      setAuditTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to filter audit logs:', err);
    }
  };

  const handleSaveUser = async (userData) => {
    if (editingUser) {
      await adminService.updateUser(editingUser.id, userData);
      setSuccessMessage(`Updated employee ${userData.firstName} ${userData.lastName}`);
    } else {
      await adminService.createUser(userData);
      setSuccessMessage(`Created new employee ${userData.firstName} ${userData.lastName}`);
    }
    await loadAllData();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove employee ${name}? This action is irreversible.`)) {
      try {
        await adminService.deleteUser(id);
        setSuccessMessage(`Employee ${name} deleted.`);
        await loadAllData();
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminService.updateUser(user.id, { is_active: user.is_active ? 0 : 1 });
      await loadAllData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handlePermissionToggle = async (roleId, permId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const currentPermIds = role.permissions.map(p => p.id);
    const updatedIds = currentPermIds.includes(permId)
      ? currentPermIds.filter(id => id !== permId)
      : [...currentPermIds, permId];

    setSavingPermissions(true);
    try {
      await adminService.updateRolePermissions(roleId, updatedIds);
      await loadAllData();
      setSuccessMessage(`Permissions updated for role ${role.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Failed to update role permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email} ${u.department} ${u.roles?.join(' ')}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="text-blue-600" size={26} />
            Administrator Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage users, configure RBAC permission matrices, inspect audit trails, and oversee Zoho One connections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>

          <button
            onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            <Plus size={15} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Quick Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Users</span>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">{stats.activeUsers} Active</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Roles Configured</span>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalRoles}</div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Admin, HR, Sales, ...</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Audit Events</span>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalLogs}</div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Total logged actions</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Zoho Calls</span>
            <div className="text-2xl font-extrabold text-blue-600">{stats.zohoAccessCount}</div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Authorized proxies</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Security Blocks</span>
            <div className="text-2xl font-extrabold text-rose-600">{stats.securityViolations}</div>
            <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">403 Forbidden catches</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          User Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield size={16} />
          Role-Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={16} />
          Audit Trail & Security Logs ({auditTotal})
        </button>

        <button
          onClick={() => setActiveTab('zoho')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'zoho'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings size={16} />
          Zoho One Integration Health
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by employee name, email, department..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredUsers.length} of {users.length} employees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Assigned Roles</th>
                  <th className="p-3.5">Authorized Zoho Apps</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-3.5 font-medium">{u.department}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map(role => (
                          <span key={role} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-xs text-slate-600 font-medium">
                        {u.roles?.includes('Admin') ? 'All Zoho One Services' : u.roleDetails?.map(r => r.zoho_app_name).filter(Boolean).join(', ') || 'None'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {u.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {u.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Employee & Roles"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE-PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Fine-Grained Permission Matrix</h3>
            <p className="text-xs text-slate-500">
              Toggle specific permission grants across roles. Changes update in real-time in the SQLite database and take effect immediately.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 min-w-[200px]">Permission Name / Module</th>
                  {roles.map(r => (
                    <th key={r.id} className="p-3.5 text-center min-w-[90px]">
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="text-[9px] text-slate-400 lowercase">{r.user_count} users</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{perm.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{perm.code} &bull; {perm.module}</div>
                    </td>
                    {roles.map(role => {
                      const hasPerm = role.permissions.some(p => p.id === perm.id);
                      const isAdmin = role.name === 'Admin';
                      return (
                        <td key={role.id} className="p-3.5 text-center">
                          <button
                            disabled={isAdmin || savingPermissions}
                            onClick={() => handlePermissionToggle(role.id, perm.id)}
                            className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all ${
                              hasPerm 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            } ${isAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isAdmin ? 'Admin automatically holds all permissions' : 'Click to toggle'}
                          >
                            <Check size={14} className={hasPerm ? 'opacity-100' : 'opacity-0'} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">System Audit & Access Logs</h3>
              <p className="text-xs text-slate-500">
                Comprehensive audit trail tracking logins, role-based Zoho API access, forbidden attempts, and admin actions.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filter email..."
                value={auditEmailFilter}
                onChange={(e) => setAuditEmailFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={auditStatusFilter}
                onChange={(e) => setAuditStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FORBIDDEN">FORBIDDEN</option>
                <option value="FAILURE">FAILURE</option>
              </select>
              <button
                onClick={handleFilterAuditLogs}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User / Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-slate-900">{log.user_email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {log.role || 'None'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800 text-[11px]">{log.action}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{log.resource}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'FORBIDDEN' ? 'bg-rose-100 text-rose-800 font-extrabold' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{log.ip_address}</td>
                    <td className="p-3 max-w-xs truncate text-[11px] text-slate-600" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ZOHO INTEGRATION HEALTH */}
      {activeTab === 'zoho' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Zoho One Backend Service Account Architecture</h3>
            <p className="text-xs text-slate-500">
              The portal integrates with Zoho One using a single backend service account. Employees never enter individual Zoho passwords.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Service Account Status</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Operating Mode:</span>
                  <span className={`font-bold ${zohoStatus?.isConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {zohoStatus?.isConfigured ? 'Live Zoho One Suite' : 'High-Fidelity Sandbox Simulation'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Accounts Auth Server:</span>
                  <span className="font-mono text-slate-700">{zohoStatus?.accountsUrl || 'https://accounts.zoho.com'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">OAuth Client ID Configured:</span>
                  <span className="font-mono">{zohoStatus?.clientIdConfigured ? 'Yes (Present)' : 'Not set in .env'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Refresh Token Configured:</span>
                  <span className="font-mono">{zohoStatus?.refreshTokenConfigured ? 'Yes (Present)' : 'Not set in .env'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Token Cache Status:</span>
                  <span className="font-mono">{zohoStatus?.tokenCached ? 'Active in memory' : 'Fresh refresh on next call'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Key size={14} />
                Zoho Free Trial Setup Guide
              </h4>
              <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Create a free trial account on <strong>zoho.com/one</strong>.</li>
                <li>Go to <strong>api-console.zoho.com</strong> and create a "Server-based Application".</li>
                <li>Set Authorized Redirect URI to: <code className="bg-white px-1.5 py-0.5 rounded text-[11px]">http://localhost:5000/oauth/callback</code></li>
                <li>Generate a Refresh Token with scopes: <br /><code className="text-[10px] bg-white p-1 rounded block mt-1">ZohoCRM.modules.ALL, ZohoPeople.employee.ALL, ZohoDesk.tickets.ALL, ZohoBooks.fullaccess.ALL</code></li>
                <li>Paste credentials into <code className="bg-white px-1.5 py-0.5 rounded font-mono">backend/.env</code>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        availableRoles={roles}
      />

    </div>
  );
};

export default AdminPanel;
