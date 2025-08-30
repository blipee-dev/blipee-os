# blipee OS API Documentation

Generated automatically from API route files.

**Base URL:** `https://app.blipee.com`

## Authentication

This API supports multiple authentication methods:

- **Session Authentication**: Uses secure HTTP-only cookies
- **Bearer Token**: JWT tokens in Authorization header
- **CSRF Protection**: Required for state-changing operations

## Ai

### GET /api/ai/cache

GET /api/ai/cache - Get cache statistics

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/ai/cache

DELETE /api/ai/cache - Clear AI response cache

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/ai/chat-enhanced

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/ai/stream

GET /api/ai/stream - Get streaming service status

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/ai/stream

POST /api/ai/stream - Start a new streaming session

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/ai/stream

DELETE /api/ai/stream - End a streaming session

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/ai/test

GET /api/ai/test - Get available test suites

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/ai/test

POST /api/ai/test - Run AI conversation tests

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/ai/test

PUT /api/ai/test - Create or update custom test suite

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Audit

### GET /api/audit/export

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/audit/summary

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Auth

### POST /api/auth/mfa/confirm

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/disable

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/mfa/email/add

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/email/add

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/email/add-verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/email/send

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/mfa/phone/add

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/phone/add

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/phone/verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/setup

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/sms/send

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/sms/verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/mfa/verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/oauth

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/recovery/initiate

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/recovery/security-questions

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/recovery/security-questions

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/recovery/stats

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/recovery/verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/reset-password

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/session

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sessions

GET /api/auth/sessions - Get all active sessions for current user

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/auth/sessions

DELETE /api/auth/sessions - Terminate a specific session or all sessions

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/signout

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/check

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/configurations/{id}

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/auth/sso/configurations/{id}

PUT operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/auth/sso/configurations/{id}

DELETE operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/sso/configurations/{id}/test

POST operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/configurations

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/sso/configurations

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/initiate

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/sso/initiate

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/logout

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/sso/logout

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/oidc/callback

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/sso/oidc/callback

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/sso/saml/callback

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/sso/saml/callback

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/webauthn/auth/options

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/webauthn/auth/verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/webauthn/credentials

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/auth/webauthn/credentials

DELETE operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/webauthn/register/options

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/auth/webauthn/register/verify

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/auth/webauthn/stats

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Backup

### GET /api/backup

/api/backup:

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/backup

/api/backup:

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/backup

/api/backup:

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/backup

/api/backup/{backupId}:

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Cache

### GET /api/cache/status

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/cache/status

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Compliance

### GET /api/compliance/consent

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/compliance/consent

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/compliance/data-export

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/compliance/data-export

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/compliance/deletion

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/compliance/deletion

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/compliance/deletion

DELETE operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/compliance/privacy-settings

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/compliance/privacy-settings

PUT operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/compliance/report

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/compliance/status

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Conversations

### GET /api/conversations/{conversationId}/history

GET /api/conversations/[conversationId]/history - Get conversation history

**Parameters:**

- `conversationId` (path): conversationId identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/conversations/{conversationId}/history

DELETE /api/conversations/[conversationId]/history - Clear conversation history

**Parameters:**

- `conversationId` (path): conversationId identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/conversations/{conversationId}/insights

GET /api/conversations/[conversationId]/insights - Get conversation insights

**Parameters:**

- `conversationId` (path): conversationId identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/conversations/{conversationId}/preferences

GET /api/conversations/[conversationId]/preferences - Get conversation preferences

**Parameters:**

- `conversationId` (path): conversationId identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/conversations/{conversationId}/preferences

PUT /api/conversations/[conversationId]/preferences - Update conversation preferences

**Parameters:**

- `conversationId` (path): conversationId identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Database

### GET /api/database/health

GET /api/database/health - Get database health status

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/database/health

POST /api/database/health - Execute specific health actions

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/database/optimize

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/database/optimize

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Documents

### POST /api/documents/sustainability-report

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Emissions

### POST /api/emissions/bulk

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Energy

### POST /api/energy/bulk

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Gateway

### GET /api/gateway/keys/{id}

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/gateway/keys/{id}

PUT operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/gateway/keys/{id}

DELETE operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/gateway/keys

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/gateway/keys

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/gateway/usage

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Health

### GET /api/health

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Import

### POST /api/import/sustainability-report

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Metrics

### GET /api/metrics

/api/metrics:

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Migrations

### GET /api/migrations

/api/migrations:

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/migrations

/api/migrations:

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Monitoring

### GET /api/monitoring/alerts

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/monitoring/alerts

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/monitoring/database

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/monitoring/metrics

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/monitoring/metrics

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/monitoring/queries

/api/monitoring/queries:

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/monitoring/queries

/api/monitoring/queries:

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/monitoring/read-replicas

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Onboarding

### POST /api/onboarding/start

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/onboarding/step

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Organizations

### GET /api/organizations/{id}/buildings

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/organizations/{id}/buildings

POST operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/organizations/{id}/members

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/organizations/{id}/members

POST operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/organizations/{id}

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PATCH /api/organizations/{id}

PATCH operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Retail

### POST /api/retail/v1/auth/telegram

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/retail/v1/health

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/retail/v1/stores

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/retail/v1/telegram/auth

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/retail/v1/telegram/state

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/retail/v1/telegram/state

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/retail/v1/traffic/realtime

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Security

### GET /api/security/stats

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Targets

### POST /api/targets/bulk

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Waste

### POST /api/waste/bulk

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Water

### POST /api/water/bulk

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

## Webhooks

### GET /api/webhooks/{id}/deliveries

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/webhooks/{id}

GET operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### PUT /api/webhooks/{id}

PUT operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### DELETE /api/webhooks/{id}

DELETE operation

**Parameters:**

- `id` (path): id identifier

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/webhooks/{id}/test

POST operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/webhooks/deliveries/{id}/retry

POST operation

**Parameters:**

- `id` (path): id identifier

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/webhooks

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### POST /api/webhooks

POST operation

**Request Body:** JSON object

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

### GET /api/webhooks/stats

GET operation

**Responses:**

- `200`: Successful response
- `400`: Bad request
- `401`: Unauthorized
- `500`: Internal server error

---

