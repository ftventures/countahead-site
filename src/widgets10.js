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
  var DEPT = [["Engineering", 9, "#0B1B3A"], ["Sales and marketing", 6, "#2450DC"], ["Customer success", 4, "#8FA8F5"], ["General and admin", 3, "#FFD15C"]];
  var PPL = [["Dev Patel", "Senior engineer", 0, "Mar 2024", "Employee"], ["Lena Fischer", "Engineer", 0, "Sep 2025", "Employee"], ["Priya Nair", "Product designer", 0, "Jan 2026", "Contractor"], ["Sofia Alvarez", "Account executive", 1, "Jun 2025", "Employee"], ["Marcus Lee", "Marketing lead", 1, "Feb 2025", "Employee"], ["Omar Haddad", "Customer success lead", 2, "Nov 2024", "Employee"], ["Jo Kim", "Support specialist", 2, "Dec 2026", "Employee"], ["Maya Chen", "Finance lead", 3, "Aug 2024", "Employee"]];
  var ROLES = [["Senior engineer", 0, 2, "Offer accepted. Starts January 12."], ["Account executive", 1, 1, "Approved in the budget. Hiring has started."], ["Support lead", 2, 0, "In the plan for March. Not yet approved."]];
  W.peopleteam = function (el) {
    var tab = 0, dep = -1;
    function draw() {
      var body, tot = 22;
      if (tab === 0) body = '<div class="pl-bars">' + DEPT.map(function (d) { return '<div><span>' + d[0] + '</span><i><u style="width:' + d[1] / 9 * 100 + "%;background:" + d[2] + '"></u></i><b>' + d[1] + "</b></div>"; }).join("") + '</div><p class="pl-cap">Headcount by team today. The same teams carry the budget, the payroll entry and the plan, so the three always agree.</p>';
      else if (tab === 1) { var L = PPL.filter(function (p) { return dep < 0 || p[2] === dep; }); body = '<div class="pl-chips" role="group" aria-label="Team"><button type="button" data-d="-1" aria-pressed="' + (dep < 0) + '">All</button>' + DEPT.map(function (d, i) { return '<button type="button" data-d="' + i + '" aria-pressed="' + (dep === i) + '">' + d[0] + "</button>"; }).join("") + '</div><div class="pl-list">' + L.map(function (p) { return "<div><span><b>" + p[0] + "</b><small>" + p[1] + " &middot; " + DEPT[p[2]][0] + "</small></span><em>" + p[4] + "</em><small>Since " + p[3] + "</small></div>"; }).join("") + '</div><p class="pl-cap">Eight of the 22, as a sample. Names, employer, pay and dates come from your payroll system, read only.</p>'; }
      else body = '<div class="pl-list">' + ROLES.map(function (r) { return '<div class="pl-role"><span><b>' + r[0] + "</b><small>" + DEPT[r[1]][0] + '</small></span><div class="pl-st">' + ["Planned", "Approved", "Offer out", "Filled"].map(function (s, i) { return '<i class="' + (i <= r[2] ? "pl-on" : "") + '">' + s + "</i>"; }).join("") + "</div><small>" + r[3] + "</small></div>"; }).join("") + '</div><p class="pl-cap">A role is a line in the budget before it is a person. When the hire appears in payroll, the two are matched, so nobody is counted twice.</p>';
      el.innerHTML = '<div class="pl-kp"><div><small>PEOPLE</small><b>' + tot + '</b><span>20 employees, 2 contractors</span></div><div><small>OPEN ROLES</small><b>3</b><span>one offer accepted</span></div><div><small>PEOPLE COST, NOVEMBER</small><b>$372k</b><span>plan was $381k</span></div><div><small>AGAINST PLAN</small><b>$9k under</b><span>one hire started late</span></div></div>' + tabs(["By team", "People", "Open roles"], tab, "t") + '<div class="pl-body">' + body + "</div>";
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
    function draw() {
      var X = D[d], L = X[2], tb = 0, ta = 0, M = move();
      var rows = L.map(function (x, i) { var r = row(x, i); tb += r[0]; ta += r[1]; var over = r[2] > 0, pct = r[0] ? r[2] / r[0] * 100 : 0, w = Math.min(100, r[1] / Math.max(r[0], r[1]) * 100), bw = Math.min(100, r[0] / Math.max(r[0], r[1]) * 100); return '<button type="button" class="bg-row' + (i === sel ? " bg-sel" : "") + '" data-l="' + i + '"><span><b>' + x[0] + "</b>" + (pct > 5 ? '<em class="bg-warn">Over</em>' : "") + '</span><i><u class="bg-b" style="width:' + bw + '%"></u><u class="' + (over ? "bg-o" : "bg-a") + '" style="width:' + w + '%"></u></i><small>' + k(r[1]) + " of " + k(r[0]) + '</small><b class="' + (over ? "bg-neg" : "bg-pos") + '">' + (r[2] > 0 ? "+" : r[2] < 0 ? "-" : "") + k(Math.abs(r[2])).replace("$", "$") + "</b></button>"; }).join("");
      var det = sel < 0 ? '<small>PICK A LINE</small><p>Tap any line to see why it moved and open the entries behind it.</p>' : '<small>WHY ' + L[sel][0].toUpperCase() + " MOVED</small><p>" + L[sel][5] + '</p><span class="bg-ent">' + L[sel][6] + " entries behind this line, each with its document</span>";
      var mvh = !M || ytd ? "" : mv[d] === 0 ? '<button type="button" class="ax-btn" data-mv>Ask to move ' + k(M[2]) + " from " + L[M[0]][0] + " to " + L[M[1]][0] + ' <span aria-hidden="true">&rarr;</span></button>' : mv[d] === 1 ? '<div class="bg-req"><b>Request sent to Maya Chen, finance lead.</b><span>' + X[1] + " asked to move " + k(M[2]) + '. She sees both lines and what is left in each.</span><button type="button" class="ax-btn" data-mv>Approve as Maya <span aria-hidden="true">&rarr;</span></button></div>' : "";
      if (mv[d] === 2) mvh = '<div class="bg-req bg-ok"><b>Moved, and logged.</b><span>The working budget changed. The budget the board approved did not, so the original comparison is always there.</span><button type="button" class="ax-lnk" data-mv>Undo</button></div>';
      el.innerHTML = tabs(D.map(function (x) { return x[0]; }), d, "d") + '<div class="bg-top"><div><small>OWNER</small><b>' + X[1] + '</b></div><div class="pl-chips" role="group" aria-label="Period"><button type="button" data-y="0" aria-pressed="' + !ytd + '">November</button><button type="button" data-y="1" aria-pressed="' + !!ytd + '">Year to date</button></div></div><div class="bg-body"><div class="bg-rows"><div class="bg-key"><span><i class="bg-b"></i>Budget</span><span><i class="bg-a"></i>Actual, under</span><span><i class="bg-o"></i>Actual, over</span></div>' + rows + '<div class="bg-tot"><span>' + X[0] + ", " + (ytd ? "year to date" : "November") + "</span><small>" + k(ta) + " of " + k(tb) + '</small><b class="' + (ta > tb ? "bg-neg" : "bg-pos") + '">' + (ta > tb ? "+" : ta < tb ? "-" : "") + k(Math.abs(ta - tb)) + '</b></div></div><div class="bg-side"><div class="bg-det" aria-live="polite">' + det + "</div>" + mvh + '</div></div><p class="pl-cap bg-cap">USD thousands. Each owner sees only their own area. Actuals stop at the last closed month, and spend already committed counts before the bill arrives.</p>';
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
})();
