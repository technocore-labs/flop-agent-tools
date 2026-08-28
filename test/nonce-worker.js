import { reserveNonce } from '../src/technocore/nonce_ledger.js';
const [, , root, did, room] = process.argv;
console.log(reserveNonce(root, did, room, 1));
