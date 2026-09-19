import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";
const port=3107,base=`http://127.0.0.1:${port}`;
for(const name of ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY","MAJUPILOT_GUEST_TOKEN_PEPPER"])if(!process.env[name])throw new Error(`Missing ${name}`);
async function start(){const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","-p",String(port)],{cwd:process.cwd(),env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"]});let logs="";child.stdout.on("data",d=>logs+=d);child.stderr.on("data",d=>logs+=d);for(let i=0;i<60;i++){if(child.exitCode!==null)throw new Error(`Next exited: ${logs}`);try{const r=await fetch(base);if(r.status<500)return child;}catch{}await delay(500);}child.kill();throw new Error(`Next did not start: ${logs}`);}
async function stop(child){child.kill("SIGTERM");await Promise.race([new Promise(resolve=>child.once("exit",resolve)),delay(5000)]);if(child.exitCode===null)child.kill("SIGKILL");}
const json=(url,method,body,cookie)=>fetch(base+url,{method,headers:{"content-type":"application/json",...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
let server=await start();
try{
  const created=await json("/api/v2/guest/session","POST",{});if(created.status!==201)throw new Error(`create ${created.status}: ${await created.text()}`);let cookie=created.headers.get("set-cookie")?.split(";")[0];if(!cookie)throw new Error("guest cookie missing");const receipt=(await created.json()).data;
  const answerId=crypto.randomUUID();const saved=await json("/api/v2/assessment/answers","POST",{answer:{id:answerId,assessmentSessionId:receipt.assessmentSessionId,answerKey:"q1",revision:1,value:{industry:"retail_ecommerce"},evidenceState:"confirmed",schemaVersion:"1.0.0"}},cookie);if(saved.status!==201)throw new Error(`save ${saved.status}: ${await saved.text()}`);
  await stop(server);server=await start();
  const resumed=await fetch(base+"/api/v2/guest/session",{method:"PUT",headers:{cookie}});if(resumed.status!==200)throw new Error(`resume after restart ${resumed.status}: ${await resumed.text()}`);cookie=resumed.headers.get("set-cookie")?.split(";")[0];const resumedData=(await resumed.json()).data;if(resumedData.assessmentSessionId!==receipt.assessmentSessionId)throw new Error("assessment identity changed after restart");
  const artifactId=crypto.randomUUID();const artifact=await json("/api/v2/artifacts","POST",{artifact:{kind:"business_twins",id:artifactId,assessmentSessionId:receipt.assessmentSessionId,payload:{businessName:"Smoke Fixture"},revision:1,schemaVersion:"1.0.0",rulePackVersion:"1.0.0",sourceArtifactIds:[answerId],links:{}}},cookie);if(artifact.status!==201)throw new Error(`artifact ${artifact.status}: ${await artifact.text()}`);
  const revoked=await json("/api/v2/guest/revoke","POST",{},cookie);if(revoked.status!==204)throw new Error(`revoke ${revoked.status}`);
  const denied=await fetch(base+"/api/v2/guest/session",{method:"PUT",headers:{cookie}});if(denied.status!==401)throw new Error(`revoked resume should be 401, got ${denied.status}`);
  console.log(JSON.stringify({ok:true,assessmentSessionId:receipt.assessmentSessionId,answerId,artifactId,restartResume:true,revokedDenied:true}));
}finally{await stop(server);}
