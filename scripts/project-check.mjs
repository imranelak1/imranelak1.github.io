import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:5173/';
const output = '.impeccable/review/project-visuals';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
  args: ['--enable-unsafe-swiftshader'],
});
const results = [];

try {
  for (const size of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      reducedMotion: 'reduce',
      ...(size.name === 'mobile' ? { isMobile: true, hasTouch: true } : {}),
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.project-case').count(), 6);
    assert.equal(await page.locator('.project-visual').count(), 4);
    assert.equal(await page.locator('.project-source-links a').count(), 4);

    for (const preview of await page.locator('.project-image-button').all()) {
      await preview.scrollIntoViewIfNeeded();
      await preview.locator('img').evaluate(image => image.decode());
      assert(await preview.locator('img').evaluate(image => image.naturalWidth > 0));
      assert(await preview.getAttribute('aria-label'));
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    const monster = page.getByRole('article', { name: 'MonsterGarage' });
    await monster.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await monster.locator('details').getAttribute('open'), '');
    await monster.getByRole('button', { name: 'View location', exact: true }).click();
    assert.equal(await monster.getByRole('button', { name: 'View location', exact: true }).getAttribute('aria-pressed'), 'true');
    await monster.locator('summary').click();

    const git = page.getByRole('article', { name: 'GitSomething' });
    await git.getByRole('button', { name: 'Branch history', exact: true }).click();
    await git.locator('.project-visual img').evaluate(image => image.decode());
    assert.match(await git.locator('.project-visual img').getAttribute('src'), /git-history/);
    await git.getByRole('button', { name: 'Working directory', exact: true }).click();

    await page.locator('#projects').screenshot({ path: `${output}/${size.name}-projects.png` });
    await git.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${size.name}-work.png` });
    const enlarge = git.getByRole('button', { name: 'Enlarge GitSomething: Working directory', exact: true });
    await enlarge.focus();
    await page.keyboard.press('Enter');
    const viewer = page.getByRole('dialog', { name: 'GitSomething', exact: true });
    await viewer.waitFor();
    await viewer.locator('img').evaluate(image => image.decode());
    assert.equal(await page.locator('.map-experience').getAttribute('data-paused'), 'true');
    assert.equal(await viewer.getByRole('button', { name: 'Close project preview' }).evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('ArrowRight');
    assert.match(await viewer.locator('img').getAttribute('src'), /git-history/);
    await page.keyboard.press('ArrowLeft');
    assert.match(await viewer.locator('img').getAttribute('src'), /git-working-tree/);
    await viewer.getByRole('button', { name: 'Next screenshot' }).click();
    assert.match(await viewer.locator('img').getAttribute('src'), /git-history/);
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      assert(await viewer.evaluate(element => element.contains(document.activeElement)), 'Focus stays inside the modal');
    }
    await viewer.locator('img').evaluate(image => image.decode());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/${size.name}-viewer.png` });
    await page.keyboard.press('Escape');
    await viewer.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Enlarge GitSomething: Working directory');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');

    for (const name of ['Forge', 'FunClipper']) {
      const project = page.getByRole('article', { name, exact: true });
      const options = project.locator('.project-image-options button');
      for (const option of await options.all()) {
        await option.click();
        await project.locator('.project-visual img').evaluate(image => image.decode());
        assert.equal(await option.getAttribute('aria-pressed'), 'true');
      }
    }
    if (size.name === 'mobile') {
      for (const control of await page.locator('.project-image-options button,.project-source-links a').all()) {
        assert((await control.boundingBox()).height >= 44, 'Project controls have touch-sized targets');
      }
    }
    assert.deepEqual(errors, []);
    results.push({ viewport: size.name, projects: 6, galleries: 4, screenshots: 7, errors: 0, overflow: false, keyboardAndFocus: 'passed' });
    await context.close();
  }

  // The project section must remain usable without WebGL or a screenshot response.
  const fallback = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
  const page = await fallback.newPage();
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : getContext.call(this, type, ...args);
    };
  });
  await page.route('**/projects/git-working-tree*.webp', route => route.abort());
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  const git = page.getByRole('article', { name: 'GitSomething', exact: true });
  await git.scrollIntoViewIfNeeded();
  await git.getByText('Screenshot unavailable.', { exact: false }).waitFor();
  assert.equal(await git.getByRole('button', { name: /Enlarge GitSomething/ }).isDisabled(), true);
  assert.equal(await git.getByRole('link', { name: 'View repository' }).getAttribute('href'), 'https://github.com/imranelak1/GitSomething');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await git.getByRole('button', { name: 'Branch history', exact: true }).click();
  await git.locator('.project-visual img').evaluate(image => image.decode());
  assert.equal(await git.getByRole('button', { name: /Enlarge GitSomething/ }).isEnabled(), true);
  await page.screenshot({ path: `${output}/small-phone-fallback.png` });
  await fallback.close();
  results.push({ viewport: '320px / no WebGL', missingImageRecovery: 'passed', overflow: false });
  await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
