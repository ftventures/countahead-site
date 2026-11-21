/* Product mocks: month-end close, journal, the eight modules and the controls. Light theme, sample data throughout. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function chip(t, k) { return '<span class="m-chip m-' + (k || "n") + '">' + t + "</span>"; }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';

  /* ---------- month-end close ---------- */
  W.close = function (el) {
    var STEPS = [["Bank and card accounts reconciled", "214 of 214 lines matched across 3 accounts."], ["Payables and receivables tied to the ledger", "Subledgers agree with accounts 1200 and 2000 to the cent."], ["Accruals and prepaids posted", "9 schedules released, including Lumen and annual insurance."], ["Revenue schedules run", "$335k recognized from 41 active contracts."], ["Intercompany balances eliminated", "US, UK and German entities net to zero."]];
    var EX = [["Incoming wire, $12,000", "Confirm the match to invoice INV-0147"], ["Atlas Legal, $8,400", "Over your $5,000 approval limit"], ["Brightdesk, $1,250", "New vendor, so it asks first"]];
    var open = -1, done = [false, false, false], locked = false;
    function draw() {
      var left = done.filter(function (d) { return !d; }).length, pct = locked ? 100 : 86 + (3 - left) * 4;
      var h = '<div class="m-close"><div class="m-close-l"><span class="m-lab">NOVEMBER CLOSE</span><div class="m-big">' + pct + '%</div><div class="m-track"><i style="width:' + pct + '%"></i></div>';
      h += locked ? '<div class="m-locked">' + CHECK + '<div><b>November is locked.</b><br>Later changes need a logged adjusting entry. The forecast has re-based on the closed month.</div></div><button type="button" class="m-btn2" data-a="reset">Reopen the demo</button>'
        : '<p class="m-p">Agents prepare each step as the month runs. You review the exceptions, then lock the period.</p><button type="button" class="m-btn" data-a="lock"' + (left ? " disabled" : "") + ">" + (left ? "Review " + left + (left === 1 ? " exception" : " exceptions") + " to lock" : "Lock November") + "</button>";
      h += '</div><div class="m-close-r">';
      STEPS.forEach(function (s, i) {
        h += '<button type="button" class="m-step" data-a="step" data-i="' + i + '" aria-expanded="' + (open === i) + '"><span class="m-box m-on"></span><span class="m-st">' + s[0] + '</span><span class="m-done">Done</span></button>' + (open === i ? '<div class="m-detail"><b>What the agents did.</b> ' + s[1] + "</div>" : "");
      });
      h += '<div class="m-step m-exh"><span class="m-box' + (left ? "" : " m-on") + '"></span><span class="m-st">Review exceptions</span><span class="' + (left ? "m-warn" : "m-done") + '">' + (left ? left + " for you" : "Done") + "</span></div>";
      EX.forEach(function (x, i) {
        h += '<div class="m-ex' + (done[i] ? " m-exd" : "") + '"><div><b>' + x[0] + "</b><span>" + x[1] + "</span></div>" + (done[i] ? chip("Approved", "ok") : '<button type="button" class="m-btn m-sm" data-a="ok" data-i="' + i + '">Approve</button>') + "</div>";
      });
      h += '<div class="m-step m-exh"><span class="m-box' + (locked ? " m-on" : "") + '"></span><span class="m-st">Lock the period</span><span class="' + (locked ? "m-done" : "m-mut") + '">' + (locked ? "Locked" : "Waiting") + "</span></div></div></div>";
      el.innerHTML = h;
    }
    on(el, "[data-a]", function (t) {
      var a = t.getAttribute("data-a"), i = +t.getAttribute("data-i");
      if (a === "step") open = open === i ? -1 : i;
      if (a === "ok") done[i] = true;
      if (a === "lock" && !t.disabled) locked = true;
      if (a === "reset") { done = [false, false, false]; locked = false; open = -1; }
      draw();
    });
    draw();
  };

  /* ---------- journal ---------- */
  var JE = [
    { id: "JE-1191", d: "Nov 05", t: "Northwind Ltd, wire received", k: "Revenue", amt: "12,000.00", src: "Bank line matched to invoice INV-0147", lines: [["dr", "1010 Operating bank", "12,000.00"], ["cr", "1200 Accounts receivable", "12,000.00"]], trail: [["09:02", "Agent", "matched the wire to INV-0147 by payer, amount and reference"], ["09:40", "You", "confirmed the match"], ["09:40", "System", "posted and marked the invoice paid"]] },
    { id: "JE-1186", d: "Nov 04", t: "Annual insurance", k: "Bills", amt: "36,000.00", src: "Policy schedule and invoice, spread over 12 months", lines: [["dr", "1400 Prepaid expenses", "36,000.00"], ["cr", "1010 Operating bank", "36,000.00"]], trail: [["11:15", "Agent", "read the policy and built a 12-month schedule"], ["11:16", "Agent", "proposed the entry, over your $5,000 limit"], ["14:03", "You", "approved"]] },
    { id: "JE-1185", d: "Nov 02", t: "Payroll run", k: "Payroll", amt: "186,400.00", src: "Payroll provider report, 24 employees", lines: [["dr", "6100 Salaries and benefits", "186,400.00"], ["cr", "1010 Operating bank", "186,400.00"]], trail: [["06:00", "Agent", "imported the payroll report"], ["06:00", "Agent", "split cost by department"], ["06:01", "System", "posted under the payroll policy"]] },
    { id: "JE-1184", d: "Nov 04", t: "Payment processor payout", k: "Revenue", amt: "39,350.23", src: "Reconciled to 212 customer charges", lines: [["dr", "1010 Operating bank", "38,204.11"], ["dr", "6400 Payment fees", "1,146.12"], ["cr", "1200 Accounts receivable", "39,350.23"]], trail: [["03:12", "Agent", "matched the payout to 212 charges"], ["03:12", "Agent", "split out $1,146.12 of fees"], ["03:12", "System", "posted under policy"]] },
    { id: "JE-1183", d: "Nov 03", t: "Lumen design tools, annual", k: "Bills", amt: "540.00", src: "Receipt, spread over 12 months", lines: [["dr", "1400 Prepaid expenses", "540.00"], ["cr", "2100 Card payable", "540.00"]], trail: [["16:44", "Agent", "read the receipt from the inbox"], ["16:44", "Agent", "matched it to the card ending 2204"], ["16:44", "System", "posted under policy"]] },
    { id: "JE-1182", d: "Nov 03", t: "Orbit Cloud, hosting", k: "Bills", amt: "4,812.40", src: "Invoice 2291, matched to card", lines: [["dr", "5100 Hosting", "4,812.40"], ["cr", "2100 Card payable", "4,812.40"]], trail: [["09:14", "Agent", "read invoice 2291 from Orbit Cloud"], ["09:14", "Agent", "proposed the entry, matched to card"], ["09:31", "You", "approved under policy"]] }
  ];
  function jeDetail(e) {
    return '<div class="m-je"><div class="m-jeh"><span class="m-id">' + e.id + "</span>" + chip("POSTED " + e.d.toUpperCase(), "blue") + '</div><b class="m-h3">' + e.t + '</b><div class="m-src"><b>Source.</b> ' + e.src + '</div><div class="m-lines">' +
      e.lines.map(function (l) { return '<div class="m-line m-' + l[0] + '"><span class="m-tag">' + l[0].toUpperCase() + "</span><span>" + l[1] + "</span><b>" + l[2] + "</b></div>"; }).join("") +
      '<div class="m-bal">' + CHECK + "<span>Debits equal credits</span><b>" + e.amt + '</b></div></div><div class="m-lab" style="margin-top:4px">AUDIT TRAIL</div><div class="m-trail">' +
      e.trail.map(function (x) { return '<div><span>' + x[0] + '</span><span><b class="m-w' + (x[1] === "You" ? " m-you" : "") + '">' + x[1] + "</b> " + x[2] + "</span></div>"; }).join("") + "</div></div>";
  }
  W.journal = function (el) {
    var f = "All", sel = 0, KS = ["All", "Bills", "Revenue", "Payroll"];
    function draw() {
      var list = JE.filter(function (e) { return f === "All" || e.k === f; }); if (sel >= list.length) sel = 0;
      el.innerHTML = '<div class="m-two"><div class="m-list"><div class="m-filters">' + KS.map(function (k) { return '<button type="button" data-a="f" data-k="' + k + '" aria-pressed="' + (k === f) + '">' + k + "</button>"; }).join("") + "</div>" +
        list.map(function (e, i) { return '<button type="button" class="m-row" data-a="s" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + e.t + "</b><small>" + e.id + " · " + e.d + "</small></span><b>" + e.amt + "</b></button>"; }).join("") +
        '</div><div class="m-pane">' + jeDetail(list[sel]) + "</div></div>";
    }
    on(el, "[data-a]", function (t) { if (t.getAttribute("data-a") === "f") { f = t.getAttribute("data-k"); sel = 0; } else sel = +t.getAttribute("data-i"); draw(); });
    draw();
  };

  /* ---------- the eight modules ---------- */
  var M = [];
  M[0] = function (el) {
    var G = [["Assets", "3,632", [["1010", "Operating bank", "3,060", [["Nov 05", "JE-1191 Northwind wire", "+12,000.00"], ["Nov 04", "JE-1184 Processor payout", "+38,204.11"], ["Nov 02", "JE-1185 Payroll run", "-186,400.00"]]], ["1200", "Accounts receivable", "412", [["Nov 05", "JE-1191 Northwind paid", "-12,000.00"], ["Nov 04", "JE-1184 Payout applied", "-39,350.23"]]], ["1400", "Prepaid expenses", "86", [["Nov 04", "JE-1186 Annual insurance", "+36,000.00"], ["Nov 03", "JE-1183 Lumen annual", "+540.00"]]], ["1500", "Fixed assets, net", "74", [["Nov 30", "Depreciation, November", "-4,000.00"]]]]],
      ["Liabilities", "859", [["2000", "Accounts payable", "142", [["Nov 12", "Atlas Legal, bill", "+8,400.00"]]], ["2100", "Card payable", "56", [["Nov 03", "JE-1182 Orbit Cloud", "+4,812.40"], ["Nov 03", "JE-1183 Lumen", "+540.00"]]], ["2400", "Deferred revenue", "540", [["Nov 30", "Revenue released, November", "-335,000.00"]]]]],
      ["Equity", "2,773", [["3000", "Paid-in capital", "9,800", [["2025", "Series A, 2025", "+8,000,000.00"]]], ["3900", "Accumulated deficit", "(7,027)", [["Nov 30", "Net loss, November", "-215,000.00"]]]]]];
    var sel = "1010";
    function draw() {
      var h = '<div class="m-coa">';
      G.forEach(function (g) {
        h += '<div class="m-grp"><span>' + g[0] + "</span><b>" + g[1] + "</b></div>";
        g[2].forEach(function (a) {
          h += '<button type="button" class="m-acct" data-c="' + a[0] + '" aria-expanded="' + (sel === a[0]) + '"><span class="m-code">' + a[0] + "</span><span>" + a[1] + "</span><b>" + a[2] + "</b></button>";
          if (sel === a[0]) h += '<div class="m-drill"><span class="m-lab">ENTRIES BEHIND THIS BALANCE</span>' + a[3].map(function (e) { return "<div><span>" + e[0] + "</span><span>" + e[1] + "</span><b>" + e[2] + "</b></div>"; }).join("") + "</div>";
        });
      });
      el.innerHTML = h + '</div><p class="m-foot">USD thousands for balances. Tap an account to trace it to its entries.</p>';
    }
    on(el, "[data-c]", function (t) { var c = t.getAttribute("data-c"); sel = sel === c ? "" : c; draw(); }); draw();
  };
  M[1] = function (el) {
    var ok = false;
    function draw() {
      el.innerHTML = '<div class="m-stats"><div><small>BANK STATEMENT</small><b>3,060,412.18</b></div><div><small>LEDGER</small><b>' + (ok ? "3,060,412.18" : "3,048,412.18") + '</b></div><div class="' + (ok ? "m-good" : "m-bad") + '"><small>DIFFERENCE</small><b>' + (ok ? "0.00" : "12,000.00") + "</b></div></div>" +
        '<div class="m-match' + (ok ? " m-matched" : "") + '"><div class="m-mc"><small>BANK LINE</small><b>Incoming wire, Northwind Ltd</b><span>Nov 05, reference INV-0147</span><i>12,000.00</i></div>' +
        (ok ? '<div class="m-mid">' + CHECK + " Matched, JE-1191 posted</div>" : '<div class="m-mid"><button type="button" class="m-btn" data-a="ok">Confirm match</button></div>') +
        '<div class="m-mc"><small>OPEN INVOICE</small><b>INV-0147, Northwind Ltd</b><span>Issued Oct 21, due Nov 20</span><i>12,000.00</i></div></div>' +
        [["Processor payout", "38,204.11", "JE-1184"], ["Card payment, Orbit Cloud", "-4,812.40", "JE-1182"], ["Payroll run", "-186,400.00", "JE-1185"]].map(function (r) { return '<div class="m-li"><span><b>' + r[0] + "</b><small>Matched automatically to " + r[2] + "</small></span><b>" + r[1] + "</b></div>"; }).join("") +
        '<p class="m-foot">' + (ok ? "214 of 214" : "213 of 214") + " lines reconciled this month." + (ok ? ' <button type="button" class="m-link" data-a="undo">Undo</button>' : "") + "</p>";
    }
    on(el, "[data-a]", function (t) { ok = t.getAttribute("data-a") === "ok"; draw(); }); draw();
  };
  M[2] = function (el) {
    var B = [["Atlas Legal", "8,400.00", "6500 Legal fees", "Over your $5,000 limit, so the CFO approves", 0], ["Brightdesk", "1,250.00", "6300 Office", "New vendor, so it asks first", 0], ["Orbit Cloud", "4,812.40", "5100 Hosting", "Under the limit, posted under policy", 1], ["Lumen", "540.00", "1400 Prepaid expenses", "Under the limit, spread over 12 months", 1]], sel = 0;
    function draw() {
      var b = B[sel];
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-list">' + B.map(function (x, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + x[0] + "</b><small>" + x[2] + "</small></span><span class=\"m-ra\"><b>$" + x[1] + "</b>" + chip(x[4] === 1 ? "Posted" : x[4] === 2 ? "Scheduled" : "Needs you", x[4] ? "ok" : "warn") + "</span></button>"; }).join("") + "</div>" +
        '<div class="m-pane"><div class="m-doc"><div class="m-doch"><b>' + b[0] + "</b><span>Invoice, read from the inbox</span></div>" + [["Amount due", "$" + b[1]], ["Coded to", b[2]], ["Policy", b[3]]].map(function (r) { return '<div class="m-kv"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>"; }).join("") + "</div>" +
        (b[4] === 0 ? '<div class="m-acts"><button type="button" class="m-btn" data-a="ok">Approve</button><button type="button" class="m-btn2" data-a="back">Send back</button></div>' : '<div class="m-note">' + CHECK + (b[4] === 2 ? " Approved by you. Scheduled to pay on November 28." : b[4] === 3 ? " Sent back to the agent with a question for the vendor." : " Posted by an agent. Nothing for you to do.") + "</div>") + "</div></div>";
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-a]", function (t) { B[sel][4] = t.getAttribute("data-a") === "ok" ? 2 : 3; draw(); }); draw();
  };
  M[3] = function (el) {
    var sent = false, AG = [["Current", 318], ["1 to 30 days", 62], ["31 to 60", 24], ["Over 60", 8]];
    function draw() {
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane"><div class="m-inv"><div class="m-doch"><b>INV-0152</b>' + chip(sent ? "SENT" : "DRAFT", sent ? "blue" : "warn") + '</div><div class="m-kv"><span>Bill to</span><b>Harbor Labs</b></div><div class="m-kv"><span>For</span><b>December to February</b></div><div class="m-kv"><span>Terms</span><b>Net 30</b></div><div class="m-kv m-tot"><span>Amount</span><b>$12,000.00</b></div><p class="m-foot" style="padding:0">Drafted by an agent from the signed contract: $48,000 a year, billed quarterly.</p></div>' +
        (sent ? '<div class="m-note">' + CHECK + " Sent as a PDF and as structured data. Receivable recorded, due December 31.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="send">Approve and send</button></div>') + "</div>" +
        '<div class="m-pane"><span class="m-lab">RECEIVABLES BY AGE, USD THOUSANDS</span>' + AG.map(function (a, i) { var v = a[1] + (sent && i === 0 ? 12 : 0); return '<div class="m-age"><span>' + a[0] + '</span><div><i style="width:' + v / 3.4 + "%;background:" + (i > 1 ? "#8A5A00" : "#2450DC") + '"></i></div><b>' + v + "</b></div>"; }).join("") + '<div class="m-kv m-tot"><span>Total receivable</span><b>' + (sent ? 424 : 412) + "</b></div></div></div>";
    }
    on(el, "[data-a]", function () { sent = !sent; draw(); }); draw();
  };
  M[4] = function (el) {
    var S = [["Prepaid: Lumen design tools", 540, 12, "Each month $45.00 moves from prepaid to software expense."], ["Deferred revenue: Harbor Labs", 12000, 3, "Each month $4,000.00 moves from deferred revenue to revenue."]], k = 0, m = 1, MN = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    function money(v) { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2 }); }
    function draw() {
      var s = S[k], per = s[1] / s[2]; if (m > s[2]) m = s[2];
      el.innerHTML = '<div class="m-filters">' + S.map(function (x, i) { return '<button type="button" data-k="' + i + '" aria-pressed="' + (i === k) + '">' + x[0] + "</button>"; }).join("") + "</div>" +
        '<div class="m-pane"><div class="m-stats"><div><small>TOTAL</small><b>' + money(s[1]) + "</b></div><div><small>RECOGNIZED</small><b>" + money(per * m) + '</b></div><div class="m-good"><small>STILL ON THE BALANCE SHEET</small><b>' + money(s[1] - per * m) + "</b></div></div>" +
        '<div class="m-cells">' + MN.slice(0, s[2]).map(function (n, i) { return '<div class="' + (i < m ? "m-rel" : "") + '"><small>' + n + "</small><b>" + (per >= 1000 ? (per / 1000) + "k" : per) + "</b></div>"; }).join("") + "</div>" +
        '<label class="m-lab" for="m-sl">MONTHS POSTED: ' + m + " OF " + s[2] + '</label><input id="m-sl" type="range" min="0" max="' + s[2] + '" value="' + m + '"><p class="m-foot" style="padding:0">' + s[3] + " Agents post it on the last day of each month.</p></div>";
      el.querySelector("input").addEventListener("input", function () { m = +this.value; draw(); el.querySelector("input").focus(); });
    }
    on(el, "[data-k]", function (t) { k = +t.getAttribute("data-k"); m = 1; draw(); }); draw();
  };
  M[5] = function (el) { W.close(el); };
  M[6] = function (el) {
    var T = { "Income statement": [["Revenue", "335", "41 contracts, 212 charges"], ["Cost of revenue", "(84)", "20 entries in 5100 Hosting and 5200 Support"], ["Operating expenses", "(470)", "Payroll, software, legal and 63 other entries"], ["EBITDA", "(219)", ""], ["Net income", "(215)", "After $4k of depreciation, $9k of interest income and $1k of tax"]],
      "Balance sheet": [["Cash", "3,060", "3 bank accounts, reconciled today"], ["Other assets", "572", "Receivables, prepaids and fixed assets"], ["Liabilities", "(859)", "Payables, accruals and deferred revenue"], ["Equity", "2,773", "Paid-in capital less accumulated deficit"]],
      "Cash flow": [["Net income", "(215)", "From the income statement"], ["Depreciation", "4", "Non-cash, added back"], ["Receivables and prepaids", "(8)", "Receivables up 14, prepaids down 6"], ["Payables and accruals", "4", "Liabilities up 4"], ["Change in cash", "(215)", "Opening 3,275, closing 3,060"]] }, k = "Income statement", open = 0;
    function draw() {
      el.innerHTML = '<div class="m-filters">' + Object.keys(T).map(function (n) { return '<button type="button" data-k="' + n + '" aria-pressed="' + (n === k) + '">' + n + "</button>"; }).join("") + '</div><div class="m-pane" style="padding:0"><div class="m-grp"><span>November, USD thousands</span><b>Nov</b></div>' +
        T[k].map(function (r, i) { return '<button type="button" class="m-acct' + (i === T[k].length - 1 ? " m-total" : "") + '" data-i="' + i + '" aria-expanded="' + (open === i) + '"><span>' + r[0] + "</span><b>" + r[1] + "</b></button>" + (open === i && r[2] ? '<div class="m-drill"><span class="m-lab">BEHIND THIS NUMBER</span><div><span>' + r[2] + "</span></div></div>" : ""); }).join("") + '</div><p class="m-foot">All three statements come from the same entries, so they always agree.</p>';
    }
    on(el, "[data-k]", function (t) { k = t.getAttribute("data-k"); open = 0; draw(); });
    on(el, "[data-i]", function (t) { var i = +t.getAttribute("data-i"); open = open === i ? -1 : i; draw(); }); draw();
  };
  M[7] = function (el) {
    var con = false, E = [["Sample Co., Inc.", "United States", "USD", "2,410", "1.00", 2410], ["Sample Co. Ltd", "United Kingdom", "GBP", "310", "1.27", 394], ["Sample Co. GmbH", "Germany", "EUR", "237", "1.08", 256]];
    function draw() {
      el.innerHTML = '<div class="m-filters"><button type="button" data-v="0" aria-pressed="' + !con + '">By entity</button><button type="button" data-v="1" aria-pressed="' + con + '">Consolidated</button></div><div class="m-pane" style="padding:0">' +
        (con ? '<div class="m-grp"><span>Consolidated cash, USD thousands</span><b>USD</b></div>' + E.map(function (e) { return '<div class="m-li"><span><b>' + e[0] + "</b><small>" + e[3] + " " + e[2] + " at " + e[4] + "</small></span><b>" + e[5].toLocaleString("en-US") + "</b></div>"; }).join("") + '<div class="m-li m-elim"><span><b>Intercompany loan, US to UK</b><small>120 owed and 120 owing, eliminated</small></span><b>0</b></div><div class="m-acct m-total"><span>Group cash</span><b>3,060</b></div>'
          : '<div class="m-grp"><span>Cash by entity, local currency, thousands</span><b>Local</b></div>' + E.map(function (e) { return '<div class="m-li"><span><b>' + e[0] + "</b><small>" + e[1] + "</small></span><b>" + e[2] + " " + e[3] + "</b></div>"; }).join("") + '<div class="m-li m-elim"><span><b>Intercompany loan, US to UK</b><small>Shows in both sets of books until consolidation</small></span><b>USD 120</b></div>') +
        '</div><p class="m-foot">Sample exchange rates. Each entity keeps its own books in its own currency.</p>';
    }
    on(el, "[data-v]", function (t) { con = t.getAttribute("data-v") === "1"; draw(); }); draw();
  };
  var MD = [["CORE", "General ledger", "General ledger", "Double-entry and accrual-based, with your own chart of accounts and every balance traceable to its entries.", "Post each entry with its source document attached.", "Set the chart of accounts, and post a manual journal whenever you want.", "Mostly your accountant, a few times a month."],
    ["CASH", "Bank reconciliation", "Bank and card reconciliation", "Transactions matched to documents and reconciled continuously, not in a month-end scramble.", "Match each bank and card line to its document as it arrives.", "Confirm the few matches they are unsure of.", "Whoever runs finance, a few minutes a day."],
    ["MONEY OUT", "Bills and expenses", "Bills and expenses", "Invoices and receipts collected from inboxes, read, coded and queued for approval.", "Collect, read and code every bill and receipt.", "Approve what your policy sends to you.", "Budget owners approve, a few taps a day."],
    ["MONEY IN", "Invoicing", "Invoicing and receivables", "Customer invoices prepared from signed contracts. Invoices go out as structured data, so your customer's system can read them without retyping.", "Draft invoices from signed contracts and match payments to them.", "Approve invoices before they go out.", "Finance and sales, as deals close."],
    ["TIMING", "Accruals and schedules", "Accruals, prepaids and schedules", "Costs and revenue recognized in the right period, with the schedule kept behind each balance.", "Build the schedule and post each month's entry.", "Review the schedule when it is created.", "Finance, once a month."],
    ["CLOSE", "Month-end close", "Month-end close", "A checklist that prepares itself through the month.", "Work through the checklist as the month runs.", "Review the exceptions, then lock the period.", "Finance lead, a few days a month."],
    ["REPORTING", "Statements", "Financial statements", "Income statement, balance sheet and cash flow that are current today, with drill-down to every entry.", "Keep all three statements current every day.", "Open any number down to the entries behind it.", "Founders, finance and the board, any time."],
    ["GROUP", "Entities and currencies", "Entities and currencies", "Several entities and currencies consolidated into one view, with intercompany eliminated.", "Consolidate entities and eliminate intercompany balances.", "Review the consolidated view.", "Finance, at month end."],
    ["PEOPLE", "Payroll", "Payroll", "Each pay run arrives from your payroll provider and is booked by team, so headcount cost in the books matches the plan.", "Turn each pay run into a journal, split by team.", "Approve the journal. Running payroll stays with your provider.", "Finance, each pay run."],
    ["TAX", "Sales tax", "Sales tax tracking", "Tax collected on sales and paid on purchases, tracked by place and kept ready for whoever files.", "Track what was collected and owed, by jurisdiction.", "Hand the report to your tax adviser. Filing stays with you and them.", "Finance and your adviser, each filing period."]];
  var NAV = [["EVERY DAY", [1, 2, 3]], ["EVERY MONTH", [8, 4, 9, 5]], ["WHEN YOU NEED IT", [6, 7, 0]]];

  M[8] = function (el) {
    var posted = false, T = [["Research and development", 196], ["Sales and marketing", 104], ["General and administrative", 72]];
    function draw() {
      el.innerHTML = '<div class="m-pane"><div class="m-doch"><b>Pay run, November 30</b><span class="m-chip ' + (posted ? "m-blue" : "m-warn") + '">' + (posted ? "POSTED" : "READY TO POST") + '</span></div><div class="m-stats"><div><small>GROSS PAY</small><b>$298.4k</b></div><div><small>EMPLOYER TAXES</small><b>$41.2k</b></div><div><small>BENEFITS</small><b>$32.4k</b></div></div><span class="m-lab">BOOKED BY TEAM, USD THOUSANDS</span>' + T.map(function (t) { return '<div class="m-age" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) 40px"><span>' + t[0] + '</span><div><i style="width:' + t[1] / 196 * 100 + '%;background:#2450DC"></i></div><b>' + t[1] + "</b></div>"; }).join("") + '<div class="m-kv m-tot"><span>Total, 24 people</span><b>$372.0k</b></div>' + (posted ? '<div class="m-note">Posted as one journal with the payslip summary attached. The headcount plan now shows November actuals.</div>' : '<div class="m-acts"><button type="button" class="m-btn" data-a="p">Approve journal</button></div>') + "</div>";
    }
    el.addEventListener("click", function (e) { if (e.target.closest("[data-a]")) { posted = true; draw(); } }); draw();
  };
  M[9] = function (el) {
    var done = false, J = [["California", 4180], ["New York", 2960], ["Texas", 1740], ["United Kingdom, VAT", 3420]];
    function draw() {
      var tot = J.reduce(function (a, x) { return a + x[1]; }, 0);
      el.innerHTML = '<div class="m-pane" style="padding:0"><div class="m-grp"><span>Collected on sales this quarter</span><b>USD</b></div>' + J.map(function (x) { return '<div class="m-acct" style="cursor:default"><span>' + x[0] + "</span><b>" + x[1].toLocaleString("en-US") + "</b></div>"; }).join("") + '<div class="m-acct m-total" style="cursor:default"><span>Held in 2200 Sales tax payable</span><b>' + tot.toLocaleString("en-US") + '</b></div></div><div class="m-pane">' + (done ? '<div class="m-note">Report prepared, with every invoice behind each figure. Filing stays with you and your tax adviser.</div>' : '<div class="m-acts"><button type="button" class="m-btn" data-a="p">Prepare report for adviser</button></div>') + '<p class="m-foot" style="padding:0">Countahead tracks and reports. It does not file returns or give tax advice.</p></div>';
    }
    el.addEventListener("click", function (e) { if (e.target.closest("[data-a]")) { done = true; draw(); } }); draw();
  };
  W.modules = function (el) {
    var n = 0, flat = [];
    el.innerHTML = '<div class="m-app"><nav class="m-rail nosb" aria-label="Accounting modules">' + NAV.map(function (g) { return '<div class="m-rg"><small>' + g[0] + "</small>" + g[1].map(function (i) { flat.push(i); n++; return '<button type="button" data-m="' + i + '"><i>' + (n < 10 ? "0" + n : n) + "</i><b>" + MD[i][1] + "</b></button>"; }).join("") + "</div>"; }).join("") + '</nav><div class="m-stage"><div class="m-info"></div><div class="m-mock"><div class="m-bar"><span></span><span>Illustrative, sample data</span></div><div class="m-screen"></div></div><div class="m-next"></div></div></div>';
    function show(i) {
      var m = MD[i], pos = flat.indexOf(i), nx = flat[(pos + 1) % flat.length]; [].forEach.call(el.querySelectorAll(".m-rail [data-m]"), function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-m") === i); });
      el.querySelector(".m-info").innerHTML = '<div class="m-ih"><span class="m-lab" style="color:#2450DC">' + m[0] + '</span><b class="m-h2">' + m[2] + '</b><p class="m-p">' + m[3] + '</p></div><div class="m-who"><div class="m-do m-ag"><small>AGENTS DO</small><span>' + m[4] + '</span></div><div class="m-do"><small>YOU DO</small><span>' + m[5] + '</span></div><div class="m-do m-use"><small>WHO OPENS IT</small><span>' + m[6] + "</span></div></div>";
      el.querySelector(".m-bar span").textContent = "Countahead / " + m[2];
      el.querySelector(".m-next").innerHTML = '<button type="button" data-m="' + nx + '">Next: ' + MD[nx][1] + " &rarr;</button>";
      var old = el.querySelector(".m-screen"), scr = old.cloneNode(false); old.parentNode.replaceChild(scr, old); M[i](scr);
      var a = el.querySelector('.m-rail [aria-pressed="true"]'), r = el.querySelector(".m-rail"); if (a && r.scrollWidth > r.clientWidth) r.scrollLeft = a.offsetLeft - 16;
    }
    el.addEventListener("click", function (e) { var t = e.target.closest("[data-m]"); if (t && (t.closest(".m-rail") || t.closest(".m-next"))) show(+t.getAttribute("data-m")); });
    show(flat[0]);
  };


  /* ---------- controls ---------- */
  W.controls = function (el) {
    var lim = 5000, locked = 5, role = 0, why = false, acct = "5100 Hosting", log = [["09:14", "Agent", "read invoice 2291 from Orbit Cloud"], ["09:14", "Agent", "proposed JE-1182, matched to card"], ["09:31", "You", "approved under policy"]];
    var BILLS = [["Lumen", 540], ["Orbit Cloud", 4812], ["Atlas Legal", 8400], ["Annual insurance", 36000]], MO = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    var ROLES = [["Founder", [1, 1, 0, 0]], ["Finance lead", [1, 1, 1, 1]], ["Fractional CFO", [1, 1, 1, 1]], ["Outside accountant", [1, 0, 1, 0]]], PERM = ["View everything", "Approve bills", "Post journals", "Lock periods"];
    function draw(focus) {
      el.innerHTML = '<div class="c-grid">' +
        '<div class="c-tile c-wide"><b class="c-h">Approval policies</b><p>Drag the limit. Agents post what falls under it and ask about the rest.</p><div class="c-row"><span>Approval limit</span><b>$' + lim.toLocaleString("en-US") + '</b></div><input type="range" min="500" max="40000" step="500" value="' + lim + '" aria-label="Approval limit in dollars" data-r="lim">' +
        BILLS.map(function (b) { var okp = b[1] <= lim; return '<div class="c-li"><span>' + b[0] + ", $" + b[1].toLocaleString("en-US") + '</span><span class="c-chip' + (okp ? "" : " c-ask") + '">' + (okp ? "Posts itself" : "Asks you") + "</span></div>"; }).join("") + "</div>" +
        '<div class="c-tile"><b class="c-h">Period locks</b><p>Tap a month to lock or unlock it.</p><div class="c-months">' + MO.map(function (m, i) { return '<button type="button" data-a="lock" data-i="' + i + '" aria-pressed="' + (i < locked) + '">' + m + "<small>" + (i < locked ? "Locked" : "Open") + "</small></button>"; }).join("") + "</div><p class=\"c-s\">" + (locked === 6 ? "November is locked. Changes now need an adjusting entry." : locked + " months locked. " + MO[locked] + " onward can still change.") + "</p></div>" +
        '<div class="c-tile"><b class="c-h">Roles for everyone</b><p>Pick a role to see what it can do.</p><div class="c-roles">' + ROLES.map(function (r, i) { return '<button type="button" data-a="role" data-i="' + i + '" aria-pressed="' + (i === role) + '">' + r[0] + "</button>"; }).join("") + "</div>" + PERM.map(function (p, i) { var y = ROLES[role][1][i]; return '<div class="c-li' + (y ? "" : " c-no") + '"><span>' + p + "</span><span>" + (y ? "Yes" : "No") + "</span></div>"; }).join("") + "</div>" +
        '<div class="c-tile c-wide"><b class="c-h">Full audit trail</b><p>Every action, document and decision, with who did it. Try the two tiles beside this one and watch the log grow.</p><div class="c-log">' + log.map(function (l) { return "<div><span>" + l[0] + '</span><span><b class="' + (l[1] === "You" ? "c-you" : "") + '">' + l[1] + "</b> " + l[2] + "</span></div>"; }).join("") + "</div></div>" +
        '<div class="c-tile"><b class="c-h">Explainable entries</b><p>JE-1182, Orbit Cloud, $4,812.40</p>' + (why ? '<div class="c-why"><div><b>Document.</b> Invoice 2291, found in the billing inbox.</div><div><b>Match.</b> Card ending 2204, same amount, same day.</div><div><b>Rule.</b> Orbit Cloud has been coded to hosting 11 times.</div></div>' : "") + '<button type="button" class="c-btn" data-a="why">' + (why ? "Hide the reasoning" : "Why was it coded this way?") + "</button></div>" +
        '<div class="c-tile"><b class="c-h">Human override</b><p>Move JE-1182 to another account. It is logged.</p><div class="c-roles">' + ["5100 Hosting", "6200 Software", "6300 Office"].map(function (a) { return '<button type="button" data-a="acct" data-v="' + a + '" aria-pressed="' + (a === acct) + '">' + a + "</button>"; }).join("") + '</div><p class="c-s">Coded to ' + acct + ".</p></div></div>";
      var r = el.querySelector('[data-r="lim"]'); r.addEventListener("input", function () { lim = +this.value; draw(true); }); if (focus) r.focus();
    }
    function stamp() { var n = log.length; return "10:" + ("0" + (n * 7 % 60)).slice(-2); }
    on(el, "[data-a]", function (t) {
      var a = t.getAttribute("data-a"), i = +t.getAttribute("data-i");
      if (a === "lock") { locked = i < locked ? i : i + 1; log.push([stamp(), "You", (locked > i ? "locked " : "unlocked ") + MO[i]]); }
      if (a === "role") role = i;
      if (a === "why") { why = !why; if (why) log.push([stamp(), "You", "opened the reasoning for JE-1182"]); }
      if (a === "acct") { var v = t.getAttribute("data-v"); if (v !== acct) { log.push([stamp(), "You", "reclassified JE-1182 from " + acct + " to " + v]); acct = v; } }
      if (log.length > 6) log = log.slice(log.length - 6);
      draw();
    });
    draw();
  };
})();
