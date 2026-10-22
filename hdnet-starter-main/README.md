# HDNet Order Lookup

An Angular application for pharmacy home-delivery staff to sign in, review orders, and cancel eligible orders. It uses the supplied local mock API.

## Run locally

Node.js 18+ is required.

Start the API in one terminal:

```bash
cd mock-api
npm start
```

Start the Angular app in another:

```bash
cd app/app
npm install
npm start
```

Open `http://localhost:4200`.

| User | Password | Access |
| --- | --- | --- |
| `viewer` | `viewer123` | View orders |
| `agent` | `agent123` | View and cancel eligible orders |

## Tests and build

```bash
cd app/app
npm test
npm run build
```

The included tests cover the signed-out route guard and the cancellation dialog’s success and failure behavior.

## What I built

- Sign-in with validation, login error feedback, and a show/hide password control.
- Protected `/orders` route for users with the `HDNet Viewer` role.
- Bearer-token HTTP interceptor for protected API requests. It clears the session and redirects to sign-in after a `401` response.
- Paged order table with loading, empty, and error states.
- Role-based Cancel action for orders in `RECEIVED` or `PROCESSING` status.
- Confirmation dialog with a required cancellation reason. A successful cancellation updates the row without reloading the current page; a rejected cancellation keeps the dialog open and shows the API message.
- Compact order workspace: fixed header, independently scrollable table, sticky column headers, and centered pagination.

## Project structure

```text
app/app/src/app/
├── core/       # Authentication store, route guards, interceptor, toast service
├── features/   # Login and orders features (page, API, store, dialog)
├── shared/     # Shared order, role, and session types
├── app.routes.ts
└── app.config.ts
```

The app uses standalone components and lazy-loaded routes. `core` contains cross-cutting concerns, while each feature keeps its UI and feature-specific logic together.

## Main design decisions

- **Signals for state:** `AuthStore` and `OrdersStore` use writable Angular signals internally and expose computed/readonly state to the UI. This keeps the current user, access token, orders, paging, loading, and error state easy to follow.
- **Server-side pagination:** the API returns one page at a time, so pagination is handled on the server and newer page requests replace older ones using `switchMap`.
- **Authorization:** route and UI role checks improve the user experience, but the API is still responsible for enforcing permissions and cancellation rules.
- **Session handling:** the session is kept in memory and mirrored to `sessionStorage` so a browser refresh preserves the current tab session.
- **UI:** Angular Material provides the form controls, dialog, table, paginator, and accessibility foundations without adding another UI library.

## Not included / next steps

Search and filters were not part of the exercise requirements, so I prioritized the required server-side pagination, role-based cancellation flow, and error handling within the time limit. In a real operations tool, I would add server-backed search and filters (for example, by order number, status, or state) rather than filtering only the currently loaded page.

With more time, I would also add tests for the interceptor, role-specific actions, pagination errors, and login submission, plus end-to-end coverage for the main flows and a production session-expiry experience.

## Security notes

### A. Access-token storage

The safest browser-only option against persistent XSS theft is an in-memory token, but it is lost after a refresh. This app also uses `sessionStorage` to keep the user signed in for the current tab, accepting that an XSS vulnerability could read it. In production, I would prefer short-lived access tokens with refresh tokens in `HttpOnly`, `Secure`, `SameSite` cookies and appropriate CSRF protections. The API must always enforce authorization regardless of where the token is stored.

### B. `CLIENT_SECRET` in front-end configuration

Yes, it is a problem. A browser-delivered secret can be read from application files or developer tools and is therefore not secret. It should be removed from front-end configuration and rotated if it was real. Secrets must remain on a trusted backend or with the identity provider; a browser app may only contain public configuration such as API URLs and client IDs.

## AI assistance

I used AI as an implementation aid for styling and template structure, including the login and orders layout refinements and the password-visibility control. I reviewed and adapted the suggestions to fit the existing Angular Material components, accessibility needs, and application flow. AI was also used to help organize this README; I reviewed the final implementation and documentation.
