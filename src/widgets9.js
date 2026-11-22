/* Pricing page widgets. Planned launch prices, one price by company size. */
(function () {
  var W = window.CAWidgets;
  var PRE = !!window.__PRERENDER;
  var RM = PRE || !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function usd(n) { return (n < 0 ? "-" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US"); }
  function big(n) { if (n >= 1e6) { var m = n / 1e6; return "$" + (m >= 10 || m === Math.round(m) ? Math.round(m) : m.toFixed(1)) + "M"; } return "$" + Math.round(n / 1000) + "k"; }
  function $(el, s) { return el.querySelector(s); }
  function all(el, s) { return [].slice.call(el.querySelectorAll(s)); }

  var B = [
    { max: 5e5, p: 49, lab: "Up to $500,000", sh: "Up to $500k", mid: [2e5, 3e5] },
    { max: 2e6, p: 149, lab: "$500,000 to $2 million", sh: "$500k to $2M", mid: [9e5, 1.2e6] },
    { max: 5e6, p: 399, lab: "$2 million to $5 million", sh: "$2M to $5M", mid: [3.2e6, 3e6] },
    { max: 15e6, p: 899, lab: "$5 million to $15 million", sh: "$5M to $15M", mid: [9e6, 8e6] },
    { max: 5e7, p: 1900, lab: "$15 million to $50 million", sh: "$15M to $50M", mid: [28e6, 24e6] },
    { max: Infinity, p: null, lab: "Above $50 million", sh: "Above $50M", mid: [65e6, 55e6] }
  ];
  function bandOf(v) { for (var i = 0; i < B.length; i++) if (v <= B[i].max) return i; return 5; }
  function price(i) { return B[i].p === null ? "Let's talk" : usd(B[i].p); }

  /* one shared band, so every section on the page follows the visitor's size */
  var S = window.CAPrice = window.CAPrice || { band: 0, subs: [] };
  function setBand(i, from) { if (i === S.band) return; S.band = i; S.subs.forEach(function (f) { try { f(i, from); } catch (e) {} }); }
  function sub(f) { S.subs.push(f); }

  function tween(node, from, to, fmt) {
    if (RM || from === to) { node.textContent = fmt(to); return; }
    var t0 = null, id = (node.__tw = (node.__tw || 0) + 1);
    function step(t) { if (node.__tw !== id) return; if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 380); k = 1 - Math.pow(1 - k, 3); node.textContent = fmt(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* ---------- 1. find your price ---------- */
  var STOPS = [0, 5e5, 2e6, 5e6, 15e6, 5e7, 8e7];
  function fromPos(s) { var g = Math.min(5, Math.floor(s / 100)), f = (s - g * 100) / 100, v = STOPS[g] + f * (STOPS[g + 1] - STOPS[g]); var st = v < 1e6 ? 1e4 : v < 1e7 ? 1e5 : 1e6; return Math.round(v / st) * st; }
  function toPos(v) { for (var g = 0; g < 6; g++) if (v <= STOPS[g + 1]) return Math.round(g * 100 + (v - STOPS[g]) / (STOPS[g + 1] - STOPS[g]) * 100); return 600; }

  W.pricefind = function (el) {
    var PRESETS = [["Two founders, no revenue yet", 0, 18e4], ["Seed stage, 10 people", 6e5, 1.6e6], ["Shop or cafe", 9e5, 8.2e5], ["Series A, 40 people", 3e6, 7e6], ["Profitable, $20M in sales", 2e7, 1.7e7]];
    var rev = 0, spend = 18e4, shown = 49, pre = 0, moved = 0, yr = 0;
    el.innerHTML = '<div class="pf"><div class="pf-in"><small>START FROM A COMPANY LIKE YOURS</small><div class="pf-pre">' + PRESETS.map(function (p, i) { return '<button type="button" data-pre="' + i + '">' + p[0] + "</button>"; }).join("") + '</div><small>OR SET YOUR OWN, LAST TWELVE MONTHS</small><label><span>Revenue <b data-v="r"></b></span><input type="range" min="0" max="600" step="1" data-k="r" aria-label="Revenue over the last twelve months"></label><label><span>Spending <b data-v="s"></b></span><input type="range" min="0" max="600" step="1" data-k="s" aria-label="Spending over the last twelve months"></label><p class="pf-why" aria-live="polite"></p></div><div class="pf-out"><div class="pf-bill" role="group" aria-label="How you pay"><button type="button" data-yr="0">Monthly</button><button type="button" data-yr="1">Yearly <em>2 months free</em></button></div><small class="pf-lab">STARTS AT</small><div class="pf-price"><b></b><span>a month</span></div><p class="pf-band"></p><ul class="pf-inc"><li>Books, plan, revenue and company records</li><li>Unlimited users</li><li>Your accountant\'s seat is free</li><li>No setup fee</li></ul><a class="pf-go" href="#compare">Compare with what you pay today <span aria-hidden="true">&rarr;</span></a></div><div class="pf-lad" role="group" aria-label="Price by company size">' + B.map(function (b, i) { return '<button type="button" data-b="' + i + '" style="--h:' + (22 + i * 13) + '%"><i aria-hidden="true"></i><b>' + (b.p === null ? "Quote" : usd(b.p)) + "</b><span>" + b.sh + "</span></button>"; }).join("") + '</div></div><p class="pf-note">Planned launch prices, in US dollars. Countahead is still being built and is not on sale yet.</p>';
    var pb = $(el, ".pf-price b");
    function draw() {
      var size = Math.max(rev, spend), i = bandOf(size), b = B[i];
      $(el, '[data-v="r"]').textContent = rev ? big(rev) : "$0"; $(el, '[data-v="s"]').textContent = spend ? big(spend) : "$0";
      $(el, '[data-k="r"]').value = toPos(rev); $(el, '[data-k="s"]').value = toPos(spend);
      $(el, ".pf-why").innerHTML = rev === spend ? "Revenue and spending are level, so your size is <b>" + big(size) + "</b>." : (rev > spend ? "Revenue is the higher of the two, so it sets your size: <b>" + big(size) + "</b>." : "Spending is the higher of the two, so it sets your size: <b>" + big(size) + "</b>. That is how a funded company with little revenue is sized fairly.");
      $(el, ".pf-why").innerHTML += ' <span class="pf-echo">' + (b.p === null ? "Priced with you." : "Your price: <b>" + (yr ? "about " + usd(b.p * 10 / 12) + " a month, paid yearly" : usd(b.p) + " a month") + "</b>.") + "</span>";
      if (b.p === null) { pb.__tw = (pb.__tw || 0) + 1; pb.textContent = "Let's talk"; el.querySelector(".pf-price").classList.add("pf-q"); shown = 0; }
      else { var amt = yr ? Math.round(b.p * 10 / 12) : b.p; el.querySelector(".pf-price").classList.remove("pf-q"); tween(pb, shown || amt, amt, usd); shown = amt; $(el, ".pf-price span").innerHTML = yr ? "a month <em>paid yearly, " + usd(b.p * 10) + "</em>" : "a month"; }
      all(el, "[data-yr]").forEach(function (x) { x.setAttribute("aria-pressed", +x.getAttribute("data-yr") === yr); });
      $(el, ".pf-band").innerHTML = b.p === null ? "<b>" + b.lab + ".</b> Everything included, priced with you, with a named contact." : "<b>" + b.lab + ".</b> " + (yr ? "One payment of " + usd(b.p * 10) + " a year. Two months free, which saves " + usd(b.p * 2) + " against paying monthly." : "Or about " + usd(b.p * 10 / 12) + " a month if you pay yearly, with two months free.");
      all(el, "[data-b]").forEach(function (x) { x.setAttribute("aria-pressed", +x.getAttribute("data-b") === i); });
      all(el, "[data-pre]").forEach(function (x) { x.setAttribute("aria-pressed", +x.getAttribute("data-pre") === pre); });
      $(el, ".pf-lab").textContent = moved ? "YOUR PRICE" : "STARTS AT";
      setBand(i, "find");
    }
    el.addEventListener("input", function (e) { var k = e.target.getAttribute && e.target.getAttribute("data-k"); if (!k) return; var v = fromPos(+e.target.value); if (k === "r") rev = v; else spend = v; pre = -1; moved = 1; draw(); });
    on(el, "[data-yr]", function (b) { yr = +b.getAttribute("data-yr"); draw(); });
    on(el, "[data-pre]", function (b) { pre = +b.getAttribute("data-pre"); rev = PRESETS[pre][1]; spend = PRESETS[pre][2]; moved = 1; draw(); });
    on(el, "[data-b]", function (b) { var m = B[+b.getAttribute("data-b")].mid; rev = m[0]; spend = m[1]; pre = -1; moved = 1; draw(); });
    sub(function (i, from) { if (from === "find") return; var m = B[i].mid; rev = m[0]; spend = m[1]; pre = -1; moved = 1; draw(); });
    draw();
  };

  /* ---------- 2. everything, at every size ---------- */
  W.priceall = function (el) {
    var A = [
      ["Books", "books.html", ["Agents that collect, code and match", "Bank and card reconciliation", "Bills, expenses and approvals", "Month-end close with a full audit trail", "Several currencies"]],
      ["Plan", "plan.html", ["Forecast and scenarios", "Runway, updated from the books", "Budgets by team and department", "Board packs and investor updates", "A three-statement model, with Excel export"]],
      ["Revenue", "revenue.html", ["Deals, a built-in CRM", "Contracts, signed on the platform", "Invoicing and collections", "Revenue recognition", "Commissions"]],
      ["Company", "company.html", ["Cap table and round modelling", "Option grants and vesting", "A data room with tracking", "Company records and reminders", "Drafting for minutes and consents"]]
    ];
    var ch = [["Companies in a group", function (i) { return i < 3 ? "One included. Add more at a reduced rate." : "Several included. Add more at a reduced rate."; }], ["Heavier AI work, on request", function (i) { return ["A monthly allowance", "A monthly allowance", "A larger allowance", "A larger allowance", "The largest allowance", "Agreed with you"][i]; }], ["Support", function (i) { return i < 3 ? "Shared support, with help on your switch" : "A named contact"; }]];
    el.innerHTML = '<div class="pa"><div class="pa-top"><small>PICK ANY SIZE AND WATCH THE LIST</small><div class="pa-tabs" role="group" aria-label="Company size">' + B.map(function (b, i) { return '<button type="button" data-b="' + i + '"><b>' + (b.p === null ? "Quote" : usd(b.p)) + "</b><span>" + b.sh + "</span></button>"; }).join("") + '</div></div><p class="pa-say" aria-live="polite"></p><div class="pa-diff"><small>THE ONLY THREE THINGS THAT CHANGE WITH SIZE</small><div class="pa-rows">' + ch.map(function (c, k) { return "<div><span>" + c[0] + '</span><b data-c="' + k + '"></b></div>'; }).join("") + '</div></div><small class="pa-lab">AND WHAT NEVER CHANGES</small><div class="pa-grid">' + A.map(function (a) { return '<div class="pa-col"><div class="pa-h"><b>' + a[0] + '</b><span class="pa-same">Included</span></div><ul>' + a[2].map(function (t) { return "<li>" + t + "</li>"; }).join("") + '</ul><a href="' + a[1] + '">See ' + a[0].toLowerCase() + ' <span aria-hidden="true">&rarr;</span></a></div>'; }).join("") + '</div><div class="pa-also"><span>Also in every price</span><b>Switching with month-by-month checks</b><b>Unlimited users</b><b>Accountant\'s seat free</b><b>Full export, any time</b></div></div>';
    function draw(flash) {
      var i = S.band;
      all(el, "[data-b]").forEach(function (x) { x.setAttribute("aria-pressed", +x.getAttribute("data-b") === i); });
      all(el, "[data-c]").forEach(function (x) { x.textContent = ch[+x.getAttribute("data-c")][1](i); });
      $(el, ".pa-say").innerHTML = "At <b>" + (B[i].p === null ? "a quoted price" : usd(B[i].p) + " a month") + "</b> you get all twenty lines below. Nothing is held back for a bigger plan.";
      if (flash && !RM) { var g = $(el, ".pa-grid"); g.classList.remove("pa-flash"); void g.offsetWidth; g.classList.add("pa-flash"); }
    }
    on(el, "[data-b]", function (b) { setBand(+b.getAttribute("data-b"), "all"); draw(true); });
    sub(function (i, from) { if (from !== "all") draw(false); });
    draw(false);
  };

  /* ---------- 3. your stack, your numbers ---------- */
  /* Pre-filled from published list prices of widely used tools in each category, by company size. Every figure is editable. */
  var CATS = [
    { k: "acct", n: "Accounting software", ours: "Books", flat: 1, p: [85, 140, 340, 340, 2350], on: [1, 1, 1, 1, 1] },
    { k: "plan", n: "Planning and forecasting tool", ours: "Plan", flat: 1, p: [1000, 1000, 1000, 1000, 1000], on: [0, 0, 1, 1, 1], off: "Often a spreadsheet at this size. Tick it if you pay for a tool." },
    { k: "crm", n: "CRM", ours: "Deals", unit: "seat", p: [15, 15, 90, 90, 90], s: [2, 3, 6, 10, 20], on: [1, 1, 1, 1, 1], note: "Need outreach sequences for a sales team? Keep your CRM and connect it. Then untick this line." },
    { k: "sign", n: "Contract signing", ours: "Contracts", unit: "sender", p: [11, 30, 30, 30, 30], s: [1, 2, 3, 5, 8], on: [1, 1, 1, 1, 1] },
    { k: "docs", n: "Document sharing or data room", ours: "Data room", unit: "user", p: [45, 45, 45, 45, 45], s: [1, 1, 1, 2, 3], on: [0, 1, 1, 1, 1] },
    { k: "cap", n: "Cap table", ours: "Cap table", flat: 1, p: [100, 100, 250, 500, 500], on: [0, 1, 1, 1, 1], off: "Often on a free tier at this size." }
  ];
  W.pricestack = function (el) {
    var st = {}, touched = {};
    function load(i) { var j = Math.min(i, 4); CATS.forEach(function (c) { if (touched[c.k]) return; st[c.k] = { on: !!c.on[j], p: c.p[j], s: c.flat ? 1 : c.s[j] }; }); }
    load(S.band);
    el.innerHTML = '<div class="ps"><div class="ps-l"><div class="ps-size"><label for="ps-sel">Company size, last twelve months</label><select id="ps-sel">' + B.map(function (b, i) { return '<option value="' + i + '">' + b.lab + "</option>"; }).join("") + '</select></div><small>TICK WHAT YOU PAY FOR TODAY. CHANGE ANY FIGURE.</small><div class="ps-rows">' + CATS.map(function (c) {
      return '<div class="ps-row" data-row="' + c.k + '"><label class="ps-ck"><input type="checkbox" data-on="' + c.k + '"><span><b>' + c.n + "</b><em>With Countahead: " + c.ours + '</em></span></label><div class="ps-num"><span class="ps-f"><i>$</i><input type="number" inputmode="numeric" min="0" max="99999" step="1" data-p="' + c.k + '" aria-label="' + c.n + ", price a month" + (c.flat ? "" : " for each " + c.unit) + '"></span>' + (c.flat ? '<span class="ps-u">a month</span>' : '<span class="ps-u">a ' + c.unit + '</span><span class="ps-st"><button type="button" data-d="' + c.k + '" data-by="-1" aria-label="Fewer ' + c.unit + 's">&minus;</button><b data-s="' + c.k + '"></b><button type="button" data-d="' + c.k + '" data-by="1" aria-label="More ' + c.unit + 's">+</button></span>') + '<b class="ps-t" data-t="' + c.k + '"></b></div>' + (c.note ? '<p class="ps-n">' + c.note + "</p>" : "") + (c.off ? '<p class="ps-n ps-off" data-off="' + c.k + '">' + c.off + "</p>" : "") + "</div>";
    }).join("") + '<div class="ps-row ps-stay"><span class="ps-pin" aria-hidden="true"></span><span><b>Your accountant or bookkeeper</b><em>Stays, on both sides. Countahead is their software too, and their seat is free.</em></span></div></div><button type="button" class="ps-reset">Reset to typical prices for this size</button><a class="ps-live" href="#ps-res"><span>Your stack <b data-l="them"></b></span><span>Countahead <b data-l="us"></b></span><em data-l="d"></em></a></div><div class="ps-r" id="ps-res"><small>EVERY MONTH</small><div class="ps-bars"><div class="ps-bar ps-them"><span>Your stack today</span><i><u></u></i><b data-o="them"></b></div><div class="ps-bar ps-us"><span>Countahead</span><i><u></u></i><b data-o="us"></b></div></div><div class="ps-verdict" aria-live="polite"></div><div class="ps-grow"><small>AND AS THE TEAM GROWS</small><p>Seat prices climb with every hire. Ours has no seats.</p><div class="ps-g3"></div><p class="ps-gn"></p></div></div></div><p class="ps-foot">Pre-filled from published list prices of widely used tools in each category, checked on November 22, 2026. Vendors change prices often and many discount, which is why every figure is yours to edit. Planned launch prices for Countahead. Free tiers and spreadsheets cost nothing, so leave them unticked.</p>';
    var last = { them: 0, us: 0 };
    function total(mult) { var t = 0; CATS.forEach(function (c) { var x = st[c.k]; if (x.on) t += x.p * (c.flat ? 1 : Math.max(1, Math.round(x.s * (mult || 1)))); }); return t; }
    function draw() {
      var i = S.band, us = B[i].p, them = total(1), n = 0, seats = 0;
      $(el, "#ps-sel").value = i;
      CATS.forEach(function (c) {
        var x = st[c.k], row = $(el, '[data-row="' + c.k + '"]');
        if (x.on) { n++; if (!c.flat) seats++; }
        row.classList.toggle("ps-on", x.on);
        $(el, '[data-on="' + c.k + '"]').checked = x.on;
        var inp = $(el, '[data-p="' + c.k + '"]'); if (document.activeElement !== inp) inp.value = x.p;
        var sv = $(el, '[data-s="' + c.k + '"]'); if (sv) sv.textContent = x.s;
        $(el, '[data-t="' + c.k + '"]').textContent = x.on ? usd(x.p * (c.flat ? 1 : x.s)) : "-";
        var off = $(el, '[data-off="' + c.k + '"]'); if (off) off.style.display = x.on ? "none" : "";
      });
      var mx = Math.max(them, us || 0, 1);
      $(el, ".ps-them u").style.width = (them / mx * 100) + "%"; $(el, ".ps-us u").style.width = ((us || 0) / mx * 100) + "%";
      tween($(el, '[data-o="them"]'), last.them, them, usd); last.them = them;
      $(el, '[data-l="them"]').textContent = usd(them); $(el, '[data-l="us"]').textContent = us === null ? "Quote" : usd(us); $(el, '[data-l="d"]').textContent = us === null || !n ? "" : them > us ? "You keep " + usd(them - us) : them < us ? usd(us - them) + " more" : "Same price";
      var v = $(el, ".ps-verdict"), g = $(el, ".ps-grow");
      if (us === null) { $(el, '[data-o="us"]').textContent = "Quote"; v.className = "ps-verdict ps-neutral"; v.innerHTML = "<b>Above $50 million, we price it with you.</b><span>Everything is still included. Tell us about your group when you ask for early access.</span>"; g.style.display = "none"; return; }
      g.style.display = "";
      tween($(el, '[data-o="us"]'), last.us, us, usd); last.us = us;
      var d = them - us;
      if (!n) { v.className = "ps-verdict ps-neutral"; v.innerHTML = "<b>Tick what you pay for today.</b><span>Your saving appears here, from your own numbers.</span>"; }
      else if (d > 0) { v.className = "ps-verdict ps-win"; v.innerHTML = "<small>YOU KEEP</small><b>" + usd(d) + " a month</b><span>" + usd(d * 12) + " a year" + (n === 1 ? ". " : ", and " + n + " bills become one. ") + (them >= us * 2 ? "That is less than half of what you pay now." : "Same work, one system, one set of numbers.") + "</span>"; }
      else { v.className = "ps-verdict ps-neutral"; v.innerHTML = "<small>HONESTLY</small><b>" + (d === 0 ? "About the same price." : "Your stack is " + usd(-d) + " a month cheaper.") + "</b><span>Then the case is not the saving. It is what you gain: a plan that reads your books, contracts and deals in the same place, and nothing typed twice.</span>"; }
      var G = [["Today", 1], ["Team doubles", 2], ["Team triples", 3]], gm = Math.max(total(3), us, 1);
      $(el, ".ps-g3").innerHTML = G.map(function (x) { var t = total(x[1]); return '<div><span>' + x[0] + '</span><div class="ps-gb"><i class="ps-gt" style="height:' + Math.max(4, t / gm * 100) + '%"><b>' + usd(t) + '</b></i><i class="ps-gu" style="height:' + Math.max(4, us / gm * 100) + '%"><b>' + usd(us) + "</b></i></div></div>"; }).join("");
      $(el, ".ps-gn").innerHTML = seats ? "Your seat counts, doubled and tripled, at the prices on the left. Our price follows company size, not headcount, and is checked once a year." + (i < 4 ? " Even one size up, it would be " + usd(B[i + 1].p) + "." : "") : "None of the tools you ticked charge by the seat, so your stack stays level too.";
    }
    el.addEventListener("change", function (e) {
      var t = e.target, k;
      if (t.id === "ps-sel") { setBand(+t.value, "stack"); load(S.band); draw(); return; }
      if ((k = t.getAttribute("data-on"))) { st[k].on = t.checked; touched[k] = 1; draw(); }
    });
    el.addEventListener("input", function (e) { var k = e.target.getAttribute && e.target.getAttribute("data-p"); if (!k) return; var v = Math.max(0, Math.min(99999, Math.round(+e.target.value || 0))); st[k].p = v; touched[k] = 1; draw(); });
    on(el, "[data-d]", function (b) { var k = b.getAttribute("data-d"); st[k].s = Math.max(1, Math.min(500, st[k].s + +b.getAttribute("data-by"))); st[k].on = true; touched[k] = 1; draw(); });
    on(el, ".ps-reset", function () { touched = {}; load(S.band); draw(); });
    sub(function (i, from) { if (from !== "stack") { load(i); draw(); } });
    draw();
  };

  /* ---------- 4. your first year ---------- */
  W.pricepath = function (el) {
    var T = [
      ["Day one", "Connect your current books", "Read only. Nothing changes in the system you use today, and nothing is switched off.", 0],
      ["First weeks", "Run the two side by side", "Your history comes across and every month is checked against your old books. You keep working as usual.", 0],
      ["First close", "A month closes here and agrees to the cent", "Only now does billing start. If it never agrees, you never pay.", 1],
      ["From then on", "Pay monthly, or yearly with two months free", "No setup fee. On monthly you can leave any time, and your full books export whenever you want them.", 1],
      ["Once a year", "We check your size", "If you have grown into the next size, the price moves at renewal and not before. Founding customers keep their launch price for two years.", 1]
    ];
    var cur = 0, timer = null, auto = !RM;
    el.innerHTML = '<div class="pp"><div class="pp-track" role="tablist" aria-label="Your first year">' + T.map(function (t, i) { return '<button type="button" role="tab" data-i="' + i + '"><i aria-hidden="true"></i><span>' + t[0] + "</span></button>"; }).join("") + '<u aria-hidden="true"><s></s></u></div><div class="pp-body"><div class="pp-txt" aria-live="polite"></div><div class="pp-meter"><small>YOU PAY</small><b></b><span></span></div></div></div>';
    function draw() {
      var t = T[cur], us = B[S.band].p;
      all(el, "[data-i]").forEach(function (b) { var i = +b.getAttribute("data-i"); b.setAttribute("aria-selected", i === cur); b.classList.toggle("pp-done", i < cur); });
      $(el, ".pp-track s").style.width = (cur / (T.length - 1) * 100) + "%";
      $(el, ".pp-txt").innerHTML = "<small>STEP " + (cur + 1) + " OF " + T.length + "</small><b>" + t[1] + "</b><p>" + t[2] + "</p>";
      var m = $(el, ".pp-meter"); m.classList.toggle("pp-paid", !!t[3]);
      $(el, ".pp-meter b").textContent = t[3] ? (us === null ? "Your quote" : usd(us)) : "$0";
      $(el, ".pp-meter span").textContent = t[3] ? (us === null ? "agreed with you" : "a month, for your size") : "nothing yet";
    }
    function stop() { auto = false; if (timer) clearInterval(timer); timer = null; }
    on(el, "[data-i]", function (b) { stop(); cur = +b.getAttribute("data-i"); draw(); });
    sub(function () { draw(); });
    draw();
    if (auto && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { if (!en[0].isIntersecting) return; io.disconnect(); timer = setInterval(function () { if (cur >= T.length - 1) return stop(); cur++; draw(); }, 2600); }, { threshold: 0.5 });
      io.observe(el);
    }
  };
  /* ---------- accountants: a practice, shown not listed ---------- */
  W.acctpractice = function (el) {
    var CL = [["Atlas Kitchen Group", 5, 2, 62], ["Lumen Labs", 3, 0, 88], ["Harbor & Pine", 0, 4, 71], ["Northwind Studio", 1, 1, 94], ["Quill & Co", 0, 0, 100]];
    var T = [
      ["Client list", "One sign-in, every client", "Sorted by what needs you. Where each close stands, what is waiting on you and what is waiting on them."],
      ["Your standards", "Set once, applied everywhere", "Your chart, layouts, rules and close checklist as a firm template. Apply it to each new client and adjust where one differs."],
      ["Questions", "Questions without the chase", "Attach a question to the entry it is about. The owner answers from their phone, and the answer lands on the entry."],
      ["Working papers", "Working papers that write themselves", "Signed reconciliations, roll-forwards and schedules come out of the system. Nothing is rebuilt in a spreadsheet."],
      ["Sign-off", "Prepare, review, sign off", "Roles inside your firm, with a name on each step. Staff see only the clients they are assigned to."],
      ["Handover", "A clean handover, either way", "Take on a client with their history checked month by month. If a client moves on, the record of who signed what stays intact."]
    ];
    var cur = 0, sort = 0, asked = 0, step = 0, tpl = [1, 1, 1, 0, 1], t1 = null;
    function body() {
      if (cur === 0) { var L = CL.slice().sort(function (a, b) { return sort === 0 ? b[1] - a[1] : sort === 1 ? b[2] - a[2] : a[3] - b[3]; }); return '<div class="ax-sort" role="group" aria-label="Sort clients">' + ["Waiting on me", "Waiting on them", "Close progress"].map(function (t, i) { return '<button type="button" data-so="' + i + '" aria-pressed="' + (i === sort) + '">' + t + "</button>"; }).join("") + '</div><div class="ax-list">' + L.map(function (c, i) { return '<div class="ax-cl" style="--d:' + i * 60 + 'ms"><b>' + c[0] + '</b><span class="ax-me' + (c[1] ? "" : " ax-z") + '">' + c[1] + ' on you</span><span class="ax-th' + (c[2] ? "" : " ax-z") + '">' + c[2] + ' on them</span><i><u style="width:' + c[3] + '%"></u></i><em>' + (c[3] === 100 ? "Closed" : c[3] + "% done") + "</em></div>"; }).join("") + "</div>"; }
      if (cur === 1) { var n = tpl.filter(function (x) { return x; }).length; return '<div class="ax-tpl"><div class="ax-doc"><small>FIRM TEMPLATE</small><b>Your standard, version 3</b><span>Chart of accounts &middot; statement layouts &middot; 14 rules &middot; close checklist</span></div><div class="ax-list">' + CL.map(function (c, i) { return '<label class="ax-ap"><input type="checkbox" data-tp="' + i + '"' + (tpl[i] ? " checked" : "") + "><b>" + c[0] + "</b><em>" + (tpl[i] ? (i === 2 ? "Applied, with 2 accounts of their own" : "Applied") : "On their old chart") + "</em></label>"; }).join("") + '</div><p class="ax-cap"><b>' + n + " of 5 clients</b> on your standard. Change the template once and each of them follows.</p></div>"; }
      if (cur === 2) return '<div class="ax-q"><div class="ax-entry"><small>ENTRY, HARBOR &amp; PINE</small><b>Card payment, Delta Supply, $412.00</b><span>No receipt. Coded to Supplies, unsure.</span></div>' + (asked ? '<div class="ax-msg ax-you"><small>YOU, 9:14</small>What was this for? A photo of the receipt is enough.</div>' : "") + (asked > 1 ? '<div class="ax-msg ax-own"><small>OWNER, FROM THEIR PHONE, 9:31</small>Shelving for the new stockroom.<i>Photo attached: receipt.jpg</i></div><div class="ax-done">Answer and receipt now sit on the entry. Recoded to Fixtures, waiting for your approval.</div>' : "") + (asked < 2 ? '<button type="button" class="ax-btn" data-ask>' + (asked ? "See the reply" : "Ask the owner about this entry") + ' <span aria-hidden="true">&rarr;</span></button>' : '<button type="button" class="ax-lnk" data-ask>Play it again</button>') + "</div>";
      if (cur === 3) return '<div class="ax-list">' + [["Bank reconciliation, operating account", "Signed by you", "Statement and 212 lines"], ["Prepaid expenses roll-forward", "Signed by you", "9 bills, by service date"], ["Accrued expenses schedule", "Ready for review", "6 bills not yet received"], ["Fixed asset register", "Signed by you", "31 assets, with invoices"], ["Deferred revenue schedule", "Ready for review", "44 contracts"]].map(function (r, i) { return '<div class="ax-wp" style="--d:' + i * 60 + 'ms"><b>' + r[0] + "</b><span>Traces to: " + r[2] + '</span><em class="' + (r[1] === "Signed by you" ? "ax-ok" : "ax-wait") + '">' + r[1] + "</em></div>"; }).join("") + '</div><p class="ax-cap">Sample month for one client. Each paper opens the entries and documents behind it.</p>';
      if (cur === 4) { var ST = [["Prepared", "Agent, inside your rules", "Coded, matched and scheduled"], ["Reviewed", "Sam, senior associate", "Exceptions cleared, two entries adjusted"], ["Signed off", "You, partner", "Month closed and locked"]]; return '<div class="ax-steps">' + ST.map(function (x, i) { return '<div class="ax-step' + (i < step ? " ax-sd" : i === step ? " ax-sc" : "") + '"><i>' + (i < step ? "&#10003;" : i + 1) + "</i><span><b>" + x[0] + "</b><em>" + x[1] + "</em>" + (i < step ? "<small>" + x[2] + "</small>" : "") + "</span></div>"; }).join("") + "</div>" + (step < 3 ? '<button type="button" class="ax-btn" data-step>' + ["Mark as prepared", "Review as Sam", "Sign off as partner"][step] + ' <span aria-hidden="true">&rarr;</span></button>' : '<div class="ax-done">Closed, with three names on it. The same person cannot prepare and approve.</div><button type="button" class="ax-lnk" data-step>Start again</button>'); }
      var M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return '<div class="ax-ho"><small>HISTORY CHECKED AGAINST THE OLD BOOKS, MONTH BY MONTH</small><div class="ax-mo">' + M.map(function (m, i) { return '<span style="--d:' + i * 70 + 'ms"><i>&#10003;</i>' + m + "</span>"; }).join("") + '</div><p class="ax-cap"><b>Twelve of twelve months agree.</b> Only then is the new set of books relied on. Sample client.</p><div class="ax-doc"><small>IF A CLIENT LEAVES</small><b>They take their books. You keep your record.</b><span>Your sign-offs, review notes and issued reports stay with your firm.</span></div></div>';
    }
    function draw() {
      all(el, "[data-t]").forEach(function (b) { b.setAttribute("aria-selected", +b.getAttribute("data-t") === cur); });
      $(el, ".ax-say").innerHTML = "<b>" + T[cur][1] + "</b><p>" + T[cur][2] + "</p>";
      $(el, ".ax-mock").innerHTML = body();
    }
    el.innerHTML = '<div class="ax"><div class="ax-tabs" role="tablist" aria-label="What a practice gets">' + T.map(function (t, i) { return '<button type="button" role="tab" data-t="' + i + '"><small>0' + (i + 1) + "</small>" + t[0] + "</button>"; }).join("") + '</div><div class="ax-body"><div class="ax-say"></div><div class="ax-mock" aria-live="polite"></div></div></div>';
    on(el, "[data-t]", function (b) { cur = +b.getAttribute("data-t"); draw(); });
    on(el, "[data-so]", function (b) { sort = +b.getAttribute("data-so"); draw(); });
    on(el, "[data-ask]", function () { if (asked >= 2) { asked = 0; draw(); return; } asked++; draw(); if (asked === 1 && !RM) { clearTimeout(t1); t1 = setTimeout(function () { if (asked === 1 && cur === 2) { asked = 2; draw(); } }, 1600); } });
    on(el, "[data-step]", function () { step = step >= 3 ? 0 : step + 1; draw(); });
    el.addEventListener("change", function (e) { var k = e.target.getAttribute && e.target.getAttribute("data-tp"); if (k === null || k === undefined) return; tpl[+k] = e.target.checked ? 1 : 0; draw(); });
    draw();
  };
})();
