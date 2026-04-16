# WebDAV Worker Proxy Design

Date: 2026-04-16

## 1. Overview

Build a WebDAV relay proxy that runs on Cloudflare Workers with `wrangler 4.83`.

The product has two surfaces:

- A management UI built with `vite 8`, `react 19`, and `shadcn/ui`
- A Worker runtime that serves management APIs and proxies WebDAV traffic

The first version focuses on a single-administrator configuration workflow, multiple independent proxy routes, and streaming-safe WebDAV forwarding with minimal protocol-aware compatibility handling.

## 2. Goals

- Support multiple independent proxy routes
- Allow administrators to manage routes from a web UI
- Support per-route prefix, prefix stripping, target base URL, custom request headers, and enabled state
- Provide first-run initialization that creates an admin password and generates a one-time Worker Secret value for the user to configure in Cloudflare
- Use `HttpOnly` session cookies for admin authentication
- Preserve streaming behavior for uploads and downloads
- Provide light WebDAV compatibility handling for methods and selected headers
- Follow the visual language defined in `DESIGN.md`

## 3. Non-Goals

- Multi-admin accounts
- Role-based access control
- Audit logging
- Config version history or rollback
- Load balancing or multi-upstream failover per route
- Response body XML rewriting
- Encryption-at-rest for custom headers
- Configurable admin path
- In-product password recovery

## 4. System Architecture

The system is organized into four clear layers inside one repository.

### 4.1 Worker Runtime

The Worker runtime is the single request entrypoint. It dispatches requests into three categories:

- Management UI assets at `/admin` and `/admin/*`
- Management APIs at `/api/admin/*`
- Proxy traffic for all other paths

If a request is neither a reserved management path nor a matched proxy route, the Worker returns `404`.

### 4.2 Admin API Layer

The admin API layer owns initialization, authentication, and route management.

Responsibilities:

- Detect bootstrap state
- Create the initial admin password
- Generate and return a one-time Worker Secret value
- Authenticate the admin by password
- Issue and validate `HttpOnly` session cookies
- Manage proxy routes through CRUD plus enable/disable operations

The admin API never performs actual proxying.

### 4.3 Proxy Engine

The proxy engine owns route matching, target URL resolution, request forwarding, and minimal WebDAV-aware compatibility work.

Responsibilities:

- Longest-prefix route matching
- Prefix stripping or prefix retention behavior
- Request header merge logic
- Streaming request forwarding
- Streaming response forwarding
- Minimal WebDAV header rewriting for supported cases

The proxy engine does not parse or rewrite XML bodies.

### 4.4 KV Storage

Cloudflare KV is the durable store for:

- Admin password hash
- Route definitions
- Basic bootstrap metadata

The Worker Secret used for session signing is not stored in KV. It exists only as a Cloudflare Worker Secret configured by the user.

## 5. Reserved Paths

The following path prefixes are reserved and cannot be claimed by proxy routes:

- `/admin`
- `/admin/*`
- `/api/admin/*`

This prevents route conflicts between the management surface and proxy traffic.

## 6. Bootstrap and Authentication

### 6.1 Bootstrap States

The UI determines state from the server on every load. The system has three states:

1. `uninitialized`
   The Worker Secret is not configured. The user is shown the first-run initialization page.
2. `secret_pending`
   The password hash may already exist in KV, but the Worker Secret is still missing at runtime. The user remains on the initialization guidance screen.
3. `ready`
   The Worker Secret is configured and active. The user is shown the password login page.

The “I have completed it” button is only a manual re-check trigger. It does not define the actual system state.

### 6.2 First-Run Setup

When the Worker Secret is missing, the UI shows an initialization screen.

The user enters a single administrator password. The backend then:

- Hashes the password and stores the hash in KV
- Generates a strong random session secret
- Returns that generated secret to the frontend for one-time display

The generated secret is not written to KV.

The UI then shows:

- The generated secret value
- The required Cloudflare secret name: `ADMIN_SESSION_SECRET`
- Instructions for configuring the secret via Wrangler or the Cloudflare dashboard
- A button to re-check whether the secret is active

If the user configures the secret and refreshes the page later, the app should go directly to the login screen even if the re-check button was never clicked.

### 6.3 Reset Behavior

Supported reset flow:

- The user deletes the Worker Secret from Cloudflare
- On next load, the system detects that the secret is missing
- The UI returns to the first-run initialization page
- The next successful setup may overwrite the previous password hash in KV

This is the only supported password reset path in version one.

### 6.4 Login Model

Authentication is single-admin and password-only.

- The login form accepts only a password
- The backend verifies the submitted password against the hash in KV
- On success, the backend signs a session cookie using `ADMIN_SESSION_SECRET`

Recommended cookie attributes:

- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- `Path=/`

The session token should be stateless and contain only minimal data such as issued time, expiry time, and a version marker.

Recommended session lifetime for v1: 12 hours.

## 7. Route Model

Each proxy route contains at least the following fields:

- `id`
- `prefix`
- `stripPrefix`
- `targetBaseUrl`
- `customHeaders`
- `enabled`
- `createdAt`
- `updatedAt`

### 7.1 Field Semantics

- `prefix`
  A route prefix such as `/dav` or `/dav/private`
- `stripPrefix`
  If `true`, remove the matched prefix before appending the remaining path to the target base URL
- `targetBaseUrl`
  A fixed upstream base URL such as `https://storage.example.com/webdav`
- `customHeaders`
  A list of administrator-defined request headers stored in KV as plaintext
- `enabled`
  Disabled routes remain stored but are excluded from matching

### 7.2 Validation Rules

- Prefix must start with `/`
- Prefix must not collide with reserved management paths
- Duplicate prefixes are not allowed
- `targetBaseUrl` must be a valid `http` or `https` URL
- Header names must be non-empty
- Clearly invalid or hop-by-hop headers must be rejected

## 8. Route Matching and URL Resolution

### 8.1 Match Strategy

Only enabled routes participate in matching.

If multiple routes match a request path, the route with the longest matching prefix wins.

Example:

- Configured route `/dav`
- Configured route `/dav/private`

Request `/dav/private/a.txt` must match `/dav/private`.

### 8.2 Target URL Construction

Given:

- `prefix = /dav`
- `targetBaseUrl = https://upstream.example.com/root`
- incoming request path `/dav/a/b.txt`

If `stripPrefix = true`, forward to:

- `https://upstream.example.com/root/a/b.txt`

If `stripPrefix = false`, forward to:

- `https://upstream.example.com/root/dav/a/b.txt`

No template syntax is supported in v1. All targets are fixed base URLs plus deterministic path joining.

## 9. Proxy Behavior

### 9.1 Core Principles

- Preserve the original HTTP method
- Stream the request body to the upstream
- Stream the response body back to the client
- Do not buffer full bodies
- Do not parse XML bodies
- Do not rewrite response bodies

### 9.2 Supported Methods

The proxy must preserve and forward normal HTTP methods plus common WebDAV methods, including:

- `GET`
- `HEAD`
- `PUT`
- `DELETE`
- `OPTIONS`
- `PROPFIND`
- `PROPPATCH`
- `MKCOL`
- `MOVE`
- `COPY`
- `LOCK`
- `UNLOCK`

### 9.3 Request Header Handling

Request headers are processed in this order:

1. Start from the incoming client request
2. Remove headers that must not be forwarded
3. Apply system-level compatibility adjustments
4. Merge route-level custom headers last

Admin session cookies and other management-only credentials must never be forwarded upstream.

### 9.4 WebDAV Compatibility Rules

The proxy provides minimal but explicit protocol-aware handling without touching bodies.

#### `Destination` Rewriting

For methods such as `MOVE` and `COPY`, if the client-supplied `Destination` points to the current proxy domain, the proxy must rewrite it to the upstream target URL using the matched route rules.

If the `Destination` cannot be mapped to a valid proxied target, the proxy returns `400`.

#### `Depth`, `Overwrite`, and Similar Headers

These headers are forwarded as-is. The proxy does not reinterpret WebDAV semantics beyond preserving and safely forwarding them.

#### Response Header Adjustment

The proxy should keep response headers unchanged by default.

A minimal response-header rewrite layer is allowed for headers that can break client navigation when left bound to the upstream host. The primary candidates are:

- `Location`
- `Content-Location`

Only deterministic URL remapping should be performed. XML response content remains untouched.

## 10. Admin API

The first version exposes the following minimal management endpoints:

- `GET /api/admin/bootstrap`
  Returns bootstrap and runtime status
- `POST /api/admin/setup`
  Creates the initial password hash and returns a one-time generated Worker Secret value
- `POST /api/admin/login`
  Authenticates the admin and sets the session cookie
- `POST /api/admin/logout`
  Clears the session cookie
- `GET /api/admin/routes`
  Returns all configured routes
- `POST /api/admin/routes`
  Creates a new route
- `PUT /api/admin/routes/:id`
  Updates an existing route
- `PATCH /api/admin/routes/:id/toggle`
  Enables or disables a route
- `DELETE /api/admin/routes/:id`
  Deletes a route
- `GET /api/admin/health`
  Optional runtime status check for UI polling or manual refresh

All management endpoints require a valid authenticated session except bootstrap, setup, and login.

## 11. Management UI

The management UI is built with `vite 8`, `react 19`, and `shadcn/ui`, then served via Workers Assets.

### 11.1 Screens

The UI has three main screens:

1. Initialization screen
   - Password creation
   - One-time generated secret display
   - Wrangler and dashboard setup guidance
   - Secret status re-check action
2. Login screen
   - Single password field
3. Management console
   - Route list
   - Route create/edit form
   - Enable/disable actions
   - Delete action

### 11.2 Information Architecture

The main console should show:

- Current initialization status
- Whether the runtime secret is active
- Authenticated session state
- A route table with:
  - Prefix
  - Target base URL
  - Prefix stripping state
  - Custom header count
  - Enabled state
  - Row actions

Route editing may use a modal or side drawer.

### 11.3 Visual Direction

The UI must follow `DESIGN.md`:

- White-dominant layout
- Brand blue as the main action color
- Large rounded cards and surfaces
- Soft, restrained shadows
- `Outfit` for prominent headings
- `DM Sans` for UI, body text, and form controls

The resulting UI should feel like a clean productized admin console rather than a dark developer dashboard.

## 12. Error Handling

The system should distinguish the following classes of errors:

- Unmatched route: `404`
- Disabled route: `404`
- Invalid route configuration at runtime: `500`
- Invalid `Destination` mapping: `400`
- Upstream request failure: `502` or `504` depending on the condition
- Invalid admin login: `401`
- Unauthorized admin API access: `401`

Errors returned to the UI or client must be concise and diagnostic, without leaking password hashes, signature details, or stack traces.

## 13. Testing Strategy

### 13.1 Unit Tests

- Longest-prefix matching
- Target URL construction
- Prefix stripping behavior
- Reserved path validation
- Header merge logic
- Bootstrap state detection
- Password verification
- Session signing and validation
- `Destination` header rewriting

### 13.2 Integration Tests

- First-run initialization flow
- Secret-active transition to login page
- Password login success and failure
- Logout behavior
- Route CRUD plus enable/disable
- Validation of duplicate prefixes and invalid URLs
- Normal HTTP proxying
- WebDAV method forwarding
- `MOVE` and `COPY` with `Destination` rewrite

### 13.3 Manual Verification

- Large file upload and download remain streaming-safe
- Common WebDAV clients can list, upload, move, and delete files
- Management UI works on desktop and mobile widths
- Final UI follows the design language in `DESIGN.md`

## 14. Security Constraints

- Worker Secret is never stored in KV
- Generated Worker Secret is only shown once during setup
- Admin session cookies are never forwarded upstream
- Setup is only allowed while the runtime Worker Secret is missing
- Custom headers are intentionally stored as plaintext in KV for v1 simplicity

The plaintext-header decision is an explicit product trade-off and should be documented in implementation and README materials.

## 15. Delivery Scope for Version One

Version one includes:

- Cloudflare Worker project using `wrangler 4.83`
- Management UI using `vite 8`, `react 19`, and `shadcn/ui`
- Workers Assets for frontend delivery
- KV-backed password-hash and route storage
- First-run setup with one-time generated Worker Secret display
- Password-only admin login
- `HttpOnly` cookie-based session handling
- Multiple independent proxy routes
- Create, edit, delete, enable, and disable route operations
- Longest-prefix route matching
- Streaming-safe WebDAV forwarding
- Minimal `Destination` and selected response-header URL rewriting
- `404` for unmatched non-admin requests

