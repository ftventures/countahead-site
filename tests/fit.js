const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1440,1280,1100]){for(const pn of ['revenue','books','plan','company','accountants','about','pricing','people','software','ai-usage','wholesale','professional-services','hospitality','other-industries','founders','finance-leads','investors']){const pg=await b.newPage();await pg.setViewport({width:w,height:700});await pg.goto('http://localhost:8766/'+pn+'.html',{waitUntil:'domcontentloaded'});const r=await pg.evaluate(()=>{const n=document.querySelector('.subnav.sp');return n?n.scrollWidth-n.clientWidth:-1});if(r>0)console.log(w,pn,'overflows by',r);await pg.close();}}
console.log('done');await b.close();})();
