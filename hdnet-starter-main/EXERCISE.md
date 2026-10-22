# HDNet Order Lookup: Take-Home Exercise

## Overview

HDNet is an internal web application that lets staff look up pharmacy home-delivery orders and cancel them when needed. This exercise is a small version of it: a sign-in page and an order list with a cancel action, running against a mock REST API.

The HDNet developer will work as the only front-end engineer on the application. The exercise is designed to show how a candidate structures an application and explains their decisions in code and in writing.

## Time Limit

The work is sized for about 2-3 hours. Stop at 4 hours even if the work is unfinished. The README should say what was left undone and how it would be finished.

## Provided

- **`mock-api/`**: a local REST API that runs with `npm start`. Its README lists the test users, request and response formats, and error responses.
  - `POST /auth/login`: takes a username and password and returns an access token with role claims.
  - `GET /orders?page=&size=`: a paged list of orders, newest first.
  - `POST /orders/{orderNumber}/cancel`: cancels an order. Requires a reason.
  - `GET /orders/{orderNumber}`: order detail. **Not needed for this exercise.**
- **`sample-config/app.config.json`**: a sample configuration file from an existing application, used for README question B. It does not need to be used in the app.

## Technology

- Angular (current version) with standalone components.
- Angular Material for UI components.
- The API base URL goes in Angular's environment file.
- Any other libraries are allowed. The README must explain why each one was added.

## Functional Requirements

1. **Sign-in.** Users sign in through `POST /auth/login`. Signed-out users are redirected to the login page. The access token is attached to every API call.
2. **Access control.** Users with the `HDNet Viewer` role can view orders. Only users with the `HDNet Cancel` role see the Cancel action.
3. **Order list.** A paged table of orders, with loading, empty and error states.
4. **Cancel order.** A confirmation dialog with a required reason. The table shows the updated status afterward.
5. **Tests.** At least two meaningful tests:
   - one for the route guard or the HTTP interceptor
   - one for the cancel dialog

   The README should say what else would be tested with more time.

## Views

The application has two pages and one dialog.

### Login (`/login`)

- Username field, password field and a Sign In button. Styling is not evaluated.
- A failed login shows "Invalid username or password."
- On success, go to `/orders`.

**Test users:**
- `viewer`: can view orders.
- `agent`: can view and cancel orders.

Passwords are in the mock API README.

### Orders (`/orders`)

```
+-------------------------------------------------------------+
| HDNet                                      agent  [Sign out] |
+-------------------------------------------------------------+
| Order #    Order Date   Status       Rx  Ship-To             |
| HD100312   2026-10-08   RECEIVED      3  IL        [Cancel]  |
| HD100311   2026-10-08   RECEIVED      1  OH        [Cancel]  |
| HD100310   2026-10-08   PROCESSING    3  OH        [Cancel]  |
| ...                                                          |
|                                 25 per page  1-25 of 312 < > |
+-------------------------------------------------------------+
```

Order dates are generated relative to when the mock API starts, so they will differ from this sketch.

- **Header:** shows the signed-in username and a Sign Out button. Sign Out clears the session and goes to `/login`.
- **Table columns:** Order #, Order Date, Status, Rx Count, Ship-To State. Raw API values are fine; no special formatting is needed.
- **Paging:** handled by the server. 25 per page by default.
- **Cancel button:** shown only to users with `HDNet Cancel`, and only on orders with status `RECEIVED` or `PROCESSING`.
- **States:**
  - **Loading:** the text "Loading orders..."
  - **Empty:** "No orders found."
  - **Error:** "Orders could not be loaded."

### Cancel Order Dialog

Opened from a row's Cancel button.

- **Contents:** the order number, a required **Reason** dropdown (the four reasons listed in the mock API README), and two buttons: **Keep Order** and **Cancel Order**.
- **Success:** the dialog closes and the row shows `CANCELLED` with no Cancel button.
- **Failure:** the dialog stays open and shows the `message` from the error response.

### Accessibility

Use Angular Material's form field labels so every input has a visible label.

## Source Control (Required)

- Deliver the work as a **hosted Git repository**: GitHub, GitLab, Bitbucket or Azure DevOps. A private repository is fine if reviewers are given access. **ZIP files and other archives will not be accepted.**
- The first commit is this starter package, unchanged. After that, commit the work as it progresses.
- The commit history is part of the evaluation. Small, focused commits with clear messages are expected. A single commit containing all of the work will count against the submission.

## Code Clarity and Comments (Required)

- Code must be easy for another developer to read on first sight: clear names, small focused functions and components, and a consistent project structure.
- Comments should explain *why*: design decisions, trade-offs, business rules, and anything that is not obvious from the code. Comments that just repeat what a line does are not wanted.
- Every service and every non-trivial component has a short header comment describing its purpose.

## Deliverables

1. A link to the Git repository.
2. A README in the repository (replacing the starter README) covering:
   - how to run the app and the tests
   - the main design decisions and the reasons for them
   - what was left undone and why
   - how AI tools were used, if at all
   - short answers (one paragraph each) to these two questions:
     - **A.** Where should the access token be stored in the browser, and what are the trade-offs?
     - **B.** The sample `app.config.json` contains a value named `CLIENT_SECRET`. Is this a problem, and what should be done about it?

## AI Tools

AI tools may be used, as long as the README says how they were used. In the follow-up session the candidate will walk through the code and extend it live, so they need to understand all of it.

## Follow-Up Session

A 45-60 minute session in which the candidate walks through the code, explains their decisions and makes a small change live.

## Evaluation Areas

- **Correctness:** the requirements are met, including when a cancel is rejected or the API is unavailable.
- **Code clarity and comments:** readable structure and comments that explain why.
- **Git practice:** commit history and commit messages.
- **Application structure:** how the app is organized and whether it follows current Angular practices.
- **Security judgment:** token handling, role checks and the two README questions.
- **Testing:** which tests were chosen and how well they are written.
- **Written communication:** clarity of the README and the answers to the questions.
