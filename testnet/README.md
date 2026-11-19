# Participation preparation: implementation and live evidence are separate

The repository now includes bounded Devnet completion preparation/execution,
read-only reconciliation, and participation evidence helpers. These have local
synthetic tests. A successful live SOV inference and finalized settlement have
not been demonstrated. See [the implementation inventory](../docs/a0-local-implementation-inventory.md).

Testnet activation and eligibility remain unconfirmed. Devnet rehearsal earns
no Testnet airdrop credit. A faucet receipt, local DID co-control proof, mock
response, broker receipt or passing test is not allocation evidence.

Nothing starts a loop, requests faucet funds, creates a wallet or signs a chain
transaction automatically. The one-inference entry point requires privately
supplied credentials and an explicitly approved Devnet plan; do not run it while
the existing enrollment outcome remains unresolved. Existing unknown attempt
markers must be preserved. A live execution still requires reviewed network,
scope, quota, expiry, route and operation identity.

The provisional activity-ledger schema is: timestamp, DID, testnet_account, action, inference_model, compute_requested, test_token_spent, tx_hash, session_id, status, official_rule_version. Fields remain DRAFT until the official specification defines them.
