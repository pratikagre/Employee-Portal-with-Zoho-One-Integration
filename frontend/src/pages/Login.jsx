import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  AlertCircle,
  Users,
  TrendingUp,
  Headphones,
  Receipt,
  Shield,
  Briefcase
} from 'lucide-react';

const demoAccounts = [
  {
    role: 'Admin',
    name: 'Sarah Connor',
    email: 'admin@company.com',
    password: 'Password@123',
    icon: Shield,
    color: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    description: 'All 4 Zoho apps + Admin Console & Audit Logs',
  },
  {
    role: 'HR',
    name: 'Jessica Pearson',
    email: 'hr@company.com',
    password: 'Password@123',
    icon: Users,
    color: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    description: 'Strictly Zoho People (Employees, Leaves)',
  },
  {
    role: 'Sales',
    name: 'Harvey Specter',
    email: 'sales@company.com',
    password: 'Password@123',
    icon: TrendingUp,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    description: 'Strictly Zoho CRM (Deals, Leads, Accounts)',
  },
  {
    role: 'Support',
    name: 'Donna Paulsen',
    email: 'support@company.com',
    password: 'Password@123',
    icon: Headphones,
    color: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    description: 'Strictly Zoho Desk (Tickets, Customer CSAT)',
  },
  {
    role: 'Finance',
    name: 'Louis Litt',
    email: 'finance@company.com',
    password: 'Password@123',
    icon: Receipt,
    color: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    description: 'Strictly Zoho Books (Invoices, Revenue)',
  },
];

const Login = () => {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const quickDemoLogin = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
    setLoading(true);
    try {
      await login(demo.email, demo.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background radial gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/10 z-10">
        
        {/* Left Col: Info & Quick Role Switcher */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                <Layers size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Nexus Portal</h1>
                <p className="text-xs text-slate-400">Zoho One & RBAC Gateway</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">
              Role-Based Access for Zoho One Services
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Single service account backend architecture. Employees sign in with custom credentials and access strictly authorized Zoho modules.
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Click to Test Pre-Seeded Roles:
              </span>
              {demoAccounts.map(demo => {
                const Icon = demo.icon;
                const isSelected = email === demo.email;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => quickDemoLogin(demo)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 group ${
                      isSelected 
                        ? 'bg-white/15 border-blue-400 text-white shadow' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{demo.role}</span>
                        <span className="text-[10px] text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">Quick Login &rarr;</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{demo.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>JWT & RBAC Security Engine Active</span>
          </div>
        </div>

        {/* Right Col: Standard Sign In Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Employee Sign In</h3>
            <p className="text-xs text-slate-500">
              Enter your corporate credentials to access your authorized Zoho workspace.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 animate-in fade-in duration-150">
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Default: Password@123</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick info footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Relational DB &bull; SQLite Sync</span>
            <span>Single Service Account</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
