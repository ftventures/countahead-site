const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1280,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/accountants.html',{waitUntil:'networkidle0'});await pg.addStyleTag({content:'header,.subnav{position:static!important}.rv{opacity:1!important;transform:none!important}'});
const c=s=>pg.evaluate(s=>{const x=document.querySelector('[data-widget="practiceview"] '+s);if(x)x.click();return !!x},s);
let e=await pg.$('#clients');await e.scrollIntoView();await e.screenshot({path:'/tmp/job/ba/pv-'+w+'.png'});
const r=[await c('[data-a="rt"]'),await c('[data-a="ex"]'),await c('[data-a="nd"]'),await c('[data-a="nd"]'),await c('[data-a="so"]'),await c('[data-f="3"]'),await c('[data-o="8"]'),await c('[data-r="0"]'),await c('[data-w="0"]'),await c('[data-f="0"]')];
const k=await pg.evaluate(()=>document.querySelector('[data-widget="practiceview"] .pl-kp b').textContent);
e=await pg.$('#program');await e.scrollIntoView();if(w===1280)await e.screenshot({path:'/tmp/job/ba/pg-'+w+'.png'});
console.log(w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),r.join(','),k,errs.join('|'));await pg.close();}
await b.close();})();
