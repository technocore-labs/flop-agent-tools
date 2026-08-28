# Technocore Safe Signer Toolkit

An OSS toolkit for a dedicated Technocore `did:key` identity: safe Ed25519 signing, monotonic nonce reservation, local evidence receipts, and private-key isolation. It is not an airdrop bot and does not automate wallet, faucet, token, or transaction activity.

## Local workflow

```powershell
node scripts/generate_identity.js
npm test
npm run audit
node scripts/verify_local.js
npm run status
npm run prepublish-audit
```

The private seed is never printed. Do not add `state/private/` to Git. On Windows, run `npm run harden-private-acl` after creating the identity.

`node scripts/technocore_preview.js lobby "your message"` produces a signed preview only; it does not send a request.
