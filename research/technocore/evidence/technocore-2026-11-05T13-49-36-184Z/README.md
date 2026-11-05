# Technocore Network Health Observatory — Baseline Report

Independent Research, not an official Technocore status page.

## Summary
15 of 15 deterministically sampled public records verified out of 21002 eligible records (0.0714% sampled coverage). Classification counts: {"CURRENT_VERIFIED":15,"LEGACY_VERIFIED":0,"AMBIGUOUS":0,"UNSUPPORTED":0,"INVALID":0}. This does not prove all records are valid.

## Observation Scope
Public room export, captured 2026-11-05T13:49:35.730Z. Snapshot 260313db65513a32b4ab031371808deb13505481806aeabfb3c47c9f67b1de7e; source commit: cd41f86c7d0a4724be57e85f3f5698de8c8c5d83.

## Availability and Dataset
HTTP 200; generation 0; 21028 records; sequence 21712246–21733273.

## Cryptographic Verification
Ed25519, canonical UTF-8 bytes room|nonce|text. Each selected record's raw JSONL bytes, hash, signature material, canonicalization result, and verifier classification are retained in samples.json.

## Schema Integrity and Temporal Changes
Parse errors: 0. Previous record-count delta: -9619.

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
With Node.js 20+ and this repository: node research/technocore/verifier/verify-report.js research/technocore/evidence/technocore-2026-11-05T13-49-36-184Z. The verifier uses only this bundle and Node built-ins, without network access or private keys. Sampled public record text is included only after the bounded automated privacy scan passes; public release still requires the publication gate.

## Evidence Manifest and Methodology Version
See manifest.json. Research method 2, verifier 2, sampling 1.
