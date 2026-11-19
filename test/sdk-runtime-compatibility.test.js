import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewSdkRuntimeCompatibility} from '../src/testnet/readiness/sdk_registry.js';

test('retained SDK/live version gap is blocked instead of admitting a newer runtime',()=>{
 const result=reviewSdkRuntimeCompatibility({specVersion:1014027,transactionVersion:2,supportedSpecVersions:[1014014,1014020],supportedTransactionVersions:[2]});
 assert.equal(result.status,'BLOCKED');assert.equal(result.reason,'RUNTIME_NOT_QUALIFIED');assert.equal(result.executable,false);
 assert.equal(reviewSdkRuntimeCompatibility({specVersion:1014027,supportedSpecVersions:[1014020]}).status,'BLOCKED');
});
test('holes in a version envelope and changed transaction encoding do not gain authority',()=>{
 const x={specVersion:1014006,transactionVersion:2,supportedSpecVersions:[1014005,1014007],supportedTransactionVersions:[2]};
 assert.equal(reviewSdkRuntimeCompatibility(x).status,'BLOCKED');
 assert.equal(reviewSdkRuntimeCompatibility({...x,specVersion:1014007,transactionVersion:3}).reason,'TRANSACTION_VERSION_NOT_QUALIFIED');
 for(const patch of [{specVersion:'1014007'},{supportedSpecVersions:[]},{supportedTransactionVersions:undefined},{supportedSpecVersions:[1014007,NaN]}])assert.equal(reviewSdkRuntimeCompatibility({...x,specVersion:1014007,...patch}).status,'UNKNOWN');
});
test('static match never enables installation, signing or network execution',()=>{
 const r=reviewSdkRuntimeCompatibility({specVersion:1014020,transactionVersion:2,supportedSpecVersions:[1014020],supportedTransactionVersions:[2]});
 assert.equal(r.status,'STATIC_VERSION_MATCH_NOT_LIVE_QUALIFICATION');assert.equal(r.signing_authorized,false);assert.equal(r.executable,false);assert.equal(r.installation_performed,false);
});
