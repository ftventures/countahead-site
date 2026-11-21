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
  function enterprise(el) {
    var seats = 40, price = 100, term = 12, bill = 1, ls = 1, impl = 10000, upl = 0, BILL = [["Monthly", 1], ["Quarterly", 3], ["Annual", 12]], TERM = [12, 24, 36];
    function draw(keep) {
      var years = term / 12, tcv = 0; for (var yy = 0; yy < years; yy++) tcv += seats * price * 12 * Math.pow(1 + upl / 100, yy);
      var mrr = seats * price, per = BILL[bill][1], n = Math.min(4, Math.ceil(term / per));
      var inv = []; for (var i = 0; i < n; i++) inv.push([MN[(ls + i * per) % 12] + " 1", mrr * per]);
      if (impl) inv.unshift(["On signature, implementation", impl]);
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">THE CONTRACT</span><div class="m-kv"><span>Customer</span><b>Harbor Labs <small class="m-mini">from your CRM</small></b></div>' +
        '<div class="m-kv"><span>Seats</span><span class="m-stp"><button type="button" data-a="s-">&minus;</button><output>' + seats + '</output><button type="button" data-a="s+">+</button></span></div>' +
        '<div class="m-kv"><span>Price per seat, monthly</span><b>$' + price + '</b></div><input type="range" min="40" max="300" step="10" value="' + price + '" aria-label="Price per seat" data-r="p">' +
        '<div class="m-kv"><span>Term</span><span class="m-opts">' + TERM.map(function (t) { return '<button type="button" data-a="t" data-v="' + t + '" aria-pressed="' + (t === term) + '">' + t + " mo</button>"; }).join("") + "</span></div>" +
        '<div class="m-kv"><span>Billing</span><span class="m-opts">' + BILL.map(function (b, i) { return '<button type="button" data-a="b" data-v="' + i + '" aria-pressed="' + (i === bill) + '">' + b[0] + "</button>"; }).join("") + "</span></div>" +
        (term > 12 ? '<div class="m-kv"><span>Price rise each year</span><span class="m-opts">' + [0, 5, 10].map(function (t) { return '<button type="button" data-a="u" data-v="' + t + '" aria-pressed="' + (t === upl) + '">' + (t ? t + "%" : "None") + "</button>"; }).join("") + "</span></div>" : "") +
        '<div class="m-kv"><span>License starts</span><span class="m-opts">' + [0, 1, 2].map(function (t) { return '<button type="button" data-a="l" data-v="' + t + '" aria-pressed="' + (t === ls) + '">' + MN[t] + " 1</button>"; }).join("") + "</span></div>" +
        '<div class="m-kv"><span>Implementation fee</span><span class="m-opts">' + [0, 10000, 25000].map(function (t) { return '<button type="button" data-a="i" data-v="' + t + '" aria-pressed="' + (t === impl) + '">' + (t ? $k(t) : "None") + "</button>"; }).join("") + "</span></div>" +
        '<p class="m-foot" style="padding:0">Signed Nov 20. Change anything, and everything on the right is worked out from these terms.</p></div>' +
        '<div class="m-pane"><span class="m-lab">WHAT IT CREATES, AUTOMATICALLY</span><div class="m-stats">' + stat("ANNUAL RECURRING", $k(mrr * 12), "m-good") + stat("CONTRACT VALUE", $k(tcv + impl)) + stat("COMMISSION, 10%", $k(mrr * 12 * 0.1)) + "</div>" +
        '<div class="m-flow"><div><small>INVOICES</small>' + inv.map(function (x) { return '<div class="m-fl"><span>' + x[0] + "</span><b>" + $k(x[1]) + "</b></div>"; }).join("") + (Math.ceil(term / per) > n ? '<div class="m-fl m-more"><span>and ' + (Math.ceil(term / per) - n) + " more</span></div>" : "") + "</div>" +
        '<div><small>REVENUE RECOGNITION</small><div class="m-fl"><span>Subscription starts</span><b>' + MN[ls] + ' 1</b></div><div class="m-fl"><span>Each month, ' + term + ' months</span><b>' + $k(mrr) + '</b></div>' + (term > 12 && upl ? '<div class="m-fl"><span>Each month, year 2</span><b>' + $k(mrr * (1 + upl / 100)) + "</b></div>" : "") + (impl ? '<div class="m-fl"><span>Implementation, as delivered</span><b>' + $k(impl) + "</b></div>" : "") + "<div class=\"m-fl\"><span>Deferred until then</span><b>" + (ls ? "Yes" : "No") + '</b></div><small style="margin-top:8px">IN THE PLAN</small><div class="m-fl"><span>Cash forecast</span><b>Updated</b></div><div class="m-fl"><span>Renewal</span><b>' + MN[(ls + term) % 12] + " " + (2026 + Math.floor((ls + term + 11) / 12)) + "</b></div></div></div></div></div>";
      var r = el.querySelector('[data-r="p"]'); r.addEventListener("input", function () { price = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"), v = +t.getAttribute("data-v"); if (a === "s-") seats = Math.max(5, seats - 5); if (a === "s+") seats = Math.min(500, seats + 5); if (a === "t") term = v; if (a === "b") bill = v; if (a === "l") ls = v; if (a === "i") impl = v; if (a === "u") upl = v; draw(); });
    draw();
  }
  function selfserve(el) {
    var EV = [["New", 14, 1386, "#2450DC", "Cards charged at signup. Revenue is recognized day by day over each billing period."], ["Upgrades", 3, 600, "#5B8CFF", "The part-month difference is charged straight away and the revenue schedule is updated."], ["Downgrades", 1, -70, "#C99A2E", "Credit is applied to the next charge. Recurring revenue is reduced from today."], ["Cancellations", 2, -198, "#8A5A00", "Access runs to the end of the paid period, then revenue stops."]], open = 0;
    var PL = [["Starter, $29", 612], ["Team, $99", 540], ["Business, $299", 132]], PAY = [["Charged to cards", "10,094"], ["Refunds", "(372)"], ["Processing fees", "(310)"]];
    function draw() {
      el.innerHTML = '<div class="a-kp">' + [["SUBSCRIBERS", "1,284", "+12 yesterday"], ["MONTHLY RECURRING", "$110.7k", "+$1,718 yesterday"], ["FAILED CARDS RECOVERED", "3 of 4", "retried automatically"], ["TOUCHED BY A PERSON", "0", "of 24 events"]].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-pane"><span class="m-lab">YESTERDAY, MONTHLY RECURRING. TAP ONE.</span>' + EV.map(function (m, i) { return '<button type="button" class="a-mv" data-i="' + i + '" aria-pressed="' + (open === i) + '"><span>' + m[1] + " " + m[0].toLowerCase() + '</span><i><u style="width:' + Math.abs(m[2]) / 1386 * 100 + "%;background:" + m[3] + '"></u></i><b>' + (m[2] > 0 ? "+" : "-") + "$" + Math.abs(m[2]).toLocaleString("en-US") + "</b></button>"; }).join("") + '<div class="m-note">' + CHECK + " " + EV[open][4] + '</div><span class="m-lab" style="margin-top:6px">SUBSCRIBERS BY PLAN</span>' + PL.map(function (x) { return '<div class="m-age" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr) 40px"><span>' + x[0] + '</span><div><i style="width:' + x[1] / 612 * 100 + '%;background:#0B1B3A"></i></div><b>' + x[1] + "</b></div>"; }).join("") + "</div>" +
        '<div class="m-pane"><span class="m-lab">FROM CARD TO BANK TO BOOKS</span>' + PAY.map(function (x) { return '<div class="m-fl"><span>' + x[0] + "</span><b>" + x[1] + "</b></div>"; }).join("") + '<div class="m-kv m-tot"><span>Payout, matched in the bank</span><b>$9,412</b></div><span class="m-lab" style="margin-top:6px">HOW IT WAS BOOKED</span><div class="m-fl"><span>Recognized as revenue so far</span><b>2,966</b></div><div class="m-fl"><span>Deferred, 6 annual plans paid up front</span><b>7,128</b></div><div class="m-fl"><span>Payment fees, an expense</span><b>310</b></div><p class="m-foot" style="padding:0">No contracts and no invoices to raise. Everything is booked from the payment data. Sample plans and prices.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { open = +t.getAttribute("data-i"); draw(); }); draw();
  }
  function pos(el) {
    var IT = [["Flat white", 4.5], ["Sandwich", 9], ["Pastry", 4], ["Juice", 5.5]], tk = [], day = { sales: 2846.5, n: 212 }, paid = false;
    function draw() {
      var sub = tk.reduce(function (a, i) { return a + IT[i][1]; }, 0), tax = sub * 0.08;
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane"><div class="m-doch"><b>Till, front counter</b><span class="m-chip m-warn">COMING LATER</span></div><div class="p-grid">' + IT.map(function (x, i) { return '<button type="button" data-i="' + i + '"><b>' + x[0] + "</b><small>$" + x[1].toFixed(2) + "</small></button>"; }).join("") + '</div><div class="m-fl"><span>Items</span><b>' + tk.length + '</b></div><div class="m-fl"><span>Sales tax, 8%</span><b>$' + tax.toFixed(2) + '</b></div><div class="m-kv m-tot"><span>Total</span><b>$' + (sub + tax).toFixed(2) + '</b></div><div class="m-acts"><button type="button" class="m-btn" data-a="pay"' + (tk.length ? "" : " disabled") + '>Take card payment</button></div></div>' +
        '<div class="m-pane"><span class="m-lab">TODAY, ALREADY IN THE BOOKS</span><div class="m-stats">' + stat("SALES", "$" + day.sales.toLocaleString("en-US", { minimumFractionDigits: 2 }), "m-good") + stat("TICKETS", day.n) + stat("AVERAGE", "$" + (day.sales / day.n).toFixed(2)) + "</div>" + (paid ? '<div class="m-note">' + CHECK + " Sale recorded. Revenue, sales tax owed and the card fee are booked, and stock would be reduced.</div>" : "") + '<div class="m-fl"><span>Sales tax collected, held to pay over</span><b>$' + (day.sales * 0.08).toFixed(2) + '</b></div><div class="m-fl"><span>Card fees</span><b>($' + (day.sales * 0.026).toFixed(2) + ')</b></div><p class="m-foot" style="padding:0">A till for cafes, restaurants and shops is on the roadmap. Until then, tills such as Square and Toast connect in, and each day\'s takings are booked the same way.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { tk.push(+t.getAttribute("data-i")); paid = false; draw(); });
    on(el, "[data-a]", function () { var sub = tk.reduce(function (a, i) { return a + IT[i][1]; }, 0); if (!sub) return; day.sales += sub; day.n++; tk = []; paid = true; draw(); }); draw();
  }
  function contract(el) {
    var T = [["Self-serve", "Customers sign up and pay by card. Fully automatic."], ["Sales-led", "Negotiated contracts, with a license start date and implementation."]];
    el.innerHTML = '<div class="m-kinds">' + T.map(function (t, i) { return '<button type="button" data-k="' + i + '"><b>' + t[0] + "</b><small>" + t[1] + "</small></button>"; }).join("") + '</div><div class="m-kbody"></div>';
    function show(i) { [].forEach.call(el.querySelectorAll("[data-k]"), function (b, n) { b.setAttribute("aria-pressed", n === i); }); var o = el.querySelector(".m-kbody"), n = o.cloneNode(false); o.parentNode.replaceChild(n, o); (i ? enterprise : selfserve)(n);
      var ch = el.parentNode && el.parentNode.querySelector(".m-chain"), CH = i ? ["Customer", "Contract", "Recurring revenue", "Invoice", "Collections", "Cash", "Revenue in the books"] : ["Signup", "Card charged", "Recurring revenue", "Payout", "Revenue in the books"];
      if (ch) ch.innerHTML = '<span class="m-lab" style="flex-basis:100%">SOFTWARE AND OTHER RECURRING REVENUE</span>' + CH.map(function (x, n) { return '<span class="m-node' + (n === 0 ? " m-first" : "") + '">' + x + "</span>"; }).join('<i aria-hidden="true">&rarr;</i>'); }
    el.querySelector(".m-kinds").addEventListener("click", function (e) { var t = e.target.closest("[data-k]"); if (t) show(+t.getAttribute("data-k")); });
    show(1);
  }
  function commerce(el) {
    var CH = [["Shopify", [["Gross sales", 18420, "4000 Product revenue"], ["Discounts", -1210, "4050 Discounts"], ["Refunds", -640, "4060 Refunds"], ["Shipping charged", 980, "4100 Shipping income"], ["Payment fees", -534, "6400 Payment fees"]]], ["Amazon", [["Gross sales", 9860, "4000 Product revenue"], ["Refunds", -310, "4060 Refunds"], ["Referral fees", -1479, "6410 Marketplace fees"], ["Fulfilment fees", -1120, "6420 Fulfilment"], ["Advertising", -460, "6600 Advertising"]]], ["Other marketplaces", [["Gross sales", 3240, "4000 Product revenue"], ["Refunds", -120, "4060 Refunds"], ["Marketplace fees", -421, "6410 Marketplace fees"], ["Shipping labels", -288, "5300 Shipping"]]]], c = 0, open = -1;
    function draw() {
      var rows = CH[c][1], tot = rows.reduce(function (a, r) { return a + r[1]; }, 0);
      el.innerHTML = seg([CH[0][0], CH[1][0], CH[2][0]], c, "c") + '<div class="m-pane" style="padding:0"><div class="m-grp"><span>Yesterday\'s payout, split into the books</span><b>USD</b></div>' +
        rows.map(function (r, i) { return '<button type="button" class="m-acct" data-i="' + i + '" aria-expanded="' + (open === i) + '"><span>' + r[0] + "</span><b>" + (r[1] < 0 ? "(" + $k(-r[1]).slice(1) + ")" : $k(r[1]).slice(1)) + "</b></button>" + (open === i ? '<div class="m-drill"><div><span>Posted to</span><span>' + r[2] + "</span></div></div>" : ""); }).join("") +
        '<div class="m-acct m-total"><span>Payout received in the bank</span><b>' + $k(tot).slice(1) + '</b></div></div><p class="m-foot">' + CHECK + " One payout line in the bank becomes " + rows.length + " correct entries, and the payout reconciles itself. Marketplaces such as eBay, Etsy, Walmart and TikTok Shop work the same way.</p>";
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
  function usage(el) {
    var u = 820, INC = 500, FEE = 2000, RATE = 4;
    function draw(keep) {
      var over = Math.max(u - INC, 0), ov = over * RATE, proj = Math.round(u / 21 * 30), pov = Math.max(proj - INC, 0) * RATE;
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">BRIGHTDESK, NOVEMBER SO FAR (DAY 21)</span><div class="m-kv"><span>Usage this month</span><b>' + u.toLocaleString("en-US") + 'k calls</b></div><input type="range" min="100" max="2000" step="20" value="' + u + '" aria-label="Usage this month" data-r="u"><div class="m-kv"><span>Platform fee, includes ' + INC + 'k calls</span><b>' + $k(FEE) + '</b></div><div class="m-kv"><span>Each extra 1,000 calls</span><b>$' + RATE + '</b></div><p class="m-foot" style="padding:0">Usage is read from your product or data warehouse. Sample pricing.</p></div>' +
        '<div class="m-pane"><span class="m-lab">WHAT THE BOOKS ALREADY KNOW</span><div class="m-stats">' + stat("EARNED SO FAR", $k(FEE + ov), "m-good") + stat("NOT YET INVOICED", $k(ov)) + stat("LIKELY INVOICE, NOV 30", $k(FEE + pov)) + '</div><div class="m-fl"><span>Extra usage so far</span><b>' + over.toLocaleString("en-US") + 'k calls</b></div><div class="m-fl"><span>At this pace, month end</span><b>' + proj.toLocaleString("en-US") + 'k calls</b></div><div class="m-note">' + CHECK + " Revenue is recorded as it is earned, not when the invoice goes out. The invoice is drafted at month end and the forecast uses the current pace.</div></div></div>";
      var r = el.querySelector("[data-r]"); r.addEventListener("input", function () { u = +this.value; draw(true); }); if (keep) r.focus();
    }
    draw();
  }
  var RM = [["Subscriptions", "Software and other recurring contracts", ["Customer", "Contract", "Recurring revenue", "Invoice", "Collections", "Cash", "Revenue in the books"], contract],
    ["Online store", "Selling through Shopify, Amazon or both", ["Orders", "Payout", "Fees and refunds", "Cash", "Revenue in the books"], commerce],
    ["Usage", "Pay for what you use, billed in arrears", ["Usage", "Rated", "Earned revenue", "Invoice", "Cash", "Revenue in the books"], usage],
    ["In person", "A till for hospitality and retail, coming later", ["Sale at the till", "Card payment", "Payout", "Revenue in the books"], pos],
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
    var MV = [["Opening", 3860, 0, []], ["New", 180, 1, [["Harbor Labs", 48], ["Kestrel Freight", 72], ["Oakline Health", 60]]], ["Upsell", 96, 1, [["Northwind Ltd, 20 more seats", 60], ["Tallis and Co, higher plan", 36]]], ["Downsell", -24, -1, [["Brightdesk, 10 fewer seats", -24]]], ["Churn", -92, -1, [["Meridian Labs, did not renew", -92]]], ["Closing", 4020, 0, []]], sel = 1, view = 0, SEG = [["Small, under 50 people", 1120, 22], ["Mid-size", 1840, 14], ["Enterprise", 1060, 5]];
    function draw() {
      var run = 0, top = 4100, base = 3700, H = 170;
      function y(v) { return (top - v) / (top - base) * H; }
      var bars = MV.map(function (m, i) {
        var a, b; if (m[2] === 0) { a = base; b = m[1]; run = m[1]; } else { a = run; b = run + m[1]; run = b; }
        var hi = Math.max(a, b), lo = Math.min(a, b);
        return '<button type="button" class="m-wf" data-i="' + i + '" aria-pressed="' + (i === sel) + '" style="left:' + (i * 16.666) + '%"><span class="m-wfv" style="top:' + (y(hi) - 18) + 'px">' + (m[2] === 0 ? m[1].toLocaleString("en-US") : (m[1] > 0 ? "+" : "") + m[1]) + '</span><i style="top:' + y(hi) + "px;height:" + Math.max(y(lo) - y(hi), 2) + "px;background:" + (m[2] === 0 ? "var(--ink)" : m[2] > 0 ? "#2450DC" : "#8A5A00") + '"></i><span class="m-wfl">' + m[0] + "</span></button>";
      }).join("");
      var m = MV[sel];
      el.innerHTML = '<div class="m-stats">' + stat("RECURRING REVENUE, NOV", "$4.02M", "m-good") + stat("NET NEW", "+$160k") + stat("NET RETENTION, NOV", "99.5%") + stat("GROSS RETENTION, NOV", "97.0%") + "</div>" + seg(["By movement", "By segment"], view, "v") + (view ? '<div class="m-pane">' + SEG.map(function (g) { return '<div class="m-li" style="padding:10px 0"><span style="flex:1"><b>' + g[0] + "</b><small>" + g[2] + " customers, $" + Math.round(g[1] / g[2]) + 'k each on average</small><span class="m-track" style="margin-top:6px"><i style="width:' + g[1] / 4020 * 100 + '%"></i></span></span><b>$' + (g[1] / 1000).toFixed(2) + "M</b></div>"; }).join("") + '<p class="m-foot" style="padding:0">Segments come from the customer record, so the same split is available in the forecast and the board pack.</p></div>' : '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">MOVEMENTS IN NOVEMBER, USD THOUSANDS. TAP A BAR.</span><div class="m-wfc" style="height:' + (H + 40) + 'px">' + bars + '</div></div><div class="m-pane"><span class="m-lab">' + m[0].toUpperCase() + ": WHAT IS BEHIND IT</span>" +
        (m[3].length ? m[3].map(function (c) { return '<div class="m-li" style="padding:10px 0"><span><b>' + c[0] + "</b><small>From the signed contract</small></span><b>" + (c[1] > 0 ? "+" : "") + c[1] + "</b></div>"; }).join("") : '<p class="m-p">' + (sel === 0 ? "Recurring revenue at the start of November, from 40 active contracts." : "Recurring revenue at the end of November. It ties to the $335k recognized this month.") + "</p>") + "</div></div>");
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); }); on(el, "[data-v]", function (t) { view = +t.getAttribute("data-v"); draw(); }); draw();
  };

  /* ---------- commissions ---------- */
  W.comm = function (el) {
    var REPS = [["Priya", 120, [["Kestrel Freight", 72, 0, 1], ["Oakline Health", 60, 0, 0]]], ["Daniel", 120, [["Northwind Ltd", 60, 1, 0], ["Tallis and Co", 36, 1, 0]]], ["Sofia", 120, [["Harbor Labs", 48, 0, 1]]]];
    var rate = 10, up = 5, acc = 1.5, when = 2, claw = 6, sel = 0, WHEN = ["On signature", "When the customer pays", "Half and half"];
    function calc(r) {
      var booked = 0, paid = 0, base = 0, lines = r[2].map(function (d) { var rt = d[2] ? up : rate, c = d[1] * 1000 * rt / 100; booked += d[1]; if (d[3]) paid += d[1]; base += c; return [d[0], d[1], d[2], rt, c, d[3]]; });
      var over = Math.max(booked - r[1], 0), bonus = over * 1000 * rate / 100 * (acc - 1), total = base + bonus, pf = booked ? paid / booked : 0, frac = when === 0 ? 1 : when === 1 ? pf : 0.5 + 0.5 * pf;
      return { booked: booked, lines: lines, over: over, bonus: bonus, total: total, now: total * frac, held: total * (1 - frac) };
    }
    function opts(a, list, cur, fmt) { return '<span class="m-opts">' + list.map(function (v, i) { var val = typeof v === "string" ? i : v; return '<button type="button" data-a="' + a + '" data-v="' + val + '" aria-pressed="' + (val === cur) + '">' + (fmt ? fmt(v) : v) + "</button>"; }).join("") + "</span>"; }
    function draw(keep) {
      var r = REPS[sel], c = calc(r);
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">THE PLAN. CHANGE ANY RULE.</span>' +
        '<div class="m-kv"><span>Rate on new business</span><b>' + rate + '%</b></div><input type="range" min="4" max="20" step="1" value="' + rate + '" aria-label="Rate on new business" data-r="rate">' +
        '<div class="m-kv"><span>Rate on upsells</span><b>' + up + '%</b></div><input type="range" min="0" max="20" step="1" value="' + up + '" aria-label="Rate on upsells" data-r="up">' +
        '<div class="m-kv"><span>Above quota, pay</span>' + opts("acc", [1, 1.5, 2], acc, function (v) { return v + "x"; }) + "</div>" +
        '<div class="m-kv"><span>Paid</span>' + opts("when", WHEN, when) + "</div>" +
        '<div class="m-kv"><span>Clawed back if cancelled within</span>' + opts("claw", [0, 6, 12], claw, function (v) { return v ? v + " mo" : "Never"; }) + "</div>" +
        '<p class="m-foot" style="padding:0">Sample plan with a quota of $120k of new recurring revenue per rep.</p></div>' +
        '<div class="m-pane" style="padding:0"><div class="m-list" style="border:0">' + REPS.map(function (x, i) { var k = calc(x), at = Math.round(k.booked / x[1] * 100); return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + x[0] + "</b><small>" + at + "% of quota, booked $" + k.booked + "k</small></span><b>" + $k(k.total) + "</b></button>"; }).join("") + "</div>" +
        '<div style="padding:14px 16px;display:flex;flex-direction:column;gap:6px"><span class="m-lab">' + r[0].toUpperCase() + ", NOVEMBER STATEMENT</span>" + c.lines.map(function (d) { return '<div class="m-li" style="padding:8px 0"><span><b>' + d[0] + "</b><small>" + (d[2] ? "Upsell" : "New") + ", $" + d[1] + "k at " + d[3] + "%, " + (d[5] ? "customer has paid" : "not yet paid") + "</small></span><b>" + $k(d[4]) + "</b></div>"; }).join("") +
        (c.bonus ? '<div class="m-li" style="padding:8px 0"><span><b>Above quota</b><small>$' + c.over + "k over, at " + acc + " times the rate</small></span><b>" + $k(c.bonus) + "</b></div>" : "") +
        '<div class="m-kv m-tot"><span>Earned</span><b>' + $k(c.total) + '</b></div><div class="m-fl"><span>Payable this month</span><b>' + $k(c.now) + '</b></div><div class="m-fl"><span>Held until the customer pays</span><b>' + $k(c.held) + '</b></div><div class="m-note">' + CHECK + " Accrued in the books and added to the payroll forecast" + (claw ? ". Reversed automatically if a deal cancels within " + claw + " months." : ".") + "</div></div></div></div>";
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (s) { s.addEventListener("input", function () { if (s.getAttribute("data-r") === "rate") rate = +this.value; else up = +this.value; draw(s.getAttribute("data-r")); }); });
      if (keep) el.querySelector('[data-r="' + keep + '"]').focus();
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"), v = +t.getAttribute("data-v"); if (a === "acc") acc = v; if (a === "when") when = v; if (a === "claw") claw = v; draw(); }); draw();
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

  /* ---------- board pack, as slides ---------- */
  W.pack = function (el) {
    function kp(l, v, d, good) { return '<div class="sl-k"><small>' + l + "</small><b>" + v + '</b><span class="' + (good ? "sl-up" : "sl-dn") + '">' + d + "</span></div>"; }
    function row(a, b, c, d, cls) { return '<div class="sl-r ' + (cls || "") + '"><span>' + a + "</span><b>" + b + "</b><b>" + c + '</b><b class="' + (d.charAt(0) === "+" ? "sl-up" : d === "0" ? "" : "sl-dn") + '">' + d + "</b></div>"; }
    function bul(t, items) { return '<div class="sl-bx"><small>' + t + "</small><ul>" + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>"; }
    function bridge() {
      var MV = [["Opening", 3860, 0], ["New", 180, 1], ["Upsell", 96, 1], ["Downsell", -24, -1], ["Churn", -92, -1], ["Closing", 4020, 0]], run = 0, h = "", Wd = 600, H = 200, base = 3700, top = 4160;
      function y(v) { return 24 + (top - v) / (top - base) * (H - 50); }
      MV.forEach(function (m, i) { var a, b; if (m[2] === 0) { a = base; b = m[1]; run = m[1]; } else { a = run; b = run + m[1]; run = b; } var hi = Math.max(a, b), lo = Math.min(a, b), x = 14 + i * 98;
        h += '<rect x="' + x + '" y="' + y(hi) + '" width="76" height="' + Math.max(y(lo) - y(hi), 2) + '" fill="' + (m[2] === 0 ? "#0B1B3A" : m[2] > 0 ? "#2450DC" : "#B9C3D3") + '"></rect><text x="' + (x + 38) + '" y="' + (y(hi) - 6) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#0B1B3A">' + (m[2] === 0 ? m[1].toLocaleString("en-US") : (m[1] > 0 ? "+" : "") + m[1]) + '</text><text x="' + (x + 38) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="12" fill="#4B5565">' + m[0] + "</text>"; });
      return '<svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="Recurring revenue bridge for November">' + h + '<line x1="0" x2="' + Wd + '" y1="' + (H - 22) + '" y2="' + (H - 22) + '" stroke="#0B1B3A"></line></svg>';
    }
    function cash() {
      var a = run(2, 0, 24).a, Wd = 600, H = 200, pts = a.map(function (v, m) { return (20 + m / 24 * (Wd - 40)).toFixed(1) + "," + (16 + (1 - v / 3200) * (H - 50)).toFixed(1); });
      return '<svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="Cash balance over the next 24 months"><polygon fill="#E6EDFF" points="20,' + (H - 34) + " " + pts.join(" ") + " " + (Wd - 20) + "," + (H - 34) + '"></polygon><polyline fill="none" stroke="#2450DC" stroke-width="3.5" points="' + pts.join(" ") + '"></polyline><line x1="20" x2="' + (Wd - 20) + '" y1="' + (H - 34) + '" y2="' + (H - 34) + '" stroke="#0B1B3A"></line>' + [["Nov 2026", 20, "start"], ["Nov 2027", Wd / 2, "middle"], ["Nov 2028", Wd - 20, "end"]].map(function (t) { return '<text x="' + t[1] + '" y="' + (H - 14) + '" text-anchor="' + t[2] + '" font-size="12" fill="#4B5565">' + t[0] + "</text>"; }).join("") + '<circle cx="' + (20 + 20 / 24 * (Wd - 40)) + '" cy="' + (H - 34) + '" r="6" fill="#FFD15C" stroke="#0B1B3A" stroke-width="1.5"></circle><text x="' + (20 + 20 / 24 * (Wd - 40)) + '" y="' + (H - 46) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#0B1B3A">Cash out, Jul 2028</text></svg>';
    }
    var TEAM = [["Engineering", 11], ["Sales", 5], ["Customer success", 3], ["Operations", 3], ["Finance and admin", 2]];
    var S = [["Cover", 1, function () { return '<div class="sl-in sl-cover"><small>SAMPLE CO.</small><h4>Board meeting</h4><p>November 2026 results and outlook</p><div class="sl-ag"><span>Highlights</span><span>Financials</span><span>Revenue</span><span>Cash</span><span>Team</span><span>Decisions</span></div></div>'; }],
      ["Highlights", 1, function () { return '<p class="sl-ey">Highlights</p><h4>Revenue ahead of plan, margin behind</h4><div class="sl-kp">' + kp("RECURRING REVENUE", "$4.02M", "+4.1% on October", 1) + kp("REVENUE", "$335k", "+$5k against plan", 1) + kp("NET BURN", "$215k", "$8k over plan", 0) + kp("RUNWAY", "20 months", "No change", 1) + '</div><div class="sl-2">' + bul("WENT WELL", ["Three new customers, $180k of new recurring revenue", "Two upsells worth $96k"]) + bul("NEEDS ATTENTION", ["Gross margin 74.9% against a 78% plan, after hosting costs rose", "One customer did not renew, $92k"]) + "</div>"; }],
      ["Financials against plan", 1, function () { return '<p class="sl-ey">Financials</p><h4>November against plan, USD thousands</h4><div class="sl-tb"><div class="sl-r sl-hd"><span></span><b>Actual</b><b>Plan</b><b>Variance</b></div>' + row("Revenue", "335", "330", "+5") + row("Cost of revenue", "(84)", "(73)", "(11)") + row("Gross profit", "251", "257", "(6)", "sl-st") + row("Research and development", "(228)", "(226)", "(2)") + row("Sales and marketing", "(142)", "(144)", "+2") + row("General and administrative", "(100)", "(98)", "(2)") + row("EBITDA", "(219)", "(211)", "(8)", "sl-st") + row("Depreciation, interest and tax", "4", "4", "0") + row("Net income", "(215)", "(207)", "(8)", "sl-st") + '</div><p class="sl-nt">Drafted commentary: the $8k miss is almost all hosting. Revenue beat plan by $5k.</p>'; }],
      ["Recurring revenue", 1, function () { return '<p class="sl-ey">Revenue</p><h4>Recurring revenue grew $160k to $4.02M</h4><div class="sl-ch">' + bridge() + '</div><div class="sl-kp sl-k3">' + kp("NET RETENTION, NOV", "99.5%", "Upsells nearly cover losses", 1) + kp("GROSS RETENTION, NOV", "97.0%", "$116k lost", 0) + kp("CUSTOMERS", "41", "+2 net", 1) + "</div>"; }],
      ["Cash and runway", 1, function () { return '<p class="sl-ey">Cash</p><h4>$3.06M in the bank, 20 months of runway</h4><div class="sl-ch">' + cash() + '</div><div class="sl-kp sl-k3">' + kp("BASE CASE", "Jul 2028", "2% monthly growth", 1) + kp("DOWNSIDE", "Feb 2028", "0.5% monthly growth", 0) + kp("UPSIDE", "Breakeven", "4% growth, 3 hires", 1) + "</div>"; }],
      ["Team", 1, function () { return '<p class="sl-ey">Team</p><h4>24 people, 2 open roles in the plan</h4><div class="sl-bars">' + TEAM.map(function (t) { return '<div><span>' + t[0] + '</span><i><u style="width:' + t[1] / 11 * 100 + '%"></u></i><b>' + t[1] + "</b></div>"; }).join("") + '</div><div class="sl-2">' + bul("OPEN ROLES", ["Account executive, offer accepted", "Senior engineer, interviewing"]) + bul("PAYROLL", ["$372k a month, 63% of total costs"]) + "</div>"; }],
      ["Decisions", 1, function () { return '<p class="sl-ey">For the board</p><h4>Two decisions we are asking for</h4><div class="sl-dec"><div><b>1</b><span><strong>Approve two sales hires in January.</strong> Runway moves from 20 to 18 months in the base case.</span></div><div><b>2</b><span><strong>Approve the move to a committed hosting contract.</strong> Brings gross margin back toward plan from the first quarter.</span></div></div><p class="sl-nt">Every number in this pack is read from the ledger and the plan at the time it was built.</p>'; }]];
    var cur = 1;
    function inc() { return S.map(function (s, i) { return i; }).filter(function (i) { return S[i][1]; }); }
    function slide(i, pg, tot) { var body = S[i][2](); return '<div class="sl' + (i === 0 ? " sl-dark" : "") + '">' + (i === 0 ? body : '<div class="sl-in">' + body + "</div>") + '<div class="sl-ft"><span>Sample Co. &middot; Board meeting, November 2026 &middot; Confidential</span><span>' + (pg ? pg + " / " + tot : "") + "</span></div></div>"; }
    function draw() {
      var I = inc(), pos = I.indexOf(cur);
      el.innerHTML = '<div class="bp"><div class="bp-strip nosb">' + S.map(function (s, i) { return '<div class="bp-th' + (i === cur ? " bp-cur" : "") + (s[1] ? "" : " bp-off") + '"><div class="bp-mini" data-go="' + i + '" role="button" tabindex="0" aria-label="Show slide: ' + s[0] + '">' + slide(i) + '</div><div class="bp-cap"><small>' + s[0] + '</small><button type="button" class="m-tick" data-tg="' + i + '" aria-pressed="' + !!s[1] + '" aria-label="Include ' + s[0] + '">' + (s[1] ? "&#10003;" : "") + "</button></div></div>"; }).join("") + "</div>" +
        '<div class="bp-main"><div class="bp-bar"><span><b>Board pack, November 2026</b><small>' + I.length + " slides, drafted from the ledger and the plan</small></span><span class=\"m-stp\"><button type=\"button\" data-nav=\"-1\" aria-label=\"Previous slide\">&larr;</button><output>" + (pos + 1) + " / " + I.length + '</output><button type="button" data-nav="1" aria-label="Next slide">&rarr;</button></span></div>' + (I.length ? slide(cur, pos + 1, I.length) : '<p class="m-p">Tick a slide to start the pack.</p>') + '<p class="m-foot" style="padding:0">Tick slides in or out on the left. Each one is a template that fills itself from live numbers, with commentary drafted for you to edit, then exports as slides or a PDF.</p></div></div>';
    }
    on(el, "[data-tg]", function (t, e) { e.stopPropagation(); var i = +t.getAttribute("data-tg"); S[i][1] = S[i][1] ? 0 : 1; var I = inc(); if (I.indexOf(cur) < 0 && I.length) cur = I.filter(function (x) { return x > i; })[0] !== undefined ? I.filter(function (x) { return x > i; })[0] : I[I.length - 1]; draw(); });
    on(el, "[data-go]", function (t) { var i = +t.getAttribute("data-go"); if (!S[i][1]) S[i][1] = 1; cur = i; draw(); });
    on(el, "[data-nav]", function (t) { var I = inc(), p = I.indexOf(cur) + +t.getAttribute("data-nav"); if (I.length) cur = I[(p + I.length) % I.length]; draw(); });
    draw();
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

  /* ---------- customer record ---------- */
  W.customer = function (el) {
    var CU = [["Harbor Labs", "Software, 120 people", [["Maya Chen", "Head of Finance, pays the invoices"], ["Tom Reyes", "VP Operations, signed the contract"]], "$48,000", "40 seats, 12 months, renews Dec 2027", "Nothing overdue", "Priya"],
      ["Northwind Ltd", "Logistics, 300 people", [["Elena Novak", "Finance Manager, pays the invoices"], ["Sam Okafor", "COO, signed the contract"]], "$132,000", "110 seats, 24 months, renews Mar 2028", "$18,000 overdue by 34 days", "Daniel"],
      ["Kestrel Freight", "Freight, 80 people", [["Jon Halvorsen", "Controller, pays the invoices"]], "$72,000", "60 seats, 12 months, renews Nov 2027", "$6,000 due in 5 days", "Priya"]], sel = 0;
    function draw() {
      var c = CU[sel];
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-list"><div class="m-grp"><span>Customers, synced with your CRM</span><b>41</b></div>' + CU.map(function (x, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + x[0] + "</b><small>" + x[1] + "</small></span><b>" + x[3] + "</b></button>"; }).join("") + "</div>" +
        '<div class="m-pane"><span class="m-lab">' + c[0].toUpperCase() + ": ONE RECORD</span><div class=\"m-stats\">" + stat("RECURRING REVENUE", c[3], "m-good") + stat("OWNER", c[6]) + '</div><div class="m-kv"><span>Contract</span><b>' + c[4] + '</b></div><div class="m-kv"><span>Receivables</span><b>' + c[5] + "</b></div>" +
        '<span class="m-lab" style="margin-top:6px">PEOPLE</span>' + c[2].map(function (p) { return '<div class="m-li" style="padding:8px 0"><span><b>' + p[0] + "</b><small>" + p[1] + "</small></span></div>"; }).join("") + '<p class="m-foot" style="padding:0">Sales, finance and the forecast all read this record, so there is one answer to what a customer pays.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); }); draw();
  };

  /* ---------- contract lifecycle ---------- */
  W.lifecycle = function (el) {
    var ST = ["Drafted", "Approved", "Signed", "Live"], step = 0, arr = 48000, log, did;
    function reset() { step = 0; arr = 48000; did = {}; log = [["Drafted by an agent from the won deal in your CRM", "40 seats at $100, 12 months, 15% discount"]]; }
    function draw() {
      var act = step === 0 ? [["go", "Send for approval"]] : step === 1 ? [["go", "Approve the discount"]] : step === 2 ? [["go", "Customer signs"]] : [].concat(did.a ? [] : [["amend", "Amend: add 20 seats"]], did.r ? [] : [["renew", "Renew for 12 months"]], [["reset", "Start again"]]);
      el.innerHTML = '<div class="m-chain">' + ST.map(function (s, i) { return '<span class="m-node' + (i <= step ? " m-first" : "") + '">' + s + "</span>"; }).join('<i aria-hidden="true">&rarr;</i>') + '</div><div class="m-two m-tw2"><div class="m-pane"><div class="m-doch"><b>Harbor Labs, subscription agreement</b><span class="m-chip ' + (step === 3 ? "m-blue" : "m-warn") + '">' + (step === 1 ? "NEEDS APPROVAL" : step === 2 ? "OUT FOR SIGNATURE" : ST[step].toUpperCase()) + '</span></div><div class="m-stats">' + stat("RECURRING REVENUE", step === 3 ? $k(arr) : "Not yet", step === 3 ? "m-good" : "") + stat("SEATS", did.a ? 60 : 40) + stat("ENDS", did.r ? "Nov 2028" : "Nov 2027") + "</div>" +
        (step === 1 ? '<div class="m-note">A 15% discount is above the 10% a rep can give alone, so this waits for finance. Example policy.</div>' : "") +
        '<div class="m-acts" style="flex-wrap:wrap">' + act.map(function (a, i) { return '<button type="button" class="m-btn' + (a[0] === "reset" || i > 0 ? " m-ghost" : "") + '" data-a="' + a[0] + '">' + a[1] + "</button>"; }).join("") + '</div><p class="m-foot" style="padding:0">Nothing counts as revenue until the contract is signed. After that, every change goes through an amendment, and agents never alter signed terms.</p></div>' +
        '<div class="m-pane"><span class="m-lab">WHAT HAPPENED, AND WHAT IT CHANGED</span>' + log.slice().reverse().map(function (l) { return '<div class="m-li" style="padding:9px 0"><span><b>' + l[0] + "</b><small>" + l[1] + "</small></span></div>"; }).join("") + "</div></div>";
    }
    on(el, "[data-a]", function (t) {
      var a = t.getAttribute("data-a");
      if (a === "reset") reset();
      else if (a === "go") { step++; log.push(step === 1 ? ["Sent to finance for approval", "Discount above the rep limit"] : step === 2 ? ["Approved and sent for signature", "Terms locked, signing link sent to Tom Reyes"] : ["Signed on the platform. Contract is live", "Booked $48,000 of recurring revenue, 12 invoices scheduled, commission accrued, forecast updated"]); }
      else if (a === "amend") { did.a = 1; arr += 24000; log.push(["Amendment signed: 20 more seats", "Upsell of $24,000, a part-month invoice drafted, revenue schedule and commission updated"]); }
      else if (a === "renew") { did.r = 1; log.push(["Renewed for 12 months", "End date moved to Nov 2028, no change to recurring revenue, removed from the at-risk list in the forecast"]); }
      draw();
    });
    reset(); draw();
  };

  /* ---------- collections agent ---------- */
  W.collect = function (el) {
    var R = [["Northwind Ltd", "INV-0141", 18000, 34, "Elena Novak", "Third follow-up, firmer, with the statement attached and Sam Okafor copied.", "Hi Elena, invoice INV-0141 for $18,000 is now 34 days past due. I have attached the statement and copied Sam. Could you confirm a payment date this week?"],
      ["Tallis and Co", "INV-0147", 9000, 12, "their finance contact", "Second reminder, still friendly, with the payment link.", "Hi, a quick follow-up on INV-0147 for $9,000, which was due 12 days ago. The payment link is below. Let me know if anything is holding it up."],
      ["Oakline Health", "INV-0149", 5000, 3, "their finance contact", "First gentle reminder.", "Hi, a friendly reminder that INV-0149 for $5,000 was due on Monday. Here is the link to pay whenever you are ready."],
      ["Kestrel Freight", "INV-0150", 6000, -5, "Jon Halvorsen", "Not due yet. A heads-up is scheduled for the due date.", ""]], sel = 0, sent = {};
    function draw() {
      var r = R[sel], over = R.reduce(function (a, x) { return a + (x[3] > 0 ? x[2] : 0); }, 0), tot = R.reduce(function (a, x) { return a + x[2]; }, 0);
      el.innerHTML = '<div class="m-stats">' + stat("OUTSTANDING", $k(tot)) + stat("OVERDUE", $k(over), "m-bad") + stat("FOLLOW-UPS SENT", Object.keys(sent).length) + '</div><div class="m-two m-tw2"><div class="m-list">' + R.map(function (x, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + x[0] + "</b><small>" + x[1] + ", " + (x[3] > 0 ? x[3] + " days overdue" : "due in " + -x[3] + " days") + '</small></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>' + $k(x[2]) + '</b><span class="m-chip ' + (sent[i] ? "m-blue" : x[3] > 0 ? "m-warn" : "") + '">' + (sent[i] ? "SENT" : x[3] > 0 ? "DRAFT READY" : "NOT DUE") + "</span></span></button>"; }).join("") + "</div>" +
        '<div class="m-pane"><span class="m-lab">THE AGENT\'S PLAN FOR ' + r[0].toUpperCase() + '</span><p class="m-p" style="font-size:15px">' + r[5] + "</p>" + (r[6] ? '<div class="m-inv"><div class="m-kv"><span>To</span><b>' + r[4] + '</b></div><p class="m-p" style="font-size:14px;margin:8px 0 0">' + r[6] + "</p></div>" + (sent[sel] ? '<div class="m-note">' + CHECK + " Sent. When the payment lands it is matched to the invoice and the cash forecast updates.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="send">Approve and send</button></div>') : "") + '<p class="m-foot" style="padding:0">The agent writes each follow-up from the invoice, the contract and the payment history. You decide which ones need your approval.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); }); on(el, "[data-a]", function () { sent[sel] = 1; draw(); }); draw();
  };

  /* ---------- deals pipeline ---------- */
  W.pipeline = function (el) {
    var STG = [["Qualified", 20], ["Proposal", 50], ["Negotiation", 75], ["Won", 100]], D;
    function reset() { D = [["Tallis and Co, 30 more seats", 36, 2, "Daniel"], ["Pallas Robotics", 84, 2, "Priya"], ["Quill Studio", 30, 1, "Sofia"], ["Ferro Marine", 96, 1, "Priya"], ["Lumen Dental", 42, 0, "Sofia"], ["Arden Foods", 60, 0, "Daniel"]]; }
    function draw() {
      var open = D.filter(function (d) { return d[2] < 3; }), tot = open.reduce(function (a, d) { return a + d[1]; }, 0), wt = open.reduce(function (a, d) { return a + d[1] * STG[d[2]][1] / 100; }, 0), won = D.filter(function (d) { return d[2] === 3; });
      el.innerHTML = '<div class="m-stats">' + stat("OPEN PIPELINE", "$" + tot + "k") + stat("WEIGHTED, IN THE FORECAST", "$" + Math.round(wt) + "k", "m-good") + stat("WON HERE", won.length) + '</div><div class="m-pipe">' + STG.map(function (st, si) { var ds = D.map(function (d, i) { return [d, i]; }).filter(function (x) { return x[0][2] === si; });
        return '<div class="m-pcol"><div class="m-grp"><span>' + st[0] + "</span><b>" + (si < 3 ? st[1] + "%" : "") + "</b></div>" + (ds.length ? ds.map(function (x) { var d = x[0]; return '<div class="m-deal"><b>' + d[0] + "</b><small>$" + d[1] + "k a year, " + d[3] + "</small>" + (si < 3 ? '<button type="button" class="m-btn m-sm" data-i="' + x[1] + '">' + (si === 2 ? "Mark won" : "Move on") + " &rarr;</button>" : '<span class="m-chip m-blue">CONTRACT DRAFTED</span>') + "</div>"; }).join("") : '<p class="m-foot">Nothing here.</p>') + "</div>"; }).join("") + '</div><p class="m-foot">Move a deal along. The forecast takes each deal at its stage probability, and a won deal becomes a draft contract with its terms filled in. Sample probabilities. <button type="button" class="m-link" data-a="r">Reset</button></p>';
    }
    on(el, "[data-i]", function (t) { D[+t.getAttribute("data-i")][2]++; draw(); }); on(el, "[data-a]", function () { reset(); draw(); }); reset(); draw();
  };
})();
