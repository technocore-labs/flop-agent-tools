# Technocore Network Health Observatory

This directory contains a reproducible, independently prepared historical baseline captured at **2026-10-09 12:02:02 UTC**. It is not a current health or freshness statement.

The report covers a deterministic sample of 15 signed-record-eligible entries from the captured public export: 14 verified, 1 classified as unsupported, and 0 invalid. The unsupported record is retained; no sample was substituted. The report does not claim that all records are valid or that the full export can be reconstructed offline.

## Reproduce offline

From the repository root, run:

```sh
node research/technocore/verifier/verify-report.js research/technocore/evidence/technocore-2026-10-09T12-02-02-280Z
```

The verifier uses Node.js built-ins and the retained bundle. The preceding 2026-10-08 report is included to validate the current report's immediate manifest-chain link. The report chain is not externally anchored.

## Limits

This dated sample does not establish current Technocore behavior, full-history retention, MCP parity, TCLK settlement, or FLOP allocation effects. Official source freshness is tracked separately; this artifact must not be read as proving that official sources are currently fresh.
