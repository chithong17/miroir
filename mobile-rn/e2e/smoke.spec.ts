import {test,expect,Page} from '@playwright/test';
import {Buffer} from 'node:buffer';
const shop = {id:'s1',name:'Willow Studio',description:'Thoughtful everyday pieces',logoUrl:'',coverUrl:'',contact:{address:'Saigon',email:'shop@example.test',phone:'0900000000'}};
const product = {id:'p1',name:'Linen shirt',description:'A breathable everyday shirt',category:'top',gender:'unisex',price:250000,imageUrl:'',colors:['Ivory'],sizes:['M'],variants:[{id:'v1',sku:'LINEN-M',color:'Ivory',size:'M',stockQuantity:10,active:true}],material:'Linen',fitType:'regular',styleTags:[],occasionTags:[],shop};
const user = {id:'u1',name:'Alex',email:'alex@example.test',profile:{},profileCompleted:true,profileSkipped:false,favoriteProductIds:[],subscription:{isPremium:false}};
async function mockApi(page:Page) {
  let quantity = 0;
  await page.route('**/api/**',async route => {
    const path = new URL(route.request().url()).pathname.replace('/api','');
    const method = route.request().method();
    let body:unknown;
    if (path === '/catalog/products') body = {products:[product],pagination:{page:1,totalPages:1,total:1,limit:12}};
    else if (path === '/users/me/favorites') body = {products:[product]};
    else if (path === '/catalog/products/p1') body = {product};
    else if (path === '/catalog/shops/s1') body = {shop};
    else if (path === '/catalog/outfits') body = {outfits:[],pagination:{page:1,totalPages:1,total:0,limit:12}};
    else if (path === '/user-auth/login') body = {success:true,token:'test-customer-token',user};
    else if (path === '/user-auth/me') body = {user};
    else if (path === '/users/me/cart' || path === '/users/me/cart/items') {
      if (method === 'POST') quantity = route.request().postDataJSON().quantity;
      body = {cart:{id:'cart1',addressId:'address1',groups:quantity ? [{shop:{...shop,bankTransferAvailable:true},items:[{productId:'p1',variantId:'v1',quantity,product,variant:product.variants[0],available:true,lineTotal:quantity*250000}],subtotal:quantity*250000}] : [],subtotal:quantity*250000,itemCount:quantity}};
    }
    else if (path === '/users/me/addresses') body = {addresses:[{id:'address1',label:'Home',recipientName:'Alex',phone:'0900000000',fullAddress:'Test address, Saigon',isDefault:true}]};
    else if (path === '/orders/checkout') body = {orders:[]};
    else if (path === '/orders/me') body = {orders:[{id:'order1',orderCode:'ORD-001',shopSnapshot:shop,total:250000,orderStatus:'confirmed',paymentStatus:'awaiting_transfer',paymentMethod:'bank_transfer',items:[],createdAt:'2026-01-01T00:00:00Z'}]};
    else if (path === '/orders/me/order1') body = {order:{id:'order1',orderCode:'ORD-001',shopSnapshot:shop,total:250000,orderStatus:'confirmed',paymentStatus:'awaiting_transfer',paymentMethod:'bank_transfer',items:[],recipient:{name:'Alex',phone:'0900000000',fullAddress:'Test address, Saigon'},paymentSnapshot:{bankName:'Test Bank',accountHolder:'Willow Studio',accountNumber:'123456'},statusHistory:[]}};
    else if (path === '/orders/me/order1/transfer-reported') body = {success:true};
    else if (path === '/chat/conversations') body = method === 'POST' ? {conversation:{id:'c1'}} : {conversations:[{id:'c1',counterpart:shop,unreadCount:1,lastMessage:{preview:'Hello Alex'}}],totalUnread:1};
    else if (path === '/chat/conversations/c1/messages') body = method === 'POST' ? {message:{id:'m2'}} : {messages:[{id:'m1',senderType:'shop',text:'Hello Alex',images:[],createdAt:'2026-01-01T00:00:00Z'}]};
    else if (path === '/chat/conversations/c1/read') body = {success:true};
    else if (path === '/shop-auth/login') body = {success:true,token:'test-owner-token',owner:{id:'o1',name:'Shop Owner',email:'owner@example.test',subscription:{isPremium:true}}};
    else if (path === '/shops/me') body = {shops:[shop]};
    else if (path === '/payments/me') body = {subscription:{isPremium:true}};
    else if (path === '/shop-products') body = {products:[]};
    else return route.fulfill({status:404,json:{message:`Unmocked API ${method} ${path}`}});
    await route.fulfill({json:body});
  });
}
async function entry(page:Page) {await mockApi(page);await page.goto('/');await page.getByRole('button',{name:'Skip',exact:true}).click();}
test('guest navigates marketplace, product, shop and AI tabs without runtime errors',async ({page}) => {
  const errors:string[] = [];page.on('pageerror',e => errors.push(e.message));
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();
  await expect(page.getByText('A breathable everyday shirt',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Visit shop',exact:true}).click();
  await expect(page.getByText('Shop collection',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Try it on',exact:true}).click();
  await expect(page.getByText('See it on you',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Stylist',exact:true}).click();
  await expect(page.getByText('AI Stylist',{exact:true}).filter({visible:true})).toBeVisible();
  expect(errors).toEqual([]);
});
test('customer authentication and variant add-to-cart use expected API fields',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByText('Hello, Alex',{exact:true})).toBeVisible();
  await expect(page.getByText('Welcome back to MIROIR',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();
  await page.getByRole('button',{name:'Ivory · M (10 available)',exact:true}).click();
  const sent = page.waitForRequest(r => r.url().includes('/users/me/cart/items') && r.method() === 'POST');
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();
  expect((await sent).postDataJSON()).toEqual({productId:'p1',variantId:'v1',quantity:1});
  await expect(page.getByText('Added to your bag.',{exact:true})).toBeVisible();
});
test('saved items are reachable from account and preserve favorite product navigation',async ({page}) => {
  await customerLogin(page);
  await page.getByRole('tab',{name:'Account',exact:true}).click();
  await page.getByRole('button',{name:'Saved Items',exact:true}).click();
  await expect(page.getByRole('button',{name:'Linen shirt',exact:true}).filter({visible:true})).toBeVisible();
  await page.getByRole('button',{name:'Account',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved Items',exact:true})).toBeVisible();
});

test('guest can use separate owner login and guarded products route',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();
  await page.getByLabel('email',{exact:true}).fill('owner@example.test');await page.getByLabel('password',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  await expect(page.getByText('Owner center',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Manage products',exact:true}).click();
  await expect(page.getByText('No products in this view.',{exact:true})).toBeVisible();
});
test('checkout submits delivery address and per-shop payment method',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();await page.getByRole('button',{name:'Ivory · M (10 available)',exact:true}).click();await page.getByRole('button',{name:'Add to bag',exact:true}).click();await expect(page.getByText('Added to your bag.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'View bag',exact:true}).click();await page.getByRole('button',{name:'Checkout',exact:true}).click();
  await expect(page.getByText('Test address, Saigon',{exact:true})).toBeVisible();
  const pending = page.waitForRequest(r => r.url().endsWith('/orders/checkout') && r.method() === 'POST');
  await page.getByRole('button',{name:'Place order',exact:true}).click();const body = (await pending).postDataJSON();
  expect(body.addressId).toBe('address1');expect(body.paymentMethods).toEqual({s1:'cash'});expect(body.idempotencyKey).toBeTruthy();
  await expect(page.getByText('My orders',{exact:true})).toBeVisible();
});
test('product contact opens chat with context and sends multipart message',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();await page.getByRole('button',{name:'Contact shop',exact:true}).click();
  await expect(page.getByText('Hello Alex',{exact:true})).toBeVisible();await page.getByLabel('Message',{exact:true}).fill('Is this available?');
  const pending = page.waitForRequest(r => r.url().endsWith('/conversations/c1/messages') && r.method() === 'POST');await page.getByRole('button',{name:'Send message',exact:true}).click();
  const body = (await pending).postData()!;expect(body).toContain('Is this available?');expect(body).toContain('contextType');expect(body).toContain('product');
  await expect(page.getByLabel('Message',{exact:true})).toHaveValue('');
});
test('order detail displays bank instructions and reports transfer through correct endpoint',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'My orders',exact:true}).click();await page.getByRole('button',{name:'Order details',exact:true}).click();
  await expect(page.getByText('Test Bank',{exact:true})).toBeVisible();await expect(page.getByText('Test address, Saigon',{exact:true})).toBeVisible();
  const pending = page.waitForRequest(r => r.url().endsWith('/orders/me/order1/transfer-reported') && r.method() === 'POST');
  await page.getByRole('button',{name:'I have transferred',exact:true}).click();await pending;
  await expect(page.getByText('Order updated.',{exact:true})).toBeVisible();
});
test('tab navigation preserves stylist draft and account language survives reload',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('tab',{name:'Stylist',exact:true}).click();await page.getByLabel('Occasion / request',{exact:true}).fill('Weekend linen outfit');
  await page.getByRole('tab',{name:'Home',exact:true}).click();await page.getByRole('tab',{name:'Stylist',exact:true}).click();
  await expect(page.getByLabel('Occasion / request',{exact:true})).toHaveValue('Weekend linen outfit');
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Vietnamese',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Tài khoản',exact:true})).toBeVisible();await page.reload();
  await expect(page.getByRole('tab',{name:'Tài khoản',exact:true})).toBeVisible();
});
test('onboarding supports next, previous and completion',async ({page}) => {
  await mockApi(page);await page.goto('/');await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByText('Try looks on before you buy',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Previous',exact:true}).click();await expect(page.getByText('Welcome to MIROIR',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Get started',exact:true}).click();
  await expect(page.getByText('Start your fashion flow',{exact:true})).toBeVisible();
});
test('customer 401 expires session and removes authenticated UI',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.route('**/api/orders/me',route => route.fulfill({status:401,json:{message:'Token expired'}}));
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'My orders',exact:true}).click();
  await expect(page.getByText('Start your fashion flow',{exact:true})).toBeVisible();
  await expect(page.getByText('Your session expired. Please sign in again.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Order details',exact:true})).toHaveCount(0);
});
test('owner 401 does not expire the customer session',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();
  await page.getByLabel('email',{exact:true}).fill('owner@example.test');await page.getByLabel('password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  await expect(page.getByText('Owner center',{exact:true})).toBeVisible();
  await page.route('**/api/shop-products',route => route.fulfill({status:401,json:{message:'Owner expired'}}));
  await page.getByRole('button',{name:'Manage products',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in as owner',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back to account',exact:true}).click();
  await expect(page.getByText('Alex',{exact:true}).filter({visible:true})).toBeVisible();await expect(page.getByRole('button',{name:'My orders',exact:true})).toBeVisible();
});
test('mobile collection layout exposes products before advanced filters',async ({page}) => {
  await page.setViewportSize({width:375,height:812});await entry(page);
  await page.route('**/api/catalog/products?**',route => route.fulfill({json:{products:[product,{...product,id:'p2',name:'Everyday trousers'}],pagination:{page:1,totalPages:1,total:2,limit:12}}}));
  await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await expect(page.getByRole('button',{name:'Linen shirt',exact:true})).toBeVisible();
  await expect(page.getByLabel('Minimum price',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/marketplace-375.png',fullPage:true});
  await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByLabel('Minimum price',{exact:true}).fill('100000');await page.getByLabel('Maximum price',{exact:true}).fill('500000');
  const pending=page.waitForRequest(r => r.url().includes('/catalog/products') && r.url().includes('minPrice=100000'));await page.getByRole('button',{name:'Apply filters',exact:true}).click();
  expect(new URL((await pending).url()).searchParams.get('maxPrice')).toBe('500000');
});
async function customerLogin(page:Page) {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Linen shirt',exact:true})).toBeVisible();
}
test('catalog try-on uploads a photo and completes while another tab is open',async ({page}) => {
  await customerLogin(page);let polls=0;
  await page.route('**/api/tryon/catalog',route => route.fulfill({json:{success:true,taskId:'task1'}}));
  await page.route('**/api/tryon/task1',route => route.fulfill({json:++polls >= 2 ? {success:true,status:'completed',resultUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII='} : {success:true,status:'processing'}}));
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();await page.getByRole('button',{name:'Try it on',exact:true}).click();
  const chooserPromise=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Choose model image',exact:true}).click();
  await (await chooserPromise).setFiles({name:'model.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=','base64')});
  const pending=page.waitForRequest(r => r.url().endsWith('/tryon/catalog') && r.method() === 'POST');await page.getByRole('button',{name:'Start try-on',exact:true}).click();
  const body=(await pending).postData()!;expect(body).toContain('productId');expect(body).toContain('p1');expect(body).toContain('model.png');
  await page.getByRole('tab',{name:'Home',exact:true}).click();
  await expect(page.getByRole('button',{name:'Your look is ready →',exact:true})).toBeVisible({timeout:15000});
  await page.getByRole('button',{name:'Your look is ready →',exact:true}).click();await expect(page.getByLabel('Try-on result',{exact:true})).toBeVisible();
});
test('stylist sends nested profile and budget then records outfit feedback',async ({page}) => {
  await customerLogin(page);
  await page.route('**/api/stylist/recommend',route => route.fulfill({json:{success:true,noMatch:false,analysis:{styleMatch:'Relaxed weekend style'},outfits:[{id:'outfit1',title:'Weekend linen',score:95,whyItMatches:'Light and comfortable',items:[{reason:'Breathable layer',product}],fitWarnings:[],fashionTips:[]}],fitWarnings:[],fashionTips:[]}}));
  await page.route('**/api/stylist/feedback',route => route.fulfill({json:{success:true}}));
  await page.getByRole('tab',{name:'Stylist',exact:true}).click();await page.getByLabel('Occasion / request',{exact:true}).fill('Weekend outfit');await page.getByLabel('Minimum budget',{exact:true}).fill('100000');await page.getByLabel('Maximum budget',{exact:true}).fill('500000');await page.getByLabel('Style preferences (comma separated)',{exact:true}).fill('minimal, casual');
  const pending=page.waitForRequest(r => r.url().endsWith('/stylist/recommend'));await page.getByRole('button',{name:'Find my looks',exact:true}).click();const body=(await pending).postDataJSON();expect(body.budget).toEqual({min:100000,max:500000});expect(body.profile.stylePreferences).toEqual(['minimal','casual']);
  await expect(page.getByText('Weekend linen',{exact:true})).toBeVisible();const feedback=page.waitForRequest(r => r.url().endsWith('/stylist/feedback'));await page.getByRole('button',{name:'Love this look',exact:true}).click();expect((await feedback).postDataJSON()).toEqual({userId:'u1',outfitId:'outfit1',eventType:'liked',productIds:['p1']});await expect(page.getByText('Your style feedback is saved.',{exact:true})).toBeVisible();
});
test('custom upper/lower try-on sends only selected garment image fields',async ({page}) => {
  await customerLogin(page);
  await page.route('**/api/tryon/custom',route => route.fulfill({json:{success:true,taskId:'custom1'}}));
  await page.route('**/api/tryon/custom1',route => route.fulfill({json:{success:true,status:'completed',resultUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII='}}));
  await page.getByRole('tab',{name:'Try-on',exact:true}).click();await page.getByRole('button',{name:'Upper / Lower',exact:true}).click();
  for (const slot of ['model','upper']) {const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:`Choose ${slot} image`,exact:true}).click();await (await chooser).setFiles({name:`${slot}.png`,mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=','base64')});}
  const pending=page.waitForRequest(r => r.url().endsWith('/tryon/custom') && r.method() === 'POST');await page.getByRole('button',{name:'Start try-on',exact:true}).click();const body=(await pending).postData()!;
  expect(body).toContain('upper_lower');expect(body).toContain('name="modelImage"');expect(body).toContain('name="upperImage"');expect(body).not.toContain('name="lowerImage"');expect(body).not.toContain('name="dressImage"');
  await expect(page.getByLabel('Try-on result',{exact:true})).toBeVisible();
});
const returnFixture={id:'r1',orderId:'delivered1',orderCode:'ORD-RETURN',status:'approved',reason:'Wrong size',refundAmount:250000,createdAt:'2026-01-01T00:00:00Z',returnInstructions:'Send to Willow Studio',attachments:[],items:[{productId:'p1',variantId:'v1',name:'Linen shirt',quantity:1,lineTotal:250000}],refundAccount:{bankName:'Test Bank',accountNumber:'123',accountHolder:'Alex'},history:[]};
async function uploadProof(page:Page,name='receipt.png') {
  const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:/^Add photo/}).click();await (await chooser).setFiles({name,mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=','base64')});
}
test('customer creates return and submits shipment with required image',async ({page}) => {
  await customerLogin(page);let shipped=false;
  await page.route('**/api/orders/me',route => route.fulfill({json:{orders:[{id:'delivered1',orderCode:'ORD-RETURN',shopSnapshot:shop,total:250000,orderStatus:'delivered',paymentStatus:'paid',paymentMethod:'cash',items:[{productId:'p1',variantId:'v1',name:'Linen shirt',quantity:1,lineTotal:250000}],createdAt:'2026-01-01T00:00:00Z'}]}}));
  await page.route('**/api/orders/returns/me/delivered1',route => route.fulfill({json:{return:returnFixture}}));
  await page.route('**/api/orders/returns/me/r1',route => route.fulfill({json:{return:{...returnFixture,status:shipped?'return_shipped':'approved'}}}));
  await page.route('**/api/orders/returns/r1/shipment',route => {shipped=true;return route.fulfill({json:{success:true}});});
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'My orders',exact:true}).click();await page.getByRole('button',{name:'Request return',exact:true}).click();
  await page.getByLabel('Quantity to return (0 to skip)',{exact:true}).fill('1');await page.getByLabel('reason',{exact:true}).fill('Wrong size');await page.getByLabel('bank Name',{exact:true}).fill('Test Bank');await page.getByLabel('account Number',{exact:true}).fill('123');await page.getByLabel('account Holder',{exact:true}).fill('Alex');
  const create=page.waitForRequest(r => r.url().endsWith('/returns/me/delivered1') && r.method()==='POST');await page.getByRole('button',{name:'Submit return request',exact:true}).click();const payload=(await create).postData()!;expect(payload).toContain('variantId');expect(payload).toContain('v1');expect(payload).toContain('Test Bank');
  await expect(page.getByText('Send to Willow Studio',{exact:true})).toBeVisible();await page.getByLabel('Tracking code',{exact:true}).fill('TRACK-001');await uploadProof(page);
  const shipment=page.waitForRequest(r => r.url().endsWith('/returns/r1/shipment') && r.method()==='POST');await page.getByRole('button',{name:'Submit shipment',exact:true}).click();const body=(await shipment).postData()!;expect(body).toContain('TRACK-001');expect(body).toContain('receipt.png');await expect(page.getByText('Return updated.',{exact:true})).toBeVisible();
});
test('owner return progresses through approval receipt and refund proof',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();await page.getByLabel('email',{exact:true}).fill('owner@example.test');await page.getByLabel('password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  let status='requested';
  await page.route('**/api/shop-orders/returns',route => route.fulfill({json:{returns:[{...returnFixture,status}]}}));
  await page.route('**/api/shop-orders/returns/r1/decision',route => {status='return_shipped';return route.fulfill({json:{success:true}});});
  await page.route('**/api/shop-orders/returns/r1/received',route => {status='refund_pending';return route.fulfill({json:{success:true}});});
  await page.route('**/api/shop-orders/returns/r1/refund',route => {status='refunded';return route.fulfill({json:{success:true}});});
  await page.getByRole('button',{name:'Shop returns & refunds',exact:true}).click();await page.getByLabel('Instructions / reason / refund note',{exact:true}).fill('Send to Willow Studio');const decide=page.waitForRequest(r => r.url().endsWith('/r1/decision'));await page.getByRole('button',{name:'Approve return',exact:true}).click();expect((await decide).postDataJSON().approved).toBe(true);
  await page.getByRole('button',{name:'Confirm returned goods received',exact:true}).click();await uploadProof(page,'refund.png');const refund=page.waitForRequest(r => r.url().endsWith('/r1/refund'));await page.getByRole('button',{name:'Record refund with proof',exact:true}).click();expect((await refund).postData()).toContain('refund.png');await expect(page.getByText(/refunded ·/)).toBeVisible();
});
async function ownerLogin(page:Page) {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();await page.getByLabel('email',{exact:true}).fill('owner@example.test');await page.getByLabel('password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();await expect(page.getByText('Owner center',{exact:true})).toBeVisible();
}
test('owner creates product with stock then archives and restores it',async ({page}) => {
  await ownerLogin(page);let saved={...product,id:'newp',status:'draft',availability:'in_stock',imagePublicId:''};let exists=false;
  await page.route('**/api/shop-products',async route => {
    if (route.request().method()==='POST') {saved={...saved,...route.request().postDataJSON()};exists=true;return route.fulfill({json:{product:saved}});}
    return route.fulfill({json:{products:exists?[saved]:[]}});
  });
  await page.route('**/api/shop-products/newp',route => route.fulfill({json:{product:saved}}));
  await page.route('**/api/shop-products/newp/archive',route => {saved.status='archived';return route.fulfill({json:{product:saved}});});
  await page.route('**/api/shop-products/newp/restore',route => {saved.status='draft';return route.fulfill({json:{product:saved}});});
  await page.getByRole('button',{name:'Manage products',exact:true}).click();await page.getByRole('button',{name:'Create product',exact:true}).click();
  await page.getByLabel('name',{exact:true}).fill('New linen shirt');await page.getByLabel('category',{exact:true}).fill('top');await page.getByLabel('description',{exact:true}).fill('Everyday linen');await page.getByLabel('price',{exact:true}).fill('250000');await page.getByRole('button',{name:'Add variant',exact:true}).click();await page.getByLabel('sku',{exact:true}).fill('linen-m');await page.getByLabel('color',{exact:true}).fill('Ivory');await page.getByLabel('size',{exact:true}).fill('M');await page.getByLabel('stockQuantity',{exact:true}).fill('10');
  const pending=page.waitForRequest(r => r.url().endsWith('/shop-products') && r.method()==='POST');await page.getByRole('button',{name:'Save product',exact:true}).click();const payload=(await pending).postDataJSON();expect(payload.variants[0].sku).toBe('LINEN-M');expect(payload.variants[0].stockQuantity).toBe(10);expect(payload.price).toBe(250000);
  await expect(page.getByText('Edit product',{exact:true}).filter({visible:true})).toBeVisible();await page.getByRole('button',{name:'Products',exact:true}).click();await page.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.getByRole('button',{name:'Restore to draft',exact:true})).toBeVisible();await page.getByRole('button',{name:'Restore to draft',exact:true}).click();await expect(page.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
});
test('owner billing uses owner token and refreshes subscription after paid response',async ({page}) => {
  await ownerLogin(page);
  await page.route('**/api/payments/plans',route => route.fulfill({json:{plans:[{code:'GROWTH',name:'Growth',accountType:'shop_owner',amount:349000,durationDays:30,features:['Advanced dashboard']}]}}));
  await page.route('**/api/payments/create',route => route.fulfill({json:{success:true,order:{orderCode:123,status:'paid'}}}));
  await page.route('**/api/payments/status/123',route => route.fulfill({json:{order:{orderCode:123,status:'paid'}}}));
  await page.getByRole('button',{name:'Shop subscription plans',exact:true}).click();const pending=page.waitForRequest(r => r.url().endsWith('/payments/create'));const refresh=page.waitForRequest(r => r.url().endsWith('/payments/me'));
  await page.getByRole('button',{name:'Choose plan',exact:true}).click();const request=await pending;expect(request.headers().authorization).toBe('Bearer test-owner-token');expect(request.postDataJSON()).toEqual({planCode:'GROWTH'});await refresh;await expect(page.getByText('Payment confirmed. Your account has been refreshed.',{exact:true})).toBeVisible();
});
test('dashboard displays backend metrics and privacy-gated audience state',async ({page}) => {
  await ownerLogin(page);
  await page.route('**/api/shops/me/dashboard?**',route => route.fulfill({json:{dashboard:{summary:{totalOrders:7,collectedRevenue:1750000},inventoryHealth:{total:4,published:3,draft:1,outOfStock:0,needsEmbedding:0}}}}));
  await page.route('**/api/shops/me/analytics?**',route => route.fulfill({json:{analytics:{summary:{productViews:100,tryOnClicks:20,stylistMatches:10,feedbackCount:5,conversionRate:0.2,publishedProducts:3},timeSeries:[]}}}));
  await page.route('**/api/shops/me/insights?**',route => route.fulfill({json:{insights:{enoughData:false,message:'Not enough data yet.',eventCount:3,userCount:2}}}));
  await page.getByRole('button',{name:'Dashboard & analytics',exact:true}).click();await expect(page.getByText('Collected revenue',{exact:true})).toBeVisible();await expect(page.getByText('20.0%',{exact:true})).toBeVisible();
  const request=page.waitForRequest(r => r.url().includes('/shops/me/insights'));await page.getByRole('button',{name:'Audience insights',exact:true}).click();await request;await expect(page.getByText('Not enough data yet.',{exact:true})).toBeVisible();
});
