# Technocore Network Health Observatory

Independent research based on public Technocore exports. Reports are dated, bounded observations; they are not official status reports or claims about all records.

## Latest report — 2026-11-05 01:50 UTC

[Open the report bundle](evidence/technocore-2026-11-05T01-50-29-138Z/README.md). In a fixed deterministic sample of 15 signed-record-eligible entries, all 15 signatures verified under the documented rule. This covers about 0.0566% of 26,493 eligible entries and does not establish the validity or completeness of the full export.

Snapshot: `de7330a45f8cb6b4985ce1b79ed944590ca30b88582410d22e16341276c43da4`

Technocore source commit: `20629ab2913f30601c4cd59b20d04031105bdc7b`

Evidence root: `f732545f61ce3064294f2d06355e8b16a4555bbd4278249d6a80cc36fdda0f5b`

System-wide official freshness remains **PARTIAL**: Flop Labs source continuity is still stale, so `OFFICIAL_SPEC_CURRENT` is not established. That does not change the scope of this dated Technocore capture.

## Reproduce offline

From the repository root, run:

```sh
node research/technocore/verifier/verify-report.js research/technocore/evidence/technocore-2026-11-05T01-50-29-138Z
```

The standalone verifier uses Node.js built-ins and the retained report bundle. The preceding 2026-11-04 bundle is included because the manifest links to its manifest hash.

## Earlier reports

- [2026-11-04 report](evidence/technocore-2026-11-04T14-30-01-826Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-09 report](evidence/technocore-2026-10-09T12-02-02-280Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-08 report](evidence/technocore-2026-10-08T14-04-43-633Z/README.md) — 15 verified; retained as an ancestor of the later report chain.

## Limits

The latest report verifies only its deterministic sample. It does not prove full-export completeness, retention, sequence continuity, MCP parity, TCLK settlement, Contribution Proof canonicalization, or FLOP allocation effects. The report chain is not externally anchored. Do not interpret this snapshot as a live network health statement.
