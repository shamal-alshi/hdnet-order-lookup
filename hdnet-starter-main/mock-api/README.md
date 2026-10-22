# HDNet Mock API

A local REST API for the HDNet Order Lookup exercise. It has no dependencies to install and needs Node.js 18 or later.

## Running

```
cd mock-api
npm start
```

The API listens on `http://localhost:3000`. To use a different port, set the `PORT` environment variable. The API allows cross-origin requests, so an Angular dev server on port 4200 can call it directly.

The API behaves the same way every time it runs. Data is held in memory, so restarting the API resets all orders and invalidates every token issued before the restart.

## Postman Collection

`postman/hdnet-mock-api.postman_collection.json` contains a request for every endpoint and error case below. Import it into Postman and run the two login requests first; they save each user's token for the other requests to use. After restarting the API, run the login requests again.

## Test Users

| Username | Password | Roles |
|---|---|---|
| `viewer` | `viewer123` | `HDNet Viewer` |
| `agent` | `agent123` | `HDNet Viewer`, `HDNet Cancel` |

## Authentication

Every `/orders` endpoint requires the header:

```
Authorization: Bearer <accessToken>
```

The access token is a JWT. It does not expire. Its payload contains the user's roles:

```json
{
  "sub": "agent",
  "name": "Agent User",
  "roles": ["HDNet Viewer", "HDNet Cancel"],
  "iat": 1790000000
}
```

## Endpoints

### `POST /auth/login`

Request:

```json
{ "username": "agent", "password": "agent123" }
```

Response `200`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "user": {
    "username": "agent",
    "displayName": "Agent User",
    "roles": ["HDNet Viewer", "HDNet Cancel"]
  }
}
```

Errors: `400` missing fields, `401 INVALID_CREDENTIALS` wrong username or password.

### `GET /orders?page={page}&size={size}`

Requires `HDNet Viewer`. Returns orders newest first.

| Parameter | Required | Notes |
|---|---|---|
| `page` | No | Page number **starting at 0**. Default `0`. |
| `size` | No | Page size, 1-100. Default `25`. |

Response `200`:

```json
{
  "items": [
    {
      "orderNumber": "HD100312",
      "orderDate": "2026-09-25",
      "status": "RECEIVED",
      "rxCount": 3,
      "shipToState": "IL",
      "lastUpdated": "2026-09-25T15:26:27.882Z"
    }
  ],
  "page": 0,
  "size": 25,
  "totalItems": 312
}
```

Errors: `400` invalid parameter, `401`, `403`.

### `POST /orders/{orderNumber}/cancel`

Requires `HDNet Cancel`. Only orders in `RECEIVED` or `PROCESSING` can be cancelled.

Request:

```json
{ "reason": "CUSTOMER_REQUEST" }
```

Response `200`: the updated order, with `status` set to `CANCELLED`.

Response `409`: the order can no longer be cancelled. The response includes the order's current state:

```json
{
  "error": "NOT_CANCELLABLE",
  "message": "Order HD100310 can no longer be cancelled. Current status: SENT_TO_PHARMACY.",
  "order": {
    "orderNumber": "HD100310",
    "orderDate": "2026-09-25",
    "status": "SENT_TO_PHARMACY",
    "rxCount": 3,
    "shipToState": "OH",
    "lastUpdated": "2026-09-25T16:11:51.813Z"
  }
}
```

Errors: `400` missing or invalid reason, `401`, `403`, `404`, `409`.

### `GET /orders/{orderNumber}`

Requires `HDNet Viewer`. Returns one order with its full `statusHistory`. **Not needed for this exercise.**

## Reference Values

**Statuses**, in the order an order normally moves through them:

| Value | Can be cancelled |
|---|---|
| `RECEIVED` | Yes |
| `PROCESSING` | Yes |
| `SENT_TO_PHARMACY` | No |
| `SHIPPED` | No |
| `DELIVERED` | No |
| `CANCELLED` | No |

**Cancel reasons:**

| Value | Display text |
|---|---|
| `CUSTOMER_REQUEST` | Customer Request |
| `DUPLICATE_ORDER` | Duplicate Order |
| `ADDRESS_ISSUE` | Address Issue |
| `OTHER` | Other |

## Error Responses

Every error uses the same format:

```json
{ "error": "FORBIDDEN", "message": "This action requires the \"HDNet Cancel\" role." }
```

| Status | `error` value | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Invalid request body or parameter |
| 401 | `INVALID_CREDENTIALS` | Login failed (login endpoint only) |
| 401 | `UNAUTHORIZED` | Token missing or not valid |
| 403 | `FORBIDDEN` | The user does not have the required role |
| 404 | `NOT_FOUND` | Order or route not found |
| 409 | `NOT_CANCELLABLE` | The order is past the point where it can be cancelled |

## Testing Aids

- **Rejected cancel:** order `HD100310` is on the first page as `PROCESSING`, but cancelling it returns a `409` because it moves to `SENT_TO_PHARMACY` at that moment. It stays in that status afterward; restart the API to reset it.
- **Order list error:** stop the API while the application is running, then change pages.
