import {test,expect,Page} from '@playwright/test';
import {Buffer} from 'node:buffer';
const shop = {id:'s1',name:'Willow Studio',description:'Thoughtful everyday pieces',logoUrl:'',coverUrl:'',contact:{address:'Saigon',email:'shop@example.test',phone:'0900000000'}};
const product = {id:'p1',name:'Linen shirt',description:'A breathable everyday shirt',category:'top',gender:'unisex',price:250000,imageUrl:'',colors:['Ivory'],sizes:['M'],variants:[{id:'v1',sku:'LINEN-M',color:'Ivory',size:'M',stockQuantity:10,active:true}],material:'Linen',fitType:'regular',styleTags:[],occasionTags:[],shop};
const user = {id:'u1',name:'Alex',email:'alex@example.test',profile:{},profileCompleted:true,profileSkipped:false,favoriteProductIds:[],subscription:{isPremium:false}};
async function mockApi(page:Page) {
  let quantity = 0;
  let transferReported = false;
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
    else if (path === '/orders/me/order1') body = {order:{id:'order1',orderCode:'ORD-001',shopSnapshot:shop,total:250000,orderStatus:'confirmed',paymentStatus:transferReported?'pending_verification':'awaiting_transfer',paymentMethod:'bank_transfer',items:[],recipient:{name:'Alex',phone:'0900000000',fullAddress:'Test address, Saigon'},paymentSnapshot:{bankName:'Test Bank',accountHolder:'Willow Studio',accountNumber:'123456'},statusHistory:[]}};
    else if (path === '/orders/me/order1/transfer-reported') {transferReported=true;body = {success:true};}
    else if (path === '/chat/conversations') body = method === 'POST' ? {conversation:{id:'c1'}} : {conversations:[{id:'c1',counterpart:shop,unreadCount:1,lastMessage:{preview:'Hello Alex'}}],totalUnread:1};
    else if (path === '/chat/conversations/c1/messages') body = method === 'POST' ? {message:{id:'m2'}} : {messages:[{id:'m1',senderType:'shop',text:'Hello Alex',images:[],createdAt:'2026-01-01T00:00:00Z'}]};
    else if (path === '/chat/conversations/c1/read') body = {success:true};
    else if (path === '/shop-auth/login') body = {success:true,token:'test-owner-token',owner:{id:'o1',name:'Shop Owner',email:'owner@example.test',subscription:{isPremium:true}}};
    else if (path === '/shops/me') body = {shops:[shop]};
    else if (path === '/payments/me') body = {subscription:{isPremium:true}};
    else if (path === '/shop-orders') body = {orders:[]};
    else if (path === '/shop-chat/conversations') body = {conversations:[],totalUnread:0};
    else if (path === '/shop-products') body = {products:[]};
    else return route.fulfill({status:404,json:{message:`Unmocked API ${method} ${path}`}});
    await route.fulfill({json:body});
  });
}
async function entry(page:Page) {await mockApi(page);await page.goto('/');await page.getByRole('button',{name:'Skip',exact:true}).click();}
test('guest discovers boutiques with saved and order tabs and no AI routes',async ({page}) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Discover',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:/Stylist|Try-on/})).toHaveCount(0);
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();
  await expect(page.getByText('A breathable everyday shirt',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Try it on|Try on/})).toHaveCount(0);
  await page.getByRole('button',{name:'Visit shop',exact:true}).click();
  await expect(page.getByText('Shop collection',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('tab',{name:'Saved',exact:true}).click();
  await expect(page.getByText('Make a shortlist of your favorites',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Orders',exact:true}).click();
  await expect(page.getByText('Sign in to view orders',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});
test('customer authentication and variant add-to-cart use expected API fields',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByText('Hello, Alex. Discover the shops behind the pieces.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();await page.getByRole('button',{name:'Ivory · M (10)',exact:true}).click();
  const sent = page.waitForRequest(r => r.url().includes('/users/me/cart/items') && r.method() === 'POST');
  await page.getByRole('dialog').getByRole('button',{name:'Add to bag',exact:true}).click();
  expect((await sent).postDataJSON()).toEqual({productId:'p1',variantId:'v1',quantity:1});
  await expect(page.getByText('✓ Added to your bag',{exact:true})).toBeVisible();
});
test('saved items are reachable from account and preserve favorite product navigation',async ({page}) => {
  await customerLogin(page);
  await page.getByRole('tab',{name:'Account',exact:true}).click();
  await page.getByRole('button',{name:'Saved Items',exact:true}).click();
  await expect(page.getByRole('button',{name:'Linen shirt',exact:true}).filter({visible:true})).toBeVisible();
  await page.getByRole('tab',{name:'Account',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved Items',exact:true})).toBeVisible();
});

test('guest can use separate owner login and guarded products route',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();
  await page.getByLabel('Email Address',{exact:true}).fill('owner@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  await expect(page.getByText('Owner Center',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Manage products',exact:true}).click();
  await expect(page.getByText('No products in this view',{exact:true})).toBeVisible();
});
test('checkout submits delivery address and per-shop payment method',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();await page.getByRole('button',{name:'Add to bag',exact:true}).click();await page.getByRole('button',{name:'Ivory · M (10)',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Add to bag',exact:true}).click();await expect(page.getByText('✓ Added to your bag',{exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'Linen shirt',exact:true}).click();await page.getByRole('button',{name:'Contact shop',exact:true}).last().click();
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
  await uploadProof(page);
  const pending = page.waitForRequest(r => r.url().endsWith('/orders/me/order1/transfer-reported') && r.method() === 'POST');
  await page.getByRole('button',{name:'I have transferred',exact:true}).click();await pending;
  await expect(page.getByText('pending verification',{exact:true})).toBeVisible();
});
test('commerce tabs and account language survive navigation and reload',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('tab',{name:'Saved',exact:true}).click();await page.getByRole('tab',{name:'Orders',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Vietnamese',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Đơn hàng',exact:true})).toBeVisible();await page.reload();
  await expect(page.getByRole('tab',{name:'Tài khoản',exact:true})).toBeVisible();
});
test('onboarding supports next, previous and completion',async ({page}) => {
  await mockApi(page);await page.goto('/');await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByText('Talk to the shop behind the piece',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Previous',exact:true}).click();await expect(page.getByText('Find pieces with a story',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Get started',exact:true}).click();
  await expect(page.getByText('Find your next favorite boutique',{exact:true})).toBeVisible();
});
test('customer 401 expires session and removes authenticated UI',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.route('**/api/orders/me',route => route.fulfill({status:401,json:{message:'Token expired'}}));
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'My orders',exact:true}).click();
  await expect(page.getByText('Find your next favorite boutique',{exact:true})).toBeVisible();
  await expect(page.getByText('Your session expired. Please sign in again.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Order details',exact:true})).toHaveCount(0);
});
test('owner 401 does not expire the customer session',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();
  await page.getByLabel('Email Address',{exact:true}).fill('owner@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  await expect(page.getByText('Owner Center',{exact:true})).toBeVisible();
  await page.route('**/api/shop-products',route => route.fulfill({status:401,json:{message:'Owner expired'}}));
  await page.getByRole('button',{name:'Manage products',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in as owner',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Customer account',exact:true}).click();
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
  await page.getByRole('button',{name:'Increase quantity',exact:true}).click();await page.getByLabel('Why are you returning these items?',{exact:true}).fill('Wrong size');await page.getByLabel('Bank Name',{exact:true}).fill('Test Bank');await page.getByLabel('Account Number',{exact:true}).fill('123');await page.getByLabel('Account Holder',{exact:true}).fill('Alex');
  const create=page.waitForRequest(r => r.url().endsWith('/returns/me/delivered1') && r.method()==='POST');await page.getByRole('button',{name:'Submit return request',exact:true}).click();const payload=(await create).postData()!;expect(payload).toContain('variantId');expect(payload).toContain('v1');expect(payload).toContain('Test Bank');
  await expect(page.getByText('Send to Willow Studio',{exact:true})).toBeVisible();await page.getByLabel('Tracking Code',{exact:true}).fill('TRACK-001');await uploadProof(page);
  const shipment=page.waitForRequest(r => r.url().endsWith('/returns/r1/shipment') && r.method()==='POST');await page.getByRole('button',{name:'Submit shipment',exact:true}).click();const body=(await shipment).postData()!;expect(body).toContain('TRACK-001');expect(body).toContain('receipt.png');await expect(page.getByText('return shipped',{exact:true})).toBeVisible();
});
test('owner return progresses through approval receipt and refund proof',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();await page.getByLabel('Email Address',{exact:true}).fill('owner@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();
  let status='requested';
  await page.route('**/api/shop-orders/returns',route => route.fulfill({json:{returns:[{...returnFixture,status}]}}));
  await page.route('**/api/shop-orders/returns/r1/decision',route => {status='return_shipped';return route.fulfill({json:{success:true}});});
  await page.route('**/api/shop-orders/returns/r1/received',route => {status='refund_pending';return route.fulfill({json:{success:true}});});
  await page.route('**/api/shop-orders/returns/r1/refund',route => {status='refunded';return route.fulfill({json:{success:true}});});
  await page.getByRole('button',{name:'Shop returns & refunds',exact:true}).click();await page.getByLabel('Return shipping instructions (or rejection reason)',{exact:true}).fill('Send to Willow Studio');const decide=page.waitForRequest(r => r.url().endsWith('/r1/decision'));await page.getByRole('button',{name:'Approve return',exact:true}).click();expect((await decide).postDataJSON().approved).toBe(true);
  await page.getByRole('button',{name:'Confirm returned goods received',exact:true}).click();await uploadProof(page,'refund.png');const refund=page.waitForRequest(r => r.url().endsWith('/r1/refund'));await page.getByRole('button',{name:'Record refund with proof',exact:true}).click();expect((await refund).postData()).toContain('refund.png');await expect(page.getByText('refunded',{exact:true})).toBeVisible();
});
async function ownerLogin(page:Page) {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();await page.getByLabel('Email Address',{exact:true}).fill('owner@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in as owner',exact:true}).click();await expect(page.getByText('Owner Center',{exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'Manage products',exact:true}).click();await page.getByRole('button',{name:'Create product',exact:true}).first().click();
  await page.getByLabel('Product Name',{exact:true}).fill('New linen shirt');await page.getByLabel('Category',{exact:true}).fill('top');await page.getByLabel('Description',{exact:true}).fill('Everyday linen');await page.getByLabel('Price (VND)',{exact:true}).fill('250000');await page.getByRole('button',{name:'Add variant',exact:true}).click();await page.getByLabel('SKU',{exact:true}).fill('linen-m');await page.getByLabel('Color',{exact:true}).fill('Ivory');await page.getByLabel('Size',{exact:true}).fill('M');await page.getByLabel('Stock',{exact:true}).fill('10');
  const pending=page.waitForRequest(r => r.url().endsWith('/shop-products') && r.method()==='POST');await page.getByRole('button',{name:'Save product',exact:true}).click();const payload=(await pending).postDataJSON();expect(payload.variants[0].sku).toBe('LINEN-M');expect(payload.variants[0].stockQuantity).toBe(10);expect(payload.price).toBe(250000);
  await expect(page.getByText('Edit product',{exact:true}).filter({visible:true})).toBeVisible();await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.getByRole('button',{name:'Restore to draft',exact:true})).toBeVisible();await page.getByRole('button',{name:'Restore to draft',exact:true}).click();await expect(page.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
});

test('dashboard displays backend metrics and privacy-gated audience state',async ({page}) => {
  await ownerLogin(page);
  await page.route('**/api/shops/me/dashboard?**',route => route.fulfill({json:{dashboard:{summary:{totalOrders:7,collectedRevenue:1750000},inventoryHealth:{total:4,published:3,draft:1,outOfStock:0,needsEmbedding:0}}}}));
  await page.route('**/api/shops/me/analytics?**',route => route.fulfill({json:{analytics:{summary:{productViews:100,tryOnClicks:20,stylistMatches:10,feedbackCount:5,conversionRate:0.2,publishedProducts:3},timeSeries:[]}}}));
  await page.route('**/api/shops/me/insights?**',route => route.fulfill({json:{insights:{enoughData:false,message:'Not enough data yet.',eventCount:3,userCount:2}}}));
  await page.getByRole('button',{name:'Dashboard & analytics',exact:true}).click();await expect(page.getByText('Collected revenue',{exact:true})).toBeVisible();await expect(page.getByText('20.0%',{exact:true})).toBeVisible();
  const request=page.waitForRequest(r => r.url().includes('/shops/me/insights'));await page.getByRole('button',{name:'Audience insights',exact:true}).click();await request;await expect(page.getByText('Not enough data yet.',{exact:true})).toBeVisible();
});

test('iPad collection adapts to four columns without horizontal overflow',async ({page}) => {
  await page.setViewportSize({width:1180,height:820});await entry(page);
  await page.route('**/api/catalog/products?**',route=>route.fulfill({json:{products:Array.from({length:8},(_,i)=>({...product,id:`p${i}`,name:`Linen piece ${i}`})),pagination:{page:1,totalPages:1,total:8,limit:12}}}));
  await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  const first=page.getByRole('button',{name:'Linen piece 0',exact:true});await expect(first).toBeVisible();
  const boxes=await Promise.all([0,1,2,3].map(i=>page.getByRole('button',{name:`Linen piece ${i}`,exact:true}).boundingBox()));
  expect(boxes.every(b=>b && Math.abs(b.y-boxes[0]!.y)<2)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/boutiques-ipad.png',fullPage:true});
});
test('shop access screen cannot create external digital payments',async ({page}) => {
  const requests:string[]=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));
  await ownerLogin(page);await page.getByRole('button',{name:'Shop access',exact:true}).click();
  await expect(page.getByText('Your boutique workspace',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Pay with|Choose plan/})).toHaveCount(0);
  const refresh=page.waitForRequest(r=>r.url().endsWith('/payments/me'));
  await page.getByRole('button',{name:'Refresh access',exact:true}).click();
  expect((await refresh).headers().authorization).toBe('Bearer test-owner-token');
  expect(requests.some(p=>p.endsWith('/payments/create'))).toBe(false);
});

test('owner work queue uses real order stages and unread counts',async ({page}) => {
  await ownerLogin(page);
  await page.route('**/api/shop-orders',route=>route.fulfill({json:{orders:[{id:'o1',orderStatus:'pending_confirmation'},{id:'o2',orderStatus:'preparing'},{id:'o3',orderStatus:'delivered'}]}}));
  await page.route('**/api/shop-chat/conversations',route=>route.fulfill({json:{conversations:[],totalUnread:3}}));
  await page.getByRole('button',{name:'Products',exact:true}).click();
  await page.getByRole('button',{name:'Overview',exact:true}).click();
  await expect(page.getByRole('button',{name:'Awaiting confirmation: 1',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'To prepare or ship: 1',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Unread messages: 3',exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/boutique-workspace.png',fullPage:true});
});

test('privacy and support are accessible before signing in',async ({page}) => {
  await mockApi(page);await page.goto('/terms');
  await expect(page.getByText('Your shopping, your choices',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Contact Miroir support',exact:true}).click();
  await expect(page.getByText('miroirofficial20@gmail.com',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Email Miroir support',exact:true})).toBeVisible();
});

test('pending owner registration explains approval instead of failing sign-in',async ({page}) => {
  await entry(page);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
  await page.getByRole('tab',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Shop owner center',exact:true}).click();
  await page.route('**/api/shop-auth/register',route=>route.fulfill({json:{success:true,owner:{id:'pending1',name:'New Owner',email:'new@example.test',status:'pending'},message:'Registration received and awaiting approval.'}}));
  await page.getByRole('button',{name:'Register owner',exact:true}).click();
  await page.getByLabel('Shop Owner Name',{exact:true}).fill('New Owner');await page.getByLabel('Email Address',{exact:true}).fill('new@example.test');await page.getByLabel('Password',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Create owner account',exact:true}).click();
  await expect(page.getByText('Registration received and awaiting approval.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sign in as owner',exact:true})).toBeVisible();
});

test('owner can delete a pending or active account without affecting customer mode',async ({page}) => {
  await mockApi(page);await page.goto('/delete-owner-account');let attempts=0;
  await page.route('**/api/shop-auth/account',async route=>{
    attempts+=1;const body=route.request().postDataJSON();
    expect(route.request().headers().authorization).toBeUndefined();
    expect(body.confirmation).toBe('DELETE');
    if(body.password==='wrong') return route.fulfill({status:401,json:{message:'Invalid email or password.'}});
    return route.fulfill({json:{success:true,message:'Owner account deleted and boutique closed.'}});
  });
  await page.getByLabel('Owner account email',{exact:true}).fill('owner@example.test');await page.getByLabel('Current owner password',{exact:true}).fill('wrong');await page.getByLabel('Type DELETE to confirm',{exact:true}).fill('DELETE');
  await page.getByRole('button',{name:'Permanently delete owner account',exact:true}).click();await expect(page.getByText('Invalid email or password.',{exact:true})).toBeVisible();
  await page.getByLabel('Current owner password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Permanently delete owner account',exact:true}).click();
  await expect(page.getByText('Shop owner account deleted',{exact:true})).toBeVisible();expect(attempts).toBe(2);
  await page.getByRole('button',{name:'Back to shopping',exact:true}).click();await expect(page.getByRole('tab',{name:'Discover',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Linen shirt',exact:true})).toBeVisible();
});
