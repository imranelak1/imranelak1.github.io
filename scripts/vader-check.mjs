import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:5173/';
await fs.mkdir('.impeccable/review', {recursive:true});
const browser=await chromium.launch({channel:'msedge',args:['--enable-unsafe-swiftshader']});
try {
 for (const size of [{name:'desktop',width:1440,height:1000},{name:'tablet',width:820,height:1180},{name:'mobile',width:390,height:844}]) {
  const context=await browser.newContext({viewport:size,reducedMotion:'reduce',hasTouch:size.name==='mobile',isMobile:size.name==='mobile'});
  const page=await context.newPage(), errors=[], requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(base);await page.locator('.vader-portrait[data-ready=true]').waitFor();await page.evaluate(()=>document.fonts.ready);
  const portrait=page.locator('.vader-portrait');
  assert.equal(await page.getByRole('heading',{name:'Imrane Lakniti',level:1}).isVisible(),true);
  assert.equal(await page.locator('.trooper-patrol,.lightsaber-cursor,.scene-switch,.asset-explorer,.flight-status').count(),0);
  assert(!requests.some(url=>/models\/blendswap|star-destroyer|models\/patrol.glb|vader-lightsaber/.test(url)));
  assert(requests.some(url=>url.includes('models/vader-helmet.glb')));
  assert(await page.evaluate(()=>document.fonts.check('41px "Star Jedi"')));
  assert.match(await page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily),/Star Jedi/);
  assert.doesNotMatch(await page.locator('#about > p').first().evaluate(e=>getComputedStyle(e).fontFamily),/Star Jedi/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(size.name!=='desktop') assert(await page.evaluate(()=>document.querySelector('main').getBoundingClientRect().top>=document.querySelector('.sidebar').getBoundingClientRect().bottom), 'Stacked profile never overlaps the introduction');
  assert.equal(await portrait.locator('canvas').count(),1);
  assert.equal(await portrait.getAttribute('data-running'),'false');
  const frozen=await portrait.getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await portrait.getAttribute('data-time'),frozen);
  const cursor=page.locator('.imperial-cursor');
  await page.mouse.move(305,220);
  if(size.name==='mobile') {
   assert.equal(await cursor.getAttribute('data-visible'),'false');
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('imperial-cursor-active')),false);
  } else {
   assert.equal(await cursor.getAttribute('data-visible'),'true');
   assert.equal(await cursor.evaluate(e=>getComputedStyle(e).transform),'matrix(1, 0, 0, 1, 287, 202)');
   assert.equal(await cursor.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
   await page.mouse.down();assert.equal(await cursor.getAttribute('data-pressed'),'true');await page.mouse.up();assert.equal(await cursor.getAttribute('data-pressed'),'false');
   assert.equal(await cursor.getAttribute('data-interactive'),'false');
   assert.equal(await cursor.locator('.imperial-cursor__lock').evaluate(e=>getComputedStyle(e).opacity),'0');
   await page.getByRole('link',{name:'Email',exact:true}).hover();assert.equal(await cursor.getAttribute('data-interactive'),'true');
   assert.equal(await cursor.locator('.imperial-cursor__lock').evaluate(e=>getComputedStyle(e).opacity),'1');
   assert.equal(await cursor.locator('.imperial-cursor__station').evaluate(e=>getComputedStyle(e).opacity),'0');
   const hoverTransform=await cursor.locator('.imperial-cursor__brackets').evaluate(e=>getComputedStyle(e).transform);
   await page.mouse.down();assert.equal(await cursor.getAttribute('data-pressed'),'true');
   assert.notEqual(await cursor.locator('.imperial-cursor__brackets').evaluate(e=>getComputedStyle(e).transform),hoverTransform);
   await page.mouse.move(305,220);await page.mouse.up();assert.equal(await cursor.getAttribute('data-interactive'),'false');
   await page.locator('.cv-pending').hover();assert.equal(await cursor.getAttribute('data-interactive'),'false','Pending CV is not an action');
   await page.locator('.sidebar nav a').first().hover();assert.equal(await cursor.getAttribute('data-interactive'),'true');
   await page.locator('.project > summary').first().hover();assert.equal(await cursor.getAttribute('data-interactive'),'true');
   await page.mouse.down();await page.mouse.up();assert.equal(await page.locator('.project').first().getAttribute('open'),'');
   await page.locator('.project-links button').first().hover();assert.equal(await cursor.getAttribute('data-interactive'),'true','Location buttons show target lock');
   if(size.name==='desktop') await page.screenshot({path:'.impeccable/review/imperial-cursor-action.png'});
   await page.locator('.project > summary').first().click();
   await page.evaluate(()=>{const button=document.createElement('button');button.id='cursor-disabled-check';button.disabled=true;button.textContent='Disabled';button.style='position:fixed;top:10px;left:10px;width:100px;height:30px;z-index:20000';document.body.append(button)});
   await page.locator('#cursor-disabled-check').hover();assert.equal(await cursor.getAttribute('data-interactive'),'false');
   await page.locator('#cursor-disabled-check').evaluate(e=>e.remove());
   if(size.name==='desktop') {
    const summary=await page.locator('.project > summary').first().boundingBox();
    await page.mouse.move(summary.x+30,summary.y+15);assert.equal(await cursor.getAttribute('data-interactive'),'true');
    const prose=await page.locator('#experience .entry p').first().boundingBox();
    await page.evaluate(delta=>scrollBy(0,delta),prose.y+5-(summary.y+15));
    await page.waitForFunction(()=>document.querySelector('.imperial-cursor').dataset.interactive==='false');
    await page.evaluate(()=>scrollTo(0,0));
   }
   await page.keyboard.press('Tab');assert.equal(await cursor.getAttribute('data-visible'),'false');
   await page.evaluate(()=>{const input=document.createElement('input');input.id='cursor-input-check';input.style='position:fixed;top:10px;left:10px;width:100px;height:30px;z-index:20000';document.body.append(input)});
   await page.locator('#cursor-input-check').hover();assert.equal(await cursor.getAttribute('data-visible'),'false');
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('imperial-cursor-active')),false);
   await page.locator('#cursor-input-check').evaluate(e=>e.remove());
   await page.evaluate(()=>scrollTo(0,0));
  }
  await page.screenshot({path:`.impeccable/review/imperial-cursor-${size.name}.png`,fullPage:true});
  await page.screenshot({path:`.impeccable/review/imperial-cursor-${size.name}-viewport.png`});
  if(size.name==='desktop') {
   await page.getByRole('button',{name:'Play background animation'}).click();
   await page.waitForFunction(()=>Number(document.querySelector('.vader-portrait').dataset.time)>.2);
   await page.mouse.move(1140,220);
   await page.waitForFunction(()=>Number(document.querySelector('.vader-portrait').dataset.yaw)>.4&&Number(document.querySelector('.vader-portrait').dataset.pitch)<-.2);
   assert.equal(await portrait.getAttribute('data-tracking'),'pointer','Tracks outside the portrait');
   await page.screenshot({path:'.impeccable/review/imperial-cursor-follow-right.png'});
   await cursor.screenshot({path:'.impeccable/review/imperial-cursor-detail.png'});
   await page.mouse.move(30,950);
   await page.waitForFunction(()=>Number(document.querySelector('.vader-portrait').dataset.yaw)<-.3&&Number(document.querySelector('.vader-portrait').dataset.pitch)>.18);
   await page.screenshot({path:'.impeccable/review/imperial-cursor-follow-left.png'});
   await page.getByRole('button',{name:'Pause background animation'}).click();
   const time=await portrait.getAttribute('data-time'),yaw=await portrait.getAttribute('data-yaw');await page.mouse.move(1200,160);await page.waitForTimeout(150);assert.equal(await portrait.getAttribute('data-time'),time);assert.equal(await portrait.getAttribute('data-yaw'),yaw,'Pause freezes pointer tracking');
   await page.getByRole('button',{name:'Play background animation'}).click();
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   assert.equal(await portrait.getAttribute('data-running'),'false');
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
   await page.getByRole('button',{name:'Explore the map',exact:true}).click();assert.equal(await portrait.getAttribute('data-running'),'false');assert.equal(await cursor.getAttribute('data-visible'),'false');assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('imperial-cursor-active')),false);await page.keyboard.press('Escape');
   await page.mouse.move(1200,220);assert.equal(await cursor.getAttribute('data-visible'),'true');
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await cursor.getAttribute('data-visible'),'false');assert.equal(await portrait.getAttribute('data-tracking'),'idle');
   await portrait.locator('canvas').dispatchEvent('webglcontextlost');assert.equal(await portrait.getAttribute('data-ready'),'failed');
   assert(await page.locator('#about > p').first().isVisible());
  }
  if(size.name==='mobile') {
   await page.getByRole('button',{name:'Play background animation'}).click();await portrait.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('.vader-portrait').dataset.running==='true');
   await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
   await page.waitForFunction(()=>document.querySelector('.vader-portrait').dataset.running==='false');
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`${size.name}: helmet, font, Death Star cursor, page-wide gaze, native fallbacks and motion passed`);
 }
 const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();
 await page.route('**/models/vader-helmet.glb',route=>route.abort());await page.goto(base);await page.locator('.vader-portrait[data-ready=failed]').waitFor({state:'attached'});
 assert(await page.getByRole('heading',{name:'Imrane Lakniti',level:1}).isVisible());await page.locator('.project > summary').first().click();assert.equal(await page.locator('.project').first().getAttribute('open'),'');
 await context.close();console.log('Missing helmet: text, font and project controls remain usable');
 await fs.writeFile('.impeccable/review/imperial-cursor-checks.txt','Desktop, tablet, mobile, font loading, original helmet, precise reticle, hover/press, page-wide gaze in both directions, editable-field/keyboard/touch/map fallbacks, pause/reduced motion, hidden/offscreen and model/context failure passed.\n');
} finally {await browser.close();}
