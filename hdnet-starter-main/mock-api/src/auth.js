/**
 * Test users, login and access-token handling for the mock API.
 *
 * Tokens are real JWTs (HS256) so candidates can decode the payload and read
 * the `roles` claim the same way they would with a production identity
 * provider. Tokens do not expire, to keep the exercise simple. The signing key
 * is generated fresh on every start, so restarting the mock API invalidates
 * every token it has issued.
 */

const crypto = require('crypto');

const ROLES = Object.freeze({
  VIEWER: 'HDNet Viewer',
  CANCEL: 'HDNet Cancel',
});

// Passwords are plain text on purpose: this is a local mock, not a real
// identity store.
const USERS = [
  { username: 'viewer', password: 'viewer123', displayName: 'Viewer User', roles: [ROLES.VIEWER] },
  { username: 'agent', password: 'agent123', displayName: 'Agent User', roles: [ROLES.VIEWER, ROLES.CANCEL] },
];

const signingKey = crypto.randomBytes(32);

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(data) {
  return crypto.createHmac('sha256', signingKey).update(data).digest('base64url');
}

/**
 * Checks a username and password. Returns the matching user, or null when the
 * credentials are wrong. The same null result is used for an unknown user and
 * a wrong password so the API does not reveal which usernames exist.
 */
function findUserByCredentials(username, password) {
  return USERS.find((user) => user.username === username && user.password === password) || null;
}

function issueToken(user) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: user.username,
    name: user.displayName,
    roles: user.roles,
    iat: Math.floor(Date.now() / 1000),
  }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

/**
 * Validates an access token. Returns its claims, or null when the token is
 * malformed or was not signed by this server.
 */
function verifyToken(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);
  const signaturesMatch = signature.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!signaturesMatch) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

module.exports = { ROLES, findUserByCredentials, issueToken, verifyToken };
