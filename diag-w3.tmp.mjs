import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:8080/egen-civitas/spa/annuaire', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
await page.waitForSelector('#egen-scroll-region', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(3000);
const d = await page.evaluate(() => {
  const chain = [];
  let el = document.getElementById('egen-scroll-region');
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    chain.push({ sel: el.id ? '#'+el.id : (el.className?.toString().slice(0,40)||el.tagName),
      w: Math.round(el.getBoundingClientRect().width), cssW: cs.width, minW: cs.minWidth, maxW: cs.maxWidth,
      disp: cs.display, gridArea: cs.gridArea });
    el = el.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(d, null, 1));
await browser.close();
