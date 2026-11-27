const p=require('/home/claude/node_modules/puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const f of ['founders','finance-leads','investors'])for(const w of [1440,390]){const pg=await b.newPage();await pg.setViewport({width:w,height:1000});const e=[];pg.on('pageerror',x=>e.push(x.message));await pg.goto('http://localhost:8766/'+f+'.html',{waitUntil:'networkidle0'});await pg.addStyleTag({content:'header,.subnav{position:static!important}'});
const d=await pg.$('#why');await d.scrollIntoView();await new Promise(r=>setTimeout(r,1500));
console.log(f,w,await pg.evaluate(()=>[document.documentElement.scrollWidth-innerWidth,document.querySelectorAll('[data-widget=herostack] .hv').length].join(' ')),e.join('|'));
if(f!=='investors')await pg.screenshot({path:'/tmp/job/ba/st-'+f+'-'+w+'.png'});await pg.close();}
await b.close();})();
