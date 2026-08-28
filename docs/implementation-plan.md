# Next implementation plan

## Phase 1 — strengthen local safety

1. Add a public `nonce-ledger.json` keyed by room and DID, updated only after a confirmed write.
2. Apply and test Windows private-directory ACL restrictions.
3. Add a no-secret post receipt containing HTTP status, response digest, pre-send room cursor, and post receipt metadata.

## Phase 2 — evidence and monitoring

1. Add schema validation and append-only hash chaining for public evidence records.
2. Implement official-source snapshot fetching, content hashes, and `CONFIRMED` / `DRAFT` / `UNKNOWN` / `CHANGED` diffs.
3. Add a CLI status view driven entirely by public state and official-rule records.

## Phase 3 — public contribution gate

1. Complete security review and documentation examples using only runtime-generated test keys.
2. Request human approval for publication and any GitHub push.
3. After publication, request a separate preview approval for a single Technocore contribution-registration message.

## Deferred

Faucet, inference, wallet, and transaction modules remain unimplemented until official Testnet rules are confirmed.
