// Builds the static site from src/Main.dc.html. Run: node src/build.js
const fs = require("fs"), path = require("path");
const { JSDOM } = require(process.env.JSDOM || "jsdom");
const root = path.join(__dirname, "..");
let src = fs.readFileSync(path.join(__dirname, "Main.dc.html"), "utf8");

// accent colours become variables so the palette can be switched in one place
function vars(s) {
  return s.replace(/#A9E8CF/gi, "var(--hl)").replace(/#E4F7EE/gi, "var(--hlp)")
    .replace(/rgba\(169,\s*232,\s*207,\s*([\d.]+)\)/g, (m, a) => "color-mix(in srgb, var(--hl) " + Math.round(parseFloat(a) * 100) + "%, transparent)")
    .replace(/(^|[\s;"'{])color:\s*var\(--hl\)/g, "$1color: var(--hlt)")
    .replace(/#0B1B3A/gi, "var(--ink)").replace(/#2F4063/gi, "var(--inkline)")
    .replace(/rgba\(11,\s*27,\s*58,\s*([\d.]+)\)/g, (m, a) => "color-mix(in srgb, var(--ink) " + Math.round(parseFloat(a) * 100) + "%, transparent)");
}
src = vars(src);
src = src.replace(/radial-gradient\(closest-side, color-mix\(in srgb, var\(--hl\) (\d+)%, transparent\), color-mix\(in srgb, var\(--hl\) 0%, transparent\)\)/g, (m, n) => "radial-gradient(closest-side, rgba(110,140,255," + (n / 100) + "), rgba(110,140,255,0))");
function once(a, b) { if (src.split(a).length !== 2) throw new Error("pop target not unique: " + a); src = src.replace(a, b); }
once('<span style="background: var(--hl); color: var(--ink); padding: 8px 10px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; display: inline-flex; align-items: center">NEW</span>', '<span style="background: var(--pop); color: var(--ink); padding: 8px 10px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; display: inline-flex; align-items: center">NEW</span>');
once('bd: act ? (i === 5 ? "var(--hl)" : "#FFFFFF") : "var(--hl)", glow: i === 5 ? "0 0 28px color-mix(in srgb, var(--hl) 70%, transparent)" : "none",', 'bd: act ? (i === 5 ? "var(--pop)" : "#FFFFFF") : "#FFFFFF", glow: i === 5 ? "0 0 28px color-mix(in srgb, var(--pop) 70%, transparent)" : "none",');
once('fill: act ? (i === 5 ? "var(--hl)" : "#FFFFFF") : "repeating-linear-gradient(135deg, var(--hl) 0 1.5px, transparent 1.5px 5px)",', 'fill: act ? (i === 5 ? "var(--pop)" : "#FFFFFF") : "repeating-linear-gradient(135deg, #FFFFFF 0 1.5px, transparent 1.5px 5px)",');
once('ul: on ? "var(--hl)" : "transparent",', 'ul: on ? "var(--pop)" : "transparent",');
const css = /<style>([\s\S]*?)<\/style>/.exec(src)[1];
const logic = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(src)[1].trim();
const body = src.slice(src.indexOf("</helmet>") + 9, src.indexOf("</x-dc>"));
const sections = {};
body.replace(/<section[\s\S]*?<\/section>/g, (m) => {
  const id = (/^<section id="([\w-]+)"/.exec(m) || [])[1] || (/class="mani"/.test(m.slice(0, 60)) ? "mani" : "x" + Object.keys(sections).length);
  sections[id] = m; return m;
});
const need = ["top", "mani", "different", "who", "accounting", "control", "planning", "ask", "connected", "about", "access"];
need.forEach((k) => { if (!sections[k]) throw new Error("missing section " + k); });
const marquee = /<div aria-hidden="true" style="background: var\(--hl\); border-bottom[\s\S]*?<\/div>\n<\/div>/.exec(body)[0];

// hero without the product window; the window moves to the product page
let hero = sections.top;
const ti = hero.indexOf('<div class="tilt"'), te = hero.lastIndexOf("</div>\n</section>");
let windowHtml = hero.slice(ti, te).trim();
hero = hero.slice(0, ti) + hero.slice(te);
if (hero.indexOf('<div class="r5" style="background: rgba(255,255,255,0.07)') < 0) throw new Error("hero rail not found");
const hw = '<div class="wrap" style="position: relative; z-index: 1; padding-top: 48px; padding-bottom: 88px; display: flex; flex-direction: column; gap: 40px">';
if (hero.indexOf(hw) < 0) throw new Error("hero wrap not found");
hero = hero.replace(hw, hw.replace('class="wrap"', 'class="wrap hero2"'));
hero = hero.slice(0, hero.indexOf('<div class="r5" style="background: rgba(255,255,255,0.07)')) + '<div class="r5 w-hero" data-widget="hero"></div>\n' + hero.slice(hero.lastIndexOf("</div>\n</section>"));
windowHtml = windowHtml.replace('href="#ask"', 'href="plan.html#today"');

const IND = require("./sectors.js").IND;
const isInd = (f) => IND.some((x) => x[0] === f);
const NAV = [["revenue.html", "Revenue"], ["books.html", "Books"], ["plan.html", "Plan"], ["people.html", "People"], ["company.html", "Company"], ["integrations.html", "Integrations"], ["software.html", "Industries"], ["accountants.html", "Accountants"], ["pricing.html", "Pricing"], ["about.html", "About"]];
const SUBS = { "revenue.html": [["how-you-sell", "Ways to sell"], ["customers", "Customers"], ["pipeline", "Deals"], ["quotes", "Quotes"], ["contracts", "Contracts"], ["collections", "Collections"], ["recognition", "Revenue recognition"], ["recurring", "Recurring revenue"], ["commissions", "Commissions"]], "books.html": [["accounting", "The accounting cycle"], ["group", "Groups"], ["basis", "Accounting rules"], ["approvals", "Approvals"], ["control", "Controls"], ["policies", "Policies"], ["tax", "Tax"], ["audit", "Audit readiness"]], "plan.html": [["today", "Daily view"], ["analytics", "Analytics"], ["forecast", "Revenue forecast"], ["scenarios", "Scenarios and hiring"], ["budgets", "Budgets"], ["model", "Financial model"], ["board-pack", "Board packs"], ["investor-update", "Investor updates"]], "about.html": [["why", "Why it exists"], ["why-now", "Why now"], ["principles", "Principles"], ["founder", "Founder"], ["status", "Where we are"], ["shape", "Help shape it"], ["questions", "Questions"], ["contact", "Contact"]], "integrations.html": [["switch", "Switching"], ["directory", "Directory"]], "accountants.html": [["your-seat", "Your seat"], ["who-does-what", "Who does what"], ["rules", "Your rules"], ["review", "Review queue"], ["your-month", "Your month"], ["advice", "Advice"], ["founding-firms", "Founding firms"], ["questions", "Hard questions"], ["promises", "Where we stand"]], "pricing.html": [["included", "What you get"], ["compare", "Compare your stack"], ["first-year", "Your first year"], ["terms", "Terms"], ["for-accountants", "For accountants"], ["questions", "Questions"]], "people.html": [["team", "The team"], ["my-page", "My page"], ["time-off", "Time off"], ["joining-leaving", "Joining and leaving"], ["the-line", "What stays outside"]], "company.html": [["cap-table", "Cap table"], ["options", "Options"], ["data-room", "Data room"], ["records", "Company records"], ["drafting", "Drafting"], ["calendar", "Reminders"]] };
IND.forEach((x) => { SUBS[x[0]] = x[0] === "other-industries.html" ? [["fit", "Does it fit"], ["why", "What changes"], ["how", "How it runs"], ["selling", "How you sell"], ["dashboard", "Your dashboard"], ["board-pack", "Your board pack"], ["investor-update", "Investor update"]] : [["why", "What changes"], ["how", "How it runs"], ["selling", x[0] === "hospitality.html" || x[0] === "retail.html" ? "The till" : "How you sell"], ["dashboard", "Your dashboard"], ["board-pack", "Your board pack"], ["investor-update", "Investor update"], ["specifics", "The details"]]; });
function header(cur) {
  const on = (h) => h === cur || (h === "software.html" && isInd(cur));
  const subOf = (h) => h === "software.html" ? IND.map((x) => [x[0], x[1], 1]) : SUBS[h];
  const PROD = [["revenue.html", "Revenue", "Customers, deals, contracts and billing", "rev"], ["books.html", "Books", "The accounting, kept by agents you supervise", "books"], ["plan.html", "Plan", "Forecast, budgets, runway and board packs", "plan"], ["people.html", "People", "Who works here and what they cost", "people"], ["company.html", "Company", "Cap table, data room and records", "co"], ["integrations.html", "Integrations", "Switching, banks, payments and payroll", "int"]];
  const INDT = { "software.html": "Subscriptions, seats and recurring revenue", "ai-usage.html": "Metered usage, credits and compute margin", "online-stores.html": "Orders, payouts, stock and margin after ads", "consumer-brands.html": "Landed cost, stock and retailers", "wholesale.html": "Stock, customer terms and margin by line", "services.html": "Projects, retainers and time billed", "professional-services.html": "Law, accounting, architecture, consulting", "hospitality.html": "Takings, tips, labor and cost of goods", "retail.html": "Takings, stock and margin by shop", "other-industries.html": "Check whether your kind of business fits" };
  const WHO = IND.map((x) => [x[0], x[1]]).concat([["accountants.html", "Accountants and firms"], ["founders.html", ""], ["finance-leads.html", ""], ["investors.html", ""]]);
  const inP = PROD.some((x) => x[0] === cur), inW = WHO.some((x) => x[0] === cur);
  const R = (x, y, w, h, c, cl) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${cl ? ` class="${cl}"` : ""}></rect>`;
  const O = (x, y, w, h, cl) => `<rect x="${x + 0.9}" y="${y + 0.9}" width="${w - 1.8}" height="${h - 0.9}" fill="#DCE6FF" stroke="#2450DC" stroke-width="1.8" class="${cl}"></rect>`;
  const D = (x, y, w, h) => `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" fill="none" stroke="#2450DC" stroke-width="1.5" stroke-dasharray="3 2.5" class="k2"></rect>`;
  const ICON = {
    rev: R(2, 23, 9, 9, "#0B1B3A") + R(13.5, 16, 9, 16, "#0B1B3A", "k1") + R(25, 11, 9, 21, "#2450DC", "k2") + R(25, 3, 9, 6, "#FFD15C", "k3"),
    books: R(2, 3, 14, 7, "#0B1B3A") + R(2, 12, 14, 7, "#0B1B3A") + R(2, 21, 14, 7, "#0B1B3A") + R(20, 3, 14, 7, "#2450DC", "k1") + R(20, 12, 14, 7, "#2450DC", "k2") + R(20, 21, 14, 7, "#FFD15C", "k3") + R(2, 30, 32, 3, "#0B1B3A"),
    plan: R(2, 20, 7, 12, "#0B1B3A") + R(10.5, 13, 7, 19, "#0B1B3A") + R(19, 3, 2.5, 29, "#FFD15C", "k3") + O(23, 11, 5, 21, "k1") + O(29, 4, 5, 28, "k2"),
    people: R(12, 2, 12, 11, "#0B1B3A", "k3") + R(16.75, 13, 2.5, 5, "#0B1B3A") + R(5.75, 17, 24.5, 2.5, "#0B1B3A") + R(5.75, 17, 2.5, 5, "#0B1B3A") + R(27.75, 17, 2.5, 5, "#0B1B3A") + R(16.75, 17, 2.5, 5, "#0B1B3A") + R(2, 22, 10, 11, "#2450DC", "k1") + R(13, 22, 10, 11, "#FFD15C") + R(24, 22, 10, 11, "#2450DC", "k2"),
    co: R(2, 3, 18, 30, "#0B1B3A") + R(22, 3, 12, 15, "#2450DC", "k1") + R(22, 20, 12, 8, "#FFD15C", "k3") + R(22, 30, 12, 3, "#8FA8F5", "k2"),
    sw: R(2, 4, 32, 28, "#0B1B3A") + R(4.5, 11, 27, 18.5, "#FFFFFF", "kw") + R(5, 6, 3, 3, "#FFD15C", "k3") + R(10, 6, 3, 3, "#8FA8F5") + R(7, 14, 10, 13, "#2450DC", "k1") + R(19, 14, 10, 5, "#0B1B3A") + R(19, 22, 7, 5, "#8FA8F5", "k2"),
    ai: R(2, 24, 4, 8, "#0B1B3A") + R(8, 16, 4, 16, "#0B1B3A", "k1") + R(14, 20, 4, 12, "#0B1B3A") + R(20, 8, 4, 24, "#2450DC", "k2") + R(26, 13, 4, 19, "#2450DC") + R(31, 4, 3, 28, "#2450DC", "k1") + R(2, 11, 32, 2.5, "#FFD15C", "k3"),
    shop: `<rect x="11.25" y="3.25" width="13.5" height="12" fill="none" stroke="#2450DC" stroke-width="2.5" class="k1"></rect>` + R(4, 12, 28, 22, "#0B1B3A") + R(20, 21, 8, 8, "#FFD15C", "k3"),
    brand: R(13, 2, 10, 5, "#2450DC", "k1") + R(15, 7, 6, 4, "#0B1B3A") + R(8, 11, 20, 23, "#0B1B3A") + R(8, 17, 20, 10, "#FFD15C", "k3") + R(11, 20, 9, 2.5, "#0B1B3A"),
    whole: R(10.5, 3, 15, 14, "#2450DC", "k1") + R(16.5, 3, 3, 6, "#FFD15C", "k3") + R(2, 19, 15, 14, "#0B1B3A") + R(19, 19, 15, 14, "#0B1B3A", "k2") + R(8, 19, 3, 6, "#FFD15C") + R(25, 19, 3, 6, "#FFD15C"),
    svc: R(2, 4, 18, 7, "#0B1B3A") + R(9, 14.5, 25, 7, "#2450DC", "k1") + R(5, 25, 15, 7, "#0B1B3A", "k2") + R(23, 25, 7, 7, "#FFD15C", "k3"),
    pro: `<rect x="12.25" y="4.25" width="11.5" height="9" fill="none" stroke="#0B1B3A" stroke-width="2.5" class="k1"></rect>` + R(2, 11, 32, 22, "#0B1B3A") + R(2, 20, 32, 2.5, "#2450DC") + R(15, 17.5, 6, 7.5, "#FFD15C", "k3"),
    cafe: R(10, 2, 2.5, 6, "#2450DC", "k1") + R(17, 2, 2.5, 6, "#2450DC", "k2") + `<rect x="24.25" y="14.25" width="8.5" height="9" fill="none" stroke="#0B1B3A" stroke-width="2.5"></rect>` + R(5, 10, 21, 18, "#0B1B3A") + R(5, 15, 21, 4, "#FFD15C", "k3") + R(2, 30, 27, 3, "#2450DC"),
    hosp: R(2, 3, 8, 9, "#2450DC") + R(10, 3, 8, 9, "#FFD15C", "k3") + R(18, 3, 8, 9, "#2450DC") + R(26, 3, 8, 9, "#FFD15C", "k3") + R(4, 12, 28, 21, "#0B1B3A") + R(8, 17, 8, 8, "#8FA8F5", "k1") + R(20, 19, 8, 14, "#FFFFFF", "kw"),
    other: R(2, 2, 15, 15, "#0B1B3A", "k1") + R(19, 2, 15, 15, "#2450DC") + R(2, 19, 15, 15, "#FFD15C", "k3") + `<rect x="20" y="20" width="13" height="13" fill="none" stroke="#2450DC" stroke-width="2" stroke-dasharray="3 2.5" class="k2"></rect>`,
    acct: R(5, 2, 26, 32, "#0B1B3A") + R(9, 7, 18, 3, "#FFFFFF", "kw") + R(9, 13, 18, 3, "#FFFFFF", "kw") + R(9, 19, 9, 3, "#FFFFFF", "kw") + R(19, 21, 8, 8, "#FFD15C", "k3"),
    founder: R(2, 25, 10, 9, "#0B1B3A") + R(12, 18, 10, 16, "#2450DC", "k1") + R(22, 11, 12, 23, "#0B1B3A") + R(24.5, 1, 2.5, 10, "#0B1B3A") + R(27, 1, 7, 6, "#FFD15C", "k3"),
    fin: R(4, 2, 28, 32, "#0B1B3A") + R(8, 6, 20, 8, "#FFD15C", "k3") + R(8, 18, 6, 6, "#FFFFFF", "kw") + R(15, 18, 6, 6, "#FFFFFF", "kw") + R(22, 18, 6, 6, "#FFFFFF", "kw") + R(8, 25, 6, 6, "#FFFFFF", "kw") + R(15, 25, 6, 6, "#FFFFFF", "kw") + R(22, 25, 6, 6, "#2450DC", "k1"),
    board: R(9, 11, 18, 14, "#0B1B3A") + R(9, 2, 7, 7, "#2450DC", "k1") + R(20, 2, 7, 7, "#2450DC") + R(9, 27, 7, 7, "#2450DC") + R(20, 27, 7, 7, "#FFD15C", "k3") + R(0, 14.5, 7, 7, "#2450DC", "k2") + R(29, 14.5, 7, 7, "#2450DC") + R(12, 15, 12, 2.5, "#8FA8F5") + R(12, 19.5, 8, 2.5, "#8FA8F5"),
    price: R(2, 22, 7, 10, "#2450DC", "k1") + O(11, 17, 7, 15, "k2") + O(19, 11, 7, 21, "k2") + O(27, 4, 7, 28, "k2") + R(2, 16, 7, 4, "#FFD15C", "k3"),
    about: R(2, 12, 22, 22, "#0B1B3A") + R(12, 2, 22, 22, "#2450DC", "k1") + R(12, 12, 12, 12, "#FFD15C", "k3"),
    int: R(2, 3, 8, 8, "#0B1B3A", "k1") + R(2, 14, 8, 8, "#0B1B3A") + R(2, 25, 8, 8, "#0B1B3A", "k2") + R(10, 5.75, 9, 2.5, "#0B1B3A") + R(10, 16.75, 9, 2.5, "#0B1B3A") + R(10, 27.75, 9, 2.5, "#0B1B3A") + R(19, 3, 15, 30, "#2450DC") + R(23, 14, 7, 8, "#FFD15C", "k3")
  };
  const IK = { "software.html": "sw", "ai-usage.html": "ai", "online-stores.html": "shop", "consumer-brands.html": "brand", "wholesale.html": "whole", "services.html": "svc", "professional-services.html": "pro", "hospitality.html": "cafe", "retail.html": "hosp", "other-industries.html": "other" };
  const pgk = (PROD.find((x) => x[0] === cur) || [])[3] || IK[cur] || { "accountants.html": "acct", "pricing.html": "price", "about.html": "about", "founders.html": "founder", "finance-leads.html": "fin", "investors.html": "board" }[cur];
  const ic = (k) => `<svg class="nv-ic ni-${k}" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">${ICON[k]}</svg>`;
  global.caIcon = ic; global.caIK = IK;
  const top = (h, l, act, menu) => `<div class="nd"><a class="nd-t" href="${h}"${act ? ' data-on="1"' : ""}>${l}${menu ? '<span aria-hidden="true" class="nd-c"></span>' : ""}</a>${menu || ""}</div>`;
  const prodMenu = `<div class="nd-m nv-p nv-prod"><div class="nv-grid">${PROD.map(([h, l, t, k], i) => `<a href="${h}" data-k="${k}" style="--i:${i}"${h === cur ? ' aria-current="page"' : ""}>${ic(k)}<span><b>${l}<i class="nv-go" aria-hidden="true"></i></b><em>${t}</em></span></a>`).join("")}</div><a class="nv-feat" href="index.html#cycle"><svg class="nv-mark" width="72" height="72" viewBox="0 0 26 26" aria-hidden="true"><rect class="mk-a" x="0" y="9" width="17" height="17" fill="#FFFFFF"></rect><rect class="mk-b" x="9" y="0" width="17" height="17" fill="#2450DC"></rect><rect class="mk-c" x="9" y="9" width="8" height="8" fill="#FFD15C"></rect></svg><span class="nv-leg"><i class="lg-a"></i>The books, what happened</span><span class="nv-leg"><i class="lg-b"></i>The plan, what happens next</span><span class="nv-leg"><i class="lg-c"></i>Today, where they meet</span><span class="nv-end"><b>One ledger under all six.</b><em>Follow one customer through the whole system</em></span></a></div>`;
  const whoMenu = `<div class="nd-m nv-p nv-who"><div class="nv-col nv-ind"><span class="nv-h">By industry</span>${IND.map(([h, l], i) => `<a href="${h}" style="--i:${i}"${h === cur ? ' aria-current="page"' : ""}>${ic(IK[h] || "other")}<span><b>${l}</b><em>${INDT[h] || ""}</em></span></a>`).join("")}</div><div class="nv-col nv-role"><span class="nv-h">By role</span>${[["ceo", "Founders and CEOs", "How long the money lasts, in plain words", "founder"], ["cfo", "Finance leads", "In-house or fractional: close faster, plan on closed books", "fin"], ["inv", "Investors and boards", "Packs, updates and a data room that agree", "board"]].map(([id, l, t, k], i) => `<a href="${{ ceo: "founders.html", cfo: "finance-leads.html", inv: "investors.html" }[id]}" style="--i:${i + 2}"${{ ceo: "founders.html", cfo: "finance-leads.html", inv: "investors.html" }[id] === cur ? ' aria-current="page"' : ""}>${ic(k)}<span><b>${l}</b><em>${t}</em></span></a>`).join("")}</div><a class="nv-acct" href="accountants.html"${cur === "accountants.html" ? ' aria-current="page"' : ""}><span class="nv-h">By profession</span>${ic("acct")}<b>Accountants and bookkeepers</b><em>Less typing. More of the work only you can do.</em><i>Work a review queue yourself</i></a></div>`;
  const dd = () => [top("index.html#look-inside", "Product", inP, prodMenu), top("index.html#who", "Built for", inW, whoMenu), top("pricing.html", "Pricing", cur === "pricing.html"), top("about.html", "About", cur === "about.html")].join("\n");
  const mrow = ([hh, l], n) => { const sub = subOf(hh); const MK = { "software.html": "other", "accountants.html": "acct", "pricing.html": "price", "about.html": "about", "founders.html": "founder", "finance-leads.html": "fin", "investors.html": "board" }; const pk = (PROD.find((x) => x[0] === hh) || [])[3] || MK[hh]; const num = pk ? ic(pk) : "<small>" + (n < 9 ? "0" : "") + (n + 1) + "</small>"; return sub ? `<details${on(hh) ? " open" : ""}><summary>${num}<b>${l}</b><i aria-hidden="true"></i></summary><div>${hh === "software.html" ? "" : `<a href="${hh}" class="mn-ov">Overview <span aria-hidden="true">&rarr;</span></a>`}${sub.map(([a, t, pg]) => `<a href="${pg ? a : hh + "#" + a}"${pg && a === cur ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</div></details>` : `<a href="${hh}" class="mn-row${on(hh) ? " mn-cur" : ""}">${num}<b>${l}</b><span aria-hidden="true">&rarr;</span></a>`; };
  const mnav = () => { let n = 0; const g = (t, list) => `<p class="mn-g">${t}</p>` + list.map((x) => mrow(x, n++)).join("\n"); return g("Product", PROD.map((x) => [x[0], x[1]])) + g("Built for", [["software.html", "Industries"], ["founders.html", "Founders"], ["finance-leads.html", "Finance leads"], ["investors.html", "Investors"], ["accountants.html", "Accountants"]]) + g("More", [["pricing.html", "Pricing"], ["about.html", "About"]]); };
  const link = (pad) => NAV.map(([h, l]) => `<a href="${h}" style="color: ${on(h) ? "#2450DC" : "#0B1B3A"}; text-decoration: none; padding: ${pad}; border-bottom: 2px solid ${on(h) ? "#2450DC" : "transparent"}">${l}</a>`).join("\n");
  return `<header style="position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.94); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid #0B1B3A">
<div class="wrap" style="padding-top: 10px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px 16px">
<a href="index.html" aria-label="{{brand}} home" style="display: flex; align-items: center; gap: 10px; color: #0B1B3A; text-decoration: none; min-height: 44px; min-width: 0">
<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" style="flex: none"><rect x="0" y="9" width="17" height="17" style="fill: #0B1B3A"></rect><rect x="9" y="0" width="17" height="17" style="fill: #2450DC"></rect><rect x="9" y="9" width="8" height="8" style="fill: var(--pop)"></rect></svg>
<span style="font-stretch: 125%; font-weight: 800; font-size: 20px; letter-spacing: -0.02em">{{brand}}<span class="tm" aria-hidden="true">&trade;</span></span>
</a>
<nav class="navlinks" aria-label="Main" style="align-items: center; gap: 4px 26px; font-size: 15px; font-weight: 600">
${dd()}
</nav>
<div class="hd-r"><a href="#access" class="b-teal" style="flex: none; background: #0B1B3A; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 11px 16px; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 8px">Early access <span aria-hidden="true">&rarr;</span></a>
<button type="button" class="mn-btn" aria-expanded="false" aria-controls="mn" aria-label="Menu"><i></i><i></i><i></i></button></div>
</div>
<div id="mn" class="mn">
<nav aria-label="All pages">
${mnav()}
</nav>
<a href="#access" class="mn-cta">Get early access <span aria-hidden="true">&rarr;</span></a>
<p>In development. Product screens use sample data.</p>
</div>
<nav class="subnav nosb" aria-label="Pages" style="border-top: 1px solid #E3E7EE; padding: 0 24px; gap: 22px; font-size: 14px; font-weight: 700; overflow-x: auto; white-space: nowrap">
${link("11px 0 9px 0")}
</nav>${isInd(cur) ? `<nav class="subnav nosb onpage sp sp-ind" aria-label="Industries" style="border-top: 1px solid #E3E7EE; padding: 0 24px; gap: 16px; font-size: 13px; font-weight: 600; overflow-x: auto; white-space: nowrap; background: #F6F8FC"><span class="sp-pg sp-ic">${ic("other")}Built for</span>${IND.map(([a, t]) => `<a href="${a}"${a === cur ? ' aria-current="page"' : ""} style="color: ${a === cur ? "#2450DC" : "#2B3648"}; text-decoration: none; padding: 9px 0">${t}</a>`).join("")}</nav>` : ""}${SUBS[cur] ? `<nav class="subnav nosb onpage sp" aria-label="On this page" style="border-top: 1px solid #E3E7EE; padding: 0 24px; gap: 16px; font-size: 13px; font-weight: 600; overflow-x: auto; white-space: nowrap; background: #F6F8FC"><span class="sp-pg${pgk ? " sp-ic" : ""}">${pgk ? ic(pgk) : ""}${(IND.find((x) => x[0] === cur) || NAV.find((x) => x[0] === cur) || [["founders.html", "Founders and CEOs"], ["finance-leads.html", "Finance leads"], ["investors.html", "Investors and boards"]].find((x) => x[0] === cur) || ["", ""])[1]}</span>${SUBS[cur].map(([a, t]) => `<a href="#${a}" style="color: #2B3648; text-decoration: none; padding: 9px 0">${t}</a>`).join("")}</nav>` : ""}
<div class="prog" aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: -3px; height: 3px; background: linear-gradient(90deg, #0B1B3A, #2450DC 60%, var(--pop))"></div>
</header>`;
}
function subhero(ey, h1a, h1b, lead, inner, two) {
  return `<section style="position: relative; overflow: clip; background: #0B1B3A; color: #FFFFFF">
<div aria-hidden="true" style="position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 44px 44px; -webkit-mask-image: linear-gradient(180deg, #000 0, transparent 70%); mask-image: linear-gradient(180deg, #000 0, transparent 70%)"></div>
<div aria-hidden="true" class="a1" style="position: absolute; width: 120vw; max-width: 900px; aspect-ratio: 1; left: -35%; top: -220px; background: radial-gradient(closest-side, rgba(36,80,220,0.55), rgba(36,80,220,0))"></div>
<div class="wrap${two ? " hero2" : ""}" style="position: relative; z-index: 1; padding-top: 56px; padding-bottom: 80px; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 18px; max-width: 900px">
<p class="ey r1" style="color: var(--hl)">${ey}</p>
<h1 class="r2" style="margin: 0; font-stretch: 125%; font-weight: 800; font-size: clamp(40px, 9.6vw, 96px); line-height: 0.94; letter-spacing: -0.04em; text-wrap: balance">${h1a} <span style="color: var(--hl)">${h1b}</span></h1>
<p class="r3" style="margin: 0; max-width: 36em; font-size: clamp(18px, 2vw, 21px); line-height: 1.5; color: #E1E7F2">${lead}</p>
</div>
${inner || ""}
</div>
</section>`;
}
const card = (href, n, t, d) => `<a href="${href}" class="bt" style="display: flex; flex-direction: column; gap: 8px; padding: 22px 20px; background: #FFFFFF; color: #0B1B3A; text-decoration: none; border: 1px solid #0B1B3A; box-shadow: 6px 6px 0 #0B1B3A"><span style="font-stretch: 125%; font-weight: 800; font-size: 13px; color: #2450DC">${n}</span><b style="font-stretch: 112%; font-weight: 800; font-size: 24px; line-height: 1.1; letter-spacing: -0.01em">${t}</b><span style="font-size: 16px; line-height: 1.45; color: #2B3648">${d}</span><span style="margin-top: 6px; font-weight: 800; color: #2450DC">Open <span aria-hidden="true">&rarr;</span></span></a>`;
const LOOK = [
  ["revenue.html#contracts", "Revenue", "From signed deal to cash, without retyping.", "Build a contract", "{{n:revenue.html}} demos"],
  ["books.html#approvals", "Books", "Agents keep them. You approve.", "Approve 200 entries in two minutes", "{{n:books.html}} demos"],
  ["plan.html#scenarios", "Plan", "Forecast and runway, straight from the books.", "Add a hire and watch runway move", "{{n:plan.html}} demos"],
  ["company.html#cap-table", "Company", "Cap table, data room and records.", "Model a funding round", "{{n:company.html}} demos"],
  ["integrations.html#switch", "Switching", "Bring your books from QuickBooks, Xero or NetSuite.", "Run a switch, month by month", "{{n:integrations.html}} demos"],
  ["software.html", "Industries", "Software, stores, services, hospitality and more.", "See your kind of business", "5 industries"],
  ["accountants.html#review", "For accountants", "Less typing. More of the work only you can do.", "Work a review queue and sign off", "{{n:accountants.html}} demos"],
  ["pricing.html", "Pricing", "One price by company size. Everything included.", "Find your price", "From $49"]
];
const explore = `<section id="look-inside" style="padding: 88px 0; border-bottom: 1px solid #D5DBE5">
<div class="wrap" style="display: flex; flex-direction: column; gap: 28px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 860px"><p class="ey">Look inside</p><h2 class="h2">Try the product <span style="color: #2450DC">before it exists.</span></h2><p class="lead">Nothing on this site is a screenshot. Every page has working demos on sample data. Pick one thing to try.</p></div>
<div class="rv lk-grid">
${LOOK.map((c, i) => `<a href="${c[0]}" class="lk bt"><span class="lk-n">0${i + 1}</span><b>${c[1]}</b><em>${c[4]}</em><p>${c[2]}</p><span class="lk-try"><small>TRY</small> ${c[3]}&nbsp;<i aria-hidden="true">&rarr;</i></span></a>`).join("\n")}
</div>
</div>
</section>`;
const integ = subhero("Integrations", "It plugs into the tools", "you already run.", "These are the integrations planned for early access. None is live yet, and the list will change as we build.") + `
<section style="padding: 56px 0 88px 0; border-bottom: 1px solid #D5DBE5; background: #F6F8FC">
<div class="wrap" style="display: flex; flex-direction: column; gap: 22px">
<div class="hs" role="group" aria-label="Category" style="gap: 8px; padding-bottom: 8px">
<sc-for list="{{integCats}}" as="c" hint-placeholder-count="9">
<button type="button" onClick="{{c.pick}}" aria-pressed="{{c.pressed}}" style="flex: none; white-space: nowrap; padding: 11px 16px; min-height: 44px; border: 1px solid #0B1B3A; background: {{c.bg}}; color: {{c.fg}}; font-weight: 700; font-size: 15px; cursor: pointer; transition: background .2s">{{c.label}}</button>
</sc-for>
</div>
<p aria-live="polite" style="margin: 0; font-size: 14px; font-weight: 700; color: #4B5565">{{integCount}}, all planned</p>
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(300px, 46%), 1fr)); gap: 12px">
<sc-for list="{{integ}}" as="g" hint-placeholder-count="20">
<div class="bt" style="background: #FFFFFF; border: 1px solid #0B1B3A; padding: 14px; display: flex; flex-direction: column; gap: 6px; min-width: 0">
<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px"><span aria-hidden="true" style="flex: none; width: 40px; height: 40px; background: #0B1B3A; color: var(--hl); font-stretch: 125%; font-weight: 800; font-size: 19px; display: flex; align-items: center; justify-content: center">{{g.mono}}</span><span style="flex: none; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; padding: 3px 6px; background: var(--hlp); border: 1px solid #0B1B3A">PLANNED</span></div>
<b style="font-stretch: 112%; font-weight: 800; font-size: 18px; line-height: 1.15">{{g.name}}</b>
<span style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #2450DC">{{g.cat}}</span>
<span style="font-size: 14px; line-height: 1.4; color: #2B3648">{{g.line}}</span>
</div>
</sc-for>
</div>
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4B5565; max-width: 60em">Product names belong to their owners and are listed only to show what we plan to connect to. No partnership or endorsement is implied.</p>
</div>
</section>`;
const productTop = subhero("The books", "A full accounting system,", "run by agents you supervise.", "The finished product first: statements that are current today, on sample data. How they get that way is the rest of this page.", '<div class="r5 st-win" data-widget="statements"></div>');
const FT = [["Product", [["revenue.html", "Revenue"], ["books.html", "Books"], ["plan.html", "Plan"], ["people.html", "People"], ["company.html", "Company"], ["integrations.html", "Integrations"]]], ["By industry", IND.map((x) => [x[0], x[1]]), "ft-two"], ["By role", [["founders.html", "Founders and CEOs"], ["finance-leads.html", "Finance leads"], ["investors.html", "Investors and boards"], ["accountants.html", "Accountants and firms"]]], ["Countahead", [["pricing.html", "Pricing"], ["about.html", "About"], ["about.html#contact", "Contact"], ["index.html#look-inside", "Try the demos"]]]];
function glance(k, body, foot, tag) {
  return `<div class="w-panel w-glass hg r4"><div class="hg-top"><b>${k}</b><span>${tag || "Sample data"}</span></div>${body}<p class="hg-foot">${foot}</p></div>`;
}
const hgRev = glance("One deal, followed", `<ol class="hg-chain">${[["Signed", "Harbor Labs, 40 seats", "Nov 18", 1], ["Invoiced", "$12,000, from the contract", "Nov 18", 1], ["In the books", "$4,000 a month from Dec 1", "Today", 2], ["Cash due", "$12,000 on net 30", "Dec 18", 0], ["In the plan", "Recurring revenue $3.97M to $4.02M", "Next 12 months", 0]].map(([a, b, c, st]) => `<li class="${st === 2 ? "hg-now" : st ? "hg-done" : "hg-next"}"><i></i><span><b>${a}</b><em>${b}</em></span><small>${c}</small></li>`).join("")}</ol>`, "Typed once, on the deal. Every later line is derived from it.");
const hgPpl = glance("The team, today", `<div class="hg-kp">${[["24", "people", "22 employees, 2 contractors"], ["3", "open roles", "one offer accepted"], ["$372k", "people cost, November", "plan was $381k"], ["$9k under", "against plan", "one hire started late"]].map(([a, b, c]) => `<div><b>${a}</b><span>${b}</span><em>${c}</em></div>`).join("")}</div>`, "Payroll stays with your payroll provider. Countahead reads it, and keeps the plan and the books in step.");
global.hgPpl = hgPpl;
const hgCo = glance("Who owns the company", `<div class="hg-own" role="img" aria-label="Founders 60 percent, seed investors 25 percent, options granted 9 percent, options available 6 percent"><i style="flex:60;background:#FFFFFF"></i><i style="flex:25;background:#5B8CFF"></i><i style="flex:9;background:#FFD15C"></i><i style="flex:6;background:transparent;outline:1.5px dashed #B9C3D3;outline-offset:-1.5px"></i></div><ul class="hg-leg">${[["#FFFFFF", "Founders", "60%"], ["#5B8CFF", "Seed investors", "25%"], ["#FFD15C", "Options granted", "9%"], ["", "Options available", "6%"]].map(([c, a, b]) => `<li><i style="${c ? "background:" + c : "outline:1.5px dashed #B9C3D3;outline-offset:-1.5px"}"></i><span>${a}</span><b>${b}</b></li>`).join("")}</ul>`, "A record, not the legal register. Every entry links to its approval and its signed document.");
const hgInt = glance("Where the numbers come from", `<div class="hg-flow"><ul>${["Banks and cards", "Payments", "Payroll", "Your CRM", "Stores and tills", "Your old accounting system"].map((x) => `<li>${x}</li>`).join("")}</ul><div class="hg-arrow" aria-hidden="true"></div><div class="hg-led"><svg width="40" height="40" viewBox="0 0 26 26" aria-hidden="true"><rect x="0" y="9" width="17" height="17" fill="#FFFFFF"></rect><rect x="9" y="0" width="17" height="17" fill="#2450DC"></rect><rect x="9" y="9" width="8" height="8" fill="#FFD15C"></rect></svg><b>One ledger</b><em>Read only, unless you say otherwise</em></div></div>`, "Planned connections. None is live yet.", "Planned");
const footer = `<footer class="ft">
<div class="ft-line" aria-hidden="true"><div class="ft-bars">${[34, 41, 38, 49, 55].map((h) => `<i class="ft-p" style="height:${h}%"></i>`).join("")}<i class="ft-n" style="height:63%"></i>${[68, 73, 78, 82, 86, 90].map((h) => `<i class="ft-f" style="height:${h}%"></i>`).join("")}</div></div>
<div class="ft-keyw" aria-hidden="true"><div class="ft-key"><span>What happened</span><span>Today</span><span>What happens next</span></div></div>
<div class="wrap ft-main">
<div class="ft-brand">
<a href="index.html" class="ft-logo" aria-label="{{brand}} home"><svg width="34" height="34" viewBox="0 0 26 26" aria-hidden="true"><rect x="0" y="9" width="17" height="17" style="fill: #0B1B3A"></rect><rect x="9" y="0" width="17" height="17" style="fill: #2450DC"></rect><rect x="9" y="9" width="8" height="8" style="fill: var(--pop)"></rect></svg><b>{{brand}}<span class="tm" aria-hidden="true">&trade;</span></b></a>
<p>One ledger for the books and the plan.</p>
<a href="#access" class="ft-cta">Get early access</a>
<a href="mailto:hello@countahead.ai" class="ft-mail">hello@countahead.ai</a>
</div>
<nav class="ft-cols" aria-label="Site">${FT.map(([t, list, c]) => `<div${c ? ` class="${c}"` : ""}><b>${t}</b>${list.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</div>`).join("")}</nav>
</div>
<div class="ft-end"><div class="wrap ft-base"><span class="ft-c"><svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true"><rect x="0" y="9" width="17" height="17" fill="#FFFFFF"></rect><rect x="9" y="0" width="17" height="17" fill="#5B8CFF"></rect><rect x="9" y="9" width="8" height="8" fill="#FFD15C"></rect></svg>&copy; 2026 {{brand}}</span><span class="ft-note">In development. Every product screen on this site is a working design on sample data.</span><span class="ft-legal"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="refunds.html">Billing and refunds</a></span></div></div>
</footer>`;
function demo(id, bg, ey, h2, lead, widget) {
  return `<section id="${id}" style="padding: 88px 0; background: ${bg}; border-bottom: 1px solid #D5DBE5">
<div class="wrap demo2" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 860px"><p class="ey">${ey}</p><h2 class="h2">${h2}</h2><p class="lead">${lead}</p></div>
<div class="w-panel" data-widget="${widget}"></div>
</div>
</section>`;
}
const C = (t) => `<span style="color: #2450DC">${t}</span>`;
const liveLedger = demo("live", "#FFFFFF", "Automated bookkeeping", "Watch the books " + C("do themselves."), "Transactions arrive, agents code and post them, and anything outside your policy waits for you. One is waiting now: approve it.", "ledger");
const headcount = demo("headcount", "#FFFFFF", "Headcount planning", "Plan the team, " + C("see the runway."), "Hiring is more than engineers. Add people by role and see what each does to payroll, revenue and how long the cash lasts.", "headcount");
const ownRunway = demo("your-runway", "#F6F8FC", "Try it with your numbers", "How long does " + C("your") + " money last?", "Three numbers give a rough answer. Your real books give an exact one, updated every day.", "runway");
const planningTop = subhero("The plan", "See where you are going,", "before you get there.", "Your forecast starts from books that are already closed, so it is built on real numbers. Drag across the chart to move from the past into the plan.", '<div class="w-panel w-glass" data-widget="time"></div>', true);
function mock(id, bg, ey, h2, lead, widget) {
  return `<section id="${id}" style="padding: 88px 0; background: ${bg}; border-bottom: 1px solid #D5DBE5">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 860px"><p class="ey">${ey}</p><h2 class="h2">${h2}</h2><p class="lead">${lead}</p></div>
<div class="m-card" data-widget="${widget}"></div>
</div>
</section>`;
}
const revQuote = mock("quotes", "#F6F8FC", "Quotes", "From quote to invoice, " + C("without retyping a field."), "Build a quote from the price book and send it as a page the customer can accept. Acceptance wins the deal, and the invoice, the revenue schedule and the forecast follow from it. Step through one deal.", "quoteflow");
const revTop = subhero("Revenue", "From signed deal to cash,", "without retyping it once.", "The sale is where the numbers start. Capture it once, and the invoices, the cash, the revenue in the books and the forecast all follow from it.", hgRev, true);
const revFlow = mock("how-you-sell", "#FFFFFF", "Pick how you sell", "One record in. " + C("Everything else follows."), "Subscriptions, usage, an online store, a till, services or plain invoices. Choose one and try it.", "revflow");
const revCust = mock("customers", "#F6F8FC", "Customers", "Everything starts with " + C("who you sell to."), "Each customer with its people, contract, invoices, payments and history in one place, and a suggested next step. A basic CRM of its own, or kept in step with the one you already use.", "customer");
const revPipe = mock("pipeline", "#FFFFFF", "Deals", "A pipeline the " + C("forecast can read."), "A simple pipeline of its own, or synced from HubSpot or Salesforce. Either way, the same deals feed the forecast and turn into contracts, and each one carries a health score that shows its reason.", "pipeline");
const revLife = mock("contracts", "#F6F8FC", "Contracts", "Approve, sign, " + C("amend, renew."), "Terms are filled in from the deal in your CRM and the customer signs on the platform. The signed contract is then the record, and every change to it flows through to billing, revenue and the forecast. Walk one through.", "lifecycle");
const revCollect = mock("collections", "#FFFFFF", "Collections", "An agent that " + C("chases what you are owed."), "It watches every unpaid invoice and drafts the follow-up, in the right tone, to the right person. You approve, or let the routine ones go on their own.", "collect");
const revArr = mock("recurring", "#F6F8FC", "For subscription businesses", "Recurring revenue, " + C("customer by customer."), "Growth, retention and what moved this month, then the same revenue by customer, by cohort, by geography and by segment.", "arr");
const revComm = mock("commissions", "#FFFFFF", "For sales teams", "Commissions that " + C("calculate themselves."), "Set the rules once: rates for new business and upsells, what happens above quota, when it is paid and when it is clawed back. Statements follow from signed contracts and cash received.", "comm");
const planScen = mock("scenarios", "#FFFFFF", "Scenarios", "Three futures, " + C("one set of books."), "Build each case from real decisions: who you hire, whether you raise, a price change, a lost customer. See what each does to cash, revenue and runway, what it is most exposed to, and pick the one the model and the board pack run on.", "scen");
const planMethod = mock("forecast-methods", "#F6F8FC", "Two ways to forecast", "Start from the goal, " + C("or from the team."), "Top down tells you what a target requires. Bottom up tells you where your hires and quotas land. Good plans check one against the other.", "method");
const planPack = mock("board-pack", "#FFFFFF", "Board packs", "The board pack " + C("builds itself."), "A real deck, not a data dump, with a template for each kind of business. Pick the slides, and each one fills itself from the ledger and the plan, with the story drafted for you to edit.", "pack");
const different = `<section id="different" style="padding: 80px 0; border-bottom: 1px solid #D5DBE5">
<div class="wrap" style="display: flex; flex-direction: column; gap: 26px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 860px"><p class="ey">Why it is different</p><h2 class="h2">Every other tool does ${C("part of the job.")}</h2><p class="lead">Finance has twelve jobs across revenue, the books and the plan. Tick what you use today and see what your stack covers, then compare it with one system.</p></div>
<div class="rv m-legend"><span><i style="background:#2450DC;border-color:#2450DC"></i>Built in</span><span><i style="background:#B9C3D3;border-color:#B9C3D3"></i>Partly, or by hand</span><span><i></i>Not covered</span></div>
<div class="rv m-card" data-widget="compare"></div>
<p class="rv" style="margin: 0; font-size: 13px; line-height: 1.5; color: #4B5565; max-width: 70em">Our general reading of each kind of tool as of November 2026. Individual products differ and change quickly. Tap a name for detail.</p>
</div>
</section>`;
const cycleSec = mock("cycle", "#F6F8FC", "One customer, start to finish", "From first hello " + C("to cash in the bank."), "Follow one customer through the whole system. Watch which numbers move at each step, and notice that nobody types anything twice.", "cycle");
const analyticsSec = mock("analytics", "#F6F8FC", "Analytics", "The dashboard " + C("for your kind of business."), "The measures that matter are different for software, a store, a services firm or a cafe. Each comes ready with its own eight, built on the same books. Any other business starts from a general set and swaps in its own.", "analytics");
const revPlanSec = mock("revenue-forecast", "#FFFFFF", "Revenue forecast", "Retention, pipeline " + C("and new hires, together."), "Next year's revenue is what you keep, plus what is in the pipeline, plus what the team can sell. Move each one.", "revplan");
const bulkSec = mock("approvals", "#F6F8FC", "Approvals", "Two hundred entries, " + C("checked in two minutes."), "Finance teams already approve in batches. What makes it safe is everything around the click: rules you wrote, a sample you check, exceptions kept out, and a record of who approved what.", "bulk");
const controlSec = mock("control", "#FFFFFF", "Controls", "Every action has an owner, " + C("a limit and a record."), "Automation is only useful in finance if you can see exactly what it did and why. So here is who may do what, which months are closed for good, and the full history of any entry.", "controlx");
const groupSec = mock("group", "#F6F8FC", "Groups", "Several companies, " + C("one set of numbers."), "Each company keeps its own books, in its own currency and under its own country's rules. The group view adds them up, removes what they charge each other and translates the rest, every day and not only at year end.", "group");
const policySec = mock("policies", "#F6F8FC", "Policies", "Write the rule once. " + C("The software follows it."), "Two rulebooks, kept apart. One tells the agents what they may do alone, when they must ask and what they may send. The other is the company handbook for your people. Each policy is a few numbers. Change one and the written rules rewrite themselves, the software follows them, and everyone is asked to read the new version.", "policy");
const todaySec = mock("today", "#FFFFFF", "Your daily view", "What is behind you, what needs you, " + C("and what is ahead."), "One screen to start the day. Ask it anything, typed or out loud, then see the month that just closed, the few things waiting for you, and what is coming.", "today");
const revRecSec = mock("recognition", "#FFFFFF", "Revenue recognition", "What you have been paid for " + C("and not yet earned."), "Deferred revenue by customer and by type with the months it will be earned in, one price shared across several promises, and the sales number tied to the accounting number. It follows the five steps of ASC 606 and IFRS 15.", "revrec");
const askSec = mock("ask", "#F6F8FC", "Ask", "Ask the ledger, " + C("out loud if you like."), "Tap the microphone and ask out loud, or type. Ask what happened and the books answer. Ask what happens next and the plan answers. Either way you get a sentence, the numbers and the working.", "ask");
const taxSec = mock("tax", "#FFFFFF", "Tax", "Tax-ready books, " + C("every day of the year."), "Sales tax and VAT by place, the adjustments your income tax return needs, contractor forms and every deadline, kept current as the books are written. Your adviser files; nothing is a scramble.", "tax");
const integTop = subhero("Integrations", "It plugs into the tools", "you already run.", "Money, sales, people and work all flow into one ledger. These are the integrations planned so far. None is live yet, and the list will grow with what early users ask for.", hgInt, true);
const switchSec = mock("switch", "#F6F8FC", "Switching", "Bring your books with you, " + C("and check them before you switch."), "Connect the system you use today, read only. Your history comes across, an agent proposes how your accounts map, and every month is checked against your old books before anything is relied on. Then run the two side by side for as long as you like.", "switchover");
const integSec = `<section id="directory" style="padding: 56px 0 88px; border-bottom: 1px solid #D5DBE5"><div class="wrap"><div class="m-card" data-widget="integrations"></div></div></section>`;
const optSec = mock("options", "#F6F8FC", "Options", "Every grant, " + C("and what has vested."), "The option register with vesting worked out for each person, the monthly expense posted to the books, and new grants drafted with the board consent they need.", "options");
const cocalSec = mock("calendar", "#F6F8FC", "Reminders", "Nothing about the company " + C("gets forgotten."), "Board meetings, filings, vesting dates, renewals and investor updates, read from your documents and put on one calendar.", "cocal");
const basisSec = mock("basis", "#FFFFFF", "Accounting rules", "Cash or accrual, official or adjusted, " + C("one set of entries."), "Different readers need different views of the same business. They all come from one ledger, with the difference between them shown line by line.", "basis");
const forecastSec = mock("forecast", "#F6F8FC", "Revenue forecast", "One forecast, " + C("built two ways."), "Build it up from the customers you have, the deals already open and what the team can sell. Or start from a goal and see what it takes. Good plans check one against the other.", "forecast");
const modelSec = mock("model", "#FFFFFF", "Financial model", "The spreadsheet investors ask for, " + C("already built."), "A full three-statement operating model for 24 months: revenue build, people, income statement, balance sheet and cash flow. It reads the three cases from Scenarios, with live formulas and an Excel export.", "model");
const dataroomSec = mock("data-room", "#FFFFFF", "Data room", "A data room that is " + C("always ready."), "Accounts, model, contracts, cap table and company records in one place, kept current from the system. Share it by link, see who read what, and answer their questions from the ledger.", "dataroom");
const auditSec = mock("audit", "#F6F8FC", "Audit readiness", "Run your own audit " + C("before the auditors do."), "Over a thousand checks run every night. Sales are sample-tested against contracts, the auditor's usual requests are answered in advance, and any number traces to the money in the bank.", "audit");
const companyTop = subhero("Company", "Ready for investors,", "every day.", "Your cap table, option grants, data room, board minutes and filing deadlines, kept current from the same books and the same plan. A fundraise, a board meeting or an audit starts from what is already there.", hgCo, true);
const capSec = mock("cap-table", "#FFFFFF", "Cap table", "Who owns what, " + C("and what a round would change."), "Shares, options and investors in one table that agrees to the books. Move the sliders to model a raise.", "captable");
const codocsSec = mock("records", "#F6F8FC", "Company records", "The documents, " + C("read and remembered."), "Shareholder agreements, the option plan, board minutes and filings, with the key terms pulled out and the deadlines tracked.", "codocs");
const draftSec = mock("drafting", "#FFFFFF", "Drafting", "From rough notes " + C("to a formal document."), "Drop in a call transcript, an email thread or your own notes. An agent drafts the minutes, the resolution or the action list, checks it against your records and leaves the sign-off to you and your lawyer.", "drafter");
const invSec = mock("investor-update", "#F6F8FC", "Investor updates", "The monthly update " + C("writes itself."), "The board pack is for the meeting. This is the short email investors read on their phone: the numbers, what went well, what did not, and what you need from them. Drafted from the books each month for you to edit and approve.", "invupdate");
const budgetSec = mock("budgets", "#F6F8FC", "Budgets", "Budget against actual, " + C("by the person who owns it."), "Each department has an owner and a budget the board approved. Pick a team, switch between the month and the year, tap a line to see why it moved, and ask to move budget between lines.", "budget");
const S = sections;
const aboutSecs = require("./about.js")(subhero, C);
const pages = [
  ["index.html", "Countahead: your books are done, your future is clear", "One ledger for the past and the future. Agents keep the books inside the rules you set, and your forecast, runway and board pack read the same numbers.", [hero, marquee, S.mani, cycleSec, different, S.who, explore, S.access]],
  ["books.html", "Books: the accounting system | Countahead", "A full double-entry accounting system run by agents you supervise, with approvals, period locks and a complete audit trail.", [productTop, S.accounting, groupSec, basisSec, bulkSec, controlSec, policySec, taxSec, auditSec, S.access]],
  ["plan.html", "Plan: forecast, scenarios and runway | Countahead", "A forecast that reads the ledger directly. Test a hire or a growth rate and see runway move.", [planningTop, todaySec, analyticsSec, forecastSec, planScen, budgetSec, modelSec, planPack, invSec, S.access]],
  ["revenue.html", "Revenue: contracts, billing and commissions | Countahead", "Capture the sale once. Invoices, cash, revenue recognition and the forecast follow, for subscriptions, online stores and services.", [revTop, revFlow, revCust, revPipe, revQuote, revLife, revCollect, revRecSec, revArr, revComm, S.access]],
  ["company.html", "Company: cap table and records | Countahead", "Cap table, round modelling, a live investor data room and company records, tied to the same books and plan.", [companyTop, capSec, optSec, dataroomSec, codocsSec, draftSec, cocalSec, S.access]],
  ["integrations.html", "Integrations | Countahead", "How to bring your books across from QuickBooks, Xero, NetSuite or any other system, and the bank, payment, payroll, commerce and deal tools Countahead plans to connect to.", [integTop, switchSec, integSec, S.access]],
  ["about.html", "About | Countahead", "Why Countahead exists, the rules it is built by, who is building it and where it stands today.", [...aboutSecs, S.access]]
];
require("./sectors.js")(subhero, mock, C, S.access).forEach((p) => pages.push(p));
/* role pages: founders, finance leads, investors. Problems and questions come from the same list the home page uses. */
const PEOPLE = new Function("return " + /people\(\) \{\s*return (\[[\s\S]*?\n\]);\s*\}/.exec(logic)[1])();
const kp4 = (rows) => `<div class="hg-kp">${rows.map(([a, b, c]) => `<div><b>${a}</b><span>${b}</span><em>${c}</em></div>`).join("")}</div>`;
const ROLEP = [
  ["ceo", "founders.html", "For founders and CEOs", "Know your runway.", "Not your debits and credits.", "Books that are current every day without you doing them, and a plain answer to what your next hire or your next round does to runway. Your accountant still reviews and signs.", glance("The company, this morning", kp4([["$3.06M", "cash", "20 months of runway"], ["$215k", "net burn, November", "$8k over plan"], ["July 2028", "cash runs out", "on the base plan"], ["8", "things need you today", "most take one tap"]]), "One screen to start the day. Ask it anything, typed or out loud."), "Countahead for founders and CEOs: runway, burn and books that are current", "For founders: books kept current by agents, runway and burn in plain words, and a board pack, investor update and data room built from the ledger.", [mock("today", "#F6F8FC", "Your morning", "One screen, " + C("before your first meeting."), "Cash, burn, runway and the handful of things that need a decision from you. Everything else was handled inside the rules you set.", "today"), mock("scenarios", "#FFFFFF", "Before you decide", "Test the hire or the raise, " + C("then decide."), "Add a hire, move a raise or lose a customer, and watch runway change. The starting point is your closed books, so it is never a guess about where you are today.", "scen"), mock("ask", "#F6F8FC", "Ask", "Ask in plain words, " + C("get a number with its source."), "Type or speak. Questions about the past are answered from the books, and questions about the future from the plan.", "ask")], "founders and CEOs"],
  ["cfo", "finance-leads.html", "For finance leads and fractional CFOs", "Close in days.", "Forecast without rebuilding.", "Entries are reconciled as they arrive, inside a policy you write, so month end is only the exceptions. The close takes days, and fewer as your rules cover more. The forecast, the model and the board pack read the same ledger.", glance("November, closed", kp4([["3 days", "to close the month", "after month end"], ["211 of 214", "entries routine", "matched your rules"], ["3", "kept out for a look", "never part of a batch"], ["8 of 12", "audit requests ready", "before anyone asks"]]), "The close is the exceptions. Everything else was reconciled as it happened."), "Countahead for finance leads: a faster close and a forecast on the ledger", "For CFOs, heads of finance and fractional CFOs: a full general ledger run by supervised agents, controls you set, and planning on the same numbers.", [mock("approvals", "#F6F8FC", "Approvals", "Approve the routine in one go, " + C("look hard at the rest."), "Entries that match a rule you wrote arrive as a batch, with the rule shown. Anything new, large or unusual is kept out for you.", "bulk"), mock("control", "#FFFFFF", "Controls", "Your policy, " + C("enforced by the system."), "Who may prepare, approve, post, pay and lock. Try to change a role: some changes are refused, and the table tells you why.", "controlx"), mock("scenarios", "#F6F8FC", "Planning", "A forecast that starts " + C("from the closed month."), "Scenarios are built from hires, raises, prices and customers, on top of actuals that are already reconciled. No export and no rebuild.", "scen")], "finance leads"],
  ["inv", "investors.html", "For investors and boards", "Numbers you can trace,", "straight from the ledger.", "When a company you back runs on Countahead, its update, its board pack and its data room come from the same ledger, on the same definitions every month. You see what the company chooses to share with you.", glance("What reaches you", kp4([["Monthly", "investor update", "drafted from the books"], ["17 slides", "board pack", "filled from the ledger"], ["18", "documents in the data room", "11 always current"], ["1", "definition per metric", "changes are recorded"]]), "The company decides what you see and can end access at any time."), "Countahead for investors and board members", "For investors and board members: updates, board packs and a data room drawn from a company's own ledger, on consistent definitions. Not an audit.", [mock("investor-update", "#F6F8FC", "The monthly update", "The same format, " + C("every month, on time."), "Drafted from the closed books the day the month is locked. The founder edits the words and approves. The numbers come from the ledger.", "invupdate"), mock("data-room", "#FFFFFF", "Diligence", "Ask a question, " + C("get an answer with its source."), "Documents built from the books each time you open them, and a question queue where each answer carries the entries behind it.", "dataroom"), mock("cap-table", "#F6F8FC", "Ownership", "Who owns what, " + C("and what a round would change."), "A cap table that agrees to the books, with the round modelled before terms are signed.", "captable")], "investors and board members"]
];
const RX = {
  ceo: { role: "Founder or CEO", cta: "Get early access as a founder", month: [["Every morning", "A two-minute look", "Cash, burn, runway and what needs you."], ["A few times a week", "A tap to approve", "Only what falls outside your rules: a new supplier, a large bill."], ["Once a month", "Your update, drafted", "The investor update is written from the books. You edit and send."], ["Before a board meeting", "The pack, ready", "Filled from the ledger and the plan, for you to add the story."]], line: ["Your accountant still reviews the books and signs off.", "Tax returns and filings stay with your adviser.", "Agents never pay anyone or change their own limits.", "It is in development. Nothing here is on sale yet."], qa: [{ q: "What will it cost?", a: "One price set by the size of your company, with everything included. Planned launch prices start at $49 a month and are on the pricing page. Nothing is on sale yet." }, { q: "Can I switch from QuickBooks or Xero?", a: "That is the plan. Your history is brought across and checked month by month against the old system before you rely on the new one. The switching demo on the integrations page shows the steps." }] },
  cfo: { role: "CFO or finance lead", cta: "Get early access as a finance lead", month: [["Day to day", "A continuous close", "Agents reconcile as entries arrive. You see what broke a rule."], ["Month end", "Closed in days", "Review the sample, post adjustments, lock the month."], ["After the close", "The forecast rolls forward", "The closed month becomes the first column of the plan."], ["Before the board", "Pack and model", "The board pack and the three-statement model come from the same ledger."]], line: ["It does not replace your auditor or your tax adviser.", "Payroll stays with your payroll provider.", "The AI model never does the arithmetic. Code does.", "It is in development. Nothing here is on sale yet."], qa: [{ q: "How fast is the close, honestly?", a: "Days, not weeks, and it depends on you. Agents reconcile entries as they arrive, so what is left at month end is the exceptions, the judgment calls and your sign-off. The more your policy lets agents post alone, the less is left. A bill that arrives on the 4th still arrives on the 4th, so we do not promise a close on day zero." }, { q: "I am a fractional CFO with several clients. Does it fit?", a: "Yes. The books are current when you arrive, so the first hour is not spent fixing them. You get one sign-in across clients, and the forecast, scenarios and board pack for each run on that client's own ledger. Your access to each client is set by that client and can carry an end date." }, { q: "Does it handle several entities and currencies?", a: "Yes, that is in the design from the start. Each company keeps its own books in its own currency, and the group view consolidates them and removes what they charge each other." }, { q: "What about audit?", a: "Every entry carries its document, its approver and its history, and the schedules an auditor asks for are prepared as you go. It prepares you for an audit. It does not replace one." }] },
  inv: { role: "Investor or board member", cta: "Hear when early access opens", month: [["Each month", "An update you can compare", "The same metrics on the same definitions, with what changed since last month."], ["Each quarter", "A board pack before the meeting", "Filled from the ledger and the plan, not assembled the night before."], ["In diligence", "A data room that is current", "Any number opens to the entries and documents behind it."], ["When you ask", "An answer with its sources", "Approved by a named person at the company before it reaches you."]], line: ["You see only what the company chooses to share.", "It is not an audit and does not replace one.", "A view across a portfolio is planned, not built.", "It is in development. Nothing here is on sale yet."], qa: [{ q: "Do I need an account?", a: "No. A company shares a link with you, you verify your email, and you see what it has chosen to share. Access can carry an end date." }, { q: "How do I get a company I back onto it?", a: "Countahead is in development. Leave your email with investor as your role, and we will write when early access opens." }] }
};
const RSUB = { "founders.html": [["today", "Your daily view"], ["scenarios", "Scenarios"], ["ask", "Ask"]], "finance-leads.html": [["approvals", "Approvals"], ["control", "Controls"], ["scenarios", "Scenarios"]], "investors.html": [["investor-update", "Investor updates"], ["data-room", "Data room"], ["cap-table", "Cap table"]] };
ROLEP.forEach(([id, file, ey, h1a, h1b, lead, hg, title, desc, secs, low]) => {
  const pp = PEOPLE.find((x) => x.id === id);
  const pains = `<section id="why" class="ab-sec" style="background: #FFFFFF">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey">What changes</p><h2 class="h2">Three problems ${low} have, ${C("and what replaces them.")}</h2></div>
<div class="ab-grid3 rv">${pp.pains.map((x, i) => `<div class="sx-pair"><div><small>TODAY</small><p>${x}</p></div><div><small>WITH COUNTAHEAD</small><b>${pp.gains[i]}</b></div></div>`).join("")}</div>
</div>
</section>`;
  const rx = RX[id];
  const rhythm = `<section id="rhythm" class="ab-sec ab-dark">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey" style="color: #FFFFFF">Your month</p><h2 class="h2" style="color: #FFFFFF">What reaches you, <span style="color: var(--pop)">and when.</span></h2></div>
<ol class="rp-steps rv">${rx.month.map((m) => `<li><small>${m[0]}</small><b>${m[1]}</b><p>${m[2]}</p></li>`).join("")}</ol>
</div>
</section>`;
  const lineSec = `<section id="line" class="ab-sec" style="background: #FFFFFF">
<div class="wrap rp-line">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px"><p class="ey">Where the line is</p><h2 class="h2">What it does not do, ${C("said plainly.")}</h2></div>
<ul class="rv">${rx.line.map((x) => `<li>${x}</li>`).join("")}</ul>
</div>
</section>`;
  pp.qa = pp.qa.concat(rx.qa);
  hg = hg.replace('<p class="hg-foot">', `<a class="hg-cta" href="#access" data-rp="${rx.role}">${rx.cta} <span aria-hidden="true">&rarr;</span></a><p class="hg-foot">`);
  const others = ROLEP.filter((x) => x[1] !== file).map((x) => [x[1], x[2].replace(/^For /, "")]).concat([["accountants.html", "accountants and bookkeepers"]]);
  const qa = `<section id="questions" class="ab-sec" style="background: #F6F8FC">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey">Questions</p><h2 class="h2">What ${low} ask us, ${C("answered plainly.")}</h2></div>
<div class="pq rv">${pp.qa.map((q, i) => `<details${i ? "" : " open"}><summary>${q.q}<i aria-hidden="true"></i></summary><p>${q.a}</p></details>`).join("")}</div>
<p class="pq-also rv">Also built for ${others.map((o) => `<a href="${o[0]}">${o[1]}</a>`).join(", ").replace(/, ([^,]*)$/, " and $1")}.</p>
</div>
</section>`;
  SUBS[file] = [["why", "What changes"], ["rhythm", "Your month"]].concat(RSUB[file]).concat([["line", "The line"], ["questions", "Questions"]]);
  pages.push([file, title + " | Countahead", desc, [subhero(ey, h1a, h1b, lead, hg, true).replace('class="wrap hero2"', 'class="wrap hero2 hero2s"'), pains, rhythm].concat(secs).concat([lineSec, qa, S.access])]);
});
require("./accountants.js")(subhero, mock, C, S.access).forEach((p) => pages.push(p));
require("./people.js")(subhero, mock, C, S.access).forEach((p) => pages.push(p));
require("./pricing.js")(subhero, mock, C, S.access).forEach((p) => pages.push(p));
require("./legal.js")(subhero).forEach((p) => pages.push(p));
// demo counts for the home page, counted from the pages themselves so they cannot drift
const DEMO = {};
pages.forEach((p) => { const u = new Set(p[3].join("").match(/data-widget="[a-z0-9]+"/g) || []); u.delete('data-widget="access"'); u.delete('data-widget="acctfaq"'); DEMO[p[0]] = u.size; });
pages.forEach((p) => { p[3] = p[3].map((x) => x.replace(/\{\{n:([\w-]+\.html)\}\}/g, (m, f) => DEMO[f])); });
fs.writeFileSync(path.join(__dirname, "site.css.tmp"), `:root{--ink:#0B1B3A;--inkline:#2F4063;--hl:#FFFFFF;--hlp:#E6EDFF;--hlt:#C7D2E6;--pop:#FFD15C}
*{-webkit-tap-highlight-color:transparent}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
.site{font-family:Archivo,'Helvetica Neue',Arial,sans-serif;color:var(--ink);background:#FFFFFF;width:100%;font-variant-numeric:tabular-nums;font-size:17px;line-height:1.5;overflow-x:clip}
.subnav{display:none}
@media (min-width:1040px){
.hero2{display:grid!important;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:64px!important;align-items:center;padding-top:72px!important;padding-bottom:96px!important}
.hero2 h1{font-size:clamp(54px,5.9vw,88px)!important}
.demo2{display:grid!important;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:72px!important;align-items:start}
.demo2>div:first-child{position:sticky;top:110px}
.wfc{width:100%;max-width:760px;margin:0 auto}
}
.w-panel{background:var(--ink);color:#fff;border:1px solid var(--ink);box-shadow:10px 10px 0 #2450DC;display:flex;flex-direction:column;min-height:120px}
.w-panel.w-glass{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.22);box-shadow:none;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.w-hero{display:flex;flex-direction:column;gap:14px;min-height:480px}
.w-seg{display:grid;grid-template-columns:1fr 1fr;border:1px solid #fff}
.w-seg button{background:transparent;border:0;color:#fff;font:800 17px Archivo,Arial,sans-serif;font-stretch:112%;padding:14px;min-height:52px;cursor:pointer;transition:background .25s,color .25s}
.w-seg button[aria-pressed=true]{background:#fff;color:var(--ink)}
.w-prog{height:4px;background:rgba(255,255,255,.14)}.w-prog i{display:block;height:4px;width:0;background:var(--pop);transition:width .5s}
.w-ph{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.16);font-size:12px;font-weight:800;letter-spacing:.1em;color:#C7D2E6;display:flex;justify-content:space-between;gap:6px 10px;flex-wrap:wrap}
.w-pb{padding:16px;display:flex;flex-direction:column;gap:12px}
.w-bars{display:flex;align-items:flex-end;gap:3px;height:150px;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.w-bar{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%;position:relative}
.w-bar i{display:block;box-sizing:border-box;transition:height .35s cubic-bezier(.2,.8,.2,1)}
.w-bar u{position:absolute;left:0;right:0;bottom:0;box-sizing:border-box;border:1px dashed rgba(255,255,255,.5)}
.w-xl{display:flex;gap:3px;font-size:11px;color:#C7D2E6}.w-xl span{flex:1;min-width:0;text-align:center;white-space:nowrap;overflow:hidden}
.w-k{display:flex;gap:12px 24px;flex-wrap:wrap}.w-k div{flex:1 1 84px;min-width:0}.w-k small,.w-lab{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;color:#C7D2E6}.w-k b{font-stretch:112%;font-weight:800;font-size:clamp(22px,6vw,30px);letter-spacing:-.02em}
.w-t{font-stretch:112%;font-weight:800;font-size:22px}
.w-tag{font-size:12px;font-weight:800;letter-spacing:.1em;padding:4px 8px;background:#fff;color:var(--ink)}
.w-note{margin:0;font-size:14px;line-height:1.5;color:#E1E7F2}
.w-panel input[type=range]{width:100%;height:44px;margin:0;accent-color:var(--pop)}
.w-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:15px;color:#C7D2E6}.w-row b{font-size:20px;color:#fff}
.w-big{font-stretch:125%;font-weight:800;font-size:clamp(34px,9vw,64px);line-height:1;letter-spacing:-.03em}
.w-leg{display:flex;gap:6px 16px;font-size:13px;color:#C7D2E6;flex-wrap:wrap}.w-leg i{display:inline-block;width:11px;height:11px;margin-right:6px}
.w-roles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:0 24px}
.w-role{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.14)}
.w-rl{min-width:0}.w-rl b{display:block;font-size:17px}.w-rl span{font-size:13px;color:#C7D2E6}
.w-step{flex:none;display:flex;align-items:stretch;border:1px solid rgba(255,255,255,.45)}
.w-step button{width:44px;min-height:44px;background:transparent;border:0;color:#fff;font:700 20px Archivo,Arial,sans-serif;cursor:pointer}
.w-step output{width:40px;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--ink);font-stretch:112%;font-weight:800;font-size:19px}
.w-feed{display:flex;flex-direction:column}
.w-fi{display:flex;gap:12px;align-items:center;padding:12px 16px;border-top:1px solid rgba(255,255,255,.14);transition:background .4s,opacity .4s,transform .4s}
.w-fi.w-new{opacity:0;transform:translateY(-10px)}
.w-ft{flex:1;min-width:0}.w-ft b{display:block;font-size:15px}.w-ft span{font-size:13px;color:#C7D2E6}
.w-st{flex:none;font-size:11px;font-weight:800;letter-spacing:.08em;padding:4px 8px;border:1px solid rgba(255,255,255,.4);color:#fff;min-width:64px;text-align:center}
.w-st.w-done{background:#fff;color:var(--ink);border-color:#fff}
.w-btn{flex:none;background:var(--pop);color:var(--ink);border:0;font:800 14px Archivo,Arial,sans-serif;padding:10px 14px;min-height:44px;cursor:pointer}
.w-fi.w-wait{background:color-mix(in srgb,var(--pop) 16%,transparent)}
@keyframes wpulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--pop) 70%,transparent)}100%{box-shadow:0 0 0 14px color-mix(in srgb,var(--pop) 0%,transparent)}}
.w-pulse{animation:wpulse 1.4s ease-out infinite}
@media (prefers-reduced-motion:reduce){.w-pulse{animation:none}}
.w-ghost{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.3);color:#fff;font:700 14px Archivo,Arial,sans-serif;padding:10px 14px;min-height:44px;cursor:pointer}
@media (max-width:860px){.subnav{display:flex}section[id]{scroll-margin-top:120px}}
${css.trim()}
${vars(fs.readFileSync(path.join(__dirname, "widgets2.css"), "utf8"))}
`);
const V = (x) => vars(x);
const appjs = fs.readFileSync(path.join(__dirname, "runtime.js"), "utf8") + "\nclass DCLogic {}\n" + logic + "\n" + fs.readFileSync(path.join(__dirname, "sliderfix.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets2.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets3.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets4.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets5.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets6.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets7.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets8.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets9.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "widgets10.js"), "utf8") + "\n" + fs.readFileSync(path.join(__dirname, "site.js"), "utf8").replace(/(bg: on \? )"#0B1B3A"/, '$1"var(--ink)"');
const crypto = require("crypto");
const hash = (x) => crypto.createHash("sha1").update(x).digest("hex").slice(0, 8);
for (const f of fs.readdirSync(path.join(root, "assets"))) fs.unlinkSync(path.join(root, "assets", f));
const cssText = fs.readFileSync(path.join(__dirname, "site.css.tmp"), "utf8");
fs.unlinkSync(path.join(__dirname, "site.css.tmp"));
const CSSF = "assets/site." + hash(cssText) + ".css", JSF = "assets/app." + hash(appjs) + ".js";
fs.writeFileSync(path.join(root, CSSF), cssText);
fs.writeFileSync(path.join(root, JSF), appjs);
for (const [file, title, desc, parts] of pages) {
  const tpl = V(`<div class="site">\n${header(file)}\n${parts.join("\n\n").replace(/\{\{ic:([a-z-]+\.html)\}\}/g, (m, f) => global.caIcon(global.caIK[f] || "other"))}\n\n${footer}\n</div>`);
  const shell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0B1B3A">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CSSF}">
</head>
<body style="margin: 0">
<div id="app"></div>
<template id="tpl">${tpl}</template>
<script src="${JSF}"></script>
</body>
</html>
`;
  const dom = new JSDOM(shell.replace('<script src="' + JSF + '"></script>', ""), { runScripts: "outside-only", pretendToBeVisual: true, url: "https://countahead.test/" + file });
  dom.window.__PRERENDER = true;
  dom.window.eval(appjs);
  const html = dom.window.document.getElementById("app").innerHTML;
  fs.writeFileSync(path.join(root, file), shell.replace('<div id="app"></div>', '<div id="app">' + html + "</div>").replace(/href="index\.html/g, 'href="./').replace(/href="(revenue|books|plan|company|integrations|about|software|ai-usage|online-stores|consumer-brands|wholesale|services|professional-services|hospitality|retail|other-industries|founders|finance-leads|investors|accountants|people|pricing|refunds|privacy|terms)\.html/g, 'href="$1'));
  console.log(file, Math.round(html.length / 1024) + " KB prerendered,", (tpl.match(/<section/g) || []).length, "sections");
}
