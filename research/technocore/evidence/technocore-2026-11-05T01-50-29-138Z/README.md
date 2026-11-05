# Technocore Network Health Observatory — Baseline Report

Independent Research, not an official Technocore status page.

## Summary
15 of 15 deterministically sampled public records verified out of 26493 eligible records (0.0566% sampled coverage). Classification counts: {"CURRENT_VERIFIED":15,"LEGACY_VERIFIED":0,"AMBIGUOUS":0,"UNSUPPORTED":0,"INVALID":0}. This does not prove all records are valid.

## Observation Scope
Public room export, captured 2026-11-05T01:50:28.965Z. Snapshot de7330a45f8cb6b4985ce1b79ed944590ca30b88582410d22e16341276c43da4; source commit: 20629ab2913f30601c4cd59b20d04031105bdc7b.

## Availability and Dataset
HTTP 200; generation 0; 26516 records; sequence 21645046–21671561.

## Cryptographic Verification
Ed25519, canonical UTF-8 bytes room|nonce|text. Each selected record's raw JSONL bytes, hash, signature material, canonicalization result, and verifier classification are retained in samples.json.

## Schema Integrity and Temporal Changes
Parse errors: 0. Previous record-count delta: -4131.

## Spec Conformance and Findings
Only the documented signed-record rule was tested. No new finding is claimed.

## Limitations
- Sample verification does not prove all records valid.
- Full export is not redistributed; total record count and completeness of the eligible set cannot be independently recomputed offline.
- The retained eligible-record hash list permits deterministic selection checking but is not a proof that the source omitted no eligible records.
- Report chain is not externally anchored; it does not by itself prevent rewriting the entire series.
- Retention not established.
- MCP parity not established.
- Contribution Proof canonicalization is separate.
- TCLK settlement not tested.
- FLOP allocation impact unknown.

## Reproduce This Report
With Node.js 20+ and this repository: node research/technocore/verifier/verify-report.js research/technocore/evidence/technocore-2026-11-05T01-50-29-138Z. The verifier uses only this bundle and Node built-ins, without network access or private keys. Sampled public record text is included only after the bounded automated privacy scan passes; public release still requires the publication gate.

## Evidence Manifest and Methodology Version
See manifest.json. Research method 2, verifier 2, sampling 1.
