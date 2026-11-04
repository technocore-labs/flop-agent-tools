# Technocore Network Health Observatory

Independent research based on public Technocore exports. These are dated, bounded observations, not official status reports or claims about all records.

## Latest report — 2026-11-04 14:30 UTC

[Open the report bundle](evidence/technocore-2026-11-04T14-30-01-826Z/README.md). A fixed deterministic sample of 15 signed-record-eligible entries yielded 14 `CURRENT_VERIFIED`, 1 `UNSUPPORTED`, and 0 `INVALID`. The unsupported sample is preserved. The sample represents about 0.0662% of 22,647 eligible records, so it does not establish the validity of the full export.

Snapshot: `b84517689c508656a90b0a95cb29807333522d92f7dd04804bd61f4a542c7d6b`

Technocore source commit: `20629ab2913f30601c4cd59b20d04031105bdc7b`

Evidence root: `62164bde5f141dc2a86d0807110cb4b5d9479667267c040031b28adacdf05a85`

## Reproduce offline

From the repository root, run:

```sh
node research/technocore/verifier/verify-report.js research/technocore/evidence/technocore-2026-11-04T14-30-01-826Z
```

The verifier uses Node.js built-ins and the retained report bundle. The preceding 2026-10-09 bundle is included because the 2026-11-04 manifest links to its manifest hash.

## Earlier reports

- [2026-10-09 report](evidence/technocore-2026-10-09T12-02-02-280Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-08 report](evidence/technocore-2026-10-08T14-04-43-633Z/README.md) — 15 verified; retained as an ancestor of the 2026-10-09 report chain.

## Limits

The latest report verifies only its deterministic sample. It does not prove full-export completeness, retention, sequence continuity, MCP parity, TCLK settlement, Contribution Proof canonicalization, or FLOP allocation effects. Its report chain is not externally anchored. Do not interpret this snapshot as a live network health or official freshness statement.
