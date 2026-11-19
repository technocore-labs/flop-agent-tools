# SOV A-3a local checkpoint — 2026-11-20 JST

A-2 base fa4ee40934f345bad9ec410f7289be0c4546a548. A-3a bounded read-only inspection complete; authentication/scope remain UNKNOWN. See docs/a3a-auth-scope-checkpoint.md for exact sources, safeguards and next approval boundary.

Two known enrollment responses contain no key (historical wallet_enrollment_cap_reached / wallet_enrollment_unavailable); three known process credential variables absent. This does not prove PC-wide absence. Public Gateway /health returned HTTP 200, connected=true and the expected Devnet genesis. No authenticated GET was sent because no credential was found. Scope, allowed models, expiry, quota and current invalid/revoked status are UNKNOWN.

Unknown enrollment fences and original dirty worktree/index/evidence preserved. No private-key access, signing, inference, enrollment/rotation, faucet, install, signer/service/ACL change or remote-state mutation. No push/PR/merge/publication. Next requires an existing credential location or separate SOV authorization for issuer reconciliation/recovery; A-3b always needs separate explicit approval. One session, no subagents/model override; usage/model identifiers unavailable, not inferred.
