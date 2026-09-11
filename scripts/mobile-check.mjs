import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

await fs.mkdir('.impeccable/review', { recursive: true });
const base = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
try {
  for (const size of [
    { name: 'small-phone', width: 320, height: 568 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'large-phone', width: 430, height: 932 },
    { name: 'landscape', width: 844, height: 390 },
    { name: 'touch-tablet', width: 820, height: 1180 },
  ]) {
    const context = await browser.newContext({ viewport: size, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('.vader-portrait[data-ready=true]').waitFor();
    await page.locator('.globe-canvas[data-target=marrakech]').waitFor({ state: 'attached', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('.map-experience').getAttribute('data-paused'), 'false');
    assert.equal(await page.locator('.globe-canvas').getAttribute('data-orbiting'), 'true');
    assert.equal(await page.locator('.imperial-cursor').getAttribute('data-visible'), 'false');
    const actions = page.locator('.sidebar nav a,.contact-buttons a,.socials a,.motion-control,.entry-map-links button,.email-line button,.map-peek button');
    for (const action of await actions.all()) assert((await action.boundingBox()).height >= 44, `Tap target: ${await action.textContent()}`);
    if (size.width <= 640) {
      assert(Number.parseFloat(await page.locator('.intro').evaluate(e => getComputedStyle(e).fontSize)) >= 14);
      const face = await page.locator('.vader-portrait').boundingBox();
      const contact = await page.getByRole('link', { name: 'Email', exact: true }).boundingBox();
      assert(contact.x + contact.width <= face.x, 'Vader does not cover Email');
      if (size.name === 'phone') assert((await page.locator('#about').boundingBox()).y < 680, 'Introduction starts earlier on phones');
    }
    await page.screenshot({ path: `.impeccable/review/mobile-${size.name}.png`, scale: 'css' });
    await page.locator('.project > summary').first().tap();
    assert.equal(await page.locator('.project').first().getAttribute('open'), '');
    await page.getByRole('button', { name: 'View location', exact: true }).tap();
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.locator('.globe-canvas[data-target=monstergarage]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('.portfolio').getAttribute('inert'), null);
    assert.equal(await page.getByRole('button', { name: 'View location', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Explore the map', exact: true }).tap();
    await page.getByRole('dialog').waitFor();
    const nav = page.getByRole('navigation', { name: 'Map locations' });
    await page.waitForFunction(() => {
      const nav = document.querySelector('.places-panel nav').getBoundingClientRect();
      const active = document.querySelector('.places-panel [aria-pressed=true]').getBoundingClientRect();
      return active.left >= nav.left && active.right <= nav.right + 1;
    });
    const selected = nav.locator('[aria-pressed=true]');
    const navBox = await nav.boundingBox(), selectedBox = await selected.boundingBox();
    assert(selectedBox.x >= navBox.x && selectedBox.x + selectedBox.width <= navBox.x + navBox.width + 1, 'Selected destination is scrolled into view');
    for (const control of await page.locator('.map-topbar button,.map-tools button,.map-tools select,.places-panel nav button,.place-links a').all()) {
      assert((await control.boundingBox()).height >= 44, `Map tap target: ${await control.textContent()}`);
    }
    const tools = await page.locator('.map-tools').boundingBox(), detail = await page.locator('.place-detail').boundingBox();
    assert(detail.height >= 140, 'Location details remain scrollable in short viewports');
    assert(detail.y + detail.height <= size.height, 'Details fit the viewport');
    assert(tools.y + tools.height <= detail.y || tools.x + tools.width <= detail.x, 'Map controls and details do not overlap');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByLabel('Atmosphere').selectOption('rain');
    await page.screenshot({ path: `.impeccable/review/mobile-map-${size.name}.png`, scale: 'css' });
    await page.getByRole('link', { name: 'Open in Google Maps' }).scrollIntoViewIfNeeded();
    assert.match(await page.getByRole('link', { name: 'Open in Google Maps' }).getAttribute('href'), /31\.6669637/);
    await page.getByRole('button', { name: /Back to portfolio/ }).tap();
    assert.equal(await page.getByRole('dialog').count(), 0);
    if (size.name === 'phone') {
      await page.getByRole('button', { name: 'Pause background animation' }).tap();
      assert.equal(await page.locator('.globe-canvas').getAttribute('data-orbiting'), 'false');
      await page.getByRole('button', { name: 'Play background animation' }).tap();
      await page.waitForFunction(() => document.querySelector('.vader-portrait').dataset.running === 'true');
      assert.equal(await page.locator('.globe-canvas').getAttribute('data-orbiting'), 'true');
      const frames = await page.locator('.vader-portrait').evaluate(element => new Promise(resolve => {
        let count = 0;
        const observer = new MutationObserver(records => count += records.filter(record => record.attributeName === 'data-time').length);
        observer.observe(element, { attributes: true });
        setTimeout(() => { observer.disconnect(); resolve(count); }, 1000);
      }));
      assert(frames > 0 && frames <= 32, `Touch portrait frame cap: ${frames}`);
      await page.getByRole('button', { name: 'Pause background animation' }).tap();
      assert.equal(await page.locator('.globe-canvas').getAttribute('data-orbiting'), 'false');
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`${size.name}: ambient default, background location selection, touch controls, motion limits and no overflow passed`);
  }
} finally { await browser.close(); }
