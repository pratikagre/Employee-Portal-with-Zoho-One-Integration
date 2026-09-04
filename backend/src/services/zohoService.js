const axios = require('axios');

class ZohoService {
  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID || '';
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET || '';
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN || '';
    this.accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
    this.orgId = process.env.ZOHO_ORG_ID || '';
    this.simulationMode = process.env.ZOHO_SIMULATION_MODE || 'auto';

    // In-memory token cache
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Check whether live Zoho credentials are fully configured
   */
  isConfigured() {
    return Boolean(
      this.clientId &&
      this.clientId.trim().length > 0 &&
      this.clientSecret &&
      this.clientSecret.trim().length > 0 &&
      this.refreshToken &&
      this.refreshToken.trim().length > 0
    );
  }

  /**
   * Retrieve valid Zoho OAuth access token using backend service account refresh token
   * Caches token in memory until 60 seconds before expiration.
   */
  async getZohoAccessToken() {
    // If not configured, we return a simulated token
    if (!this.isConfigured()) {
      return 'simulated_zoho_bearer_token_' + Date.now();
    }

    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
    }

    try {
      const response = await axios.post(`${this.accountsUrl}/oauth/v2/token`, null, {
        params: {
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        },
      });

      if (response.data.error) {
        throw new Error(`Zoho OAuth Error: ${response.data.error}`);
      }

      this.cachedToken = response.data.access_token;
      // Expires in response.data.expires_in (usually 3600 seconds)
      const expiresInSec = response.data.expires_in || 3600;
      this.tokenExpiresAt = Date.now() + (expiresInSec * 1000);

      return this.cachedToken;
    } catch (error) {
      console.error('Failed to retrieve Zoho Access Token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Returns list of authorized Zoho services for given roles
   */
  getAuthorizedServices(userRoles = []) {
    const isSuperAdmin = userRoles.includes('Admin');

    const serviceDefinitions = [
      {
        id: 'people',
        name: 'Zoho People',
        category: 'Human Resources',
        description: 'Employee profiles, leave management, attendance tracking, and performance reviews.',
        appUrl: 'https://people.zoho.com',
        allowedRoles: ['Admin', 'HR', 'Manager'],
        icon: 'Users',
        themeColor: '#4f46e5', // Indigo
        accentBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeColor: 'bg-indigo-100 text-indigo-800',
        endpoints: [
          { name: 'Directory', path: '/directory' },
          { name: 'Leave Requests', path: '/leaves' },
          { name: 'Attendance', path: '/attendance' },
        ],
      },
      {
        id: 'crm',
        name: 'Zoho CRM',
        category: 'Sales & Marketing',
        description: 'Customer relations, sales pipelines, qualified leads, accounts, and deal closings.',
        appUrl: 'https://crm.zoho.com',
        allowedRoles: ['Admin', 'Sales', 'Manager'],
        icon: 'TrendingUp',
        themeColor: '#059669', // Emerald
        accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        endpoints: [
          { name: 'Leads', path: '/leads' },
          { name: 'Deals', path: '/deals' },
          { name: 'Pipeline', path: '/pipeline' },
        ],
      },
      {
        id: 'desk',
        name: 'Zoho Desk',
        category: 'Customer Support',
        description: 'Multi-channel support tickets, SLAs, customer satisfaction ratings, and knowledgebase.',
        appUrl: 'https://desk.zoho.com',
        allowedRoles: ['Admin', 'Support', 'Manager'],
        icon: 'Headphones',
        themeColor: '#d97706', // Amber
        accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeColor: 'bg-amber-100 text-amber-800',
        endpoints: [
          { name: 'Tickets', path: '/tickets' },
          { name: 'Queue', path: '/queue' },
          { name: 'SLA Status', path: '/sla' },
        ],
      },
      {
        id: 'books',
        name: 'Zoho Books',
        category: 'Finance & Accounting',
        description: 'Tax-compliant invoices, automated billing, expense tracking, and financial statements.',
        appUrl: 'https://books.zoho.com',
        allowedRoles: ['Admin', 'Finance'],
        icon: 'Receipt',
        themeColor: '#dc2626', // Red
        accentBg: 'bg-red-50 text-red-700 border-red-200',
        badgeColor: 'bg-red-100 text-red-800',
        endpoints: [
          { name: 'Invoices', path: '/invoices' },
          { name: 'Expenses', path: '/expenses' },
          { name: 'Ledger', path: '/ledger' },
        ],
      },
    ];

    if (isSuperAdmin) {
      return serviceDefinitions;
    }

    return serviceDefinitions.filter(svc => 
      svc.allowedRoles.some(role => userRoles.includes(role))
    );
  }

  /**
   * Fetch data for a specific Zoho service through backend proxy
   * Seamlessly falls back to simulated realistic dataset if credentials are not configured.
   */
  async fetchServiceData(service, action = 'overview') {
    const isLive = this.isConfigured();

    if (isLive) {
      try {
        const token = await this.getZohoAccessToken();
        return await this._callLiveZohoApi(service, action, token);
      } catch (err) {
        console.warn(`Live Zoho API call failed for ${service}. Falling back to simulation. Reason:`, err.message);
      }
    }

    // High fidelity simulation data for demo & evaluation
    return this._getSimulatedData(service, action);
  }

  async _callLiveZohoApi(service, action, token) {
    const headers = { Authorization: `Zoho-oauthtoken ${token}` };

    if (service === 'crm') {
      const resp = await axios.get('https://www.zohoapis.com/crm/v2/Leads', { headers });
      return {
        mode: 'LIVE',
        service: 'Zoho CRM',
        timestamp: new Date().toISOString(),
        data: resp.data,
      };
    } else if (service === 'desk' && this.orgId) {
      const resp = await axios.get('https://desk.zoho.com/api/v1/tickets', {
        headers: { ...headers, orgId: this.orgId },
      });
      return {
        mode: 'LIVE',
        service: 'Zoho Desk',
        timestamp: new Date().toISOString(),
        data: resp.data,
      };
    } else if (service === 'books' && this.orgId) {
      const resp = await axios.get('https://books.zoho.com/api/v3/invoices', {
        headers: { ...headers, 'X-com-zoho-books-organizationid': this.orgId },
      });
      return {
        mode: 'LIVE',
        service: 'Zoho Books',
        timestamp: new Date().toISOString(),
        data: resp.data,
      };
    } else if (service === 'people') {
      const resp = await axios.get('https://people.zoho.com/people/api/forms/json/employee/getRecords', { headers });
      return {
        mode: 'LIVE',
        service: 'Zoho People',
        timestamp: new Date().toISOString(),
        data: resp.data,
      };
    }

    // Fallback if endpoint specific param missing
    return this._getSimulatedData(service, action);
  }

  _getSimulatedData(service, action) {
    const now = new Date().toISOString();

    const mockData = {
      people: {
        mode: 'SIMULATION',
        service: 'Zoho People',
        application: 'HR Management Suite',
        directPortalUrl: 'https://people.zoho.com',
        metrics: {
          totalEmployees: 148,
          activeToday: 139,
          onLeave: 9,
          pendingApprovals: 4,
        },
        records: [
          { id: 'EMP-101', name: 'Eleanor Vance', department: 'Engineering', role: 'Staff Architect', status: 'Present', checkIn: '09:02 AM' },
          { id: 'EMP-102', name: 'Marcus Brody', department: 'Product Design', role: 'Senior Designer', status: 'Present', checkIn: '09:15 AM' },
          { id: 'EMP-103', name: 'Elena Rostova', department: 'Talent Acquisition', role: 'HR Specialist', status: 'On Leave (Annual)', checkIn: '-' },
          { id: 'EMP-104', name: 'David Kim', department: 'DevOps', role: 'SRE Lead', status: 'Present', checkIn: '08:50 AM' },
          { id: 'EMP-105', name: 'Amina Idris', department: 'Legal & Compliance', role: 'Legal Counsel', status: 'Remote', checkIn: '09:30 AM' },
        ],
        recentRequests: [
          { id: 'REQ-882', employee: 'David Kim', type: 'Work from Home', dates: 'Tomorrow', status: 'Approved' },
          { id: 'REQ-883', employee: 'Elena Rostova', type: 'Annual Leave', dates: 'Sep 05 - Sep 08', status: 'Approved' },
          { id: 'REQ-884', employee: 'Carlos Mendoza', type: 'Maternity/Paternity', dates: 'Next Week', status: 'Pending Review' },
        ],
      },
      crm: {
        mode: 'SIMULATION',
        service: 'Zoho CRM',
        application: 'Customer Relationship & Pipeline',
        directPortalUrl: 'https://crm.zoho.com',
        metrics: {
          openDeals: 24,
          pipelineValue: '$842,500',
          wonThisQuarter: '$415,000',
          newLeadsThisWeek: 37,
        },
        records: [
          { id: 'DEAL-901', client: 'Acme Global Corp', contact: 'Walter White', stage: 'Contract Negotiation', amount: '$185,000', probability: '90%' },
          { id: 'DEAL-902', client: 'Stark Industries', contact: 'Pepper Potts', stage: 'Technical Evaluation', amount: '$240,000', probability: '75%' },
          { id: 'DEAL-903', client: 'Cyberdyne Systems', contact: 'Miles Dyson', stage: 'Proposal Presented', amount: '$95,000', probability: '60%' },
          { id: 'DEAL-904', client: 'Wayne Enterprises', contact: 'Lucius Fox', stage: 'Discovery Meeting', amount: '$320,000', probability: '40%' },
          { id: 'DEAL-905', client: 'Initech Software', contact: 'Peter Gibbons', stage: 'Closed Won', amount: '$62,500', probability: '100%' },
        ],
        recentLeads: [
          { id: 'LEAD-401', name: 'Sarah Blake', company: 'Apex Fintech', source: 'LinkedIn Webinar', score: 92 },
          { id: 'LEAD-402', name: 'Liam O’Connor', company: 'Nova Health', source: 'Organic Search', score: 84 },
          { id: 'LEAD-403', name: 'Yuki Tanaka', company: 'Sora Cloud', source: 'Partner Referral', score: 78 },
        ],
      },
      desk: {
        mode: 'SIMULATION',
        service: 'Zoho Desk',
        application: 'Support Desk & Ticketing',
        directPortalUrl: 'https://desk.zoho.com',
        metrics: {
          openTickets: 18,
          criticalBugs: 2,
          avgResponseTime: '18 mins',
          csatScore: '98.2%',
        },
        records: [
          { id: 'TICK-3001', subject: 'OAuth token refresh intermittently returning 401', requester: 'Dev Team @ Acme', priority: 'High', status: 'In Progress', assignee: 'Donna P.' },
          { id: 'TICK-3002', subject: 'Request for bulk employee export permission', requester: 'Jessica Pearson', priority: 'Medium', status: 'Waiting on Customer', assignee: 'Support Bot' },
          { id: 'TICK-3003', subject: 'Webhook notifications delayed by 5 minutes', requester: 'Fintech Ops', priority: 'Critical', status: 'Investigating', assignee: 'Donna P.' },
          { id: 'TICK-3004', subject: 'UI dark mode contrast issue on tablet screens', requester: 'QA Team', priority: 'Low', status: 'Resolved', assignee: 'Frontend Team' },
          { id: 'TICK-3005', subject: 'Billing inquiry: upgrade to Enterprise tier', requester: 'Stark Ind. Accounts', priority: 'High', status: 'Escalated to Sales', assignee: 'Harvey S.' },
        ],
        channelStats: {
          emailTickets: 12,
          portalTickets: 5,
          apiGenerated: 1,
        },
      },
      books: {
        mode: 'SIMULATION',
        service: 'Zoho Books',
        application: 'Accounting & Invoicing',
        directPortalUrl: 'https://books.zoho.com',
        metrics: {
          unpaidInvoices: '$128,400',
          paidThisMonth: '$342,150',
          overdueAmount: '$12,000',
          cashFlowStatus: 'Positive (+24%)',
        },
        records: [
          { id: 'INV-2026-041', customer: 'Acme Global Corp', date: '2026-09-01', dueDate: '2026-10-01', amount: '$45,000.00', status: 'Sent' },
          { id: 'INV-2026-040', customer: 'Stark Industries', date: '2026-08-28', dueDate: '2026-09-28', amount: '$85,000.00', status: 'Paid' },
          { id: 'INV-2026-039', customer: 'Cyberdyne Systems', date: '2026-08-15', dueDate: '2026-09-15', amount: '$22,500.00', status: 'Overdue' },
          { id: 'INV-2026-038', customer: 'Wayne Enterprises', date: '2026-08-10', dueDate: '2026-09-10', amount: '$110,000.00', status: 'Paid' },
          { id: 'INV-2026-037', customer: 'Initech Software', date: '2026-08-01', dueDate: '2026-09-01', amount: '$18,400.00', status: 'Paid' },
        ],
        recentExpenses: [
          { category: 'Cloud Infrastructure (AWS/Zoho)', amount: '$6,420', status: 'Auto-Paid' },
          { category: 'Developer Tooling & Licenses', amount: '$2,150', status: 'Approved' },
          { category: 'Customer Hospitality', amount: '$850', status: 'Pending Review' },
        ],
      },
    };

    return mockData[service] || {
      mode: 'SIMULATION',
      service,
      timestamp: now,
      message: `No specific data structure registered for ${service}`,
    };
  }

  getStatus() {
    return {
      isConfigured: this.isConfigured(),
      simulationMode: !this.isConfigured(),
      accountsUrl: this.accountsUrl,
      clientIdConfigured: Boolean(this.clientId),
      clientSecretConfigured: Boolean(this.clientSecret),
      refreshTokenConfigured: Boolean(this.refreshToken),
      tokenCached: Boolean(this.cachedToken),
      tokenExpiresInSec: this.cachedToken ? Math.max(0, Math.floor((this.tokenExpiresAt - Date.now()) / 1000)) : 0,
    };
  }
}

// Export singleton instance
module.exports = new ZohoService();
