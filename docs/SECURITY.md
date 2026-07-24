# Security & Privacy Review

Audited against the **OWASP Top 10 for LLM Applications**, **OWASP secure
headers** guidance, and child-privacy regulation (COPPA / FERPA awareness),
because this tool operates adjacent to children even though its user is an
adult facilitator.

## Threat model

Public web app; the user is an adult GM; the model produces fiction for
children ages 8–14. Assets to protect: (1) children — from inappropriate
content, (2) student privacy — no child PII should enter or leave the system,
(3) the API key / cost — from abuse.

## Controls in place

### LLM-specific (OWASP LLM Top 10)

| Risk | Control |
|---|---|
| LLM01 Prompt injection | System prompts are hardcoded constants; user text arrives only in the user message; the independent Layer-2 reviewer judges the *output* regardless of what the input tried to do |
| LLM02 Insecure output handling | All model output is JSON-parsed and type-coerced before rendering; React default escaping; no `dangerouslySetInnerHTML`; parse failure falls back to plain text display |
| LLM04 Model DoS / cost abuse | Server-side input caps on every field (situation 2000, notes 1000, setting 100 chars); frontend `maxLength` with countdown; per-IP rate limit (20 req/min) on all AI endpoints |
| LLM06 Sensitive info disclosure | Generic error messages — raw gateway errors are never forwarded to the client; prompts instruct never to echo a child's name; reviewer flags PII in output |
| LLM08 Excessive agency | The model can only return text suggestions — no tools, no code execution, no data access, and a human explicitly accepts/revises/ignores everything |
| LLM10 Key theft | `LOVABLE_API_KEY` lives in server env only; never bundled client-side; repo private |

**No safety bypass:** all three AI endpoints (`generate`, `revise`, `callback`)
pass output through the same Layer-2 child-safety review. Hardening one door
and leaving two open is the classic mistake.

### Input/output validation (assume both the user and the model are hostile)

- **Input sanitization** (`validate.server.ts`): every user-controlled string is
  stripped of control characters and zero-width/bidi-control characters (a
  documented prompt-injection *hiding* technique — instructions invisible to a
  human reviewer but read by the model), then length-capped.
- **Server-side output schema validation**: the model's JSON is parsed and
  validated ON THE SERVER before it ships to the browser. Unknown fields are
  dropped (a manipulated model can't attach arbitrary payloads), enums (`tone`,
  `dice_hook`) are coerced to an allowlist, lengths are capped, and outcome
  count is capped at 3. The client only ever receives a vetted shape.
- **Security regression tests** (`npm test`): 45 checks encoding the threat
  model — hidden-char smuggling, hostile JSON fields, enum injection, oversized
  payloads, garbage output. Run in CI-fashion before any prompt or endpoint
  change.

### Web-app layer

- **Security headers** (`public/_headers`): `X-Frame-Options: DENY`
  (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  no-referrer`, `Permissions-Policy` disabling geolocation/camera/mic. HTTPS
  is enforced by the host.
- **Malformed request handling:** JSON body parse wrapped in try/catch → 400,
  not a crash.
- **Input allowlisting:** `ageRange` is validated against the three known
  values, not passed through as a free string.

### Child privacy (COPPA / FERPA awareness)

- The tool is **directed at adult facilitators**, not children, and children
  never interact with it — the strongest COPPA posture is to keep it that way.
- **No accounts, no persistence, no analytics**: nothing a student says or does
  is collected or stored. Session state lives in browser memory and vanishes on
  reload.
- **PII is actively repelled**, not just "not collected": prompts instruct the
  model never to echo a real child's name; the reviewer flags PII that slips
  through; nothing is logged server-side.
- Design rule for future features (e.g., persistent session logs): store
  **story facts, never student facts** — and if educator accounts are ever
  added, that's the point where a formal COPPA/FERPA review is required.

## Honest limitations (say these out loud — they're a feature)

1. **Rate limiter is in-memory.** On serverless, each isolate counts
   separately, so it dampens abuse rather than hard-capping it. Production:
   KV/Durable Objects.
2. **Same-model judge.** The Layer-2 reviewer runs on the same model family as
   the generator (self-review bias). Production: separate, cheaper judge model.
3. **No CAPTCHA/auth.** Anyone with the URL can spend quota. Acceptable for a
   demo; production would gate behind educator accounts.
4. **Content-Security-Policy not set** — would require auditing the framework's
   inline-script usage first; listed as follow-up rather than shipping a broken
   CSP.
