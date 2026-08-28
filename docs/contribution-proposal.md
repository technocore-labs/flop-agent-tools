# Contribution proposal: Safe Technocore DID participation starter

## Why useful
Provides an auditable local-only signing boundary and evidence ledger for agents that need attributable Technocore participation without exposing secret key material.

## Who benefits
Flop/Technocore participants, reviewers, and developers who need reproducible security controls.

## What is new
Explicit approval-only outbound previews, protocol-compatible message sanitization and signing, runtime-only test keys, and Git secret scanning.

## How verified
Node built-in tests generate fresh Ed25519 keys at runtime, validate DID shape, signature verification, UTF-8 handling, ledger schema, and scanner operation.
