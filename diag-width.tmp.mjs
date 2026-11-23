import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [390, 768, 1600]) {
  const page = await browser.newPage({ viewport: { width: w, height: 800 } });
  await page.goto('http://localhost:8080/egen-civitas/spa/annuaire', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForSelector('#egen-scroll-region', { timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(3500);
  const d = await page.evaluate(() => {
    const ids = ['egen-scroll-region','egen-apps-container'];
    const out = { vw: innerWidth, els: {} };
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const cs = getComputedStyle(el);
      out.els[id] = { cw: el.clientWidth, sw: el.scrollWidth, rectW: Math.round(el.getBoundingClientRect().width),
        cssW: cs.width, minW: cs.minWidth, maxW: cs.maxWidth, ovx: cs.overflowX };
    }
    const wrap = document.querySelector('#egen-apps-container > div:has(> *)');
    if (wrap) {
      const k = wrap.firstElementChild;
      out.wrap = { cw: wrap.clientWidth, sw: wrap.scrollWidth, w: Math.round(wrap.getBoundingClientRect().width) };
      out.appRoot = k ? { cw: k.clientWidth, sw: k.scrollWidth, w: Math.round(k.getBoundingClientRect().width), cls: (k.className?.toString()||'').slice(0,60) } : null;
    }
    // qui fixe la largeur ? remonter les ancêtres du wrapper
    out.ancestors = [];
    let el = wrap;
    while (el && el !== document.body && out.ancestors.length < 6) {
      const cs = getComputedStyle(el);
      out.ancestors.push({ sel: el.id ? '#'+el.id : el.tagName, w: Math.round(el.getBoundingClientRect().width), minW: cs.minWidth, maxW: cs.maxWidth, disp: cs.display });
      el = el.parentElement;
    }
    return out;
  });
  console.log(`--- viewport ${w}px ---`);
  console.log(JSON.stringify(d, null, 1));
  await page.close();
}
await browser.close();
