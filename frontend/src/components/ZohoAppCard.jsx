import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Headphones, 
  Receipt, 
  ExternalLink, 
  Database,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const iconMap = {
  Users: Users,
  TrendingUp: TrendingUp,
  Headphones: Headphones,
  Receipt: Receipt,
};

const ZohoAppCard = ({ service, isSelected, onSelectExplore }) => {
  const IconComponent = iconMap[service.icon] || Database;

  const handleDirectLaunch = () => {
    window.open(service.appUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isSelected 
          ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-xl' 
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lg shadow-sm'
      }`}
    >
      {/* Top Banner Accent */}
      <div 
        className="h-2 w-full" 
        style={{ backgroundColor: service.themeColor || '#2563eb' }} 
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
            style={{ backgroundColor: service.themeColor || '#2563eb' }}
          >
            <IconComponent size={24} />
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${service.accentBg || 'bg-slate-100 text-slate-700'}`}>
            {service.category}
          </span>
        </div>

        {/* Application details */}
        <h3 className="text-xl font-bold text-slate-900 mb-1.5 flex items-center gap-2">
          {service.name}
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        </h3>
        
        <p className="text-slate-600 text-xs leading-relaxed mb-4 min-h-[36px]">
          {service.description}
        </p>

        {/* Permitted Roles Tag */}
        <div className="mb-4">
          <span className="text-[11px] font-medium text-slate-400 block mb-1 uppercase tracking-wider">
            Authorized Roles:
          </span>
          <div className="flex flex-wrap gap-1">
            {service.allowedRoles?.map(role => (
              <span 
                key={role}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Endpoints */}
        <div className="pt-3 border-t border-slate-100 mb-2">
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5 uppercase tracking-wider">
            Available Modules:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {service.endpoints?.map(ep => (
              <span key={ep.path} className="text-xs px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-mono">
                {ep.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={onSelectExplore}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            isSelected 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
          }`}
        >
          <Database size={14} />
          {isSelected ? 'Viewing Data' : 'Explore Data'}
        </button>

        <button
          onClick={handleDirectLaunch}
          title={`Launch ${service.name} Portal in new tab`}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors shrink-0"
        >
          <ExternalLink size={14} />
          Launch App
        </button>
      </div>
    </div>
  );
};

export default ZohoAppCard;
