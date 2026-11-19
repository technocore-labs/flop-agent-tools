# A-3a authentication and scope checkpoint

Observed 2026-11-20 JST (2026-11-19T18:04:19.048Z capture start). A-2 base: fa4ee40934f345bad9ec410f7289be0c4546a548. This is a bounded credential discovery result, not an assertion that no credential exists anywhere on the PC.

## Decision

| Question | Result | Evidence / limit |
| --- | --- | --- |
| Existing usable Gateway REST credential | UNKNOWN; none found in inspected sources | Two known retained enrollment response files contain no `key`; three named process environment variables are absent |
| Credential invalid/revoked | UNKNOWN | No bearer available for authenticated validation; historical enrollment refusals are not token-invalidity proof |
| Credential scope / allowed models | UNKNOWN | Authenticated GET `/v1/keys/me` not sent; catalog discovery cannot establish permissions |
| Credential expiry | UNKNOWN | No authenticated allowance obtained |
| Remaining quota | UNKNOWN | No authenticated allowance; no inferred zero or replenishment |
| Gateway connectivity | VALID at observation | Unauthenticated GET `https://api.flop.network/health`: HTTP 200, connected=true |
| Devnet network identity | MATCH at Gateway observation | observed_genesis_hash equals `0x99c172c095340ace980631f9123544c6bebd4839f3437e463533422d8be2d631`; service report, not independent storage proof |
| A-3b / Testnet eligibility | NOT AUTHORIZED / UNKNOWN | No inference, allocation or same-DID eligibility inferred |

## Bounded sources and sanitized findings

Inspected the applicable original AGENTS.md, mandate through A-3 and the latest brief checkpoint; A-2 surface document and proposal were read from its exact local commit. Existing dirty tracked/index state was left in place. No research/evidence bulk reads.

Known private enrollment response JSONs were read only in memory, never printed, hashed, copied or committed:

- `state/private/2026-11-17T00-12-45.446Z-gateway-enrollment-response.secret`: key absent; allowlisted historical error `wallet_enrollment_cap_reached`.
- `state/private/gateway-recovery-2026-11-18T11-46-13.504Z/gateway-enrollment-response.secret`: key absent; allowlisted historical error `wallet_enrollment_unavailable`.

Only names/metadata were inspected in the existing gateway-recovery directories; other recoveries contained attempt/stage/decision files without a retained response. Existing unknown-outcome markers remain untouched. No attempt marker was interpreted as failure or permission to retry. Known process variables FLOP_API_KEY, FLOP_GATEWAY_API_KEY and FLOP_GATEWAY_TOKEN were absent. No repo `.env`, `.env.local`, `credentials` or `secrets` entry was found by exact-name existence inspection. Browser storage, OS credential stores, arbitrary user directories and secret/private-key files were not searched. Hence machine-wide absence remains unproven.

## Tool review and execution boundary

Reviewed existing `enrollment_result.js` and `enrollment_diagnostics.js`: pure local classifiers, not credential validity checkers. The first can return an arbitrary saved model string and is not a sufficient generic redaction boundary. Reviewed `execute_one.js`, `execute_one_inference.js`, `reconcile_one.js`, `bounded_body.js` and enrollment helper. Executor includes inference POST and was not run; enrollment helper includes issuance/rotation and was not run. Receipt reconciliation requires a known request ID and is not a credential discovery mechanism. No standalone credential-only inspector was found in the bounded script/tool and sibling scratch searches.

A minimal scratch inspector was reviewed before use. It accepts only the two exact known JSON paths and three named process environment variables, bounds local/remote payloads, emits only fixed classifications and allowlisted metadata, catches errors without printing exceptions and fixes all HTTP destinations to api.flop.network. If a bearer exists, only GET `/v1/keys/me` is permitted, with redirects rejected, timeout, bounded body and no response/body/header logging. No bearer was present, so authenticated GET count was **0**. Public health GET count was **1**. No retries, enrollment, challenge, faucet, inference, signing, dependency changes, signer/service/ACL changes or network-state mutations occurred. No private key was read. No credential bytes entered docs or Git.

## Blocker and next authorization

A-3a inspection is complete with credential validity/scope UNKNOWN. A-3 as a whole remains blocked before inference. To resolve, SOV must either identify an existing authorized credential location for secret-safe read-only validation, or separately approve a supported issuer reconciliation/recovery action. Same-wallet bearer rotation is a state-changing action that can invalidate a prior bearer, does not renew quota/expiry and is outside this authorization; it must never be treated as an automatic retry. Preserve all unknown-outcome fences. A-3b requires a separate explicit SOV approval even if future authentication succeeds.

Validation: inspected classifications and public health response; documentation-only checkpoint, no product code changed and no full suite rerun. One session, no subagents or model override. Model/reasoning identity and start/end `/status` usage were not exposed by this session; no quota figures invented. Local checkpoint only; no push, PR, merge or publication authorized/performed.
