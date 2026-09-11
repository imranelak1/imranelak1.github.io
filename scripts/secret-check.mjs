import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

await fs.mkdir('.impeccable/review', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
const base = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:5173/';
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 320, height: 568 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile, reducedMotion: mobile ? 'reduce' : 'no-preference' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('.vader-portrait[data-ready=true]').waitFor();
    await page.locator('.globe-canvas[data-target=marrakech]').waitFor({ state: 'attached', timeout: 60000 });
    const dialog = page.locator('.secret-dialog');
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await page.getByText('ily noha', { exact: true }).count(), 0);
    if (!mobile) {
      await page.keyboard.type('1x8');
      assert.equal(await dialog.isVisible(), false);
      await page.evaluate(() => { const field = document.createElement('input'); field.id = 'ordinary-field'; field.style = 'position:fixed;top:10px;left:10px;z-index:20000'; document.body.append(field); field.focus(); });
      await page.keyboard.type('18');
      assert.equal(await dialog.isVisible(), false, 'Normal typing never opens the Easter egg');
      await page.locator('#ordinary-field').evaluate(element => element.remove());
      await page.keyboard.type('18');
      await page.getByRole('heading', { name: 'ily noha', exact: true }).waitFor();
      assert.equal(await page.locator('.map-experience').getAttribute('data-paused'), 'true');
      assert.equal(await page.locator('.vader-portrait').getAttribute('data-running'), 'false');
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('imperial-cursor-active')), false);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.portfolio').evaluate(element => element.contains(document.activeElement)), false, 'Native modal prevents focus entering the portfolio');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('.map-experience').dataset.paused === 'false');
      assert.equal(await page.locator('.map-experience').getAttribute('data-paused'), 'false');
    }
    const trigger = page.getByRole('button', { name: 'Enter secret code', exact: true });
    if (mobile) await trigger.tap(); else await trigger.click();
    const code = page.getByRole('textbox', { name: 'Enter the code' });
    await code.waitFor();
    assert(await code.evaluate(element => element === document.activeElement));
    await code.fill('17'); await page.getByRole('button', { name: 'Open', exact: true }).click();
    assert.equal(await page.getByText('Try again.', { exact: true }).isVisible(), true);
    assert.equal(await page.getByText('ily noha', { exact: true }).count(), 0);
    await code.fill('18');
    await page.getByRole('heading', { name: 'ily noha', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const box = await dialog.boundingBox();
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= (mobile ? 320 : 1440));
    if (mobile) assert.equal(await page.locator('.secret-reveal').evaluate(element => getComputedStyle(element).animationName), 'none');
    await page.locator('.secret-reveal').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    await page.screenshot({ path: `.impeccable/review/secret-${mobile ? 'mobile' : 'desktop'}.png`, scale: 'css' });
    await page.getByRole('button', { name: 'Close secret' }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(element => element === document.activeElement));
    await trigger.click(); assert.equal(await code.inputValue(), '');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Explore the map', exact: true }).click();
    await page.keyboard.type('18'); assert.equal(await dialog.isVisible(), false, 'Map controls do not trigger the secret');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`${mobile ? 'mobile' : 'desktop'}: secret code, exact message, wrong code, focus, close/reopen, motion, native cursor and map isolation passed`);
  }
} finally { await browser.close(); }
