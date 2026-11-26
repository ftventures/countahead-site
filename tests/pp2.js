const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1280,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/people.html',{waitUntil:'networkidle0'});await pg.addStyleTag({content:'header,.subnav{position:static!important}.rv{opacity:1!important;transform:none!important}'});
const c=s=>pg.evaluate(s=>{const x=document.querySelector('[data-widget="orgchart"] '+s);if(x)x.click();return !!x},s);
const e=await pg.$('#team');await e.scrollIntoView();await c('[data-pl="1"]');await c('[data-s="1"]');await e.screenshot({path:'/tmp/job/ba/team-'+w+'.png'});
const r=[await c('[data-v="1"]'),await c('[data-d="1"]'),await c('[data-v="2"]'),await c('[data-v="0"]')];
if(w===1280){const t=await pg.$('#top, section');await pg.evaluate(()=>scrollTo(0,0));await pg.screenshot({path:'/tmp/job/ba/ppl-top.png'});}
console.log(w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),r.join(','),errs.join('|'));await pg.close();}
await b.close();})();
