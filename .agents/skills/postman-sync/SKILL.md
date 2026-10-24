---
name: postman-sync
description: >-
  Synchronizes the Postman collection and environments in docs/postman/ with the ProxyGuard codebase.
  Use this skill whenever an endpoint is added, modified, or removed, or to prune unused environment variables.
---

# Postman Synchronizer Skill

This skill enforces strict synchronization between ProxyGuard's HTTP routes and the Postman testing suite located in `docs/postman/`:

- Collection: `docs/postman/ProxyGuard.postman_collection.json`
- Local Environment: `docs/postman/ProxyGuard.postman_environment.json`
- Production Environment: `docs/postman/ProxyGuard.production.postman_environment.json`

---

## Core Directives

Whenever changes occur to application endpoints:

1. **If a new endpoint is added**: It MUST be added to `docs/postman/ProxyGuard.postman_collection.json`. If it introduces new configuration parameters, add them to both environment files.
2. **If an endpoint is removed / deleted**: It MUST be deleted from `docs/postman/ProxyGuard.postman_collection.json`.
3. **If an environment variable is unused or its endpoint was deleted**: It MUST be deleted from both `ProxyGuard.postman_environment.json` and `ProxyGuard.production.postman_environment.json`.

---

## Synchronization Workflow

### 1. Adding a New Endpoint

When a new route is defined in `src/features/<feature>/<feature>.routes.ts`:

1. **Locate Target Folder**:
   - Find or create the corresponding feature folder in `ProxyGuard.postman_collection.json` (e.g. `04 - Proxy Leasing`).
2. **Define Request Object**:
   - `name`: Clear human-readable name of the action (e.g. `Lease Proxy (Sticky Host Target)`).
   - `request.method`: `GET`, `POST`, `PUT`, `DELETE`, etc.
   - `request.url`:
     ```json
     {
       "raw": "{{baseUrl}}/api/v1/<feature>/<path>",
       "host": ["{{baseUrl}}"],
       "path": ["api", "v1", "<feature>", "<path>"]
     }
     ```
   - `request.header`:
     - `Content-Type: application/json`
     - `Accept: application/json`
     - If the route uses `HasValidApiKeyGuard`, include:
       - `api-key-id: {{apiKeyId}}`
       - `api-key-secret: {{apiKeySecret}}`
   - `request.body`:
     - If request takes a payload, supply a valid JSON sample matching the TypeBox schema.
   - `description`: Detailed Markdown documentation explaining parameters, auth, rate limits, and expected responses.
3. **Add Automated Test Scripts (`pm.test`)**:
   - Assert expected HTTP status code (e.g. `pm.response.to.have.status(200)`).
   - Assert response body structure and types based on the TypeBox schema.
   - If the endpoint returns tokens, keys, or IDs needed downstream, save them:
     ```javascript
     const data = pm.response.json();
     if (data.id) {
       pm.environment.set('newVariable', data.id);
       pm.collectionVariables.set('newVariable', data.id);
     }
     ```
4. **Register New Environment Variables**:
   - If the new request references a new `{{variable}}`, add it to the `values` array in `ProxyGuard.postman_environment.json` and `ProxyGuard.production.postman_environment.json`.

---

### 2. Removing an Endpoint

When an endpoint is removed, deleted, or deprecated in the codebase:

1. **Locate the Request**:
   - Search for the endpoint method and path in `docs/postman/ProxyGuard.postman_collection.json`.
2. **Delete Request & Responses**:
   - Remove the request object and all its saved mock/sample responses from the folder's `item` array.
   - If no endpoints remain in that feature, remove the entire feature folder from the collection.
3. **Trigger Environment Variable Prune**:
   - Proceed immediately to Section 3 to delete any orphaned environment variables.

---

### 3. Pruning Unused Environment Variables

To ensure zero orphaned or dead variables in the environment files:

1. **Extract All Referenced Variables**:
   - Scan `docs/postman/ProxyGuard.postman_collection.json` for:
     - Interpolations: `{{variableName}}`
     - Script references: `pm.environment.get("variableName")`, `pm.environment.set("variableName", ...)`
2. **Compare Against Environment Values**:
   - For every entry in `ProxyGuard.postman_environment.json` and `ProxyGuard.production.postman_environment.json`:
     - If `entry.key` is NOT found anywhere in the active collection, **DELETE** it from both environment files.
3. **Core Base Variables Exemption**:
   - `baseUrl` is always retained as the root connection host.

---

## Verification & Validation

After modifying the collection or environment files:

1. **Validate JSON Syntax**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('docs/postman/ProxyGuard.postman_collection.json', 'utf8')); console.log('Collection OK');"
   node -e "JSON.parse(require('fs').readFileSync('docs/postman/ProxyGuard.postman_environment.json', 'utf8')); console.log('Local Env OK');"
   node -e "JSON.parse(require('fs').readFileSync('docs/postman/ProxyGuard.production.postman_environment.json', 'utf8')); console.log('Prod Env OK');"
   ```
2. **Format Files**:
   ```bash
   npm run format
   ```
