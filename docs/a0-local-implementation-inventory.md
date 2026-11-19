# A-0: local implementation inventory and synchronization candidate

Date: 2026-11-19. Mandate v1.2 adopted by the operator. Public base: ecba776.

This candidate copies selected code from the internal working tree into an
isolated branch. It excludes private state, credentials, DID/wallet ownership
bundles, signer service binaries, build outputs, captured operational responses,
node_modules and unrelated dirty changes. It does not replace or rewrite the
original working tree. File-level source hashes are in `a0-sync-manifest.json`.
This document is a proposed scope reconciliation for Muse, not an amendment to
the mandate's research or economic claims.

| Module | Implemented behavior | Synthetic validation | Live qualification |
| --- | --- | --- | --- |
| `one_shot.js`, `bounded_body.js` | Exclusive durable attempt fence, bounded response reads, phase diagnostics, conservative unknown outcomes | Concurrent/restart replay, delayed/lost responses, save/journal failures, malformed completions | No successful SOV completion |
| `execute_one.js`, execution CLI | Authenticated network/scope/quota/expiry checks, one short completion and receipt readback | Injected transport scenarios | No usable issuer credential retained |
| `gateway_receipt.js`, `reconcile_one.js`, reconciliation CLI | Exact request binding and amount handling, GET-only original-request readback | Refusal, missing/wrong identity, malformed amounts and authority expiry | No SOV paid receipt/finality |
| `direct_readback.js`, readback CLI | Bounded explorer GET with exact channel/agent/miner binding | 404/503/wrong-party results stay unconfirmed | Public third-party smoke returned 503; no SOV channel |
| `payload-adapter.mjs` | Injected wallet payload preparation, explicit approval, reservation hook and single signature request; no broadcast | Mutation, rejection, disconnect, concurrency and late result checks | Talisman chain-payload signing unverified; UI/live executor not integrated |
| `enrollment_challenge.js`, `enrollment_diagnostics.js`, `enrollment_result.js` | Exact statement/schema/purpose validation and refusal-versus-unknown classification | Signature-context/expiry/error fixtures | Real retained requests had refusal or unknown outcomes; no credential |
| `sdk_registry.js` | Static package review classification and explicit runtime allowlist checks | Unknown/mismatched runtime and transaction versions never authorize signing | Observed runtime 1014027 outside inspected SDK 0.6.0 list ending at 1014020 |
| `index.js`, `launch_watch.js` | Activation proof and readiness/schedule assessment | Official-evidence requirements and signal separation | Testnet LIVE not proven |
| `airdrop_ledger.js`, `asset_claim_gate.js` | Append-only evidence, separate eligibility/allocation/unlock concepts and authenticity checks | Tampering, inappropriate evidence, unverified assets/claims | No allocation/claim/scoring eligibility proven |
| `autonomous/evidence_ledger.js` | Hash-linked local evidence records | Included ledger tests | Historical internal evidence not exported or rewritten |

## A-3 and A-4 remaining scope proposal

A-3 is no longer a client-from-zero ticket. Remaining work is an authorized,
supported live route, an actual short Devnet inference, and retained genuine
settlement evidence. The existing wallet has user-confirmed faucet receipt;
another faucet request is not assumed necessary or authorized by this candidate.

A-4 has completion and gateway-ledger interpretation helpers, but no successful
end-to-end proof/finalized-payment chain. A full abstract `InferenceClient` with
all proposed specification fields is not claimed: the gateway completion request
and direct compute-channel request are distinct surfaces. Resolve the actual
API contract under A-2 before setting that interface. Preserve UNKNOWN for proof,
account attribution, transaction finality and Testnet scoring until verified.

## Reproduction and scope limits

Run `npm test` and `npm run audit` from this candidate. Only Node built-ins are
needed for the synchronized tests and payload adapter mock scenarios. No wallet,
signer service, network credentials or SDK installation is needed for these tests.

The first full candidate run passed 86/87 tests; the pre-existing eight-process
nonce test failed to obtain a lock while unrelated files ran concurrently. Its
isolated run passed 3/3. The package test runner now serializes test files while
retaining all eight simultaneous child processes inside that nonce test. This
does not alter nonce production behavior or weaken its assertions.

Windows final results are recorded in the ticket brief. Linux validation is
pending an actual Linux run; no cross-platform pass is inferred from Windows.
The existing buffered prepublication audit remains an explicit A-1 item.

## Publication boundary

A-0 is not complete until the code and inventory can be read on GitHub by Muse.
This local commit is reviewable preparation only. Push/PR publication is held for
the operator's explicit approval under mandate section 7. No autonomous posting,
wallet/key change, service start, install, inference or transaction is enabled.
