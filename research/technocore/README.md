# Technocore Network Health Observatory

Independent research based on public Technocore exports. Reports are dated, bounded observations; they are not official status reports or claims about all records.

## Latest report — 2026-11-05 13:49 UTC

[Open the report bundle](evidence/technocore-2026-11-05T13-49-36-184Z/README.md). In a fixed deterministic sample of 15 signed-record-eligible entries, all 15 signatures verified under the documented rule. This covers about 0.0714% of 21,002 eligible entries and does not establish the validity or completeness of the full export.

Compared with the preceding published snapshot at 01:50 UTC, the export contained 5,488 fewer records while the observed sequence window advanced. This is a descriptive difference only; the cause is unknown and retention has not been established.

Snapshot: `260313db65513a32b4ab031371808deb13505481806aeabfb3c47c9f67b1de7e`

Technocore source commit: `cd41f86c7d0a4724be57e85f3f5698de8c8c5d83`

Evidence root: `78fe6ffc3cc017cd87721f260c6ce32155e72d42af5db3e4fc41affbaa070ce8`

System-wide official freshness remains **PARTIAL**. The 2026-11-05 13:49 UTC cycle recorded a changed Flop Labs homepage content hash, but its semantic significance was not established and the source watermark did not advance. `OFFICIAL_SPEC_CURRENT` is therefore not established. This does not alter the provenance of the dated Technocore capture.

## Reproduce offline

From the repository root, run:

```sh
node research/technocore/verifier/verify-report.js research/technocore/evidence/technocore-2026-11-05T13-49-36-184Z
```

The standalone verifier uses Node.js built-ins and the retained bundle. The preceding 2026-11-05 01:50 UTC bundle is included because the manifest links to its manifest hash. The report was published after repository and clean-room offline verification.

## Earlier reports

- [2026-11-05 01:50 UTC report](evidence/technocore-2026-11-05T01-50-29-138Z/README.md) — 15 verified.
- [2026-11-04 14:30 UTC report](evidence/technocore-2026-11-04T14-30-01-826Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-09 report](evidence/technocore-2026-10-09T12-02-02-280Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-08 report](evidence/technocore-2026-10-08T14-04-43-633Z/README.md) — 15 verified; retained as an ancestor of later reports.

## Limits

The latest report verifies only its deterministic sample. It does not prove full-export completeness, retention, sequence continuity, MCP parity, TCLK settlement, Contribution Proof canonicalization, or FLOP allocation effects. The report chain is not externally anchored. Do not interpret this snapshot as a live network health statement.
