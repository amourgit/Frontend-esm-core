import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
await page.goto('http://localhost:8080/egen-civitas/spa/penpot', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
await page.waitForSelector('#egen-scroll-region', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(6000);
const iframe = page.locator('iframe').first();
await iframe.screenshot({ path: '/tmp/penpot-in-core-390.png' });
await page.screenshot({ path: '/tmp/core-390.png' });
// comparaison : penpot standalone à 390px
const p2 = await browser.newPage({ viewport: { width: 390, height: 800 } });
await p2.goto('http://localhost:9001', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
await p2.waitForTimeout(4000);
await p2.screenshot({ path: '/tmp/penpot-standalone-390.png' });
await browser.close();
console.log('screenshots ok');
