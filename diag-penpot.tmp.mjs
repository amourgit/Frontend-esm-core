import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
await page.goto('http://localhost:8080/egen-civitas/spa/penpot', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
await page.waitForSelector('#egen-scroll-region', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(5000);
const d = await page.evaluate(() => {
  const r = document.getElementById('egen-scroll-region');
  const c = document.getElementById('egen-apps-container');
  const wrap = document.getElementById('single-spa-application:@civitas/esm-penpot-app-page-0');
  const iframe = wrap?.querySelector('iframe');
  const info = el => el ? { cw: el.clientWidth, sw: el.scrollWidth, w: Math.round(el.getBoundingClientRect().width),
    cssW: getComputedStyle(el).width, minW: getComputedStyle(el).minWidth } : null;
  return {
    region: info(r), container: info(c), wrap: info(wrap), iframe: info(iframe),
    regionHScroll: r.scrollWidth - r.clientWidth,
    iframeDocWidth: iframe ? (() => { try { return iframe.contentDocument?.documentElement?.clientWidth } catch(e){ return 'cross-origin' } })() : null,
    iframeInnerWidth: iframe ? (() => { try { return iframe.contentWindow?.innerWidth } catch(e){ return 'x' } })() : null
  };
});
console.log(JSON.stringify(d, null, 1));
await browser.close();
