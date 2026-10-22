# HDNet Order Lookup

Internal order operations for pharmacy home-delivery staff. The application supports viewer and cancellation roles, server-side paging, and a guarded cancellation flow.

## Run locally

Node.js 18 or later is required.

In one terminal, start the mock API:

```bash
cd mock-api
npm start
```

In another, start the Angular application:

```bash
cd app/app
npm install
npm start
```

Open `http://localhost:4200`. Use `viewer` / `viewer123` for read-only access or `agent` / `agent123` to cancel eligible orders.

## Tests and build

```bash
cd app/app
npm test
npm run build
```

The included tests cover the signed-out route guard and the cancel dialog’s success and failure behavior. With more time, I would add tests for the authentication interceptor, role-specific table actions, paging error recovery, and an end-to-end API flow.

## Design notes

- The app uses standalone components, lazy-loaded route components, Angular signals for local and shared state, and an RxJS request stream for page changes. The app runs zoneless; explicit `OnPush` configuration is not needed.
- `AuthStore` keeps the active session in memory and mirrors it to `sessionStorage` so a browser refresh keeps the user signed in for that tab. The interceptor adds the access token only to protected API requests and signs the user out if the API returns `401`.
- `OrdersStore` owns the table state and uses `switchMap` so a newer paging request supersedes an older one. A successful cancellation replaces only that order in the current page rather than refetching it.
- Angular Material supplies accessible form controls, dialog semantics, table behavior, and paginator controls. No extra runtime libraries were added.

## Remaining work

The requested functionality is complete. Production work would add automated end-to-end coverage, a shared error-reporting strategy, session-expiry messaging, and server-provided user identity rather than trusting role claims from a client-readable token.

## Security questions

### A. Access token storage

For a browser-only application, an in-memory token is the safest option against persistent XSS theft, but it is lost on refresh. This app also uses `sessionStorage` to preserve the tab session, accepting that JavaScript can read it if an XSS vulnerability exists; it is cleared when the tab session ends. For an application with a supporting backend, I would prefer short-lived access tokens with refresh tokens in `HttpOnly`, `Secure`, `SameSite` cookies, plus CSRF protection where appropriate. Regardless of storage, the API must enforce authorization because client role checks are only a UI convenience.

### B. CLIENT_SECRET in app.config.json

Yes. A client secret shipped to a browser is not secret: any user can inspect the application bundle, configuration, or network activity. The value should be removed from front-end configuration, revoked and rotated if it was real, and held only by a trusted backend or a suitable identity-provider flow. Public browser configuration may contain non-sensitive identifiers and URLs, but never credentials capable of authenticating the application.

## AI assistance

AI assistance was used to review the exercise requirements, help identify missing implementation areas, and draft code and tests. The resulting implementation was reviewed locally, built, and tested against the supplied mock API.
