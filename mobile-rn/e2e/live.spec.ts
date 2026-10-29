import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';

async function start(page:Page) {
  await page.goto('/');
  await page.getByRole('button', {name:'Skip', exact:true}).click();
}

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
  await expect(page.getByRole('tab',{name:'Discover',exact:true})).toBeVisible({timeout:30000});
  for (const tab of ['Discover','Saved','Orders','Account']) {
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
  await page.getByLabel('Email Address',{exact:true}).fill(process.env.MIROIR_SHOP_EMAIL!);
  await page.getByLabel('Password',{exact:true}).fill(process.env.MIROIR_SHOP_PASSWORD!);
  await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  await expect(page.getByText('Owner Center',{exact:true})).toBeVisible({timeout:30000});
  await page.screenshot({path:'test-results/live/owner-center.png',fullPage:true});
  for (const label of ['Edit shop','Manage products','Dashboard & analytics','Shop access','Shop orders','Customer messages','Shop notifications','Shop returns & refunds']) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page.getByRole('button',{name:'Back',exact:true}).filter({visible:true})).toBeVisible();
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
