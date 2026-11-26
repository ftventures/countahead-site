const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1280,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/other-industries.html',{waitUntil:'networkidle0'});const W='[data-widget="fit"]';const e=await pg.$(W);await e.scrollIntoView();
await e.screenshot({path:'/tmp/job/ba/gf-'+w+'-0.png'});
const n=await pg.evaluate(W=>document.querySelectorAll(W+' [data-i]').length,W);for(let i=0;i<n;i++)await pg.evaluate((W,i)=>document.querySelectorAll(W+' [data-i]')[i].click(),W,i);
await pg.evaluate(W=>document.querySelector(W+' [data-g="1"]').click(),W);await pg.type('#gf-q','clinic');await new Promise(r=>setTimeout(r,300));if(w===1280)await e.screenshot({path:'/tmp/job/ba/gf-1280-1.png'});
console.log(w,n,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),errs.join('|'));await pg.close();}
await b.close();})();
