const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [pn,w] of [['hospitality',1280],['retail',1280],['retail',390],['revenue',1280]]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/'+pn+'.html',{waitUntil:'networkidle0'});const W='[data-widget="revflow"]';const e=await pg.$(W);await e.scrollIntoView();
const c=s=>pg.evaluate((W,s)=>{const x=document.querySelector(W+' '+s);if(x)x.click();return !!x},W,s);
if(pn==='revenue'){await c('[data-m="3"]');await c('[data-kd="1"]');}
await c('[data-i="0"]');await c('[data-i="3"]');if(pn==='hospitality')await c('[data-tip]');await c('[data-a="card"]');await c('[data-i="1"]');await c('[data-a="cash"]');if(pn!=='hospitality')await c('[data-a="refund"]');await new Promise(r=>setTimeout(r,250));await e.screenshot({path:'/tmp/job/ba/pos-'+pn+'-'+w+'.png'});await c('[data-a="close"]');
console.log(pn,w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),errs.join('|'),await pg.evaluate(W=>document.querySelector(W+' .rf-head b').textContent,W));await pg.close();}
await b.close();})();
