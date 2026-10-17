// Opt-in paid AI verification with public research example images, never a user's profile photo.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://miroir-backend-l7si.onrender.com/api';
const output = path.resolve(__dirname,'../test-results');
async function json(endpoint, options={}) {
  const response = await fetch(base+endpoint,{...options,signal:AbortSignal.timeout(90000)});
  const body = await response.json();
  assert.ok(response.ok, `${endpoint}: HTTP ${response.status}: ${body.message || body.error || 'request failed'}`);
  return body;
}
async function main() {
  assert.equal(process.env.MIROIR_ALLOW_AI,'yes','Explicit MIROIR_ALLOW_AI=yes required');
  assert.ok(process.env.MIROIR_CUSTOMER_EMAIL && process.env.MIROIR_CUSTOMER_PASSWORD);
  const auth = await json('/user-auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.MIROIR_CUSTOMER_EMAIL,password:process.env.MIROIR_CUSTOMER_PASSWORD})});
  const headers = {Authorization:`Bearer ${auth.token}`};
  const stylist = await json('/stylist/recommend',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({prompt:'A casual daytime outfit with coordinated colors',desiredOutfitCount:1,userId:auth.user.id,gender:auth.user.profile?.gender,profile:{stylePreferences:['casual']},budget:{max:1000000}})});
  assert.ok(stylist.success && Array.isArray(stylist.outfits));
  assert.ok(stylist.analysis && Array.isArray(stylist.fitWarnings) && Array.isArray(stylist.fashionTips));
  console.log(`Stylist real response: ${stylist.outfits.length} outfits; noMatch=${Boolean(stylist.noMatch)}`);
  fs.mkdirSync(output,{recursive:true});
  const checkpoint = path.join(output,'live-ai-task.json');
  let task;
  if (fs.existsSync(checkpoint)) task=JSON.parse(fs.readFileSync(checkpoint,'utf8'));
  else {
    const form=new FormData(); form.append('tryOnType','upper_lower');form.append('batchSize','1');
    for (const [field,example] of [['modelImage','human/00034_00.jpg'],['upperImage','cloth/04469_00.jpg']]) {
      const response=await fetch(`https://raw.githubusercontent.com/yisol/IDM-VTON/main/gradio_demo/example/${example}`,{signal:AbortSignal.timeout(30000)});
      assert.ok(response.ok,'Research example image unavailable');
      form.append(field,await response.blob(),example.split('/').pop());
    }
    task=await json('/tryon/custom',{method:'POST',headers,body:form});
    assert.ok(task.success && task.taskId);
    fs.writeFileSync(checkpoint,JSON.stringify({taskId:task.taskId,createdAt:new Date().toISOString(),inputSource:'IDM-VTON public research examples; QA only, not app assets'}));
    console.log('Created one custom try-on task using public research examples.');
  }
  for (let attempt=0;attempt<60;attempt++) {
    const status=await json(`/tryon/${encodeURIComponent(task.taskId)}`);
    console.log(`Try-on: ${status.status}`);
    if (status.status==='completed') {
      assert.ok(status.resultUrl,'Completed task missing result URL');
      const image=await fetch(status.resultUrl,{signal:AbortSignal.timeout(30000)});
      assert.ok(image.ok && image.headers.get('content-type')?.startsWith('image/'),'Result image unavailable');
      fs.writeFileSync(path.join(output,'live-ai-result.json'),JSON.stringify({status:'completed',taskId:task.taskId,resultUrl:status.resultUrl,checkedAt:new Date().toISOString()}));
      console.log('PASS real custom try-on completed and result image is available.');return;
    }
    assert.notEqual(status.status,'failed',`Try-on failed: ${status.errorMessage || 'provider failure'}`);
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  throw new Error('Try-on still pending after five minutes; rerun to resume existing task, not create another.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
