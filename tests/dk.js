const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const pn of ['ai-usage','consumer-brands','professional-services','retail','wholesale','plan']){const pg=await b.newPage();await pg.setViewport({width:1280,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/'+pn+'.html',{waitUntil:'networkidle0'});
const W='[data-widget="pack"]';const n=await pg.evaluate(W=>document.querySelectorAll(W+' .bp-th').length,W);
for(let i=0;i<n;i++){await pg.evaluate((W,i)=>document.querySelectorAll(W+' .bp-th')[i].click(),W,i);await new Promise(r=>setTimeout(r,60));}
console.log(pn,'slides',n,await pg.evaluate(W=>(document.querySelector(W+' .sl-cover small')||document.querySelector(W+' small')).textContent+' | dash: '+document.querySelector('[data-widget=analytics] .a-kp small').textContent+' | over '+(document.documentElement.scrollWidth-innerWidth),W),errs.join('|'));
if(pn==='ai-usage'||pn==='retail'){for(const i of [1,6]){await pg.evaluate((W,i)=>document.querySelectorAll(W+' .bp-th')[i].click(),W,i);await new Promise(r=>setTimeout(r,300));const e=await pg.$(W);await e.scrollIntoView();await e.screenshot({path:'/tmp/job/ba/dk-'+pn+'-'+i+'.png'});}const a=await pg.$('[data-widget=analytics]');await a.scrollIntoView();await a.screenshot({path:'/tmp/job/ba/dk-'+pn+'-dash.png'});}
await pg.close();}
await b.close();})();
