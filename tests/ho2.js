const p=require('/home/claude/node_modules/puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [1440,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:900});const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8766/hero-options.html',{waitUntil:'networkidle0'});await pg.addStyleTag({content:'header,.subnav{position:static!important}'});await new Promise(r=>setTimeout(r,3600));
await pg.evaluate(()=>{const o=document.querySelector('#top-c [data-o="1"]');o&&o.click();});
console.log(w,await pg.evaluate(()=>[document.documentElement.scrollWidth-innerWidth,['heroparts','herostack','heroday'].map(k=>{const e=document.querySelector('[data-widget='+k+']');return e?Math.round(e.getBoundingClientRect().height)+':'+e.querySelectorAll('svg').length:'none'}).join(' ')].join(' | ')),errs.join('|'));
for(const id of ['top-b','top-c','top-d']){const e=await pg.$('#'+id+' [data-widget]');await e.scrollIntoView();await new Promise(r=>setTimeout(r,300));await e.screenshot({path:'/tmp/job/ba/h2-'+id+'-'+w+'.png'});}
if(w===1440){const e=await pg.$('#top-b');await e.scrollIntoView();await e.screenshot({path:'/tmp/job/ba/h2-full-b.png'});}
await pg.close();}
await b.close();})();
