import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';

const PORT = 4179;
const BASE = `http://localhost:${PORT}`;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const check = (condition, label) => {
  results.push({ label, ok: Boolean(condition) });
  if (!condition) console.error(`  ✗ ${label}`);
  else console.log(`  ✓ ${label}`);
};

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch { /* not ready */ }
    await wait(500);
  }
  throw new Error('Preview server did not start');
}

async function clickText(page, text, last = false, exact = false) {
  const clicked = await page.evaluate(({ text, last, exact }) => {
    const buttons = [...document.querySelectorAll('button')].filter((button) => {
      const label = button.textContent.trim();
      return exact ? label === text : label.includes(text);
    });
    const target = last ? buttons.at(-1) : buttons[0];
    if (!target) return false;
    target.click();
    return true;
  }, { text, last, exact });
  if (!clicked) throw new Error(`Button not found: ${text}`);
  await wait(350);
}

async function hasText(page, text) {
  return page.evaluate((value) => document.body.innerText.toLowerCase().includes(value.toLowerCase()), text);
}

async function waitForText(page, text, timeout = 4000) {
  try {
    await page.waitForFunction(
      (value) => document.body.innerText.toLowerCase().includes(value.toLowerCase()),
      { timeout, polling: 100 },
      text,
    );
    return true;
  } catch {
    return false;
  }
}

async function waitForNoText(page, text, timeout = 4000) {
  try {
    await page.waitForFunction(
      (value) => !document.body.innerText.toLowerCase().includes(value.toLowerCase()),
      { timeout, polling: 100 },
      text,
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(), stdio: 'ignore', windowsHide: true,
  });
  let browser;
  try {
    await waitForServer();
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1440,900'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()} @ ${msg.location().url}:${msg.location().lineNumber}`); });
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack || error.message}`));

    console.log('\n[1] Navigation & responsive layout');
    const routes = ['/', '/locations', '/routes', '/graph', '/optimizer', '/comparison', '/simulation', '/settings'];
    for (const route of routes) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
      await wait(250);
      const heading = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => null);
      check(Boolean(heading), `${route} renders a page title (${heading || 'missing'})`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(overflow <= 2, `${route} has no horizontal page overflow (${overflow}px)`);
    }

    await page.setViewport({ width: 390, height: 844 });
    for (const route of routes) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
      await wait(200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(overflow <= 2, `mobile ${route} has no horizontal overflow (${overflow}px)`);
    }
    await page.setViewport({ width: 1440, height: 900 });

    console.log('\n[2] Dashboard sample data');
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    check(await hasText(page, 'Total Network Cost'), 'Dashboard shows statistics cards');
    check(await hasText(page, 'Network Cost Overview'), 'Dashboard charts render');

    console.log('\n[3] Location CRUD + validation + persistence');
    await page.goto(`${BASE}/locations`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    await clickText(page, 'Add location');
    const formInputs = await page.$$('form input');
    await formInputs[0].type('Test Depot');
    await formInputs[1].type('CW-01'); // duplicate code validation
    await formInputs[2].type('Seattle');
    await (await page.$$('form select'))[0].select('Delivery Hub');
    await clickText(page, 'Add location', true);
    check(await hasText(page, 'already in use'), 'Duplicate location code is rejected');
    const codeInput = (await page.$$('form input'))[1];
    await codeInput.click({ clickCount: 3 });
    await codeInput.type('TD-10');
    await clickText(page, 'Add location', true);
    check(await waitForText(page, 'Test Depot'), 'New location appears in the table');
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    check(await hasText(page, 'Test Depot'), 'Location persists after reload');
    await page.click('[aria-label="Delete Test Depot"]');
    await clickText(page, 'Delete location', true);
    check(await waitForNoText(page, 'Test Depot'), 'Location deletion works');

    console.log('\n[4] Route CRUD + validation');
    await page.goto(`${BASE}/routes`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    await clickText(page, 'Add route');
    let selects = await page.$$('form select');
    await selects[0].select('L01');
    await selects[1].select('L01'); // identical endpoint
    let numbers = await page.$$('form input[type=number]');
    await numbers[0].type('50');
    await numbers[1].type('25');
    await clickText(page, 'Add route', true);
    check(await hasText(page, 'must differ'), 'Identical source/destination is rejected');
    selects = await page.$$('form select');
    await selects[1].select('L09'); // duplicate of existing R15 (L06-L09) is fine; L01-L09 new
    await selects[2].select('Express');
    await clickText(page, 'Add route', true);
    check(await waitForText(page, 'R16'), 'New route added with generated ID');
    await page.click('[aria-label="Delete route R16"]');
    await clickText(page, 'Delete route', true);
    check(await waitForNoText(page, 'R16'), 'Route deletion works');

    console.log('\n[4a] Interactive graph: inspect, drag, zoom, fit and reset');
    await page.goto(`${BASE}/graph`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    await wait(900);
    await page.click('.rw-node');
    check(await hasText(page, 'Connected routes'), 'Clicking a node opens the inspector');
    const node = await page.$('.rw-node');
    const box = await node.boundingBox();
    const readPositions = () => page.evaluate(() => localStorage.getItem('routewise.v1.positions') || '{}');
    const positionsBefore = await readPositions();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 45, { steps: 10 });
    await page.mouse.up();
    await wait(500);
    const positionsAfterDrag = await readPositions();
    check(positionsAfterDrag !== positionsBefore, 'Dragging a node persists its position');
    const transformBefore = await page.$eval('.react-flow__viewport', (el) => el.style.transform);
    await page.click('[aria-label="Zoom in"]');
    await wait(500);
    const transformAfter = await page.$eval('.react-flow__viewport', (el) => el.style.transform);
    check(transformBefore !== transformAfter, 'Zoom controls change the viewport');
    await page.click('[aria-label="Fit to screen"]');
    await page.click('[aria-label="Center network"]');
    check((await page.$$('[aria-label="Fit to screen"]')).length > 0, 'Fit and center controls are available');
    await clickText(page, 'Reset layout');
    await wait(500);
    check((await readPositions()) !== positionsAfterDrag, 'Reset layout recomputes node positions');

    console.log('\n[5] MST algorithms, verification and step player');
    await page.goto(`${BASE}/optimizer`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    await clickText(page, 'Run both & compare');
    check(await hasText(page, 'Validated MST'), 'MST result passes independent validation');
    check(await hasText(page, 'Both algorithms found') || (await hasText(page, 'MST ready')), 'Optimizer reports completion');
    check(await hasText(page, 'Step-by-step algorithm visualization'), 'Step visualization is present');
    await clickText(page, 'Next');
    check(await hasText(page, 'Step 2 /'), 'Step player advances to next step');
    await clickText(page, 'Resume');
    check(await hasText(page, 'Pause'), 'Step player can resume playback');
    await clickText(page, 'Pause', false, true);
    await clickText(page, 'Reset', false, true);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('routewise.v1.mstResults') || '{}'));
    check(Boolean(stored.prim && stored.kruskal), 'Both MST results persisted to LocalStorage');
    check(stored.prim.totalCost === stored.kruskal.totalCost, 'Prim and Kruskal costs match');

    console.log('\n[6] Comparison & simulation');
    await page.goto(`${BASE}/comparison`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    check(await hasText(page, 'Same optimal cost'), 'Comparison detects equal minimum costs');
    check(await hasText(page, 'Graph Size vs Execution Time'), 'Size benchmark chart renders');
    await clickText(page, 'Run both');
    await page.goto(`${BASE}/simulation`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    await clickText(page, 'Generate network');
    check(await hasText(page, 'Synthetic locations'), 'Synthetic network generated');
    await clickText(page, 'Compare');
    check(await hasText(page, 'Simulation algorithm results'), 'Simulation algorithms executed');

    console.log('\n[7] Settings, theme and sample reset');
    await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0' }); await page.waitForSelector('h1', { timeout: 20000 });
    await page.click('[aria-label="Toggle theme"]');
    check(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'Dark theme toggles');
    await page.click('[aria-label="Toggle theme"]');
    check(!(await page.evaluate(() => document.documentElement.classList.contains('dark'))), 'Light theme toggles back');
    await clickText(page, 'Reset to sample data');
    await clickText(page, 'Reset to sample', true);
    check(await hasText(page, 'Sample data restored'), 'Sample data reset works with confirmation');
    check(await hasText(page, '9'), 'Settings shows restored location count');

    console.log('\n[8] Console errors');
    const uniqueErrors = [...new Set(errors)];
    check(uniqueErrors.length === 0, `No browser console or page errors (${uniqueErrors.length})`);
    uniqueErrors.slice(0, 12).forEach((error) => console.error(`    ${error}`));

    const failed = results.filter((result) => !result.ok);
    console.log(`\nSummary: ${results.length - failed.length}/${results.length} checks passed.`);
    if (failed.length) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
