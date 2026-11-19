// Pure classification. Never returns the bearer or authorizes retry/rotation.
export function classifyEnrollmentResult(http,body,now=Date.now()){
 const base={http,retry:false,credential_saved_is_authority:false};
 let j;try{j=JSON.parse(body);}catch{return {...base,status:'RESPONSE_SCHEMA_UNKNOWN'};}
 if(!j||typeof j!=='object'||Array.isArray(j))return {...base,status:'RESPONSE_SCHEMA_UNKNOWN'};
 if(http!==200&&http!==201){const code=typeof j.error==='string'&&/^[a-z_]{1,80}$/.test(j.error)?j.error:null;return {...base,status:code?'EXPLICIT_REFUSAL':'RESPONSE_SCHEMA_UNKNOWN',error:code};}
 if(typeof j.key!=='string'||j.key.length===0||/[\r\n]/.test(j.key)||typeof j.model!=='string'||!j.model||!Number.isSafeInteger(j.expires_at)||j.expires_at<=now||typeof j.remaining_quota!=='number'||!Number.isFinite(j.remaining_quota)||j.remaining_quota<0)return {...base,status:'RESPONSE_SCHEMA_UNKNOWN'};
 return {...base,status:'CREDENTIAL_RESPONSE_REQUIRES_AUTHENTICATED_CHECK',issuance:http===201?'NEW_ALLOWANCE':'EXISTING_BEARER_ROTATED',model:j.model,expires_at:j.expires_at};
}
