import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';

async function start(page:Page) {
  await page.goto('/');
  await page.getByRole('button', {name:'Skip', exact:true}).click();
}

test('real customer image upload, AI polling and stylist result rendering', async ({page,request}) => {
  test.skip(process.env.MIROIR_ALLOW_AI !== 'yes', 'Explicit paid AI opt-in required');
  test.setTimeout(420000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(process.env.MIROIR_CUSTOMER_EMAIL!);
  await page.getByLabel('Password',{exact:true}).fill(process.env.MIROIR_CUSTOMER_PASSWORD!);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('tab',{name:'Try-on',exact:true}).click();
  await page.getByRole('button',{name:'Upper / Lower',exact:true}).click();
  for(const [slot,sample] of [['model','human/00034_00.jpg'],['upper','cloth/04469_00.jpg']]) {
    const image=await request.get(`https://raw.githubusercontent.com/yisol/IDM-VTON/main/gradio_demo/example/${sample}`);
    expect(image.ok()).toBeTruthy();
    const chooser=page.waitForEvent('filechooser');
    await page.getByRole('button',{name:`Choose ${slot} image`,exact:true}).click();
    await (await chooser).setFiles({name:`${slot}.jpg`,mimeType:'image/jpeg',buffer:await image.body()});
  }
  const created=page.waitForResponse(r=>r.url().endsWith('/tryon/custom')&&r.request().method()==='POST',{timeout:100000});
  await page.getByRole('button',{name:'Start try-on',exact:true}).click();
  expect((await created).status()).toBe(201);
  await expect(page.getByLabel('Try-on result',{exact:true})).toBeVisible({timeout:320000});
  await page.screenshot({path:'test-results/live/ai-tryon-result.png',fullPage:true});
  await page.getByRole('tab',{name:'Stylist',exact:true}).click();
  await page.getByLabel('Occasion / request',{exact:true}).fill('A coordinated casual daytime outfit');
  await page.getByLabel('Outfit count',{exact:true}).fill('1');
  const styled=page.waitForResponse(r=>r.url().endsWith('/stylist/recommend')&&r.request().method()==='POST',{timeout:100000});
  await page.getByRole('button',{name:'Find my looks',exact:true}).click();
  const styledResponse=await styled;expect(styledResponse.status()).toBe(200);
  const result=await styledResponse.json();expect(result.success).toBeTruthy();
  expect(result.outfits.length).toBeGreaterThan(0);
  await expect(page.getByText(result.outfits[0].title,{exact:true}).filter({visible:true})).toBeVisible();
  await page.screenshot({path:'test-results/live/ai-stylist-result.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('real customer login and read-only account screens', async ({page}) => {
  test.skip(!process.env.MIROIR_CUSTOMER_PASSWORD, 'Provide credentials in the process environment');
  test.setTimeout(180000);
  const errors:string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(process.env.MIROIR_CUSTOMER_EMAIL!);
  await page.getByLabel('Password',{exact:true}).fill(process.env.MIROIR_CUSTOMER_PASSWORD!);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Home',exact:true})).toBeVisible({timeout:30000});
  for (const tab of ['Home','Try-on','Stylist','Account']) {
    await page.getByRole('tab',{name:tab,exact:true}).click();
    await page.screenshot({path:`test-results/live/customer-${tab}.png`,fullPage:true});
  }
  for (const [label, api] of [
    ['My bag','/users/me/cart'], ['My orders','/orders/me'], ['Delivery addresses','/users/me/addresses'],
    ['Notifications','/notifications'], ['Returns & refunds','/orders/returns/me'], ['Messages','/chat/conversations'],
  ]) {
    const response = page.waitForResponse(r => new URL(r.url()).pathname.endsWith(api) && r.request().method() === 'GET');
    await page.getByRole('button',{name:label,exact:true}).click();
    expect((await response).status()).toBe(200);
    await page.screenshot({path:`test-results/live/customer-${api.replaceAll('/','_')}.png`,fullPage:true});
    await page.goBack();
  }
  await page.getByRole('button',{name:'Premium plans',exact:true}).click();
  await expect(page.getByText('There are currently no paid customer plans. Available customer features are included with your account.',{exact:true})).toBeVisible();
  await page.goBack();
  await page.getByRole('button',{name:'Edit Profile',exact:true}).click();
  await expect(page.getByText('Your style profile',{exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/live/customer-profile.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('real owner login and read-only management screens', async ({page}) => {
  test.skip(!process.env.MIROIR_SHOP_PASSWORD, 'Provide credentials in the process environment');
  test.setTimeout(180000);
  const errors:string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();
  await page.getByRole('button',{name:'Shop owner center',exact:true}).click();
  await page.getByLabel('email',{exact:true}).fill(process.env.MIROIR_SHOP_EMAIL!);
  await page.getByLabel('password',{exact:true}).fill(process.env.MIROIR_SHOP_PASSWORD!);
  await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  await expect(page.getByText('Owner center',{exact:true})).toBeVisible({timeout:30000});
  await page.screenshot({path:'test-results/live/owner-center.png',fullPage:true});
  for (const label of ['Edit shop','Manage products','Dashboard & analytics','Shop subscription plans','Shop orders','Customer messages','Shop notifications','Shop returns & refunds']) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page.getByRole('button',{name:['Shop subscription plans','Customer messages'].includes(label) ? 'Account' : 'Owner center',exact:true}).filter({visible:true})).toBeVisible();
    await page.screenshot({path:`test-results/live/owner-${label.replaceAll(/[^a-z]/gi,'_')}.png`,fullPage:true});
    await page.goBack();
  }
  expect(errors).toEqual([]);
});

// Opt-in only. No route fixtures and no writes to production data.
test('guest renders real catalog and product detail from deployed backend', async ({page, request}) => {
  const api = process.env.MIROIR_LIVE_API!;
  const response = await request.get(`${api}/catalog/products?limit=1`);
  expect(response.ok()).toBeTruthy();
  const {products} = await response.json();
  expect(products.length).toBeGreaterThan(0);
  const errors:string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', {name:'Skip', exact:true}).click();
  const loaded = page.waitForResponse(r => r.url().includes('/catalog/products') && r.status() === 200);
  await page.getByRole('button', {name:'Continue as guest', exact:true}).click();
  await loaded;
  await page.getByRole('button', {name:products[0].name, exact:true}).click();
  await expect(page.getByText(products[0].description, {exact:true}).filter({visible:true})).toBeVisible();
  if (products[0].imageUrl) {
    const image = page.locator('img').filter({visible:true});
    await expect.poll(async () => image.evaluateAll((images, url) => images.some(image => {
      const element = image as HTMLImageElement;
      return element.src === url && element.complete && element.naturalWidth > 0;
    }), products[0].imageUrl), {timeout:15000}).toBe(true);
  }
  await page.screenshot({path:'test-results/live-product-390.png', fullPage:true});
  expect(errors).toEqual([]);
});
