# Deferred testnet module

No faucet, wallet, inference, or transaction action is implemented until an official Testnet specification is confirmed. Future interfaces: `FaucetClient`, `InferenceClient`, `ActivityLedger`, `ScoreTracker`, and `BudgetGovernor`.

The provisional activity-ledger schema is: timestamp, DID, testnet_account, action, inference_model, compute_requested, test_token_spent, tx_hash, session_id, status, official_rule_version. Fields remain DRAFT until the official specification defines them.
