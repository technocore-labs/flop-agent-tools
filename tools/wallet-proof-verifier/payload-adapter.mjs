// Browser-compatible, injected signer only. Never submits or broadcasts.
export function createPayloadAdapter({injected,address,genesisHash,specVersion,transactionVersion,reserveAttempt}) {
 if(typeof injected?.enable!=='function'||typeof address!=='string'||!address||!/^0x[0-9a-f]{64}$/.test(genesisHash??'')||!Number.isSafeInteger(specVersion)||specVersion<0||!Number.isSafeInteger(transactionVersion)||transactionVersion<0)throw Error('SIGNER_CONTEXT_REQUIRED');
 let extension=null,generation=0,pending=false,prepared=null,consumed=false;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const check=p=>{
  if(!p||p.address!==address||p.genesisHash!==genesisHash||p.specVersion!==specVersion||p.transactionVersion!==transactionVersion)throw Error('PAYLOAD_CONTEXT_MISMATCH');
  if(!/^0x[0-9a-f]{64}$/i.test(p.blockHash??'')||!/^0x(?:[0-9a-f]{2})+$/i.test(p.method??'')||!/^0x[0-9a-f]+$/i.test(p.nonce??'')||!Array.isArray(p.signedExtensions))throw Error('PAYLOAD_SCHEMA');
 };
 return {
  async connect(){if(pending)throw Error('SIGNATURE_PENDING');const epoch=++generation;extension=null;prepared=null;
   const ext=await injected.enable('SOV FLOP reviewed transaction');const accounts=await ext.accounts.get();
   if(epoch!==generation)throw Error('CONNECTION_CHANGED');
   if(!accounts.some(a=>a.address===address)||typeof ext.signer?.signPayload!=='function')throw Error('PAYLOAD_SIGNER_UNAVAILABLE');extension=ext;
   return {connected:true,address,network_write:false};},
  disconnect(){generation++;extension=null;prepared=null;},
  async prepare(payload){if(pending||consumed)throw Error('ATTEMPT_BLOCKED');if(!extension)throw Error('NOT_CONNECTED');
   check(payload);const snapshot=clone(payload);const epoch=generation;
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(snapshot)));
   if(epoch!==generation)throw Error('CONNECTION_CHANGED');const digest=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
   prepared={snapshot,digest};return {payload:clone(snapshot),digest,network_write:false};},
  async sign({digest,approved}){if(pending||consumed)throw Error('ATTEMPT_BLOCKED');if(approved!==true||!extension||!prepared||digest!==prepared.digest)throw Error('REVIEW_REQUIRED');
   if(typeof reserveAttempt!=='function')throw Error('DURABLE_ATTEMPT_RESERVATION_REQUIRED');
   pending=true;consumed=true;const epoch=generation;const ext=extension;const p=prepared;prepared=null;
   try{await reserveAttempt({payload_hash:p.digest});if(epoch!==generation)throw Error('CONNECTION_CHANGED');
    const signed=await ext.signer.signPayload(clone(p.snapshot));
    if(epoch!==generation)throw Error('CONNECTION_CHANGED');
    if(typeof signed?.signature!=='string'||!/^0x[0-9a-f]{128}(?:[0-9a-f]{2})?$/i.test(signed.signature))throw Error('SIGNATURE_SCHEMA');
    return {signature:signed.signature,payload_hash:p.digest,status:'SIGNATURE_RETURNED_REQUIRES_VERIFICATION',broadcast:false};
   }finally{pending=false;}
  }
 };
}
