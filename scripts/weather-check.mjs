import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
await fs.mkdir('.impeccable/review', {recursive:true});
const browser = await chromium.launch({channel:'msedge',args:['--enable-unsafe-swiftshader']});
const base = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:5173/';
try {
  await Promise.all([{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}].map(async size => {
    const context = await browser.newContext({viewport:size, reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    const requests=[];
    await page.route('https://api.open-meteo.com/**', async route => {
      const url=new URL(route.request().url()); requests.push(url);
      const time=Math.floor(Date.now()/1000);
      const isCentre=Number(url.searchParams.get('latitude'))>31.65;
      await route.fulfill({json:{current:{time,temperature_2m:23,weather_code:isCentre?61:0,cloud_cover:isCentre?85:0,is_day:1},daily:{sunrise:[time-7200],sunset:[time+7200]}}});
    });
    await page.goto(base);
    await page.waitForSelector('.globe-canvas[data-ready="true"]',{state:'attached',timeout:60000});
    await page.waitForSelector('.map-experience[data-phase="day"][data-weather="clear"]',{state:'attached'});
    await page.waitForTimeout(1600);
    await page.screenshot({path:`.impeccable/review/weather-${size.name}-portfolio.png`,fullPage:true});
    await page.getByRole('button',{name:'Centre campus',exact:true}).click();
    await page.waitForSelector('.map-experience[data-weather="rain"]',{state:'attached'});
    assert.match(await page.locator('.place-weather').innerText(),/23°C · Rain/);
    assert(requests.some(url=>url.searchParams.get('latitude')==='31.653786654689917'));
    assert.equal(await page.getByRole('button',{name:'Satellite',exact:true}).getAttribute('aria-pressed'),'true');
    for (const mode of ['day','sunset','night','rain']) {
      await page.getByRole('combobox',{name:'Atmosphere'}).selectOption(mode);
      assert.equal(await page.locator('.map-experience').getAttribute('data-phase'),mode==='rain'?'day':mode);
      await page.waitForTimeout(250);
      await page.screenshot({path:`.impeccable/review/weather-${size.name}-${mode}.png`});
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.locator('.weather-precipitation').evaluate(e=>getComputedStyle(e).animationName),'none');
    await page.getByRole('combobox',{name:'Atmosphere'}).selectOption('auto');
    assert.match(await page.locator('.place-weather').innerText(),/23°C · Rain/);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==='Centre campus');
    assert.equal(await page.getByRole('button',{name:'Centre campus',exact:true}).evaluate(e=>e===document.activeElement),true);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`${size.name}: color default, location weather, atmosphere previews, reduced motion, layout and focus passed`);
  }));
  const context=await browser.newContext({reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.route('https://api.open-meteo.com/**',route=>route.abort());
  await page.goto(base);
  await page.getByRole('button',{name:'Explore the map'}).click();
  await page.getByText('Weather unavailable · estimated daylight',{exact:false}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Open in Google Maps'}).isVisible(),true);
  await context.close();
  console.log('Offline weather: honest time-only fallback and location links passed');
  const liveContext = await browser.newContext({reducedMotion:'reduce'});
  const livePage = await liveContext.newPage();
  let scenario='night';
  await livePage.route('https://api.open-meteo.com/**', async route => {
    const time=Math.floor(Date.now()/1000);
    await route.fulfill({json:{current:{time,temperature_2m:19,weather_code:45,cloud_cover:90,is_day:0},daily:{sunrise:[time-40000],sunset:[scenario==='sunset'?time-600:time-7200]}}});
  });
  for (scenario of ['night','sunset']) {
    await livePage.goto(base);
    await livePage.waitForSelector(`.map-experience[data-phase="${scenario}"][data-weather="fog"]`,{state:'attached'});
  }
  await liveContext.close();
  console.log('Automatic local sunset/night and fog follow API data');
} finally { await browser.close(); }
