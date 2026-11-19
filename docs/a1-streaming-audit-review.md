# A-1: streaming prepublication audit checkpoint

Base synchronization candidate: 8f2f3b9. Code checkpoint: 808016b.

## Problem and change

The original audit materialized complete Git history patches and filenames with
`execFileSync`, exceeding its default output buffer on this repository. It now
uses `spawn` and drains stdout incrementally, with UTF-8 decoding across chunks.
Tracked names, all-ref history names, full patches and README are still checked.
All Git exits are checked. A detected match fails the audit, but does not truncate
the remaining history stream. External diff/textconv execution is disabled.

The original sensitive-content rules are preserved using bounded matcher state.
Finite overlap alone would miss arbitrarily long whitespace before assignments
or long uppercase private-key labels; dedicated state retains those matches.
Private path checks use NUL/newline record boundaries rather than chunk starts.
Error output contains the failure category, never the detected sensitive bytes.

No history rewrite, private seed access, dependency installation, signer change,
autonomous posting or network transaction was performed.

## Verified on Windows

- Full candidate `npm test`: **93 passed, zero failed**.
- `npm run audit`: **PASS**.
- Current all-ref history `npm run prepublish-audit`: **PASS**.
- An isolated temporary repository with history exceeding 1 MiB passes.
- Three temporary historical negatives fail after removal from the current tree:
  a private-state path, a synthetic seed-like assignment, and an absolute user path.
  Synthetic contents never enter the real repository history.
- Chunk boundaries, long whitespace/labels, UTF-8 split boundaries, README scanning
  and failed Git processes are covered. The six audit tests are included in the
  93-test total. The fixture repositories are removed after their tests.

## Linux: not passed; environment blocked

The available WSL distribution is Alpine (musl). It had Git but no Node. An
official Node Linux archive was verified against its published checksum and used
as a temporary test runtime without system installation; its glibc executable
could not run on Alpine. A subsequent attempt to prepare a temporary Alpine
runtime failed before command execution with WSL
`Wsl/Service/CreateInstance/ERROR_TIMEOUT`. No WSL shutdown/service restart or
package installation was performed. Linux tests and audit are **NOT VERIFIED**.

## Acceptance and publication

A-1 is **PARTIAL / LINUX_ENVIRONMENT_BLOCKED**, not complete. A-0 remote
synchronization remains pending. The operator authorized push and PR creation
after A-1 completion, so no remote push or PR has been performed while the Linux
acceptance condition remains unmet. The next action is to restore or supply a
working Linux test environment, rerun the same full suite and audit there, then
complete the permitted push/PR. No merge, deployment, report publication or
autonomous sending is implied by that authorization.
