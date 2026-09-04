import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { zohoService } from '../services/zohoService';
import { 
  ShieldCheck, 
  Layers, 
  LogOut, 
  User, 
  ChevronDown, 
  Activity, 
  ExternalLink,
  Shield,
  Briefcase
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [zohoStatus, setZohoStatus] = useState(null);

  useEffect(() => {
    zohoService.getIntegrationStatus()
      .then(res => setZohoStatus(res.status))
      .catch(() => setZohoStatus({ simulationMode: true, isConfigured: false }));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HR': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Sales': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Support': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Finance': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Layers size={22} />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  Nexus Portal
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase flex items-center gap-1">
                  Zoho One Enterprise RBAC
                </span>
              </div>
            </Link>

            {/* Main Nav Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>

              {/* Admin Panel Link - Rendered ONLY for Admin role */}
              {hasRole('Admin') && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                  }`}
                >
                  <Shield size={16} className="text-blue-600" />
                  Admin Console
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            
            {/* Zoho Integration Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-50 text-xs font-medium text-slate-600 border-slate-200">
              <span className={`w-2 h-2 rounded-full ${zohoStatus?.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>
                {zohoStatus?.isConfigured ? 'Zoho One: Live API' : 'Zoho One: Demo Ready'}
              </span>
            </div>

            {/* Active User Chip */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-inner">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-none">
                      {user.department}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setProfileOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {user.roles?.map(role => (
                            <span 
                              key={role}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeStyle(role)}`}
                            >
                              Role: {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="px-2 py-1">
                        <div className="px-3 py-2 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                          Authorized Permissions ({user.permissions?.length || 0})
                        </div>
                        <div className="max-h-32 overflow-y-auto px-3 text-xs text-slate-600 space-y-1">
                          {user.permissions?.map(p => (
                            <div key={p} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 mt-2 pt-1 px-2">
                        {hasRole('Admin') && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                          >
                            <Shield size={15} className="text-blue-600" />
                            Admin Console
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                        >
                          <LogOut size={15} />
                          Sign Out of Portal
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
