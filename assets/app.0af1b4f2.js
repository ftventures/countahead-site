/* Countahead site runtime: renders the page template from component state, then patches the DOM in place. */
(function () {
  var HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;
  function lookup(path, scopes) {
    var parts = path.split("."), v, i;
    for (i = scopes.length - 1; i >= 0; i--) {
      var sc = scopes[i];
      if (sc && typeof sc === "object" && parts[0] in sc) { v = sc[parts[0]]; break; }
    }
    for (i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  function holePath(s) { var m = /\{\{\s*([\w.$]+)\s*\}\}/.exec(s || ""); return m ? m[1] : ""; }
  function fill(str, scopes) {
    if (str.indexOf("{{") < 0) return str;
    return str.replace(HOLE, function (m, p) { var v = lookup(p, scopes); return v == null ? "" : String(v); });
  }
  function number(tplRoot) {
    var n = 0, list = tplRoot.querySelectorAll("sc-for,sc-if");
    for (var i = 0; i < list.length; i++) list[i].__id = "k" + (n++);
  }
  function renderKids(t, out, scopes, ctx, prefix) {
    for (var c = t.firstChild; c; c = c.nextSibling) renderNode(c, out, scopes, ctx, prefix);
  }
  function keyed(t, out, scopes, ctx, key) {
    var before = out.childNodes.length;
    renderKids(t, out, scopes, ctx, key);
    for (var i = before, c = 0; i < out.childNodes.length; i++) {
      var n = out.childNodes[i];
      if (n.nodeType === 1 && !n.hasAttribute("data-k")) n.setAttribute("data-k", key + (c++));
    }
  }
  function renderNode(t, out, scopes, ctx, prefix) {
    var doc = ctx.doc;
    if (t.nodeType === 3) { out.appendChild(doc.createTextNode(fill(t.data, scopes))); return; }
    if (t.nodeType !== 1) return;
    var tag = t.localName;
    if (tag === "sc-for") {
      var list = lookup(holePath(t.getAttribute("list")), scopes) || [], as = t.getAttribute("as");
      for (var i = 0; i < list.length; i++) { var s = {}; s[as] = list[i]; keyed(t, out, scopes.concat([s]), ctx, prefix + t.__id + "_" + i + "/"); }
      return;
    }
    if (tag === "sc-if") {
      if (lookup(holePath(t.getAttribute("value")), scopes)) keyed(t, out, scopes, ctx, prefix + t.__id + "/");
      return;
    }
    var el = doc.createElementNS(t.namespaceURI, tag);
    for (var a = 0; a < t.attributes.length; a++) {
      var at = t.attributes[a], name = at.name;
      if (name.toLowerCase() === "onclick") {
        var fn = lookup(holePath(at.value), scopes);
        ctx.handlers.push(fn); el.setAttribute("data-on", String(ctx.handlers.length - 1));
      } else el.setAttribute(name, fill(at.value, scopes));
    }
    renderKids(t, el, scopes, ctx, prefix);
    out.appendChild(el);
  }
  function key(n) { return n.nodeType === 1 ? n.getAttribute("data-k") : null; }
  function patch(a, b) {
    if (a.nodeType === 3) { if (a.data !== b.data) a.data = b.data; return; }
    var i, at;
    for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i]; if (!b.hasAttribute(at.name)) a.removeAttribute(at.name); }
    for (i = 0; i < b.attributes.length; i++) { at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
    if (a.hasAttribute("data-widget")) return;
    patchKids(a, b);
  }
  function patchKids(a, b) {
    var map = {}, n, cur = a.firstChild, kids = [], k;
    for (n = a.firstChild; n; n = n.nextSibling) { k = key(n); if (k != null) map[k] = n; }
    for (n = b.firstChild; n; n = n.nextSibling) kids.push(n);
    for (var i = 0; i < kids.length; i++) {
      var bn = kids[i], bk = key(bn), match = null;
      if (bk != null) match = map[bk] && map[bk].nodeName === bn.nodeName ? map[bk] : null;
      else { n = cur; while (n && key(n) != null) n = n.nextSibling; if (n && n.nodeType === bn.nodeType && n.nodeName === bn.nodeName) match = n; }
      if (match) {
        if (match !== cur) a.insertBefore(match, cur); else cur = cur.nextSibling;
        patch(match, bn);
      } else a.insertBefore(bn, cur);
    }
    while (cur) { n = cur.nextSibling; a.removeChild(cur); cur = n; }
  }
  function mount(doc, tplRoot, appEl, Comp, props) {
    number(tplRoot);
    var inst = new Comp(); inst.props = props || {}; inst.state = {};
    var ctx = { doc: doc, handlers: [] }, queued = false;
    function render() {
      queued = false; ctx.handlers = [];
      var frag = doc.createElement("div");
      renderKids(tplRoot, frag, [inst.renderVals()], ctx, "");
      patchKids(appEl, frag);
      if (window.CAW && !window.__PRERENDER) window.CAW.mount(appEl);
    }
    inst.setState = function (p) {
      for (var k in p) inst.state[k] = p[k];
      if (queued) return; queued = true;
      (typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout)(render);
    };
    appEl.__click = function (e) {
      var t = e.target; while (t && t !== appEl && !(t.getAttribute && t.hasAttribute("data-on"))) t = t.parentNode;
      if (t && t !== appEl) { var fn = ctx.handlers[+t.getAttribute("data-on")]; if (typeof fn === "function") fn(e); }
    };
    render();
    return inst;
  }
  window.CA = { mount: mount };
})();

class DCLogic {}
class Component extends DCLogic {
componentWillUnmount() { if (this._tw) clearInterval(this._tw); }
qs(base, hire5) {
return [
{ text: "Why did gross margin decline last month?", title: "Gross margin fell from 78.4% to 74.9% in November.", body: "The decline is cost-driven. Hosting rose $11.2k after the usage tier change on November 3, and support contractor spend rose $3.3k. Revenue grew 4.0% over the same month, so pricing and volume are not the cause.", src: "14 entries in 5100 Hosting, 6 entries in 5200 Support, November revenue by customer" },
{ text: "How much runway do we have?", title: base.runway + ", to " + base.outLabel + ".", body: "Cash today is $3.06M. On the base plan revenue grows 2% a month, so burn falls from about $" + base.firstBurn + "k a month as you go. Cash still runs out before the plan reaches breakeven, which is the gap to close.", src: "Bank balances as of yesterday, base plan forecast, current headcount" },
{ text: "Which expenses increased most this quarter?", title: "Hosting, travel and software, in that order.", body: "Hosting and other costs rose from $159k in October to $178k in November. The three largest increases were hosting at $11.2k, travel at $4.1k and software subscriptions at $2.3k.", src: "Cost accounts 5100 to 6900, October against November" },
{ text: "What happens to cash if we hire five people?", title: "Runway moves from " + base.runway + " to " + hire5.runway + ".", body: "Five hires starting in January add about $85k a month in loaded payroll. Cash runs out in " + hire5.outLabel + " instead of " + base.outLabel + ". Open it as a scenario to adjust start dates or salaries.", src: "Headcount plan, payroll burden rates, base plan forecast" }
];
}
people() {
return [
{ id: "ceo", label: "I run the company", short: "Founder", line: "You want to know how long the money lasts, without becoming an accountant.", role: "Founder or CEO",
pains: ["Books that are weeks behind, so every decision uses old numbers.", "No confident answer to how long the money lasts.", "Paying for software and a bookkeeper, and still building the investor update by hand."],
gains: ["Books that are current every day, without you doing them.", "Runway and burn from real numbers, in plain language.", "Investor and board updates drafted from the ledger."],
qa: [
{ q: "Do I still need an accountant?", a: "For tax filings and statutory accounts, yes. This handles the daily bookkeeping and hands your accountant clean, documented books." },
{ q: "How much of my time does it take?", a: "The aim is minutes a week. Agents prepare the work and you approve what your policy sends to you." },
{ q: "Will my books hold up in due diligence?", a: "Every entry carries its source document and approval, so any number can be traced to where it came from." }
] },
{ id: "cfo", label: "I run finance", short: "Finance lead", line: "You want a close measured in days and a forecast you do not rebuild.", role: "CFO, head of finance or fractional CFO",
pains: ["A close that takes two weeks of reconciliations.", "A model rebuilt from exports every month.", "Entities and currencies consolidated by hand."],
gains: ["Continuous reconciliation, so you close by exception.", "A forecast that reads the ledger directly.", "Entities consolidated with intercompany eliminated."],
qa: [
{ q: "Is it a real general ledger?", a: "Yes. Double-entry and accrual-based, multi-entity and multi-currency, with period locks. It is the system of record, not a layer on top of one." },
{ q: "How do I control what the agents do?", a: "Approval policies by type and amount. Agents propose, and nothing posts outside the limits you set." },
{ q: "Can I check the work?", a: "Each entry shows its document, its match and its reasoning. You can reclassify or post a manual journal at any time, and it is logged." }
] },
{ id: "acct", label: "I keep the books", short: "Accountant", line: "You want to review the work, not retype it.", role: "Accountant, controller or bookkeeper",
pains: ["Chasing people for invoices and receipts.", "Coding and reconciling line by line.", "Cleaning up the books before the real work can start."],
gains: ["Documents collected and attached at the source.", "Entries arrive coded, with their evidence.", "You review the exceptions, not every line."],
qa: [
{ q: "Is this meant to replace me?", a: "No. It takes the collecting, coding and matching. Review, judgment, adjusting entries, tax and sign-off stay with you." },
{ q: "Can I correct and adjust?", a: "Yes. Post adjusting journals, reclassify, and lock the period when you are done. Every change is logged." },
{ q: "What do I get at year end?", a: "A trial balance and ledger detail in which every line links to its source document and approval." }
] }
];
}
renderVals() {
var self = this;
var st = this.state || {};
var hires = st.hires == null ? 0 : st.hires;
var growth = st.growth == null ? 2 : st.growth;
var t0 = st.t0 == null ? 5 : st.t0;
var qSel = st.q || 0;
var tab = st.tab || "pnl";
var who = st.who || "ceo";
var approved = st.approved || {};
var brand = this.props.brand ?? "Countahead";

var T = {
rev: [275, 286, 298, 310, 322, 335, 351, 360, 379],
pay: [352, 358, 362, 365, 368, 372, 378, 384, 390],
opx: [150, 155, 160, 165, 159, 178, 176, 188, 181]
};
var cashTrue = [];
var c0 = 4378;
for (var a = 0; a < 9; a++) { c0 -= T.pay[a] + T.opx[a] - T.rev[a]; cashTrue.push(c0); }

var NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function monthLabel(i) { return NAMES[(5 + i) % 12] + " " + (2026 + Math.floor((5 + i) / 12)); }
function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function sim(start, h, g) {
var S = { rev: [], pay: [], opx: [], burn: [], cash: [] };
for (var i = 0; i <= start; i++) {
S.rev[i] = T.rev[i]; S.pay[i] = T.pay[i]; S.opx[i] = T.opx[i];
S.burn[i] = T.pay[i] + T.opx[i] - T.rev[i]; S.cash[i] = cashTrue[i];
}
var c = cashTrue[start], rev = T.rev[start], opx = T.opx[start], pay = T.pay[start];
var hireStart = Math.max(7, start + 1);
var out = null, be = null, sum6 = 0, firstBurn = 0;
for (var m = start + 1; m <= start + 72; m++) {
rev = rev * (1 + g / 100);
opx = opx * 1.01;
var p = pay + (m >= hireStart ? h * 17 : 0);
var burn = p + opx - rev;
if (m === start + 1) firstBurn = burn;
if (m - start <= 6) sum6 += burn;
if (out === null) {
if (be === null && burn <= 0) be = m;
c -= burn;
if (c <= 0) { out = m; c = 0; }
}
if (m < 24) { S.rev[m] = rev; S.pay[m] = p; S.opx[m] = opx; S.burn[m] = burn; S.cash[m] = Math.max(c, 0); }
}
var months = out === null ? null : out - start;
return {
S: S, cash: S.cash, out: out, be: be, months: months,
runway: months === null ? "5+ years" : months + " months",
outLabel: out === null ? "no date in sight" : monthLabel(out),
avg6: sum6 / 6, firstBurn: Math.round(firstBurn),
hireFrom: hireStart === 7 ? "January" : "next month"
};
}

var cur = sim(t0, hires, growth);
var baseNow = sim(t0, 0, 2);
var base = sim(5, 0, 2);
var hire5 = sim(5, 5, 2);

function X(i) { return 15 + 30 * i; }
function Y(v) { return Math.round((20 + (4500 - v) / 4500 * 220) * 10) / 10; }
function pathOf(vals, from, to) {
var o = "";
for (var i = from; i <= to; i++) { o += (i === from ? "M" : " L") + X(i) + " " + Y(vals[i]); }
return o;
}
var endIdx = cur.out !== null && cur.out <= 23 ? cur.out : 23;
var baseEnd = baseNow.out !== null && baseNow.out <= 23 ? baseNow.out : 23;
var same = hires === 0 && growth === 2;
var todayX = X(t0);
var hitZero = cur.out !== null && cur.out <= 23;

var narrative = "";
if (same) {
narrative = "This is the base plan: the current team, revenue growing 2% a month. Change a number to test a decision before you make it.";
} else {
if (hires > 0) narrative += "Hiring " + hires + (hires === 1 ? " person" : " people") + " from " + cur.hireFrom + " adds $" + (hires * 17) + "k a month to payroll. ";
if (growth !== 2) narrative += "Revenue grows " + growth + "% a month instead of 2%. ";
if (cur.months === null) narrative += cur.be === null ? "On this plan cash does not run out in the next five years." : "On this plan the company reaches breakeven in " + monthLabel(cur.be) + " with cash to spare.";
else if (baseNow.months === null) narrative += "Cash now runs out in " + cur.outLabel + ".";
else {
var dd = cur.months - baseNow.months;
narrative += dd === 0 ? "Runway is unchanged at " + cur.runway + "." : "Runway goes from " + baseNow.runway + " to " + cur.runway + ".";
}
}

var colIdx = [t0 - 2, t0 - 1, t0, t0 + 1, t0 + 2, t0 + 3];
var justClosed = t0 > 5 ? t0 : -1;
var cols = colIdx.map(function (ci) {
var act = ci <= t0;
return {
label: NAMES[(5 + ci) % 12],
tag: act ? "ACTUAL" : "FORECAST",
tagColor: act ? "#2450DC" : "#4B5565",
bg: ci === justClosed ? "var(--hlp)" : "transparent",
bl: ci === t0 + 1 ? "2px solid var(--ink)" : "1px solid transparent"
};
});
function row(label, key, weight) {
var r = { label: label, weight: weight };
colIdx.forEach(function (ci, n) {
var act = ci <= t0;
r["c" + n] = fmt(cur.S[key][ci]);
r["k" + n] = act ? "#2450DC" : "var(--ink)";
r["b" + n] = ci === justClosed ? "var(--hlp)" : "transparent";
r["l" + n] = ci === t0 + 1 ? "2px solid var(--ink)" : "1px solid transparent";
});
return r;
}
var rows = [row("Revenue", "rev", 400), row("Payroll", "pay", 400), row("Hosting and other costs", "opx", 400), row("Net burn", "burn", 700), row("Ending cash", "cash", 700)];

var closeNote = "";
if (t0 === 5) {
closeNote = "November is closed. December to February are forecast from the plan. Close the next month to see actuals replace them.";
} else {
var prev = sim(t0 - 1, 0, growth);
var dv = Math.round(T.rev[t0] - prev.S.rev[t0]);
var db = Math.round((T.pay[t0] + T.opx[t0] - T.rev[t0]) - prev.S.burn[t0]);
closeNote = LONG[(5 + t0) % 12] + " closed. Revenue came in $" + Math.abs(dv) + "k " + (dv >= 0 ? "above" : "below") + " forecast and burn was $" + Math.abs(db) + "k " + (db <= 0 ? "lower" : "higher") + " than planned. The forecast has re-based from the new actuals: runway is now " + cur.runway + ".";
}
var canClose = t0 < 8;

var queueDefs = [
{ id: "host", title: "Orbit Cloud, hosting invoice", amount: "$4,812.40", detail: "Collected from the billing inbox and matched to the card ending 2204.", entry: "Proposed: Dr 5100 Hosting / Cr 2100 Card payable" },
{ id: "tools", title: "Lumen design tools, annual receipt", amount: "$540.00", detail: "Matched to the card ending 2204. Spread over 12 months as a prepaid.", entry: "Proposed: Dr 1400 Prepaid expenses / Cr 2100 Card payable" },
{ id: "payout", title: "Payment processor payout", amount: "$38,204.11", detail: "Reconciled to 212 customer charges. Fees of $1,146.12 split out.", entry: "Proposed: Dr 1010 Bank, Dr 6400 Fees / Cr 1200 Receivables" },
{ id: "wire", title: "Incoming wire, sender not recognized", amount: "$12,000.00", detail: "No matching invoice or contract found. The agent has asked your ops lead in Slack.", entry: "Held in 2900 Suspense until documented", exception: true }
];
var pending = 0, doneCount = 0;
var queue = queueDefs.map(function (dq) {
var done = !!approved[dq.id];
var ex = !!dq.exception;
if (done) doneCount++;
if (!done && !ex) pending++;
return {
title: dq.title, amount: dq.amount, detail: dq.detail, entry: dq.entry,
canApprove: !done && !ex, done: done, exception: ex,
bg: done ? "#EEF3FE" : "#FFFFFF",
approve: function () {
var next = Object.assign({}, approved);
next[dq.id] = true;
self.setState({ approved: next });
}
};
});
var queueStatus = pending === 0 ? "All approved. 1 waiting on a document" : pending + " waiting for your approval";
var closePct = (86 + doneCount * 4) + "%";
var auditLine = doneCount === 0 ? "Try it: approve an item. Every approval is recorded with who, when and the source document." : "Audit trail: " + doneCount + (doneCount === 1 ? " entry" : " entries") + " approved by you just now, posted to the ledger with the source attached.";

var tabDefs = [["pnl", "Income statement"], ["stmt", "Balance sheet"], ["close", "Month-end close"], ["bank", "Bank reconciliation"], ["ledger", "Journal entries"]];
var tabs = tabDefs.map(function (td) {
var on = td[0] === tab;
return { label: td[1], pressed: on ? "true" : "false", bg: on ? "#FFFFFF" : "transparent", fg: on ? "#2450DC" : "var(--ink)", ul: on ? "#2450DC" : "transparent", pick: function () { self.setState({ tab: td[0] }); } };
});
var entries = [
{ je: "JE-1182", date: "Nov 03", desc: "Orbit Cloud, hosting", src: "Invoice 2291, matched to card", a1: "5100 Hosting", d1: "4,812.40", c1: "", a2: "2100 Card payable", d2: "", c2: "4,812.40", has3: false, a3: "", d3: "", c3: "" },
{ je: "JE-1183", date: "Nov 03", desc: "Lumen design tools, annual", src: "Receipt, spread over 12 months", a1: "1400 Prepaid expenses", d1: "540.00", c1: "", a2: "2100 Card payable", d2: "", c2: "540.00", has3: false, a3: "", d3: "", c3: "" },
{ je: "JE-1184", date: "Nov 04", desc: "Payment processor payout", src: "Reconciled to 212 charges", a1: "1010 Operating bank", d1: "38,204.11", c1: "", a2: "6400 Payment fees", d2: "1,146.12", c2: "", has3: true, a3: "1200 Accounts receivable", d3: "", c3: "39,350.23" }
];
var jeTotals = ["4,812.40", "540.00", "39,350.23"];
entries.forEach(function (e, ei) {
e.total = jeTotals[ei]; e.dateUp = e.date.toUpperCase();
[1, 2, 3].forEach(function (n) {
var dr = !!e["d" + n];
e["t" + n] = dr ? "DR" : "CR"; e["b" + n] = dr ? "var(--hl)" : "var(--ink)"; e["f" + n] = dr ? "var(--ink)" : "#FFFFFF";
e["i" + n] = dr ? "12px" : "30px"; e["m" + n] = e["d" + n] || e["c" + n]; e["bt" + n] = n === 1 ? "0" : "1px solid #E3E7EE";
});
});
var TINTC = "#F6F8FC";
function pl(label, nov, oct, pct, kind, note) {
var r = { label: label, nov: nov, oct: oct, weight: 500, nw: 700, bg: "transparent", bt: "1px solid #E3E7EE", fg: "var(--ink)", mut: "#4B5565", pad: "12px", size: "16px",
hasBar: pct != null, w: (pct == null ? 0 : Math.min(pct, 100)) + "%", pct: pct == null ? "" : pct.toFixed(1) + "% of revenue", bar: "var(--ink)", hasNote: !!note, note: note || "", share: ({ "Revenue": "100%", "Cost of revenue": "25.1%", "Gross profit": "74.9%", "R&D": "68.1%", "Sales and marketing": "42.4%", "G&A": "29.9%", "EBITDA": "(65.4%)", "D&A": "1.2%", "Operating result": "(66.6%)", "Interest income": "2.7%", "Income tax": "0.3%", "Net income": "(64.2%)" })[label] || "" };
if (kind === "rev") { r.weight = 800; r.nw = 800; r.bar = "#2450DC"; r.bt = "1px solid transparent"; r.pct = "100%"; }
if (kind === "sub") { r.weight = 800; r.nw = 800; r.bg = TINTC; r.bt = "1.5px solid var(--ink)"; r.size = "17px"; }
if (kind === "total") { r.weight = 800; r.nw = 800; r.bg = "var(--ink)"; r.fg = "#FFFFFF"; r.mut = "#C7D2E6"; r.bt = "1px solid var(--ink)"; r.pad = "16px"; r.size = "18px"; }
return r;
}
var pnl = [
pl("Revenue", "335", "322", 100, "rev"),
pl("Cost of revenue", "(84)", "(70)", 25.1),
pl("Gross profit", "251", "252", null, "sub", "Margin 74.9%, down from 78.4%"),
pl("R&D", "(228)", "(224)", 68.1),
pl("Sales and marketing", "(142)", "(139)", 42.4),
pl("G&A", "(100)", "(98)", 29.9),
pl("EBITDA", "(219)", "(209)", null, "sub", "Margin (65.4%)"),
pl("D&A", "(4)", "(4)", 1.2),
pl("Operating result", "(223)", "(213)", null, "sub"),
pl("Interest income", "9", "9", 2.7),
pl("Income tax", "(1)", "(1)", 0.3),
pl("Net income", "(215)", "(205)", null, "total", "Ties to November net burn in the plan")
];
var kpis = [
{ label: "Revenue", val: "$335k", delta: "+4.0% on Oct", color: "#2450DC" },
{ label: "Margin", val: "74.9%", delta: "-3.5 pts", color: "#8A5A00" },
{ label: "Net income", val: "($215k)", delta: "Oct ($205k)", color: "#4B5565" }
];
var HATCH = "repeating-linear-gradient(135deg, var(--ink) 0 2px, #FFFFFF 2px 5px)";
var wfDefs = [["Rev", 0, 335, "335", "#2450DC", "#2450DC"], ["Cost", 251, 335, "(84)", HATCH, "var(--ink)"], ["GP", 0, 251, "251", "var(--hl)", "var(--ink)"], ["R&D", 23, 251, "(228)", HATCH, "var(--ink)"], ["S&M", -119, 23, "(142)", HATCH, "var(--ink)"], ["G&A", -219, -119, "(100)", HATCH, "var(--ink)"], ["EBITDA", -219, 0, "(219)", "var(--ink)", "var(--ink)"]];
var wf = wfDefs.map(function (d, i) {
var top = 156 - d[2] * 0.4, h = (d[2] - d[1]) * 0.4;
return { lab: d[0], val: d[3], bg: d[4], bd: d[5], left: "calc(" + (i * 14.2857).toFixed(3) + "% + 4px)", width: "calc(14.2857% - 8px)", top: top.toFixed(1) + "px", h: h.toFixed(1) + "px", vtop: (d[2] > 0 ? top - 17 : top + h + 3).toFixed(1) + "px", delay: (0.1 + i * 0.09).toFixed(2) + "s" };
});
var sig = !!st.sig;
var recOn = !!st.rec;
var bankRows = [
{ date: "Nov 04", desc: "Processor payout", amt: "38,204.11", status: "Matched to JE-1184", color: "#2450DC" },
{ date: "Nov 03", desc: "Card payment, Orbit Cloud", amt: "-4,812.40", status: "Matched to JE-1182", color: "#2450DC" },
{ date: "Nov 03", desc: "Card payment, Lumen", amt: "-540.00", status: "Matched to JE-1183", color: "#2450DC" },
{ date: "Nov 02", desc: "Payroll run", amt: "-186,400.00", status: "Matched to payroll journal", color: "#2450DC" }
];
var stepDefs = [
["Bank and card accounts reconciled", 2], ["Payables and receivables tied to the ledger", 2], ["Accruals and prepaids posted", 2],
["Revenue schedules run", 2], ["Intercompany balances eliminated", 2], ["Review exceptions", doneCount >= 3 ? 2 : 1], ["Lock the period", 0]
];
var closeSteps = stepDefs.map(function (sd) {
var s = sd[1];
return { label: sd[0], status: s === 2 ? "Done" : s === 1 ? (pending + " for you") : "Waiting", color: s === 2 ? "#2450DC" : s === 1 ? "#8A5A00" : "#4B5565", fill: s === 2 ? "#2450DC" : s === 1 ? "var(--hl)" : "#FFFFFF" };
});

var people = this.people();
var pv = people[0];
var personas = people.map(function (pp, pi) {
var on = pp.id === who;
if (on) pv = pp;
return { label: pp.label, short: pp.short, kick: "0" + (pi + 1), role: pp.role, pressed: on ? "true" : "false", bg: on ? "var(--ink)" : "#FFFFFF", fg: on ? "#FFFFFF" : "var(--ink)", sub: on ? "var(--hl)" : "#2450DC", pick: function () { self.setState({ who: pp.id, faq: 0 }); } };
});
var pairs = pv.pains.map(function (pn, i) { return { n: "0" + (i + 1), pain: pn, gain: pv.gains[i] }; });
var faqSel = st.faq == null ? 0 : st.faq;
var faqs = pv.qa.map(function (f, i) {
var on = i === faqSel;
return { q: f.q, a: f.a, isOpen: on, open: on ? "true" : "false", sign: on ? "\u2212" : "+", signBg: on ? "var(--hl)" : "transparent", signFg: on ? "var(--ink)" : "#FFFFFF", signBd: on ? "var(--hl)" : "#5B6B86", pick: function () { self.setState({ faq: on ? -1 : i }); } };
});
var modDefs = [
["CORE", "General ledger", "General ledger", "Double-entry and accrual-based, with your own chart of accounts and journal entries you can open and trace.", "Post each entry with its source document attached.", "Set the chart of accounts, and post a manual journal whenever you want."],
["CASH", "Bank reconciliation", "Bank and card reconciliation", "Transactions matched to documents and reconciled continuously, not in a month-end scramble.", "Match each bank and card line to its document as it arrives.", "Confirm the few matches they are unsure of."],
["MONEY OUT", "Bills and expenses", "Bills and expenses", "Invoices and receipts collected from inboxes, read, coded and queued for approval.", "Collect, read and code every bill and receipt.", "Approve what your policy sends to you."],
["MONEY IN", "Invoicing", "Invoicing and receivables", "Customer invoices prepared from signed contracts, with payouts reconciled to the charges behind them. Invoices go out as structured data, so your customer's system can read them without retyping.", "Draft invoices from signed contracts and match payments to them.", "Approve invoices before they go out."],
["TIMING", "Accruals and schedules", "Accruals, prepaids and schedules", "Costs and revenue recognized in the right period, with the schedule kept behind each balance.", "Build the schedule and post each month's entry.", "Review the schedule when it is created."],
["CLOSE", "Month-end close", "Month-end close", "A checklist that prepares itself through the month.", "Work through the checklist as the month runs.", "Review the exceptions, then lock the period."],
["REPORTING", "Statements", "Financial statements", "Income statement, balance sheet and cash flow that are current today, with drill-down to every entry.", "Keep all three statements current every day.", "Open any number down to the entries behind it."],
["GROUP", "Entities and currencies", "Entities and currencies", "Several entities and currencies consolidated into one view, with intercompany eliminated.", "Consolidate entities and eliminate intercompany balances.", "Review the consolidated view."]
];
var modSel = st.mod || 0;
var mods = modDefs.map(function (md, i) {
var on = i === modSel;
return { n: "0" + (i + 1), short: md[1], pressed: on ? "true" : "false", bg: on ? "var(--ink)" : "transparent", fg: on ? "#FFFFFF" : "var(--ink)", nc: on ? "var(--hl)" : "#2450DC", pick: function () { self.setState({ mod: i }); } };
});
var mdv = modDefs[modSel];
var mv = { tag: mdv[0], name: mdv[2], desc: mdv[3], agent: mdv[4], you: mdv[5] };

var ACCC = "#2450DC", GREYC = "#B9C3D3";
var cmp = [
{ n: "01", name: "Traditional accounting software", eg: "Such as Xero and QuickBooks", bw: "100%", bc: GREYC, pw: "18%", pc: GREYC, books: "Mostly manual", plan: "Basic budgets", sees: "Transactions" },
{ n: "02", name: "ERPs", eg: "Such as NetSuite and Odoo", bw: "100%", bc: GREYC, pw: "30%", pc: GREYC, books: "Mostly manual", plan: "Separate module", sees: "Transactions" },
{ n: "03", name: "Planning tools", eg: "Such as Pigment and Abacum", bw: "0%", bc: ACCC, pw: "100%", pc: ACCC, books: "None, imports them", plan: "Yes", sees: "Imported data" },
{ n: "04", name: "AI accounting", eg: "Such as Rillet and Digits", bw: "100%", bc: ACCC, pw: "25%", pc: ACCC, books: "Automated", plan: "Limited", sees: "Transactions, documents" }
];
var qDefs = this.qs(base, hire5);
var ans = qDefs[qSel];
var typed = st.typed == null ? ans.body.length : st.typed;
var questions = qDefs.map(function (dq, qi) {
var on = qi === qSel;
return {
text: dq.text,
pressed: on ? "true" : "false",
bg: on ? "var(--ink)" : "#FFFFFF",
fg: on ? "#FFFFFF" : "var(--ink)",
sh: on ? "4px 4px 0 #2450DC" : "0 0 0 #2450DC",
pick: function () {
if (self._tw) clearInterval(self._tw);
var len = dq.body.length;
self.setState({ q: qi, typed: 0 });
self._tw = setInterval(function () {
var n = ((self.state && self.state.typed) || 0) + 3;
if (n >= len) { n = len; clearInterval(self._tw); self._tw = null; }
self.setState({ typed: n });
}, 16);
}
};
});

var mSel = st.m == null ? 5 : st.m;
var rail = [];
for (var ri = 0; ri < 12; ri++) {
(function (i) {
var act = i <= 5, on = i === mSel;
rail.push({
lab: NAMES[(5 + i) % 12], pressed: on ? "true" : "false",
aria: LONG[(5 + i) % 12] + " " + (2026 + Math.floor((5 + i) / 12)) + (act ? ", actual" : ", forecast"),
h: Math.round(base.S.cash[i] / 4500 * 98) + "px",
bd: act ? (i === 5 ? "var(--pop)" : "#FFFFFF") : "#FFFFFF", glow: i === 5 ? "0 0 28px color-mix(in srgb, var(--pop) 70%, transparent)" : "none",
fill: act ? (i === 5 ? "var(--pop)" : "#FFFFFF") : "repeating-linear-gradient(135deg, #FFFFFF 0 1.5px, transparent 1.5px 5px)",
bg: on ? "rgba(255,255,255,0.14)" : "transparent", ul: on ? "var(--pop)" : "transparent",
lw: on ? 800 : 500, lc: on ? "#FFFFFF" : "#C7D2E6",
delay: (0.3 + i * 0.05).toFixed(2) + "s",
pick: function () { self.setState({ m: i }); }
});
})(ri);
}
var mAct = mSel <= 5;
var mTitle = LONG[(5 + mSel) % 12] + " " + (2026 + Math.floor((5 + mSel) / 12));
var mTag = mSel < 5 ? "Closed" : mSel === 5 ? "Open, books current" : "Forecast";
var mNote = mSel < 5 ? "Closed and locked. Every entry is traced to its source document and approval."
: mSel === 5 ? "This month so far. Agents post as transactions arrive, and you approve the exceptions."
: "Projected from the same ledger on the base plan. It updates itself each time a month closes.";

return {
brand: brand,
rail: rail, mTitle: mTitle, mTag: mTag, mNote: mNote,
mBg: mAct ? "rgba(255,255,255,0.05)" : "rgba(36,80,220,0.35)", mTagBg: mAct ? "#FFFFFF" : "var(--hl)", mTagFg: "var(--ink)",
mRev: "$" + fmt(base.S.rev[mSel]) + "k", mBurn: "$" + fmt(base.S.burn[mSel]) + "k", mCash: "$" + (base.S.cash[mSel] / 1000).toFixed(2) + "M",
cmp: cmp,
tabs: tabs,
tabPnl: tab === "pnl", tabLedger: tab === "ledger", tabBank: tab === "bank", tabClose: tab === "close", tabStmt: tab === "stmt",
pnl: pnl, kpis: kpis, wf: wf,
sigOff: sig ? 0 : 420, sigLine: sig ? "Signed today by Harbor Labs" : "Waiting for a signature",
sigBtn: sig ? "Replay" : "Sign the contract", sigBtnBg: sig ? "#FFFFFF" : "#2450DC", sigBtnFg: sig ? "var(--ink)" : "#FFFFFF",
sigHead: sig ? "DONE BY AGENTS, SECONDS LATER" : "WHAT HAPPENS WHEN IT IS SIGNED",
sigBs: sig ? "solid" : "dashed", sigBd: sig ? "var(--hl)" : "rgba(255,255,255,0.3)", sigCardBg: sig ? "rgba(255,255,255,0.09)" : "transparent",
sigOp: sig ? 1 : 0.4, sigTf: sig ? "none" : "translateY(10px) scale(0.98)",
sigBarH: sig ? "46px" : "20px", sigBarH2: sig ? "50px" : "24px", sigBarBg: sig ? "var(--hl)" : "rgba(255,255,255,0.35)",
sigToggle: function () { self.setState({ sig: !sig }); },
recOn: recOn, recLedger: recOn ? "3,060,412.18" : "3,048,412.18",
recDiff: recOn ? "0.00" : "12,000.00", recDiffLabel: recOn ? "Difference. Account reconciled." : "Difference. 1 match waiting for you.",
recDiffBg: recOn ? "var(--hlp)" : "#FFFFFF", recDiffFg: recOn ? "#2450DC" : "#8A5A00",
recHead: recOn ? "Reconciled" : "Suggested match", recHeadFg: recOn ? "#2450DC" : "var(--ink)",
recBg: recOn ? "var(--hlp)" : "#FFFFFF", recShadow: recOn ? "6px 6px 0 #2450DC" : "0 0 0 #2450DC",
recMidH: recOn ? "0px" : "104px", recMidOp: recOn ? 0 : 1, recMidVis: recOn ? "hidden" : "visible", recMt: recOn ? "-1px" : "0",
recAnim1: recOn ? "pop .5s .45s both" : "nd1 2.2s ease-in-out infinite", recAnim2: recOn ? "pop .5s .45s both" : "nd2 2.2s ease-in-out infinite",
recCount: recOn ? "214" : "213", recBarW: recOn ? "100%" : "99.5%",
recConfirm: function () { self.setState({ rec: true }); }, recUndo: function () { self.setState({ rec: false }); },
entries: entries, bankRows: bankRows, closeSteps: closeSteps,
personas: personas, pv: pv, pairs: pairs, faqs: faqs, mods: mods, mv: mv,
hiresLabel: hires === 0 ? "0" : "+" + hires,
growthLabel: growth + "%",
todayLabel: monthLabel(t0),
hiresDown: function () { self.setState({ hires: Math.max(0, hires - 1) }); },
hiresUp: function () { self.setState({ hires: Math.min(10, hires + 1) }); },
growthDown: function () { self.setState({ growth: Math.max(0, growth - 0.5) }); },
growthUp: function () { self.setState({ growth: Math.min(6, growth + 0.5) }); },
closeNext: function () { if (t0 < 8) self.setState({ t0: t0 + 1 }); },
closeDisabled: !canClose,
closeBg: canClose ? "#2450DC" : "#5B6B86",
closeLabel: canClose ? "Close " + LONG[(5 + t0 + 1) % 12] : "All sample months closed",
reset: function () { self.setState({ hires: 0, growth: 2, t0: 5 }); },
runway: cur.runway,
runwayColor: cur.months !== null && cur.months < 12 ? "#B42318" : "var(--ink)",
cashOutLine: cur.out === null ? "Cash does not run out" : "Cash lasts to " + monthLabel(cur.out),
narrative: narrative,
closeNote: closeNote,
cols: cols,
rows: rows,
actualPath: pathOf(cur.cash, 0, t0),
forecastPath: pathOf(cur.cash, t0, endIdx),
ghost: pathOf(baseNow.cash, t0, baseEnd),
ghostOpacity: same ? "0" : "0.9",
todayX: todayX,
shadeW: 720 - todayX,
todayPct: (Math.round(todayX / 720 * 1000) / 10) + "%",
lastActualBoxX: X(t0) - 5.5,
lastActualBoxY: Y(cur.cash[t0]) - 5.5,
endBoxX: X(endIdx) - 5.5,
endBoxY: Y(cur.cash[endIdx]) - 5.5,
endFill: hitZero ? "#B42318" : "var(--hl)",
chartLabel: "Cash forecast. Books are closed through " + monthLabel(t0) + ". Runway is " + cur.runway + ".",
queue: queue,
queueStatus: queueStatus,
closePct: closePct,
auditLine: auditLine,
questions: questions,
askedText: ans.text,
answerTitle: ans.title,
answerTyped: ans.body.slice(0, typed),
caretOpacity: typed >= ans.body.length ? "0" : "1",
answerSource: ans.src
};
}
}
/* Keeps a range slider alive while a widget re-renders around it, so dragging is smooth. */
(function () {
  if (typeof Element === "undefined") return;
  var d = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!d || !d.set) return;
  function attrs(o, n) { [].slice.call(o.attributes).forEach(function (a) { if (!n.hasAttribute(a.name)) o.removeAttribute(a.name); }); [].slice.call(n.attributes).forEach(function (a) { if (a.name !== "value" && o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value); }); }
  function sync(o, n, path) {
    if (!path.length) { attrs(o, n); return true; }
    var i = path[0], oc = o.childNodes[i], nc = n.childNodes[i];
    if (!oc || !nc || oc.nodeType !== 1 || nc.nodeType !== 1 || oc.nodeName !== nc.nodeName) return false;
    if (!sync(oc, nc, path.slice(1))) return false;
    if (path.length > 1) attrs(oc, nc);
    while (o.firstChild !== oc) o.removeChild(o.firstChild);
    while (o.lastChild !== oc) o.removeChild(o.lastChild);
    var before = [], after = [], seen = false;
    [].slice.call(n.childNodes).forEach(function (c) { if (c === nc) seen = true; else (seen ? after : before).push(c); });
    before.forEach(function (c) { o.insertBefore(c, oc); }); after.forEach(function (c) { o.appendChild(c); });
    return true;
  }
  Object.defineProperty(Element.prototype, "innerHTML", { configurable: true, enumerable: d.enumerable, get: d.get, set: function (html) {
    var a = document.activeElement;
    if (a && a !== this && a.nodeName === "INPUT" && a.type === "range" && this.contains(a)) {
      var path = [], x = a; while (x !== this) { path.unshift([].indexOf.call(x.parentNode.childNodes, x)); x = x.parentNode; }
      var t = document.createElement(this.nodeName === "TBODY" ? "tbody" : "div"); d.set.call(t, html);
      var probe = t, ok = true; path.forEach(function (i) { probe = probe && probe.childNodes[i]; if (!probe) ok = false; });
      if (ok && probe.nodeName === "INPUT" && probe.type === "range") {
        if (!a.__keep) { a.__keep = true; var add = a.addEventListener; a.addEventListener = function (type) { if (type === "input") return; return add.apply(a, arguments); }; a.focus = function () {}; }
        if (sync(this, t, path)) return;
      }
    }
    d.set.call(this, html);
  } });
})();

/* Self-contained interactive demos. Each mounts into an element marked data-widget="name". All figures are illustrative. */
(function () {
  var MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var ML = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function mon(i) { return MN[(5 + i) % 12]; }
  function monL(i) { return ML[(5 + i) % 12] + " " + (2026 + Math.floor((5 + i) / 12)); }
  var REV = [275, 286, 298, 310, 322, 335], PAY = [352, 358, 362, 365, 368, 372], OPX = [150, 155, 160, 165, 159, 178], CASH = [], c0 = 4378;
  for (var z = 0; z < 6; z++) { c0 -= PAY[z] + OPX[z] - REV[z]; CASH.push(c0); }
  var ROLES = [["eng", "Engineering", 17, 0], ["sales", "Sales", 14, 20], ["cs", "Customer success", 9, 0], ["ops", "Operations", 10, 0]];
  function sim(team, n) {
    var S = { rev: REV.slice(), burn: [], cash: CASH.slice() }, i;
    for (i = 0; i < 6; i++) S.burn[i] = PAY[i] + OPX[i] - REV[i];
    var cash = CASH[5], rev = REV[5], opx = OPX[5], out = null, cost = 0, lift = 0;
    ROLES.forEach(function (r) { cost += (team[r[0]] || 0) * r[2]; lift += (team[r[0]] || 0) * r[3]; });
    for (var m = 6; m < 6 + 96; m++) {
      rev *= 1.02; opx *= 1.01;
      var b = 372 + (m >= 7 ? cost : 0) + opx - rev - (m >= 10 ? lift : 0);
      cash -= b; if (out === null && cash <= 0) out = m;
      if (m < n) { S.rev[m] = rev + (m >= 10 ? lift : 0); S.burn[m] = b; S.cash[m] = Math.max(cash, 0); }
    }
    S.out = out; S.cost = cost; S.lift = lift; return S;
  }
  function k(v) { return "$" + Math.round(v).toLocaleString("en-US") + "k"; }
  function bars(el, vals, max, style, ghost) {
    if (el.children.length !== vals.length) { el.innerHTML = ""; vals.forEach(function () { var d = document.createElement("div"); d.className = "w-bar"; d.innerHTML = "<u></u><i></i>"; el.appendChild(d); }); }
    vals.forEach(function (v, i) {
      var d = el.children[i], s = style(i); d.style.background = s.col || "transparent";
      var b = d.lastChild; b.style.height = Math.max(v / max * 100, 0) + "%"; b.style.background = s.bg; b.style.border = "1px solid " + s.bd;
      var g = d.firstChild; if (ghost && ghost[i] != null) { g.style.display = "block"; g.style.height = ghost[i] / max * 100 + "%"; } else g.style.display = "none";
    });
  }
  var HATCH = "repeating-linear-gradient(135deg,#5B8CFF 0 1.5px,transparent 1.5px 5px)";
  var W = window.CAWidgets = {};

  W.time = function (el, white) {
    var FH = white ? "repeating-linear-gradient(135deg,#fff 0 1.5px,transparent 1.5px 5px)" : HATCH, FB = white ? "#fff" : "#5B8CFF";
    el.innerHTML = '<div class="w-ph"><span>DRAG ACROSS THE CHART, OR USE THE SLIDER</span><span>CASH BY MONTH</span></div><div class="w-pb"><div class="w-bars" data-r="b"></div><div class="w-xl" data-r="x"></div><input type="range" min="0" max="11" value="5" aria-label="Month" data-r="r"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b data-r="t" class="w-t"></b><span class="w-tag" data-r="g"></span></div><div class="w-k"><div><small>REVENUE</small><b data-r="a"></b></div><div><small>NET BURN</small><b data-r="bn"></b></div><div><small>CASH</small><b data-r="c"></b></div></div><p data-r="n" class="w-note"></p></div>';
    var q = function (n) { return el.querySelector('[data-r="' + n + '"]'); }, S = sim({}, 12), sel = 5;
    q("x").innerHTML = S.cash.map(function (_, i) { return "<span>" + mon(i) + "</span>"; }).join("");
    function draw() {
      bars(q("b"), S.cash, 4500, function (i) { return { bg: i < 5 ? "#fff" : i === 5 ? "var(--pop)" : FH, bd: i < 5 ? "#fff" : i === 5 ? "var(--pop)" : FB, col: i === sel ? "rgba(255,255,255,.16)" : "" }; });
      q("r").value = sel; q("t").textContent = monL(sel);
      q("g").textContent = sel < 5 ? "CLOSED" : sel === 5 ? "OPEN, BOOKS CURRENT" : "FORECAST"; q("g").style.background = sel > 5 && !white ? "#5B8CFF" : "#fff";
      q("a").textContent = k(S.rev[sel]); q("bn").textContent = k(S.burn[sel]); q("c").textContent = "$" + (S.cash[sel] / 1000).toFixed(2) + "M";
      q("n").textContent = sel < 5 ? "Closed and locked. Every entry is traced to its source document." : sel === 5 ? "This month so far. Agents post as transactions arrive." : "Projected from the same ledger. It updates each time a month closes.";
    }
    q("r").addEventListener("input", function () { sel = +this.value; draw(); });
    function scrub(e) { var r = q("b").getBoundingClientRect(); sel = Math.max(0, Math.min(11, Math.floor((e.clientX - r.left) / r.width * 12))); draw(); }
    var down = false;
    q("b").addEventListener("pointerdown", function (e) { down = true; scrub(e); });
    q("b").addEventListener("pointermove", function (e) { if (down || e.pointerType === "mouse") scrub(e); });
    window.addEventListener("pointerup", function () { down = false; });
    draw();
  };

  W.headcount = function (el) {
    var N = 20, base = sim({}, N), team = { eng: 0, sales: 0, cs: 0, ops: 0 };
    el.innerHTML = '<div class="w-ph"><span>WHO WILL YOU HIRE IN JANUARY?</span><span>SAMPLE COSTS, FULLY LOADED</span></div><div class="w-pb"><div data-r="roles" class="w-roles"></div><div class="w-k"><div><small>PAYROLL ADDED</small><b data-r="cost"></b></div><div><small>REVENUE ADDED</small><b data-r="lift"></b></div></div><div><div class="w-lab">RUNWAY</div><div class="w-big" data-r="rw"></div><div data-r="rwb" class="w-note"></div></div><div class="w-bars" data-r="b" style="height:140px"></div><div class="w-xl" data-r="x"></div><div class="w-leg"><span><i style="background:#fff"></i>Actual</span><span><i style="background:#5B8CFF"></i>Forecast</span><span><i style="border:1px dashed #fff;box-sizing:border-box"></i>Plan before the change</span></div><p class="w-note">Sales hires add revenue after a three-month ramp. Other roles add cost only. Change the assumptions in the product.</p></div>';
    var q = function (n) { return el.querySelector('[data-r="' + n + '"]'); };
    q("x").innerHTML = base.cash.map(function (_, i) { return "<span>" + (i % 3 === 0 ? mon(i) : "") + "</span>"; }).join("");
    ROLES.forEach(function (r) {
      var row = document.createElement("div"); row.className = "w-role";
      row.innerHTML = '<div class="w-rl"><b></b><span></span></div><div class="w-step"><button type="button" aria-label="One fewer">&minus;</button><output>0</output><button type="button" aria-label="One more">+</button></div>';
      row.querySelector("b").textContent = r[1];
      row.querySelector("span").textContent = "$" + r[2] + "k a month each" + (r[3] ? ", adds $" + r[3] + "k revenue" : "");
      var out = row.querySelector("output"), bs = row.querySelectorAll("button");
      bs[0].setAttribute("aria-label", "One fewer in " + r[1]); bs[1].setAttribute("aria-label", "One more in " + r[1]);
      function set(d) { team[r[0]] = Math.max(0, Math.min(10, team[r[0]] + d)); out.textContent = team[r[0]]; draw(); }
      bs[0].addEventListener("click", function () { set(-1); }); bs[1].addEventListener("click", function () { set(1); });
      q("roles").appendChild(row);
    });
    function draw() {
      var S = sim(team, N), any = S.cost > 0;
      bars(q("b"), S.cash, 4500, function (i) { return { bg: i < 6 ? "#fff" : "#5B8CFF", bd: i < 6 ? "#fff" : "#5B8CFF" }; }, any ? base.cash.map(function (v, i) { return i < 6 ? null : v; }) : null);
      q("cost").textContent = "$" + S.cost + "k / mo"; q("lift").textContent = "$" + S.lift + "k / mo";
      var m0 = base.out - 5;
      if (S.out === null) { q("rw").textContent = "8+ years"; q("rwb").textContent = "On these assumptions the plan reaches breakeven before cash runs out."; return; }
      var m = S.out - 5, d = m - m0; q("rw").textContent = m + " months";
      q("rwb").textContent = "Cash lasts until " + monL(S.out) + "." + (!any ? " This is the plan as it stands." : d === 0 ? " No change to runway." : d < 0 ? " That is " + (-d) + (d === -1 ? " month" : " months") + " sooner." : " That is " + d + (d === 1 ? " month" : " months") + " longer, because sales pays back.");
    }
    draw();
  };

  W.runway = function (el) {
    el.innerHTML = '<div class="w-ph"><span>YOUR NUMBERS</span><span>NOTHING IS SAVED</span></div><div class="w-pb"><div class="w-row"><span>Cash in the bank</span><b data-r="oa"></b></div><input type="range" data-r="a" min="0.2" max="10" step="0.1" value="3" aria-label="Cash in the bank, millions of dollars"><div class="w-row"><span>Net burn a month</span><b data-r="ob"></b></div><input type="range" data-r="b" min="20" max="600" step="5" value="215" aria-label="Net burn a month, thousands of dollars"><div class="w-row"><span>Burn shrinks each month by</span><b data-r="oc"></b></div><input type="range" data-r="c" min="0" max="8" step="0.5" value="1" aria-label="Monthly reduction in burn, percent"><div><div class="w-lab">YOUR RUNWAY</div><div class="w-big" data-r="rw"></div><div data-r="rwb" class="w-note"></div></div><div class="w-bars" data-r="bars" style="height:110px"></div></div>';
    var q = function (n) { return el.querySelector('[data-r="' + n + '"]'); };
    function draw() {
      var cash = +q("a").value * 1000, burn = +q("b").value, sh = +q("c").value / 100;
      q("oa").textContent = "$" + (+q("a").value).toFixed(1) + "M"; q("ob").textContent = "$" + burn + "k"; q("oc").textContent = (sh * 100).toFixed(1) + "%";
      var vals = [], c = cash, b = burn, out = null;
      for (var m = 1; m <= 120; m++) { c -= b; b *= 1 - sh; if (out === null && c <= 0) out = m; if (m <= 24) vals.push(Math.max(c, 0)); }
      if (out === null) { q("rw").textContent = "10+ years"; q("rwb").textContent = "At this rate burn shrinks faster than cash runs down."; }
      else { var dt = new Date(2026, 10 + out, 1); q("rw").textContent = out + (out === 1 ? " month" : " months"); q("rwb").textContent = "Cash runs out in " + ML[dt.getMonth()] + " " + dt.getFullYear() + "."; }
      bars(q("bars"), vals, cash, function () { return { bg: "#5B8CFF", bd: "#5B8CFF" }; });
    }
    ["a", "b", "c"].forEach(function (n) { q(n).addEventListener("input", draw); }); draw();
  };

  W.ledger = function (el) {
    var ITEMS = [["Card payment, Orbit Cloud", "$4,812.40 to 5100 Hosting", 0], ["Processor payout", "$38,204.11, matched to 212 charges", 0], ["Payroll run", "$186,400.00 to payroll journal", 0], ["Incoming wire, Northwind Ltd", "$12,000.00, matches invoice INV-0147", 1], ["Annual software, Lumen", "$540.00 spread over 12 months", 0]];
    el.innerHTML = '<div class="w-ph"><span>LIVE LEDGER, SAMPLE COMPANY</span><span data-r="s">RUNNING</span></div><div class="w-pb" style="padding-bottom:6px"><div class="w-k"><div><small>POSTED TODAY</small><b data-r="a">0</b></div><div><small>WAITING FOR YOU</small><b data-r="b">0</b></div><div><small>RECONCILED</small><b data-r="c">99.1%</b></div></div></div><div class="w-feed" data-r="f" aria-live="polite"></div><div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.14)"><button type="button" class="w-ghost" data-r="re">Replay</button></div>';
    var q = function (n) { return el.querySelector('[data-r="' + n + '"]'); }, timers = [];
    function later(f, t) { timers.push(setTimeout(f, t)); }
    function run() {
      timers.forEach(clearTimeout); timers = []; q("f").innerHTML = ""; var posted = 0, wait = 0;
      q("a").textContent = 0; q("b").textContent = 0; q("c").textContent = "99.1%"; q("s").textContent = "RUNNING";
      ITEMS.forEach(function (it, n) {
        later(function () {
          var d = document.createElement("div"); d.className = "w-fi w-new"; d.innerHTML = '<div class="w-ft"><b></b><span></span></div><span class="w-st">ARRIVED</span>';
          d.querySelector("b").textContent = it[0]; d.querySelector("span").textContent = it[1];
          q("f").insertBefore(d, q("f").firstChild); d.offsetHeight; later(function () { d.className = "w-fi"; }, 40);
          var st = d.querySelector(".w-st");
          later(function () { st.textContent = "CODING"; }, 700);
          later(function () {
            if (it[2]) {
              wait++; q("b").textContent = wait; var b = document.createElement("button"); b.type = "button"; b.className = "w-btn"; b.textContent = "Approve"; st.replaceWith(b); d.style.background = "color-mix(in srgb, var(--pop) 16%, transparent)";
              b.addEventListener("click", function () { var s = document.createElement("span"); s.className = "w-st w-done"; s.textContent = "POSTED"; b.replaceWith(s); d.style.background = ""; wait--; posted++; q("b").textContent = wait; q("a").textContent = posted; q("c").textContent = "100%"; q("s").textContent = "ALL CAUGHT UP"; });
            } else { st.textContent = "POSTED"; st.className = "w-st w-done"; posted++; q("a").textContent = posted; }
          }, 1500);
        }, n * 1700 + 300);
      });
    }
    q("re").addEventListener("click", run);
    if ("IntersectionObserver" in window) { var seen = false; new IntersectionObserver(function (es) { if (es[0].isIntersecting && !seen) { seen = true; run(); } }, { threshold: 0.3 }).observe(el); } else run();
  };

  W.hero = function (el) {
    var EV = [["Card payment, Orbit Cloud", "$4,812 to 5100 Hosting", 0], ["New contract, Harbor Labs", "$48,000 a year, invoice drafted", 0], ["Annual insurance", "$36,000, spread over 12 months", 0], ["Bank feed, operating account", "214 of 214 lines matched", 0], ["Offer accepted, account executive", "Starts in January, $14k a month", 1]];
    el.innerHTML = '<div class="w-seg" role="group" aria-label="View"><button type="button" data-r="tb">The books</button><button type="button" data-r="tf">The plan</button></div><div class="w-panel w-glass" data-r="books"><div class="w-ph"><span>THE BOOKS, TODAY</span><span data-r="s" aria-live="polite"></span></div><div class="w-prog"><i data-r="p"></i></div><div class="w-feed" data-r="f" style="min-height:335px"></div><div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.14)"><button type="button" class="w-ghost" data-r="re">Replay</button></div></div><div class="w-panel w-glass" data-r="future" style="display:none"></div>';
    var q = function (n) { return el.querySelector('[data-r="' + n + '"]'); }, timers = [], auto = true;
    W.time(q("future"), true);
    function later(f, t) { timers.push(setTimeout(f, t)); }
    function view(v) { q("books").style.display = v ? "none" : "flex"; q("future").style.display = v ? "flex" : "none"; q("tb").setAttribute("aria-pressed", v ? "false" : "true"); q("tf").setAttribute("aria-pressed", v ? "true" : "false"); }
    function run() {
      timers.forEach(clearTimeout); timers = []; q("f").innerHTML = ""; var done = 0; q("s").textContent = "RECONCILING"; q("p").style.width = "0%";
      function posted(node, d) {
        var s = document.createElement("span"); s.className = "w-st w-done"; s.textContent = "POSTED"; node.replaceWith(s); d.style.background = ""; d.classList.remove("w-wait");
        done++; q("p").style.width = done / EV.length * 100 + "%";
        q("s").textContent = done < EV.length ? "RECONCILING " + done + " OF " + EV.length : "ALL RECONCILED";
      }
      EV.forEach(function (e, n) {
        later(function () {
          var d = document.createElement("div"); d.className = "w-fi w-new"; d.innerHTML = '<div class="w-ft"><b></b><span></span></div><span class="w-st">ARRIVED</span>';
          d.querySelector("b").textContent = e[0]; d.querySelector("span").textContent = e[1];
          q("f").insertBefore(d, q("f").firstChild); d.offsetHeight; later(function () { d.className = "w-fi"; }, 40);
          var st = d.querySelector(".w-st");
          later(function () { st.textContent = "CODING"; }, 500);
          later(function () {
            if (!e[2]) { posted(st, d); return; }
            var b = document.createElement("button"); b.type = "button"; b.className = "w-btn w-pulse"; b.textContent = "Approve"; st.replaceWith(b);
            d.classList.add("w-wait"); q("s").textContent = "1 WAITING FOR YOU";
            b.addEventListener("click", function () { posted(b, d); later(function () { view(1); }, 1100); });
            later(function () { if (auto && b.isConnected) view(1); }, 9000);
          }, 1050);
        }, n * 1150 + 500);
      });
    }
    q("tb").addEventListener("click", function () { auto = false; view(0); });
    q("tf").addEventListener("click", function () { auto = false; view(1); });
    q("re").addEventListener("click", function () { auto = true; run(); });
    view(0); run();
  };

  window.CAW = { mount: function (root) {
    var els = root.querySelectorAll("[data-widget]");
    for (var i = 0; i < els.length; i++) { var e = els[i]; if (e.__w) continue; e.__w = true; var f = W[e.getAttribute("data-widget")]; if (f) f(e); }
  } };
})();

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
    var T = { "Income statement": { k: [["REVENUE", "$335k", "+4.0% on October"], ["GROSS MARGIN", "74.9%", "78.4% in October"], ["NET INCOME", "($215k)", "($205k) in October"]], r: [["Revenue", 335, 322, "", "41 contracts and 212 card charges"], ["Cost of revenue", -84, -70, "", "Hosting up 11.2 after a new region went live. 20 entries in 5100 and 5200"], ["Gross profit", 251, 252, "sub"], ["Research and development", -228, -224, "", "11 people and their tools"], ["Sales and marketing", -142, -139, "", "5 people, commissions of 23.4 and advertising"], ["General and administrative", -100, -98, "", "Finance, legal, rent and insurance"], ["EBITDA", -219, -209, "sub"], ["Depreciation", -4, -4, "", "From the fixed asset register"], ["Interest income", 9, 9, "", "On cash held in the treasury account"], ["Income tax", -1, -1, "", "State minimum taxes"], ["Net income", -215, -205, "total"]] },
      "Balance sheet": { k: [["CASH", "$3.06M", "84% of assets"], ["WORKING CAPITAL", "$2.70M", "current ratio 4.1x"], ["EQUITY", "$2.77M", "after the November loss"]], r: [["Cash", 3060, 3275, "", "3 bank accounts, reconciled today"], ["Accounts receivable", 412, 398, "", "9 open invoices, 32 overdue"], ["Prepaid expenses", 86, 92, "", "Insurance and annual software, released monthly"], ["Fixed assets, net", 74, 78, "", "Laptops and office fit-out, after depreciation"], ["Total assets", 3632, 3843, "sub"], ["Accounts payable", -142, -150, "", "17 supplier bills awaiting payment"], ["Card payable", -56, -49, "", "Company cards, settled monthly"], ["Payroll liabilities", -48, -46, "", "Taxes and benefits withheld"], ["Accrued expenses", -73, -70, "", "Costs incurred, bill not yet received"], ["Deferred revenue", -540, -540, "", "Paid in advance, not yet earned"], ["Total liabilities", -859, -855, "sub"], ["Equity", 2773, 2988, "total"]] },
      "Cash flow": { k: [["FROM OPERATIONS", "($215k)", "the month's burn"], ["INVESTED", "$0", "no purchases"], ["CLOSING CASH", "$3.06M", "from $3.28M"]], r: [["Net income", -215, -205, "", "From the income statement"], ["Depreciation, added back", 4, 4, "", "A cost that used no cash"], ["Receivables", -14, -9, "", "Customers owe 14 more than last month"], ["Prepaid expenses", 6, 6, "", "Prepaid costs used up"], ["Payables and accruals", 4, 11, "", "Suppliers and accruals up 4"], ["Cash from operations", -215, -193, "sub"], ["Investing and financing", 0, 0, ""], ["Change in cash", -215, -193, "total"]] } }, k = "Income statement", open = 0;
    function f(v) { return v < 0 ? "(" + Math.abs(v).toLocaleString("en-US") + ")" : v.toLocaleString("en-US"); }
    function draw() {
      var t = T[k];
      el.innerHTML = '<div class="m-filters">' + Object.keys(T).map(function (n) { return '<button type="button" data-k="' + n + '" aria-pressed="' + (n === k) + '">' + n + '</button>'; }).join("") + '</div><div class="a-kp a-k3">' + t.k.map(function (x) { return "<div><small>" + x[0] + "</small><b>" + x[1] + "</b><span>" + x[2] + "</span></div>"; }).join("") + '</div><div class="f-row f-hd"><span>USD thousands</span><b>Nov</b><b>Oct</b><b>Change</b></div>' +
        t.r.map(function (r, i) { var d = r[1] - r[2], can = !!r[4]; return '<' + (can ? 'button type="button" data-i="' + i + '" aria-expanded="' + (open === i) + '"' : "div") + ' class="f-row ' + (r[3] ? "f-" + r[3] : "") + '"><span>' + r[0] + "</span><b>" + f(r[1]) + "</b><b>" + f(r[2]) + '</b><b class="' + (d > 0 ? "sl-up" : d < 0 ? "sl-dn" : "") + '">' + (d > 0 ? "+" : "") + (d === 0 ? "0" : d < 0 ? f(d) : d) + "</b></" + (can ? "button" : "div") + ">" + (can && open === i ? '<div class="m-drill"><div><span>Behind it</span><span>' + r[4] + "</span></div></div>" : ""); }).join("") + '<p class="m-foot">All three statements come from the same entries, so they always agree. Tap a line to see what is behind it.</p>';
    }
    on(el, "[data-k]", function (t) { k = t.getAttribute("data-k"); open = 0; draw(); });
    on(el, "[data-i]", function (t) { var i = +t.getAttribute("data-i"); open = open === i ? -1 : i; draw(); }); draw();
  };
  M[7] = function (el) {
    var step = 0, gbp = 1.27, ST = ["Own books", "Translate", "Eliminate", "One group"], SUB = ["Each company keeps its own books, in its own currency.", "At month end each one is translated into dollars at the closing rate.", "What the companies owe each other is removed, so it is not counted twice.", "One set of group numbers, with every figure traceable back to its company."];
    function draw(keep) {
      var E = [["Sample Co., Inc.", "United States", "USD", 2410, 1, "Lent 120 to the UK company"], ["Sample Co. Ltd", "United Kingdom", "GBP", 310, gbp, "Owes 120 to the US company"], ["Sample Co. GmbH", "Germany", "EUR", 237, 1.08, ""]], tot = E.reduce(function (a, e) { return a + e[3] * e[4]; }, 0), fx = 310 * (gbp - 1.27);
      el.innerHTML = '<div class="e-steps">' + ST.map(function (x, i) { return '<button type="button" data-s="' + i + '" aria-pressed="' + (i === step) + '" class="' + (i < step ? "e-done" : "") + '"><i>' + (i + 1) + "</i><b>" + x + "</b></button>"; }).join("") + '</div><p class="e-sub">' + SUB[step] + '</p><div class="e-cards">' + E.map(function (e) { return '<div class="e-card"><div><b>' + e[0] + "</b><small>" + e[1] + '</small></div><span class="m-chip">' + e[2] + '</span><div class="e-num"><small>CASH, THOUSANDS</small><b>' + e[2] + " " + e[3].toLocaleString("en-US") + "</b>" + (step >= 1 ? "<span>at " + e[4].toFixed(2) + " = <strong>USD " + Math.round(e[3] * e[4]).toLocaleString("en-US") + "</strong></span>" : "<span>&nbsp;</span>") + "</div>" + (e[5] ? '<div class="e-ic' + (step >= 2 ? " e-gone" : "") + '">' + e[5] + (step >= 2 ? " <em>removed</em>" : "") + "</div>" : '<div class="e-ic e-none">No balances with the group</div>') + "</div>"; }).join("") + "</div>" +
        (step >= 1 ? '<div class="m-pane" style="border-top:1px solid #D5DBE5"><div class="m-kv" style="border:0"><span>Try a different pound rate</span><b>1 GBP = ' + gbp.toFixed(2) + ' USD</b></div><input type="range" min="1.15" max="1.40" step="0.01" value="' + gbp + '" aria-label="Pound to dollar rate" data-r="1"></div>' : "") +
        '<div class="e-group' + (step === 3 ? " e-on" : "") + '"><div><small>GROUP CASH</small><b>' + (step >= 1 ? "USD " + Math.round(tot).toLocaleString("en-US") + "k" : "Not added up yet") + "</b></div><div><small>OWED BETWEEN COMPANIES</small><b>" + (step >= 2 ? "0, removed" : "USD 120k, counted twice") + "</b></div><div><small>EXCHANGE RATE EFFECT</small><b>" + (step >= 1 ? (Math.abs(fx) < 0.5 ? "None" : (fx > 0 ? "+" : "-") + "USD " + Math.abs(fx).toFixed(0) + "k") : "None yet") + '</b></div></div><div class="m-acts" style="padding:14px">' + (step < 3 ? '<button type="button" class="m-btn" data-s="' + (step + 1) + '">Next: ' + ST[step + 1].toLowerCase() + " &rarr;</button>" : '<button type="button" class="m-btn m-ghost" data-s="0">Start again</button>') + '</div><p class="m-foot">Agents do the translation and the eliminations each month. Sample exchange rates.</p>';
      var r = el.querySelector("[data-r]"); if (r) { r.addEventListener("input", function () { gbp = +this.value; draw(true); }); if (keep) r.focus(); }
    }
    on(el, "[data-s]", function (t) { step = +t.getAttribute("data-s"); draw(); }); draw();
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
    ["TAX", "Sales tax", "Sales tax tracking", "Tax collected on sales and paid on purchases, tracked by place and kept ready for whoever files.", "Track what was collected and owed, by jurisdiction.", "Hand the report to your tax adviser. Filing stays with you and them.", "Finance and your adviser, each filing period."],
    ["ASSETS", "Fixed assets", "Fixed assets", "Equipment recorded as assets and depreciated on schedule, with the register kept for you.", "Spot equipment in your bills and run the depreciation each month.", "Agree what counts as an asset.", "Finance, when you buy equipment."],
    ["STOCK", "Inventory", "Inventory and cost of goods", "Stock valued at cost, with cost of goods booked alongside each sale.", "Reduce stock and book cost of goods as orders come in.", "Check counts against the shelf now and then.", "Operations and finance, weekly."]];
  var NAV = [["EVERY DAY", [1, 2, 3, 11]], ["EVERY MONTH", [8, 4, 10, 9, 5]], ["WHEN YOU NEED IT", [6, 7, 0]]];

  M[10] = function (el) {
    var A = [["Laptops, 24", 86, 38, 2.8, "36 months"], ["Office fit-out", 40, 14, 1.2, "60 months"]], added = false;
    function draw() {
      var net = A.reduce(function (a, x) { return a + x[1] - x[2]; }, 0), dep = A.reduce(function (a, x) { return a + x[3]; }, 0);
      el.innerHTML = '<div class="a-kp a-k3"><div><small>NET BOOK VALUE</small><b>$' + net.toFixed(0) + 'k</b><span>ties to the balance sheet</span></div><div><small>DEPRECIATION A MONTH</small><b>$' + dep.toFixed(1) + 'k</b><span>posted automatically</span></div><div><small>ASSETS</small><b>' + (added ? 28 : 25) + '</b><span>each with its invoice</span></div></div><div class="f-row f-hd f-5"><span>USD thousands</span><b>Cost</b><b>Depreciated</b><b>Net</b><b>A month</b></div>' + A.map(function (x) { return '<div class="f-row f-5"><span>' + x[0] + " <small>over " + x[4] + "</small></span><b>" + x[1].toFixed(1) + "</b><b>(" + x[2].toFixed(1) + ")</b><b>" + (x[1] - x[2]).toFixed(1) + "</b><b>" + x[3].toFixed(1) + "</b></div>"; }).join("") + '<div class="m-pane">' + (added ? '<div class="m-note">Added to the register. $6,600 is now an asset, and $183 a month of depreciation starts in December.</div>' : '<div class="m-inv"><div class="m-doch"><b>New bill: 3 laptops, $6,600</b><span class="m-chip m-warn">AGENT SUGGESTS</span></div><p class="m-p" style="font-size:14.5px;margin:6px 0 0">This looks like equipment, not an expense. Record it as an asset and depreciate it over 36 months, as your policy says.</p></div><div class="m-acts"><button type="button" class="m-btn" data-a="1">Agree</button></div>') + "</div>";
    }
    on(el, "[data-a]", function () { added = true; A[0] = ["Laptops, 27", 92.6, 38, 2.98, "36 months"]; draw(); }); draw();
  };
  M[11] = function (el) {
    var K = [["Canvas tote", 420, 6.5, 60], ["Enamel mug", 38, 4.2, 50], ["Wool blanket", 96, 31, 40]], sold = false;
    function draw() {
      var val = K.reduce(function (a, x) { return a + x[1] * x[2]; }, 0);
      el.innerHTML = '<div class="a-kp a-k3"><div><small>STOCK ON HAND</small><b>$' + Math.round(val).toLocaleString("en-US") + '</b><span>at cost</span></div><div><small>COST OF GOODS, YESTERDAY</small><b>' + (sold ? "$806" : "Not yet booked") + '</b><span>' + (sold ? "posted with the sales" : "68 units sold") + '</span></div><div><small>RUNNING LOW</small><b>' + K.filter(function (x) { return x[1] < x[3]; }).length + '</b><span>below reorder level</span></div></div><div class="f-row f-hd f-5"><span>Sample store</span><b>On hand</b><b>Unit cost</b><b>Value</b><b>Reorder at</b></div>' + K.map(function (x) { return '<div class="f-row f-5"><span>' + x[0] + (x[1] < x[3] ? ' <span class="m-chip m-warn">LOW</span>' : "") + "</span><b>" + x[1] + "</b><b>$" + x[2].toFixed(2) + "</b><b>$" + Math.round(x[1] * x[2]).toLocaleString("en-US") + "</b><b>" + x[3] + "</b></div>"; }).join("") + '<div class="m-pane">' + (sold ? '<div class="m-note">Stock reduced and cost of goods booked against the same orders as the revenue, so gross margin is right by product and by channel.</div>' : '<div class="m-acts"><button type="button" class="m-btn" data-a="1">Book yesterday\'s 68 sales</button></div>') + '<p class="m-foot" style="padding:0">For businesses that sell goods. Stock counts come from your store or warehouse system.</p></div>';
    }
    on(el, "[data-a]", function () { if (sold) return; sold = true; K[0][1] -= 40; K[1][1] -= 12; K[2][1] -= 16; draw(); }); draw();
  };
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
    var seats = 40, price = 100, term = 12, bill = 1, ls = 1, impl = 10000, upl = 0, ramp = 0, BILL = [["Monthly", 1], ["Quarterly", 3], ["Annual", 12]], TERM = [12, 24, 36];
    function draw(keep) {
      var years = term / 12, tcv = 0; for (var yy = 0; yy < years; yy++) tcv += seats * price * 12 * Math.pow(1 + upl / 100, yy);
      if (ramp) tcv -= seats * price * 1.5;
      var mrr = seats * price, per = BILL[bill][1], n = Math.min(4, Math.ceil(term / per));
      var inv = []; for (var i = 0; i < n; i++) inv.push([MN[(ls + i * per) % 12] + " 1", mrr * (per - (ramp ? 0.5 * Math.max(0, Math.min(3, (i + 1) * per) - i * per) : 0))]);
      if (impl) inv.unshift(["On signature, implementation", impl]);
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">THE CONTRACT</span><div class="m-kv"><span>Customer</span><b>Harbor Labs <small class="m-mini">from your CRM</small></b></div>' +
        '<div class="m-kv"><span>Seats</span><span class="m-stp"><button type="button" data-a="s-">&minus;</button><output>' + seats + '</output><button type="button" data-a="s+">+</button></span></div>' +
        '<div class="m-kv"><span>Price per seat, monthly</span><b>$' + price + '</b></div><input type="range" min="40" max="300" step="10" value="' + price + '" aria-label="Price per seat" data-r="p">' +
        '<div class="m-kv"><span>Term</span><span class="m-opts">' + TERM.map(function (t) { return '<button type="button" data-a="t" data-v="' + t + '" aria-pressed="' + (t === term) + '">' + t + " mo</button>"; }).join("") + "</span></div>" +
        '<div class="m-kv"><span>Billing</span><span class="m-opts">' + BILL.map(function (b, i) { return '<button type="button" data-a="b" data-v="' + i + '" aria-pressed="' + (i === bill) + '">' + b[0] + "</button>"; }).join("") + "</span></div>" +
        (term > 12 ? '<div class="m-kv"><span>Price rise each year</span><span class="m-opts">' + [0, 5, 10].map(function (t) { return '<button type="button" data-a="u" data-v="' + t + '" aria-pressed="' + (t === upl) + '">' + (t ? t + "%" : "None") + "</button>"; }).join("") + "</span></div>" : "") +
        '<div class="m-kv"><span>First 3 months</span><span class="m-opts">' + ["Full price", "Half price"].map(function (t, i) { return '<button type="button" data-a="rp" data-v="' + i + '" aria-pressed="' + (i === ramp) + '">' + t + "</button>"; }).join("") + "</span></div>" +
        '<div class="m-kv"><span>License starts</span><span class="m-opts">' + [0, 1, 2].map(function (t) { return '<button type="button" data-a="l" data-v="' + t + '" aria-pressed="' + (t === ls) + '">' + MN[t] + " 1</button>"; }).join("") + "</span></div>" +
        '<div class="m-kv"><span>Implementation fee</span><span class="m-opts">' + [0, 10000, 25000].map(function (t) { return '<button type="button" data-a="i" data-v="' + t + '" aria-pressed="' + (t === impl) + '">' + (t ? $k(t) : "None") + "</button>"; }).join("") + "</span></div>" +
        '<p class="m-foot" style="padding:0">Signed Nov 20. Change anything, and everything on the right is worked out from these terms.</p></div>' +
        '<div class="m-pane"><span class="m-lab">WHAT IT CREATES, AUTOMATICALLY</span><div class="m-stats">' + stat("ANNUAL RECURRING", $k(mrr * 12), "m-good") + stat("CONTRACT VALUE", $k(tcv + impl)) + stat("COMMISSION, 10%", $k(mrr * 12 * 0.1)) + "</div>" +
        '<div class="m-flow"><div><small>INVOICES</small>' + inv.map(function (x) { return '<div class="m-fl"><span>' + x[0] + "</span><b>" + $k(x[1]) + "</b></div>"; }).join("") + (Math.ceil(term / per) > n ? '<div class="m-fl m-more"><span>and ' + (Math.ceil(term / per) - n) + " more</span></div>" : "") + "</div>" +
        '<div><small>REVENUE RECOGNITION</small><div class="m-fl"><span>Subscription starts</span><b>' + MN[ls] + ' 1</b></div><div class="m-fl"><span>' + (ramp ? "Each month, spread evenly" : "Each month, " + term + " months") + '</span><b>' + $k(ramp ? (mrr * term - mrr * 1.5) / term : mrr) + '</b></div>' + (term > 12 && upl ? '<div class="m-fl"><span>Each month, year 2</span><b>' + $k(mrr * (1 + upl / 100)) + "</b></div>" : "") + (impl ? '<div class="m-fl"><span>Implementation, as delivered</span><b>' + $k(impl) + "</b></div>" : "") + "<div class=\"m-fl\"><span>Deferred until then</span><b>" + (ls ? "Yes" : "No") + '</b></div><small style="margin-top:8px">IN THE PLAN</small><div class="m-fl"><span>Cash forecast</span><b>Updated</b></div><div class="m-fl"><span>Renewal</span><b>' + MN[(ls + term) % 12] + " " + (2026 + Math.floor((ls + term + 11) / 12)) + "</b></div></div></div></div></div>";
      var r = el.querySelector('[data-r="p"]'); r.addEventListener("input", function () { price = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"), v = +t.getAttribute("data-v"); if (a === "s-") seats = Math.max(5, seats - 5); if (a === "s+") seats = Math.min(500, seats + 5); if (a === "t") term = v; if (a === "b") bill = v; if (a === "l") ls = v; if (a === "i") impl = v; if (a === "u") upl = v; if (a === "rp") ramp = v; draw(); });
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
    function scn() { var SC = [[0.5, 0, "#8A5A00", "Downside"], [2, 0, "#0B1B3A", "Base"], [4, 3, "#2450DC", "Upside"]], Wd = 600, H = 230; return '<svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="Cash over 24 months in three cases">' + [0, 1, 2, 3].map(function (i) { var y = 14 + i * (H - 48) / 3; return '<line x1="34" x2="' + (Wd - 70) + '" y1="' + y + '" y2="' + y + '" stroke="' + (i === 3 ? "#0B1B3A" : "#E3E7EE") + '"></line><text x="28" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#4B5565">$' + (3 - i) + "M</text>"; }).join("") + SC.map(function (c) { var a = run(c[0], c[1], 24).a, pts = a.map(function (v, m) { return (34 + m / 24 * (Wd - 104)).toFixed(1) + "," + (14 + (1 - Math.min(v, 3000) / 3000) * (H - 48)).toFixed(1); }), last = pts[pts.length - 1].split(","); return '<polyline fill="none" stroke="' + c[2] + '" stroke-width="' + (c[3] === "Base" ? 4 : 2.5) + '" points="' + pts.join(" ") + '"></polyline><text x="' + (+last[0] + 6) + '" y="' + (+last[1] + (c[3] === "Base" ? -6 : c[3] === "Downside" ? 12 : 4)) + '" font-size="12" font-weight="800" fill="' + c[2] + '">' + c[3] + "</text>"; }).join("") + [["Nov 2026", 34, "start"], ["Nov 2027", 34 + (Wd - 104) / 2, "middle"], ["Nov 2028", Wd - 70, "end"]].map(function (t) { return '<text x="' + t[1] + '" y="' + (H - 12) + '" text-anchor="' + t[2] + '" font-size="11" fill="#4B5565">' + t[0] + "</text>"; }).join("") + "</svg>"; }
    function cbr() { var ST = [["October", 3275, 0], ["Net loss", -215, 1], ["Depreciation", 4, 1], ["Receivables", -14, 1], ["Prepaids", 6, 1], ["Payables", 4, 1], ["November", 3060, 0]], Wd = 600, H = 210, base = 3000, top = 3320, runv = 0, h = ""; function y(v) { return 22 + (top - v) / (top - base) * (H - 50); } ST.forEach(function (m, i) { var a, b; if (m[2] === 0) { a = base; b = m[1]; runv = m[1]; } else { a = runv; b = runv + m[1]; runv = b; } var hi = Math.max(a, b), lo = Math.min(a, b), x = 8 + i * 85; h += '<rect x="' + x + '" y="' + y(hi) + '" width="66" height="' + Math.max(y(lo) - y(hi), 2.5) + '" fill="' + (m[2] === 0 ? "#0B1B3A" : m[1] > 0 ? "#2450DC" : "#B9C3D3") + '"></rect><text x="' + (x + 33) + '" y="' + (y(hi) - 6) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#0B1B3A">' + (m[2] === 0 ? m[1].toLocaleString("en-US") : (m[1] > 0 ? "+" : "(") + Math.abs(m[1]) + (m[1] > 0 ? "" : ")")) + '</text><text x="' + (x + 33) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11.5" fill="#4B5565">' + m[0] + "</text>"; }); return '<svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="Cash bridge from October to November">' + h + '<line x1="0" x2="' + Wd + '" y1="' + (H - 24) + '" y2="' + (H - 24) + '" stroke="#0B1B3A"></line></svg>'; }
    function vb(rows) { var mx = Math.max.apply(null, rows.map(function (r) { return Math.abs(r[1]); })); return '<div class="sl-vb">' + rows.map(function (r) { return "<div><span>" + r[0] + '</span><i><u style="width:' + Math.abs(r[1]) / mx * 50 + "%;" + (r[1] >= 0 ? "left:50%;background:#2450DC" : "right:50%;background:#C99A2E") + '"></u></i><b class="' + (r[1] >= 0 ? "sl-up" : "sl-dn") + '">' + (r[1] > 0 ? "+" : "") + r[1] + "</b></div>"; }).join("") + "</div>"; }
    function r5(a, b, c, d, st) { return '<div class="sl-r sl-r5"><span>' + a + "</span><b>" + b + "</b><b>" + c + "</b><b>" + d + '</b><b><em class="sl-st' + st + '">' + ["Behind", "On plan", "Ahead"][st] + "</em></b></div>"; }
    function r4(a, b, c, d, cls) { return '<div class="sl-r ' + (cls || "") + '"><span>' + a + "</span><b>" + b + "</b><b>" + c + "</b><b>" + d + "</b></div>"; }
    function hb(rows, mx, suf) { return '<div class="sl-bars">' + rows.map(function (t) { return "<div><span>" + t[0] + '</span><i><u style="width:' + t[1] / mx * 100 + '%"></u></i><b>' + t[1] + (suf || "") + "</b></div>"; }).join("") + "</div>"; }
    function coh() { var C = [["2025 Q4", [100, 101, 104, 108, 112]], ["2026 Q1", [100, 102, 103, 106]], ["2026 Q2", [100, 99, 103]], ["2026 Q3", [100, 101]]]; return '<div class="sl-tb"><div class="sl-r sl-hd sl-r6"><span>Joined</span><b>Start</b><b>+3 mo</b><b>+6 mo</b><b>+9 mo</b><b>+12 mo</b></div>' + C.map(function (c) { return '<div class="sl-r sl-r6"><span>' + c[0] + "</span>" + [0, 1, 2, 3, 4].map(function (n) { var v = c[1][n]; return v == null ? "<b></b>" : '<b style="background:' + (v >= 100 ? "rgba(36,80,220," + Math.min((v - 96) / 30, 0.5) + ")" : "#FFE9A8") + '">' + v + "%</b>"; }).join("") + "</div>"; }).join("") + "</div>"; }
    var S = [["Cover", 1, function () { return '<div class="sl-in sl-cover"><small>SAMPLE CO.</small><h4>Board meeting</h4><p>November 2026 results and outlook</p><div class="sl-ag"><span>Highlights</span><span>Financials</span><span>Revenue</span><span>Sales and marketing</span><span>Cash</span><span>Product</span><span>Team</span><span>Decisions</span></div></div>'; }],
      ["Highlights", 1, function () { return '<p class="sl-ey">Highlights</p><h4>Revenue ahead of plan, margin behind</h4><div class="sl-kp">' + kp("RECURRING REVENUE", "$4.02M", "+4.1% on October", 1) + kp("REVENUE", "$335k", "+$5k against plan", 1) + kp("NET BURN", "$215k", "$8k over plan", 0) + kp("RUNWAY", "20 months", "No change", 1) + '</div><div class="sl-2">' + bul("WENT WELL", ["Three new customers, $180k of new recurring revenue", "Two upsells worth $96k"]) + bul("NEEDS ATTENTION", ["Gross margin 74.9% against a 78% plan, after hosting costs rose", "One customer did not renew, $92k"]) + "</div>"; }, "A good month for growth. One cost line needs a decision today."],
      ["Scorecard", 1, function () { return '<p class="sl-ey">Scorecard</p><h4>Four of seven measures on or ahead of plan</h4><div class="sl-tb"><div class="sl-r sl-hd sl-r5"><span></span><b>November</b><b>October</b><b>Plan</b><b>Status</b></div>' + r5("Recurring revenue, $k", "4,020", "3,860", "3,990", 2) + r5("Revenue, $k", "335", "322", "330", 2) + r5("Gross margin", "74.9%", "78.4%", "78.0%", 0) + r5("Net burn, $k", "215", "205", "207", 0) + r5("Cash, $k", "3,060", "3,275", "3,068", 1) + r5("Customers", "41", "39", "40", 2) + r5("People", "24", "24", "25", 0) + "</div>"; }, "Growth is ahead. Margin and burn are behind for one reason, hosting, covered on the next two slides."],
      ["Financials against plan", 1, function () { return '<p class="sl-ey">Financials</p><h4>Revenue beat plan, hosting cost took it back</h4><div class="sl-2x"><div class="sl-tb"><div class="sl-r sl-hd"><span>USD thousands</span><b>Actual</b><b>Plan</b><b>Var.</b></div>' + row("Revenue", "335", "330", "+5") + row("Cost of revenue", "(84)", "(73)", "(11)") + row("Gross profit", "251", "257", "(6)", "sl-st") + row("Research and development", "(228)", "(226)", "(2)") + row("Sales and marketing", "(142)", "(144)", "+2") + row("General and administrative", "(100)", "(98)", "(2)") + row("EBITDA", "(219)", "(211)", "(8)", "sl-st") + row("Net income", "(215)", "(207)", "(8)", "sl-st") + '</div><div><p class="sl-ey" style="color:#4B5565">Variance to plan, $k</p>' + vb([["Revenue", 5], ["Cost of revenue", -11], ["R&amp;D", -2], ["Sales and marketing", 2], ["G&amp;A", -2], ["Net income", -8]]) + "</div></div>"; }, "An $8k miss on net income, of which $11k is hosting. Everything else nets to a $3k gain."],
      ["Where the money went", 1, function () { return '<p class="sl-ey">Costs</p><h4>$554k of operating costs, most of it people</h4>' + hb([["Research and development", 228], ["Sales and marketing", 142], ["General and administrative", 100], ["Cost of revenue", 84]], 228, "") + '<div class="sl-2">' + bul("CHANGED THIS MONTH", ["Hosting up $11.2k after a new region went live", "Sales and marketing $2k under plan"]) + bul("PAYROLL", ["$372k a month across 24 people"]) + "</div>"; }, "People are two thirds of cost, so hiring pace is the main lever on burn."],
      ["Recurring revenue", 1, function () { return '<p class="sl-ey">Revenue</p><h4>Recurring revenue grew $160k to $4.02M</h4><div class="sl-ch">' + bridge() + '</div><div class="sl-kp sl-k3">' + kp("NET RETENTION, NOV", "99.5%", "Upsells nearly cover losses", 1) + kp("GROSS RETENTION, NOV", "97.0%", "$116k lost", 0) + kp("CUSTOMERS", "41", "+2 net", 1) + "</div>"; }, "New business is strong. Losses came from two customers, both in the smaller segments."],
      ["Customers", 1, function () { return '<p class="sl-ey">Customers</p><h4>Three won, one lost, two expanded</h4>' + hb([["Corvid Systems", 180], ["Atlas Payroll", 144], ["Northwind Ltd", 132], ["Tallis and Co", 90], ["Kestrel Freight", 72]], 180, "k") + '<div class="sl-2">' + bul("NEW THIS MONTH", ["Kestrel Freight, $72k", "Oakline Health, $60k", "Harbor Labs, $48k"]) + bul("LOST OR REDUCED", ["Meridian Labs did not renew, $92k", "Brightdesk cut 10 seats, $24k"]) + "</div>"; }, "The top five customers are 15% of recurring revenue, so concentration is low."],
      ["Retention by cohort", 1, function () { return '<p class="sl-ey">Retention</p><h4>Older customers keep growing after month six</h4>' + coh() + '<p class="sl-nt">Recurring revenue kept from each group of customers, as a share of where they started.</p>'; }],
      ["Sales pipeline", 1, function () { return '<p class="sl-ey">Sales</p><h4>$402k of open pipeline, $190k at stage odds</h4>' + hb([["Lead", 54], ["Qualified", 102], ["Demo", 30], ["Proposal", 96], ["Negotiation", 120]], 120, "k") + '<div class="sl-kp sl-k3">' + kp("PRIYA", "110%", "of quota", 1) + kp("DANIEL", "80%", "of quota", 0) + kp("SOFIA", "40%", "of quota, ramping", 0) + "</div>"; }, "There is enough late-stage pipeline to cover the December target."],
      ["Marketing", 1, function () { return '<p class="sl-ey">Marketing</p><h4>$58k of spend created $186k of pipeline</h4><div class="sl-2x"><div><p class="sl-ey" style="color:#4B5565">From visitor to customer, November</p>' + hb([["Website visitors", 18400], ["Leads", 612], ["Qualified", 94], ["Demos", 41], ["Won", 3]].map(function (r, i) { return [r[0] + " (" + r[1].toLocaleString("en-US") + ")", [100, 62, 38, 24, 12][i]]; }), 100, "").replace(/<b>\d+<\/b>/g, "<b></b>") + '</div><div class="sl-cases"><div style="border-left-color:#2450DC"><small style="color:#2450DC">COST PER LEAD</small><b>$95</b><span>Down from $104</span></div><div style="border-left-color:#0B1B3A"><small>BEST CHANNEL</small><b>Webinars</b><span>31 qualified leads from $9k</span></div><div style="border-left-color:#8A5A00"><small style="color:#8A5A00">WEAKEST CHANNEL</small><b>Paid search</b><span>$21k for 14 qualified leads</span></div></div></div>'; }, "Move $10k a month from paid search to webinars and partner events in the first quarter."],
      ["Cash and runway", 1, function () { return '<p class="sl-ey">Cash</p><h4>$3.06M in the bank, 20 months of runway</h4><div class="sl-ch">' + cash() + '</div><div class="sl-kp sl-k3">' + kp("BASE CASE", "Jul 2028", "2% monthly growth", 1) + kp("DOWNSIDE", "Feb 2028", "0.5% monthly growth", 0) + kp("UPSIDE", "Breakeven", "4% growth, 3 hires", 1) + "</div>"; }, "No need to raise in the next 12 months on the base case."],
      ["Cash bridge", 1, function () { return '<p class="sl-ey">Cash bridge</p><h4>Cash fell $215k, in line with the loss</h4><div class="sl-ch">' + cbr() + '</div><div class="sl-kp sl-k3">' + kp("DAYS TO COLLECT", "37", "Up 2 days", 0) + kp("PAID IN ADVANCE", "$540k", "Deferred revenue, flat", 1) + kp("DEBT", "None", "No borrowings", 1) + "</div>"; }, "Working capital was neutral this month. Collections are the one thing to watch."],
      ["Scenarios", 1, function () { return '<p class="sl-ey">Outlook</p><h4>We plan on the base case, and it lasts to mid-2028</h4><div class="sl-2x"><div class="sl-ch">' + scn() + '</div><div class="sl-cases">' + [["Downside", "#8A5A00", "15 months", "0.5% growth, no hires"], ["Base", "#0B1B3A", "20 months", "2% growth, no hires"], ["Upside", "#2450DC", "Self-funding", "4% growth, 3 sales hires"]].map(function (c) { return '<div style="border-left-color:' + c[1] + '"><small style="color:' + c[1] + '">' + c[0].toUpperCase() + "</small><b>" + c[2] + "</b><span>" + c[3] + "</span></div>"; }).join("") + "</div></div>"; }, "The upside needs three sales hires now and costs about $0.5M of cash before it pays back."],
      ["Team", 1, function () { return '<p class="sl-ey">Team</p><h4>24 people, 2 open roles in the plan</h4>' + hb(TEAM, 11, "") + '<div class="sl-2">' + bul("OPEN ROLES", ["Account executive, offer accepted", "Senior engineer, interviewing"]) + bul("PAYROLL", ["$372k a month, about two thirds of all costs"]) + "</div>"; }, "Two open roles are in the plan and already in the burn forecast."],
      ["Product roadmap", 1, function () { var C = [["Shipped this quarter", "#0B1B3A", [["Usage dashboards", "Live for all customers", "DONE"], ["Single sign-on", "Asked for by 6 enterprise deals", "DONE"], ["Audit log export", "Unblocked two renewals", "DONE"]]], ["Now, to March", "#2450DC", [["Roles and permissions", "In build, due January", "ON TRACK"], ["Mobile approvals", "In build, due February", "ON TRACK"], ["API version 2", "In design, due March", "AT RISK"]]], ["Next, to June", "#5B8CFF", [["Workflow builder", "Scoped, 2 engineers", "PLANNED"], ["European data hosting", "Needs the hosting contract", "PLANNED"]]], ["Later", "#B9C3D3", [["Partner integrations", "After API version 2", "IDEA"], ["Assistant for end users", "Research under way", "IDEA"]]]]; return '<p class="sl-ey">Product</p><h4>Three things shipped, one of the next three is at risk</h4><div class="sl-road">' + C.map(function (c) { return '<div><small style="border-top-color:' + c[1] + '">' + c[0].toUpperCase() + "</small>" + c[2].map(function (x) { return '<div class="sl-card"><b>' + x[0] + "</b><span>" + x[1] + '</span><em class="sl-' + x[2].toLowerCase().replace(" ", "") + '">' + x[2] + "</em></div>"; }).join("") + "</div>"; }).join("") + "</div>"; }, "API version 2 is short one engineer. The senior hire on the team slide closes that gap."],
      ["Risks", 1, function () { return '<p class="sl-ey">Risks</p><h4>Three things that could move the plan</h4><div class="sl-dec"><div><b>1</b><span><strong>Hosting cost.</strong> Up $11.2k this month. A committed contract is in front of the board today.</span></div><div><b>2</b><span><strong>Renewals.</strong> Two large contracts renew by February, including one customer that reduced seats.</span></div><div><b>3</b><span><strong>Overdue invoices.</strong> $32k is overdue, $18k of it by more than 30 days.</span></div></div>'; }],
      ["Decisions", 1, function () { return '<p class="sl-ey">For the board</p><h4>Two decisions we are asking for</h4><div class="sl-dec"><div><b>1</b><span><strong>Approve two sales hires in January.</strong> Runway moves from 20 to 18 months in the base case.</span></div><div><b>2</b><span><strong>Approve the move to a committed hosting contract.</strong> Brings gross margin back toward plan from the first quarter.</span></div></div><p class="sl-nt">Every number in this pack is read from the ledger and the plan at the time it was built.</p>'; }]];
    function mk(o) {
      return [["Cover", 1, function () { return '<div class="sl-in sl-cover"><small>' + o.co.toUpperCase() + '</small><h4>Board meeting</h4><p>November 2026 results and outlook</p><div class="sl-ag"><span>Highlights</span><span>Financials</span><span>' + o.mixT + "</span><span>" + o.opsT + "</span><span>Cash</span><span>Risks</span><span>Decisions</span></div></div>"; }],
        ["Highlights", 1, function () { return '<p class="sl-ey">Highlights</p><h4>' + o.head + '</h4><div class="sl-kp">' + o.kp.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + '</div><div class="sl-2">' + bul("WENT WELL", o.good) + bul("NEEDS ATTENTION", o.bad) + "</div>"; }],
        ["Scorecard", 1, function () { return '<p class="sl-ey">Scorecard</p><h4>The numbers that run this business</h4><div class="sl-tb"><div class="sl-r sl-hd"><span></span><b>November</b><b>October</b><b>Plan</b></div>' + o.score.map(function (r) { return r4(r[0], r[1], r[2], r[3]); }).join("") + "</div>"; }],
        ["Financials against plan", 1, function () { return '<p class="sl-ey">Financials</p><h4>November against plan, USD thousands</h4><div class="sl-tb"><div class="sl-r sl-hd"><span></span><b>Actual</b><b>Plan</b><b>Variance</b></div>' + o.pl.map(function (r) { return row(r[0], r[1], r[2], r[3], r[4]); }).join("") + '</div><p class="sl-nt">' + o.plNote + "</p>"; }],
        [o.mixT, 1, function () { return '<p class="sl-ey">' + o.mixT + "</p><h4>" + o.mixH + "</h4>" + hb(o.mix, Math.max.apply(null, o.mix.map(function (x) { return x[1]; })), "k") + '<div class="sl-2">' + bul(o.mixA[0], o.mixA[1]) + bul(o.mixB[0], o.mixB[1]) + "</div>"; }],
        [o.opsT, 1, function () { return '<p class="sl-ey">' + o.opsT + "</p><h4>" + o.opsH + '</h4><div class="sl-kp">' + o.ops.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + '</div><p class="sl-nt">' + o.opsNote + "</p>"; }],
        ["Cash", 1, function () { return '<p class="sl-ey">Cash</p><h4>' + o.cashH + '</h4><div class="sl-kp sl-k3">' + o.cash.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + '</div><div class="sl-2">' + bul("COMING IN", o.cin) + bul("GOING OUT", o.cout) + "</div>"; }],
        ["Risks", 1, function () { return '<p class="sl-ey">Risks</p><h4>What could move the plan</h4><div class="sl-dec">' + o.risks.map(function (r, i) { return "<div><b>" + (i + 1) + "</b><span><strong>" + r[0] + "</strong> " + r[1] + "</span></div>"; }).join("") + "</div>"; }],
        ["Decisions", 1, function () { return '<p class="sl-ey">For the board</p><h4>Decisions we are asking for</h4><div class="sl-dec">' + o.asks.map(function (r, i) { return "<div><b>" + (i + 1) + "</b><span><strong>" + r[0] + "</strong> " + r[1] + "</span></div>"; }).join("") + '</div><p class="sl-nt">Every number in this pack is read from the ledger and the plan at the time it was built.</p>'; }]];
    }
    var DECKS = [["Software", "Sample Co.", S],
      ["Online store", "Sample store", mk({ co: "Sample store", head: "Sales up 9%, advertising cost rising faster", kp: [["NET SALES", "$412k", "+9% on October", 1], ["GROSS MARGIN", "58%", "After shipping and fees", 1], ["OPERATING PROFIT", "$34k", "$2k under plan", 0], ["STOCK COVER", "46 days", "At this month's pace", 1]], good: ["Repeat customers reached 38% of orders", "Amazon sales up 14% with no extra advertising"], bad: ["Advertising took 29% of sales, against 28% planned", "Returns rose to 6.2% of orders"], score: [["Net sales, $k", "412", "378", "400"], ["Orders", "6,440", "5,980", "6,250"], ["Average order", "$64", "$63", "$64"], ["Gross margin", "58%", "59%", "58.5%"], ["Sales per ad dollar", "$3.40", "$3.60", "$3.57"], ["Returns", "6.2%", "5.4%", "5.5%"], ["Cash, $k", "286", "301", "290"]], pl: [["Net sales", "412", "400", "+12"], ["Cost of goods, shipping and fees", "(173)", "(166)", "(7)"], ["Gross profit", "239", "234", "+5", "sl-st"], ["Advertising", "(121)", "(112)", "(9)"], ["People and other costs", "(84)", "(86)", "+2"], ["Operating profit", "34", "36", "(2)", "sl-st"]], plNote: "Sales beat plan by $12k, and advertising gave most of it back.", mixT: "Channels", mixH: "Shopify still leads, Amazon is growing fastest", mix: [["Shopify", 236], ["Amazon", 132], ["Other marketplaces", 44]], mixA: ["MARGIN AFTER FEES", ["Shopify 61%", "Amazon 52%", "Other marketplaces 57%"]], mixB: ["BEST SELLERS", ["Canvas tote", "Wool blanket", "Enamel mug, running low"]], opsT: "Customers", opsH: "More people are coming back to buy again", ops: [["REPEAT CUSTOMERS", "38%", "of orders", 1], ["AVERAGE ORDER", "$64", "+$1", 1], ["RETURNS", "6.2%", "Up from 5.4%", 0], ["COST TO WIN A CUSTOMER", "$27", "Up from $24", 0]], opsNote: "Paid advertising is getting more expensive. Repeat orders are where the margin is.", cashH: "$286k in the bank, with holiday stock already paid for", cash: [["CASH", "$286k", "$15k lower than October", 0], ["STOCK AT COST", "$198k", "46 days of sales", 1], ["OWED BY MARKETPLACES", "$41k", "Paid out within 14 days", 1]], cin: ["Marketplace payouts every two weeks", "Card sales settle in two days"], cout: ["Holiday stock order paid in October", "Advertising billed monthly"], risks: [["Advertising cost.", "Sales per ad dollar fell from $3.60 to $3.40."], ["Stock.", "One best seller is below its reorder level before the holidays."], ["Returns.", "Up to 6.2% of orders, mostly one product."]], asks: [["Approve a $60k stock order for the first quarter.", "Keeps cover above 40 days."], ["Approve moving 15% of advertising to email and repeat offers.", "Where the margin is strongest."]] })],
      ["Services", "Sample studio", mk({ co: "Sample studio", head: "Revenue steady, too much work not yet invoiced", kp: [["REVENUE", "$186k", "+3% on October", 1], ["TIME BILLED", "74%", "Target 78%", 0], ["OPERATING PROFIT", "$28k", "$4k under plan", 0], ["SIGNED WORK", "$420k", "About 2 months", 1]], good: ["Two new retainers signed, $18k a month", "Average rate up to $142 an hour"], bad: ["$38k of finished work is not yet invoiced", "Clients are taking 38 days to pay"], score: [["Revenue, $k", "186", "181", "190"], ["Time billed", "74%", "76%", "78%"], ["Average rate", "$142", "$139", "$140"], ["Gross margin", "46%", "47%", "47%"], ["Done, not invoiced, $k", "38", "22", "20"], ["Days to get paid", "38", "34", "30"], ["Cash, $k", "214", "226", "220"]], pl: [["Revenue", "186", "190", "(4)"], ["Delivery team and contractors", "(100)", "(101)", "+1"], ["Gross profit", "86", "89", "(3)", "sl-st"], ["Overheads", "(58)", "(57)", "(1)"], ["Operating profit", "28", "32", "(4)", "sl-st"]], plNote: "The shortfall is timing: finished work that has not been invoiced yet.", mixT: "Clients", mixH: "Two clients are 59% of revenue", mix: [["Northwind Ltd", 62], ["Brightdesk", 48], ["9 others", 76]], mixA: ["MOST PROFITABLE", ["Brightdesk retainer, 58% margin", "Northwind rebuild, 41% margin"]], mixB: ["ENDING SOON", ["Northwind rebuild completes in January", "Two proposals out to replace it"]], opsT: "Delivery", opsH: "The team is busy, and not all of it is billable", ops: [["TIME BILLED", "74%", "Target 78%", 0], ["AVERAGE RATE", "$142", "an hour", 1], ["REVENUE PER PERSON", "$15.5k", "a month", 1], ["PROJECTS OVER BUDGET", "2 of 11", "Both fixed fee", 0]], opsNote: "Fixed-fee projects are where margin leaks. Both overruns were scoped before the new estimating template.", cashH: "$214k in the bank, $96k owed by clients", cash: [["CASH", "$214k", "$12k lower", 0], ["OWED BY CLIENTS", "$96k", "$31k overdue", 0], ["DONE, NOT INVOICED", "$38k", "Goes out this week", 1]], cin: ["$96k of invoices outstanding", "$38k to invoice this week"], cout: ["Payroll on the 28th", "Contractors paid on 30-day terms"], risks: [["Client concentration.", "Two clients are 59% of revenue, and one project ends in January."], ["Slow payment.", "Days to get paid rose from 34 to 38."], ["Fixed-fee overruns.", "Two projects are over budget."]], asks: [["Approve hiring one senior designer.", "Covered by the two new retainers."], ["Approve moving new work to milestone billing.", "Invoices go out as each stage is delivered."]] })],
      ["Hospitality and retail", "Sample cafe group", mk({ co: "Sample cafe group", head: "Sales ahead of plan, cost of goods creeping up", kp: [["SALES", "$402k", "+5% on last year", 1], ["LABOUR", "29%", "of sales, on plan", 1], ["COST OF GOODS", "31%", "Plan 30.5%", 0], ["OPERATING PROFIT", "$48k", "On plan", 1]], good: ["All three sites grew on last year", "Average ticket up to $34"], bad: ["Dairy and coffee prices pushed cost of goods up", "Evening trade is still the weakest part of the day"], score: [["Sales, $k", "402", "388", "395"], ["Tickets", "11,820", "11,560", "11,700"], ["Average ticket", "$34", "$33.60", "$33.80"], ["Labour, share of sales", "29%", "29.5%", "29%"], ["Cost of goods", "31%", "30.4%", "30.5%"], ["Waste", "2.1%", "2.4%", "2.0%"], ["Cash, $k", "168", "154", "160"]], pl: [["Sales", "402", "395", "+7"], ["Cost of goods", "(125)", "(120)", "(5)"], ["Labour", "(117)", "(115)", "(2)"], ["Rent and other costs", "(112)", "(112)", "0"], ["Operating profit", "48", "48", "0", "sl-st"]], plNote: "Extra sales were absorbed by higher ingredient prices. Labour held at 29%.", mixT: "Sites", mixH: "The newest site is now the busiest", mix: [["Market Street", 152], ["Riverside", 138], ["Station", 112]], mixA: ["BY TIME OF DAY", ["Lunch 43% of sales", "Morning 34%", "Evening 23%"]], mixB: ["PROFIT BY SITE", ["Market Street 14%", "Riverside 12%", "Station 9%"]], opsT: "Operations", opsH: "Labour is under control, goods are not", ops: [["LABOUR PLUS GOODS", "60%", "of sales", 1], ["WASTE", "2.1%", "Down from 2.4%", 1], ["TIPS PAID OUT", "$31k", "to 46 staff", 1], ["SUPPLIER PRICE RISES", "3", "this month", 0]], opsNote: "Three suppliers raised prices. A menu price review is on the next slide but one.", cashH: "$168k in the bank, takings settle next day", cash: [["CASH", "$168k", "$14k higher", 1], ["SALES TAX HELD", "$32k", "Due in January", 0], ["OWED TO SUPPLIERS", "$54k", "On 30-day terms", 1]], cin: ["Card takings settle next day", "Gift cards sold in December"], cout: ["Sales tax due in January", "Quarterly rent on January 1"], risks: [["Ingredient prices.", "Cost of goods is half a point over plan."], ["Station site.", "Profit of 9% against 12 to 14% elsewhere."], ["January.", "Rent and sales tax fall in the quietest month."]], asks: [["Approve a 3% menu price rise from January.", "Brings cost of goods back to plan."], ["Approve trialling shorter evening hours at Station.", "Evening is 23% of sales and the highest labour share."]] })]], dk = 0, EDS = [{}, {}, {}, {}];
    var ED = EDS[0], SEL = "h4, li, .sl-nt, .sl-so span, .sl-dec span, .sl-cover p";
    function fill(box, i) { if (!ED[i]) return; var ns = box.querySelectorAll(SEL); Object.keys(ED[i]).forEach(function (n) { if (ns[n]) ns[n].innerHTML = ED[i][n]; }); }
    var cur = 1;
    function inc() { return S.map(function (s, i) { return i; }).filter(function (i) { return S[i][1]; }); }
    function slide(i, pg, tot) { var body = S[i][2](); return '<div class="sl' + (i === 0 ? " sl-dark" : "") + '">' + (i === 0 ? body : '<i class="sl-mk" aria-hidden="true"></i><div class="sl-in">' + body + (S[i][3] ? '<p class="sl-so"><b>So what</b><span>' + S[i][3] + "</span></p>" : "") + "</div>") + '<div class="sl-ft"><span>' + DECKS[dk][1] + ' &middot; Board meeting, November 2026 &middot; Confidential</span><span>' + (pg ? pg + " / " + tot : "") + "</span></div></div>"; }
    function draw() {
      var I = inc(), pos = I.indexOf(cur);
      el.innerHTML = '<div class="m-tabs nosb" role="group" aria-label="Kind of business">' + DECKS.map(function (x, i) { return '<button type="button" data-dk="' + i + '" aria-pressed="' + (i === dk) + '"><small>0' + (i + 1) + "</small><b>" + x[0] + "</b></button>"; }).join("") + '</div><div class="bp"><div class="bp-strip nosb">' + S.map(function (s, i) { return '<div class="bp-th' + (i === cur ? " bp-cur" : "") + (s[1] ? "" : " bp-off") + '"><div class="bp-mini" data-go="' + i + '" role="button" tabindex="0" aria-label="Show slide: ' + s[0] + '">' + slide(i) + '</div><div class="bp-cap"><small>' + s[0] + '</small><button type="button" class="m-tick" data-tg="' + i + '" aria-pressed="' + !!s[1] + '" aria-label="Include ' + s[0] + '">' + (s[1] ? "&#10003;" : "") + "</button></div></div>"; }).join("") + "</div>" +
        '<div class="bp-main"><div class="bp-bar"><span><b>Board pack, November 2026</b><small>' + I.length + " slides, drafted from the ledger and the plan. Click any text to edit it.</small></span><span class=\"m-chip m-blue bp-ed\">" + (Object.keys(ED).length ? "EDITED" : "DRAFT") + "</span><span class=\"m-stp\"><button type=\"button\" data-nav=\"-1\" aria-label=\"Previous slide\">&larr;</button><output>" + (pos + 1) + " / " + I.length + '</output><button type="button" data-nav="1" aria-label="Next slide">&rarr;</button></span></div>' + (I.length ? slide(cur, pos + 1, I.length) : '<p class="m-p">Tick a slide to start the pack.</p>') + '<p class="m-foot" style="padding:0">Tick slides in or out, and click any heading, bullet or note to rewrite it. Numbers stay tied to the ledger, then exports as slides or a PDF.</p></div></div>';
      [].forEach.call(el.querySelectorAll(".bp-mini"), function (m) { fill(m, +m.getAttribute("data-go")); });
      var main = el.querySelector(".bp-main > .sl"); if (!main) return; fill(main, cur);
      [].forEach.call(main.querySelectorAll(SEL), function (nd, n) { nd.setAttribute("contenteditable", "true"); nd.setAttribute("spellcheck", "false"); nd.addEventListener("input", function () { (ED[cur] = ED[cur] || {})[n] = nd.innerHTML; var th = el.querySelector('.bp-mini[data-go="' + cur + '"]'); if (th) fill(th, cur); var c = el.querySelector(".bp-ed"); if (c) c.textContent = "EDITED"; }); });
    }

    on(el, "[data-tg]", function (t, e) { e.stopPropagation(); var i = +t.getAttribute("data-tg"); S[i][1] = S[i][1] ? 0 : 1; var I = inc(); if (I.indexOf(cur) < 0 && I.length) cur = I.filter(function (x) { return x > i; })[0] !== undefined ? I.filter(function (x) { return x > i; })[0] : I[I.length - 1]; draw(); });
    on(el, "[data-go]", function (t) { var i = +t.getAttribute("data-go"); if (!S[i][1]) S[i][1] = 1; cur = i; draw(); });
    on(el, "[data-dk]", function (t) { dk = +t.getAttribute("data-dk"); S = DECKS[dk][2]; ED = EDS[dk]; cur = 1; draw(); });
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

/* Round four: full-cycle story, analytics, policies, bulk approval, revenue forecast, and richer revenue widgets. Sample data throughout. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function $k(v) { return "$" + Math.round(v).toLocaleString("en-US"); }
  function n0(v) { return Math.round(v).toLocaleString("en-US"); }
  function stat(l, v, c) { return '<div class="' + (c || "") + '"><small>' + l + "</small><b>" + v + "</b></div>"; }
  function seg(items, cur, attr) { return '<div class="m-filters">' + items.map(function (x, i) { return '<button type="button" data-' + attr + '="' + i + '" aria-pressed="' + (i === cur) + '">' + x + "</button>"; }).join("") + "</div>"; }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function bars(vals, hi, color) { var mx = Math.max.apply(null, vals); return '<div class="a-bars">' + vals.map(function (v, i) { return '<i style="height:' + (v / mx * 100).toFixed(1) + "%;background:" + (i === (hi == null ? vals.length - 1 : hi) ? (color || "#2450DC") : "#B9C3D3") + '"></i>'; }).join("") + "</div>"; }

  /* ---------- the full cycle, one customer ---------- */
  W.cycle = function (el) {
    var S = [["A lead arrives", "Customers", "Ferro Marine asks for a demo. A company and a contact are created, with nothing typed twice.", "Agent created the record", [180, 4020, 412, 3060, 540, 0]],
      ["It becomes an opportunity", "Deals", "Priya qualifies it at $96,000 a year. The forecast counts it at its stage probability.", "Priya moved the deal", [199, 4020, 412, 3060, 540, 0]],
      ["Proposal and negotiation", "Deals", "Terms go back and forth. The deal moves to 75% and the forecast moves with it.", "Agent drafted the proposal", [252, 4020, 412, 3060, 540, 0]],
      ["Won, and the contract is signed", "Contracts", "The contract is filled in from the deal, approved and signed on the platform. Recurring revenue and commission are booked.", "You approved, the customer signed", [180, 4116, 412, 3060, 540, 0]],
      ["The first invoice goes out", "Billing", "A quarterly invoice for $24,000 is drafted from the contract and sent. It is owed to you, and not yet earned.", "Agent drafted, you approved", [180, 4116, 436, 3060, 564, 0]],
      ["Revenue lands in the books", "Books", "The first month, $8,000, is recognized. The other $16,000 waits as deferred revenue.", "Agent posted under your policy", [180, 4116, 436, 3060, 556, 8]],
      ["The customer pays", "Bank", "$24,000 arrives. The payment is matched to the invoice and the bank reconciles itself.", "Agent matched it", [180, 4116, 412, 3084, 556, 8]],
      ["The plan already knows", "Plan", "Runway, the forecast and next month's board pack are updated, because they read the same numbers.", "Nothing to do", [180, 4116, 412, 3084, 556, 8]]];
    var L = ["Pipeline in forecast", "Recurring revenue", "Owed to you", "Cash", "Deferred revenue", "Revenue from this deal"], cur = 0, play = true, tm;
    function draw() {
      var s = S[cur], p = S[Math.max(cur - 1, 0)][4];
      el.innerHTML = '<div class="cy"><div class="cy-steps nosb">' + S.map(function (x, i) { return '<button type="button" data-i="' + i + '" class="' + (i < cur ? "cy-done" : "") + '" aria-pressed="' + (i === cur) + '"><i>' + (i + 1) + "</i><span>" + x[0] + "</span></button>"; }).join("") + "</div>" +
        '<div class="cy-main"><div class="cy-card"><span class="m-chip m-blue">' + s[1].toUpperCase() + "</span><b>" + s[0] + "</b><p>" + s[2] + '</p><small>' + CHECK + " " + s[3] + '</small><div class="cy-ctl"><button type="button" class="m-btn m-sm" data-a="play">' + (play ? "Pause" : "Play") + '</button><button type="button" class="m-btn m-sm m-ghost" data-a="next">Next step &rarr;</button></div></div>' +
        '<div class="cy-nums">' + L.map(function (l, i) { var v = s[4][i], ch = cur > 0 && v !== p[i], d = v - p[i]; return '<div class="' + (ch ? "cy-ch" : "") + '"><small>' + l.toUpperCase() + "</small><b>$" + n0(v) + "k</b><span>" + (ch ? (d > 0 ? "+" : "") + d + "k" : "&nbsp;") + "</span></div>"; }).join("") + "</div></div></div>";
    }
    function tick() { if (!el.isConnected) { clearInterval(tm); return; } if (play) { cur = (cur + 1) % S.length; draw(); } }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); play = false; draw(); });
    on(el, "[data-a]", function (t) { if (t.getAttribute("data-a") === "play") play = !play; else { cur = (cur + 1) % S.length; play = false; } draw(); });
    draw(); tm = setInterval(tick, 3600);
  };

  /* ---------- analytics by kind of business ---------- */
  W.analytics = function (el) {
    var D = [["Software", "Sample Co.", [["RECURRING REVENUE", "$4.02M", "+4.1% on October"], ["NET RETENTION", "99.5%", "this month"], ["GROSS MARGIN", "74.9%", "-3.5 points"], ["BURN MULTIPLE", "1.3x", "$215k burned for $160k net new"], ["GROSS RETENTION", "97.0%", "this month"], ["AVERAGE PER CUSTOMER", "$98k", "a year, 41 customers"], ["REVENUE PER PERSON", "$168k", "recurring, 24 people"], ["RUNWAY", "20 months", "cash to July 2028"]], "RECURRING REVENUE, 12 MONTHS", [2640, 2750, 2860, 2970, 3080, 3190, 3300, 3432, 3576, 3720, 3860, 4020], "BY SEGMENT", [["Mid-size", 1840], ["Small", 1120], ["Enterprise", 1060]]],
      ["Online store", "Sample store", [["NET SALES", "$412k", "+9% on October"], ["GROSS MARGIN", "58%", "after shipping and fees"], ["RETURNS", "6.2%", "of orders"], ["SALES PER AD DOLLAR", "$3.40", "blended"], ["AVERAGE ORDER", "$64", "6,440 orders"], ["REPEAT CUSTOMERS", "38%", "of orders"], ["MARGIN AFTER ADS", "29%", "of net sales"], ["STOCK COVER", "46 days", "at this month's pace"]], "NET SALES, 12 MONTHS", [240, 232, 251, 263, 270, 288, 301, 296, 322, 351, 378, 412], "BY CHANNEL", [["Shopify", 236], ["Amazon", 132], ["Other marketplaces", 44]]],
      ["Services", "Sample studio", [["REVENUE", "$186k", "+3% on October"], ["TIME BILLED", "74%", "of available hours"], ["AVERAGE RATE", "$142", "an hour"], ["DONE, NOT YET INVOICED", "$38k", "across 6 projects"], ["GROSS MARGIN", "46%", "after delivery costs"], ["REVENUE PER PERSON", "$15.5k", "a month, 12 people"], ["DAYS TO GET PAID", "38", "from invoice to cash"], ["SIGNED, STILL TO DELIVER", "$420k", "about 2 months of work"]], "REVENUE, 12 MONTHS", [141, 150, 148, 157, 163, 160, 171, 168, 174, 179, 181, 186], "BY CLIENT", [["Northwind Ltd", 62], ["Brightdesk", 48], ["9 others", 76]]],
      ["Hospitality and retail", "Sample cafe group", [["SALES THIS WEEK", "$96k", "+5% on last week"], ["LABOUR", "29%", "of sales"], ["COST OF GOODS", "31%", "of sales"], ["AVERAGE TICKET", "$34", "2,820 tickets"], ["LABOUR PLUS GOODS", "60%", "of sales"], ["SAME SITES, YEAR ON YEAR", "+5%", "3 sites"], ["TIPS PAID OUT", "$7.4k", "this week"], ["WASTE", "2.1%", "of goods bought"]], "WEEKLY SALES, 12 WEEKS", [78, 81, 80, 84, 83, 88, 86, 90, 89, 93, 91, 96], "BY TIME OF DAY", [["Lunch", 41], ["Morning", 33], ["Evening", 22]]],
      ["Marketplace", "Sample marketplace", [["SALES THROUGH THE PLATFORM", "$2.40M", "+7% on October"], ["YOUR SHARE", "12.5%", "of each sale"], ["NET REVENUE", "$300k", "what you keep"], ["OWED TO SELLERS", "$186k", "paid out weekly"], ["ACTIVE BUYERS", "8,420", "bought this month"], ["ACTIVE SELLERS", "612", "sold this month"], ["REPEAT PURCHASES", "44%", "of orders"], ["REFUNDS", "1.8%", "of sales"]], "NET REVENUE, 12 MONTHS", [182, 190, 201, 208, 219, 231, 240, 252, 263, 271, 280, 300], "BY CATEGORY", [["Home", 132], ["Fashion", 98], ["Other", 70]]],
      ["Fintech", "Sample payments company", [["PAYMENT VOLUME", "$18.6M", "+6% on October"], ["NET REVENUE", "$242k", "after scheme and bank costs"], ["EARNED ON VOLUME", "1.30%", "net of costs"], ["GROSS MARGIN", "62%", "of net revenue"], ["ACTIVE ACCOUNTS", "3,140", "used this month"], ["CUSTOMER MONEY HELD", "$4.1M", "kept separate from yours"], ["LOSSES", "0.06%", "of volume"], ["COST PER PAYMENT", "$0.11", "processing and support"]], "NET REVENUE, 12 MONTHS", [148, 155, 161, 170, 178, 186, 195, 204, 212, 221, 229, 242], "BY PRODUCT", [["Cards", 128], ["Transfers", 74], ["Currency exchange", 40]]]], cur = 0;
    function draw() {
      var d = D[cur], mx = Math.max.apply(null, d[6].map(function (x) { return x[1]; }));
      el.innerHTML = '<div class="m-tabs nosb" role="group" aria-label="Kind of business">' + D.map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><small>0' + (i + 1) + "</small><b>" + x[0] + "</b></button>"; }).join("") + '</div><div class="a-dash"><div class="a-kp">' + d[2].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-pane"><span class="m-lab">' + d[3] + ", USD THOUSANDS</span>" + bars(d[4]) + '<div class="a-ax"><span>12 ago</span><span>Now</span></div></div><div class="m-pane"><span class="m-lab">' + d[5] + "</span>" + d[6].map(function (x) { return '<div class="m-age" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 52px"><span>' + x[0] + '</span><div><i style="width:' + x[1] / mx * 100 + '%;background:#2450DC"></i></div><b>' + n0(x[1]) + "</b></div>"; }).join("") + '<p class="m-foot" style="padding:0">' + d[1].replace(/\.$/, "") + ". Every figure opens to the entries behind it, and any tile can go straight into a board pack.</p></div></div></div>";
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); draw();
  };

  /* ---------- policies that run the software and inform the company ---------- */
  W.policy = function (el) {
    var P = [["Spending and approvals", "Anyone can spend up to", 500, 100, 5000, 100, "$", function (v) { return ["Bills and card spend up to " + $k(v) + " are approved automatically when they match a known supplier.", "Anything above " + $k(v) + " goes to the budget owner, and above " + $k(v * 10) + " to the finance lead as well.", "Every receipt is collected by an agent. You will only be asked when one is missing."]; }, "Bills over this amount now wait for approval."],
      ["Discounts", "A rep can discount up to", 10, 0, 30, 5, "%", function (v) { return ["Sales can offer up to " + v + "% off list price without asking.", "Larger discounts need finance approval before the contract can be sent for signature.", "Multi-year deals may include a price rise each year, agreed in the contract."]; }, "Contracts above this discount now stop for approval."],
      ["Chasing unpaid invoices", "First reminder after", 3, 1, 14, 1, " days", function (v) { return ["Customers get a friendly reminder " + v + " days after an invoice falls due.", "Follow-ups get firmer at 14 and 30 days, and the account owner is copied at 30.", "Reminders under 14 days are sent automatically. Later ones are approved by finance."]; }, "The collections agent now follows this timing."]], cur = 0, pub = {};
    function fmt(p) { return p[6] === "$" ? $k(p[2]) : p[2] + p[6]; }
    function draw(keep) {
      var p = P[cur];
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form" style="padding:0"><div class="m-list" style="border:0">' + P.map(function (x, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + x[0] + "</b><small>" + x[1] + " " + fmt(x) + '</small></span><span class="m-chip ' + (pub[i] ? "m-blue" : "m-warn") + '">' + (pub[i] ? "PUBLISHED" : "DRAFT") + "</span></button>"; }).join("") + '</div><div style="padding:16px;display:flex;flex-direction:column;gap:8px"><span class="m-lab">THE RULE</span><div class="m-kv" style="border:0"><span>' + p[1] + "</span><b>" + fmt(p) + '</b></div><input type="range" min="' + p[3] + '" max="' + p[4] + '" step="' + p[5] + '" value="' + p[2] + '" aria-label="' + p[1] + '" data-r="1"><p class="m-foot" style="padding:0">Change the rule and the written policy changes with it. Sample policies.</p></div></div>' +
        '<div class="m-pane"><div class="m-page"><div class="m-doch"><b>' + p[0] + '</b><span>Company handbook</span></div><ol class="p-ol">' + p[7](p[2]).map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ol></div>" + (pub[cur] ? '<div class="m-note">' + CHECK + " Published to everyone. " + p[8] + "</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="pub">Publish to the company</button></div>') + "</div></div>";
      var r = el.querySelector("[data-r]"); r.addEventListener("input", function () { p[2] = +this.value; pub[cur] = 0; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); on(el, "[data-a]", function () { pub[cur] = 1; draw(); }); draw();
  };

  /* ---------- bulk approval ---------- */
  W.bulk = function (el) {
    var done = false, X = [["Lattice Legal, new supplier", "$7,400.00", "First invoice from this supplier", 0], ["Orbit Cloud, hosting", "$16,012.40", "38% higher than the last three months", 0], ["Refund to Meridian Labs", "$2,300.00", "Agent is unsure which invoice this reverses", 0]];
    function draw() {
      var left = X.filter(function (x) { return !x[3]; }).length;
      el.innerHTML = '<div class="m-stats">' + stat("PREPARED TODAY", "214") + stat("ROUTINE, MATCH YOUR RULES", done ? "0 waiting" : "211", "m-good") + stat("NEED A LOOK", left, left ? "m-bad" : "") + '</div><div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">ROUTINE</span><div class="m-fl"><span>Bank and card lines matched to a document</span><b>148</b></div><div class="m-fl"><span>Bills from known suppliers, under your limit</span><b>41</b></div><div class="m-fl"><span>Monthly schedule entries</span><b>22</b></div>' + (done ? '<div class="m-note">' + CHECK + " 211 entries posted with one approval. Each one is in the audit trail under your name and can be reversed.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="all">Approve all 211</button></div>') + '<p class="m-foot" style="padding:0">Nothing posts without an approval. You choose how much one approval covers.</p></div>' +
        '<div class="m-pane"><span class="m-lab">PULLED OUT FOR YOU</span>' + X.map(function (x, i) { return '<div class="m-li" style="padding:10px 0"><span><b>' + x[0] + "</b><small>" + x[2] + '</small></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><b>' + x[1] + "</b>" + (x[3] ? '<span class="m-chip m-blue">APPROVED</span>' : '<button type="button" class="m-btn m-sm" data-i="' + i + '">Approve</button>') + "</span></div>"; }).join("") + "</div></div>";
    }
    on(el, "[data-a]", function () { done = true; draw(); }); on(el, "[data-i]", function (t) { X[+t.getAttribute("data-i")][3] = 1; draw(); }); draw();
  };

  /* ---------- revenue forecast from retention, pipeline and hires ---------- */
  W.revplan = function (el) {
    var nrr = 104, pipe = 1, reps = 3, PIPE = [["Ignore", 0], ["At stage odds", 1], ["Everything closes", 2]], SEGS = [["Small", 1120, 22, 92, 71], ["Mid-size", 1840, 14, 106, 76], ["Enterprise", 1060, 5, 118, 79]];
    function draw(keep) {
      var base = 4020 * nrr / 100, pv = pipe === 0 ? 0 : pipe === 1 ? 190 : 348, nb = reps * 40 * 0.75 * 12, tot = base + pv + nb, H = 150, mx = 7200;
      var cols = ""; for (var m = 0; m <= 12; m += 1) { var f = m / 12, a = 4020 + (base - 4020) * f, b = pv * Math.min(f * 2, 1), c = nb * f; cols += '<div class="r-col"><i style="height:' + c / mx * H + 'px;background:#5B8CFF"></i><i style="height:' + b / mx * H + 'px;background:#FFD15C"></i><i style="height:' + a / mx * H + 'px;background:#0B1B3A"></i></div>'; }
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">THREE THINGS DRIVE IT</span><div class="m-kv"><span>Net retention, a year</span><b>' + nrr + '%</b></div><input type="range" min="85" max="125" step="1" value="' + nrr + '" aria-label="Net retention" data-r="1"><div class="m-bench"><span>Your last 12 months: 104%</span></div><div class="m-kv"><span>Open pipeline</span><span class="m-opts">' + PIPE.map(function (p, i) { return '<button type="button" data-a="p" data-v="' + i + '" aria-pressed="' + (i === pipe) + '">' + p[0] + "</button>"; }).join("") + '</span></div><div class="m-kv"><span>Reps selling</span><span class="m-stp"><button type="button" data-a="r-">&minus;</button><output>' + reps + '</output><button type="button" data-a="r+">+</button></span></div><p class="m-foot" style="padding:0">Retention comes from signed contracts, pipeline from your deals, and new business from the hiring plan. Sample quota of $40k a month at 75% attainment.</p></div>' +
        '<div class="m-pane"><span class="m-lab">RECURRING REVENUE, NEXT 12 MONTHS</span><div class="m-stats">' + stat("IN 12 MONTHS", "$" + (tot / 1000).toFixed(2) + "M", "m-good") + stat("GROWTH", "+" + Math.round((tot / 4020 - 1) * 100) + "%") + '</div><div class="r-chart" style="height:' + H + 'px">' + cols + '</div><div class="m-legend" style="font-size:12.5px"><span><i style="background:#0B1B3A"></i>Today\'s customers ' + $k(base) + 'k</span><span><i style="background:#FFD15C;border-color:#FFD15C"></i>Pipeline ' + $k(pv) + 'k</span><span><i style="background:#5B8CFF;border-color:#5B8CFF"></i>New business ' + $k(nb) + "k</span></div></div></div>" +
        '<div class="m-pane" style="border-top:1px solid #D5DBE5"><span class="m-lab">BY SEGMENT</span><div class="r-seg r-hd"><span></span><b>Recurring revenue</b><b>Per customer</b><b>Net retention</b><b>Gross margin</b></div>' + SEGS.map(function (s) { return '<div class="r-seg"><span>' + s[0] + " <small>" + s[2] + " customers</small></span><b>$" + (s[1] / 1000).toFixed(2) + "M</b><b>$" + Math.round(s[1] / s[2]) + "k</b><b>" + s[3] + "%</b><b>" + s[4] + "%</b></div>"; }).join("") + '<p class="m-foot" style="padding:0">Sample figures. Set a different retention or margin for each segment and the forecast follows.</p></div>';
      var r = el.querySelector("[data-r]"); r.addEventListener("input", function () { nrr = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"); if (a === "p") pipe = +t.getAttribute("data-v"); if (a === "r-") reps = Math.max(0, reps - 1); if (a === "r+") reps = Math.min(12, reps + 1); draw(); }); draw();
  };

  /* ---------- pipeline with drag and drop ---------- */
  W.pipeline = function (el) {
    var STG = [["Lead", 10], ["Qualified", 20], ["Demo", 40], ["Proposal", 60], ["Negotiation", 80], ["Won", 100]], D, drag = -1;
    function reset() { D = [["Halden Clinics", 54, 0, "Sofia"], ["Arden Foods", 60, 1, "Daniel"], ["Lumen Dental", 42, 1, "Sofia"], ["Quill Studio", 30, 2, "Sofia"], ["Ferro Marine", 96, 3, "Priya"], ["Pallas Robotics", 84, 4, "Priya"], ["Tallis and Co, 30 more seats", 36, 4, "Daniel"]]; }
    function draw() {
      var open = D.filter(function (d) { return d[2] < 5; }), tot = open.reduce(function (a, d) { return a + d[1]; }, 0), wt = open.reduce(function (a, d) { return a + d[1] * STG[d[2]][1] / 100; }, 0), won = D.filter(function (d) { return d[2] === 5; }).reduce(function (a, d) { return a + d[1]; }, 0);
      el.innerHTML = '<div class="m-stats">' + stat("OPEN PIPELINE", "$" + tot + "k") + stat("COUNTED IN THE FORECAST", "$" + Math.round(wt) + "k", "m-good") + stat("WON HERE", "$" + won + "k") + '</div><div class="m-pipe m-pipe6">' + STG.map(function (st, si) { var ds = D.map(function (d, i) { return [d, i]; }).filter(function (x) { return x[0][2] === si; });
        return '<div class="m-pcol" data-col="' + si + '"><div class="m-grp"><span>' + st[0] + "</span><b>" + (si < 5 ? st[1] + "%" : "") + "</b></div>" + ds.map(function (x) { var d = x[0]; return '<div class="m-deal" draggable="true" data-d="' + x[1] + '"><b>' + d[0] + "</b><small>$" + d[1] + "k a year, " + d[3] + "</small>" + (si < 5 ? '<button type="button" class="m-link" data-i="' + x[1] + '">' + (si === 4 ? "Mark won" : "Move on") + " &rarr;</button>" : '<span class="m-chip m-blue">CONTRACT DRAFTED</span>') + "</div>"; }).join("") + "</div>"; }).join("") + '</div><p class="m-foot">Drag a deal between stages, or tap to move it on. The forecast counts each deal at its stage odds, and a won deal becomes a draft contract with its terms filled in. Sample odds. <button type="button" class="m-link" data-a="r">Reset</button></p>';
    }
    on(el, "[data-i]", function (t) { D[+t.getAttribute("data-i")][2]++; draw(); }); on(el, "[data-a]", function () { reset(); draw(); });
    el.addEventListener("dragstart", function (e) { var t = e.target.closest && e.target.closest("[data-d]"); if (t) { drag = +t.getAttribute("data-d"); if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "" + drag); } catch (x) {} } } });
    el.addEventListener("dragover", function (e) { var c = e.target.closest && e.target.closest("[data-col]"); if (c && drag > -1) { e.preventDefault(); [].forEach.call(el.querySelectorAll(".m-over"), function (x) { x.classList.remove("m-over"); }); c.classList.add("m-over"); } });
    el.addEventListener("drop", function (e) { var c = e.target.closest && e.target.closest("[data-col]"); if (c && drag > -1) { e.preventDefault(); D[drag][2] = +c.getAttribute("data-col"); drag = -1; draw(); } });
    el.addEventListener("dragend", function () { drag = -1; [].forEach.call(el.querySelectorAll(".m-over"), function (x) { x.classList.remove("m-over"); }); });
    reset(); draw();
  };

  /* ---------- contract lifecycle, fuller ---------- */
  W.lifecycle = function (el) {
    var ST = ["Draft", "Negotiate", "Approve", "Sign", "Live", "Renew"], step, arr, log, did, terms;
    function reset() { step = 0; arr = 48000; did = {}; log = [["Drafted by an agent from the won deal in your CRM", "40 seats at $100, 12 months, from your standard template"]]; terms = [["Payment terms", "Net 30", 0], ["Renewal", "Renews automatically, 60 days notice", 0], ["Price on renewal", "List price", 0], ["Liability cap", "12 months of fees", 0]]; }
    function draw() {
      var live = step >= 4, acts = step === 0 ? [["go", "Send to the customer"]] : step === 1 ? [["go", "Accept their changes"]] : step === 2 ? [["go", "Approve the exceptions"]] : step === 3 ? [["go", "Customer signs"]] : [].concat(did.a ? [] : [["amend", "Amend: add 20 seats"]], did.r ? [] : [["renew", "Renew for 12 months"]], [["reset", "Start again"]]);
      var status = ["DRAFT", "CUSTOMER SENT CHANGES", "NEEDS APPROVAL", "OUT FOR SIGNATURE", "LIVE", "RENEWED"][did.r ? 5 : step];
      el.innerHTML = '<div class="m-chain">' + ST.map(function (s, i) { return '<span class="m-node' + (i <= (did.r ? 5 : step) ? " m-first" : "") + '">' + s + "</span>"; }).join('<i aria-hidden="true">&rarr;</i>') + '</div><div class="m-two m-tw2"><div class="m-pane"><div class="m-doch"><b>Harbor Labs, subscription agreement</b><span class="m-chip ' + (live ? "m-blue" : "m-warn") + '">' + status + '</span></div><div class="m-stats">' + stat("RECURRING REVENUE", live ? $k(arr) : "Not yet", live ? "m-good" : "") + stat("SEATS", did.a ? 60 : 40) + stat("ENDS", did.r ? "Nov 2028" : "Nov 2027") + '</div><span class="m-lab">KEY TERMS, READ BY AN AGENT</span>' + terms.map(function (t) { return '<div class="m-kv"><span>' + t[0] + '</span><b style="text-align:right">' + t[1] + (t[2] ? ' <span class="m-chip m-warn">NOT STANDARD</span>' : "") + "</b></div>"; }).join("") +
        (step === 2 ? '<div class="m-note">Two terms differ from your standard contract, so this waits for finance. Net 60 also pushes the first cash receipt out by a month in the forecast.</div>' : "") + (live && !did.r ? '<div class="m-note">Renewal reminder set for 90 days before the end date. An agent will draft the renewal quote.</div>' : "") +
        '<div class="m-acts" style="flex-wrap:wrap">' + acts.map(function (a, i) { return '<button type="button" class="m-btn' + (i > 0 || a[0] === "reset" ? " m-ghost" : "") + '" data-a="' + a[0] + '">' + a[1] + "</button>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">WHAT HAPPENED, AND WHAT IT CHANGED</span>' + log.slice().reverse().map(function (l) { return '<div class="m-li" style="padding:9px 0"><span><b>' + l[0] + "</b><small>" + l[1] + "</small></span></div>"; }).join("") + '<p class="m-foot" style="padding:0">Nothing counts as revenue until the contract is signed. After that every change goes through an amendment, and agents never alter signed terms.</p></div></div>';
    }
    on(el, "[data-a]", function (t) {
      var a = t.getAttribute("data-a");
      if (a === "reset") reset();
      else if (a === "go") { step++;
        if (step === 1) { terms[0] = ["Payment terms", "Net 60", 1]; terms[2] = ["Price on renewal", "Rise capped at 5%", 1]; log.push(["Customer returned the contract with changes", "Asked for net 60 and a 5% cap on renewal price. The agent marked both as outside your standard terms"]); }
        if (step === 2) log.push(["Changes accepted, sent for internal approval", "Two non-standard terms need finance sign-off"]);
        if (step === 3) log.push(["Approved by finance, sent for signature", "Terms locked, signing link sent to Tom Reyes"]);
        if (step === 4) log.push(["Signed on the platform. Contract is live", "Booked $48,000 of recurring revenue, 12 invoices scheduled on net 60, commission accrued, forecast updated"]); }
      else if (a === "amend") { did.a = 1; arr += 24000; log.push(["Amendment signed: 20 more seats", "Upsell of $24,000, a part-month invoice drafted, revenue schedule and commission updated"]); }
      else if (a === "renew") { did.r = 1; log.push(["Renewed for 12 months", "End date moved to Nov 2028, price held within the 5% cap, removed from the at-risk list in the forecast"]); }
      draw();
    });
    reset(); draw();
  };

  /* ---------- recurring revenue, customer by customer ---------- */
  W.arr = function (el) {
    var TR = [2640, 2750, 2860, 2970, 3080, 3190, 3300, 3432, 3576, 3720, 3860, 4020], MO = ["D", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N"];
    var MV = [["New", 180, "#2450DC"], ["Upsell", 96, "#5B8CFF"], ["Downsell", -24, "#C99A2E"], ["Churn", -92, "#8A5A00"]];
    var CU = [["Kestrel Freight", 0, 72, "New", "Nov 2027", "Mid-size"], ["Oakline Health", 0, 60, "New", "Nov 2027", "Mid-size"], ["Harbor Labs", 0, 48, "New", "Nov 2027", "Small"], ["Northwind Ltd", 72, 132, "Upsell", "Mar 2028", "Enterprise"], ["Tallis and Co", 54, 90, "Upsell", "Jun 2027", "Mid-size"], ["Brightdesk", 96, 72, "Downsell", "Feb 2027", "Mid-size"], ["Meridian Labs", 92, 0, "Churn", "Ended", "Small"], ["Corvid Systems", 180, 180, "No change", "Jan 2027", "Enterprise"], ["Atlas Payroll", 144, 144, "No change", "Sep 2027", "Enterprise"]], f = "All";
    function draw() {
      var rows = CU.filter(function (c) { return f === "All" || c[3] === f; }), mx = 180, F = ["All", "New", "Upsell", "Downsell", "Churn", "No change"];
      el.innerHTML = '<div class="a-kp">' + [["RECURRING REVENUE", "$4.02M", "+4.1% on October"], ["NET NEW", "+$160k", "$276k gained, $116k lost"], ["NET RETENTION", "99.5%", "this month"], ["CUSTOMERS", "41", "3 new, 1 lost"]].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-pane"><span class="m-lab">12 MONTHS, USD THOUSANDS</span>' + bars(TR) + '<div class="a-ax a-mo">' + MO.map(function (m) { return "<span>" + m + "</span>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">WHAT MOVED IN NOVEMBER. TAP ONE.</span>' + MV.map(function (m) { return '<button type="button" class="a-mv" data-f="' + m[0] + '" aria-pressed="' + (f === m[0]) + '"><span>' + m[0] + '</span><i><u style="width:' + Math.abs(m[1]) / 180 * 100 + "%;background:" + m[2] + '"></u></i><b>' + (m[1] > 0 ? "+" : "") + m[1] + "</b></button>"; }).join("") + '<div class="m-fl" style="margin-top:6px"><span>Opening 3,860, closing</span><b>4,020</b></div></div></div>' +
        '<div class="a-tbl"><div class="a-th">' + seg(F, F.indexOf(f), "x") + '</div><div class="a-row a-hd"><span>Customer</span><span class="a-hide">Segment</span><span>Before</span><span>Now</span><span class="a-bar"></span><span>Change</span><span class="a-hide">Renews</span></div>' + rows.map(function (c) { var d = c[2] - c[1]; return '<div class="a-row"><span><b>' + c[0] + '</b></span><span class="a-hide">' + c[5] + "</span><span>" + c[1] + "</span><span><b>" + c[2] + '</b></span><span class="a-bar"><i><u style="width:' + c[2] / mx * 100 + '%"></u></i></span><span class="' + (d > 0 ? "sl-up" : d < 0 ? "sl-dn" : "") + '"><b>' + (d > 0 ? "+" : "") + (d || "0") + '</b></span><span class="a-hide">' + c[4] + "</span></div>"; }).join("") + '<p class="m-foot">' + (f === "All" || f === "No change" ? "Showing 9 of 41 customers. " : "") + "USD thousands a year. Every figure comes from a signed contract, so it ties to the invoices and to the $335k recognized this month.</p></div>";
    }
    on(el, "[data-f]", function (t) { var v = t.getAttribute("data-f"); f = f === v ? "All" : v; draw(); });
    on(el, "[data-x]", function (t) { f = ["All", "New", "Upsell", "Downsell", "Churn", "No change"][+t.getAttribute("data-x")]; draw(); }); draw();
  };

  /* ---------- comparison: twelve jobs, by category ---------- */
  W.compare = function (el) {
    var G = [["Revenue", ["Customers and deals", "Contracts", "Billing and collections", "Commissions"]], ["Books", ["Bookkeeping", "Bills and payroll", "Month-end close", "Statements"]], ["Plan", ["Forecast", "Scenarios", "Board packs", "Analytics"]]];
    var JOBS = G[0][1].concat(G[1][1], G[2][1]);
    var C = [["Spreadsheets", "Flexible, and all by hand", [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "Can do anything, and all of it by hand."],
      ["Accounting software", "The traditional small-business ledger", [0, 0, 2, 0, 1, 1, 1, 2, 1, 0, 0, 1], "Solid books and invoices. The bookkeeping is still mostly yours to do, and planning stops at a basic budget."],
      ["Bookkeeping firms", "People who keep the books for you", [0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0], "The work gets done, by people, usually weeks after the month ends."],
      ["ERPs", "Broad systems for larger companies", [1, 1, 2, 0, 1, 2, 1, 2, 1, 1, 0, 1], "Broad and configurable. Much of the work is manual, and planning is usually a separate module."],
      ["AI-native accounting", "Newer ledgers with automation built in", [0, 1, 2, 0, 2, 2, 2, 2, 1, 0, 1, 1], "The closest to us on the books, often with billing. Planning tends to be newer and lighter."],
      ["CRMs", "Where sales tracks customers and deals", [2, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], "Strong on customers and pipeline. What was actually signed and billed lives somewhere else."],
      ["Contract tools", "Drafting, approval and signature", [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "Good at getting a contract signed. The terms then have to be re-entered for billing and revenue."],
      ["Billing tools", "Subscriptions, invoices and chasing", [0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1], "Subscriptions and invoices, then the numbers are sent to your accounting system."],
      ["Spend and bill-pay tools", "Cards, expenses and paying suppliers", [0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 1], "Good control of spending and supplier payments. The entries still have to land in a ledger somewhere else."],
      ["Planning tools", "Forecasts and models", [0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2], "Strong forecasting, on numbers imported from somewhere else."],
      ["Commission tools", "Sales pay calculations", [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0], "One job done well, fed by your CRM and billing data."]];
    var use = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], open = -1;
    function cells(v, cls) { var h = "", n = 0; G.forEach(function (g) { h += '<span class="m-cg m-cg4">'; g[1].forEach(function () { h += '<i class="m-c' + v[n] + '" title="' + JOBS[n] + '"></i>'; n++; }); h += "</span>"; }); return '<span class="m-cells ' + (cls || "") + '">' + h + "</span>"; }
    function draw() {
      var picked = C.filter(function (c, i) { return use[i]; }), un = JOBS.map(function (j, n) { return picked.reduce(function (a, c) { return Math.max(a, c[2][n]); }, 0); });
      var hand = un.filter(function (x) { return x === 1; }).length, none = JOBS.filter(function (j, n) { return un[n] === 0; }), N = picked.length, ones = JOBS.map(function () { return 2; });
      el.innerHTML = '<div class="m-ckey">' + G.map(function (g) { return "<div><b>" + g[0] + "</b><span>" + g[1].join(" &middot; ") + "</span></div>"; }).join("") + '</div><div class="m-cmp"><div class="m-clist"><div class="m-crow m-chead"><span></span><span class="m-cells">' + G.map(function (g) { return '<span class="m-cg"><b>' + g[0] + "</b></span>"; }).join("") + "</span></div>" + C.map(function (c, i) {
        return '<div class="m-crow' + (use[i] ? " m-on" : "") + '"><span class="m-cname"><button type="button" class="m-tick" data-u="' + i + '" aria-pressed="' + !!use[i] + '" aria-label="I use ' + c[0] + '">' + (use[i] ? "&#10003;" : "") + '</button><button type="button" class="m-cn" data-o="' + i + '" aria-expanded="' + (open === i) + '"><b>' + c[0] + "</b><small>" + c[1] + "</small></button></span>" + cells(c[2]) + "</div>" +
          (open === i ? '<div class="m-cdet"><p>' + c[3] + "</p><div>" + JOBS.map(function (j, n) { return '<span><i class="m-c' + c[2][n] + '"></i>' + j + "</span>"; }).join("") + "</div></div>" : "");
      }).join("") + '</div><div class="m-cside"><div class="m-cyou"><span class="m-lab">YOUR STACK TODAY</span>' + (N ? "<b>" + N + (N === 1 ? " tool" : " tools") + "</b>" + cells(un) + '<div class="m-fl"><span>Jobs still done by hand</span><b>' + hand + ' of 12</b></div><div class="m-fl"><span>Not covered</span><b>' + (none.length ? none.join(", ") : "Nothing") + '</b></div><div class="m-fl"><span>Connections to keep in sync</span><b>' + (N > 1 ? "At least " + (N - 1) : "None") + "</b></div>" : '<p class="m-p">Tick what you use on the left.</p>') + '</div><div class="m-cus"><span class="m-lab" style="color:#C7D2E6">COUNTAHEAD</span><b>1 system</b>' + cells(ones, "m-inv") + '<div class="m-fl"><span>Jobs done by agents, approved by you</span><b>12 of 12</b></div><div class="m-fl"><span>Connections to keep in sync</span><b>None</b></div><p>The customer, the contract, the ledger and the forecast are the same data, so nothing is exported or retyped.</p></div></div></div>';
    }
    on(el, "[data-u]", function (t) { var i = +t.getAttribute("data-u"); use[i] = use[i] ? 0 : 1; draw(); });
    on(el, "[data-o]", function (t) { var i = +t.getAttribute("data-o"); open = open === i ? -1 : i; draw(); }); draw();
  };
})();

/* Round five: customer record and recurring revenue views. Sample data. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function seg(items, cur, attr) { return '<div class="m-filters">' + items.map(function (x, i) { return '<button type="button" data-' + attr + '="' + i + '" aria-pressed="' + (i === cur) + '">' + x + "</button>"; }).join("") + "</div>"; }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function bars(vals) { var mx = Math.max.apply(null, vals); return '<div class="a-bars">' + vals.map(function (v, i) { return '<i style="height:' + (v / mx * 100).toFixed(1) + "%;background:" + (i === vals.length - 1 ? "#2450DC" : "#B9C3D3") + '"></i>'; }).join("") + "</div>"; }

  /* ---------- customer record ---------- */
  W.customer = function (el) {
    var H = { g: ["Healthy", "#2450DC"], w: ["Watch", "#C99A2E"], r: ["At risk", "#8A5A00"] };
    var CU = [
      { n: "Northwind Ltd", ind: "Logistics", seg: "Enterprise", geo: "United Kingdom", own: "Daniel", arr: 132, h: "r", since: "Mar 2024", billed: "$286k", pay: "41 days", con: "110 seats, 24 months", ren: "Mar 2028", owe: "$18,000 overdue by 34 days", sp: [72, 72, 72, 72, 72, 132], act: "Invoice INV-0141 is 34 days overdue. A third follow-up is drafted and waiting for you.", ppl: [["Elena Novak", "Finance Manager", "Pays invoices"], ["Sam Okafor", "COO", "Signed the contract"], ["Ravi Shah", "Head of Operations", "Day-to-day contact"]], tl: [["Nov 18", "Second payment reminder sent", "Collections"], ["Nov 3", "Upsell signed, 50 more seats, +$60k", "Contract"], ["Oct 17", "Invoice INV-0141 sent, $18,000", "Billing"], ["Sep 30", "Paid INV-0128, 12 days late", "Bank"]] },
      { n: "Harbor Labs", ind: "Software", seg: "Small", geo: "United States", own: "Priya", arr: 48, h: "g", since: "Nov 2026", billed: "$12k", pay: "On time", con: "40 seats, 12 months", ren: "Nov 2027", owe: "Nothing overdue", sp: [0, 0, 0, 0, 0, 48], act: "New this month. Implementation kicks off on December 1.", ppl: [["Maya Chen", "Head of Finance", "Pays invoices"], ["Tom Reyes", "VP Operations", "Signed the contract"]], tl: [["Nov 20", "Contract signed on the platform", "Contract"], ["Nov 20", "First invoice sent, $12,000", "Billing"], ["Nov 12", "Proposal accepted", "Deal"], ["Oct 28", "Demo with Priya", "Deal"]] },
      { n: "Brightdesk", ind: "Software", seg: "Mid-size", geo: "United States", own: "Sofia", arr: 72, h: "w", since: "Feb 2025", billed: "$164k", pay: "9 days", con: "60 seats, 12 months", ren: "Feb 2027", owe: "Nothing overdue", sp: [96, 96, 96, 96, 96, 72], act: "Cut 10 seats this month and renews in under 90 days. Worth a call before the renewal quote goes out.", ppl: [["Dana Whitlock", "Controller", "Pays invoices"], ["Luis Ortega", "CEO", "Signed the contract"]], tl: [["Nov 9", "Amendment signed, 10 fewer seats, -$24k", "Contract"], ["Nov 1", "Paid INV-0139 on time", "Bank"], ["Oct 14", "Support ticket about seat usage", "Note"]] },
      { n: "Kestrel Freight", ind: "Freight", seg: "Mid-size", geo: "Europe", own: "Priya", arr: 72, h: "g", since: "Nov 2026", billed: "$6k", pay: "On time", con: "60 seats, 12 months", ren: "Nov 2027", owe: "$6,000 due in 5 days", sp: [0, 0, 0, 0, 0, 72], act: "Nothing needed. First invoice is due in 5 days.", ppl: [["Jon Halvorsen", "Controller", "Pays invoices and signed"]], tl: [["Nov 14", "Contract signed on the platform", "Contract"], ["Nov 14", "First invoice sent, $6,000", "Billing"]] },
      { n: "Corvid Systems", ind: "Software", seg: "Enterprise", geo: "United States", own: "Daniel", arr: 180, h: "g", since: "Jan 2024", billed: "$512k", pay: "6 days", con: "150 seats, 36 months", ren: "Jan 2027", owe: "Nothing overdue", sp: [150, 150, 180, 180, 180, 180], act: "Largest customer, renews in January. The renewal quote is drafted.", ppl: [["Ines Duarte", "VP Finance", "Pays invoices"], ["Paul Brandt", "CTO", "Signed the contract"]], tl: [["Nov 15", "Renewal quote drafted by an agent", "Contract"], ["Nov 2", "Paid INV-0137 on time", "Bank"]] }], sel = 0, f = 0, tab = 0;
    function draw() {
      var list = CU.map(function (c, i) { return [c, i]; }).filter(function (x) { return f === 0 || (f === 1 && x[0].h !== "g") || (f === 2 && /Jan 2027|Feb 2027/.test(x[0].ren)); });
      var c = CU[sel], h = H[c.h], mx = Math.max.apply(null, c.sp) || 1;
      var body = tab === 0 ? '<div class="cx-two"><div><span class="m-lab">CONTRACT</span><div class="m-fl"><span>Terms</span><b>' + c.con + '</b></div><div class="m-fl"><span>Renews</span><b>' + c.ren + '</b></div><div class="m-fl"><span>Owed to you</span><b>' + c.owe + '</b></div><div class="m-fl"><span>Usually pays in</span><b>' + c.pay + '</b></div></div><div><span class="m-lab">RECURRING REVENUE, 6 MONTHS</span><div class="a-bars" style="height:92px">' + c.sp.map(function (v, i) { return '<i style="height:' + Math.max(v / mx * 100, 2) + "%;background:" + (i === 5 ? "#2450DC" : "#B9C3D3") + '"></i>'; }).join("") + '</div></div></div><div class="m-note">' + CHECK + " <strong>Suggested next step.</strong> " + c.act + "</div>"
        : tab === 1 ? c.tl.map(function (t) { return '<div class="cx-tl"><small>' + t[0] + "</small><span><b>" + t[1] + '</b></span><span class="m-chip">' + t[2].toUpperCase() + "</span></div>"; }).join("") + '<p class="m-foot" style="padding:8px 0 0">Deals, contracts, invoices and payments in one timeline, because they live in one system.</p>'
        : c.ppl.map(function (p) { return '<div class="cx-tl"><i class="cx-av">' + p[0].split(" ").map(function (w) { return w.charAt(0); }).join("") + "</i><span><b>" + p[0] + "</b><small>" + p[1] + '</small></span><span class="m-chip m-blue">' + p[2].toUpperCase() + "</span></div>"; }).join("");
      el.innerHTML = '<div class="cx-crm"><div class="cx-side"><div class="cx-find"><span>Search 41 customers</span></div>' + seg(["All", "Needs attention", "Renewing soon"], f, "f") + '<div class="cx-list">' + (list.length ? list.map(function (x) { var k = x[0]; return '<button type="button" class="cx-row" data-i="' + x[1] + '" aria-pressed="' + (x[1] === sel) + '"><i style="background:' + H[k.h][1] + '"></i><span><b>' + k.n + "</b><small>" + k.seg + ", renews " + k.ren + "</small></span><b>$" + k.arr + "k</b></button>"; }).join("") : '<p class="m-foot">No customers match.</p>') + '</div></div><div class="cx-main"><div class="cx-head"><div><b>' + c.n + "</b><small>" + c.ind + " &middot; " + c.geo + " &middot; customer since " + c.since + '</small></div><span class="cx-health" style="background:' + h[1] + '">' + h[0].toUpperCase() + '</span></div><div class="a-kp">' + [["RECURRING REVENUE", "$" + c.arr + "k", "a year"], ["BILLED TO DATE", c.billed, "since " + c.since], ["SEGMENT", c.seg, c.geo], ["OWNER", c.own, "account owner"]].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + "</div>" + seg(["Overview", "Activity", "People"], tab, "t") + '<div class="cx-body">' + body + "</div></div></div>";
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-f]", function (t) { f = +t.getAttribute("data-f"); draw(); });
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); draw();
  };

  /* ---------- recurring revenue with cohorts, geography and segments ---------- */
  W.arr = function (el) {
    var TR = [2640, 2750, 2860, 2970, 3080, 3190, 3300, 3432, 3576, 3720, 3860, 4020], MO = ["D", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N"];
    var MV = [["New", 180, "#2450DC"], ["Upsell", 96, "#5B8CFF"], ["Downsell", -24, "#C99A2E"], ["Churn", -92, "#8A5A00"]];
    var CU = [["Kestrel Freight", 0, 72, "New", "Nov 2027", "Mid-size"], ["Oakline Health", 0, 60, "New", "Nov 2027", "Mid-size"], ["Harbor Labs", 0, 48, "New", "Nov 2027", "Small"], ["Northwind Ltd", 72, 132, "Upsell", "Mar 2028", "Enterprise"], ["Tallis and Co", 54, 90, "Upsell", "Jun 2027", "Mid-size"], ["Brightdesk", 96, 72, "Downsell", "Feb 2027", "Mid-size"], ["Meridian Labs", 92, 0, "Churn", "Ended", "Small"], ["Corvid Systems", 180, 180, "No change", "Jan 2027", "Enterprise"], ["Atlas Payroll", 144, 144, "No change", "Sep 2027", "Enterprise"]];
    var COH = [["2025 Q4", 9, [100, 101, 104, 108, 112]], ["2026 Q1", 8, [100, 102, 103, 106]], ["2026 Q2", 10, [100, 99, 103]], ["2026 Q3", 9, [100, 101]], ["2026 Q4 so far", 5, [100]]];
    var GEO = [["United States", 2610, 27], ["United Kingdom", 804, 8], ["Europe", 606, 6]], SEG = [["Small, under 50 people", 1120, 22, 92], ["Mid-size", 1840, 14, 106], ["Enterprise", 1060, 5, 118]];
    var f = "All", view = 0, F = ["All", "New", "Upsell", "Downsell", "Churn", "No change"];
    function split(rows, withRet) { return '<div class="m-pane">' + rows.map(function (g) { return '<div class="m-li" style="padding:11px 0"><span style="flex:1"><b>' + g[0] + "</b><small>" + g[2] + " customers, $" + Math.round(g[1] / g[2]) + "k each on average" + (withRet ? ", net retention " + g[3] + "% a year" : "") + '</small><span class="m-track" style="margin-top:6px"><i style="width:' + g[1] / 4020 * 100 + '%"></i></span></span><b>$' + (g[1] / 1000).toFixed(2) + "M<small style=\"display:block;font-weight:500;color:#4B5565\">" + Math.round(g[1] / 4020 * 100) + "% of total</small></b></div>"; }).join("") + "</div>"; }
    function draw() {
      var rows = CU.filter(function (c) { return f === "All" || c[3] === f; }), body;
      if (view === 0) body = '<div class="a-th">' + seg(F, F.indexOf(f), "x") + '</div><div class="a-row a-hd"><span>Customer</span><span class="a-hide">Segment</span><span>Before</span><span>Now</span><span class="a-bar"></span><span>Change</span><span class="a-hide">Renews</span></div>' + rows.map(function (c) { var d = c[2] - c[1]; return '<div class="a-row"><span><b>' + c[0] + '</b></span><span class="a-hide">' + c[5] + "</span><span>" + c[1] + "</span><span><b>" + c[2] + '</b></span><span class="a-bar"><i><u style="width:' + c[2] / 180 * 100 + '%"></u></i></span><span class="' + (d > 0 ? "sl-up" : d < 0 ? "sl-dn" : "") + '"><b>' + (d > 0 ? "+" : "") + (d || "0") + '</b></span><span class="a-hide">' + c[4] + "</span></div>"; }).join("") + '<p class="m-foot">' + (f === "All" || f === "No change" ? "Showing 9 of 41 customers. " : "") + "USD thousands a year. Every figure comes from a signed contract.</p>";
      else if (view === 1) body = '<div class="m-pane"><div class="k-row k-hd"><span>Joined in</span><b>Start</b><b>+3 mo</b><b>+6 mo</b><b>+9 mo</b><b>+12 mo</b></div>' + COH.map(function (c) { return '<div class="k-row"><span><b>' + c[0] + "</b><small>" + c[1] + " customers</small></span>" + [0, 1, 2, 3, 4].map(function (n) { var v = c[2][n]; return v == null ? '<b class="k-e"></b>' : '<b style="background:' + (v >= 100 ? "rgba(36,80,220," + (0.08 + Math.min((v - 100) / 28, 0.45)).toFixed(2) + ")" : "#FFE9A8") + '">' + v + "%</b>"; }).join("") + "</div>"; }).join("") + '<p class="m-foot" style="padding:8px 0 0">Recurring revenue kept from each group of customers, as a share of where they started. Above 100% means upsells outweigh what was lost.</p></div>';
      else body = split(view === 2 ? GEO : SEG, view === 3);
      el.innerHTML = '<div class="a-kp">' + [["RECURRING REVENUE", "$4.02M", "+4.1% on October"], ["NET NEW", "+$160k", "$276k gained, $116k lost"], ["NET RETENTION", "99.5%", "this month"], ["GROSS RETENTION", "97.0%", "this month"], ["CUSTOMERS", "41", "3 new, 1 lost"], ["AVERAGE PER CUSTOMER", "$98k", "a year"], ["CUSTOMERS LOST", "2.5%", "1 of 40 this month"], ["GAINED PER $1 LOST", "$2.38", "new and upsell over losses"]].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-pane"><span class="m-lab">12 MONTHS, USD THOUSANDS</span>' + bars(TR) + '<div class="a-ax a-mo">' + MO.map(function (m) { return "<span>" + m + "</span>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">WHAT MOVED IN NOVEMBER. TAP ONE.</span>' + MV.map(function (m) { return '<button type="button" class="a-mv" data-f="' + m[0] + '" aria-pressed="' + (f === m[0] && view === 0) + '"><span>' + m[0] + '</span><i><u style="width:' + Math.abs(m[1]) / 180 * 100 + "%;background:" + m[2] + '"></u></i><b>' + (m[1] > 0 ? "+" : "") + m[1] + "</b></button>"; }).join("") + '<div class="m-fl" style="margin-top:6px"><span>Opening 3,860, closing</span><b>4,020</b></div></div></div><div class="a-tbl"><div class="a-views">' + ["By customer", "By cohort", "By geography", "By segment"].map(function (x, i) { return '<button type="button" data-v="' + i + '" aria-pressed="' + (i === view) + '">' + x + "</button>"; }).join("") + "</div>" + body + "</div>";
    }
    on(el, "[data-f]", function (t) { var v = t.getAttribute("data-f"); f = f === v ? "All" : v; view = 0; draw(); });
    on(el, "[data-x]", function (t) { f = F[+t.getAttribute("data-x")]; draw(); });
    on(el, "[data-v]", function (t) { view = +t.getAttribute("data-v"); draw(); }); draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function M(v) { return (v < 0 ? "-" : "") + "$" + (Math.abs(v) / 1000).toFixed(2) + "M"; }
  function when(m) { var d = new Date(2026, 10 + m, 1); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()] + " " + d.getFullYear(); }
  function sim(s) { var cash = 3060, rev = 335, opx = 178, out = null, be = null, C = [3060], A = [4020], B = [215]; for (var m = 1; m <= 96; m++) { rev *= 1 + s.g / 100; opx *= 1 + s.c / 100; var burn = 372 + s.h * 17 + opx - rev; cash -= burn; if (out === null && cash <= 0) out = m; if (be === null && burn <= 0) be = m; if (m <= 24) { C.push(Math.max(cash, 0)); A.push(rev * 12); B.push(burn); } } return { C: C, A: A, B: B, out: be !== null && (out === null || be < out) ? null : out, be: be }; }

  /* ---------- scenarios ---------- */
  W.scen = function (el) {
    var SC = [{ n: "Downside", t: "Growth stalls, costs hold", g: 0.5, h: 0, c: 1, col: "#8A5A00" }, { n: "Base", t: "The plan as it stands", g: 2, h: 0, c: 1, col: "#0B1B3A" }, { n: "Upside", t: "Invest in sales, grow faster", g: 4, h: 3, c: 1, col: "#2450DC" }], sel = 1, met = 0, MET = [["Cash", "C"], ["Recurring revenue", "A"], ["Monthly burn", "B"]];
    function draw(keep) {
      var R = SC.map(sim), k = MET[met][1], all = [].concat(R[0][k], R[1][k], R[2][k]), mx = Math.max.apply(null, all), mn = Math.min(0, Math.min.apply(null, all)), Wd = 640, H = 270, L = 52, Rr = 14, T = 14, Bt = 28;
      function X(m) { return L + m / 24 * (Wd - L - Rr); } function Y(v) { return T + (mx - v) / (mx - mn || 1) * (H - T - Bt); }
      var step = (mx - mn) / 4, grid = ""; for (var i = 0; i <= 4; i++) { var v = mn + step * i; grid += '<line x1="' + L + '" x2="' + (Wd - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (Math.abs(v) < 1 ? "#0B1B3A" : "#E3E7EE") + '"></line><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="#4B5565">' + (met === 2 ? "$" + Math.round(v) + "k" : "$" + (v / 1000).toFixed(1) + "M") + "</text>"; }
      var xs = [0, 6, 12, 18, 24].map(function (m) { return '<text x="' + X(m) + '" y="' + (H - 8) + '" text-anchor="' + (m === 0 ? "start" : m === 24 ? "end" : "middle") + '" font-size="11" fill="#4B5565">' + when(m) + "</text>"; }).join("");
      var order = [0, 1, 2].filter(function (i) { return i !== sel; }).concat([sel]);
      var lines = order.map(function (i) { var pts = R[i][k].map(function (v, m) { return X(m).toFixed(1) + "," + Y(v).toFixed(1); }); return (i === sel ? '<polygon fill="' + SC[i].col + '" opacity=".08" points="' + X(0) + "," + Y(mn) + " " + pts.join(" ") + " " + X(24) + "," + Y(mn) + '"></polygon>' : "") + '<polyline fill="none" stroke="' + SC[i].col + '" stroke-width="' + (i === sel ? 4 : 2) + '"' + (i === sel ? "" : ' stroke-dasharray="5 5" opacity=".75"') + ' points="' + pts.join(" ") + '"></polyline>' + (met === 0 && R[i].out !== null && R[i].out <= 24 ? '<circle cx="' + X(R[i].out) + '" cy="' + Y(0) + '" r="5.5" fill="#FFD15C" stroke="#0B1B3A" stroke-width="1.5"></circle>' : ""); }).join("");
      var s = SC[sel], base = R[1];
      function run(r) { return r.out === null ? (r.be !== null ? "Self-funding" : "8+ years") : r.out + " months"; }
      function cost(i) { if (i === 1) return "The reference case. Every other path is measured against it."; var r = R[i], dA = r.A[18] - base.A[18], dC = r.C[18] - base.C[18]; return (dA >= 0 ? "+" : "-") + M(Math.abs(dA)).replace("-", "") + " recurring revenue and " + (dC >= 0 ? "+" : "-") + M(Math.abs(dC)).replace("-", "") + " cash against base, 18 months in."; }
      el.innerHTML = '<div class="s-cards">' + SC.map(function (x, i) { var r = R[i], mxx = Math.max.apply(null, r.C) || 1; return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === sel) + '" style="--sc:' + x.col + '"><small>' + x.n.toUpperCase() + "</small><b>" + run(r) + "</b><span>" + (r.out === null ? (r.be !== null ? "Breaks even " + when(r.be) : "Never runs out") : "Cash out " + when(r.out)) + '</span><svg viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="' + x.col + '" stroke-width="2.5" points="' + r.C.map(function (v, m) { return (m / 24 * 100).toFixed(1) + "," + (24 - v / mxx * 22).toFixed(1); }).join(" ") + '"></polyline></svg><em>' + x.t + "</em></button>"; }).join("") + "</div>" +
        '<div class="s-main"><div class="s-chart"><div class="s-top"><span class="m-lab">NEXT 24 MONTHS</span><div class="m-opts">' + MET.map(function (m, i) { return '<button type="button" data-m="' + i + '" aria-pressed="' + (i === met) + '">' + m[0] + '</button>'; }).join("") + '</div></div><svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="' + MET[met][0] + ' over 24 months for three scenarios" style="width:100%;height:auto;display:block">' + grid + xs + lines + '</svg><div class="m-legend" style="font-size:12.5px">' + SC.map(function (x) { return '<span><i style="background:' + x.col + ";border-color:" + x.col + '"></i>' + x.n + "</span>"; }).join("") + (met === 0 ? '<span><i style="background:#FFD15C;border-color:#0B1B3A;border-radius:50%"></i>Cash runs out</span>' : "") + "</div></div>" +
        '<div class="s-side"><span class="m-lab" style="color:' + s.col + '">' + s.n.toUpperCase() + ": WHAT IT ASSUMES</span>" + [["Revenue growth a month", "g", 0, 6, 0.5, "%"], ["Cost growth a month", "c", 0, 3, 0.5, "%"]].map(function (d) { return '<div class="m-kv" style="border:0;padding-bottom:0"><span>' + d[0] + "</span><b>" + s[d[1]] + d[5] + '</b></div><input type="range" min="' + d[2] + '" max="' + d[3] + '" step="' + d[4] + '" value="' + s[d[1]] + '" aria-label="' + d[0] + '" data-r="' + d[1] + '">'; }).join("") + '<div class="m-kv"><span>New hires in January</span><span class="m-stp"><button type="button" data-a="h-">&minus;</button><output>' + s.h + '</output><button type="button" data-a="h+">+</button></span></div><p class="m-foot" style="padding:0">Each hire at a sample $17k a month. All three start from the same closed books.</p></div></div>' +
        '<div class="s-tbl"><div class="s-row s-hd"><span>18 months in</span>' + SC.map(function (x, i) { return '<b style="color:' + x.col + '"' + (i === sel ? ' class="s-on"' : "") + ">" + x.n + "</b>"; }).join("") + "</div>" + [["Recurring revenue", function (r) { return M(r.A[18]); }], ["Monthly burn", function (r) { return r.B[18] <= 0 ? "Profitable" : "$" + Math.round(r.B[18]) + "k"; }], ["Cash left", function (r) { return M(r.C[18]); }], ["Runway from today", run], ["People", function (r, i) { return 24 + SC[i].h; }]].map(function (row) { return '<div class="s-row"><span>' + row[0] + "</span>" + R.map(function (r, i) { return "<b" + (i === sel ? ' class="s-on"' : "") + ">" + row[1](r, i) + "</b>"; }).join("") + "</div>"; }).join("") + '<div class="s-row s-cost"><span>The cost of choosing it</span>' + SC.map(function (x, i) { return "<b" + (i === sel ? ' class="s-on"' : "") + ">" + cost(i) + "</b>"; }).join("") + "</div></div>";
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { SC[sel][r.getAttribute("data-r")] = +this.value; draw(r.getAttribute("data-r")); }); });
      if (keep) { var fo = el.querySelector('[data-r="' + keep + '"]'); if (fo) fo.focus(); }
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-m]", function (t) { met = +t.getAttribute("data-m"); draw(); });
    on(el, "[data-a]", function (t) { SC[sel].h = Math.max(0, Math.min(10, SC[sel].h + (t.getAttribute("data-a") === "h+" ? 1 : -1))); draw(); }); draw();
  };
})();

/* Page logic added on top of the homepage component: integrations list, boot, in-page navigation. */
(function () {
  var INTEG = [
    ["Plaid", "Banking", "Bank feeds for US accounts."], ["Mercury", "Banking", "Balances and transactions as they clear."],
    ["Wise", "Banking", "Multi-currency balances and transfers."], ["Revolut Business", "Banking", "Accounts and cards across currencies."],
    ["Brex", "Spend", "Cards, receipts and reimbursements."], ["Ramp", "Spend", "Cards, bills and receipts."],
    ["Stripe", "Payments", "Charges, payouts, fees and subscriptions."], ["PayPal", "Payments", "Payments, fees and payouts."],
    ["Shopify", "Commerce", "Orders, refunds and payouts."], ["Amazon", "Commerce", "Settlements and marketplace fees."],
    ["Gusto", "Payroll", "Payroll runs and payroll taxes."], ["Rippling", "Payroll", "Payroll and headcount changes."],
    ["Deel", "Payroll", "Contractors and international payroll."], ["Remote", "Payroll", "International employment and payroll."], ["Square", "Commerce", "Till sales, tips and payouts."], ["Toast", "Commerce", "Restaurant sales, tips and payouts."], ["eBay and Etsy", "Commerce", "Marketplace orders, fees and payouts."],
    ["Gmail", "Context", "Invoices and receipts from the inbox."], ["Slack", "Context", "Approvals and questions where you work."],
    ["Claude", "Context", "Ask your books from Claude."],
    ["HubSpot", "Deals", "Closed deals and contract values."], ["Salesforce", "Deals", "Closed deals and contract values."],
    ["DocuSign", "Deals", "Signed contracts and their terms."],
    ["Stripe Atlas", "Setup", "Books that start the day the company is formed."]
  ];
  var CATS = ["All", "Banking", "Spend", "Payments", "Commerce", "Payroll", "Context", "Deals", "Setup"];
  class Site extends Component {
    renderVals() {
      var v = super.renderVals(), self = this, cat = (this.state && this.state.cat) || "All";
      v.integCats = CATS.map(function (c) {
        var on = c === cat;
        return { label: c, pressed: on ? "true" : "false", bg: on ? "var(--ink)" : "#FFFFFF", fg: on ? "#FFFFFF" : "#0B1B3A", pick: function () { self.setState({ cat: c }); } };
      });
      v.integ = INTEG.filter(function (i) { return cat === "All" || i[1] === cat; }).map(function (i) { return { name: i[0], cat: i[1].toUpperCase(), line: i[2], mono: i[0].charAt(0) }; });
      v.integCount = v.integ.length + (v.integ.length === 1 ? " integration" : " integrations");
      return v;
    }
  }
  var app, inst;
  function boot() {
    app = document.getElementById("app");
    var tpl = document.getElementById("tpl");
    if (inst && inst._tw) clearInterval(inst._tw);
    inst = CA.mount(document, tpl.content, app, Site, { brand: "Countahead" });
    if (!window.__PRERENDER && window.CAW) CAW.mount(app);
  }
  function go(url, push) {
    var parts = url.split("#"), file = parts[0], hash = parts[1];
    return fetch(file).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
      var d = new DOMParser().parseFromString(html, "text/html");
      var nt = d.getElementById("tpl"), na = d.getElementById("app");
      if (!nt || !na) throw new Error("page");
      document.getElementById("tpl").innerHTML = nt.innerHTML;
      app.innerHTML = na.innerHTML;
      document.title = d.title;
      boot();
      if (push) { try { if (window.top === window) history.pushState({}, "", url.replace(/^index\.html/, "./").replace(/\.html/, "")); } catch (e) {} }
      var target = hash && document.getElementById(hash);
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    });
  }
  document.addEventListener("click", function (e) {
    if (app && app.__click) app.__click(e);
    var a = e.target; while (a && a.nodeName !== "A") a = a.parentNode;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var href = a.getAttribute("href") || "";
    var m = /^(\.\/|revenue|books|plan|integrations|about)(#[\w-]+)?$/.exec(href);
    if (m) href = (m[1] === "./" ? "index" : m[1]) + ".html" + (m[2] || "");
    if (/^[\w-]+\.html(#[\w-]+)?$/.test(href)) {
      e.preventDefault();
      go(href, true).catch(function () { try { location.href = href; } catch (x) {} });
    }
  });
  document.addEventListener("submit", function (e) { e.preventDefault(); });
  window.addEventListener("popstate", function () { var f = location.pathname.split("/").pop() || "index.html"; if (!/\.html$/.test(f)) f += ".html"; go(f + location.hash, false).catch(function () {}); });

  boot();
})();
