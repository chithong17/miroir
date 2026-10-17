// Local, interactive read-only UI comparison harness. No recordings or credential persistence.
const {chromium}=require('@playwright/test');
const readline=require('node:readline');
const path=require('node:path');
const redact=text=>Object.entries(process.env).filter(([key,value])=>key.startsWith('MIROIR_')&&key.endsWith('_PASSWORD')&&value).reduce((result,[,value])=>result.replaceAll(value,'[redacted]'),text);
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:8092',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Enable accessibility'}).dispatchEvent('click');
  console.log(redact(await page.locator('body').ariaSnapshot()));
  const input=readline.createInterface({input:process.stdin});
  for await(const line of input){
    try {
      const command=JSON.parse(line);
      if(command.close) break;
      if(command.click) await page.getByRole(command.role || 'button',{name:command.click,exact:true}).click();
      if(command.credential) {
        const actor=command.credential;
        if(!['CUSTOMER','SHOP'].includes(actor)) throw new Error('Unknown actor');
        await page.getByRole('textbox',{name:command.emailLabel || 'Email Address',exact:true}).click();
        await page.keyboard.press('Control+A');
        await page.keyboard.insertText(process.env[`MIROIR_${actor}_EMAIL`]);
        await page.keyboard.press('Tab');
        await page.getByRole('textbox',{name:'Password',exact:true}).click();
        await page.keyboard.press('Control+A');
        await page.keyboard.insertText(process.env[`MIROIR_${actor}_PASSWORD`]);
        await page.keyboard.press('Tab');
        await page.getByRole('button',{name:command.submit || 'Login',exact:true}).click();
      }
      if(command.fill) await page.getByRole('textbox',{name:command.fill,exact:true}).fill(command.value);
      if(command.key) await page.keyboard.press(command.key);
      if(command.screenshot) await page.screenshot({path:path.resolve('test-results',`flutter-${command.screenshot.replace(/[^a-z0-9_-]/gi,'')}.png`)});
      console.log(redact(await page.locator('body').ariaSnapshot()));
    }catch(error){console.log(error.message.split('\n')[0]);}
  }
  await browser.close();
})().catch(error=>{console.error(error.message);process.exitCode=1;});
