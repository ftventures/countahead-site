const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();await pg.setViewport({width:390,height:844,deviceScaleFactor:2});await pg.goto('http://localhost:8766/index.html',{waitUntil:'networkidle0'});
await pg.evaluate(()=>document.querySelectorAll('[data-kd]')[6].click());await new Promise(r=>setTimeout(r,300));const e=await pg.$('[data-widget=hero]');await e.scrollIntoView();await pg.evaluate(()=>scrollBy(0,-90));await pg.screenshot({path:'/tmp/job/ba/hk-phone.png'});
await pg.evaluate(()=>{scrollTo(0,0);const m=[...document.querySelectorAll('header button')].find(x=>/menu/i.test(x.getAttribute('aria-label')||''));m&&m.click();});await new Promise(r=>setTimeout(r,400));
await pg.evaluate(()=>{const d=[...document.querySelectorAll('details')].find(x=>/Industries/.test(x.querySelector('summary').textContent));d.open=true;d.scrollIntoView();});await new Promise(r=>setTimeout(r,300));await pg.screenshot({path:'/tmp/job/ba/mm-phone.png'});
console.log(await pg.evaluate(()=>document.querySelectorAll('.mn-il svg').length));await b.close();})();
