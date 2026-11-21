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
hasBar: pct != null, w: (pct == null ? 0 : Math.min(pct, 100)) + "%", pct: pct == null ? "" : pct.toFixed(1) + "% of revenue", bar: "var(--ink)", hasNote: !!note, note: note || "", share: ({ "Revenue": "100%", "Cost of revenue": "25.1%", "Gross profit": "74.9%", "R&D": "68.1%", "Sales and marketing": "42.4%", "G&A": "27.5%", "EBITDA": "(63.0%)", "D&A": "1.2%", "Net income": "(64.2%)" })[label] || "" };
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
pl("G&A", "(92)", "(90)", 27.5),
pl("EBITDA", "(211)", "(201)", null, "sub", "Margin (63.0%)"),
pl("D&A", "(4)", "(4)", 1.2),
pl("Net income", "(215)", "(205)", null, "total", "Ties to November net burn in the plan")
];
var kpis = [
{ label: "Revenue", val: "$335k", delta: "+4.0% on Oct", color: "#2450DC" },
{ label: "Margin", val: "74.9%", delta: "-3.5 pts", color: "#8A5A00" },
{ label: "Net income", val: "($215k)", delta: "Oct ($205k)", color: "#4B5565" }
];
var HATCH = "repeating-linear-gradient(135deg, var(--ink) 0 2px, #FFFFFF 2px 5px)";
var wfDefs = [["Rev", 0, 335, "335", "#2450DC", "#2450DC"], ["Cost", 251, 335, "(84)", HATCH, "var(--ink)"], ["GP", 0, 251, "251", "var(--hl)", "var(--ink)"], ["R&D", 23, 251, "(228)", HATCH, "var(--ink)"], ["S&M", -119, 23, "(142)", HATCH, "var(--ink)"], ["G&A", -211, -119, "(92)", HATCH, "var(--ink)"], ["EBITDA", -211, 0, "(211)", "var(--ink)", "var(--ink)"]];
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
    var T = { "Income statement": [["Revenue", "335", "41 contracts, 212 charges"], ["Cost of revenue", "(84)", "20 entries in 5100 Hosting and 5200 Support"], ["Operating expenses", "(462)", "Payroll, software, legal and 63 other entries"], ["EBITDA", "(211)", ""], ["Net income", "(215)", "After $4k of depreciation"]],
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
  var MD = [["CORE", "General ledger", "General ledger", "Double-entry and accrual-based, with your own chart of accounts and every balance traceable to its entries.", "Post each entry with its source document attached.", "Set the chart of accounts, and post a manual journal whenever you want."],
    ["CASH", "Bank reconciliation", "Bank and card reconciliation", "Transactions matched to documents and reconciled continuously, not in a month-end scramble.", "Match each bank and card line to its document as it arrives.", "Confirm the few matches they are unsure of."],
    ["MONEY OUT", "Bills and expenses", "Bills and expenses", "Invoices and receipts collected from inboxes, read, coded and queued for approval.", "Collect, read and code every bill and receipt.", "Approve what your policy sends to you."],
    ["MONEY IN", "Invoicing", "Invoicing and receivables", "Customer invoices prepared from signed contracts. Invoices go out as structured data, so your customer's system can read them without retyping.", "Draft invoices from signed contracts and match payments to them.", "Approve invoices before they go out."],
    ["TIMING", "Accruals and schedules", "Accruals, prepaids and schedules", "Costs and revenue recognized in the right period, with the schedule kept behind each balance.", "Build the schedule and post each month's entry.", "Review the schedule when it is created."],
    ["CLOSE", "Month-end close", "Month-end close", "A checklist that prepares itself through the month.", "Work through the checklist as the month runs.", "Review the exceptions, then lock the period."],
    ["REPORTING", "Statements", "Financial statements", "Income statement, balance sheet and cash flow that are current today, with drill-down to every entry.", "Keep all three statements current every day.", "Open any number down to the entries behind it."],
    ["GROUP", "Entities and currencies", "Entities and currencies", "Several entities and currencies consolidated into one view, with intercompany eliminated.", "Consolidate entities and eliminate intercompany balances.", "Review the consolidated view."]];
  W.modules = function (el) {
    el.innerHTML = '<div class="m-tabs nosb" role="group" aria-label="Accounting modules">' + MD.map(function (m, i) { return '<button type="button" data-m="' + i + '"><small>0' + (i + 1) + "</small><b>" + m[1] + "</b></button>"; }).join("") + '</div><div class="m-body"><div class="m-info"></div><div class="m-mock"><div class="m-bar"><span></span><span>Illustrative, sample data</span></div><div class="m-screen"></div></div></div>';
    function show(i) {
      var m = MD[i]; [].forEach.call(el.querySelectorAll("[data-m]"), function (b, n) { b.setAttribute("aria-pressed", n === i); });
      el.querySelector(".m-info").innerHTML = '<span class="m-lab" style="color:#2450DC">' + m[0] + '</span><b class="m-h2">' + m[2] + '</b><p class="m-p">' + m[3] + '</p><div class="m-do m-ag"><small>AGENTS DO</small><span>' + m[4] + '</span></div><div class="m-do"><small>YOU DO</small><span>' + m[5] + "</span></div>";
      el.querySelector(".m-bar span").textContent = "Countahead / " + m[2];
      var old = el.querySelector(".m-screen"), scr = old.cloneNode(false); old.parentNode.replaceChild(scr, old); M[i](scr);
    }
    el.querySelector(".m-tabs").addEventListener("click", function (e) { var t = e.target.closest("[data-m]"); if (t) show(+t.getAttribute("data-m")); });
    show(0);
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
    var EV = [["14 new subscriptions", 1386, "Cards charged at signup. Revenue is recognized day by day over each billing period."], ["3 upgrades", 600, "Part-month difference charged straight away, and the revenue schedule is updated."], ["1 downgrade", -70, "Credit applied to the next charge. Recurring revenue is reduced from today."], ["2 cancellations", -198, "Access runs to the end of the paid period, then revenue stops."], ["4 failed cards", 0, "Retried automatically. 3 recovered, and 1 customer has been emailed a link to update their card."], ["6 annual plans paid up front", 0, "$7,128 collected. Held as deferred revenue and recognized month by month."]], open = 0;
    function draw() {
      el.innerHTML = '<div class="m-stats">' + stat("RECURRING REVENUE, MONTHLY", "+$1,718", "m-good") + stat("PAYOUT TO THE BANK", "$9,412") + stat("TOUCHED BY A PERSON", "0") + '</div><div class="m-pane" style="padding:0"><div class="m-grp"><span>Yesterday, from your payment provider</span><b>MONTHLY RECURRING</b></div>' +
        EV.map(function (r, i) { return '<button type="button" class="m-acct" data-i="' + i + '" aria-expanded="' + (open === i) + '"><span>' + r[0] + "</span><b>" + (r[1] ? (r[1] > 0 ? "+" : "-") + $k(Math.abs(r[1])) : "") + "</b></button>" + (open === i ? '<div class="m-drill"><div><span>' + r[2] + "</span></div></div>" : ""); }).join("") +
        '</div><p class="m-foot">' + CHECK + " No contracts and no invoices to raise. Charges, fees, refunds and deferred revenue are booked from the payment data, and the payout reconciles itself. Tap a line.</p>";
    }
    on(el, "[data-i]", function (t) { var i = +t.getAttribute("data-i"); open = open === i ? -1 : i; draw(); }); draw();
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
      ["Financials against plan", 1, function () { return '<p class="sl-ey">Financials</p><h4>November against plan, USD thousands</h4><div class="sl-tb"><div class="sl-r sl-hd"><span></span><b>Actual</b><b>Plan</b><b>Variance</b></div>' + row("Revenue", "335", "330", "+5") + row("Cost of revenue", "(84)", "(73)", "(11)") + row("Gross profit", "251", "257", "(6)", "sl-st") + row("Research and development", "(228)", "(226)", "(2)") + row("Sales and marketing", "(142)", "(144)", "+2") + row("General and administrative", "(92)", "(90)", "(2)") + row("Operating result before depreciation", "(211)", "(203)", "(8)", "sl-st") + row("Net income", "(215)", "(207)", "(8)", "sl-st") + '</div><p class="sl-nt">Drafted commentary: the $8k miss is almost all hosting. Revenue beat plan by $5k.</p>'; }],
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

/* Page logic added on top of the homepage component: integrations list, boot, in-page navigation. */
(function () {
  var INTEG = [
    ["Plaid", "Banking", "Bank feeds for US accounts."], ["Mercury", "Banking", "Balances and transactions as they clear."],
    ["Wise", "Banking", "Multi-currency balances and transfers."], ["Revolut Business", "Banking", "Accounts and cards across currencies."],
    ["Brex", "Spend", "Cards, receipts and reimbursements."], ["Ramp", "Spend", "Cards, bills and receipts."],
    ["Stripe", "Payments", "Charges, payouts, fees and subscriptions."], ["PayPal", "Payments", "Payments, fees and payouts."],
    ["Shopify", "Commerce", "Orders, refunds and payouts."], ["Amazon", "Commerce", "Settlements and marketplace fees."],
    ["Gusto", "Payroll", "Payroll runs and payroll taxes."], ["Rippling", "Payroll", "Payroll and headcount changes."],
    ["Deel", "Payroll", "Contractors and international payroll."],
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
      if (push) { try { if (window.top === window) history.pushState({}, "", url); } catch (e) {} }
      var target = hash && document.getElementById(hash);
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    });
  }
  document.addEventListener("click", function (e) {
    if (app && app.__click) app.__click(e);
    var a = e.target; while (a && a.nodeName !== "A") a = a.parentNode;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var href = a.getAttribute("href") || "";
    if (/^[\w-]+\.html(#[\w-]+)?$/.test(href)) {
      e.preventDefault();
      go(href, true).catch(function () { try { location.href = href; } catch (x) {} });
    }
  });
  document.addEventListener("submit", function (e) { e.preventDefault(); });
  window.addEventListener("popstate", function () { var f = location.pathname.split("/").pop() || "index.html"; go(f + location.hash, false).catch(function () {}); });

  boot();
})();
