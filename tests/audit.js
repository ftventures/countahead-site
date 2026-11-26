const p=require('puppeteer-core');
const pages=['index','revenue','books','plan','people','company','integrations','accountants','pricing','refunds','about','software','ai-usage','online-stores','consumer-brands','wholesale','services','professional-services','hospitality','retail','other-industries','founders','finance-leads','investors','privacy','terms'];
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [360,390]){for(const pgn of pages){const pg=await b.newPage();await pg.setViewport({width:w,height:780,isMobile:true,hasTouch:true});
await pg.goto('http://localhost:8766/'+pgn+'.html',{waitUntil:'networkidle0'});
// scroll through so lazy widgets settle
await pg.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0);});
await new Promise(r=>setTimeout(r,500));
const r=await pg.evaluate((w)=>{const out={over:document.documentElement.scrollWidth-w,wide:[],clip:[],tap:[],tiny:[],brk:[]};
const vis=e=>{const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
const path=e=>{let s=e.tagName.toLowerCase();if(e.className&&typeof e.className==='string')s+='.'+e.className.trim().split(/\s+/).slice(0,2).join('.');const sec=e.closest('section[id]');const wd=e.closest('[data-widget]');return (sec?'#'+sec.id+' ':'')+(wd?'['+wd.getAttribute('data-widget')+'] ':'')+s;};
const scrollParent=e=>{for(let x=e.parentElement;x;x=x.parentElement){const s=getComputedStyle(x);if(/(auto|scroll)/.test(s.overflowX))return true;}return false;};
for(const e of document.querySelectorAll('body *')){if(!vis(e))continue;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
 if(r.right>w+1&&r.width<=w*3&&!scrollParent(e)&&cs.position!=='fixed'&&e.getAttribute('aria-hidden')!=='true')out.wide.push(path(e)+' right='+Math.round(r.right));
 if(e.children.length===0&&e.textContent.trim()){const fs=parseFloat(cs.fontSize);if(fs<11)out.tiny.push(path(e)+' '+fs+'px "'+e.textContent.trim().slice(0,20)+'"');
  if(e.scrollWidth>e.clientWidth+2&&cs.overflowX!=='visible'&&!/(auto|scroll)/.test(cs.overflowX)&&e.clientWidth>0)out.clip.push(path(e)+' "'+e.textContent.trim().slice(0,24)+'"');}
 if((e.tagName==='BUTTON'||e.tagName==='A'||e.tagName==='SELECT'||(e.tagName==='INPUT'&&e.type!=='hidden'))&&(r.height<32||r.width<32)&&!e.closest('p,li,.lg')&&e.tagName!=='A')out.tap.push(path(e)+' '+Math.round(r.width)+'x'+Math.round(r.height));
}
const u=a=>[...new Set(a)].slice(0,12);return {over:out.over,wide:u(out.wide),clip:u(out.clip),tap:u(out.tap),tiny:u(out.tiny)};},w);
const bad=r.over>0||r.wide.length||r.clip.length||r.tap.length||r.tiny.length;
if(bad)console.log(JSON.stringify({w,page:pgn,...r}));else console.log(w,pgn,'ok');await pg.close();}}
await b.close();})();
