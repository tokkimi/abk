import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const base=process.env.CHECK_ORIGIN||'http://localhost:4317';
const inventory=JSON.parse(await readFile(new URL('../docs/october-media-inventory.json',import.meta.url),'utf8'));
assert.equal(inventory.length,18);assert.equal(new Set(inventory.map(x=>x.source)).size,18);
const browser=await chromium.launch({headless:true});
try {
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/');
  const video=page.locator('[data-hero-video]');
  await page.waitForFunction(()=>{const v=document.querySelector('[data-hero-video]');return v.currentTime>.3&&!v.paused;});
  assert.equal(await page.evaluate(()=>scrollY),0);
  assert.equal(await page.locator('[data-hero-sequence]').evaluate(el=>el.offsetHeight-el.firstElementChild.offsetHeight),0);
  assert.equal(await page.evaluate(()=>document.body.style.position),'');
  const dimensions=await video.evaluate(v=>[v.videoWidth,v.videoHeight]);assert.deepEqual(dimensions,viewport.width>760?[3840,2160]:[1080,1920]);
  await page.getByRole('button',{name:'Mettre en pause l’animation',exact:true}).click();assert.equal(await video.evaluate(v=>v.paused),true);
  await page.getByRole('button',{name:'Contact',exact:true}).click();assert.equal(await page.locator('.header-contact-dialog a[href="tel:+33546057292"]').count(),1);assert.equal(await page.locator('.header-contact-dialog a[href="mailto:info@abk-piscine.fr"]').count(),1);await page.getByRole('button',{name:'Fermer les coordonnées'}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+'/piscines-exterieurs.html');await page.locator('.pool-project').first().waitFor();assert.equal(await page.locator('.pool-project').count(),23);assert.doesNotMatch(await page.locator('.pool-paving img').getAttribute('src'),/service-pool/);
  const collective=page.locator('.pool-project').filter({has:page.getByRole('heading',{name:'Un espace aquatique collectif',exact:true})});await collective.locator('.cover-open').click();
  // The last view is the newly supplied video, inside this project's own lightbox.
  await page.locator('.project-lightbox [data-prev]').click();const projectVideo=page.locator('.project-lightbox video');await projectVideo.waitFor();await projectVideo.evaluate(v=>v.load());await page.waitForFunction(()=>document.querySelector('.project-lightbox video')?.readyState>=1);assert.match(await projectVideo.getAttribute('src'),/espace-aquatique-octobre/);await page.locator('.project-lightbox [data-close]').click();
  await page.locator('#realisations-piscine').scrollIntoViewIfNeeded();await page.screenshot({path:`C:/Users/bello/abk-october-gallery-${viewport.width}.png`});assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage({reducedMotion:'reduce'});await page.goto(base+'/');assert.equal(await page.locator('[data-hero-video]').evaluate(v=>v.hidden&&v.paused),true);await page.close();
 console.log('18 supplied files, project grouping, automatic 4K/mobile animation, no scroll lock, pause/reduced-motion and header contact: PASS');
}finally{await browser.close();}
