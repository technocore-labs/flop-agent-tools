// Bound bytes during receipt, not after an unbounded response.text allocation.
export async function readBoundedBody(response,maxBytes=1048576){
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1)throw Error('INVALID_BODY_LIMIT');
 const length=response.headers?.get?.('content-length');
 if(length&&/^\d+$/.test(length)&&BigInt(length)>BigInt(maxBytes)){
  try{await response.body?.cancel?.();}catch{}
  throw Error('RESPONSE_SIZE_LIMIT');
 }
 if(response.body&&typeof response.body[Symbol.asyncIterator]==='function'){
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.byteLength;if(size>maxBytes)throw Error('RESPONSE_SIZE_LIMIT');chunks.push(Buffer.from(chunk));}
  return Buffer.concat(chunks,size).toString('utf8');
 }
 // Supports retained/mock response adapters; native live Fetch uses the stream.
 const text=typeof response.text==='function'?await response.text():JSON.stringify(await response.json());if(Buffer.byteLength(text)>maxBytes)throw Error('RESPONSE_SIZE_LIMIT');return text;
}
