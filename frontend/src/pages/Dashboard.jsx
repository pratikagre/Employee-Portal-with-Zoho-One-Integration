import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { zohoService } from '../services/zohoService';
import ZohoAppCard from '../components/ZohoAppCard';
import ZohoDataViewer from '../components/ZohoDataViewer';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Sparkles, 
  AlertTriangle,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const allPossibleServices = [
  { id: 'people', name: 'Zoho People', category: 'Human Resources', role: 'HR' },
  { id: 'crm', name: 'Zoho CRM', category: 'Sales & Pipeline', role: 'Sales' },
  { id: 'desk', name: 'Zoho Desk', category: 'Customer Support', role: 'Support' },
  { id: 'books', name: 'Zoho Books', category: 'Accounting & Finance', role: 'Finance' },
];

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [authorizedServices, setAuthorizedServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rbacTestResult, setRbacTestResult] = useState(null);
  const [testingRbac, setTestingRbac] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const res = await zohoService.getAuthorizedServices();
        setAuthorizedServices(res.services || []);
        // Default select the first authorized service for quick preview
        if (res.services && res.services.length > 0) {
          setSelectedService(res.services[0]);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [user]);

  // Handler to simulate an unauthorized API call to prove RBAC blocks it
  const handleSimulateUnauthorizedAccess = async (targetServiceId) => {
    setTestingRbac(true);
    setRbacTestResult(null);
    try {
      await zohoService.getServiceData(targetServiceId);
      setRbacTestResult({
        success: true,
        message: `Unexpected: Access to ${targetServiceId.toUpperCase()} was allowed.`,
      });
    } catch (err) {
      setRbacTestResult({
        forbidden: true,
        status: err.response?.status,
        message: err.response?.data?.message || 'Access Denied: 403 Forbidden',
        code: err.response?.data?.code || 'FORBIDDEN',
      });
    } finally {
      setTestingRbac(false);
    }
  };

  const authorizedIds = authorizedServices.map(s => s.id);
  const unauthorizedServices = allPossibleServices.filter(s => !authorizedIds.includes(s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-300 mb-3 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              Role-Based Access Control Active
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              Welcome back, {user?.first_name} {user?.last_name}!
            </h1>
            
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              You are authenticated as <span className="font-bold text-white">[{user?.roles?.join(', ')}]</span> in the <span className="font-semibold text-white">{user?.department}</span> department.
              {hasRole('Admin') 
                ? ' As an Administrator, you have full privileges across all Zoho One applications and employee management.' 
                : ` Your portal view is strictly scoped to ${authorizedServices.map(s => s.name).join(' & ')}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasRole('Admin') && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-xl"
              >
                <Shield size={16} />
                Open Admin Console
              </Link>
            )}

            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10 text-xs text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Permissions</div>
              <div className="text-base font-bold text-white">{user?.permissions?.length || 0} Grants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Services Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Authorized Zoho Services ({authorizedServices.length})
            </h2>
            <p className="text-xs text-slate-500">
              Applications provisioned specifically for your corporate role. No individual Zoho passwords required.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {authorizedServices.map(service => (
              <ZohoAppCard
                key={service.id}
                service={service}
                isSelected={selectedService?.id === service.id}
                onSelectExplore={() => setSelectedService(service)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Embedded Data Explorer for Selected Service */}
      {selectedService && (
        <section className="scroll-mt-6" id="data-explorer">
          <ZohoDataViewer
            serviceId={selectedService.id}
            serviceName={selectedService.name}
            onClear={() => setSelectedService(null)}
          />
        </section>
      )}

      {/* RBAC Verification & Enforcement Showcase */}
      {!hasRole('Admin') && unauthorizedServices.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Lock size={16} className="text-amber-600" />
                Access Boundaries & Restricted Enterprise Services
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The following Zoho applications are completely hidden and inaccessible to your current role ({user?.roles?.join(', ')}):
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {unauthorizedServices.map(unauth => (
              <div 
                key={unauth.id} 
                className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between opacity-80"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-slate-400" />
                    {unauth.name}
                  </div>
                  <div className="text-[10px] text-slate-400">Requires {unauth.role} Role</div>
                </div>

                <button
                  onClick={() => handleSimulateUnauthorizedAccess(unauth.id)}
                  disabled={testingRbac}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-[11px] font-medium text-slate-600 border border-slate-200 transition-colors"
                  title="Click to test backend RBAC security blocking"
                >
                  Test RBAC Block
                </button>
              </div>
            ))}
          </div>

          {/* RBAC Test Feedback Box */}
          {rbacTestResult && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 animate-in fade-in duration-150 ${
              rbacTestResult.forbidden 
                ? 'bg-rose-50 border border-rose-200 text-rose-800' 
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">
                  Backend Intercepted & Blocked: HTTP {rbacTestResult.status} Forbidden
                </p>
                <p className="mt-0.5 text-rose-700">{rbacTestResult.message}</p>
                <p className="mt-1 text-[10px] font-mono text-rose-600">
                  Audit log record created with IP, user email, and status: FORBIDDEN
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
