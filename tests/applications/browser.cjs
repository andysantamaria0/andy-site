const {chromium,expect}=require('@playwright/test');
const fs=require('fs'),crypto=require('crypto');
const base=process.env.DESK_TEST_URL||'http://127.0.0.1:3240';
const config=JSON.parse(fs.readFileSync(process.env.DESK_TEST_CONFIG||'/private/tmp/application-desk-secrets/config.json','utf8'));
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['state','resume','worker']){const r=await ctx.request.get(base+'/api/applications/'+path);if(r.status()!==401)throw Error('Unauthenticated '+path+' access');}
 const publicPage=await ctx.request.get(base+'/applications');const html=await publicPage.text();if(html.includes('andyjsantamaria@gmail.com')||html.includes('Vialoure, a multi-channel'))throw Error('Private content leaked before login');
 if(!publicPage.headers()['x-robots-tag']?.includes('noindex'))throw Error('Missing noindex');
 await page.goto(base+'/applications');await page.locator('#password').fill(config.password);await page.getByRole('button',{name:'Sign in →'}).click();await expect(page.getByRole('heading',{name:'Review. Approve. Move forward.'})).toBeVisible({timeout:30000});
 await page.getByRole('heading',{name:'Model Behavior, Product',exact:true,level:2}).waitFor();
 const response=await ctx.request.get(base+'/api/applications/resume');if(!response.ok())throw Error('Private PDF unavailable');const digest=b=>crypto.createHash('sha256').update(b).digest('hex');if(digest(await response.body())!==digest(fs.readFileSync('/Users/andrewsantamaria/Downloads/CV_A_Santamaria_A.pdf')))throw Error('Original PDF differs');
 const denied=await ctx.request.post(base+'/api/applications/state',{headers:{Origin:'https://attacker.example'},data:{action:'pause',paused:true}});if(denied.status()!==403)throw Error('Cross-origin mutation accepted');
 await page.getByRole('button',{name:'Review complete application →'}).click();await expect(page.getByText('Complete these before approval')).toBeVisible();await expect(page.getByRole('button',{name:'Approve & submit',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Close review'}).click();
 await page.screenshot({path:'/private/tmp/application-desk-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Your profile',exact:true}).click();await page.getByRole('button',{name:'Save profile',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Saved.');await page.reload();await page.getByRole('button',{name:'Your profile',exact:true}).click();await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Andrew Santamaria');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/application-desk-mobile.png',fullPage:true});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('#password')).toBeVisible();if((await ctx.request.get(base+'/api/applications/state')).status()!==401)throw Error('Logout failed');if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: protected page/API/PDF; original CV bytes; CSRF rejection; incomplete application cannot approve; database save/reload; mobile layout; logout.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
