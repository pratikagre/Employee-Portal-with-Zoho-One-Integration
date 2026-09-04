import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSave, user, availableRoles = [] }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    password: '',
    roleIds: [],
    is_active: 1,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        password: '',
        roleIds: user.roleDetails ? user.roleDetails.map(r => r.id) : [],
        is_active: user.is_active !== undefined ? user.is_active : 1,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        password: 'Password@123',
        roleIds: availableRoles.length > 0 ? [availableRoles[0].id] : [],
        is_active: 1,
      });
    }
    setError('');
  }, [user, isOpen, availableRoles]);

  if (!isOpen) return null;

  const handleRoleToggle = (roleId) => {
    setFormData(prev => {
      const exists = prev.roleIds.includes(roleId);
      return {
        ...prev,
        roleIds: exists 
          ? prev.roleIds.filter(id => id !== roleId)
          : [...prev.roleIds, roleId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.department) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!user && !formData.password) {
      setError('A default password is required for new employees.');
      return;
    }

    if (formData.roleIds.length === 0) {
      setError('Please assign at least one role to this employee.');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              {user ? <Save size={18} /> : <UserPlus size={18} />}
            </div>
            <h3 className="text-base font-bold">
              {user ? `Edit Employee: ${user.first_name} ${user.last_name}` : 'Add New Employee'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g. Rachel"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g. Zane"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Corporate Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="name@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g. Legal & Compliance"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {user ? 'Reset Password (optional)' : 'Temporary Password *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={user ? 'Leave blank to retain' : 'Password@123'}
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Assigned Roles & Zoho Permissions *
            </label>
            <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              {availableRoles.map(role => {
                const checked = formData.roleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    onClick={() => handleRoleToggle(role.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all select-none ${
                      checked 
                        ? 'bg-white border-blue-500 shadow-sm text-blue-900 font-semibold' 
                        : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-medium text-xs">{role.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{role.zoho_app_name}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={Boolean(formData.is_active)}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
              className="rounded text-blue-600 w-4 h-4 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="is_active" className="text-slate-700 font-medium cursor-pointer">
              Account is Active (Uncheck to revoke portal access)
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : user ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UserModal;
