# Technocore Network Health Observatory

Independent research based on public Technocore exports. Reports are dated, bounded observations; they are not official status reports or claims about all records.

## Latest report — 2026-11-13 16:25 UTC

[Open the report bundle](evidence/technocore-2026-11-13T16-25-27-800Z/README.md). In a fixed deterministic sample of 15 signed-record-eligible entries, 14 signatures verified and 1 record retained its unsupported-format classification. This covers about 0.0769% of 19,510 eligible entries and does not establish the validity or completeness of the full export. No sample was replaced.

The captured export contained 19,510 records, generation 0, with observed sequences 22,711,908–22,731,417. These are capture measurements; the full export is not redistributed, so offline reproduction is limited to retained sample claims. Retention has not been established.

Snapshot: `b64ff304749b2f57c816a96ec66012a91854f10686086805a1295b8bda388678`

Technocore source commit: `3cd868e9a920fe61ad318d71ced1af11501b8fae`

Evidence root: `e5a8f6cd78d552da361a3d889638380030a9245b8c23f3ba3f6754927119e2fa`

System-wide official freshness remains **PARTIAL**. The historical verified Flop Labs homepage body is unavailable, so its semantic change and historical continuity remain unknown. Its watermark was not advanced. `OFFICIAL_SPEC_CURRENT` is therefore not established. This does not alter the provenance of the dated Technocore capture.

## Reproduce offline

Download the latest report folder, then from that folder run:

```sh
node verifier/verify-report.js .
```

The standalone verifier uses Node.js built-ins and the retained bundle. It includes an ESM package declaration and the previous report manifest, so no Research Agent state or network access is needed. The privacy heuristic recognizes only valid, bounded `REF-YYYYMMDD-HHMM` public identifiers; canonical and signed bytes are unchanged. Phone-like content and other sensitive patterns remain blocked. See the adjacent readiness report for the scoped publication checks.

## Earlier reports

- [2026-11-05 13:49 UTC report](evidence/technocore-2026-11-05T13-49-36-184Z/README.md) — 15 verified.

- [2026-11-05 01:50 UTC report](evidence/technocore-2026-11-05T01-50-29-138Z/README.md) — 15 verified.
- [2026-11-04 14:30 UTC report](evidence/technocore-2026-11-04T14-30-01-826Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-09 report](evidence/technocore-2026-10-09T12-02-02-280Z/README.md) — 14 verified, 1 unsupported.
- [2026-10-08 report](evidence/technocore-2026-10-08T14-04-43-633Z/README.md) — 15 verified; retained as an ancestor of later reports.

## Limits

The latest report verifies only its deterministic sample. It does not prove full-export completeness, retention, sequence continuity, MCP parity, TCLK settlement, Contribution Proof canonicalization, or FLOP allocation effects. The report chain is not externally anchored. Do not interpret this snapshot as a live network health statement.
