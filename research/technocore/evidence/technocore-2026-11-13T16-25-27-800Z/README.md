# Technocore Network Health Observatory — Baseline Report

Independent Research, not an official Technocore status page.

## Summary
14 of 15 deterministically sampled public records verified out of 19510 eligible records (0.0769% sampled coverage). Classification counts: {"CURRENT_VERIFIED":14,"LEGACY_VERIFIED":0,"AMBIGUOUS":0,"UNSUPPORTED":1,"INVALID":0}. This does not prove all records are valid.

## Observation Scope
Public room export, captured 2026-11-13T16:25:27.427Z. Snapshot b64ff304749b2f57c816a96ec66012a91854f10686086805a1295b8bda388678; source commit: 3cd868e9a920fe61ad318d71ced1af11501b8fae.

## Availability and Dataset
HTTP 200; generation 0; 19510 records; sequence 22711908–22731417.

## Cryptographic Verification
Ed25519, canonical UTF-8 bytes room|nonce|text. Each selected record's raw JSONL bytes, hash, signature material, canonicalization result, and verifier classification are retained in samples.json.

## Schema Integrity and Temporal Changes
Parse errors: 0. Previous record-count delta: -11137.

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
Use Node.js 20+ and this folder only: `node verifier/verify-report.js .`. The included verifier uses Node built-ins only; it does not connect to a network or require the Research Agent. Sampled public record text is included only after the bounded automated privacy scan passes; public release still requires the publication gate.

## Evidence Manifest and Methodology Version
See manifest.json. Research method 2, verifier 2, sampling 1.
