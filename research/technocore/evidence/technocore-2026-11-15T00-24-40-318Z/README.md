# Technocore retained-sample reanalysis — verifier v3

This is independent research, not an official network status report.

15 of the same 15 fixed samples verify under v3. Original results: {"CURRENT_VERIFIED":14,"LEGACY_VERIFIED":0,"AMBIGUOUS":0,"UNSUPPORTED":1,"INVALID":0}. New results: {"CURRENT_VERIFIED":15,"LEGACY_VERIFIED":0,"AMBIGUOUS":0,"UNSUPPORTED":0,"INVALID":0}. No sample was replaced.

Original observation: 2026-11-13T16:25:27.427Z. Snapshot: b64ff304749b2f57c816a96ec66012a91854f10686086805a1295b8bda388678. This reanalysis made no network request and does not describe current network health.

Verifier v2 rejected large integer nonces after JavaScript Number rounding. V3 retains the original decimal JSON token and uses an independent parser to reconstruct signed bytes. Duplicate root keys and non-integer nonce representations fail closed.

From this folder run: `node verifier/verify-report.js .`. Only this folder and Node.js 20+ are required.

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
- This is a reanalysis of the original dated snapshot, not a new network observation.
- Exact unsigned JSON integer nonces up to 40 decimal digits are supported by this verifier; this is a local resource bound, not an asserted protocol nonce limit.

Original report: technocore-2026-11-13T16-25-27-800Z. Its manifest is retained in this bundle and the original report is not overwritten.
