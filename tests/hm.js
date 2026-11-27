const p=require('/home/claude/node_modules/puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1440,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900,deviceScaleFactor:w===390?2:1});const e=[];pg.on('pageerror',x=>e.push(x.message));await pg.goto('http://localhost:8766/index.html',{waitUntil:'networkidle0'});await pg.addStyleTag({content:'header,.subnav{position:static!important}'});
await pg.evaluate(()=>{const o=document.querySelectorAll('[data-widget=heroparts] [data-k]')[2];o&&o.click();});await new Promise(r=>setTimeout(r,2600));
console.log(w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth),e.join('|'));
await (await pg.$('#top')).screenshot({path:'/tmp/job/ba/hm-top-'+w+'.png'});
const d=await pg.$('#different');await d.scrollIntoView();await new Promise(r=>setTimeout(r,1200));await pg.screenshot({path:'/tmp/job/ba/hm-diff-'+w+'.png'});
await pg.close();}
await b.close();})();
