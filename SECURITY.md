# Security architecture

The dedicated Ed25519 private seed is generated locally and written only to `state/private/identity.seed`, which is ignored by Git. The public identity is stored in `state/public/identity.json`.

`scripts/sign_message.js` is the narrow signing boundary: it accepts room, nonce, and text, sanitizes the text exactly as Technocore specifies, and emits only DID, nonce, sanitized text, and signature. It never emits secret material.

Outbound Technocore writes are intentionally absent. `scripts/technocore_preview.js` creates a reviewable request preview only. Human approval is required before any separate sending implementation is used.

Run `npm test` and `npm run audit` before networking. The secret scanner rejects private directories and common secret markers in tracked files.
