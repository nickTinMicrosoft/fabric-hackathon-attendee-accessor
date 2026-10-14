# Private event account reservations

GitHub Pages is public static hosting. It cannot securely store a password or
guarantee unique reservations without shared state. This optional Node.js 22
Azure Functions service supplies that shared state in Azure Table Storage.
The website still works with facilitator-assigned numbers if it is not deployed.

## Guarantees and limits

- A claim atomically creates a slot row and an attendee row in **one Azure
  Table transaction**, in the same event partition. Create-only operations
  enforce uniqueness; there is no read-then-overwrite race.
- Numbers are limited to 1-50. Retrying the same 256-bit browser token returns
  the same number, even after a response is lost or the pool fills.
- Different app instances use the same table and event ID. Scaling or
  restarting the Function does not reset reservations.
- Browser Web Locks coordinate simultaneous tabs. Only the opaque reservation
  token and non-sensitive checklist state are saved locally. Treat the token
  as a private recovery key. Passwords and event codes stay in memory only.
- **One browser is not one person.** Clearing site storage, switching browsers,
  or using Incognito loses recovery and can consume another account. Direct
  attendees to their facilitator instead. Do not automatically recycle claims.
- There is no identity proof or per-person admission in this design. The event
  code is a shared access gate, not a substitute for Entra sign-in. CORS limits
  browser access; it does not block non-browser clients.
- Shared lab passwords allow anyone who knows the password and usernames to
  try other lab accounts. For stronger isolation, use distinct per-user
  passwords, authenticated registration, and a roster keyed to verified
  attendee identities. The allocator prevents duplicate allocation, not direct
  sign-in to a different Entra account.
- Never mix ad-hoc manual assignments into a live automatic pool. Before
  opening reservations, put every previously assigned manual number into
  `RESERVED_USER_NUMBERS`. Keep that exclusion list fixed for the event.

## Provision and configure

Deploy these resources in your own Azure subscription; normal Azure charges
apply. No resources are provisioned by the Pages workflow.

1. Create a **StorageV2** account and a table named `AttendeeClaims`.
2. Create a **Node.js 22 Azure Function App (Functions v4)** on a supported
   Linux plan, such as Flex Consumption. Enable HTTPS-only and its
   system-assigned managed identity. Keep the normal Functions host storage
   configuration created by Azure.
3. Assign the Function identity **Storage Table Data Contributor** on the
   claims storage account. Set `TABLE_SERVICE_URL` to the account's HTTPS
   table endpoint, for example `https://<account>.table.core.windows.net`.
   The service uses `DefaultAzureCredential`; no table access key is required.
4. Create a Key Vault and store the lab password and a separate, random private
   event code as secrets. Use at least 16 characters for the event code and do
   not reuse the lab password. Grant the Function identity **Key Vault Secrets
   User** on the vault. Configure the settings below in the Function App
   environment variables. For secrets use **Key Vault references** such as
   `@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/<name>/)`.
   Paste the actual secrets only into Key Vault, never into Git or the site.
5. Configure the Function App's platform CORS to allow exactly
   `https://nicktinmicrosoft.github.io` (no repository path or trailing slash).
   Do not enable wildcard origins or credentialed CORS.
6. From the repository root run `npm ci`. Install Azure Functions Core Tools v4
   if needed, sign into Azure, then from `api` run
   `func azure functionapp publish <function-app-name>`.
   The deployment installs the API's own `package.json` dependencies. On plans
   requiring a different deployment method, deploy the contents of `api` as the
   Function project root with a remote npm build.
7. Set `access_api_url` in the root `_config.yml` to
   `https://<function-app>.azurewebsites.net/api/claim` and republish Pages.
   This URL is public configuration; secrets must remain server-side.

| Function setting | Value |
|---|---|
| `EVENT_ID` | Stable unique label, e.g. `malv26`; 1-64 letters, numbers, `_`, `-` |
| `TABLE_NAME` | `AttendeeClaims` |
| `TABLE_SERVICE_URL` | HTTPS table service endpoint |
| `EVENT_CODE` | Key Vault reference to the private event code; 16-256 characters |
| `LAB_PASSWORD` | Key Vault reference to the event's lab password |
| `ALLOWED_ORIGIN` | `https://nicktinmicrosoft.github.io` |
| `EVENT_END_UTC` | Actual event cutoff as an ISO UTC timestamp, e.g. `2026-11-01T22:00:00Z`; choose the real date |
| `RESERVED_USER_NUMBERS` | Optional comma-separated manually assigned numbers, e.g. `1,2,10`; leave empty if none |

Use the **same `EVENT_ID` and table for the entire event**. Changing either
starts a new pool and could allocate accounts already in use. Deploy only one
active pool for these 50 Entra accounts. An event cutoff stops credential
delivery but does **not** disable or reset Entra accounts.

Keep anonymous registration endpoint request rate limits at your ingress
(for example API Management or Front Door/WAF) if publicly advertised. The
50-account cap protects the pool from duplicate assignments but does not
protect it from being exhausted by someone holding the shared event code.
Never configure proxies or diagnostics to log request/response bodies.

## Pre-event acceptance checks

Use two clean browser profiles and a facilitator-only test event / test
accounts, not the live attendee pool. Test reservations consume real slots:

1. With an incorrect code, verify no credentials appear and no rows are added.
2. Claim in both profiles; verify different numbers. Reload and recover in the
   first profile; verify it gets the same number.
3. Open two tabs in one profile and claim concurrently; both must show the
   same number.
4. Verify browser network responses include `Cache-Control: no-store, private`.
   Check a wrong origin and an expired cutoff are rejected.
5. Verify the real lab accounts can sign in and have the required Fabric
   permissions. Assignment does not create or configure Entra users.
6. Before opening the real event, switch to the final event ID only when all
   test users have been reset and the new account pool is unused. Do not change
   it again during the event.

## Operations and end of event

To see allocated numbers, query rows in the event partition whose row key
starts with `slot-`, using Azure Storage Explorer with authorized operator
access. There is intentionally no public list of claims or reset endpoint.
Manually assigned exclusions are not slot rows; retain the facilitator roster.

Do not delete individual slot/attendee rows or release abandoned reservations
during the event. Keep an assignment record if a participant loses their
browser token and recover through the facilitator. Never give out another
reserved number simply because it appears inactive.

At event end, reset or disable **all 50 Entra accounts**, revoke their sessions,
remove unnecessary permissions, and close the Function through the cutoff or
by disabling the endpoint. Rotate the event code and Key Vault password.
Only clear the old partition after accounts and sessions are reset and the
event is definitively over. Rotating the password after the event does not
make publishing it during the event safe.

## Local tests

From the repository root:

```text
npm ci
npm test
npm run test:storage
```

The storage suite starts Azurite on a temporary local port, creates and removes
only its own uniquely named table, and tests 75 simultaneous claims against
the 50-account limit plus concurrent retries for a single browser token.
The HTTP suite tests event-code authorization, origin validation, request
validation, cutoff, failure handling, and credential-safe logging.
