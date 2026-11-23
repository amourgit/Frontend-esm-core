import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
for (const route of ['sites']) {
  await page.goto('http://localhost:8080/egen-civitas/spa/' + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForSelector('#egen-scroll-region', { timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(4000);
  const d = await page.evaluate(() => {
    const r = document.getElementById('egen-scroll-region');
    const c = document.getElementById('egen-apps-container');
    const wrap = [...c.children].find(d => d.id.includes('sites'));
    const out = { route: location.pathname, scrollable: r.scrollHeight - r.clientHeight,
      wrapH: wrap ? Math.round(wrap.getBoundingClientRect().height) : null };
    if (wrap) {
      out.kids = [...wrap.children].map(k => ({ tag: k.tagName, cls: (k.className?.toString()||'').slice(0,70),
        h: Math.round(k.getBoundingClientRect().height), sh: k.scrollHeight,
        mt: getComputedStyle(k).marginTop, mb: getComputedStyle(k).marginBottom }));
      // deepest bottom
      let maxB = 0, maxEl = null;
      wrap.querySelectorAll('*').forEach(el => { const b = el.getBoundingClientRect().bottom; if (b > maxB) { maxB = b; maxEl = el; } });
      out.maxBottom = maxEl ? { cls: (maxEl.className?.toString()||maxEl.tagName).slice(0,70), bottom: Math.round(maxB) } : null;
      out.regionBottom = Math.round(r.getBoundingClientRect().bottom);
    }
    return out;
  });
  console.log(JSON.stringify(d, null, 1));
}
await browser.close();
