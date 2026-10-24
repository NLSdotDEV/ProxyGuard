# ProxyGuard Postman API Collection & Environments

This directory provides a Postman test suite and environment configurations for **ProxyGuard**. Every endpoint, security guard, and error handler in the application is represented with automated test scripts and response validations.

---

## 📁 Directory Files

| File                                                                                                 | Description                                                                      |
| :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| [`ProxyGuard.postman_collection.json`](./ProxyGuard.postman_collection.json)                         | Complete Postman v2.1.0 collection with all endpoints, assertions, and examples. |
| [`ProxyGuard.postman_environment.json`](./ProxyGuard.postman_environment.json)                       | Local development environment configuration (`http://localhost:3000`).           |
| [`ProxyGuard.production.postman_environment.json`](./ProxyGuard.production.postman_environment.json) | Production environment template for deployed instances.                          |

---

## 🚀 Quick Start Guide

### 1. Import Files into Postman

1. Open **Postman**.
2. Click **Import** in the top-left corner.
3. Drag and drop both:
   - `ProxyGuard.postman_collection.json`
   - `ProxyGuard.postman_environment.json`
4. In the top-right environment selector, choose **"ProxyGuard Local Environment"**.

### 2. Configure Environment Secrets

In the environment settings, update the following variable:

- `proxyScrapeSecret`: Paste your valid ProxyScrape API key or token if you want to test upstream proxy loading.

### 3. Automated Sequential Execution

The collection is designed to run in order using Postman's **Collection Runner** or **Newman CLI**:

1. **Health Check** confirms the API server is up.
2. **Request API Key** calls `POST /api/v1/api-keys`, generates a fresh key, and automatically writes `apiKeyId` and `apiKeySecret` into your environment.
3. **Load Subaccounts** uses the stored credentials to contact ProxyScrape and dispatches worker sync jobs.
4. **Lease Proxy** requests a proxy endpoint and captures the `endpointId`.
5. **Refresh Proxy Lease & Report Ban** evicts the sticky session and bans the IP for the target domain.
6. **Security & Validation Tests** verify 403 Forbidden barriers, 400 Bad Request schema rejections, and 404 Not Found routing.

---

## 📋 Comprehensive Endpoint Coverage

|   #    | Group             | Method | Endpoint                                | Auth Required | Description                                            |
| :----: | :---------------- | :----- | :-------------------------------------- | :-----------: | :----------------------------------------------------- |
| **1**  | **Health**        | `GET`  | `/health`                               |      No       | Server uptime check & ISO timestamp                    |
| **2**  | **API Keys**      | `POST` | `/api/v1/api-keys`                      |      No       | Generates UUID v7 key & 64-char plain secret           |
| **3**  | **ProxyScrape**   | `POST` | `/api/v1/proxy-scrape/load-subaccounts` |    **Yes**    | Ingests ProxyScrape token & queues endpoint sync       |
| **4**  | **Proxy Leasing** | `PUT`  | `/api/v1/proxy/lease` (General)         |    **Yes**    | Leases any available non-banned proxy                  |
| **5**  | **Proxy Leasing** | `PUT`  | `/api/v1/proxy/lease` (Sticky)          |    **Yes**    | Leases proxy bound to hostname with 60s Redis TTL      |
| **6**  | **Proxy Leasing** | `PUT`  | `/api/v1/proxy/lease/refresh`           |    **Yes**    | Reports ban for target domain & re-leases fresh IP     |
| **7**  | **Security**      | `PUT`  | `/api/v1/proxy/lease`                   |  No Headers   | Asserts `403 Forbidden` (`ERR_FORBIDDEN`)              |
| **8**  | **Security**      | `PUT`  | `/api/v1/proxy/lease`                   |  Bad Secret   | Asserts `403 Forbidden` on Argon2 verification failure |
| **9**  | **Validation**    | `POST` | `/api/v1/proxy-scrape/load-subaccounts` |    **Yes**    | Asserts `400 Bad Request` on missing `secret`          |
| **10** | **Validation**    | `PUT`  | `/api/v1/proxy/lease/refresh`           |    **Yes**    | Asserts `400 Bad Request` on missing `endpointId`      |
| **11** | **Routing**       | `GET`  | `/api/v1/non-existent-endpoint`         |      No       | Asserts `404 Not Found` (`ERR_NOT_FOUND`)              |

---

## 🔑 Environment Variables Reference

| Variable            | Scope       | Description                                                               |                Auto-Populated?                |
| :------------------ | :---------- | :------------------------------------------------------------------------ | :-------------------------------------------: |
| `baseUrl`           | Environment | Base URL of ProxyGuard server (e.g. `http://localhost:3000`)              |                    Initial                    |
| `apiKeyId`          | Environment | Unique UUID identifier of the generated API key                           |     **Yes** (via `POST /api/v1/api-keys`)     |
| `apiKeySecret`      | Environment | 64-character hex secret for request authentication                        |     **Yes** (via `POST /api/v1/api-keys`)     |
| `proxyScrapeSecret` | Environment | Upstream ProxyScrape API token                                            |                 User-provided                 |
| `targetUrl`         | Environment | Target domain to test sticky sessions (default: `https://httpbin.org/ip`) |                    Initial                    |
| `endpointId`        | Environment | Identifier of leased proxy endpoint                                       |    **Yes** (via `PUT /api/v1/proxy/lease`)    |
| `subAccountId`      | Environment | ID of loaded ProxyScrape subaccount                                       | **Yes** (via `POST /api/v1/proxy-scrape/...`) |

---

## 🧪 Automated Testing with Newman CLI

You can run the entire test suite headlessly via [Newman](https://github.com/postmanlabs/newman):

```bash
# Run against local development server
npx newman run docs/postman/ProxyGuard.postman_collection.json \
  -e docs/postman/ProxyGuard.postman_environment.json \
  --reporters cli
```

To export HTML or JUnit reports for CI/CD pipelines:

```bash
npx newman run docs/postman/ProxyGuard.postman_collection.json \
  -e docs/postman/ProxyGuard.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export docs/postman/test-results.json
```
