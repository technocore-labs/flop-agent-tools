# FLOP Autonomous Participation Agent

Safety-first preparation tooling for a dedicated Technocore `did:key` identity. This is not an airdrop bot and does not guarantee eligibility or allocation.

## Local workflow

```powershell
node scripts/generate_identity.js
npm test
npm run audit
node scripts/verify_local.js
npm run status
```

The private seed is never printed. Do not add `state/private/` to Git.

`node scripts/technocore_preview.js lobby "your message"` produces a signed preview only; it does not send a request.
