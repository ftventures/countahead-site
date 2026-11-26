const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1280,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/revenue.html',{waitUntil:'networkidle0'});const W='[data-widget="revflow"]';const e=await pg.$(W);await e.scrollIntoView();
const c=s=>pg.evaluate((W,s)=>{const x=document.querySelector(W+' '+s);if(x)x.click();return !!x},W,s);const shot=async n=>{await new Promise(r=>setTimeout(r,250));if(w===1280||n==='svc')await e.screenshot({path:'/tmp/job/ba/rf-'+w+'-'+n+'.png'});};
await c('[data-m="4"]');await c('[data-i="2"]');await c('[data-i="1"]');await c('[data-i="1"]');await shot('svc');
await c('[data-k="1"]');await c('[data-r="0"]');await c('[data-r="0"]');await c('[data-r="1"]');await shot('ret');
await c('[data-k="2"]');await c('[data-hs]');await shot('hr');await c('[data-x]');
await c('[data-m="1"]');await c('[data-i="2"]');await c('[data-c="1"]');await c('[data-a]');await shot('com');
await c('[data-m="2"]');await c('[data-a]');await shot('use');await c('[data-x]');
await c('[data-m="5"]');await c('[data-v="500"]');await c('[data-a]');await c('[data-a]');await shot('gen');
await c('[data-m="3"]');await c('[data-i="0"]');await c('[data-i="1"]');await c('[data-a]');await shot('pos');
await c('[data-m="0"]');
console.log(w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),errs.join('|'));await pg.close();}
await b.close();})();
