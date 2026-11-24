import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
// Run only against the ephemeral local preview database.
const base='http://localhost:4317',browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 const response=await page.request.post(base+'/api/gestion?action=quote',{headers:{Origin:base},data:{name:'Partenaire QA local',email:'partner@abk.example',phone:'0000000000',category:'piscine',content:'Société fictive, affiliation, sans budget financier. Test local.',consent:true,source:'partnership:/a-propos'}});
 assert.equal(response.ok(),true);assert.equal((await response.json()).ok,true);
 await page.goto(base+'/gestion/');await page.getByLabel('Adresse e-mail').fill('admin@abk.example');await page.getByLabel('Mot de passe',{exact:true}).fill('Preview-only-2026');await page.getByRole('button',{name:'Me connecter',exact:true}).click();
 await page.getByRole('button',{name:'Partenariats & affiliation',exact:true}).click();await page.getByText('Partenaire QA local',{exact:true}).first().waitFor();
 await page.getByRole('button',{name:'Demandes',exact:true}).click();assert.equal(await page.getByText('Partenaire QA local',{exact:true}).count(),0);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Partenariats & affiliation',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log('Partnership request persisted and separated from quote requests; mobile admin fits.');
}finally{await browser.close();}
