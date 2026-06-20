# Sands Roofing JobNimbus Gateway

This is a small custom API that sits between employee GPT agents and JobNimbus.

The important rule: employee permissions are enforced by this gateway, not by GPT instructions alone.

## What It Does

- Authenticates each employee/agent with a separate gateway API key.
- Maps that key to an employee in `config/permissions.json`.
- Checks whether the employee is allowed to perform the requested action.
- Blocks actions that need approval.
- Calls JobNimbus only after the permission check passes.

## Current Safe Actions

- Search contacts or jobs.
- Read contacts or jobs when allowed.
- Create tasks.
- Update task status.
- Create notes.

The first version intentionally does not support deletes, financial updates, bulk edits, or direct job status changes.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your JobNimbus API key.
3. Create a different gateway key for each employee.
4. Adjust `config/permissions.json` to match your real team emails and permissions.
5. Start the API:

```bash
npm start
```

The API runs at:

```text
http://localhost:8787
```

## Employee Authentication

Each GPT Action should send:

```text
Authorization: Bearer <employee-gateway-key>
```

For production, replace static gateway keys with SSO/OAuth or another signed identity method. Static keys are acceptable for a first internal prototype, but they should be treated like passwords.

## GPT Action Setup

Use `examples/openapi.yaml` as the starting schema for a GPT Action.

In ChatGPT Business, restrict the action domain to your deployed gateway domain. Do not point GPTs directly at JobNimbus.

## Permission Model

Permissions live in:

```text
config/permissions.json
```

Each employee has:

- `allow`: actions the gateway can run automatically.
- `approvalRequired`: actions the gateway must reject until a separate approval flow exists.
- `scope`: constraints such as assigned-only sales records.

## Required Gateway Keys

Configure one secret environment variable for each enabled employee/agent:

- `ERIC_GATEWAY_KEY`
- `IAN_MILLER_GATEWAY_KEY`
- `IAN_ROBINSON_GATEWAY_KEY`
- `ELLIS_GATEWAY_KEY`
- `EVAN_GATEWAY_KEY`
- `JOHNNY_GATEWAY_KEY`
- `TOMMY_GATEWAY_KEY`

## JobNimbus Authentication

The default JobNimbus auth header is:

```text
X-API-Key: <JOBNIMBUS_API_KEY>
```

If your JobNimbus API key requires a different header format, set `JOBNIMBUS_AUTH_SCHEME`:

- `api-key`: sends `X-API-Key`
- `bearer`: sends `Authorization: Bearer`
- `token`: sends `Authorization: token`

## Recommended Production Path

1. Keep this API read-only for the first rollout.
2. Add task and note writes after testing.
3. Add approval workflow for sensitive writes.
4. Add durable audit logging.
5. Replace static keys with SSO/OAuth identity.
6. Host the gateway behind HTTPS.
