const p=require('/home/claude/node_modules/puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1440,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900,deviceScaleFactor:w===390?2:1});await pg.goto('http://localhost:8766/hero-options.html',{waitUntil:'networkidle0'});await pg.addStyleTag({content:'header,.subnav{position:static!important}'});await new Promise(r=>setTimeout(r,3600));
await pg.evaluate(()=>{const o=document.querySelector('#top-c [data-o="1"]');o&&o.click();});
console.log(w,await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
for(const id of ['top-b','top-c','top-d']){const e=await pg.$('#'+id);await e.scrollIntoView();await new Promise(r=>setTimeout(r,2500));await e.screenshot({path:'/tmp/job/ba/h3-'+id.slice(4)+'-'+w+'.png'});}
await pg.close();}
await b.close();})();
