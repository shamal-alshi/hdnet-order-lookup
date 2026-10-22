/**
 * HTTP server for the HDNet mock API.
 *
 * Built on Node's standard `http` module with no third-party packages, so it
 * runs with a plain `npm start` and nothing to install. The API behaves the
 * same way on every run: no simulated delays or random failures.
 */

const http = require('http');
const auth = require('./auth');
const orders = require('./orders');

const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 10 * 1024;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** Every error response uses the same shape: a machine-readable code and a readable message. */
function sendError(res, statusCode, error, message) {
  sendJson(res, statusCode, { error, message });
}

/** Allows an Angular dev server on another port (e.g. 4200) to call the API directly. */
function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

/** Reads and parses a JSON request body. Resolves to null when the body is missing or not valid JSON. */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Checks the Bearer token and the required role. Sends the 401 or 403
 * response itself and returns false when access is refused, so a route can
 * simply stop when this returns false.
 */
function authorize(req, res, requiredRole) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'A Bearer access token is required.');
    return false;
  }

  const claims = auth.verifyToken(header.slice('Bearer '.length));
  if (!claims) {
    sendError(res, 401, 'UNAUTHORIZED', 'The access token is not valid.');
    return false;
  }

  if (!claims.roles.includes(requiredRole)) {
    sendError(res, 403, 'FORBIDDEN', `This action requires the "${requiredRole}" role.`);
    return false;
  }
  return true;
}

/** Parses a whole-number query parameter. Returns the fallback when absent and NaN when invalid. */
function parseIntParam(value, fallback) {
  if (value === null || value === '') {
    return fallback;
  }
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
    return sendError(res, 400, 'BAD_REQUEST', 'Request body must include "username" and "password".');
  }

  const user = auth.findUserByCredentials(body.username, body.password);
  if (!user) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password.');
  }

  return sendJson(res, 200, {
    accessToken: auth.issueToken(user),
    tokenType: 'Bearer',
    user: { username: user.username, displayName: user.displayName, roles: user.roles },
  });
}

function handleListOrders(res, url) {
  const page = parseIntParam(url.searchParams.get('page'), 0);
  const size = parseIntParam(url.searchParams.get('size'), DEFAULT_PAGE_SIZE);

  if (Number.isNaN(page)) {
    return sendError(res, 400, 'BAD_REQUEST', '"page" must be a whole number starting at 0.');
  }
  if (Number.isNaN(size) || size < 1 || size > MAX_PAGE_SIZE) {
    return sendError(res, 400, 'BAD_REQUEST', `"size" must be between 1 and ${MAX_PAGE_SIZE}.`);
  }

  return sendJson(res, 200, orders.listOrders({ page, size }));
}

function handleGetOrder(res, orderNumber) {
  const order = orders.getOrderDetail(orderNumber);
  if (!order) {
    return sendError(res, 404, 'NOT_FOUND', `Order ${orderNumber} was not found.`);
  }
  return sendJson(res, 200, order);
}

async function handleCancelOrder(req, res, orderNumber) {
  const body = await readJsonBody(req);
  if (!body || !orders.CANCEL_REASONS.includes(body.reason)) {
    return sendError(res, 400, 'BAD_REQUEST', `"reason" must be one of: ${orders.CANCEL_REASONS.join(', ')}.`);
  }

  const outcome = orders.cancelOrder(orderNumber, body.reason);
  if (outcome.result === 'NOT_FOUND') {
    return sendError(res, 404, 'NOT_FOUND', `Order ${orderNumber} was not found.`);
  }
  if (outcome.result === 'CONFLICT') {
    // The current order is included so the client can show its real status
    // without having to reload the list.
    return sendJson(res, 409, {
      error: 'NOT_CANCELLABLE',
      message: `Order ${orderNumber} can no longer be cancelled. Current status: ${outcome.order.status}.`,
      order: outcome.order,
    });
  }
  return sendJson(res, 200, outcome.order);
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

const ORDER_DETAIL_PATH = /^\/orders\/([A-Za-z0-9]+)$/;
const ORDER_CANCEL_PATH = /^\/orders\/([A-Za-z0-9]+)\/cancel$/;

async function route(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'POST' && path === '/auth/login') {
    await handleLogin(req, res);
    return;
  }

  if (req.method === 'GET' && path === '/orders') {
    if (authorize(req, res, auth.ROLES.VIEWER)) {
      handleListOrders(res, url);
    }
    return;
  }

  const detailMatch = path.match(ORDER_DETAIL_PATH);
  if (req.method === 'GET' && detailMatch) {
    if (authorize(req, res, auth.ROLES.VIEWER)) {
      handleGetOrder(res, detailMatch[1]);
    }
    return;
  }

  const cancelMatch = path.match(ORDER_CANCEL_PATH);
  if (req.method === 'POST' && cancelMatch) {
    if (authorize(req, res, auth.ROLES.CANCEL)) {
      await handleCancelOrder(req, res, cancelMatch[1]);
    }
    return;
  }

  sendError(res, 404, 'NOT_FOUND', `No route for ${req.method} ${path}.`);
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} -> ${res.statusCode}`);
  });

  route(req, res).catch((err) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  });
});

server.listen(PORT, () => {
  console.log(`HDNet mock API listening on http://localhost:${PORT}`);
  console.log(`Order ${orders.ALWAYS_CONFLICTS_ORDER_NUMBER} always returns 409 when cancelled.`);
});
