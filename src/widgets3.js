/* Revenue and planning mocks. Light theme, sample data and sample assumptions throughout. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function $k(v) { return "$" + Math.round(v).toLocaleString("en-US"); }
  function seg(items, cur, attr) { return '<div class="m-filters">' + items.map(function (x, i) { return '<button type="button" data-' + attr + '="' + i + '" aria-pressed="' + (i === cur) + '">' + x + "</button>"; }).join("") + "</div>"; }
  function stat(l, v, c) { return '<div class="' + (c || "") + '"><small>' + l + "</small><b>" + v + "</b></div>"; }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  var MN = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

  /* ---------- contract builder: one contract, everything downstream ---------- */
  function contract(el) {
    var seats = 40, price = 100, term = 12, bill = 1, BILL = [["Monthly", 1], ["Quarterly", 3], ["Annual", 12]], TERM = [12, 24, 36];
    function draw(keep) {
      var mrr = seats * price, per = BILL[bill][1], n = Math.min(4, Math.ceil(term / per));
      var inv = []; for (var i = 0; i < n; i++) inv.push([MN[(i * per) % 12] + " 1", mrr * per]);
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">THE CONTRACT</span><div class="m-kv"><span>Customer</span><b>Harbor Labs <small class="m-mini">from your CRM</small></b></div>' +
        '<div class="m-kv"><span>Seats</span><span class="m-stp"><button type="button" data-a="s-">&minus;</button><output>' + seats + '</output><button type="button" data-a="s+">+</button></span></div>' +
        '<div class="m-kv"><span>Price per seat, monthly</span><b>$' + price + '</b></div><input type="range" min="40" max="300" step="10" value="' + price + '" aria-label="Price per seat" data-r="p">' +
        '<div class="m-kv"><span>Term</span><span class="m-opts">' + TERM.map(function (t) { return '<button type="button" data-a="t" data-v="' + t + '" aria-pressed="' + (t === term) + '">' + t + " mo</button>"; }).join("") + "</span></div>" +
        '<div class="m-kv"><span>Billing</span><span class="m-opts">' + BILL.map(function (b, i) { return '<button type="button" data-a="b" data-v="' + i + '" aria-pressed="' + (i === bill) + '">' + b[0] + "</button>"; }).join("") + "</span></div>" +
        '<p class="m-foot" style="padding:0">Change anything. Everything on the right is worked out from these terms.</p></div>' +
        '<div class="m-pane"><span class="m-lab">WHAT IT CREATES, AUTOMATICALLY</span><div class="m-stats">' + stat("ANNUAL RECURRING", $k(mrr * 12), "m-good") + stat("CONTRACT VALUE", $k(mrr * term)) + stat("COMMISSION, 10%", $k(mrr * 12 * 0.1)) + "</div>" +
        '<div class="m-flow"><div><small>INVOICES</small>' + inv.map(function (x) { return '<div class="m-fl"><span>' + x[0] + "</span><b>" + $k(x[1]) + "</b></div>"; }).join("") + (Math.ceil(term / per) > n ? '<div class="m-fl m-more"><span>and ' + (Math.ceil(term / per) - n) + " more</span></div>" : "") + "</div>" +
        '<div><small>REVENUE, EACH MONTH</small><div class="m-fl"><span>Recognized</span><b>' + $k(mrr) + '</b></div><div class="m-fl"><span>Months</span><b>' + term + '</b></div><small style="margin-top:8px">IN THE PLAN</small><div class="m-fl"><span>Cash forecast</span><b>Updated</b></div><div class="m-fl"><span>Renewal</span><b>' + MN[term % 12] + " " + (2026 + Math.floor((term + 11) / 12)) + "</b></div></div></div></div></div>";
      var r = el.querySelector('[data-r="p"]'); r.addEventListener("input", function () { price = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"), v = +t.getAttribute("data-v"); if (a === "s-") seats = Math.max(5, seats - 5); if (a === "s+") seats = Math.min(500, seats + 5); if (a === "t") term = v; if (a === "b") bill = v; draw(); });
    draw();
  }
  function commerce(el) {
    var CH = [["Shopify", [["Gross sales", 18420, "4000 Product revenue"], ["Discounts", -1210, "4050 Discounts"], ["Refunds", -640, "4060 Refunds"], ["Shipping charged", 980, "4100 Shipping income"], ["Payment fees", -534, "6400 Payment fees"]]], ["Amazon", [["Gross sales", 9860, "4000 Product revenue"], ["Refunds", -310, "4060 Refunds"], ["Referral fees", -1479, "6410 Marketplace fees"], ["Fulfilment fees", -1120, "6420 Fulfilment"], ["Advertising", -460, "6600 Advertising"]]]], c = 0, open = -1;
    function draw() {
      var rows = CH[c][1], tot = rows.reduce(function (a, r) { return a + r[1]; }, 0);
      el.innerHTML = seg([CH[0][0], CH[1][0]], c, "c") + '<div class="m-pane" style="padding:0"><div class="m-grp"><span>Yesterday\'s payout, split into the books</span><b>USD</b></div>' +
        rows.map(function (r, i) { return '<button type="button" class="m-acct" data-i="' + i + '" aria-expanded="' + (open === i) + '"><span>' + r[0] + "</span><b>" + (r[1] < 0 ? "(" + $k(-r[1]).slice(1) + ")" : $k(r[1]).slice(1)) + "</b></button>" + (open === i ? '<div class="m-drill"><div><span>Posted to</span><span>' + r[2] + "</span></div></div>" : ""); }).join("") +
        '<div class="m-acct m-total"><span>Payout received in the bank</span><b>' + $k(tot).slice(1) + '</b></div></div><p class="m-foot">' + CHECK + " One payout line in the bank becomes " + rows.length + " correct entries, and the payout reconciles itself.</p>";
    }
    on(el, "[data-c]", function (t) { c = +t.getAttribute("data-c"); open = -1; draw(); }); on(el, "[data-i]", function (t) { var i = +t.getAttribute("data-i"); open = open === i ? -1 : i; draw(); }); draw();
  }
  function services(el) {
    var MS = [["Discovery", 8000, 1], ["Design", 14000, 1], ["Build", 22000, 0], ["Handover", 6000, 0]];
    function draw() {
      var done = MS.reduce(function (a, m) { return a + (m[2] ? m[1] : 0); }, 0), tot = 50000;
      el.innerHTML = '<div class="m-pane"><div class="m-doch"><b>Northwind Ltd, website rebuild</b><span>Fixed fee, ' + $k(tot) + '</span></div><div class="m-stats">' + stat("DELIVERED", Math.round(done / tot * 100) + "%") + stat("INVOICED", $k(done)) + stat("STILL TO RECOGNIZE", $k(tot - done), "m-good") + '</div><div class="m-track"><i style="width:' + done / tot * 100 + '%"></i></div>' +
        MS.map(function (m, i) { return '<div class="m-li"><span><b>' + m[0] + "</b><small>" + (m[2] ? "Delivered, invoiced and recognized" : "Not yet delivered") + "</small></span>" + (m[2] ? '<b>' + $k(m[1]) + "</b>" : '<button type="button" class="m-btn m-sm" data-i="' + i + '">Mark delivered</button>') + "</div>"; }).join("") + '<p class="m-foot" style="padding:0">Mark a milestone delivered. The invoice is drafted and the revenue is recognized in the same step.</p></div>';
    }
    on(el, "[data-i]", function (t) { MS[+t.getAttribute("data-i")][2] = 1; draw(); }); draw();
  }
  function general(el) {
    var sent = false;
    function draw() {
      el.innerHTML = '<div class="m-pane"><div class="m-inv"><div class="m-doch"><b>INV-0153</b><span class="m-chip ' + (sent ? "m-blue" : "m-warn") + '">' + (sent ? "SENT" : "DRAFT") + '</span></div><div class="m-kv"><span>Bill to</span><b>Brightdesk</b></div><div class="m-kv"><span>For</span><b>Consulting, November</b></div><div class="m-kv m-tot"><span>Amount</span><b>$6,500.00</b></div></div>' +
        (sent ? '<div class="m-note">' + CHECK + " Sent. Receivable recorded, revenue recognized, and the payment will match itself when it lands.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="s">Approve and send</button></div>') + '<p class="m-foot" style="padding:0">No contract or store needed. Describe the sale, and an agent drafts the invoice.</p></div>';
    }
    on(el, "[data-a]", function () { sent = true; draw(); }); draw();
  }
  var RM = [["Subscriptions", "Software and other recurring contracts", ["Contract", "Recurring revenue", "Invoice", "Cash", "Revenue in the books"], contract],
    ["Online store", "Selling through Shopify, Amazon or both", ["Orders", "Payout", "Fees and refunds", "Cash", "Revenue in the books"], commerce],
    ["Services", "Projects, retainers and milestones", ["Engagement", "Milestone", "Invoice", "Cash", "Revenue in the books"], services],
    ["Something else", "Plain invoices for whatever you sell", ["Sale", "Invoice", "Cash", "Revenue in the books"], general]];
  W.revflow = function (el) {
    el.innerHTML = '<div class="m-tabs nosb" role="group" aria-label="How you sell">' + RM.map(function (m, i) { return '<button type="button" data-m="' + i + '"><small>0' + (i + 1) + "</small><b>" + m[0] + "</b></button>"; }).join("") + '</div><div class="m-chain"></div><div class="m-screen" style="box-shadow:none;border:0"></div>';
    function show(i) {
      [].forEach.call(el.querySelectorAll("[data-m]"), function (b, n) { b.setAttribute("aria-pressed", n === i); });
      el.querySelector(".m-chain").innerHTML = '<span class="m-lab" style="flex-basis:100%">' + RM[i][1].toUpperCase() + "</span>" + RM[i][2].map(function (s, n) { return '<span class="m-node' + (n === 0 ? " m-first" : "") + '">' + s + "</span>"; }).join('<i aria-hidden="true">&rarr;</i>');
      var old = el.querySelector(".m-screen"), scr = old.cloneNode(false); old.parentNode.replaceChild(scr, old); RM[i][3](scr);
    }
    el.querySelector(".m-tabs").addEventListener("click", function (e) { var t = e.target.closest("[data-m]"); if (t) show(+t.getAttribute("data-m")); });
    show(0);
  };

  /* ---------- recurring revenue movements ---------- */
  W.arr = function (el) {
    var MV = [["Opening", 3860, 0, []], ["New", 180, 1, [["Harbor Labs", 48], ["Kestrel Freight", 72], ["Oakline Health", 60]]], ["Upsell", 96, 1, [["Northwind Ltd, 20 more seats", 60], ["Tallis and Co, higher plan", 36]]], ["Downsell", -24, -1, [["Brightdesk, 10 fewer seats", -24]]], ["Churn", -92, -1, [["Meridian Labs, did not renew", -92]]], ["Closing", 4020, 0, []]], sel = 1;
    function draw() {
      var run = 0, top = 4100, base = 3700, H = 170;
      function y(v) { return (top - v) / (top - base) * H; }
      var bars = MV.map(function (m, i) {
        var a, b; if (m[2] === 0) { a = base; b = m[1]; run = m[1]; } else { a = run; b = run + m[1]; run = b; }
        var hi = Math.max(a, b), lo = Math.min(a, b);
        return '<button type="button" class="m-wf" data-i="' + i + '" aria-pressed="' + (i === sel) + '" style="left:' + (i * 16.666) + '%"><span class="m-wfv" style="top:' + (y(hi) - 18) + 'px">' + (m[2] === 0 ? m[1].toLocaleString("en-US") : (m[1] > 0 ? "+" : "") + m[1]) + '</span><i style="top:' + y(hi) + "px;height:" + Math.max(y(lo) - y(hi), 2) + "px;background:" + (m[2] === 0 ? "var(--ink)" : m[2] > 0 ? "#2450DC" : "#8A5A00") + '"></i><span class="m-wfl">' + m[0] + "</span></button>";
      }).join("");
      var m = MV[sel];
      el.innerHTML = '<div class="m-stats">' + stat("RECURRING REVENUE, NOV", "$4.02M", "m-good") + stat("NET NEW", "+$160k") + stat("CUSTOMERS", "41") + '</div><div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">MOVEMENTS IN NOVEMBER, USD THOUSANDS. TAP A BAR.</span><div class="m-wfc" style="height:' + (H + 40) + 'px">' + bars + '</div></div><div class="m-pane"><span class="m-lab">' + m[0].toUpperCase() + ": WHAT IS BEHIND IT</span>" +
        (m[3].length ? m[3].map(function (c) { return '<div class="m-li" style="padding:10px 0"><span><b>' + c[0] + "</b><small>From the signed contract</small></span><b>" + (c[1] > 0 ? "+" : "") + c[1] + "</b></div>"; }).join("") : '<p class="m-p">' + (sel === 0 ? "Recurring revenue at the start of November, from 40 active contracts." : "Recurring revenue at the end of November. It ties to the $335k recognized this month.") + "</p>") + "</div></div>";
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); }); draw();
  };

  /* ---------- commissions ---------- */
  W.comm = function (el) {
    var REPS = [["Priya", 120, 132, [["Kestrel Freight", 72], ["Oakline Health", 60]]], ["Daniel", 120, 96, [["Northwind Ltd, upsell", 60], ["Tallis and Co, upsell", 36]]], ["Sofia", 120, 48, [["Harbor Labs", 48]]]], rate = 10, acc = 1.5, sel = 0;
    function pay(r) { var b = Math.min(r[2], r[1]), o = Math.max(r[2] - r[1], 0); return (b * rate / 100 + o * rate / 100 * acc) * 1000; }
    function draw(keep) {
      var r = REPS[sel];
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-list">' + REPS.map(function (x, i) { var at = Math.round(x[2] / x[1] * 100); return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + x[0] + "</b><small>" + at + "% of quota, booked $" + x[2] + 'k</small><span class="m-track" style="margin-top:6px;width:140px"><i style="width:' + Math.min(at, 100) + '%"></i></span></span><b>' + $k(pay(x)) + "</b></button>"; }).join("") +
        '<div class="m-pane" style="background:#fff"><div class="m-kv" style="border:0"><span>Commission rate</span><b>' + rate + '%</b></div><input type="range" min="4" max="20" step="1" value="' + rate + '" aria-label="Commission rate" data-r="rate"><p class="m-foot" style="padding:0">Sample plan: ' + rate + "% of new recurring revenue, paid at " + acc + " times the rate above quota.</p></div></div>" +
        '<div class="m-pane"><span class="m-lab">' + r[0].toUpperCase() + ", NOVEMBER STATEMENT</span>" + r[3].map(function (d) { return '<div class="m-li" style="padding:10px 0"><span><b>' + d[0] + "</b><small>Booked from the signed contract</small></span><b>$" + d[1] + "k</b></div>"; }).join("") + '<div class="m-kv m-tot"><span>Commission owed</span><b>' + $k(pay(r)) + '</b></div><div class="m-note">' + CHECK + " Accrued in the books this month and added to the payroll forecast.</div></div></div>";
      var s = el.querySelector('[data-r="rate"]'); s.addEventListener("input", function () { rate = +this.value; draw(true); }); if (keep) s.focus();
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); }); draw();
  };

  /* ---------- scenarios ---------- */
  function run(g, hires, N) { var cash = 3060, rev = 335, opx = 178, out = null, a = [3060]; for (var m = 1; m <= 96; m++) { rev *= 1 + g / 100; opx *= 1.01; cash -= 372 + hires * 17 + opx - rev; if (out === null && cash <= 0) out = m; if (m <= N) a.push(Math.max(cash, 0)); } return { a: a, out: out, arr: null }; }
  function when(m) { var d = new Date(2026, 10 + m, 1); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()] + " " + d.getFullYear(); }
  W.scen = function (el) {
    var SC = [["Base", 2, 0, "#0B1B3A"], ["Upside", 4, 3, "#2450DC"], ["Downside", 0.5, 0, "#8A5A00"]], sel = 0, N = 24;
    function draw(keep) {
      var R = SC.map(function (s) { return run(s[1], s[2], N); }), Wd = 600, H = 190;
      var lines = R.map(function (r, i) { return '<polyline fill="none" stroke="' + SC[i][3] + '" stroke-width="' + (i === sel ? 4 : 2) + '" ' + (i === sel ? "" : 'stroke-dasharray="6 5" ') + 'points="' + r.a.map(function (v, m) { return (m / N * Wd).toFixed(1) + "," + (H - v / 3200 * H).toFixed(1); }).join(" ") + '"></polyline>'; }).join("");
      var s = SC[sel];
      el.innerHTML = '<div class="m-scn">' + SC.map(function (x, i) { var r = R[i]; return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><small style="color:' + x[3] + '">' + x[0].toUpperCase() + "</small><b>" + (r.out === null ? "8+ years" : r.out + " months") + "</b><span>" + (r.out === null ? "Reaches breakeven" : "Cash to " + when(r.out)) + "</span></button>"; }).join("") + "</div>" +
        '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">CASH OVER 24 MONTHS, THREE SCENARIOS</span><svg viewBox="0 -6 ' + Wd + " " + (H + 12) + '" preserveAspectRatio="none" style="width:100%;height:210px;border-bottom:1px solid var(--ink);border-left:1px solid var(--ink)" role="img" aria-label="Cash over 24 months for base, upside and downside scenarios">' + lines + "</svg></div>" +
        '<div class="m-pane"><span class="m-lab">' + s[0].toUpperCase() + ": ASSUMPTIONS</span><div class=\"m-kv\" style=\"border:0\"><span>Revenue growth a month</span><b>" + s[1] + '%</b></div><input type="range" min="0" max="6" step="0.5" value="' + s[1] + '" aria-label="Revenue growth" data-r="g"><div class="m-kv"><span>New hires in January</span><span class="m-stp"><button type="button" data-a="h-">&minus;</button><output>' + s[2] + '</output><button type="button" data-a="h+">+</button></span></div><p class="m-foot" style="padding:0">Every scenario starts from the same closed books, so they differ only in what you assume.</p></div></div>';
      var r = el.querySelector('[data-r="g"]'); r.addEventListener("input", function () { SC[sel][1] = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-a]", function (t) { SC[sel][2] = Math.max(0, Math.min(10, SC[sel][2] + (t.getAttribute("data-a") === "h+" ? 1 : -1))); draw(); }); draw();
  };

  /* ---------- top down and bottom up ---------- */
  W.method = function (el) {
    var mode = 0, goal = 6000, reps = 3, add = 2, quota = 40, att = 75, NOW = 4020;
    function draw(keep) {
      var h = seg(["Top down: start from the goal", "Bottom up: start from the team"], mode, "m"), body;
      if (mode === 0) {
        var need = goal - NOW, perMo = need / 12, perRep = quota * att / 100, repsNeeded = Math.ceil(perMo / perRep);
        body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">THE GOAL</span><div class="m-kv" style="border:0"><span>Recurring revenue in 12 months</span><b>$' + (goal / 1000).toFixed(1) + 'M</b></div><input type="range" min="4500" max="9000" step="100" value="' + goal + '" aria-label="Recurring revenue goal" data-r="goal"><p class="m-foot" style="padding:0">Today it is $4.02M. Assumes $' + quota + "k quota per rep a month at " + att + "% attainment.</p></div>" +
          '<div class="m-pane"><span class="m-lab">WHAT IT TAKES</span><div class="m-stats">' + stat("NET NEW NEEDED", $k(need) + "k") + stat("A MONTH", $k(perMo) + "k") + stat("REPS NEEDED", repsNeeded, repsNeeded > reps ? "m-bad" : "m-good") + '</div><div class="m-note">' + CHECK + (repsNeeded > reps ? " You have " + reps + " reps, so the plan needs " + (repsNeeded - reps) + " more, hired early enough to ramp." : " Your " + reps + " reps can carry this at current attainment.") + "</div></div></div>";
      } else {
        var total = 0; for (var m = 1; m <= 12; m++) total += reps * quota * att / 100 + (m > 3 ? add * quota * att / 100 : 0);
        var end = NOW + total;
        body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">THE TEAM</span><div class="m-kv" style="border:0"><span>Reps today</span><b>' + reps + '</b></div><div class="m-kv"><span>New reps, three-month ramp</span><span class="m-stp"><button type="button" data-a="a-">&minus;</button><output>' + add + '</output><button type="button" data-a="a+">+</button></span></div><div class="m-kv"><span>Quota attainment</span><b>' + att + '%</b></div><input type="range" min="40" max="120" step="5" value="' + att + '" aria-label="Quota attainment" data-r="att"><div class="m-bench"><span>Your last 6 months: 77%</span><span>Sample benchmark: 70%</span></div></div>' +
          '<div class="m-pane"><span class="m-lab">WHERE IT LANDS</span><div class="m-stats">' + stat("NEW IN 12 MONTHS", $k(total) + "k") + stat("RECURRING REVENUE", "$" + (end / 1000).toFixed(2) + "M", "m-good") + stat("AGAINST $" + (goal / 1000).toFixed(1) + "M GOAL", (end >= goal ? "+" : "") + $k(end - goal).replace("$-", "-$") + "k", end >= goal ? "m-good" : "m-bad") + '</div><p class="m-foot" style="padding:0">Quota of $' + quota + "k new recurring revenue per rep a month. Before churn, to keep the example simple.</p></div></div>";
      }
      el.innerHTML = h + body;
      var r = el.querySelector("input[data-r]"); r.addEventListener("input", function () { if (r.getAttribute("data-r") === "goal") goal = +this.value; else att = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-m]", function (t) { mode = +t.getAttribute("data-m"); draw(); });
    on(el, "[data-a]", function (t) { add = Math.max(0, Math.min(10, add + (t.getAttribute("data-a") === "a+" ? 1 : -1))); draw(); }); draw();
  };

  /* ---------- board pack builder ---------- */
  W.pack = function (el) {
    var S = [["Headline numbers", 1, '<div class="m-stats">' + stat("REVENUE", "$335k") + stat("NET BURN", "$215k") + stat("RUNWAY", "20 months", "m-good") + "</div>"],
      ["Income statement against plan", 1, '<div class="m-fl"><span>Revenue</span><b>335 against 330</b></div><div class="m-fl"><span>Gross margin</span><b>74.9% against 78.0%</b></div><div class="m-fl"><span>Net income</span><b>(215) against (208)</b></div>'],
      ["Cash and runway", 1, '<div class="m-fl"><span>Cash</span><b>$3.06M</b></div><div class="m-fl"><span>Cash out, base case</span><b>July 2028</b></div>'],
      ["Recurring revenue movements", 0, '<div class="m-fl"><span>New and upsell</span><b>+$276k</b></div><div class="m-fl"><span>Downsell and churn</span><b>($116k)</b></div>'],
      ["Headcount", 0, '<div class="m-fl"><span>Team today</span><b>24</b></div><div class="m-fl"><span>Open roles in the plan</span><b>2</b></div>'],
      ["Commentary, drafted by an agent", 1, '<p class="m-p" style="font-size:14px">Revenue grew 4.0% in November. Gross margin fell 3.5 points after hosting costs rose $11.2k. Runway is unchanged at 20 months.</p>']];
    function draw() {
      var on_ = S.filter(function (s) { return s[1]; });
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-list"><div class="m-grp"><span>Sections. Tap to add or remove.</span><b>' + on_.length + " of " + S.length + "</b></div>" + S.map(function (s, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + !!s[1] + '"><span><b>' + s[0] + "</b><small>" + (s[1] ? "In the pack, live from the ledger" : "Not included") + '</small></span><span class="m-chip ' + (s[1] ? "m-blue" : "") + '">' + (s[1] ? "ON" : "ADD") + "</span></button>"; }).join("") + "</div>" +
        '<div class="m-pane"><div class="m-page"><div class="m-doch"><b>Board pack, November 2026</b><span>Sample Co.</span></div>' + (on_.length ? on_.map(function (s) { return '<div class="m-sec"><span class="m-lab">' + s[0].toUpperCase() + "</span>" + s[2] + "</div>"; }).join("") : '<p class="m-p">Add a section to start the pack.</p>') + '</div><p class="m-foot" style="padding:0">Each section is a template that pulls its numbers from the system, so next month\'s pack is already drafted.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { var i = +t.getAttribute("data-i"); S[i][1] = S[i][1] ? 0 : 1; draw(); }); draw();
  };

  /* ---------- comparison: coverage of the nine jobs, and your own stack ---------- */
  W.compare = function (el) {
    var G = [["Revenue", ["Contracts", "Billing", "Commissions"]], ["Books", ["Bookkeeping", "Month-end close", "Statements"]], ["Plan", ["Forecast", "Scenarios", "Board packs"]]];
    var JOBS = G[0][1].concat(G[1][1], G[2][1]);
    var C = [["Spreadsheets", "Excel and Google Sheets", [1, 1, 1, 1, 1, 1, 1, 1, 1], "Can do anything, and all of it by hand."],
      ["Accounting software", "Such as QuickBooks and Xero", [0, 2, 0, 1, 1, 2, 1, 0, 0], "Solid books and invoices. The bookkeeping is still mostly yours to do, and planning stops at a basic budget."],
      ["ERPs", "Such as NetSuite and Odoo", [1, 2, 0, 1, 1, 2, 1, 1, 0], "Broad and configurable. Much of the work is manual, and planning is usually a separate module."],
      ["AI accounting", "Such as Rillet and Digits", [1, 2, 0, 2, 2, 2, 1, 0, 1], "The closest to us on the books, with billing built in. Planning is newer and lighter."],
      ["Billing tools", "Such as Chargebee and Maxio", [1, 2, 0, 0, 0, 0, 0, 0, 0], "Subscriptions and invoices, then the numbers are sent to your accounting system."],
      ["Planning tools", "Such as Pigment and Abacum", [0, 0, 0, 0, 0, 1, 2, 2, 2], "Strong forecasting on numbers imported from somewhere else."],
      ["Commission tools", "Such as CaptivateIQ and QuotaPath", [0, 0, 2, 0, 0, 0, 0, 0, 0], "One job done well, fed by your CRM and billing data."]];
    var use = [1, 1, 0, 0, 0, 0, 0], open = -1;
    function cells(v, cls) { var h = "", n = 0; G.forEach(function (g, gi) { h += '<span class="m-cg">'; g[1].forEach(function () { h += '<i class="m-c' + v[n] + '" title="' + JOBS[n] + '"></i>'; n++; }); h += "</span>"; }); return '<span class="m-cells ' + (cls || "") + '">' + h + "</span>"; }
    function draw() {
      var picked = C.filter(function (c, i) { return use[i]; }), un = JOBS.map(function (j, n) { return picked.reduce(function (a, c) { return Math.max(a, c[2][n]); }, 0); });
      var hand = un.filter(function (x) { return x === 1; }).length, none = JOBS.filter(function (j, n) { return un[n] === 0; }), N = picked.length;
      var head = '<div class="m-crow m-chead"><span></span><span class="m-cells">' + G.map(function (g) { return '<span class="m-cg"><b>' + g[0] + "</b></span>"; }).join("") + "</span></div>";
      el.innerHTML = '<div class="m-cmp"><div class="m-clist">' + head + C.map(function (c, i) {
        return '<div class="m-crow' + (use[i] ? " m-on" : "") + '"><span class="m-cname"><button type="button" class="m-tick" data-u="' + i + '" aria-pressed="' + !!use[i] + '" aria-label="I use ' + c[0] + '">' + (use[i] ? "&#10003;" : "") + '</button><button type="button" class="m-cn" data-o="' + i + '" aria-expanded="' + (open === i) + '"><b>' + c[0] + "</b><small>" + c[1] + "</small></button></span>" + cells(c[2]) + "</div>" +
          (open === i ? '<div class="m-cdet"><p>' + c[3] + "</p><div>" + JOBS.map(function (j, n) { return '<span><i class="m-c' + c[2][n] + '"></i>' + j + "</span>"; }).join("") + "</div></div>" : "");
      }).join("") + "</div>" +
        '<div class="m-cside"><div class="m-cyou"><span class="m-lab">YOUR STACK TODAY</span>' + (N ? "<b>" + N + (N === 1 ? " tool" : " tools") + "</b>" + cells(un) + '<div class="m-fl"><span>Jobs still done by hand</span><b>' + hand + ' of 9</b></div><div class="m-fl"><span>Not covered</span><b>' + (none.length ? none.join(", ") : "Nothing") + '</b></div><div class="m-fl"><span>Connections to keep in sync</span><b>' + (N > 1 ? "At least " + (N - 1) : "None") + "</b></div>" : '<p class="m-p">Tick what you use on the left.</p>') + "</div>" +
        '<div class="m-cus"><span class="m-lab" style="color:#C7D2E6">COUNTAHEAD</span><b>1 system</b>' + cells([2, 2, 2, 2, 2, 2, 2, 2, 2], "m-inv") + '<div class="m-fl"><span>Jobs done by agents, approved by you</span><b>9 of 9</b></div><div class="m-fl"><span>Connections to keep in sync</span><b>None</b></div><p>The contract, the ledger and the forecast are the same data, so nothing is exported or retyped.</p></div></div></div>';
    }
    on(el, "[data-u]", function (t) { var i = +t.getAttribute("data-u"); use[i] = use[i] ? 0 : 1; draw(); });
    on(el, "[data-o]", function (t) { var i = +t.getAttribute("data-o"); open = open === i ? -1 : i; draw(); }); draw();
  };
})();
