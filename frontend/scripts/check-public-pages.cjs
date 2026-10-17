// Uses the existing Playwright installation; never calls a real deletion API.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('@playwright/test', {paths:[process.cwd(),path.resolve(__dirname,'../../mobile-rn')]}));
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    await context.route('**/api/**',route => ['fetch','xhr'].includes(route.request().resourceType()) ? route.abort() : route.continue());
    const base = process.env.MIROIR_PUBLIC_PREVIEW || 'http://127.0.0.1:5182';
    const paths = ['/about','/policies','/privacy','/ai-policy','/terms','/delete-account','/support'];
    const output = path.resolve(__dirname,'../../mobile-rn/test-results/public-site');
    fs.mkdirSync(output,{recursive:true});
    for(const width of [390,1440]) {
      await page.setViewportSize({width,height:900});
      for(const route of paths) {
        const response = await page.goto(base+route,{waitUntil:'domcontentloaded'});
        assert.equal(response.status(),200);
        await page.locator('h1').waitFor();
        assert.equal(await page.locator('h1').count(),1);
        assert.equal(await page.locator('main').count(),1);
        assert.equal(await page.locator('a[href="/privacy"]').count() > 0,true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`${route} overflows at ${width}`);
        assert.equal(await page.locator('html').getAttribute('lang'),'vi');
        if(['/about','/privacy','/delete-account'].includes(route)) await page.screenshot({path:path.join(output,`${route.slice(1)}-${width}.png`),fullPage:true});
      }
    }
    // Saved tokens must not redirect public policy pages to authenticated screens.
    await page.evaluate(() => localStorage.setItem('miroir_user_token','fixture-only'));
    await page.goto(base+'/privacy/',{waitUntil:'domcontentloaded'});
    assert.match(await page.locator('h1').innerText(),/Dữ liệu/);
    await page.evaluate(() => localStorage.clear());
    let loginCalls=0,deleteCalls=0,rejectLogin=true;
    await page.route('**/user-auth/login',async route => {
      loginCalls++;
      const input=route.request().postDataJSON();
      assert.equal(input.email,'qa@example.test');
      if(rejectLogin){await route.fulfill({status:401,json:{message:'Sai thông tin đăng nhập (fixture).'}});return;}
      await route.fulfill({json:{success:true,token:'fixture-delete-token'}});
    });
    await page.route('**/users/me/account',async route => {
      deleteCalls++;
      assert.equal(route.request().method(),'DELETE');
      assert.equal(route.request().headers().authorization,'Bearer fixture-delete-token');
      await route.fulfill({json:{success:true}});
    });
    await page.goto(base+'/delete-account',{waitUntil:'domcontentloaded'});
    await page.getByLabel('Email tài khoản').fill('qa@example.test');
    await page.getByLabel('Mật khẩu',{exact:true}).fill('fixture-password');
    await page.getByLabel('Nhập XÓA để xác nhận').fill('không');
    await page.getByRole('button',{name:'Xóa vĩnh viễn tài khoản customer',exact:true}).click();
    await page.getByRole('alert').waitFor();
    assert.equal(loginCalls,0);assert.equal(deleteCalls,0);
    await page.getByLabel('Nhập XÓA để xác nhận').fill('XÓA');
    await page.getByRole('button',{name:'Xóa vĩnh viễn tài khoản customer',exact:true}).click();
    await page.getByText('Sai thông tin đăng nhập (fixture).',{exact:true}).waitFor();
    assert.equal(loginCalls,1);assert.equal(deleteCalls,0);
    rejectLogin=false;
    await page.getByRole('button',{name:'Xóa vĩnh viễn tài khoản customer',exact:true}).click();
    await page.getByRole('status').waitFor();
    assert.equal(loginCalls,2);assert.equal(deleteCalls,1);
    assert.equal(await page.evaluate(() => localStorage.getItem('miroir_user_token')),null);
    assert.deepEqual(errors,[]);
    console.log('PASS: 14 responsive page checks, public session access, confirmation guard, mocked deletion and token cleanup. No real account was deleted.');
  } finally {await browser.close();}
})().catch(e => {console.error(e);process.exitCode=1;});
