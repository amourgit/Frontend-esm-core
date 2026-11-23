import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const measure = () => page.evaluate(() => {
  const r = document.getElementById('egen-scroll-region');
  const c = document.getElementById('egen-apps-container');
  return { regionSH: r.scrollHeight, regionCH: r.clientHeight, scrollable: r.scrollHeight - r.clientHeight,
    divs: [...c.children].filter(d=>d.children.length).map(d=>({id:d.id.slice(0,60), h:Math.round(d.getBoundingClientRect().height), kids:d.children.length})) };
});
for (const route of ['', 'penpot']) {
  await page.goto('http://localhost:8080/egen-civitas/spa/' + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForTimeout(4500);
  console.log('=== AVANT', route || '(home)', JSON.stringify(await measure()));
  // simuler le nouveau CSS : neutraliser l'ancienne règle + opt-in
  await page.addStyleTag({ content: `
    #egen-apps-container > div { min-height: 0; }
    #egen-apps-container > div:has(> [data-egen-fill]) { height: 100%; }
  `});
  // marquer l'iframe penpot comme fill (ce que fera embed.ts)
  await page.evaluate(() => {
    document.querySelectorAll('#egen-apps-container iframe').forEach(f => f.setAttribute('data-egen-fill', ''));
  });
  await page.waitForTimeout(800);
  console.log('=== APRÈS', route || '(home)', JSON.stringify(await measure()));
}
await browser.close();
