# Custom Employee Portal with Zoho One Integration

[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> A production-grade centralized enterprise employee portal featuring custom JWT authentication, strict Role-Based Access Control (RBAC), fine-grained permission evaluation, real-time security audit logging, and backend-managed Zoho One API integration (Zoho People, Zoho CRM, Zoho Desk, Zoho Books) via a single corporate service account.

---

## 📑 Table of Contents
- [1. Architectural Overview](#1-architectural-overview)
- [2. RBAC & Zoho Application Access Matrix](#2-rbac--zoho-application-access-matrix)
- [3. Key Features](#3-key-features)
- [4. Relational Database Schema](#4-relational-database-schema)
- [5. Project Directory Structure](#5-project-directory-structure)
- [6. Installation & Setup Guide](#6-installation--setup-guide)
- [7. Zoho One API & OAuth Credentials Guide](#7-zoho-one-api--oauth-credentials-guide)
- [8. Pre-Seeded Test Accounts](#8-pre-seeded-test-accounts)
- [9. Running Automated RBAC Tests](#9-running-automated-rbac-tests)
- [10. 3-to-5 Minute Demo Video Recording Script](#10-3-to-5-minute-demo-video-recording-script)

---

## 1. Architectural Overview

```
+-----------------------------------------------------------------------------------+
|                            REACT FRONTEND (Vite + Tailwind)                      |
|                                                                                   |
|  +---------------------+  +-------------------------+  +-----------------------+  |
|  | Role-Based Login UI |  | Authorized App Dashboard|  | Admin Control Console |  |
|  | (1-Click Demo Switch)  | (Zoho Cards & Explorer) |  | (Users, RBAC, Audit)  |  |
|  +---------------------+  +-------------------------+  +-----------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTP Requests (Bearer JWT Token)
                                           v
+-----------------------------------------------------------------------------------+
|                            NODE.JS / EXPRESS BACKEND                              |
|                                                                                   |
|  +----------------------+  +-------------------------+  +-----------------------+  |
|  | JWT Auth Middleware  |  |  RBAC Policy Guard      |  | Audit Logging Engine  |  |
|  | (Verifies Signature) |  |  (Enforces App Borders) |  | (Tracks 403 & Logins) |  |
|  +----------------------+  +-------------------------+  +-----------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Zoho Service Account Layer (OAuth 2.0 Auto Refresh & Token Cache)           |  |
|  +-----------------------------------------------------------------------------+  |
+----------------------+------------------------------------+-----------------------+
                       |                                    |
          Database Sync|                                    | Live API / Fallback
                       v                                    v
+------------------------------------+    +-----------------------------------------+
|     RELATIONAL SQLITE DATABASE     |    |              ZOHO ONE SUITE             |
|  - Users                           |    |  - Zoho People (HR Management)          |
|  - Roles                           |    |  - Zoho CRM (Sales & Deals Pipeline)    |
|  - Permissions                     |    |  - Zoho Desk (Support & Ticketing)      |
|  - UserRoles                       |    |  - Zoho Books (Invoicing & Accounting)  |
|  - RolePermissions                 |    |  (Employees never enter Zoho passwords) |
|  - AuditLogs                       |    +-----------------------------------------+
+------------------------------------+
```

### Security Architecture Highlights
1. **Zero Zoho Exposure to Employees**: Employees never know or enter Zoho credentials. All interactions go through the backend service account.
2. **Double-Layered RBAC**: 
   - **Frontend**: Conditionally renders only permitted Zoho cards and data tabs.
   - **Backend**: Every API route inspects the user's roles and permissions. An unauthorized call (e.g., HR requesting `/api/zoho/crm`) is intercepted, blocked with `403 Forbidden`, and flagged in the `AuditLogs` table.
3. **Dual-Mode Backend**: Works out-of-the-box in **Simulation Mode** (with realistic enterprise records for immediate demonstration) and seamlessly promotes to **Live Zoho One API Mode** when `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` are populated in `.env`.

---

## 2. RBAC & Zoho Application Access Matrix

| Role | Permitted Zoho App | Business Purpose | Target URL | Sample Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | **All 4 Applications** | Full portal governance, RBAC management, audit inspection | `https://one.zoho.com` | `admin:all`, `users:manage`, `roles:manage`, `audit:view` |
| **HR** | **Zoho People** | Employee records, leave requests, attendance monitoring | `https://people.zoho.com` | `zoho:people:read`, `zoho:people:write` |
| **Sales** | **Zoho CRM** | Customer relations, deal stages, pipeline analytics | `https://crm.zoho.com` | `zoho:crm:read`, `zoho:crm:write` |
| **Support** | **Zoho Desk** | Customer tickets, case resolution, CSAT monitoring | `https://desk.zoho.com` | `zoho:desk:read`, `zoho:desk:write` |
| **Finance** | **Zoho Books** | Invoicing, payments, accounts receivable, expenses | `https://books.zoho.com` | `zoho:books:read`, `zoho:books:write` |
| **Manager** | **People, CRM, Desk** | Cross-departmental reporting and oversight | `https://analytics.zoho.com`| `zoho:people:read`, `zoho:crm:read`, `zoho:desk:read` |

---

## 3. Key Features

- **Custom JWT Authentication**: Secure password hashing with `bcryptjs` (salt rounds: 10), stateless JWT tokens with 24-hour expiration.
- **Strict RBAC Engine**: Role verification middleware (`verifyRole`) and fine-grained permission middleware (`verifyPermission`, `verifyZohoServiceAccess`).
- **Interactive Role Switcher**: Login screen provides one-click test credentials for evaluators to switch roles rapidly.
- **Embedded Zoho Data Explorer**: Employees can inspect real-time records (leads, tickets, invoices, directory) directly in the portal without accessing raw credentials.
- **Security Violation Sandbox**: Allows testing the backend RBAC block directly from the UI, confirming HTTP 403 enforcement.
- **Comprehensive Audit Trail**: Records user IDs, emails, roles, exact actions (`LOGIN`, `UNAUTHORIZED_ATTEMPT`, `ZOHO_ACCESS`, `CREATE_USER`), client IP addresses, user agents, and timestamps.
- **Admin Control Console**:
  - **User Management**: Create, edit, activate/deactivate, and delete employees.
  - **Role-Permission Matrix**: Toggle individual permissions across roles with instant database updates.
  - **Audit Log Inspector**: Searchable and filterable by email, status, and action type.
  - **Zoho Integration Health**: Live connection status, cache expiry, and setup walkthrough.

---

## 4. Relational Database Schema

The database utilizes SQLite with foreign key enforcement and WAL journaling:

```sql
-- 1. Users
CREATE TABLE Users (
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

-- 2. Roles
CREATE TABLE Roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  zoho_app_name TEXT,
  zoho_app_url TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Permissions
CREATE TABLE Permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. UserRoles (Many-to-Many: Users <-> Roles)
CREATE TABLE UserRoles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- 5. RolePermissions (Many-to-Many: Roles <-> Permissions)
CREATE TABLE RolePermissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- 6. AuditLogs
CREATE TABLE AuditLogs (
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
```

---

## 5. Project Directory Structure

```
custom-employee-portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # SQLite connection, PRAGMA & schema initialization
│   │   │   └── seed.js        # Seed roles, permissions, users & demo accounts
│   │   ├── controllers/
│   │   │   ├── authController.js   # Login, profile (/me), logout
│   │   │   ├── zohoController.js   # Authorized services, data proxy, launchers
│   │   │   └── adminController.js  # Users CRUD, RBAC matrix, audit log queries
│   │   ├── middlewares/
│   │   │   ├── auth.js        # JWT bearer token verification
│   │   │   └── rbac.js        # verifyRole, verifyPermission, verifyZohoServiceAccess
│   │   ├── models/
│   │   │   ├── userModel.js   # User queries with role enrichment
│   │   │   ├── roleModel.js   # Role & permission matrix queries
│   │   │   └── auditModel.js  # Audit log persistence & stats aggregation
│   │   ├── routes/
│   │   │   ├── authRoutes.js  # /api/auth
│   │   │   ├── zohoRoutes.js  # /api/zoho
│   │   │   └── adminRoutes.js # /api/admin
│   │   └── services/
│   │       └── zohoService.js # Zoho OAuth refresh token manager & data proxy
│   ├── test/
│   │   └── api.test.js        # 11 automated test assertions for RBAC & auth
│   ├── .env                   # Active environment configuration
│   ├── .env.example           # Environment template
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Role badges, Zoho status, admin nav
│   │   │   ├── ProtectedRoute.jsx  # Auth & role boundary protection
│   │   │   ├── ZohoAppCard.jsx     # Permitted Zoho service card
│   │   │   ├── ZohoDataViewer.jsx  # Interactive live/mock records explorer
│   │   │   └── UserModal.jsx       # Employee create/edit modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global authentication & permission state
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Sign in with 1-click role switcher
│   │   │   ├── Dashboard.jsx       # Scoped Zoho dashboard & RBAC tester
│   │   │   └── AdminPanel.jsx      # Full administrator console
│   │   ├── services/
│   │   │   ├── api.js              # Axios client with JWT interceptor
│   │   │   ├── authService.js      # Auth API calls
│   │   │   ├── zohoService.js      # Zoho API calls
│   │   │   └── adminService.js     # Admin API calls
│   │   ├── App.jsx                 # Route definitions & layout wrapper
│   │   ├── main.jsx                # React DOM root
│   │   └── index.css               # Tailwind CSS directives
│   ├── package.json
│   ├── vite.config.js              # Dev proxy to port 5000
│   └── tailwind.config.js
│
├── package.json                    # Workspace scripts
└── README.md                       # Documentation & video script
```

---

## 6. Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.x or higher (recommended v22.x)
- **NPM**: v9.x or higher

### Step 1: Clone Repository & Install Dependencies
```bash
# Navigate to project root
cd "Custom Employee Portal with Zoho One Integration"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### Step 2: Initialize & Seed Database
The SQLite database file will be automatically generated at `backend/data/portal.db`:
```bash
cd backend
npm run seed
cd ..
```

### Step 3: Launch Applications
In two separate terminal windows:

**Terminal 1 (Backend - Port 5000):**
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 (Frontend - Port 5173):**
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

Open `http://localhost:5173` in your web browser.

---

## 7. Zoho One API & OAuth Credentials Guide

The application operates out-of-the-box with **zero configuration** in Simulation Mode. To connect real Zoho One APIs:

1. **Sign up for Zoho One**: Create a free trial account at [zoho.com/one](https://www.zoho.com/one/).
2. **Access API Console**: Visit [api-console.zoho.com](https://api-console.zoho.com/).
3. **Register Client**:
   - Choose **Server-based Applications**.
   - Client Name: `Custom Employee Portal`
   - Homepage URL: `http://localhost:5173`
   - Authorized Redirect URI: `http://localhost:5000/api/zoho/oauth/callback`
4. **Generate Self-Client Code / Refresh Token**:
   - In the **Generate Code** tab, specify the scopes:
     ```
     ZohoCRM.modules.ALL,ZohoPeople.employee.ALL,ZohoDesk.tickets.ALL,ZohoBooks.fullaccess.ALL
     ```
   - Exchange the grant code for a permanent `refresh_token`.
5. **Update `backend/.env`**:
   ```env
   ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXX
   ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
   ZOHO_ORG_ID=your_zoho_org_id_here
   ```
6. Restart the backend server. The navbar status indicator will immediately turn **green: Live Zoho API**.

---

## 8. Pre-Seeded Test Accounts

All accounts share the default password: **`Password@123`**

| Role | Email | Password | Authorized Zoho Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Password@123` | **All 4 Applications** + Admin Console + Audit Logs |
| **HR** | `hr@company.com` | `Password@123` | **Zoho People** only |
| **Sales** | `sales@company.com` | `Password@123` | **Zoho CRM** only |
| **Support** | `support@company.com` | `Password@123` | **Zoho Desk** only |
| **Finance** | `finance@company.com` | `Password@123` | **Zoho Books** only |
| **Manager** | `manager@company.com` | `Password@123` | **Zoho People**, **Zoho CRM**, **Zoho Desk** |

> 💡 *Tip: On the login page, simply click on any of the role cards in the left panel to instantly log in as that persona!*

---

## 9. Running Automated RBAC Tests

A comprehensive integration test suite verifies:
- Token generation & expiration handling.
- Role-specific Zoho service exposure.
- **403 Forbidden** security boundaries (e.g. HR blocked from CRM, Sales blocked from Books).
- Non-admin blocked from Admin endpoints.
- Verification that all security violations are recorded in the `AuditLogs` table.

Run the test suite with:
```bash
cd backend
npm test
```

Expected output:
```
🧪 Starting Automated Backend RBAC & Zoho Integration Tests...

Test 1: Health Check...
✅ Health check passed.
Test 2: Admin Login...
✅ Admin login succeeded, full 4 Zoho services authorized.
Test 3: HR Login...
✅ HR login succeeded, strictly authorized for Zoho People.
Test 4: Sales Login...
✅ Sales login succeeded, strictly authorized for Zoho CRM.
Test 5: Finance Login...
✅ Finance login succeeded, strictly authorized for Zoho Books.
Test 6: HR accessing authorized Zoho People service...
✅ HR authorized access to Zoho People succeeded (200 OK).
Test 7: Security Test - HR attempting unauthorized access to Zoho CRM...
✅ Security check passed: 403 Forbidden correctly returned for unauthorized Zoho service.
Test 8: Security Test - Sales attempting unauthorized access to Zoho Books...
✅ Security check passed: 403 Forbidden returned for Sales accessing Zoho Books.
Test 9: Security Test - Non-admin attempting to access Admin endpoints...
✅ Security check passed: Non-admin blocked with 403 from /api/admin/users.
Test 10: Admin accessing Admin users list...
✅ Admin retrieved 6 users successfully.
Test 11: Verifying Audit Logs for captured security violations...
✅ Audit Logs correctly recorded 3 forbidden security attempts with IP & timestamps.

🎉 ALL 11 TESTS PASSED SUCCESSFULLY! RBAC, AUTH, ZOHO INTEGRATION & AUDIT LOGS FULLY VERIFIED.
```

---

## 10. 3-to-5 Minute Demo Video Recording Script

Use this structured presentation walkthrough for your screen recording with voice narration:

### ⏱️ Minute 0:00 - 0:45: Project Overview & Motivation
- **Visual**: Show the Login screen with the quick demo role switcher.
- **Narrate**: *"Welcome! In this walkthrough, I am demonstrating our Custom Employee Portal integrated with Zoho One. The core challenge was building an independent portal with its own authentication and RBAC, where a single corporate Zoho One service account handles all backend API communication, ensuring employees never need individual Zoho credentials."*
- **Action**: Click `HR (Jessica Pearson)` to log in with one click.

### ⏱️ Minute 0:45 - 1:45: RBAC Enforcement & Zoho People View
- **Visual**: Dashboard loads for HR. Notice only **Zoho People** is visible.
- **Narrate**: *"Upon login, the system validates Jessica's JWT token, detects the HR role, and fetches only authorized services. Notice she only sees Zoho People. Zoho CRM, Desk, and Books are completely restricted."*
- **Action**: 
  1. Click **Explore Data** under Zoho People. Show the employee directory and leave requests loaded through the backend proxy.
  2. Click **Test RBAC Block** on the restricted Zoho CRM service.
- **Narrate**: *"When an HR user attempts to reach Zoho CRM, the backend rbac middleware intercepts the request, blocks it with an HTTP 403 Forbidden, and records a security incident in our audit logs."*

### ⏱️ Minute 1:45 - 2:30: Sales & Finance Persona Checks
- **Visual**: Log out and log in as `Sales (Harvey Specter)`.
- **Narrate**: *"Now logging in as Sales. Harvey only sees Zoho CRM with deal pipelines and leads. Next, logging in as Finance (Louis Litt), Louis only sees Zoho Books with tax invoices and accounting records. Neither employee enters any Zoho password."*

### ⏱️ Minute 2:30 - 3:45: Backend Architecture & Zoho Token Manager
- **Visual**: Open code editor showing `backend/src/services/zohoService.js` and `backend/src/middlewares/rbac.js`.
- **Narrate**: 
  - *"In `zohoService.js`, we implement the OAuth 2.0 refresh token grant flow using our backend credentials. Access tokens are cached in memory with expiration tracking to avoid redundant network calls."*
  - *"In `rbac.js`, we enforce role and permission checks on every route. Any unauthorized call writes an entry to `AuditLogs` with user email, timestamp, IP address, and status."*

### ⏱️ Minute 3:45 - 4:45: Admin Control Console & Audit Trail
- **Visual**: Log in as `Admin (Sarah Connor)` and click **Admin Console**.
- **Action**:
  1. **User Management**: Show the employee list. Show how roles can be edited or new users created.
  2. **Role-Permission Matrix**: Show how fine-grained permissions can be toggled across roles.
  3. **Audit Trail**: Show the logs table. Highlight the `FORBIDDEN` status entries generated earlier during the RBAC test!
- **Narrate**: *"Finally, in the Admin Console, administrators have full visibility. They can manage employees, customize the role-permission matrix, and review the tamper-evident audit trail capturing all successful logins and blocked intrusion attempts."*

### ⏱️ Minute 4:45 - 5:00: Wrap Up
- **Narrate**: *"To summarize, we have delivered a robust, secure, and clean solution that strictly meets every functional and architectural requirement for the Zoho One employee portal integration. Thank you!"*

---

## 📄 License
This project is licensed under the MIT License.
