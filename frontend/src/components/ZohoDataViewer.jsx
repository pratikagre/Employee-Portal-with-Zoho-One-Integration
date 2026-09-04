import React, { useState, useEffect } from 'react';
import { zohoService } from '../services/zohoService';
import { 
  RefreshCw, 
  Server, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Headphones, 
  Receipt,
  ExternalLink,
  Code
} from 'lucide-react';

const ZohoDataViewer = ({ serviceId, serviceName, onClear }) => {
  const [loading, setLoading] = useState(true);
  const [dataPayload, setDataPayload] = useState(null);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('records');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await zohoService.getServiceData(serviceId);
      setDataPayload(response.data);
    } catch (err) {
      console.error('Error loading Zoho data:', err);
      setError(err.response?.data?.message || 'Failed to load records from Zoho backend proxy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceId) {
      fetchData();
      setActiveSubTab('records');
    }
  }, [serviceId]);

  if (!serviceId) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all duration-200">
      
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{serviceName} Data Explorer</h3>
              {dataPayload && (
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                  dataPayload.mode === 'LIVE' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-indigo-500 text-white'
                }`}>
                  {dataPayload.mode === 'LIVE' ? '● Live Zoho API' : '● Zoho Sandbox Simulation'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Queried securely via backend service account proxy &bull; Endpoint: <code className="text-blue-300">/api/zoho/{serviceId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Close View
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Querying Zoho API via backend service account...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <AlertCircle size={32} className="text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-rose-800 mb-1">Backend Query Error</h4>
            <p className="text-xs text-rose-600 mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg"
            >
              Retry Query
            </button>
          </div>
        ) : dataPayload ? (
          <div className="space-y-6">
            
            {/* Top Metric Cards */}
            {dataPayload.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dataPayload.metrics).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Sub Tabs */}
            <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveSubTab('records')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeSubTab === 'records'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Primary Records
              </button>
              {serviceId === 'people' && dataPayload.recentRequests && (
                <button
                  onClick={() => setActiveSubTab('requests')}
                  className={`pb-2.5 transition-colors border-b-2 ${
                    activeSubTab === 'requests'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Leave & Remote Requests
                </button>
              )}
              {serviceId === 'crm' && dataPayload.recentLeads && (
                <button
                  onClick={() => setActiveSubTab('leads')}
                  className={`pb-2.5 transition-colors border-b-2 ${
                    activeSubTab === 'leads'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Recent Inbound Leads
                </button>
              )}
              {serviceId === 'books' && dataPayload.recentExpenses && (
                <button
                  onClick={() => setActiveSubTab('expenses')}
                  className={`pb-2.5 transition-colors border-b-2 ${
                    activeSubTab === 'expenses'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Expense Log
                </button>
              )}
            </div>

            {/* Sub-tab 1: Primary Records */}
            {activeSubTab === 'records' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    {serviceId === 'people' && (
                      <tr>
                        <th className="p-3">Employee ID</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Job Title</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Check-In</th>
                      </tr>
                    )}
                    {serviceId === 'crm' && (
                      <tr>
                        <th className="p-3">Deal ID</th>
                        <th className="p-3">Account / Client</th>
                        <th className="p-3">Primary Contact</th>
                        <th className="p-3">Stage</th>
                        <th className="p-3">Deal Value</th>
                        <th className="p-3">Probability</th>
                      </tr>
                    )}
                    {serviceId === 'desk' && (
                      <tr>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Requester</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Assignee</th>
                      </tr>
                    )}
                    {serviceId === 'books' && (
                      <tr>
                        <th className="p-3">Invoice #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dataPayload.records?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        {serviceId === 'people' && (
                          <>
                            <td className="p-3 font-mono font-semibold text-slate-800">{row.id}</td>
                            <td className="p-3 font-medium text-slate-900">{row.name}</td>
                            <td className="p-3">{row.department}</td>
                            <td className="p-3">{row.role}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                row.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-500">{row.checkIn}</td>
                          </>
                        )}
                        {serviceId === 'crm' && (
                          <>
                            <td className="p-3 font-mono font-semibold text-slate-800">{row.id}</td>
                            <td className="p-3 font-medium text-slate-900">{row.client}</td>
                            <td className="p-3">{row.contact}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                {row.stage}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-900">{row.amount}</td>
                            <td className="p-3 font-mono text-slate-600">{row.probability}</td>
                          </>
                        )}
                        {serviceId === 'desk' && (
                          <>
                            <td className="p-3 font-mono font-semibold text-slate-800">{row.id}</td>
                            <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{row.subject}</td>
                            <td className="p-3">{row.requester}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                row.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                                row.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {row.priority}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-700">{row.status}</td>
                            <td className="p-3 font-mono text-slate-600">{row.assignee}</td>
                          </>
                        )}
                        {serviceId === 'books' && (
                          <>
                            <td className="p-3 font-mono font-semibold text-slate-800">{row.id}</td>
                            <td className="p-3 font-medium text-slate-900">{row.customer}</td>
                            <td className="p-3 font-mono">{row.date}</td>
                            <td className="p-3 font-mono">{row.dueDate}</td>
                            <td className="p-3 font-bold text-slate-900">{row.amount}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                row.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                row.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-tab 2: People Requests */}
            {activeSubTab === 'requests' && dataPayload.recentRequests && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Request ID</th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dataPayload.recentRequests.map((req, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold">{req.id}</td>
                        <td className="p-3 font-medium text-slate-900">{req.employee}</td>
                        <td className="p-3">{req.type}</td>
                        <td className="p-3 font-mono">{req.dates}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-tab 3: CRM Leads */}
            {activeSubTab === 'leads' && dataPayload.recentLeads && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Lead ID</th>
                      <th className="p-3">Contact Name</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Acquisition Source</th>
                      <th className="p-3">Lead Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dataPayload.recentLeads.map((lead, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold">{lead.id}</td>
                        <td className="p-3 font-medium text-slate-900">{lead.name}</td>
                        <td className="p-3">{lead.company}</td>
                        <td className="p-3">{lead.source}</td>
                        <td className="p-3 font-bold text-emerald-600">{lead.score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-tab 4: Books Expenses */}
            {activeSubTab === 'expenses' && dataPayload.recentExpenses && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Expense Category</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dataPayload.recentExpenses.map((exp, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">{exp.category}</td>
                        <td className="p-3 font-bold text-slate-800">{exp.amount}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Audit & Security Note Footer */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle size={14} className="text-emerald-500" />
                Employee Identity Protected &bull; No individual Zoho login required &bull; Audit log entry created.
              </span>
              <a 
                href={dataPayload.directPortalUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
              >
                Direct Portal <ExternalLink size={12} />
              </a>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ZohoDataViewer;
