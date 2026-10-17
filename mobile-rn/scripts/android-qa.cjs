// Interactive QA for the dedicated emulator only. Does not write app source or record credentials.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const readline=require('node:readline');
const adb=process.env.MIROIR_ADB || 'D:\\sdk\\platform-tools\\adb.exe';
const serial=process.env.MIROIR_ANDROID_SERIAL || 'emulator-5556';
const packageName='com.miroir.mobile.dev';
function run(...args){return execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:20000,windowsHide:true});}
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
function nodes(){
  run('shell','uiautomator','dump','/sdcard/miroir-qa.xml');
  const xml=run('shell','cat','/sdcard/miroir-qa.xml');
  return [...xml.matchAll(/<node\s+([^>]+)>/g)].map(match=>Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])])));
}
function find(list,label,field=false){
  const matches=list.filter(n=>(n.text===label||n['content-desc']===label||n.hint===label)&&(!field||n.class==='android.widget.EditText'));
  const node=matches.find(n=>n.clickable==='true')||matches[0];
  if(!node) throw new Error(`Visible ${field?'field':'control'} not found: ${label}`);
  return node;
}
function tap(node){const b=node.bounds.match(/\d+/g).map(Number);run('shell','input','tap',String(Math.round((b[0]+b[2])/2)),String(Math.round((b[1]+b[3])/2)));}
function input(value){if(!/^[a-zA-Z0-9@._+\-]+$/.test(value||'')) throw new Error('Unsupported QA input characters');run('shell','input','text',value);run('shell','input','keyevent','4');}
function print(list){
  const secrets=Object.entries(process.env).filter(([k,v])=>k.startsWith('MIROIR_')&&k.endsWith('_PASSWORD')&&v).map(([,v])=>v);
  const redact=s=>secrets.reduce((text,secret)=>text.replaceAll(secret,'[redacted]'),s);
  console.log(JSON.stringify(list.filter(n=>n.text||n['content-desc']||n.class==='android.widget.EditText').slice(0,80).map(n=>({text:n.password==='true'?'[password]':redact(n.text||''),label:redact(n['content-desc']||''),class:n.class,bounds:n.bounds,clickable:n.clickable})),null,2));
}
(async()=>{
  const output=path.resolve(__dirname,'../test-results/android');fs.mkdirSync(output,{recursive:true});
  const capture=name=>{const safe=String(name).replace(/[^a-z0-9_-]/gi,'');if(!safe)throw new Error('Missing capture name');const png=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:20000,maxBuffer:16*1024*1024,windowsHide:true});fs.writeFileSync(path.join(output,`${safe}.png`),png);};
  print(nodes());
  const oneShot=process.argv.find(arg=>arg.startsWith('--capture='));
  if(oneShot){capture(oneShot.slice('--capture='.length));return;}
  const commands=readline.createInterface({input:process.stdin});
  for await(const line of commands){try {
    const command=JSON.parse(line);if(command.close) break;
    if(command.tap) tap(find(nodes(),command.tap));
    if(command.credential){const actor=command.credential;if(!['CUSTOMER','SHOP'].includes(actor))throw new Error('Unknown actor');tap(find(nodes(),command.emailLabel||'Email',true));input(process.env[`MIROIR_${actor}_EMAIL`]);tap(find(nodes(),command.passwordLabel||'Password',true));input(process.env[`MIROIR_${actor}_PASSWORD`]);}
    if(command.back) run('shell','input','keyevent','4');
    if(command.restart){run('shell','am','force-stop',packageName);run('shell','monkey','-p',packageName,'1');}
    if(command.wait){const deadline=Date.now()+30000;while(true){const list=nodes();if(list.some(n=>n.text===command.wait||n['content-desc']===command.wait))break;if(Date.now()>deadline)throw new Error('Timed out waiting for '+command.wait);await new Promise(r=>setTimeout(r,500));}}
    if(command.screenshot) capture(command.screenshot);
    print(nodes());
  }catch(error){console.log(error.message.split('\n')[0]);}}
})().catch(error=>{console.error(error.message.split('\n')[0]);process.exitCode=1;});
