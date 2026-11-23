import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
for (const route of ['', 'sites', 'annuaire', 'informations/news']) {
  await page.goto('http://localhost:8080/egen-civitas/spa/' + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForSelector('#egen-scroll-region', { timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(3500);
  const d = await page.evaluate(() => {
    const r = document.getElementById('egen-scroll-region');
    const c = document.getElementById('egen-apps-container');
    // plus large scrollWidth dans la zone ?
    let maxSW = { el: '', sw: 0 };
    c.querySelectorAll('*').forEach(el => {
      if (el.scrollWidth > maxSW.sw) maxSW = { el: (el.className?.toString()||el.tagName).slice(0,60), sw: el.scrollWidth };
    });
    return { route: location.pathname, regionCW: r.clientWidth, regionSW: r.scrollWidth,
      hScroll: r.scrollWidth - r.clientWidth, maxSW,
      workspaceW: Math.round(document.getElementById('egen-workspaces-container')?.getBoundingClientRect().width || 0) };
  });
  console.log(JSON.stringify(d));
}
await browser.close();
