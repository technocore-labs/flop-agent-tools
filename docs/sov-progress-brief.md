# SOV review branch checkpoints

This file contains sanitized branch checkpoints. The operator's local operational brief
retains the historical sessions and private evidence references separately.

## A-3a — completed inspection, access blocked

2026-11-20: local checkpoint 312a34a. Bounded saved-response and named environment checks
found no usable bearer. Validity, scope, expiry and quota UNKNOWN, not INVALID or zero.
Public health returned HTTP 200 and expected Devnet identity. No authenticated GET or
inference was sent. Existing unknown-outcome fences retained. A-3b is not authorized.

## A-2 status application — PR review pending

Checkpoint 001aaa2 applies the operator-approved A-2 proposal after checking its base hash.
Muse adoption was reported by the operator. PR #11 contains A-2 source documents and status;
it awaits Muse review and must not be merged automatically. Secret and full-history audit PASS.
Unresolved economic/DID interpretation gates remain, official_sources_current=false,
autonomous_posting=false. Historical artifact readiness is not Testnet readiness.

## A-6 — initial runbook, rehearsal not completed

2026-11-20: docs/testnet-day-one-runbook.md documents conditional launch detection,
DID/network checks, faucet approval, auth/scope and cost checks, one-request approval,
exact-ID receipts, finality and stop/reconciliation rules. The 30-minute target starts only
after prerequisites and approvals, not the calendar target date. No actual send.
Draft deliverable complete; full A-6 acceptance blocked because a real Devnet rehearsal
requires separate approval and usable access. Continue to A-7 preparation, not A-3b.

## A-7 — read-only diff preparation, scheduling disabled

2026-11-20: added fixed-source bounded public GET collector and offline hash/line-span
comparison. Paper resolves main then captures an immutable commit; docs URLs are fixed.
Four requests maximum per invocation, no redirects, no credentials or retries; source
failures stay UNKNOWN. Existing baselines never advance automatically; local review
candidates do not ratify economics or create external issues. No scheduler installed.
Initial manual capture: 4 GETs, 3 BASELINE_MISSING records (paper/timeline/conversion).
Offline replay: identical text, not proof of historical no-change. Controlled fixtures
exercise changed text/revisions, integrity failures, inaccessible/oversized sources and
request bounds. Remaining docs not polled; competitor aggregation outside this ticket.
Full A-7 ongoing operation and meaningful-change adjudication remain future work.

Validation: final Windows suite 100/100 PASS; secret scan and full-history audit PASS. Offline CLI replay reports zero current requests; historical capture request counts are not current-run usage. No baseline promotion or sending enabled.
