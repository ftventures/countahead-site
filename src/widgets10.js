/* People page, the Budgets demo on Plan, and the founding firms request. Sample data throughout. */
(function () {
  var W = window.CAWidgets;
  var RM = !!window.__PRERENDER || !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function usd(n) { return (n < 0 ? "-" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US"); }
  function k(n) { return "$" + (Math.round(n * 10) / 10).toLocaleString("en-US") + "k"; }
  function $(el, s) { return el.querySelector(s); }
  function all(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function tabs(list, cur, attr) { return '<div class="pl-tabs" role="tablist">' + list.map(function (t, i) { return '<button type="button" role="tab" data-' + attr + '="' + i + '" aria-selected="' + (i === cur) + '">' + t + "</button>"; }).join("") + "</div>"; }

  /* ---------- people: the team ---------- */
  var DEPT = [["Engineering", 10, "#0B1B3A"], ["Sales and marketing", 7, "#2450DC"], ["Customer success", 4, "#8FA8F5"], ["General and admin", 3, "#FFD15C"]];
  var PPL = [["Dev Patel", "Senior engineer", 0, "Mar 2024", "Employee"], ["Lena Fischer", "Engineer", 0, "Sep 2025", "Employee"], ["Priya Nair", "Product designer", 0, "Jan 2026", "Contractor"], ["Sofia Alvarez", "Account executive", 1, "Jun 2025", "Employee"], ["Marcus Lee", "Marketing lead", 1, "Feb 2025", "Employee"], ["Omar Haddad", "Customer success lead", 2, "Nov 2024", "Employee"], ["Jo Kim", "Support specialist", 2, "Dec 2026", "Employee"], ["Maya Chen", "Finance lead", 3, "Aug 2024", "Employee"]];
  var ROLES = [["Senior engineer", 0, 2, "Offer accepted. Starts January 12."], ["Account executive", 1, 1, "Approved in the budget. Hiring has started."], ["Support lead", 2, 0, "In the plan for March. Not yet approved."]];
  W.peopleteam = function (el) {
    var tab = 0, dep = -1;
    function draw() {
      var body, tot = 24;
      if (tab === 0) body = '<div class="pl-bars">' + DEPT.map(function (d) { return '<div><span>' + d[0] + '</span><i><u style="width:' + d[1] / 10 * 100 + "%;background:" + d[2] + '"></u></i><b>' + d[1] + "</b></div>"; }).join("") + '</div><p class="pl-cap">Headcount by team today. The same teams carry the budget, the payroll entry and the plan, so the three always agree.</p>';
      else if (tab === 1) { var L = PPL.filter(function (p) { return dep < 0 || p[2] === dep; }); body = '<div class="pl-chips" role="group" aria-label="Team"><button type="button" data-d="-1" aria-pressed="' + (dep < 0) + '">All</button>' + DEPT.map(function (d, i) { return '<button type="button" data-d="' + i + '" aria-pressed="' + (dep === i) + '">' + d[0] + "</button>"; }).join("") + '</div><div class="pl-list">' + L.map(function (p) { return "<div><span><b>" + p[0] + "</b><small>" + p[1] + " &middot; " + DEPT[p[2]][0] + "</small></span><em>" + p[4] + "</em><small>Since " + p[3] + "</small></div>"; }).join("") + '</div><p class="pl-cap">Eight of the 24, as a sample. Names, employer, pay and dates come from your payroll system, read only.</p>'; }
      else body = '<div class="pl-list">' + ROLES.map(function (r) { return '<div class="pl-role"><span><b>' + r[0] + "</b><small>" + DEPT[r[1]][0] + '</small></span><div class="pl-st">' + ["Planned", "Approved", "Offer out", "Filled"].map(function (s, i) { return '<i class="' + (i <= r[2] ? "pl-on" : "") + '">' + s + "</i>"; }).join("") + "</div><small>" + r[3] + "</small></div>"; }).join("") + '</div><p class="pl-cap">A role is a line in the budget before it is a person. When the hire appears in payroll, the two are matched, so nobody is counted twice.</p>';
      el.innerHTML = '<div class="pl-kp"><div><small>PEOPLE</small><b>' + tot + '</b><span>22 employees, 2 contractors</span></div><div><small>OPEN ROLES</small><b>3</b><span>one offer accepted</span></div><div><small>PEOPLE COST, NOVEMBER</small><b>$372k</b><span>plan was $381k</span></div><div><small>AGAINST PLAN</small><b>$9k under</b><span>one hire started late</span></div></div>' + tabs(["By team", "People", "Open roles"], tab, "t") + '<div class="pl-body">' + body + "</div>";
    }
    on(el, "[data-t]", function (b) { tab = +b.getAttribute("data-t"); draw(); });
    on(el, "[data-d]", function (b) { dep = +b.getAttribute("data-d"); draw(); });
    draw();
  };

  /* ---------- people: my page ---------- */
  W.peopleme = function (el) {
    var P = [
      ["Dev Patel", "Senior engineer", [["Time off", "14 days left", "Of 20 this year. Next booked: December 22 to 26."], ["Expenses", "1 waiting", "A $86 receipt, sent Tuesday. Approved, repaid with the next pay run."], ["Equity", "4,500 vested", "Of 12,000 options. Exercising them today would cost $2,250."], ["Policies", "1 to confirm", "Travel and expenses, version 3. Changed on November 3."], ["Documents", "2 signed", "Your employment agreement and your option grant."]]],
      ["Sofia Alvarez", "Account executive", [["Commission", "$4,800 for November", "Three deals behind it. Open the statement to see each one."], ["Time off", "9 days left", "Of 20 this year. Nothing booked."], ["Expenses", "Nothing waiting", "Your last claim was repaid on November 15."], ["Approvals", "2 waiting on you", "Two discount requests from your own deals need a reason."], ["Documents", "3 signed", "Your employment agreement, commission plan and option grant."]]],
      ["Jo Kim", "Support specialist, day 3", [["Getting started", "3 of 5 done", "Still to do: confirm two policies and order your laptop."], ["Policies", "2 to confirm", "Spending and approvals, and travel and expenses."], ["Time off", "20 days", "Your allowance for the year ahead."], ["Documents", "1 signed", "Your employment agreement, signed November 28."], ["Pay", "In your payroll app", "Payslips and bank details stay with the payroll provider. This links there."]]]
    ];
    var who = 0, sel = 0;
    function draw() {
      var p = P[who], t = p[2][sel];
      el.innerHTML = '<div class="pm-top"><small>SIGNED IN AS</small><div class="pl-chips" role="group" aria-label="Person">' + P.map(function (x, i) { return '<button type="button" data-w="' + i + '" aria-pressed="' + (i === who) + '">' + x[0] + "</button>"; }).join("") + '</div></div><div class="pm-body"><div class="pm-tiles">' + p[2].map(function (x, i) { return '<button type="button" data-s="' + i + '" aria-pressed="' + (i === sel) + '"><small>' + x[0].toUpperCase() + "</small><b>" + x[1] + "</b></button>"; }).join("") + '</div><div class="pm-det" aria-live="polite"><small>' + p[0].toUpperCase() + ", " + p[1].toUpperCase() + "</small><b>" + t[0] + ": " + t[1].toLowerCase() + "</b><p>" + t[2] + '</p><span>Each person sees only their own page. Pay is never shown to a team lead.</span></div></div>';
    }
    on(el, "[data-w]", function (b) { who = +b.getAttribute("data-w"); sel = 0; draw(); });
    on(el, "[data-s]", function (b) { sel = +b.getAttribute("data-s"); draw(); });
    draw();
  };

  /* ---------- people: time off, and what it does to the books ---------- */
  W.peopleoff = function (el) {
    var ALLOW = 20, TAKEN = 6, EARNED = 18.3, DAY = 420, req = 4, state = 0;
    el.innerHTML = '<div class="po"><div class="po-l"><small>DEV PATEL ASKS FOR TIME OFF</small><label><span>Days requested <b data-v="r"></b></span><input type="range" min="1" max="10" step="1" value="4" aria-label="Days requested"></label><div class="po-bal"><div><small>ALLOWANCE</small><b>20</b></div><div><small>TAKEN</small><b data-v="t"></b></div><div><small>LEFT</small><b data-v="l"></b></div></div><div class="po-st" aria-live="polite"></div><div class="po-act"></div></div><div class="po-r"><small>IN THE BOOKS, AT MONTH-END</small><div class="po-row"><span>Days earned so far this year</span><b>18.3</b></div><div class="po-row"><span>Days taken</span><b data-v="t2"></b></div><div class="po-row po-tot"><span>Holiday pay owed to Dev</span><b data-v="o"></b></div><p class="po-note"></p></div></div>';
    function draw() {
      var taken = TAKEN + (state === 2 ? req : 0), owed = Math.max(0, EARNED - taken) * DAY, before = (EARNED - TAKEN) * DAY;
      $(el, '[data-v="r"]').textContent = req + (req === 1 ? " day" : " days");
      $(el, '[data-v="t"]').textContent = taken; $(el, '[data-v="l"]').textContent = ALLOW - taken; $(el, '[data-v="t2"]').textContent = taken;
      $(el, '[data-v="o"]').textContent = usd(owed);
      $(el, ".po-st").innerHTML = ["<b>Not sent yet.</b> Dev picks the days and sends the request.", "<b>Waiting for Omar Haddad.</b> He sees the dates and who else on the team is out.", "<b>Approved.</b> It is on the team calendar, and the balance has moved."][state];
      $(el, ".po-act").innerHTML = state === 0 ? '<button type="button" class="ax-btn" data-go>Send the request <span aria-hidden="true">&rarr;</span></button>' : state === 1 ? '<button type="button" class="ax-btn" data-go>Approve as the manager <span aria-hidden="true">&rarr;</span></button>' : '<button type="button" class="ax-lnk" data-go>Start again</button>';
      $(el, ".po-note").innerHTML = state === 2 ? "The amount owed fell from " + usd(before) + " to " + usd(owed) + ". The month-end entry is worked out by code from the balances and waits for approval, like any other." : "Unused holiday is money the company owes. Most small companies estimate it once a year. Here it comes from the real balances every month.";
      $(el, "input").disabled = state > 0;
    }
    el.addEventListener("input", function (e) { if (e.target.type === "range") { req = +e.target.value; draw(); } });
    on(el, "[data-go]", function () { state = state === 2 ? 0 : state + 1; draw(); });
    draw();
  };

  /* ---------- people: joining and leaving ---------- */
  W.peoplejoin = function (el) {
    var S = [
      ["Someone joins", [["The role is marked filled", "Plan", "Matched to the payroll record, so the plan does not count them twice."], ["Their contract is signed", "Company", "Sent and signed on the platform, then filed on their page."], ["Access is proposed by role", "Controls", "The least they need. A person confirms it."], ["Policies are sent to confirm", "Books", "Spending, and travel and expenses."], ["Their cost starts in the right team", "Books", "From their first day, by department."]]],
      ["Someone leaves", [["Access is removed", "Controls", "And it shows on the next access review."], ["Approvals are handed over", "Controls", "To a named person, so nothing is left waiting."], ["Final pay and unused holiday are accrued", "Books", "From the balances, by code, for approval."], ["Open expenses and commissions are settled", "Revenue", "Including any commission to be clawed back."], ["The option exercise window goes on the calendar", "Company", "With a reminder before it closes."]]]
    ];
    var w = 0, done = [{}, {}];
    function draw() {
      var s = S[w], n = s[1].filter(function (x, i) { return done[w][i]; }).length;
      el.innerHTML = tabs([S[0][0], S[1][0]], w, "w") + '<div class="pj"><div class="pj-prog"><i><u style="width:' + n / s[1].length * 100 + '%"></u></i><b>' + n + " of " + s[1].length + '</b></div><div class="pj-list">' + s[1].map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + !!done[w][i] + '"><i aria-hidden="true">' + (done[w][i] ? "&#10003;" : "") + "</i><span><b>" + x[0] + "</b><small>" + x[2] + "</small></span><em>" + x[1] + "</em></button>"; }).join("") + '</div><p class="pl-cap">' + (n === s[1].length ? "<b>Done.</b> One change to one record reached every part of the product that needed it." : "Tap each step. Every one is a place where a separate list of people usually goes out of date.") + "</p></div>";
    }
    on(el, "[data-w]", function (b) { w = +b.getAttribute("data-w"); draw(); });
    on(el, "[data-i]", function (b) { var i = +b.getAttribute("data-i"); done[w][i] = !done[w][i]; draw(); });
    draw();
  };

  /* ---------- plan: budget against actual ---------- */
  W.budget = function (el) {
    var D = [
      ["Engineering", "Dev Patel", [["People", 168, 161, 1848, 1806, "One senior engineer started six weeks later than planned.", 11], ["Hosting", 62, 73.2, 682, 701, "A usage tier change on November 3 added $11.2k. It will repeat every month.", 4], ["Software", 14, 15.1, 154, 158, "Two new tools added in October.", 9], ["Contractors", 12, 9, 132, 121, "One contract ended early.", 3]]],
      ["Sales and marketing", "Marcus Lee", [["People", 96, 98, 1056, 1064, "A commission accelerator paid out above quota.", 8], ["Advertising", 40, 36, 440, 418, "Two campaigns paused in November.", 14], ["Events and travel", 10, 14.1, 110, 121, "One extra conference, booked late at full price.", 22], ["Commissions", 18, 19.5, 198, 204, "Follows bookings, which were ahead of plan.", 6]]],
      ["Customer success", "Omar Haddad", [["People", 58, 58, 638, 638, "On budget.", 5], ["Support contractors", 8, 11.3, 88, 97, "Extra cover while a role stayed open. It ends when the support specialist starts.", 6], ["Tools", 6, 6.4, 66, 68, "A price rise at renewal.", 3]]],
      ["General and admin", "Maya Chen", [["People", 44, 44, 484, 484, "On budget.", 3], ["Professional fees", 12, 9.5, 132, 141, "Audit preparation fell earlier in the year.", 7], ["Office and insurance", 9, 9.2, 99, 100, "On budget.", 12]]]
    ];
    var d = 0, ytd = 0, sel = -1, mv = [0, 0, 0, 0], shift = [{}, {}, {}, {}];
    function row(L, i) { var b = (ytd ? L[3] : L[1]) + (ytd ? 0 : (shift[d][i] || 0)), a = ytd ? L[4] : L[2]; return [b, a, a - b]; }
    function move() { var L = D[d][2], hi = -1, lo = -1; L.forEach(function (x, i) { var v = x[2] - x[1]; if (hi < 0 || v > L[hi][2] - L[hi][1]) hi = i; if (lo < 0 || v < L[lo][2] - L[lo][1]) lo = i; }); var amt = Math.floor(Math.min(L[hi][2] - L[hi][1], L[lo][1] - L[lo][2])); return amt >= 1 && hi !== lo ? [lo, hi, amt] : null; }
    function pc(v, b) { if (!b) return ""; var p = Math.abs(v / b * 100); p = p < 10 ? Math.round(p * 10) / 10 : Math.round(p); return '<em class="bg-pc">' + (v > 0 ? p + "% over" : v < 0 ? p + "% under" : "on budget") + "</em>"; }
    function draw() {
      var X = D[d], L = X[2], tb = 0, ta = 0, M = move();
      var rows = L.map(function (x, i) { var r = row(x, i); tb += r[0]; ta += r[1]; var over = r[2] > 0, pct = r[0] ? r[2] / r[0] * 100 : 0, w = Math.min(100, r[1] / Math.max(r[0], r[1]) * 100), bw = Math.min(100, r[0] / Math.max(r[0], r[1]) * 100); return '<button type="button" class="bg-row' + (i === sel ? " bg-sel" : "") + '" data-l="' + i + '"><span><b>' + x[0] + "</b>" + (pct > 5 ? '<em class="bg-warn">Over</em>' : "") + '</span><i><u class="bg-b" style="width:' + bw + '%"></u><u class="' + (over ? "bg-o" : "bg-a") + '" style="width:' + w + '%"></u></i><small>' + k(r[1]) + " of " + k(r[0]) + '</small><b class="' + (over ? "bg-neg" : "bg-pos") + '">' + (r[2] > 0 ? "+" : r[2] < 0 ? "\u2212" : "") + k(Math.abs(r[2])) + pc(r[2], r[0]) + "</b></button>"; }).join("");
      var det = sel < 0 ? '<small>PICK A LINE</small><p>Tap any line to see why it moved and open the entries behind it.</p>' : '<small>WHY ' + L[sel][0].toUpperCase() + " MOVED</small><p>" + L[sel][5] + '</p><span class="bg-ent">' + L[sel][6] + " entries behind this line, each with its document</span>";
      var mvh = !M || ytd ? "" : mv[d] === 0 ? '<button type="button" class="ax-btn" data-mv>Ask to move ' + k(M[2]) + " from " + L[M[0]][0] + " to " + L[M[1]][0] + ' <span aria-hidden="true">&rarr;</span></button>' : mv[d] === 1 ? '<div class="bg-req"><b>Request sent to Maya Chen, finance lead.</b><span>' + X[1] + " asked to move " + k(M[2]) + '. She sees both lines and what is left in each.</span><button type="button" class="ax-btn" data-mv>Approve as Maya <span aria-hidden="true">&rarr;</span></button></div>' : "";
      if (mv[d] === 2) mvh = '<div class="bg-req bg-ok"><b>Moved, and logged.</b><span>The working budget changed. The budget the board approved did not, so the original comparison is always there.</span><button type="button" class="ax-lnk" data-mv>Undo</button></div>';
      el.innerHTML = tabs(D.map(function (x) { return x[0]; }), d, "d") + '<div class="bg-top"><div><small>OWNER</small><b>' + X[1] + '</b></div><div class="pl-chips" role="group" aria-label="Period"><button type="button" data-y="0" aria-pressed="' + !ytd + '">November</button><button type="button" data-y="1" aria-pressed="' + !!ytd + '">Year to date</button></div></div><div class="bg-body"><div class="bg-rows"><div class="bg-key"><span><i class="bg-b"></i>Budget</span><span><i class="bg-a"></i>Actual, under</span><span><i class="bg-o"></i>Actual, over</span></div>' + rows + '<div class="bg-tot"><span>' + X[0] + ", " + (ytd ? "year to date" : "November") + "</span><small>" + k(ta) + " of " + k(tb) + '</small><b class="' + (ta > tb ? "bg-neg" : "bg-pos") + '">' + (ta > tb ? "+" : ta < tb ? "\u2212" : "") + k(Math.abs(ta - tb)) + pc(ta - tb, tb) + '</b></div></div><div class="bg-side"><div class="bg-det" aria-live="polite">' + det + "</div>" + mvh + '</div></div><p class="pl-cap bg-cap">USD thousands. Each owner sees only their own area. Actuals stop at the last closed month, and spend already committed counts before the bill arrives.</p>';
    }
    on(el, "[data-d]", function (b) { d = +b.getAttribute("data-d"); sel = -1; draw(); });
    on(el, "[data-y]", function (b) { ytd = +b.getAttribute("data-y"); draw(); });
    on(el, "[data-l]", function (b) { var i = +b.getAttribute("data-l"); sel = sel === i ? -1 : i; draw(); });
    on(el, "[data-mv]", function () { var M; if (mv[d] === 2) { shift[d] = {}; mv[d] = 0; draw(); return; } if (mv[d] === 1) { M = move(); if (M) { shift[d] = {}; shift[d][M[0]] = -M[2]; shift[d][M[1]] = M[2]; shift[d].m = M; } } mv[d]++; draw(); });
    draw();
  };

  /* ---------- accountants: founding firms request ---------- */
  W.founding = function (el) {
    on(el, "[data-ff]", function () { try { document.dispatchEvent(new CustomEvent("ca-access-preset", { detail: { role: "Accountant or bookkeeper", tag: "founding-firm", note: "Founding firm request. Leave your work email and we will write to you personally." } })); } catch (e) {} });
  };

  /* ---------- revenue: quote to invoice, with the deal's health score ---------- */
  W.quoteflow = function (el) {
    var STEP = ["Draft the quote", "Sent and viewed", "Accepted", "Invoiced"], st = 0, opt = 0;
    var OPT = [["One year", "Billed every quarter", 100, 0], ["Three years", "Billed every quarter, price held", 90, 10]];
    var H = [
      [["You", "Pick products and terms from the price book. Offer up to three options."], ["Countahead", "Checks the discount against your authority and works out the first invoice."], ["The customer", "Nothing yet."]],
      [["You", "Send. See that the page was opened, because it is your own page."], ["Countahead", "Keeps the versions, and warns before the quote expires."], ["The customer", "Reads the quote as a page or a PDF, and can ask a question on it."]],
      [["The customer", "Picks an option and accepts on the page. Who, when and which version are recorded."], ["Countahead", "Marks the deal won and proposes the billing schedule from the accepted quote."], ["You", "Check the schedule. Nobody sets a deal to won by hand."]],
      [["You", "Approve. The invoice goes out with a pay link."], ["Countahead", "Books revenue month by month from Dec 1 and updates the forecast."], ["The customer", "Pays from the invoice, and sees it on their own page."]]
    ];
    function draw() {
      var o = OPT[opt], seat = o[2], mo = 40 * seat, q = mo * 3, h = H[st];
      var doc;
      if (st < 3) doc = '<div class="qf-doc"><div class="qf-dh"><span><small>QUOTE Q-0142' + (st ? ", VERSION 2" : ", DRAFT") + "</small><b>Harbor Labs, 40 more seats</b></span><em>" + (st === 0 ? "Not sent" : st === 1 ? "Viewed twice" : "Accepted Nov 18") + '</em></div><div class="qf-opts" role="group" aria-label="Options on the quote">' + OPT.map(function (x, i) { return '<button type="button" data-o="' + i + '" aria-pressed="' + (i === opt) + '"' + (st > 1 ? " disabled" : "") + "><b>" + x[0] + "</b><small>" + x[1] + "</small><i>$" + x[2] + " a seat</i></button>"; }).join("") + '</div><div class="qf-lines"><div><span>40 seats at list price, $100</span><b>' + usd(4000) + " a month</b></div>" + (o[3] ? '<div class="qf-disc"><span>Discount, 10% for three years <u>Within your authority</u></span><b>-' + usd(400) + " a month</b></div>" : "") + '<div class="qf-tot"><span>Total</span><b>' + usd(mo) + ' a month</b></div><div><span>First invoice, one quarter in advance</span><b>' + usd(q) + "</b></div><div><span>Starts Dec 1, payment in 30 days</span><b>Expires Nov 30</b></div></div><p>" + (st === 0 ? "Every line comes from the price book. The customer can pick either option on the quote page." : st === 1 ? "The customer sees this page and a PDF of it. You see that it was opened, because it is your own page." : "Accepting the quote wins the deal. Nobody sets it to won by hand.") + "</p></div>";
      else doc = '<div class="qf-doc qf-inv"><div class="qf-dh"><span><small>INVOICE INV-2031, FROM Q-0142</small><b>Harbor Labs</b></span><em>Issued Nov 18</em></div><div class="qf-lines"><div><span>40 seats, Dec 1 to Feb 28, ' + (opt ? "three-year" : "one-year") + " term</span><b>" + usd(q) + '</b></div><div class="qf-tot"><span>Due Dec 18</span><b>' + usd(q) + '</b></div></div><div class="qf-after"><div><small>IN THE BOOKS</small><b>' + usd(mo) + ' a month</b><span>revenue from Dec 1, the rest held as deferred</span></div><div><small>IN THE PLAN</small><b>+' + usd(mo * 12) + '</b><span>recurring revenue a year, cash in on Dec 18</span></div><div><small>RETYPED</small><b>0 fields</b><span>the quote, contract, invoice and forecast share one record</span></div></div></div>';
      el.innerHTML = '<ol class="qf-steps">' + STEP.map(function (s, i) { return '<li class="' + (i < st ? "qf-past" : i === st ? "qf-cur" : "") + '"><button type="button" data-s="' + i + '"' + (i === st ? ' aria-current="step"' : "") + "><i>" + (i + 1) + "</i>" + s + "</button></li>"; }).join("") + '</ol><div class="qf-body">' + doc + '<aside class="qf-side" aria-live="polite"><small>AT THIS STEP</small><ul>' + h.map(function (r) { return '<li class="' + (r[0] === "Countahead" ? "qf-up" : r[0] === "You" ? "qf-me" : "qf-cu") + '"><span><b>' + r[0] + "</b><small>" + r[1] + "</small></span></li>"; }).join("") + "</ul>" + (st < 3 ? '<button type="button" class="ax-btn" data-n>' + ["Send the quote", "Customer accepts", "Approve and issue the invoice"][st] + ' <span aria-hidden="true">&rarr;</span></button>' : '<button type="button" class="ax-lnk" data-s="0">Start again</button>') + '</aside></div><p class="pl-cap bg-cap">Sample deal. Every figure on the invoice, in the books and in the plan comes from the accepted quote.</p>';
    }
    on(el, "[data-s]", function (b) { st = +b.getAttribute("data-s"); draw(); });
    on(el, "[data-n]", function () { st = Math.min(3, st + 1); draw(); });
    on(el, "[data-o]", function (b) { if (st < 2) { opt = +b.getAttribute("data-o"); draw(); } });
    draw();
  };

  /* ---------- people: org chart with cost on it ---------- */
  W.orgchart = function (el) {
    var T = [
      ["Engineering", "Sam Okafor", "VP Engineering", 10, 172, 174, [["Dev Patel", "Senior engineer", 0], ["Lena Fischer", "Engineer", 0], ["Priya Nair", "Product designer", 1]], 6, [["Senior engineer", "Offer accepted, starts January 12", 15, 2]]],
      ["Sales and marketing", "Nina Brooks", "VP Sales", 7, 112, 118, [["Sofia Alvarez", "Account executive", 0], ["Marcus Lee", "Marketing lead", 0]], 4, [["Account executive", "Approved, hiring has started", 12, 1]]],
      ["Customer success", "Omar Haddad", "Customer success lead", 4, 48, 49, [["Jo Kim", "Support specialist", 0]], 2, [["Support lead", "In the plan for March, not yet approved", 9, 0]]],
      ["General and admin", "Maya Chen", "Finance lead", 3, 40, 40, [["Tess Morgan", "Operations manager", 0]], 0, []]];
    var sel = 0, plan = 0, view = 0, dep = -1;
    function draw() {
      var hc = 24, cost = 372, open = 3;
      if (plan) { T.forEach(function (t) { t[8].forEach(function (r) { hc++; cost += r[2]; }); }); }
      var t = T[sel], other = "";
      if (view === 1) { var L = PPL.filter(function (p) { return dep < 0 || p[2] === dep; }); other = '<div class="pl-body"><div class="pl-chips" role="group" aria-label="Team"><button type="button" data-d="-1" aria-pressed="' + (dep < 0) + '">All</button>' + DEPT.map(function (d, i) { return '<button type="button" data-d="' + i + '" aria-pressed="' + (dep === i) + '">' + d[0] + "</button>"; }).join("") + '</div><div class="pl-list">' + L.map(function (p) { return "<div><span><b>" + p[0] + "</b><small>" + p[1] + " &middot; " + DEPT[p[2]][0] + "</small></span><em>" + p[4] + "</em><small>Since " + p[3] + "</small></div>"; }).join("") + '</div><p class="pl-cap">Eight of the 24, as a sample. Names, employer, pay and dates come from your payroll system, read only.</p></div>'; }
      if (view === 2) other = '<div class="pl-body"><div class="pl-list">' + ROLES.map(function (r) { return '<div class="pl-role"><span><b>' + r[0] + "</b><small>" + DEPT[r[1]][0] + '</small></span><div class="pl-st">' + ["Planned", "Approved", "Offer out", "Filled"].map(function (s, i) { return '<i class="' + (i <= r[2] ? "pl-on" : "") + '">' + s + "</i>"; }).join("") + "</div><small>" + r[3] + "</small></div>"; }).join("") + '</div><p class="pl-cap">A role is a line in the budget before it is a person. When the hire appears in payroll, the two are matched, so nobody is counted twice.</p></div>';
      el.innerHTML = '<div class="pl-kp"><div><small>PEOPLE</small><b>' + hc + "</b><span>" + (plan ? "with the three open roles filled" : "22 employees, 2 contractors") + '</span></div><div><small>OPEN ROLES</small><b>' + (plan ? 0 : open) + "</b><span>" + (plan ? "all filled by June" : "shown dashed on the chart") + '</span></div><div><small>PEOPLE COST A MONTH</small><b>$' + cost + "k</b><span>" + (plan ? "was $372k in November" : "November, from payroll") + '</span></div><div><small>' + (plan ? "ADDED BY THE PLAN" : "AGAINST PLAN") + "</small><b>" + (plan ? "+$36k" : "$9k under") + "</b><span>" + (plan ? "a month, already in the forecast" : "one hire started late") + '</span></div></div>' + tabs(["Org chart", "People", "Open roles"], view, "v") + (view === 0 ? '<div class="oc-bar"><span>Show the company</span><div class="m-opts" role="group" aria-label="Date"><button type="button" data-pl="0" aria-pressed="' + (plan === 0) + '">Today</button><button type="button" data-pl="1" aria-pressed="' + (plan === 1) + '">In June, as planned</button></div></div><div class="oc"><div class="oc-top"><div class="oc-box oc-ceo"><b>Alex Rivera</b><small>Chief executive</small></div></div><div class="oc-teams">' + T.map(function (x, i) {
        var n = x[3] + (plan ? x[8].length : 0), c = x[4] + (plan ? x[8].reduce(function (a, r) { return a + r[2]; }, 0) : 0), d = x[5] - x[4];
        return '<button type="button" class="oc-box oc-team" data-s="' + i + '" aria-pressed="' + (i === sel) + '"><small>' + x[0] + "</small><b>" + x[1] + "</b><span>" + x[2] + '</span><div class="oc-nums"><i><u>' + n + "</u> people</i><i><u>$" + c + "k</u> a month</i></div><em class=\"" + (plan ? "oc-pl" : d > 0 ? "oc-un" : "oc-on") + '">' + (plan ? (x[8].length ? "+" + x[8].length + " hire" : "No change") : d > 0 ? "$" + d + "k under plan" : "On plan") + "</em>" + (!plan && x[8].length ? '<em class="oc-open">' + x[8].length + " open role</em>" : "") + "</button>";
      }).join("") + '</div></div><div class="oc-det" aria-live="polite"><div class="oc-dh"><b>' + t[0] + "</b><span>Reports to " + t[1] + '</span></div><div class="oc-ppl">' + t[6].map(function (p) { return '<div class="oc-p"><b>' + p[0] + "</b><small>" + p[1] + "</small>" + (p[2] ? "<em>Contractor</em>" : "") + "</div>"; }).join("") + (t[7] ? '<div class="oc-p oc-more"><b>' + t[7] + " more</b><small>on the full chart</small></div>" : "") + t[8].map(function (r) { return '<div class="oc-p ' + (plan ? "oc-new" : "oc-dash") + '"><b>' + r[0] + "</b><small>" + (plan ? "Filled, as planned" : r[1]) + "</small><em>$" + r[2] + "k a month</em></div>"; }).join("") + "</div>" + (sel === 3 ? '<p class="pl-cap">The chief executive is counted in this team.</p>' : "") + '</div><p class="pl-cap">Names, managers and pay are read from your payroll or people system. Open roles come from the plan, so the chart, the budget and the forecast always show the same company. Sample data.</p>' : other);
    }
    on(el, "[data-v]", function (b) { view = +b.getAttribute("data-v"); if (view) plan = 0; draw(); });
    on(el, "[data-d]", function (b) { dep = +b.getAttribute("data-d"); draw(); });
    on(el, "[data-s]", function (b) { sel = +b.getAttribute("data-s"); draw(); });
    on(el, "[data-pl]", function (b) { plan = +b.getAttribute("data-pl"); draw(); });
    draw();
  };

  /* ---------- people: a hire request, checked against budget and pay band ---------- */
  W.hirereq = function (el) {
    var TM = [["Engineering", 18, "Sam Okafor", [["Senior engineer", 150, 190], ["Engineer", 115, 150]]], ["Sales and marketing", 14, "Nina Brooks", [["Account executive", 80, 110], ["Marketing manager", 95, 125]]], ["Customer success", 6, "Omar Haddad", [["Support lead", 85, 110], ["Support specialist", 55, 75]]], ["General and admin", 0, "Maya Chen", [["Accountant", 80, 105], ["Operations manager", 85, 115]]]];
    var tm = 0, rl = 0, sal = 165, st = 0;
    function draw(keep) {
      var t = TM[tm], r = t[3][rl], cost = Math.round(sal / 12 * 1.2 * 10) / 10, over = Math.round((cost - t[1]) * 10) / 10, inB = over <= 0, out = sal > r[2] ? 1 : sal < r[1] ? -1 : 0, run = Math.round(4000 / (200 + cost) * 10) / 10;
      var AP = [[t[2], "Team lead"]]; if (tm !== 3) AP.push(["Maya Chen", "Finance lead"]); if (!inB || out > 0 || tm === 3) AP.push(["Alex Rivera", "Chief executive"]);
      var lock = st ? " disabled" : "", pos = Math.max(0, Math.min(100, (sal - (r[1] - 20)) / (r[2] - r[1] + 40) * 100)), lo = 20 / (r[2] - r[1] + 40) * 100;
      el.innerHTML = '<div class="rf-grid"><div class="rf-main m-form"><div class="rf-head"><b>New hire request</b><span>From a team lead</span></div><div class="m-kv"><span>Team</span><span class="m-opts hq-wrap">' + TM.map(function (x, i) { return '<button type="button" data-tm="' + i + '" aria-pressed="' + (i === tm) + '"' + lock + ">" + x[0] + "</button>"; }).join("") + '</span></div><div class="m-kv"><span>Role</span><span class="m-opts">' + t[3].map(function (x, i) { return '<button type="button" data-rl="' + i + '" aria-pressed="' + (i === rl) + '"' + lock + ">" + x[0] + "</button>"; }).join("") + '</span></div><div class="m-kv"><span>Salary</span><b>$' + sal + ',000</b></div><input type="range" min="' + (r[1] - 20) + '" max="' + (r[2] + 20) + '" step="5" value="' + sal + '" aria-label="Salary in thousands" data-sl' + lock + '><div class="hq-band"><i style="left:' + lo + "%;right:" + lo + '%"></i><u style="left:' + pos + '%"></u></div><div class="hq-bl"><span>Your band for this role: $' + r[1] + "k to $" + r[2] + 'k</span><b class="' + (out ? "hq-bad" : "hq-ok") + '">' + (out > 0 ? "Above the band" : out < 0 ? "Below the band" : "Inside the band") + "</b></div>" +
        '<div class="hq-chk"><div class="' + (inB ? "hq-y" : "hq-n") + '"><small>BUDGET</small><b>' + (inB ? "In the budget" : "Over by $" + over + "k a month") + "</b><span>" + t[0] + " has $" + t[1] + "k a month unspent. This role costs $" + cost + 'k with employer taxes and benefits.</span></div><div><small>RUNWAY</small><b>20.0 &rarr; ' + run.toFixed(1) + ' months</b><span>Before any revenue the role brings in.</span></div></div><div class="rf-row rf-s' + (st === 0 ? 1 : st > AP.length ? 3 : 2) + '"><span><b>' + (st === 0 ? "Ready to send" : st > AP.length ? "Approved" : "Waiting for " + AP[st - 1][0]) + "</b><small>" + (st === 0 ? "Goes to " + AP.map(function (a) { return a[1].toLowerCase(); }).join(", then ") + "." : st > AP.length ? "The role is in the plan, the budget and the org chart." : AP[st - 1][1] + ", step " + st + " of " + AP.length + ".") + "</small></span><em></em>" + (st > AP.length ? '<u class="rf-tick">In the plan</u>' : '<button type="button" class="m-btn m-sm" data-go>' + (st === 0 ? "Send for approval" : "Approve as " + AP[st - 1][0].split(" ")[0]) + "</button>") + '</div></div><div class="rf-side"><div class="rf-books"><span class="m-lab">WHO HAS TO SAY YES</span><p class="rf-say">' + (AP.length > 2 || tm === 3 ? (out > 0 ? "Above the pay band" : !inB ? "Over the team's budget" : "A role in the finance lead's own team") + ", so the chief executive is added." : "In budget and inside the band, so two approvals are enough.") + "</p>" + AP.map(function (a, i) { return '<div class="rf-e' + (st === i + 1 ? " rf-new" : "") + '"><b>' + a[0] + "</b><span><i>" + a[1] + '</i><u class="' + (st > i + 1 ? "rf-pos" : "rf-neg") + '">' + (st > i + 1 ? "Approved" : st === i + 1 ? "Waiting" : "Next") + "</u></span></div>"; }).join("") + (st > AP.length ? '<div class="rf-e rf-new"><b>What changed</b><span><i>Plan</i><u class="rf-pos">Role added</u></span><span><i>' + t[0] + ' budget</i><u class="rf-pos">$' + cost + 'k committed</u></span><span><i>Org chart</i><u class="rf-pos">Open role shown</u></span><span><i>Runway</i><u class="rf-neg">' + run.toFixed(1) + " months</u></span></div>" : "") + '</div><button type="button" class="m-link rf-reset" data-x>Start again</button></div></div>';
      var s = el.querySelector("[data-sl]"); s.addEventListener("input", function () { sal = +this.value; draw(true); }); if (keep) s.focus();
      el._n = AP.length;
    }
    function mid() { var r = TM[tm][3][rl]; sal = Math.round((r[1] + r[2]) / 10) * 5; }
    on(el, "[data-tm]", function (b) { if (st) return; tm = +b.getAttribute("data-tm"); rl = 0; mid(); draw(); });
    on(el, "[data-rl]", function (b) { if (st) return; rl = +b.getAttribute("data-rl"); mid(); draw(); });
    on(el, "[data-go]", function () { if (st <= el._n) st++; draw(); });
    on(el, "[data-x]", function () { st = 0; draw(); });
    mid(); draw();
  };

  /* ---------- accountants: every client on one screen ---------- */
  W.practiceview = function (el) {
    var WHO = ["Ana", "Ben", "Cara"], C0 = [
      ["Harbor Labs", "Software", 0, 0, 0, 0, ""], ["Market Street Cafe", "Cafe", 1, 9, 1, 1, "Day 2 of the close"], ["Fernhill Studio", "Agency", 0, 0, 0, 0, ""], ["Juniper Goods", "Online store", 1, 14, 0, 1, "Day 3 of the close"],
      ["Northgate Supply", "Wholesale", 2, 22, 3, 2, "Bank feed disconnected for 6 days"], ["Ridgeway Legal", "Professional firm", 0, 0, 0, 2, ""], ["Tidewater Brewing", "Consumer brand", 1, 6, 2, 0, "Day 1 of the close"], ["Quanta Labs", "AI", 0, 0, 0, 1, ""],
      ["High Street Outfitters", "Shop", 2, 4, 11, 2, "Waiting on the client for 11 receipts"], ["Pine and Poppy", "Online store", 0, 0, 0, 0, ""], ["Atlas Freight", "Other", 1, 3, 0, 0, "Day 2 of the close"], ["Brightline Media", "Agency", 0, 0, 0, 1, ""]];
    var CL, f = 0, who = -1, open = 1;
    function reset() { CL = C0.map(function (c) { return { n: c[0], k: c[1], st: c[2], w: c[3], rt: Math.round(c[3] * 0.7), cw: c[4], r: c[5], note: c[6], nudge: 0 }; }); }
    function show(c) { return (who < 0 || c.r === who) && (f === 0 || (f === 1 && c.w > 0) || (f === 2 && c.cw > 0) || (f === 3 && c.st === 2) || (f === 4 && c.st === 0)); }
    function draw() {
      var closed = CL.filter(function (c) { return c.st === 0; }).length, wait = CL.reduce(function (a, c) { return a + c.w; }, 0), wc = CL.filter(function (c) { return c.w > 0; }).length, beh = CL.filter(function (c) { return c.st === 2; }).length, onc = CL.reduce(function (a, c) { return a + c.cw; }, 0);
      var F = ["All " + CL.length, "Needs your review", "Waiting on the client", "Behind", "Closed"], rows = CL.map(function (c, i) { return [c, i]; }).filter(function (x) { return show(x[0]); });
      el.innerHTML = '<div class="pl-kp"><div><small>CLOSED FOR NOVEMBER</small><b>' + closed + " of " + CL.length + '</b><span>signed off, with your name on it</span></div><div><small>WAITING FOR YOUR REVIEW</small><b>' + wait + "</b><span>entries, across " + wc + (wc === 1 ? " client" : " clients") + '</span></div><div><small>WAITING ON CLIENTS</small><b>' + onc + '</b><span>questions and missing documents</span></div><div><small>BEHIND</small><b>' + beh + "</b><span>" + (beh ? "each with the reason shown" : "nobody is behind") + '</span></div></div><div class="pv-bar"><div class="pl-chips" role="group" aria-label="Filter clients">' + F.map(function (x, i) { return '<button type="button" data-f="' + i + '" aria-pressed="' + (i === f) + '">' + x + "</button>"; }).join("") + '</div><div class="pl-chips" role="group" aria-label="Reviewer"><button type="button" data-w="-1" aria-pressed="' + (who < 0) + '">Whole firm</button>' + WHO.map(function (x, i) { return '<button type="button" data-w="' + i + '" aria-pressed="' + (who === i) + '">' + x + "</button>"; }).join("") + '</div></div><div class="pv-list">' + (rows.length ? rows.map(function (x) {
        var c = x[0], i = x[1], on_ = i === open, ex = c.w - c.rt;
        var st = c.st === 0 ? '<em class="pv-ok">Closed</em>' : c.st === 2 ? '<em class="pv-late">Behind</em>' : '<em class="pv-go">In close</em>';
        var det = "";
        if (on_) {
          var L = [];
          if (c.st === 0) L.push(["Signed off by " + WHO[c.r] + ". Month locked. Working papers ready to export.", ""]);
          else {
            if (c.note) L.push([c.note + ".", ""]);
            if (c.rt > 0) L.push([c.rt + " routine entries, each matched by a rule you approved.", '<button type="button" class="m-btn m-sm" data-a="rt">Approve the ' + c.rt + "</button>"]);
            if (ex > 0) L.push([ex + (ex === 1 ? " exception" : " exceptions") + ": over a limit, a new supplier or an unusual amount.", '<button type="button" class="m-btn m-sm' + (c.rt > 0 ? " m-ghost" : "") + '" data-a="ex">Review ' + (ex === 1 ? "it" : "them") + "</button>"]);
            if (c.cw > 0) L.push([c.cw + (c.cw === 1 ? " item" : " items") + " waiting on the client." + (c.nudge === 2 ? " Reminder sent." : c.nudge === 1 ? " Reminder drafted. Nothing goes out until you approve it." : ""), c.nudge === 2 ? "" : '<button type="button" class="m-btn m-sm m-ghost" data-a="nd">' + (c.nudge ? "Approve and send" : "Draft a reminder") + "</button>"]);
            if (c.w === 0) L.push([c.cw > 0 && c.nudge < 2 ? "Review is done. You can sign off once the client's items are in, or note them and sign now." : "Everything is reviewed and every account agrees with the ledger.", '<button type="button" class="m-btn m-sm" data-a="so">Sign off November</button>']);
          }
          det = '<div class="pv-det">' + L.map(function (l) { return "<div><span>" + l[0] + "</span>" + l[1] + "</div>"; }).join("") + '<div class="pv-as"><span>Reviewer</span><span class="m-opts">' + WHO.map(function (n, j) { return '<button type="button" data-r="' + j + '" aria-pressed="' + (c.r === j) + '">' + n + "</button>"; }).join("") + "</span></div></div>";
        }
        return '<div class="pv-row' + (on_ ? " pv-on" : "") + '"><button type="button" class="pv-h" data-o="' + i + '" aria-expanded="' + on_ + '"><span class="pv-n"><b>' + c.n + "</b><small>" + c.k + " &middot; " + WHO[c.r] + "</small></span>" + st + '<span class="pv-c"><u>' + c.w + "</u><small>to review</small></span>" + '<span class="pv-c"><u>' + c.cw + "</u><small>on client</small></span><i aria-hidden=\"true\"></i></button>" + det + "</div>";
      }).join("") : '<p class="pl-cap" style="padding:18px 16px">Nothing here. That is the good kind of empty.</p>') + '</div><div class="pv-ft"><span>Sample firm with twelve clients. Planned, not live.</span><button type="button" class="m-link" data-x>Start again</button></div>';
    }
    on(el, "[data-f]", function (b) { f = +b.getAttribute("data-f"); open = -1; draw(); });
    on(el, "[data-w]", function (b) { who = +b.getAttribute("data-w"); open = -1; draw(); });
    on(el, "[data-o]", function (b) { var i = +b.getAttribute("data-o"); open = open === i ? -1 : i; draw(); });
    on(el, "[data-r]", function (b) { if (open > -1) { CL[open].r = +b.getAttribute("data-r"); draw(); } });
    on(el, "[data-a]", function (b) { var c = CL[open], a = b.getAttribute("data-a"); if (!c) return;
      if (a === "rt") { c.w -= c.rt; c.rt = 0; } else if (a === "ex") { c.w = c.rt; } else if (a === "nd") { c.nudge++; if (c.nudge === 2 && c.st !== 2) c.cw = c.cw; } else if (a === "so") { c.st = 0; c.cw = 0; c.note = ""; }
      draw(); });
    on(el, "[data-x]", function () { reset(); f = 0; who = -1; open = 1; draw(); });
    reset(); draw();
  };

  /* ---------- hero, right-hand side: three alternatives for review ---------- */
  function heroIcons(el) { var m = {}; [].slice.call(el.querySelectorAll("[data-ic]")).forEach(function (x) { m[x.getAttribute("data-ic")] = x.innerHTML; }); return m; }
  var H2RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* B. One thing happens, every part updates */
  W.heroparts = function (el) {
    var IC = heroIcons(el), P = [["rev", "Sales"], ["books", "Books"], ["plan", "Plan"], ["people", "People"], ["co", "Company"]];
    var EV = [
      ["A deal is signed", "Harbor Labs, 40 seats", 0, ["Contract signed. $48,000 a year", "Invoice drafted. Revenue starts Dec 1", "Recurring revenue up to $4.02M", "Commission of $4,800 accrued", "Board pack: new customer added"]],
      ["A customer cancels", "Northwind, $36,000 a year, ends Jan 31", 0, ["Renewal marked lost. Reason recorded", "Final invoice sent. Unused months refunded", "Recurring revenue down $36k. Runway 20 to 19 months", "Commission on the renewal reversed", "Board pack: churn and the reason added"]],
      ["You hire a sales lead", "Offer accepted, starts January 6", 3, ["New quota of $600k added to the forecast", "Salary cost accrues from January 6", "Runway 20 to 18 months", "Offer signed. Added to the org chart", "Option grant drafted for board approval"]],
      ["You raise a round", "$3M seed, four investors", 4, ["", "$3M received and posted to equity", "Runway 20 to 41 months", "Hiring plan unlocked: four open roles", "Cap table updated. Four investors added"]]];
    var cur = 0, step = 9, timer, auto = !window.__PRERENDER && !H2RM;
    function order(e) { var o = [e[2]]; for (var i = 0; i < 5; i++) if (i !== e[2]) o.push(i); return o; }
    function draw() {
      var e = EV[cur], o = order(e), lit = {}; o.forEach(function (i, n) { if (n < step) lit[i] = 1; });
      el.innerHTML = '<div class="hv"><div class="hv-top"><small>One thing happens</small><div class="hv-ev" role="group" aria-label="Event">' + EV.map(function (x, i) { return '<button type="button" data-e="' + i + '" aria-pressed="' + (i === cur) + '">' + x[0] + "</button>"; }).join("") + '</div><p class="hv-sub">' + e[1] + '</p></div><div class="hv-mid"><small>Every part of the company updates</small>' + P.map(function (p, i) { var t = e[3][i], on_ = lit[i]; return '<div class="hv-row' + (on_ ? (t ? " hv-on" : " hv-none") : "") + (i === e[2] && on_ ? " hv-src" : "") + '"><i aria-hidden="true">' + (IC[p[0]] || "") + "</i><b>" + p[1] + "</b><span>" + (on_ ? (t || "No change") : "") + "</span></div>"; }).join("") + '</div><p class="hv-foot">One ledger underneath. Nothing is typed twice, and nothing has to be reconciled.</p></div>';
      clearTimeout(timer);
      if (auto) timer = setTimeout(function () { if (step < 5) step++; else { cur = (cur + 1) % EV.length; step = 1; } draw(); }, step < 5 ? 650 : 3200);
    }
    on(el, "[data-e]", function (b) { cur = +b.getAttribute("data-e"); auto = false; step = H2RM ? 9 : 1; draw(); if (!H2RM) { var n = 1, t = setInterval(function () { n++; step = n; draw(); if (n >= 5) clearInterval(t); }, 350); } });
    if (auto) step = 1; draw();
  };

  /* C. Six tools that disagree, or one that cannot */
  W.herostack = function (el) {
    var IC = heroIcons(el), T = [["Accounting software", "$331k"], ["Planning spreadsheet", "$318k"], ["CRM", "$346k"], ["Contract signing", "3 unsigned"], ["Cap table", "Out of date"], ["People records", "22 or 24?"]];
    var one = 0, timer, auto = !window.__PRERENDER && !H2RM;
    function draw() {
      el.innerHTML = '<div class="hv"><div class="hv-top"><div class="hv-sw" role="group" aria-label="View"><button type="button" data-o="0" aria-pressed="' + (one === 0) + '">Most companies today</button><button type="button" data-o="1" aria-pressed="' + (one === 1) + '">With Countahead</button></div></div>' + (one === 0 ? '<div class="hv-mid"><small>Six tools, each with its own version of the numbers</small><div class="hv-tools">' + T.map(function (t) { return "<div><b>" + t[0] + "</b><span>" + (t[1].charAt(0) === "$" ? "Revenue: " : "") + t[1] + "</span></div>"; }).join("") + '</div></div><p class="hv-foot">Someone exports, pastes and reconciles between them every month. The plan is always a few weeks behind the books.</p>' : '<div class="hv-mid"><small>One system, one set of numbers</small><div class="hv-one"><div class="hv-parts">' + [["rev", "Sales"], ["books", "Books"], ["plan", "Plan"], ["people", "People"], ["co", "Company"]].map(function (p) { return '<span><i aria-hidden="true">' + (IC[p[0]] || "") + "</i>" + p[1] + "</span>"; }).join("") + '</div><div class="hv-led">One ledger</div><div class="hv-facts"><div><span>Revenue, everywhere it appears</span><b>$331k</b></div><div><span>Books closed through</span><b>Yesterday</b></div><div><span>Runway, from those books</span><b>20 months</b></div></div></div></div><p class="hv-foot">Agents keep the books inside the rules you set. The plan reads the same ledger, so it is never behind.</p>') + "</div>";
      clearTimeout(timer); if (auto) timer = setTimeout(function () { one = 1 - one; draw(); }, one ? 5200 : 3600);
    }
    on(el, "[data-o]", function (b) { one = +b.getAttribute("data-o"); auto = false; draw(); });
    draw();
  };

  /* D. This morning */
  W.heroday = function (el) {
    var need = [["Orbit Cloud bill, $4,812", "Over your $500 limit"], ["New supplier: Pacific Mills", "First bill from them"]], done = ["31 bank lines matched", "14 entries posted inside your rules", "3 invoices sent", "2 late payers reminded"];
    function draw() {
      el.innerHTML = '<div class="hv"><div class="hv-top"><small>Wednesday, 8:02 am</small><p class="hv-hi">Good morning. Your books are up to date.</p></div><div class="hv-mid"><small>Done overnight, by agents</small><ul class="hv-done">' + done.map(function (d) { return "<li>" + d + "</li>"; }).join("") + '</ul><small>' + (need.length ? "Needs you, " + need.length + (need.length === 1 ? " thing" : " things") : "Needs you") + "</small>" + (need.length ? need.map(function (n, i) { return '<div class="hv-need"><span><b>' + n[0] + "</b><em>" + n[1] + '</em></span><button type="button" data-ok="' + i + '">Approve</button></div>'; }).join("") : '<p class="hv-clear">Nothing. You are clear for today.</p>') + '<small>What is ahead</small><div class="hv-ahead"><div><span>Runway</span><b>20 months</b></div><div><span>Cash low point</span><b>August</b></div><div><span>Board pack</span><b>Ready Friday</b></div></div></div><p class="hv-foot">The past kept by agents, the future read from the same numbers.</p></div>';
    }
    on(el, "[data-ok]", function (b) { var n = need.splice(+b.getAttribute("data-ok"), 1)[0]; done.unshift(n[0] + ", approved by you"); draw(); });
    draw();
  };
})();
