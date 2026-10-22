import {chromium} from '../../014-help-scout-conversation-archive-pdf-csv/node_modules/playwright-core/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Users/sametatesen2/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',headless:true});
const results=[];
try {
  for(const width of [1440,375]) {
    const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    for(const path of ['/','/docs/','/privacy/','/support/','/eula/','/refunds/']) {
      const response=await page.goto('https://seo-data.atesensoftware.com'+path,{waitUntil:'networkidle'});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      const buttons=await page.locator('[data-plan]:visible').count();
      await mkdir('evidence/screenshots',{recursive:true});
      await page.screenshot({path:`evidence/screenshots/${path.replaceAll('/','')||'home'}-${width}.png`,fullPage:true});
      results.push({width,path,status:response.status(),overflow,visiblePaidButtons:buttons,errors:[...errors]});
      if(response.status()!==200||overflow||buttons||errors.length)throw new Error('VISUAL_FLOW_CHECK_FAILED');
    }
    await page.goto('https://seo-data.atesensoftware.com/');await page.getByRole('link',{name:'Set up the local server'}).click();
    if(!page.url().endsWith('/docs/'))throw new Error('INSTALL_NAVIGATION_FAILED');
    await page.close();
  }
}finally{await browser.close();await writeFile('evidence/visual.json',JSON.stringify(results,null,2)+'\n');}
console.log(JSON.stringify(results,null,2));
