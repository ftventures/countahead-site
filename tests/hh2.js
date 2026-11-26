const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1440,1100,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/index.html',{waitUntil:'networkidle0'});
const r=[];for(let i=0;i<10;i++){r.push(await pg.evaluate(i=>{document.querySelectorAll('[data-kd]')[i].click();const e=document.querySelector('[data-widget=hero]');return document.querySelectorAll('[data-kd] svg').length+':'+Math.round(e.getBoundingClientRect().height)+':'+[...document.querySelectorAll('[data-kd]')].filter(b=>b.scrollWidth>b.clientWidth+1).length},i));}
await pg.evaluate(()=>document.querySelectorAll('[data-kd]')[4].click());const e=await pg.$('[data-widget=hero]');await e.screenshot({path:'/tmp/job/ba/hk-'+w+'.png'});
console.log(w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),r.join(' '),errs.join('|'));await pg.close();}
await b.close();})();
