import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });

async function mapSize(page, exploring) {
  await page.waitForFunction(exploring => {
    const globe = document.querySelector('.globe-canvas');
    const canvas = globe?.querySelector('.cesium-widget canvas');
    if (!canvas || !['standard', 'low'].includes(globe.dataset.quality)) return false;
    const low = globe.dataset.quality === 'low';
    const scale = exploring ? (low ? .8 : 1) : (low ? .55 : .75);
    const rect = canvas.getBoundingClientRect();
    return Math.abs(canvas.width - rect.width * scale) <= 1 && Math.abs(canvas.height - rect.height * scale) <= 1;
  }, exploring);
  return page.locator('.globe-canvas').evaluate(globe => {
    const canvas = globe.querySelector('.cesium-widget canvas');
    return { quality: globe.dataset.quality, width: canvas.width, height: canvas.height };
  });
}

async function checkAdaptiveFallback(context, startExploring = false) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.globe-canvas[data-target="marrakech"]').waitFor({ state: 'attached', timeout: 60000 });
  await page.locator('.vader-portrait[data-running="true"]').waitFor();
  assert.equal(await page.locator('.globe-canvas').getAttribute('data-quality'), 'standard');
  if (startExploring) {
    await page.getByRole('button', { name: 'Explore the map', exact: true }).click();
    assert.equal((await mapSize(page, true)).quality, 'standard');
  }
  // Delay real animation callbacks to simulate a struggling graphics device.
  // Keep cancellable handles so the application's pause/cleanup behavior is real.
  await page.evaluate(() => {
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);
    const pending = new Map();
    let nextHandle = -1;
    window.requestAnimationFrame = callback => {
      const handle = nextHandle--;
      const task = { frame: 0, timer: 0 };
      pending.set(handle, task);
      task.frame = requestFrame(() => {
        task.timer = window.setTimeout(() => {
          pending.delete(handle);
          callback(performance.now());
        }, 150);
      });
      return handle;
    };
    window.cancelAnimationFrame = handle => {
      const task = pending.get(handle);
      if (!task) { cancelFrame(handle); return; }
      cancelFrame(task.frame);
      clearTimeout(task.timer);
      pending.delete(handle);
    };
  });
  await page.waitForFunction(startExploring =>
    document.querySelector('.globe-canvas')?.dataset.quality === 'low'
      && document.querySelector('.map-experience')?.dataset.paused === String(!startExploring)
      && document.querySelector('.vader-portrait')?.dataset.running === 'false',
  startExploring, { timeout: 18000 });
  assert.equal(await page.locator('.globe-canvas').getAttribute('data-orbiting'), 'false');
  if (startExploring) {
    assert(await page.getByRole('dialog').isVisible(), 'A slowdown keeps map exploration open');
    assert(await page.getByRole('button', { name: 'Pause map animation', exact: true }).isVisible(), 'Exploration keeps the motion preference on until exit');
  } else {
    await page.getByRole('button', { name: 'Play background animation', exact: true }).waitFor();
    await mapSize(page, false);
    await page.getByRole('button', { name: 'Explore the map', exact: true }).click();
  }
  const exploration = await mapSize(page, true);
  assert.equal(exploration.quality, 'low');
  assert(await page.getByRole('link', { name: 'Open in Google Maps', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() =>
    document.querySelector('.map-experience')?.dataset.paused === 'true'
      && document.querySelector('.globe-canvas')?.dataset.orbiting === 'false'
      && document.querySelector('.vader-portrait')?.dataset.running === 'false');
  await mapSize(page, false);
  await page.getByRole('button', { name: 'Play background animation', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.vader-portrait')?.dataset.running === 'true' && document.querySelector('.globe-canvas')?.dataset.orbiting === 'true');
  await page.waitForTimeout(4000);
  assert.equal(await page.locator('.map-experience').getAttribute('data-paused'), 'false', 'Automatic fallback respects a manual motion restart');
  assert.equal(await page.locator('.globe-canvas').getAttribute('data-orbiting'), 'true');
  assert.deepEqual(errors, []);
  await page.close();
  console.log(`Slow graphics first detected in ${startExploring ? 'exploration' : 'background'}: lower quality and ambient motion pause; map exploration and manual restart remain usable`);
}

try {
  for (const profile of [
    { name: 'standard desktop', cores: 8, memory: 8, quality: 'standard', portraitRatio: 1.5 },
    { name: 'low-end desktop', cores: 4, memory: 4, quality: 'low', portraitRatio: 1 },
  ]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
    try {
      await context.addInitScript(({ cores, memory }) => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: cores });
        Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: memory });
      }, profile);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const globe = page.locator('.globe-canvas');
      await page.waitForFunction(() => ['standard', 'low'].includes(document.querySelector('.globe-canvas')?.dataset.quality));
      assert.equal(await globe.getAttribute('data-quality'), profile.quality, 'Initial quality follows reported hardware');
      await page.locator('.globe-canvas[data-target="marrakech"]').waitFor({ state: 'attached', timeout: 60000 });
      const portrait = page.locator('.vader-portrait');
      await page.locator('.vader-portrait[data-ready="true"][data-running="true"]').waitFor();
      const background = await mapSize(page, false);
      assert.equal(background.quality, profile.quality);
      assert.equal(await globe.getAttribute('data-orbiting'), 'true');

      const portraitSize = await portrait.locator('canvas').evaluate(canvas => {
        const rect = canvas.getBoundingClientRect();
        return { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height };
      });
      assert(Math.abs(portraitSize.width - portraitSize.cssWidth * profile.portraitRatio) <= 1, 'Portrait width respects the device pixel budget');
      assert(Math.abs(portraitSize.height - portraitSize.cssHeight * profile.portraitRatio) <= 1, 'Portrait height respects the device pixel budget');
      const animation = await portrait.evaluate(element => new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        const observer = new MutationObserver(records => frames += records.filter(record => record.attributeName === 'data-time').length);
        observer.observe(element, { attributes: true, attributeFilter: ['data-time'] });
        setTimeout(() => {
          observer.disconnect();
          resolve({ frames, seconds: (performance.now() - start) / 1000 });
        }, 1200);
      }));
      const fps = animation.frames / animation.seconds;
      assert(animation.frames > 0 && fps <= 32, `Desktop portrait frame cap: ${fps.toFixed(1)} fps`);

      await page.getByRole('button', { name: 'Pause background animation', exact: true }).click();
      assert.equal(await portrait.getAttribute('data-running'), 'false');
      assert.equal(await globe.getAttribute('data-orbiting'), 'false');
      const frozen = await portrait.getAttribute('data-time');
      await page.waitForTimeout(200);
      assert.equal(await portrait.getAttribute('data-time'), frozen, 'Pause freezes portrait animation');

      await page.getByRole('button', { name: 'Explore the map', exact: true }).click();
      const exploration = await mapSize(page, true);
      assert.equal(exploration.quality, profile.quality);
      assert(exploration.width > background.width && exploration.height > background.height, 'Exploration receives more pixels than the ambient map');
      assert.equal(await portrait.getAttribute('data-running'), 'false');
      await page.keyboard.press('Escape');
      await mapSize(page, false);
      await page.getByRole('button', { name: 'Play background animation', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.vader-portrait')?.dataset.running === 'true' && document.querySelector('.globe-canvas')?.dataset.orbiting === 'true');

      const cv = page.getByRole('link', { name: 'Download CV (PDF)', exact: true });
      assert.equal(await cv.getAttribute('download'), 'Imrane_Lakniti_CV_EN.pdf');
      const response = await context.request.get(new URL(await cv.getAttribute('href'), base).href);
      assert.equal(response.status(), 200, 'CV download responds successfully');
      assert.match(response.headers()['content-type'] || '', /application\/pdf/i);
      assert.equal((await response.body()).subarray(0, 5).toString(), '%PDF-', 'Download serves a PDF, not an HTML fallback');
      assert.deepEqual(errors, []);
      console.log(`${profile.name}: ${fps.toFixed(1)} portrait fps, background ${background.width}x${background.height} (${background.quality}), exploration ${exploration.width}x${exploration.height}; pixel budgets, motion controls and CV passed`);
      await page.close();
      if (profile.quality === 'standard') {
        await checkAdaptiveFallback(context);
        await checkAdaptiveFallback(context, true);
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
