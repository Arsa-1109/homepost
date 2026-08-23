/**
 * Minimal stub API for Playwright smoke runs (C4).
 *
 * Serves canned JSON on 127.0.0.1:8000 so the frontend can be exercised
 * end-to-end without the FastAPI stack. The signed-in persona's role is read
 * from the mock_user_role cookie — cookies are shared across ports on
 * 127.0.0.1, so whatever the client-side Clerk mock set flows here.
 */
import http from "node:http";

const PORT = Number(process.env.PORT || 8000);

function readRole(req) {
  const match = (req.headers.cookie ?? "").match(/(?:^|;\s*)mock_user_role=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  const auth = req.headers.authorization ?? "";
  if (auth.includes("landlord")) return "landlord";
  if (auth.includes("tenant")) return "tenant";
  return "unassigned";
}

function send(res, status, body, req) {
  const origin = req?.headers?.origin || "*";
  const headers = {
    "content-type": "application/json",
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };
  if (origin !== "*") {
    headers["access-control-allow-credentials"] = "true";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

const page = (items) => ({ items, total: items.length, limit: 50, offset: 0 });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  const role = readRole(req);
  const reply = (status, body) => send(res, status, body, req);

  if (req.method === "OPTIONS") {
    return reply(204, {});
  }

  // --- onboarding / auth -------------------------------------------------
  if (path === "/api/v1/onboarding/me") {
    return reply(200, {
      id: role === "tenant" ? "user_demo_tenant_001" : "user_demo_landlord_001",
      clerk_id: role === "tenant" ? "user_demo_tenant_001" : "user_demo_landlord_001",
      email: role === "tenant" ? "sarah.jenkins@demo.homepost.io" : "landlord@homepost.demo",
      full_name: role === "tenant" ? "Sarah Jenkins" : "Marcus Vance (Demo Landlord)",
      role,
      requested_landlord_id: null,
    });
  }
  if (path === "/api/v1/onboarding/sync") return reply(200, {});
  if (path === "/api/v1/onboarding/register-landlord") return reply(200, {});
  if (path === "/api/v1/onboarding/reset-role") return reply(200, {});
  if (path === "/api/v1/onboarding/accept-invite") return reply(200, {});

  if (path.startsWith("/api/v1/onboarding/invite/")) {
    return reply(200, {
      token: path.split("/").pop(),
      property_name: "Oakview E2E Residency",
      property_address: "42 Smoke Test Lane",
      property_city: "Varanasi",
      unit_label: "Unit 101",
      landlord_name: "E2E Landlord",
      landlord_id: "user_e2e_landlord",
      property_owner_id: "user_e2e_landlord",
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
      lease_start: null,
      lease_end: null,
    });
  }

  // --- landlord ------------------------------------------------------------
  if (path === "/api/v1/landlord/dashboard") {
    return reply(200, {
      property_stats: {
        total_properties: 1,
        total_units: 2,
        occupied_units: 1,
        vacant_units: 1,
      },
      units: [
        {
          id: "unit-e2e-101",
          property_id: "prop-e2e-1",
          property_name: "Oakview E2E Residency",
          unit_label: "Unit 101",
          is_occupied: true,
          tenant_name: "E2E Tenant",
          has_pending_maintenance: false,
        },
        {
          id: "unit-e2e-102",
          property_id: "prop-e2e-1",
          property_name: "Oakview E2E Residency",
          unit_label: "Unit 102",
          is_occupied: false,
          tenant_name: null,
          has_pending_maintenance: false,
        },
      ],
      urgent_maintenance: [],
      recent_activity: [],
      pending_approvals: [],
      pending_maintenance_count: 0,
      recent_announcements: [],
    });
  }
  if (path === "/api/v1/landlord/pending-tenants") return reply(200, page([]));

  // --- tenant ----------------------------------------------------------------
  if (path === "/api/v1/tenant/profile") {
    return reply(200, {
      unit_label: "Unit 101",
      property_name: "Oakview E2E Residency",
      property_address: "42 Smoke Test Lane",
      property_city: "Varanasi",
      lease_start: null,
      lease_end: null,
      rent_due_day: 5,
      is_active: true,
    });
  }
  if (path === "/api/v1/tenant/maintenance") return reply(200, []);
  if (path === "/api/v1/tenant/announcements") return reply(200, []);
  if (path === "/api/v1/tenant/documents") return reply(200, []);

  // --- generic fallback keeps secondary panels on empty states ----------------
  if (req.method === "GET") {
    return reply(200, page([]));
  }
  return reply(200, {});
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`E2E stub API listening on http://127.0.0.1:${PORT}`);
});
