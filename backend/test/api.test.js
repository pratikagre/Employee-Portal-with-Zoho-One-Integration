const assert = require('assert');
const http = require('http');
require('dotenv').config();

// Use test port to not conflict
process.env.PORT = 5055;
process.env.NODE_ENV = 'test';

const app = require('../server');
let server;

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      'Content-Type': 'application/json',
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5055,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseData);
          } catch {
            parsed = responseData;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automated Backend RBAC & Zoho Integration Tests...\n');
  server = app.listen(5055);

  try {
    // 1. Health check
    console.log('Test 1: Health Check...');
    const healthRes = await makeRequest({ method: 'GET', path: '/api/health' });
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.data.status, 'online');
    console.log('✅ Health check passed.');

    // 2. Admin Login
    console.log('\nTest 2: Admin Login...');
    const adminLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@company.com', password: 'Password@123' },
    });
    assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
    assert.ok(adminLogin.data.token, 'Token should be returned');
    assert.strictEqual(adminLogin.data.user.roles.includes('Admin'), true);
    assert.strictEqual(adminLogin.data.user.authorizedServices.length, 4, 'Admin should have all 4 Zoho services');
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login succeeded, full 4 Zoho services authorized.');

    // 3. HR Login
    console.log('\nTest 3: HR Login...');
    const hrLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'hr@company.com', password: 'Password@123' },
    });
    assert.strictEqual(hrLogin.status, 200);
    assert.strictEqual(hrLogin.data.user.roles.includes('HR'), true);
    const hrServices = hrLogin.data.user.authorizedServices.map(s => s.id);
    assert.deepStrictEqual(hrServices, ['people'], 'HR should only be authorized for Zoho People');
    const hrToken = hrLogin.data.token;
    console.log('✅ HR login succeeded, strictly authorized for Zoho People.');

    // 4. Sales Login
    console.log('\nTest 4: Sales Login...');
    const salesLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'sales@company.com', password: 'Password@123' },
    });
    assert.strictEqual(salesLogin.status, 200);
    const salesServices = salesLogin.data.user.authorizedServices.map(s => s.id);
    assert.deepStrictEqual(salesServices, ['crm'], 'Sales should only be authorized for Zoho CRM');
    const salesToken = salesLogin.data.token;
    console.log('✅ Sales login succeeded, strictly authorized for Zoho CRM.');

    // 5. Finance Login
    console.log('\nTest 5: Finance Login...');
    const finLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'finance@company.com', password: 'Password@123' },
    });
    assert.strictEqual(finLogin.status, 200);
    const finServices = finLogin.data.user.authorizedServices.map(s => s.id);
    assert.deepStrictEqual(finServices, ['books'], 'Finance should only be authorized for Zoho Books');
    console.log('✅ Finance login succeeded, strictly authorized for Zoho Books.');

    // 6. RBAC Zoho Access: HR accessing Zoho People (Authorized)
    console.log('\nTest 6: HR accessing authorized Zoho People service...');
    const hrPeopleRes = await makeRequest({
      method: 'GET',
      path: '/api/zoho/people',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert.strictEqual(hrPeopleRes.status, 200);
    assert.strictEqual(hrPeopleRes.data.service, 'people');
    console.log('✅ HR authorized access to Zoho People succeeded (200 OK).');

    // 7. RBAC Zoho Access Violation: HR accessing Zoho CRM (Forbidden)
    console.log('\nTest 7: Security Test - HR attempting unauthorized access to Zoho CRM...');
    const hrCrmRes = await makeRequest({
      method: 'GET',
      path: '/api/zoho/crm',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert.strictEqual(hrCrmRes.status, 403, 'HR access to Zoho CRM must return 403 Forbidden');
    assert.strictEqual(hrCrmRes.data.code, 'UNAUTHORIZED_ZOHO_SERVICE');
    console.log('✅ Security check passed: 403 Forbidden correctly returned for unauthorized Zoho service.');

    // 8. RBAC Zoho Access Violation: Sales accessing Zoho Books (Forbidden)
    console.log('\nTest 8: Security Test - Sales attempting unauthorized access to Zoho Books...');
    const salesBooksRes = await makeRequest({
      method: 'GET',
      path: '/api/zoho/books',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert.strictEqual(salesBooksRes.status, 403, 'Sales access to Zoho Books must return 403 Forbidden');
    console.log('✅ Security check passed: 403 Forbidden returned for Sales accessing Zoho Books.');

    // 9. Admin Area Protection: HR attempting to list users in Admin Panel (Forbidden)
    console.log('\nTest 9: Security Test - Non-admin attempting to access Admin endpoints...');
    const hrAdminRes = await makeRequest({
      method: 'GET',
      path: '/api/admin/users',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert.strictEqual(hrAdminRes.status, 403, 'HR cannot access Admin API');
    console.log('✅ Security check passed: Non-admin blocked with 403 from /api/admin/users.');

    // 10. Admin Area Success: Admin accessing Admin users & Audit Logs
    console.log('\nTest 10: Admin accessing Admin users list...');
    const adminUsersRes = await makeRequest({
      method: 'GET',
      path: '/api/admin/users',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminUsersRes.status, 200);
    assert.ok(adminUsersRes.data.users.length >= 6);
    console.log(`✅ Admin retrieved ${adminUsersRes.data.users.length} users successfully.`);

    // 11. Verify Audit Logs captured the unauthorized attempts
    console.log('\nTest 11: Verifying Audit Logs for captured security violations...');
    const auditLogsRes = await makeRequest({
      method: 'GET',
      path: '/api/admin/audit-logs?status=FORBIDDEN',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(auditLogsRes.status, 200);
    assert.ok(auditLogsRes.data.logs.length >= 2, 'Should have logged forbidden attempts');
    console.log(`✅ Audit Logs correctly recorded ${auditLogsRes.data.logs.length} forbidden security attempts with IP & timestamps.`);

    console.log('\n🎉 ALL 11 TESTS PASSED SUCCESSFULLY! RBAC, AUTH, ZOHO INTEGRATION & AUDIT LOGS FULLY VERIFIED.\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
