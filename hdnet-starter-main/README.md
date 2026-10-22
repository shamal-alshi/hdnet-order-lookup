# HDNet Order Lookup: Starter Package

This package contains everything needed to begin the HDNet take-home exercise. The full instructions are in [EXERCISE.md](EXERCISE.md).

## Contents

| Path | Purpose |
|---|---|
| `EXERCISE.md` | The exercise instructions and evaluation areas |
| `mock-api/` | Local REST API for the application to call. See [mock-api/README.md](mock-api/README.md). |
| `mock-api/postman/` | Postman collection with a request for every endpoint and error case |
| `sample-config/app.config.json` | Sample configuration file referenced by README question B |
| `.gitignore` | Keeps `node_modules`, build output and coverage out of the repository |

## Getting Started

1. **Create the repository.** Create a new hosted Git repository (GitHub, GitLab, Bitbucket or Azure DevOps), add the contents of this package **unchanged**, and push that as the first commit.
2. **Start the mock API.** Requires Node.js 18 or later.
   ```
   cd mock-api
   npm start
   ```
   The API runs at `http://localhost:3000`.
3. **Create the Angular application** in a new `app/` folder at the root of the repository, next to `mock-api/`.
4. **Commit as the work progresses.** The commit history is part of the evaluation.
5. **Replace this README** with the README described in the Deliverables section of `EXERCISE.md`.
