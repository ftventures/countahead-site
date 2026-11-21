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
{ q: "How do I control what the agents do?", a: "A policy you write sets what agents may post alone and what waits for a person. Nothing posts outside those limits." },
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

var tabDefs = [["pnl", "Income statement"], ["stmt", "Balance sheet"]];
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
  var NAV = [["EVERY DAY", [1, 2, 3, 11]], ["EVERY MONTH", [8, 4, 10, 9, 5]], ["WHEN YOU NEED IT", [0]]];

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
        '<div class="c-tile c-wide"><b class="c-h">Approval policies</b><p>The limit from your spending policy, at work. Drag it to see what would wait for you.</p><div class="c-row"><span>Approval limit</span><b>$' + lim.toLocaleString("en-US") + '</b></div><input type="range" min="500" max="40000" step="500" value="' + lim + '" aria-label="Approval limit in dollars" data-r="lim">' +
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
      ["Decisions", 1, function () { return '<p class="sl-ey">For the board</p><h4>Two decisions we are asking for</h4><div class="sl-dec"><div><b>1</b><span><strong>Approve two sales hires in January.</strong> Runway moves from 20 to 15 months before counting the revenue they bring in.</span></div><div><b>2</b><span><strong>Approve the move to a committed hosting contract.</strong> Brings gross margin back toward plan from the first quarter.</span></div></div><p class="sl-nt">Every number in this pack is read from the ledger and the plan at the time it was built.</p>'; }]];
    function vbar(vals, unit) { var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals) * 0.8; return '<div class="sl-vbars">' + vals.map(function (v, i) { return '<i style="height:' + ((v - mn) / (mx - mn) * 100).toFixed(1) + "%" + (i === vals.length - 1 ? ";background:#2450DC" : "") + '">' + (i === vals.length - 1 || i === 0 ? "<u>" + unit + v + "k</u>" : "") + "</i>"; }).join("") + '</div><div class="sl-vax"><span>12 months ago</span><span>November</span></div>'; }
    function tb(cols, rows) { return '<div class="sl-tb"><div class="sl-r sl-hd"><span>' + cols[0] + "</span><b>" + cols[1] + "</b><b>" + cols[2] + "</b><b>" + cols[3] + "</b></div>" + rows.map(function (r) { return r4(r[0], r[1], r[2], r[3], r[4] ? "sl-st" : ""); }).join("") + "</div>"; }
    function so(t) { return t; }
    function mk(o) {
      function num(x) { var n = parseFloat(String(x).replace(/[()+,]/g, "")); return /\(/.test(x) ? -n : n; }
      return [["Cover", 1, function () { return '<div class="sl-in sl-cover"><small>' + o.co.toUpperCase() + '</small><h4>Board meeting</h4><p>November 2026 results and outlook</p><div class="sl-ag"><span>Highlights</span><span>Financials</span><span>' + o.mixT + "</span><span>" + o.unitT + "</span><span>" + o.opsT + "</span><span>Cash</span><span>Outlook</span><span>Decisions</span></div></div>"; }],
        ["Highlights", 1, function () { return '<p class="sl-ey">Highlights</p><h4>' + o.head + '</h4><div class="sl-kp">' + o.kp.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + '</div><div class="sl-2">' + bul("WENT WELL", o.good) + bul("NEEDS ATTENTION", o.bad) + "</div>"; }, o.so[0]],
        ["Scorecard", 1, function () { return '<p class="sl-ey">Scorecard</p><h4>' + o.scoreH + '</h4><div class="sl-tb"><div class="sl-r sl-hd sl-r5"><span></span><b>November</b><b>October</b><b>Plan</b><b>Status</b></div>' + o.score.map(function (r) { return r5(r[0], r[1], r[2], r[3], r[4]); }).join("") + "</div>"; }, o.so[1]],
        ["Financials against plan", 1, function () { return '<p class="sl-ey">Financials</p><h4>' + o.plH + '</h4><div class="sl-2x"><div class="sl-tb"><div class="sl-r sl-hd"><span>USD thousands</span><b>Actual</b><b>Plan</b><b>Var.</b></div>' + o.pl.map(function (r) { return row(r[0], r[1], r[2], r[3], r[4]); }).join("") + '</div><div><p class="sl-ey" style="color:#4B5565">Variance to plan, $k</p>' + vb(o.pl.map(function (r) { return [r[0].split(",")[0], num(r[3])]; })) + "</div></div>"; }, o.so[2]],
        ["Twelve-month trend", 1, function () { return '<p class="sl-ey">Trend</p><h4>' + o.trendH + "</h4>" + vbar(o.trend, "$") + '<div class="sl-kp sl-k3">' + o.trendK.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + "</div>"; }, o.so[3]],
        [o.mixT, 1, function () { return '<p class="sl-ey">' + o.mixT + "</p><h4>" + o.mixH + "</h4>" + hb(o.mix, Math.max.apply(null, o.mix.map(function (x) { return x[1]; })), "k") + '<div class="sl-2">' + bul(o.mixA[0], o.mixA[1]) + bul(o.mixB[0], o.mixB[1]) + "</div>"; }, o.so[4]],
        [o.unitT, 1, function () { return '<p class="sl-ey">' + o.unitT + "</p><h4>" + o.unitH + "</h4>" + tb(o.unitC, o.unit); }, o.so[5]],
        [o.opsT, 1, function () { return '<p class="sl-ey">' + o.opsT + "</p><h4>" + o.opsH + '</h4><div class="sl-kp">' + o.ops.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + "</div>" + tb(o.secC, o.sec); }, o.so[6]],
        [o.pplT, 1, function () { return '<p class="sl-ey">' + o.pplT + "</p><h4>" + o.pplH + "</h4>" + hb(o.ppl, Math.max.apply(null, o.ppl.map(function (x) { return x[1]; })), o.pplU) + '<div class="sl-2">' + bul(o.pplA[0], o.pplA[1]) + bul(o.pplB[0], o.pplB[1]) + "</div>"; }, o.so[7]],
        ["Cash", 1, function () { return '<p class="sl-ey">Cash</p><h4>' + o.cashH + '</h4><div class="sl-kp sl-k3">' + o.cash.map(function (k) { return kp(k[0], k[1], k[2], k[3]); }).join("") + '</div><div class="sl-2">' + bul("COMING IN", o.cin) + bul("GOING OUT", o.cout) + "</div>"; }, o.so[8]],
        ["Outlook", 1, function () { return '<p class="sl-ey">Outlook</p><h4>' + o.outH + "</h4>" + tb(["USD thousands", "December", "January", "February"], o.out); }, o.so[9]],
        ["Risks", 1, function () { return '<p class="sl-ey">Risks</p><h4>What could move the plan</h4><div class="sl-dec">' + o.risks.map(function (r, i) { return "<div><b>" + (i + 1) + "</b><span><strong>" + r[0] + "</strong> " + r[1] + "</span></div>"; }).join("") + "</div>"; }],
        ["Decisions", 1, function () { return '<p class="sl-ey">For the board</p><h4>Decisions we are asking for</h4><div class="sl-dec">' + o.asks.map(function (r, i) { return "<div><b>" + (i + 1) + "</b><span><strong>" + r[0] + "</strong> " + r[1] + "</span></div>"; }).join("") + '</div><p class="sl-nt">Every number in this pack is read from the ledger and the plan at the time it was built.</p>'; }]];
    }
    var DECKS = [["Software", "Sample Co.", S],
      ["Online store", "Sample store", mk({ co: "Sample store", head: "Sales up 9%, advertising cost rising faster", kp: [["NET SALES", "$412k", "+9% on October", 1], ["GROSS MARGIN", "58%", "After shipping and fees", 1], ["OPERATING PROFIT", "$34k", "$2k under plan", 0], ["STOCK COVER", "46 days", "At this month's pace", 1]], good: ["Repeat customers reached 38% of orders", "Amazon sales up 14% with no extra advertising"], bad: ["Advertising took 29% of sales, against 28% planned", "Returns rose to 6.2% of orders"],
        scoreH: "Sales and orders ahead, advertising and returns behind", score: [["Net sales, $k", "412", "378", "400", 2], ["Orders", "6,440", "5,980", "6,250", 2], ["Average order", "$64", "$63", "$64", 1], ["Gross margin", "58%", "59%", "58.5%", 0], ["Sales per ad dollar", "$3.40", "$3.60", "$3.57", 0], ["Returns", "6.2%", "5.4%", "5.5%", 0], ["Cash, $k", "286", "301", "290", 1]],
        plH: "Sales beat plan, advertising gave most of it back", pl: [["Net sales", "412", "400", "+12"], ["Goods, shipping and fees", "(173)", "(166)", "(7)"], ["Gross profit", "239", "234", "+5", "sl-st"], ["Advertising", "(121)", "(112)", "(9)"], ["People and other costs", "(84)", "(86)", "+2"], ["Operating profit", "34", "36", "(2)", "sl-st"]],
        trendH: "Sales have grown 72% in twelve months", trend: [240, 232, 251, 263, 270, 288, 301, 296, 322, 351, 378, 412], trendK: [["GROWTH, 12 MONTHS", "+72%", "From $240k a month", 1], ["BEST MONTH", "November", "Before the holidays", 1], ["GROSS MARGIN, 12 MONTHS", "58.6%", "Steady", 1]],
        mixT: "Channels", mixH: "Shopify still leads, Amazon is growing fastest", mix: [["Shopify", 236], ["Amazon", 132], ["Other marketplaces", 44]], mixA: ["GROWTH ON OCTOBER", ["Shopify +6%", "Amazon +14%", "Other marketplaces +11%"]], mixB: ["BEST SELLERS", ["Canvas tote", "Wool blanket", "Enamel mug"]],
        unitT: "Per order", unitH: "A Shopify order earns the most, even after advertising", unitC: ["Average, per order", "Shopify", "Amazon", "Marketplaces"], unit: [["Order value", "$66.00", "$61.00", "$58.00"], ["Goods and shipping", "(24.50)", "(23.80)", "(22.90)"], ["Channel and payment fees", "(2.10)", "(9.20)", "(7.40)"], ["Advertising", "(21.00)", "(14.50)", "(12.00)"], ["Left per order", "$18.40", "$13.50", "$15.70", 1]],
        opsT: "Stock", opsH: "$198k of stock, and one best seller about to run out", ops: [["STOCK AT COST", "$198k", "46 days of sales", 1], ["RUNNING LOW", "2 products", "Below reorder level", 0], ["RETURNS", "6.2%", "Up from 5.4%", 0], ["ON TIME DELIVERY", "96%", "Target 95%", 1]], secC: ["Product", "On hand", "Days of cover", "Status"], sec: [["Canvas tote", "380", "52", "Healthy"], ["Linen apron", "210", "61", "Healthy"], ["Wool blanket", "80", "28", "Reorder placed"], ["Enamel mug", "26", "9", "Below reorder level"]],
        pplT: "Customers", pplH: "Each month's new customers come back more than the last", ppl: [["Joined in August", 31], ["Joined in September", 34], ["Joined in October", 38]], pplU: "%", pplA: ["BOUGHT AGAIN WITHIN 90 DAYS", ["Up 7 points in three months", "Email drives half of repeat orders"]], pplB: ["COST TO WIN A CUSTOMER", ["$27, up from $24", "Paid social is the most expensive"]],
        cashH: "$286k in the bank, with holiday stock already paid for", cash: [["CASH", "$286k", "$15k lower than October", 0], ["STOCK AT COST", "$198k", "46 days of sales", 1], ["OWED BY MARKETPLACES", "$41k", "Paid out within 14 days", 1]], cin: ["Marketplace payouts every two weeks", "Card sales settle in two days"], cout: ["Holiday stock order paid in October", "Advertising billed monthly"],
        outH: "December carries the quarter", out: [["Net sales", "520", "330", "340"], ["Gross margin", "57%", "58%", "58%"], ["Advertising", "(150)", "(92)", "(95)"], ["Operating profit", "62", "18", "21", 1]],
        risks: [["Advertising cost.", "Sales per ad dollar fell from $3.60 to $3.40."], ["Stock.", "One best seller has nine days of cover before the holidays."], ["Returns.", "Up to 6.2% of orders, mostly one product."]], asks: [["Approve a $60k stock order for the first quarter.", "Keeps cover above 40 days."], ["Approve moving 15% of advertising to email and repeat offers.", "Where the margin is strongest."]],
        so: ["A good sales month. The question for today is what we pay to get those sales.", "Growth is ahead of plan. Efficiency is behind it.", "The $9k advertising overspend is the whole of the profit miss.", "Growth is steady, not seasonal luck: ten of twelve months were up.", "Amazon is growing fastest and needs the least advertising.", "Amazon keeps $5 less per order than Shopify, mostly in fees.", "The mug will sell out in nine days. The reorder lands in fourteen.", "Repeat buyers cost nothing to win. This is where to spend.", "Cash is lowest now and rebuilds as holiday sales settle.", "January and February are thin. Spend in December accordingly."] })],
      ["Services", "Sample studio", mk({ co: "Sample studio", head: "Revenue steady, too much work not yet invoiced", kp: [["REVENUE", "$186k", "+3% on October", 1], ["TIME BILLED", "74%", "Target 78%", 0], ["OPERATING PROFIT", "$28k", "$4k under plan", 0], ["SIGNED WORK", "$420k", "About 2 months", 1]], good: ["Two new retainers signed, $18k a month", "Average rate up to $142 an hour"], bad: ["$38k of finished work is not yet invoiced", "Clients are taking 38 days to pay"],
        scoreH: "Rates are up, billing discipline is down", score: [["Revenue, $k", "186", "181", "190", 0], ["Time billed", "74%", "76%", "78%", 0], ["Average rate", "$142", "$139", "$140", 2], ["Gross margin", "46%", "47%", "47%", 0], ["Done, not invoiced, $k", "38", "22", "20", 0], ["Days to get paid", "38", "34", "30", 0], ["Signed work, $k", "420", "395", "400", 2]],
        plH: "A $4k shortfall, and all of it is timing", pl: [["Revenue", "186", "190", "(4)"], ["Delivery team and contractors", "(100)", "(101)", "+1"], ["Gross profit", "86", "89", "(3)", "sl-st"], ["Overheads", "(58)", "(57)", "(1)"], ["Operating profit", "28", "32", "(4)", "sl-st"]],
        trendH: "Revenue up 32% in twelve months, with the same team size", trend: [141, 150, 148, 157, 163, 160, 171, 168, 174, 179, 181, 186], trendK: [["GROWTH, 12 MONTHS", "+32%", "From $141k a month", 1], ["REVENUE PER PERSON", "$15.5k", "Up from $12.8k", 1], ["FROM RETAINERS", "41%", "Up from 28%", 1]],
        mixT: "Clients", mixH: "Two clients are 59% of revenue", mix: [["Northwind Ltd", 62], ["Brightdesk", 48], ["9 others", 76]], mixA: ["RETAINERS", ["Brightdesk, $18k a month", "Kestrel, $11k a month", "Two new this month"]], mixB: ["ENDING SOON", ["Northwind rebuild completes in January", "Two proposals out to replace it"]],
        unitT: "Projects", unitH: "Two fixed-fee projects are eating the margin", unitC: ["Project", "Fee", "Cost so far", "Margin"], unit: [["Brightdesk retainer", "$18k a month", "$7.6k", "58%"], ["Kestrel portal", "$44k", "$22k", "50%"], ["Northwind rebuild, fixed fee", "$50k", "$29.5k", "41%"], ["Tallis brand refresh, fixed fee", "$32k", "$27k", "16%"], ["All live projects", "", "", "46%", 1]],
        opsT: "Work ahead", opsH: "February has a $66k gap to fill", ops: [["SIGNED WORK", "$420k", "About 2 months", 1], ["PROPOSALS OUT", "$240k", "6 proposals", 1], ["WIN RATE", "35%", "Last 12 months", 1], ["OVER BUDGET", "2 of 11", "Both fixed fee", 0]], secC: ["USD thousands", "December", "January", "February"], sec: [["Signed work", "172", "148", "100"], ["Proposals, at stage odds", "10", "28", "46"], ["Capacity at 78% billed", "196", "196", "212"], ["Gap to fill", "(14)", "(20)", "(66)", 1]],
        pplT: "Team", pplH: "Strategy and leadership time is under-billed", ppl: [["Design", 81], ["Engineering", 77], ["Strategy", 62], ["Leadership", 38]], pplU: "%", pplA: ["TIME BILLED BY ROLE", ["Studio average 74%, target 78%", "Each point is about $2.5k a month"]], pplB: ["PEOPLE", ["12 people, 1 open role", "No leavers this quarter"]],
        cashH: "$214k in the bank, $96k owed by clients", cash: [["CASH", "$214k", "$12k lower", 0], ["OWED BY CLIENTS", "$96k", "$31k overdue", 0], ["DONE, NOT INVOICED", "$38k", "Goes out this week", 1]], cin: ["$96k of invoices outstanding", "$38k to invoice this week"], cout: ["Payroll on the 28th", "Contractors paid on 30-day terms"],
        outH: "Profit thins out unless February is filled", out: [["Revenue", "182", "176", "170"], ["Gross margin", "46%", "45%", "44%"], ["Operating profit", "26", "20", "14"], ["Cash at month end", "221", "208", "196", 1]],
        risks: [["Client concentration.", "Two clients are 59% of revenue, and one project ends in January."], ["Slow payment.", "Days to get paid rose from 34 to 38."], ["Fixed-fee overruns.", "Two projects are over budget."]], asks: [["Approve hiring one senior designer.", "Covered by the two new retainers."], ["Approve moving new work to milestone billing.", "Invoices go out as each stage is delivered."]],
        so: ["The work is there. The cash is lagging the work.", "Five of seven measures are behind, and four of those are about billing and collecting.", "Invoice the $38k of finished work and November is on plan.", "More revenue per person, and more of it recurring.", "Concentration is the main risk in the business.", "Retainers earn 58%. Fixed-fee work averages 31%.", "Proposals out cover the gap only if the win rate holds.", "Three more billed points across the studio is worth $90k a year.", "$134k is earned and not yet in the bank.", "The designer hire pays for itself from month two on retainer work."] })],
      ["Hospitality and retail", "Sample cafe group", mk({ co: "Sample cafe group", head: "Sales ahead of plan, cost of goods creeping up", kp: [["SALES", "$402k", "+5% on last year", 1], ["LABOUR", "29%", "of sales, on plan", 1], ["COST OF GOODS", "31%", "Plan 30.5%", 0], ["OPERATING PROFIT", "$48k", "On plan", 1]], good: ["All three sites grew on last year", "Average ticket up to $34"], bad: ["Dairy and coffee prices pushed cost of goods up", "Evening trade is still the weakest part of the day"],
        scoreH: "Sales and labour on plan, ingredients over", score: [["Sales, $k", "402", "388", "395", 2], ["Tickets", "11,820", "11,560", "11,700", 2], ["Average ticket", "$34.00", "$33.60", "$33.80", 2], ["Labour, share of sales", "29%", "29.5%", "29%", 1], ["Cost of goods", "31%", "30.4%", "30.5%", 0], ["Waste", "2.1%", "2.4%", "2.0%", 1], ["Cash, $k", "168", "154", "160", 2]],
        plH: "Extra sales were absorbed by ingredient prices", pl: [["Sales", "402", "395", "+7"], ["Cost of goods", "(125)", "(120)", "(5)"], ["Labour", "(117)", "(115)", "(2)"], ["Rent and other costs", "(112)", "(112)", "0"], ["Operating profit", "48", "48", "0", "sl-st"]],
        trendH: "Sales are up 19% on a year ago", trend: [338, 331, 352, 360, 371, 384, 396, 402, 389, 392, 388, 402], trendK: [["GROWTH, 12 MONTHS", "+19%", "Station opened in March", 1], ["SAME SITES", "+5%", "Excluding the new site", 1], ["PEAK MONTH", "July", "Matched in November", 1]],
        mixT: "Sites", mixH: "Market Street leads, Station is still finding its feet", mix: [["Market Street", 152], ["Riverside", 138], ["Station", 112]], mixA: ["GROWTH ON LAST YEAR", ["Market Street +6%", "Riverside +4%", "Station opened in March"]], mixB: ["AVERAGE TICKET", ["Market Street $36", "Riverside $34", "Station $31"]],
        unitT: "Site by site", unitH: "Station earns 9% where the others earn 12 to 14%", unitC: ["Share of sales", "Market Street", "Riverside", "Station"], unit: [["Sales, $k", "152", "138", "112"], ["Cost of goods", "31%", "30%", "33%"], ["Labour", "27%", "29%", "32%"], ["Rent and site costs", "28%", "29%", "26%"], ["Site profit", "14%", "12%", "9%", 1]],
        opsT: "Through the day", opsH: "Evenings cost 38 cents of labour for every dollar sold", ops: [["LABOUR PLUS GOODS", "60%", "of sales", 1], ["WASTE", "2.1%", "Down from 2.4%", 1], ["TICKETS", "11,820", "+2% on October", 1], ["SUPPLIER PRICE RISES", "3", "this month", 0]], secC: ["", "Morning", "Lunch", "Evening"], sec: [["Share of sales", "34%", "43%", "23%"], ["Average ticket", "$28", "$36", "$41"], ["Tickets per labour hour", "9.1", "10.4", "5.2"], ["Labour, share of sales", "26%", "27%", "38%", 1]],
        pplT: "Team", pplH: "46 people across three sites, turnover is easing", ppl: [["Market Street", 18], ["Riverside", 16], ["Station", 12]], pplU: "", pplA: ["STAFFING", ["5 of 46 left this quarter, down from 8", "3% of shifts covered by agency staff"]], pplB: ["PAY", ["Tips of $31k paid out to 46 staff", "Minimum wage rises 4% in January"]],
        cashH: "$168k in the bank, takings settle next day", cash: [["CASH", "$168k", "$14k higher", 1], ["SALES TAX HELD", "$32k", "Due in January", 0], ["OWED TO SUPPLIERS", "$54k", "On 30-day terms", 1]], cin: ["Card takings settle next day", "Gift cards sold in December"], cout: ["Sales tax due in January", "Quarterly rent on January 1"],
        outH: "A strong December, then the quiet months", out: [["Sales", "455", "340", "352"], ["Cost of goods", "31%", "30.5%", "30.5%"], ["Labour", "28%", "31%", "30%"], ["Operating profit", "66", "22", "30", 1]],
        risks: [["Ingredient prices.", "Cost of goods is half a point over plan."], ["Station site.", "Profit of 9% against 12 to 14% elsewhere."], ["January.", "Rent, sales tax and a wage rise all fall in the quietest month."]], asks: [["Approve a 3% menu price rise from January.", "Brings cost of goods back to plan."], ["Approve trialling shorter evening hours at Station.", "Evening is 23% of sales and the highest labour share."]],
        so: ["Trading is healthy. Margin is the thing to protect.", "Six of seven measures are on or ahead of plan.", "Profit landed exactly on plan, but only because sales ran ahead.", "Growth came from the new site and from the old ones.", "Station is 28% of sales and the lowest ticket.", "Station's gap is labour and goods, not rent.", "Evening tickets are bigger but there are half as many per labour hour.", "Fewer leavers means lower training cost and less agency cover.", "$32k of the cash is sales tax that is not ours to spend.", "January needs the December cash. Hold it back."] })],
      ["Other businesses", "Sample trading co.", mk({ co: "Sample trading co.", head: "Sales and profit ahead of plan, cash tied up with customers", kp: [["SALES", "$520k", "+3% on plan", 1], ["GROSS MARGIN", "38.1%", "Plan 38.0%", 1], ["OPERATING PROFIT", "$44k", "Plan $36k", 1], ["CASH", "$212k", "$18k lower", 0]], good: ["Two new wholesale accounts started ordering", "Costs held flat while sales grew"], bad: ["Customers now take 52 days to pay, up from 44", "One customer is 31% of sales"],
        scoreH: "Five of seven on or ahead of plan, both misses are cash", score: [["Sales, $k", "520", "498", "505", 2], ["Gross margin", "38.1%", "37.6%", "38.0%", 1], ["Operating profit, $k", "44", "35", "36", 2], ["Orders", "1,240", "1,190", "1,210", 2], ["Days to get paid", "52", "44", "45", 0], ["Days of stock", "61", "64", "60", 1], ["Cash, $k", "212", "230", "225", 0]],
        plH: "Higher sales carried straight through to profit", pl: [["Sales", "520", "505", "+15"], ["Cost of goods", "(322)", "(313)", "(9)"], ["Staff", "(96)", "(96)", "0"], ["Other costs", "(58)", "(60)", "+2"], ["Operating profit", "44", "36", "+8", "sl-st"]],
        trendH: "Sales are up 21% on a year ago", trend: [431, 424, 446, 452, 467, 471, 488, 496, 489, 503, 498, 520], trendK: [["GROWTH, 12 MONTHS", "+21%", "Steady, no single jump", 1], ["BEST MONTH", "November", "$520k", 1], ["REPEAT ORDERS", "78%", "of sales", 1]],
        mixT: "Product lines", mixH: "The core range is 57% of sales, the new range is growing fastest", mix: [["Core range", 296], ["New range", 134], ["Spare parts and service", 90]], mixA: ["GROWTH ON LAST YEAR", ["Core range +9%", "New range +62%", "Spare parts and service +11%"]], mixB: ["GROSS MARGIN", ["Core range 36%", "New range 39%", "Spare parts and service 44%"]],
        unitT: "Customers", unitH: "The largest customer is 31% of sales and the slowest to pay", unitC: ["", "Largest", "Next nine", "All others"], unit: [["Sales, $k", "161", "218", "141"], ["Share of sales", "31%", "42%", "27%"], ["Gross margin", "34%", "39%", "42%"], ["Days to get paid", "68", "47", "41", 1]],
        opsT: "Operations", opsH: "Orders ship on time, the new range holds too much stock", ops: [["SHIPPED ON TIME", "96%", "Target 95%", 1], ["DAYS OF STOCK", "61", "Target 60", 1], ["RETURNS", "1.4%", "of orders", 1], ["SUPPLIER PRICE RISES", "2", "this quarter", 0]], secC: ["", "Core range", "New range", "Spare parts"], sec: [["Orders", "710", "290", "240"], ["Average order", "$417", "$462", "$375"], ["Shipped on time", "97%", "93%", "98%"], ["Days of stock", "54", "82", "49", 1]],
        pplT: "Team", pplH: "22 people, one hire planned", ppl: [["Operations and warehouse", 9], ["Sales and service", 7], ["Finance and admin", 3], ["Management", 3]], pplU: "", pplA: ["HIRING", ["One account manager to start in February", "No leavers this quarter"]], pplB: ["PAY", ["Payroll of $96k this month", "Annual pay review in March"]],
        cashH: "$212k in the bank, $18k lower as customers pay later", cash: [["CASH", "$212k", "$18k lower", 0], ["OWED BY CUSTOMERS", "$900k", "52 days of sales", 0], ["OWED TO SUPPLIERS", "$430k", "On 40-day terms", 1]], cin: ["$161k due from the largest customer in December", "Seasonal orders paid in January"], cout: ["Stock for the new range in December", "Quarterly tax payment in January"],
        outH: "Profit holds, cash recovers only if customers pay on terms", out: [["Sales", "535", "510", "528"], ["Gross margin", "38%", "38%", "38.5%"], ["Operating costs", "(156)", "(156)", "(162)"], ["Operating profit", "47", "38", "41", 1]],
        risks: [["One large customer.", "31% of sales, at the lowest margin."], ["Slow payment.", "Days to get paid rose from 44 to 52."], ["Stock in the new range.", "82 days against a target of 60."]], asks: [["Approve 45-day terms and a credit limit for the largest customer.", "Would release about $120k of cash."], ["Approve one account manager from February.", "To grow the next nine accounts and rely less on one."]],
        so: ["A good month for profit. Cash is the thing to watch.", "Both misses are about cash, not trading.", "Every extra dollar of sales kept its margin.", "Growth is steady and comes from repeat orders.", "The new range is already a quarter of sales.", "The largest customer has the lowest margin and the longest wait.", "The new range holds too much stock for what it sells.", "The team has not grown while sales rose 21%.", "$900k of our money is sitting with customers.", "Collection, not sales, decides the next three months."] })]], dk = 0, EDS = [{}, {}, {}, {}, {}];
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
      ["Other businesses", "Sample trading co.", [["SALES", "$520k", "+4% on October"], ["GROSS MARGIN", "38.1%", "plan 38.0%"], ["OPERATING PROFIT", "$44k", "8.5% of sales"], ["CASH", "$212k", "$18k lower"], ["DAYS TO GET PAID", "52", "up from 44"], ["DAYS OF STOCK", "61", "target 60"], ["SALES PER PERSON", "$23.6k", "a month, 22 people"], ["LARGEST CUSTOMER", "31%", "of sales"]], "SALES, 12 MONTHS", [431, 424, 446, 452, 467, 471, 488, 496, 489, 503, 498, 520], "BY PRODUCT LINE", [["Core range", 296], ["New range", 134], ["Spare parts and service", 90]]]], cur = 0;
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
"";
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
    var ST = ["Draft", "Negotiate", "Approve", "Sign", "Live", "Renew"], step, arr, log, did, terms, fresh = false;
    function reset() { step = 0; arr = 48000; did = {}; log = [["Drafted by an agent from the won deal in your CRM", "40 seats at $100, 12 months, from your standard template"]]; terms = [["Payment terms", "Net 30", 0], ["Renewal", "Renews automatically, 60 days notice", 0], ["Price on renewal", "List price", 0], ["Liability cap", "12 months of fees", 0]]; }
    var OURS = "M8 42c10-22 16-30 20-28 5 3-8 30-2 30 7 0 12-26 18-26 5 0 0 22 6 22 5 0 9-14 14-14 4 0 2 12 8 12 8 0 14-20 22-20", THEIRS = "M10 20h34M27 20v26M52 46c0-14 6-22 12-22 7 0 9 8 2 12-5 3-10 2-12 0 6 6 12 10 20 10 10 0 10-22 18-22 6 0 2 20 8 20 7 0 10-18 18-18 5 0 3 18 9 18 8 0 12-12 20-16";
    function ink(d, col, anim) { return '<svg viewBox="0 0 200 60" aria-hidden="true"><path class="sg-ink' + (anim ? " sg-go" : "") + '" d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>'; }
    function sig() {
      var st = step >= 4 ? "SIGNED BY BOTH SIDES" : step === 3 ? "WAITING FOR THE CUSTOMER" : "NOT SENT FOR SIGNATURE YET";
      return '<div class="sg' + (step >= 4 ? " sg-done" : "") + '"><div class="sg-h"><small>SIGNATURE PAGE</small><em>' + st + '</em></div><div class="sg-p"><div><small>FOR SAMPLE CO.</small>' + (step >= 3 ? ink(OURS, "#0B1B3A", fresh && step === 3) + "<span>Finance lead, Nov 20, 13:48</span>" : '<div class="sg-x"><i>&times;</i></div><span>Signs when the terms are approved</span>') + '</div><div><small>FOR HARBOR LABS</small>' + (step >= 4 ? ink(THEIRS, "#2450DC", fresh && step === 4) + "<span>Tom Reyes, VP Operations, Nov 20, 14:02</span>" : '<div class="sg-x' + (step === 3 ? " sg-wait" : "") + '"><i>&times;</i></div><span>' + (step === 3 ? "Signing link sent to Tom Reyes" : "Tom Reyes, VP Operations") + "</span>") + "</div></div>" + (step >= 4 ? '<div class="sg-f">Signed on the platform. Identity, time and document version are recorded and cannot be changed.</div>' : "") + "</div>";
    }
    function flow() {
      var live = step >= 4, seats = did.a ? 60 : 40, pay = terms[0][1], F = [["Customer", "Harbor Labs", "Customer record", "Marked as a customer, contract attached"], ["Price", $k(arr) + " a year", "Recurring revenue", "+" + $k(arr) + " booked"], ["Seats", seats + " at $100 a month", "Billing", "12 invoices of $" + (seats * 100).toLocaleString("en-US") + " scheduled"], ["License start", "December 1, 2026", "Revenue recognition", "Earned evenly over 12 months from that date"], ["Payment terms", pay, "Collections and cash forecast", "First cash expected " + (pay === "Net 60" ? "end of January" : "end of December")], ["Renewal", "Automatic, 60 days notice", "Reminders", "Set for 90 days before " + (did.r ? "November 2028" : "November 2027")], ["Deal owner", "Sofia A.", "Commissions", "Commission accrued on the signed value"]];
      return '<span class="m-lab">' + (live ? "SIGNED: EACH FIELD WENT WHERE IT IS NEEDED" : "READ FROM THE CONTRACT, WAITING FOR A SIGNATURE") + '</span><div class="sg-flow' + (live ? " sg-live" : "") + (fresh && step === 4 ? " sg-run" : "") + '">' + F.map(function (x, i) { return '<div style="--d:' + (1.5 + i * 0.28).toFixed(2) + 's"><span><small>' + x[0].toUpperCase() + "</small><b>" + x[1] + '</b></span><i aria-hidden="true"></i><span><small>' + x[2].toUpperCase() + "</small><b>" + (live ? x[3] : "Nothing yet") + "</b></span></div>"; }).join("") + "</div>";
    }
    function draw() {
      var live = step >= 4, acts = step === 0 ? [["go", "Send to the customer"]] : step === 1 ? [["go", "Accept their changes"]] : step === 2 ? [["go", "Approve the exceptions"]] : step === 3 ? [["go", "Customer signs"]] : [].concat(did.a ? [] : [["amend", "Amend: add 20 seats"]], did.r ? [] : [["renew", "Renew for 12 months"]], [["reset", "Start again"]]);
      var status = ["DRAFT", "CUSTOMER SENT CHANGES", "NEEDS APPROVAL", "OUT FOR SIGNATURE", "LIVE", "RENEWED"][did.r ? 5 : step];
      el.innerHTML = '<div class="m-chain">' + ST.map(function (s, i) { return '<span class="m-node' + (i <= (did.r ? 5 : step) ? " m-first" : "") + '">' + s + "</span>"; }).join('<i aria-hidden="true">&rarr;</i>') + '</div><div class="m-two m-tw2"><div class="m-pane"><div class="m-doch"><b>Harbor Labs, subscription agreement</b><span class="m-chip ' + (live ? "m-blue" : "m-warn") + '">' + status + '</span></div><div class="m-stats">' + stat("RECURRING REVENUE", live ? $k(arr) : "Not yet", live ? "m-good" : "") + stat("SEATS", did.a ? 60 : 40) + stat("ENDS", did.r ? "Nov 2028" : "Nov 2027") + '</div><span class="m-lab">KEY TERMS, READ BY AN AGENT</span>' + terms.map(function (t) { return '<div class="m-kv"><span>' + t[0] + '</span><b style="text-align:right">' + t[1] + (t[2] ? ' <span class="m-chip m-warn">NOT STANDARD</span>' : "") + "</b></div>"; }).join("") +
        sig() +
        (step === 2 ? '<div class="m-note">Two terms differ from your standard contract, so this waits for finance. Net 60 also pushes the first cash receipt out by a month in the forecast.</div>' : "") + (live && !did.r ? '<div class="m-note">Renewal reminder set for 90 days before the end date. An agent will draft the renewal quote.</div>' : "") +
        '<div class="m-acts" style="flex-wrap:wrap">' + acts.map(function (a, i) { return '<button type="button" class="m-btn' + (i > 0 || a[0] === "reset" ? " m-ghost" : "") + '" data-a="' + a[0] + '">' + a[1] + "</button>"; }).join("") + '</div></div><div class="m-pane">' + flow() + '<span class="m-lab" style="margin-top:16px">WHAT HAPPENED</span>' + log.slice().reverse().map(function (l) { return '<div class="m-li" style="padding:9px 0"><span><b>' + l[0] + "</b><small>" + l[1] + "</small></span></div>"; }).join("") + '<p class="m-foot" style="padding:0">Nothing counts as revenue until the contract is signed. After that every change goes through an amendment, and agents never alter signed terms.</p></div></div>';
    }
    on(el, "[data-a]", function (t) {
      var a = t.getAttribute("data-a"); fresh = false;
      if (a === "reset") reset();
      else if (a === "go") { step++; fresh = step >= 3;
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

/* Round six: one forecast section, financial model, data room, audit readiness, company records. Sample data. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function n0(v) { return Math.round(v).toLocaleString("en-US"); }
  function f(v) { return v < 0 ? "(" + n0(-v) + ")" : n0(v); }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function kp(a) { return '<div class="a-kp a-k3">' + a.map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + "</div>"; }

  /* ---------- one forecast section, three ways in ---------- */
  W.forecast = function (el) {
    var T = [["Build it up", "What you keep, plus pipeline, plus what the team can sell.", "revplan"], ["Start from the goal", "Set a target and work backwards to the deals, pipeline, hires and cost it needs.", "method"]];
    el.innerHTML = '<div class="m-kinds">' + T.map(function (t, i) { return '<button type="button" data-k="' + i + '"><b>' + t[0] + "</b><small>" + t[1] + "</small></button>"; }).join("") + '</div><div class="m-kbody"></div>';
    function show(i) { [].forEach.call(el.querySelectorAll(".m-kinds [data-k]"), function (b, n) { b.setAttribute("aria-pressed", n === i); }); var o = el.querySelector(".m-kbody"), n = o.cloneNode(false); o.parentNode.replaceChild(n, o); W[T[i][2]](n); }
    el.querySelector(".m-kinds").addEventListener("click", function (e) { var t = e.target.closest("[data-k]"); if (t) show(+t.getAttribute("data-k")); });
    show(0);
  };

  /* ---------- financial model, as a workbook ---------- */
  W.model = function (el) {
    var g = 2, cg = 1, hires = 0, tab = 0, sel = "3:1", done = false, MO = ["Nov A", "Dec", "Jan", "Feb", "Mar", "Apr", "May"], COL = ["B", "C", "D", "E", "F", "G", "H"], TABS = ["Summary", "Assumptions", "Revenue", "People", "Cash"];
    function calc() { var rev = [335], pay = [372], opx = [178], cash = [3060]; for (var m = 1; m < 7; m++) { rev.push(rev[m - 1] * (1 + g / 100)); pay.push(372 + (m >= 2 ? hires * 17 : 0)); opx.push(opx[m - 1] * (1 + cg / 100)); cash.push(cash[m - 1] - (pay[m] + opx[m] - rev[m])); } return { rev: rev, pay: pay, opx: opx, cash: cash }; }
    function draw(keep) {
      var c = calc(), R;
      if (tab === 1) R = [["Revenue growth a month", [g + "%"], "Input"], ["Cost growth a month", [cg + "%"], "Input"], ["New hires from January", [hires], "Input"], ["Cost per hire a month, $k", [17], "Input"], ["Opening cash, $k", [3060], "From the ledger"], ["November revenue, $k", [335], "From the ledger"]];
      else if (tab === 2) R = [["Opening recurring revenue", c.rev.map(function (v, i) { return i ? c.rev[i - 1] * 12 : 3860; }), "=prior month closing"], ["Net new", c.rev.map(function (v, i) { return i ? (v - c.rev[i - 1]) * 12 : 160; }), "=closing - opening"], ["Closing recurring revenue", c.rev.map(function (v) { return v * 12; }), "=Revenue!{c}5*12", 1], ["Revenue recognized", c.rev, "={p}5*(1+Assumptions!B2)"]];
      else if (tab === 3) R = [["People", c.pay.map(function (v, i) { return 24 + (i >= 2 ? hires : 0); }), "=24+Assumptions!B4"], ["Payroll", c.pay, "=372+People!{c}2*Assumptions!B5", 1], ["Other costs", c.opx, "={p}4*(1+Assumptions!B3)"]];
      else if (tab === 4) R = [["Opening cash", c.cash.map(function (v, i) { return i ? c.cash[i - 1] : 3275; }), "=prior month closing"], ["Revenue", c.rev, "=Revenue!{c}5"], ["Payroll", c.pay.map(function (v) { return -v; }), "=-People!{c}3"], ["Other costs", c.opx.map(function (v) { return -v; }), "=-People!{c}4"], ["Closing cash", c.cash, "={c}2+SUM({c}3:{c}5)", 1]];
      else R = [["Revenue", c.rev, "=Revenue!{c}5"], ["Total costs", c.rev.map(function (v, i) { return -(c.pay[i] + c.opx[i]); }), "=-(People!{c}3+People!{c}4)"], ["Net burn", c.rev.map(function (v, i) { return v - c.pay[i] - c.opx[i]; }), "={c}2+{c}3", 1], ["Closing cash", c.cash, "=Cash!{c}6", 1], ["Recurring revenue", c.rev.map(function (v) { return v * 12; }), "=Revenue!{c}4"]];
      var wide = tab !== 1, sp = sel.split(":"), sr = Math.min(+sp[0], R.length - 1), sc = wide ? +sp[1] : 0, row = R[sr], fx = sc === 0 && wide ? "Actual, from the closed books" : row[2].replace(/\{c\}/g, COL[sc]).replace(/\{p\}/g, COL[Math.max(sc - 1, 0)]);
      el.innerHTML = '<div class="x-bar"><span class="x-file">Sample Co. financial model.xlsx</span><span class="m-chip m-blue">LIVE FORMULAS</span><button type="button" class="m-btn m-sm" data-a="dl">' + (done ? "Prepared" : "Export to Excel") + '</button></div><div class="x-fx"><b>' + COL[sc] + (sr + 2) + '</b><span>' + fx + '</span></div><div class="x-wrap nosb"><div class="x-grid" style="grid-template-columns:34px minmax(150px,1.6fr) repeat(' + (wide ? 7 : 2) + ',minmax(64px,1fr))"><i></i><i>A</i>' + (wide ? COL : ["B", "C"]).map(function (x) { return "<i>" + x + "</i>"; }).join("") + "<i>1</i><b>USD thousands</b>" + (wide ? MO.map(function (m, i) { return '<b class="x-r' + (i === 0 ? " x-act" : "") + '">' + m + "</b>"; }).join("") : '<b class="x-r">Value</b><b>Source</b>') + R.map(function (r, ri) { return "<i>" + (ri + 2) + '</i><span class="' + (r[3] ? "x-tot" : "") + '">' + r[0] + "</span>" + (wide ? r[1].map(function (v, ci) { return '<button type="button" data-c="' + ri + ":" + ci + '" class="x-c' + (r[3] ? " x-tot" : "") + (ci === 0 ? " x-act" : "") + (ri === sr && ci === sc ? " x-sel" : "") + '">' + f(v) + "</button>"; }).join("") : '<button type="button" data-c="' + ri + ':0" class="x-c x-in' + (ri === sr ? " x-sel" : "") + '">' + r[1][0] + '</button><span class="x-src">' + r[2] + "</span>"); }).join("") + '</div></div><div class="x-tabs nosb">' + TABS.map(function (t, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + t + "</button>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane m-form"><span class="m-lab">DRIVE IT FROM HERE</span><div class="m-kv" style="border:0;padding-bottom:0"><span>Revenue growth a month</span><b>' + g + '%</b></div><input type="range" min="0" max="6" step="0.5" value="' + g + '" aria-label="Revenue growth" data-r="g"><div class="m-kv"><span>New hires from January</span><span class="m-stp"><button type="button" data-a="h-">&minus;</button><output>' + hires + '</output><button type="button" data-a="h+">+</button></span></div></div><div class="m-pane">' + (done ? '<div class="m-note">' + CHECK + " In the product this downloads a workbook with every formula intact, so an investor can change an assumption and watch it flow through. On this page it is a preview.</div>" : '<p class="m-p" style="font-size:15px">Tap any cell to see its formula. Actuals come from the closed books, and everything after is driven by the assumptions, the same ones the scenarios use.</p>') + '<p class="m-foot" style="padding:0">Some investors still want a spreadsheet. This one never goes out of date, because it is rebuilt from the ledger each time you export it.</p></div></div>';
      var r = el.querySelector("[data-r]"); r.addEventListener("input", function () { g = +this.value; draw(true); }); if (keep) r.focus();
    }
    on(el, "[data-c]", function (t) { sel = t.getAttribute("data-c"); draw(); });
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); sel = "0:1"; draw(); });
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"); if (a === "dl") done = true; if (a === "h-") hires = Math.max(0, hires - 1); if (a === "h+") hires = Math.min(10, hires + 1); draw(); }); draw();
  };

  /* ---------- live data room ---------- */
  W.dataroom = function (el) {
    var F = [["Financials", [["Monthly accounts, to November 2026", "live", "Closed 3 days after month end"], ["Financial model.xlsx", "live", "Rebuilt from the ledger today"], ["Board packs, last 12 months", "live", "November added on the 4th"], ["Audited accounts, 2025", "file", "Uploaded by your auditor"]]], ["Revenue and customers", [["Recurring revenue by customer", "live", "41 customers, updated today"], ["Retention by cohort", "live", "Updated today"], ["Top 20 customer contracts", "live", "Signed copies, from contracts"], ["Sales pipeline", "live", "7 open deals"]]], ["Company and cap table", [["Cap table", "live", "From company records"], ["Shareholders agreement", "file", "Signed March 2024"], ["Articles and board minutes", "file", "14 documents"], ["Option plan and grants", "live", "11 holders"]]], ["Team", [["Headcount and payroll summary", "live", "24 people"], ["Employment agreements", "file", "24 of 24 on file"], ["Key person insurance", "miss", "Not uploaded yet"]]], ["Tax and compliance", [["Sales tax by jurisdiction", "live", "This quarter to date"], ["Corporate tax returns, 2025", "file", "Uploaded by your adviser"], ["Data protection policy", "miss", "Not uploaded yet"]]]], cur = 0, shared = false;
    var CH = { live: ["LIVE", "m-blue"], file: ["ON FILE", ""], miss: ["MISSING", "m-warn"] };
    function draw() {
      var all = [].concat.apply([], F.map(function (x) { return x[1]; })), miss = all.filter(function (d) { return d[1] === "miss"; }).length, live = all.filter(function (d) { return d[1] === "live"; }).length;
      el.innerHTML = kp([["DOCUMENTS", all.length, "across " + F.length + " folders"], ["ALWAYS CURRENT", live, "built from your own records"], ["STILL MISSING", miss, "an agent has asked the owners"]]) + '<div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-list">' + F.map(function (x, i) { var m = x[1].filter(function (d) { return d[1] === "miss"; }).length; return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + x[0] + "</b><small>" + x[1].length + " documents" + (m ? ", " + m + " missing" : "") + "</small></span><b>" + (i + 1) + "</b></button>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">' + F[cur][0].toUpperCase() + "</span>" + F[cur][1].map(function (d) { return '<div class="m-li" style="padding:10px 0"><span><b>' + d[0] + "</b><small>" + d[2] + '</small></span><span class="m-chip ' + CH[d[1]][1] + '">' + CH[d[1]][0] + "</span></div>"; }).join("") + (shared ? '<div class="m-note">' + CHECK + " Link created for one investor, view only, expiring in 30 days. You will see what they open, and their questions arrive here.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="s">Share with an investor</button></div>') + '<p class="m-foot" style="padding:0">Live documents are generated from the books, contracts and company records each time someone opens them, so the room is ready before anyone asks.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); on(el, "[data-a]", function () { shared = true; draw(); }); draw();
  };

  /* ---------- audit readiness ---------- */
  W.audit = function (el) {
    var Q = [["Bank balances agree to statements", "3 accounts, reconciled to November 30", 1], ["Revenue ties to signed contracts", "25 sales tested against contract, invoice and payment", 0], ["Revenue is in the right month", "Sales either side of month end checked", 1], ["Accruals and prepaids are supported", "Each balance has its schedule and source document", 1], ["Fixed asset register agrees to the ledger", "25 assets, each with its invoice", 1], ["Payroll agrees to the provider", "12 pay runs matched", 1], ["Unusual journals are explained", "Manual entries over $10k listed with their reason", 0], ["Share capital agrees to the cap table", "From company records", 1]], run = false, cur = 1;
    var D = { 1: ["24 of 25 pass.", "One sale to Brightdesk was recognized in November but the amendment was signed on December 2. An agent has drafted the correcting entry for you to approve."], 6: ["9 manual journals over $10k.", "8 have a reason and an approver recorded. One reclassification in September has no note. The person who posted it has been asked."] };
    function draw() {
      var ok = Q.filter(function (q) { return q[2] || (run && false); }).length, pct = Math.round(ok / Q.length * 100);
      el.innerHTML = kp([["READY FOR AUDIT", run ? pct + "%" : "Not run yet", run ? ok + " of " + Q.length + " areas clean" : "takes a few minutes"], ["NEED ATTENTION", run ? Q.length - ok : "-", "each with a suggested fix"], ["SUPPORT FILES PREPARED", run ? "186" : "-", "ready to hand over"]]) + '<div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-list"><div class="m-grp"><span>What an auditor usually asks for</span><b>' + Q.length + "</b></div>" + Q.map(function (q, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + q[0] + "</b><small>" + q[1] + '</small></span><span class="m-chip ' + (!run ? "" : q[2] ? "m-blue" : "m-warn") + '">' + (!run ? "NOT RUN" : q[2] ? "CLEAN" : "LOOK") + "</span></button>"; }).join("") + '</div><div class="m-pane">' + (!run ? '<span class="m-lab">BEFORE THE AUDITORS ARRIVE</span><p class="m-p" style="font-size:15.5px">An agent runs the checks an auditor would, on your own books, and prepares the file of evidence for each one.</p><div class="m-acts"><button type="button" class="m-btn" data-a="run">Run a pre-audit</button></div>' : '<span class="m-lab">' + Q[cur][0].toUpperCase() + "</span>" + (Q[cur][2] ? '<div class="m-note">' + CHECK + " Clean. The supporting file is prepared and can be shared with your auditor as it is.</div>" : '<div class="m-inv"><div class="m-doch"><b>' + D[cur][0] + '</b><span class="m-chip m-warn">NEEDS A LOOK</span></div><p class="m-p" style="font-size:14.5px;margin:6px 0 0">' + D[cur][1] + "</p></div>") + '<div class="m-fl"><span>Evidence prepared</span><b>' + Q[cur][1] + "</b></div>") + '<p class="m-foot" style="padding:0">This prepares you for an audit and gives your auditor read-only access to the evidence. It does not replace the audit or the auditor\'s opinion.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); on(el, "[data-a]", function () { run = true; cur = 1; draw(); }); draw();
  };

  /* ---------- cap table and round modelling ---------- */
  W.captable = function (el) {
    var H = [["Founders", 6000000, "Common"], ["Seed investors", 2500000, "Preferred"], ["Options granted", 900000, "11 holders"], ["Options available", 600000, "Unallocated pool"]], raise = 8, pre = 32, on_ = true, COLS = ["#0B1B3A", "#2450DC", "#5B8CFF", "#B9C3D3", "#FFD15C"];
    function draw(keep) {
      var tot = H.reduce(function (a, h) { return a + h[1]; }, 0), nw = on_ ? Math.round(tot * raise / pre) : 0, post = tot + nw, rows = H.concat(on_ ? [["New investors", nw, "Preferred, new round"]] : []), price = pre * 1e6 / tot;
      el.innerHTML = kp([["SHARES, FULLY DILUTED", n0(post), on_ ? n0(nw) + " new" : "today"], ["PRICE PER SHARE", "$" + price.toFixed(2), "at $" + pre + "M before the round"], ["VALUE AFTER THE ROUND", on_ ? "$" + (pre + raise) + "M" : "-", on_ ? "new investors hold " + (nw / post * 100).toFixed(1) + "%" : "no round modelled"]]) + '<div class="ct-bar">' + rows.map(function (h, i) { return '<i style="flex:' + h[1] + ";background:" + COLS[i] + '" title="' + h[0] + '"></i>'; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-pane" style="padding:0"><div class="f-row f-hd"><span>Holder</span><b>Shares</b><b>Today</b><b>After</b></div>' + rows.map(function (h, i) { var isNew = i === 4; return '<div class="f-row"><span><i class="ct-dot" style="background:' + COLS[i] + '"></i>' + h[0] + " <small>" + h[2] + "</small></span><b>" + n0(h[1]) + "</b><b>" + (isNew ? "-" : (h[1] / tot * 100).toFixed(1) + "%") + '</b><b class="' + (on_ && !isNew ? "sl-dn" : "") + '">' + (h[1] / post * 100).toFixed(1) + "%</b></div>"; }).join("") + '</div><div class="m-pane m-form"><span class="m-lab">MODEL A NEW ROUND</span><div class="m-kv" style="border:0;padding-bottom:0"><span>Amount raised</span><b>$' + raise + 'M</b></div><input type="range" min="2" max="20" step="1" value="' + raise + '" aria-label="Amount raised" data-r="raise"><div class="m-kv" style="border:0;padding-bottom:0"><span>Value before the round</span><b>$' + pre + 'M</b></div><input type="range" min="12" max="80" step="2" value="' + pre + '" aria-label="Value before the round" data-r="pre"><div class="m-note">' + CHECK + " At these terms the founders go from 60.0% to " + (6000000 / post * 100).toFixed(1) + "%, and runway in the base case extends by about " + Math.round(raise * 1000 / 215) + ' months.</div><p class="m-foot" style="padding:0">The cap table agrees to share capital in the books. Modelling only: issuing shares needs your lawyers and board.</p></div></div>';
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { if (r.getAttribute("data-r") === "raise") raise = +this.value; else pre = +this.value; draw(r.getAttribute("data-r")); }); });
      if (keep) { var x = el.querySelector('[data-r="' + keep + '"]'); if (x) x.focus(); }
    }
    draw();
  };

  /* ---------- company documents ---------- */
  W.codocs = function (el) {
    var D = [["Shareholders agreement", "Signed March 2024, 9 parties", [["Board seats", "2 founders, 1 investor, 1 independent"], ["Investor consent needed for", "New share classes, debt over $500k, sale of the company"], ["Pre-emption on new shares", "Yes, 15 business days"], ["Information rights", "Monthly accounts within 30 days"]], "The monthly accounts go to investors automatically on day 5, inside the 30 days this agreement requires."], ["Option plan", "Adopted March 2024, 1,500,000 shares", [["Granted", "900,000 to 11 people"], ["Available", "600,000"], ["Vesting", "4 years, 1 year cliff"], ["Vesting this quarter", "56,250 options, 6 people"]], "The option expense is calculated each month and prepared for you to approve."], ["Board minutes and consents", "14 documents since incorporation", [["Last meeting", "September 17, 2026"], ["Next meeting", "December 4, 2026"], ["Open actions", "2, both owned by finance"], ["Awaiting signature", "1 written consent"]], "The December board pack is drafted, and the consent for the hosting contract is prepared for signature."], ["Company registrations", "Delaware, United Kingdom, Germany", [["Annual filings due", "Delaware franchise tax, March 1"], ["Registered agents", "3 on file"], ["Directors", "4"], ["Good standing", "All 3 entities"]], "Reminders go to the owner 60 and 30 days before each filing date."]], cur = 0;
    function draw() {
      var d = D[cur];
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-list"><div class="m-grp"><span>Company records</span><b>' + D.length + "</b></div>" + D.map(function (x, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + x[0] + "</b><small>" + x[1] + "</small></span></button>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">KEY TERMS, READ BY AN AGENT</span>' + d[2].map(function (k) { return '<div class="m-kv"><span>' + k[0] + '</span><b style="text-align:right">' + k[1] + "</b></div>"; }).join("") + '<div class="m-note">' + CHECK + " " + d[3] + '</div><p class="m-foot" style="padding:0">A register and reminders, not legal advice. Your lawyers still draft and file.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function sp(v) { var mx = Math.max.apply(null, v); return '<span class="t-sp">' + v.map(function (x, i) { return '<i style="height:' + Math.max(x / mx * 100, 6) + "%" + (i === v.length - 1 ? ";background:#2450DC" : "") + '"></i>'; }).join("") + "</span>"; }
  /* ---------- the daily view: behind you, needs you, ahead of you ---------- */
  W.today = function (el) {
    var Q = [["Why did margin fall?", "Gross margin fell 3.5 points because hosting rose $11.2k after a new region went live. Nothing else moved by more than $2k."], ["Can we afford two hires?", "Yes. Two sales hires in January take runway from 20 to 15 months in the base case, before any revenue they bring in."], ["Who is late paying?", "Three customers owe $32k past due. Northwind is the one to call: $18k, 34 days late."]], q = -1;
    var TODO = [["Entries to approve", 3, "211 routine ones are grouped into one"], ["Contract waiting for approval", 1, "Harbor Labs, two non-standard terms"], ["Follow-ups ready to send", 2, "Northwind and Tallis"], ["Bank line to match", 1, "$12,000 from Northwind"]];
    var BACK = [["November closed", "3 days after month end"], ["Revenue", "$335k, $5k ahead of plan"], ["Gross margin", "74.9%, 3 points behind plan"], ["Board pack", "Drafted, 17 slides"]];
    var AHEAD = [["Dec 4", "Board meeting", "Pack drafted, two decisions"], ["Jan", "Corvid Systems renews", "$180k, quote drafted"], ["Feb", "Brightdesk renews", "$72k, cut seats in November"], ["Mar 1", "Delaware filing due", "Reminder set"], ["Jul 2028", "Cash runs out, base case", "20 months away"]];
    function draw() {
      var left = TODO.reduce(function (a, t) { return a + t[1]; }, 0);
      el.innerHTML = '<div class="t-ask"><span class="t-in">Ask about your numbers</span><div>' + Q.map(function (x, i) { return '<button type="button" data-q="' + i + '" aria-pressed="' + (i === q) + '">' + x[0] + "</button>"; }).join("") + "</div>" + (q > -1 ? '<p class="t-ans">' + Q[q][1] + " <small>Sample answer, from the ledger.</small></p>" : "") + '</div><div class="t-kp">' + [["CASH", "$3.06M", "20 months of runway", [3.9, 3.7, 3.5, 3.28, 3.06]], ["RECURRING REVENUE", "$4.02M", "+4.1% on October", [3.43, 3.58, 3.72, 3.86, 4.02]], ["NET BURN", "$215k", "$8k over plan", [196, 199, 202, 205, 215]], ["OWED TO YOU", "$412k", "$32k of it overdue", [380, 371, 402, 398, 412]]].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span>" + sp(k[3]) + "</div>"; }).join("") + '</div><div class="t-cols"><div><span class="m-lab">BEHIND YOU</span>' + BACK.map(function (b) { return '<div class="m-fl"><span>' + b[0] + "</span><b>" + b[1] + "</b></div>"; }).join("") + '</div><div class="t-mid"><span class="m-lab" style="color:#C7D2E6">NEEDS YOU TODAY</span><b class="t-big">' + left + '</b>' + TODO.map(function (t, i) { return '<button type="button" data-t="' + i + '"' + (t[1] ? "" : " disabled") + "><span><b>" + t[0] + "</b><small>" + t[2] + "</small></span><em>" + (t[1] || "Done") + "</em></button>"; }).join("") + '</div><div><span class="m-lab">AHEAD OF YOU</span>' + AHEAD.map(function (a) { return '<div class="t-ah"><small>' + a[0] + "</small><span><b>" + a[1] + "</b><i>" + a[2] + "</i></span></div>"; }).join("") + "</div></div>";
    }
    on(el, "[data-q]", function (t) { var i = +t.getAttribute("data-q"); q = q === i ? -1 : i; draw(); });
    on(el, "[data-t]", function (t) { TODO[+t.getAttribute("data-t")][1] = 0; draw(); }); draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function n0(v) { return Math.round(v).toLocaleString("en-US"); }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function doc(tag, chip, cls, body) { return '<div class="fc-doc"><div class="fc-dh"><small>' + tag + '</small><em class="' + cls + '">' + chip + "</em></div>" + body + "</div>"; }
  function kv(a, b) { return '<div class="fc-kv"><span>' + a + "</span><b>" + b + "</b></div>"; }
  function stages(n) { return '<div class="fc-stg">' + ["Lead", "Qualified", "Demo", "Proposal", "Negotiation", "Won"].map(function (s, i) { return '<i class="' + (i < n ? "fc-past" : i === n ? "fc-now" : "") + '"><u>' + s + "</u></i>"; }).join("") + "</div>"; }

  /* ---------- the full cycle, one customer, shown as the things themselves ---------- */
  W.cycle = function (el) {
    var S = [["Lead", "Customers", "A lead arrives", "Ferro Marine asks for a demo. The company and the contact are created once, and every later step reuses them.", "Agent created the record", [180, 4020, 412, 3060, 540, 0],
        function () { return doc("CONTACT", "NEW LEAD", "fc-y", '<div class="fc-who"><i>LF</i><span><b>Lena Fischer</b><small>Operations Director, Ferro Marine</small></span></div>' + kv("Company", "Ferro Marine, 240 people") + kv("Came from", "Demo request on the website") + kv("Owner", "Priya")); }],
      ["Deal", "Deals", "It becomes an opportunity", "Priya qualifies it at $96,000 a year. The forecast starts counting it at its stage odds.", "Priya moved the deal", [199, 4020, 412, 3060, 540, 0],
        function () { return doc("DEAL", "QUALIFIED, 20%", "fc-b", '<b class="fc-t">Ferro Marine, 80 seats</b>' + stages(1) + kv("Value", "$96,000 a year") + kv("Counted in the forecast", "$19,200")); }],
      ["Negotiate", "Deals", "Proposal and negotiation", "Terms go back and forth. The deal moves up, and the forecast moves with it the same minute.", "Agent drafted the proposal", [252, 4020, 412, 3060, 540, 0],
        function () { return doc("DEAL", "NEGOTIATION, 75%", "fc-b", '<b class="fc-t">Ferro Marine, 80 seats</b>' + stages(4) + kv("Value", "$96,000 a year") + kv("Counted in the forecast", "$72,000")); }],
      ["Contract", "Contracts", "Won, and the contract is signed", "The contract is filled in from the deal, approved, and signed on the platform. Recurring revenue and commission are booked from it.", "You approved, the customer signed", [180, 4116, 412, 3060, 540, 0],
        function () { return doc("CONTRACT", "SIGNED", "fc-n", '<b class="fc-t">Subscription agreement</b>' + kv("Terms", "80 seats, $100 a month, 12 months") + kv("Billing", "Quarterly, net 30") + '<div class="fc-sig"><span>Lena Fischer</span><small>Signed on the platform, Nov 24</small></div>' + kv("Commission accrued for Priya", "$9,600")); }],
      ["Invoice", "Billing", "The first invoice goes out", "A quarterly invoice is drafted from the contract and sent. It is owed to you, and not yet earned.", "Agent drafted, you approved", [180, 4116, 436, 3060, 564, 0],
        function () { return doc("INVOICE INV-0162", "SENT", "fc-b", kv("Bill to", "Ferro Marine") + kv("For", "Subscription, Dec to Feb") + kv("Due", "December 24") + '<div class="fc-tot"><span>Amount</span><b>$24,000.00</b></div>'); }],
      ["Revenue", "Books", "Revenue lands in the books", "The first month is recognized. The rest waits as deferred revenue and is released month by month.", "Agent posted under your policy", [180, 4116, 436, 3060, 556, 8],
        function () { return doc("JOURNAL JE-1204", "POSTED", "fc-n", '<div class="fc-je"><span>Deferred revenue</span><b>8,000.00</b><b></b></div><div class="fc-je"><span style="padding-left:14px">Subscription revenue</span><b></b><b>8,000.00</b></div><div class="fc-rel"><i style="width:33.3%"></i></div>' + kv("Earned so far", "$8,000 of $24,000") + kv("Still deferred", "$16,000")); }],
      ["Cash", "Bank", "The customer pays", "The payment arrives and is matched to the invoice. The bank reconciles itself.", "Agent matched it", [180, 4116, 412, 3084, 556, 8],
        function () { return doc("BANK RECONCILIATION", "MATCHED", "fc-n", '<div class="fc-match"><div><small>BANK LINE</small><b>Incoming wire, Ferro Marine</b><span>24,000.00</span></div><em>=</em><div><small>INVOICE</small><b>INV-0162</b><span>24,000.00</span></div></div>' + kv("Paid", "4 days early")); }],
      ["Plan", "Plan", "The plan already knows", "Runway, the forecast and next month's board pack have all moved, because they read the same numbers.", "Nothing for you to do", [180, 4116, 412, 3084, 556, 8],
        function () { return doc("FORECAST", "UPDATED", "fc-b", '<div class="fc-bars">' + [3.58, 3.72, 3.86, 4.02, 4.116].map(function (v, i) { return '<i style="height:' + ((v - 3.2) / 0.95 * 100) + "%" + (i === 4 ? ";background:#2450DC" : "") + '"></i>'; }).join("") + "</div>" + ["Recurring revenue forecast raised", "Renewal added for November 2027", "Commission added to payroll forecast", "Board pack customer slide updated"].map(function (t) { return '<div class="fc-ck">' + CHECK + "<span>" + t + "</span></div>"; }).join("")); }]];
    var L = ["Pipeline in forecast", "Recurring revenue", "Owed to you", "Cash", "Deferred revenue", "Revenue from this deal"], cur = 0, play = true, tm;
    function draw() {
      var s = S[cur], p = S[Math.max(cur - 1, 0)][5];
      el.innerHTML = '<div class="fc"><div class="fc-rail nosb">' + S.map(function (x, i) { return '<button type="button" data-i="' + i + '" class="' + (i < cur ? "fc-done" : "") + '" aria-pressed="' + (i === cur) + '"><i>' + (i + 1) + "</i><span>" + x[0] + "</span></button>"; }).join("") + '</div><div class="fc-prog"><i style="width:' + ((cur + 1) / S.length * 100) + '%"></i></div><div class="fc-main"><div class="fc-stage"><span class="fc-where">' + s[1].toUpperCase() + "</span>" + s[6]() + '</div><div class="fc-text"><small>STEP ' + (cur + 1) + " OF " + S.length + "</small><b>" + s[2] + "</b><p>" + s[3] + '</p><span class="fc-by">' + CHECK + " " + s[4] + '</span><div class="fc-ctl"><button type="button" class="m-btn m-sm" data-a="play">' + (play ? "Pause" : "Play") + '</button><button type="button" class="m-btn m-sm m-ghost" data-a="next">Next &rarr;</button></div></div><div class="fc-nums"><span class="m-lab">WHAT MOVED</span>' + L.map(function (l, i) { var v = s[5][i], d = cur > 0 ? v - p[i] : 0; return '<div class="' + (d ? "fc-ch" : "") + '"><span>' + l + "</span><b>$" + n0(v) + "k</b><em>" + (d ? (d > 0 ? "+" : "") + d + "k" : "") + "</em></div>"; }).join("") + "</div></div></div>";
    }
    function tick() { if (!el.isConnected) { clearInterval(tm); return; } if (play) { cur = (cur + 1) % S.length; draw(); } }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); play = false; draw(); });
    on(el, "[data-a]", function (t) { if (t.getAttribute("data-a") === "play") play = !play; else { cur = (cur + 1) % S.length; play = false; } draw(); });
    draw(); tm = setInterval(tick, 4200);
  };

  /* ---------- revenue recognition and deferred revenue ---------- */
  W.revrec = function (el) {
    var tab = 0, by = 0, pol = 0, REL = [96, 88, 74, 62, 51, 44, 38, 31, 24, 18, 10, 4], MO = ["D", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N"];
    var BY = [[["Corvid Systems", 150], ["Atlas Payroll", 120], ["Northwind Ltd", 66], ["38 others", 204]], [["Subscriptions paid ahead", 452], ["Implementation not yet delivered", 58], ["Prepaid credits not yet used", 30]]];
    var AL = [["Subscription, 12 months", 48000, 48000, "Over 12 months from the license start"], ["Implementation", 15000, 10000, "As it is delivered"], ["Training, included free", 3000, 0, "When the sessions take place"]];
    var BR = [["Recurring revenue, divided by 12", 335, 0], ["Implementation and one-off work", 12, 1], ["Signed, license not yet started", -8, 1], ["Discounted first months", -4, 1], ["Revenue in the books, November", 335, 0]];
    function draw() {
      var body;
      if (tab === 0) { var mx = 96, rows = BY[by], top = rows[0][1]; body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">WHEN IT WILL BE EARNED, USD THOUSANDS</span><div class="a-bars" style="height:140px">' + REL.map(function (v, i) { return '<i style="height:' + v / mx * 100 + "%;background:" + (i < 3 ? "#2450DC" : "#B9C3D3") + '"></i>'; }).join("") + '</div><div class="a-ax a-mo">' + MO.map(function (m) { return "<span>" + m + "</span>"; }).join("") + '</div><div class="m-fl" style="margin-top:8px"><span>Earned in the next 3 months</span><b>$258k</b></div><div class="m-fl"><span>Earned after that</span><b>$282k</b></div></div><div class="m-pane"><div class="s-top"><span class="m-lab">WHERE IT SITS</span><div class="m-opts">' + ["By customer", "By type"].map(function (x, i) { return '<button type="button" data-b="' + i + '" aria-pressed="' + (i === by) + '">' + x + "</button>"; }).join("") + "</div></div>" + rows.map(function (r) { return '<div class="m-age" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 44px"><span>' + r[0] + '</span><div><i style="width:' + r[1] / top * 100 + '%;background:#0B1B3A"></i></div><b>' + r[1] + "</b></div>"; }).join("") + '<div class="m-kv m-tot"><span>Deferred revenue on the balance sheet</span><b>$540k</b></div></div></div>'; }
      else if (tab === 1) { var list = AL.reduce(function (a, x) { return a + x[1]; }, 0), price = AL.reduce(function (a, x) { return a + x[2]; }, 0); body = '<div class="m-pane"><div class="m-doch"><b>Harbor Labs: one price, three promises</b><span>Charged $' + n0(price) + ", worth $" + n0(list) + ' at list</span></div><div class="f-row f-hd f-5"><span>What was promised</span><b>List price</b><b>Charged</b><b>Counted as</b><b>Share</b></div>' + AL.map(function (x) { var al = x[1] / list * price; return '<div class="f-row f-5"><span>' + x[0] + " <small>" + x[3] + "</small></span><b>" + n0(x[1]) + "</b><b>" + n0(x[2]) + '</b><b class="sl-up">' + n0(al) + "</b><b>" + (x[1] / list * 100).toFixed(0) + "%</b></div>"; }).join("") + '<div class="f-row f-5 f-sub"><span>Total</span><b>' + n0(list) + "</b><b>" + n0(price) + "</b><b>" + n0(price) + '</b><b>100%</b></div><p class="m-foot" style="padding:8px 0 0">When one price covers several things, the price is shared out by what each would cost alone, so free training still earns its share when it is delivered. An agent proposes the split from your revenue policy and you approve it.</p></div>'; }
      else if (tab === 3) { var PO = [["As it is delivered", "Recognized as the work is done", [5000, 5000, 0, 0]], ["Evenly over the contract", "Spread across all 12 months", [833, 833, 833, 833]], ["When the customer goes live", "All at once on the go-live date", [0, 10000, 0, 0]]], P = PO[pol]; body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">YOUR POLICY, BY KIND OF REVENUE</span>' + [["Subscriptions", "Evenly over the term, from the license start"], ["Usage", "As it is used"], ["Prepaid credits", "As they are used, the rest when they expire"], ["Goods", "When they are delivered"], ["Milestone projects", "As each milestone is accepted"]].map(function (r) { return '<div class="m-fl"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>"; }).join("") + '<div class="m-kv"><span>Implementation fees</span></div><div class="m-opts" style="justify-content:flex-start">' + PO.map(function (x, i) { return '<button type="button" data-p="' + i + '" aria-pressed="' + (i === pol) + '">' + x[0] + "</button>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">WHAT THAT CHOICE DOES TO A $10,000 IMPLEMENTATION FEE</span><div class="m-stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + ["Dec", "Jan", "Feb", "Mar"].map(function (m, i) { return "<div" + (P[2][i] ? ' class="m-good"' : "") + "><small>" + m.toUpperCase() + "</small><b>$" + P[2][i].toLocaleString("en-US") + "</b></div>"; }).join("") + '</div><p class="m-p" style="font-size:15px">' + P[1] + '. The policy is written once, applied to every contract by an agent, and versioned, so an auditor can see which rule each entry followed.</p><p class="m-foot" style="padding:0">Built to follow ASC 606 in the US and IFRS 15 internationally. Which treatment is right for you is your accountant\'s call, and the system then applies it consistently.</p></div></div>'; }
      else if (tab === 4) { var ST = [["Identify the contract", "A signed agreement with terms both sides can be held to.", "Harbor Labs signed on the platform on November 12.", "Contracts"], ["Identify the promises in it", "Each separate thing the customer is getting. The standard calls them performance obligations.", "Three: the subscription, implementation and training.", "Read from the contract by an agent"], ["Set the price", "What you expect to be paid, after discounts and anything that may vary.", "$58,000 in total.", "From the order form"], ["Share the price across the promises", "By what each would cost if sold alone.", "$42,182, $13,182 and $2,636.", "One price, several promises"], ["Recognize revenue as each promise is kept", "Over time or at a point in time, depending on the promise.", "Over 12 months, as delivered, and when the sessions take place.", "Your recognition policy"]]; body = '<div class="m-pane"><span class="m-lab">THE FIVE STEPS OF ASC 606 AND IFRS 15, ON ONE CONTRACT</span><div class="rr-steps">' + ST.map(function (x, i) { return '<div><i>' + (i + 1) + "</i><span><b>" + x[0] + "</b><small>" + x[1] + '</small></span><span class="rr-ex">' + x[2] + "<small>" + x[3] + "</small></span></div>"; }).join("") + '</div><p class="m-foot" style="padding:10px 0 0">ASC 606 is the US revenue standard and IFRS 15 is its international twin. They share these five steps. Countahead keeps the working for each step against every contract, which is what an auditor asks to see. The judgement calls stay with you and your accountant.</p></div>'; }
      else { var run = 0; body = '<div class="m-pane"><span class="m-lab">FROM THE SALES NUMBER TO THE ACCOUNTING NUMBER, USD THOUSANDS</span>' + BR.map(function (r) { return '<div class="f-row ' + (r[2] ? "" : "f-sub") + '" style="grid-template-columns:minmax(0,2.4fr) minmax(0,1fr)"><span>' + r[0] + '</span><b class="' + (r[2] ? (r[1] > 0 ? "sl-up" : "sl-dn") : "") + '">' + (r[2] && r[1] > 0 ? "+" : "") + (r[1] < 0 ? "(" + -r[1] + ")" : r[1]) + "</b></div>"; }).join("") + '<p class="m-foot" style="padding:8px 0 0">Sales talks in recurring revenue and accounting talks in recognized revenue. Both come from the same contracts here, so the difference is explained line by line.</p></div>'; }
      el.innerHTML = '<div class="a-views">' + ["Deferred revenue", "One price, several promises", "Sales number to accounting number", "Your recognition policy", "ASC 606, step by step"].map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + x + "</button>"; }).join("") + "</div>" + body;
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-b]", function (t) { by = +t.getAttribute("data-b"); draw(); }); on(el, "[data-p]", function (t) { pol = +t.getAttribute("data-p"); draw(); }); draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  function runway(h) { var cash = 3060, rev = 335, opx = 178; for (var m = 1; m <= 96; m++) { rev *= 1.02; opx *= 1.01; cash -= 372 + h * 17 + opx - rev; if (cash <= 0) return m; } return 96; }
  /* ---------- ask the ledger: type or speak, sample answers ---------- */
  W.ask = function (el) {
    var A = [[/margin/, "Gross margin fell from 78.4% to 74.9% in November.", "It is cost, not price. Hosting rose $11.2k after a new region went live on November 3, and support contractors rose $3.3k. Revenue grew 4.0% in the same month.", "14 entries in 5100 Hosting, 6 in 5200 Support, November revenue by customer"],
      [/hire|hiring|headcount/, function (q) { var n = +(q.match(/\d+/) || [0])[0] || ({ two: 2, three: 3, four: 4, five: 5, six: 6 })[(q.match(/two|three|four|five|six/) || [""])[0]] || 5; n = Math.min(n, 12); return [n + (n === 1 ? " hire takes" : " hires take") + " runway from 20 months to " + runway(n) + ".", "Each hire is counted at $17k a month from January, with no revenue from them. Sales hires would bring some back after about three months.", "Base scenario, payroll forecast, sample cost per hire"]; }],
      [/runway|how long|cash last|run out/, "You have 20 months of runway, to July 2028.", "That is the base case: revenue growing 2% a month and costs 1%. With no growth it is 15 months.", "Cash of $3.06M, November burn of $215k, base scenario"],
      [/expense|cost|spend|increase/, "Hosting increased most: up $11.2k on October.", "Next were support contractors, up $3.3k, and commissions, up $2.1k. Every other cost line moved by less than $2k.", "All expense accounts, November against October"],
      [/late|overdue|owe|collect|unpaid/, "Three customers owe $32k past due.", "Northwind is $18k and 34 days late, Tallis and Co is $9k and 12 days late, and Oakline Health is $5k and 3 days late. Follow-ups are drafted for all three.", "Open invoices and payment history"],
      [/churn|lost|cancel|renew/, "One customer was lost in November: Meridian Labs, $92k a year.", "Brightdesk also cut 10 seats, worth $24k. Two large renewals come up by February: Corvid Systems and Brightdesk.", "Signed contracts and renewal dates"],
      [/revenue|sales|growth|arr|recurring/, "Revenue was $335k in November, up 4.0%.", "Recurring revenue reached $4.02M a year, up $160k: $276k gained from new customers and upsells, $116k lost.", "41 contracts, November revenue schedule"],
      [/cash|bank|balance/, "You have $3.06M in the bank.", "That is $215k less than October, in line with the month's loss. All three accounts are reconciled to today.", "3 bank accounts, reconciled today"]];
    var SUG = ["Why did gross margin fall?", "What if we hire five people?", "Who is late paying?", "How much runway do we have?"], T = [], voice = false, hearing = false;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, canSpeak = "speechSynthesis" in window;
    function answer(q) { var l = q.toLowerCase(); for (var i = 0; i < A.length; i++) if (A[i][0].test(l)) { var a = A[i]; return typeof a[1] === "function" ? a[1](l) : [a[1], a[2], a[3]]; } return ["This preview only knows a handful of sample questions.", "Try one of the suggestions below. In the product, the answer comes from your own ledger, with the entries behind it.", ""]; }
    function say(t) { if (!voice || !canSpeak) return; try { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.rate = 1.02; window.speechSynthesis.speak(u); } catch (e) {} }
    function ask(q) { q = (q || "").trim(); if (!q) return; var a = answer(q); T.push([q, a]); if (T.length > 3) T.shift(); draw(); say(a[0] + " " + a[1]); var inp = el.querySelector("input"); if (inp) inp.focus(); }
    function draw() {
      el.innerHTML = '<div class="q-thread">' + (T.length ? T.map(function (x) { return '<div class="q-q">' + x[0].replace(/</g, "&lt;") + '</div><div class="q-a"><b>' + x[1][0] + "</b><p>" + x[1][1] + "</p>" + (x[1][2] ? "<small><strong>Working:</strong> " + x[1][2] + "</small>" : "") + "</div>"; }).join("") : '<div class="q-empty"><b>Ask anything about the numbers.</b><span>Type a question, or tap the microphone and say it.</span></div>') + '</div><div class="q-sug">' + SUG.map(function (s) { return '<button type="button" data-s="' + s + '">' + s + "</button>"; }).join("") + '</div><form class="q-bar"><input type="text" placeholder="Ask about your numbers" aria-label="Ask about your numbers" autocomplete="off">' + (SR ? '<button type="button" class="q-mic' + (hearing ? " q-on" : "") + '" data-a="mic" aria-label="Speak your question"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" fill="currentColor"></rect><path d="M5 11a7 7 0 0014 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2"></path></svg></button>' : "") + '<button type="submit" class="m-btn">Ask</button></form><div class="q-foot">' + (canSpeak ? '<button type="button" class="m-link" data-a="voice" aria-pressed="' + voice + '">' + (voice ? "Reading answers aloud: on" : "Read answers aloud") + "</button>" : "") + "<span>Sample answers on sample data. In the product, every answer shows the entries behind it.</span></div>";
      var th = el.querySelector(".q-thread"); th.scrollTop = th.scrollHeight;
    }
    el.addEventListener("submit", function (e) { e.preventDefault(); ask(el.querySelector("input").value); });
    el.addEventListener("click", function (e) {
      var s = e.target.closest("[data-s]"); if (s) { ask(s.getAttribute("data-s")); return; }
      var a = e.target.closest("[data-a]"); if (!a) return;
      if (a.getAttribute("data-a") === "voice") { voice = !voice; if (!voice && canSpeak) window.speechSynthesis.cancel(); draw(); if (voice && T.length) say(T[T.length - 1][1][0]); }
      else if (SR && !hearing) { try { var r = new SR(); r.lang = "en-US"; r.interimResults = false; hearing = true; draw(); r.onresult = function (ev) { hearing = false; ask(ev.results[0][0].transcript); }; r.onerror = r.onend = function () { if (hearing) { hearing = false; draw(); } }; r.start(); } catch (x) { hearing = false; draw(); } }
    });
    draw();
  };
})();

/* Round seven: investor-grade financial model, tax, policies and audit. Sample data throughout. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function n0(v) { return Math.round(v).toLocaleString("en-US"); }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function kp(a, cls) { return '<div class="a-kp ' + (cls || "") + '">' + a.map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + "</div>"; }
  function mlabel(m) { var d = new Date(2026, 10 + m, 1); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()] + " " + String(d.getFullYear()).slice(2); }
  function build(sc) {
    var N = 24, k, R = {}; ["open","nw","ex","ch","close","rev","cogs","gp","rd","sm","ga","ebitda","da","int","tax","ni","hRd","hSm","hCs","hOps","hGa","heads","pay","ar","pre","fa","cash","ta","ap","def","tl","eq","cfo","wc","capex","fin","dcash","burn"].forEach(function (x) { R[x] = []; });
    function set(m, o) { for (k in o) R[k][m] = o[k]; }
    set(0, { open: 3860, nw: 180, ex: 96, ch: 116, close: 4020, rev: 335, cogs: 84, gp: 251, rd: 228, sm: 142, ga: 100, ebitda: -219, da: 4, int: 9, tax: 1, ni: -215, hRd: 11, hSm: 5, hCs: 3, hOps: 3, hGa: 2, heads: 24, pay: 372, ar: 412, pre: 86, fa: 74, cash: 3060, ta: 3632, ap: 319, def: 540, tl: 859, eq: 2773, cfo: -211, wc: 0, capex: 4, fin: 0, dcash: -215, burn: 215 });
    for (var m = 1; m <= N; m++) {
      var p = m - 1, open = R.close[p], nw = sc.nw * Math.pow(1 + sc.ng / 100, m - 1) + (m >= 5 ? sc.sh * 20 : 0), ex = open * sc.ex / 100, ch = open * sc.ch / 100, close = open + nw + ex - ch + (sc.priceM === m ? open * 0.06 : 0) - (sc.lossM === m ? 180 : 0), rev = close / 12;
      var hRd = 11 + (m >= 3 ? sc.eh : 0), hSm = 5 + (m >= 2 ? sc.sh : 0), g = Math.pow(1.01, m) * (sc.cut && m >= 2 ? 0.8 : 1);
      var cogs = rev * (1 - sc.gm / 100), rd = hRd * 18.5 + 24.5 * g, sm = hSm * 15.5 + 30 + 0.085 * (nw + ex) + 11 * g, ga = 61 + 39 * g;
      var ebitda = rev - cogs - rd - sm - ga, int = R.cash[p] * 0.003, ni = ebitda - 4 + int - 1;
      var ar = rev * sc.dso / 30, def = 540 * rev / 335, ap = 319 * (cogs + rd + sm + ga) / 554, wc = -(ar - R.ar[p]) + (def - R.def[p]) + (ap - R.ap[p]);
      var cfo = ni + 4 + wc, fin = sc.rm === m ? sc.ra * 1000 : 0, cash = R.cash[p] + cfo - 4 + fin, pay = hRd * 18.5 + hSm * 15.5 + 30 + 33 + 28;
      set(m, { open: open, nw: nw, ex: ex, ch: ch, close: close, rev: rev, cogs: cogs, gp: rev - cogs, rd: rd, sm: sm, ga: ga, ebitda: ebitda, da: 4, int: int, tax: 1, ni: ni, hRd: hRd, hSm: hSm, hCs: 3, hOps: 3, hGa: 2, heads: hRd + hSm + 8, pay: pay, ar: ar, pre: 86, fa: 74, cash: cash, ta: cash + ar + 160, ap: ap, def: def, tl: ap + def, eq: R.eq[p] + ni + fin, cfo: cfo, wc: wc, capex: 4, fin: fin, dcash: cfo - 4 + fin, burn: -(cfo - 4) });
    }
    return R;
  }
  

  W._build = build; W._mlabel = mlabel;
  /* ---------- the financial model ---------- */
  W.model = function (el) {
    var SC = [{ n: "Downside", nw: 40, ng: 0, ex: 0.6, ch: 1.3, gm: 74, sh: 0, eh: 0, dso: 40, rm: 0, ra: 8 }, { n: "Base", nw: 110, ng: 1, ex: 1.0, ch: 0.9, gm: 75, sh: 1, eh: 1, dso: 37, rm: 0, ra: 8 }, { n: "Upside", nw: 170, ng: 2.5, ex: 1.3, ch: 0.7, gm: 76, sh: 3, eh: 1, dso: 35, rm: 0, ra: 8 }], si = 1, tab = 0, view = 1, sel = null, done = false;
    var TABS = ["Summary", "Assumptions", "Revenue", "People", "Income statement", "Balance sheet", "Cash flow"];
    /* row: key, label, kind (f flow, s stock, o opening), sign, total?, formula */
    var ROWS = { 2: [["open", "Opening recurring revenue", "o", 1, 0, "=prior closing"], ["nw", "New customers", "f", 1, 0, "=Assumptions!new * (1+growth)^n + ramped sales hires * 20"], ["ex", "Expansion", "f", 1, 0, "=opening * Assumptions!expansion"], ["ch", "Churn and downsell", "f", -1, 0, "=-opening * Assumptions!churn"], ["close", "Closing recurring revenue", "s", 1, 1, "=opening + new + expansion - churn"], ["rev", "Revenue recognized", "f", 1, 0, "=closing / 12"]],
      3: [["hRd", "Research and development", "s", 1, 0, "=11 + engineering hires"], ["hSm", "Sales and marketing", "s", 1, 0, "=5 + sales hires"], ["hCs", "Customer success", "s", 1, 0, "=3"], ["hOps", "Operations", "s", 1, 0, "=3"], ["hGa", "Finance and admin", "s", 1, 0, "=2"], ["heads", "Total people", "s", 1, 1, "=SUM(above)"], ["pay", "Payroll, $k", "f", 1, 0, "=SUMPRODUCT(people, cost per person)"]],
      4: [["rev", "Revenue", "f", 1, 0, "=Revenue!recognized"], ["cogs", "Cost of revenue", "f", -1, 0, "=-revenue * (1 - Assumptions!gross margin)"], ["gp", "Gross profit", "f", 1, 1, "=revenue - cost of revenue"], ["gm", "Gross margin", "p", 1, 0, "=gross profit / revenue"], ["rd", "Research and development", "f", -1, 0, "=-(People!R&D * 18.5 + tools)"], ["sm", "Sales and marketing", "f", -1, 0, "=-(People!sales * 15.5 + success + commissions at 8.5% + marketing)"], ["ga", "General and administrative", "f", -1, 0, "=-(operations and finance payroll + overheads)"], ["ebitda", "EBITDA", "f", 1, 1, "=gross profit - operating costs"], ["da", "Depreciation", "f", -1, 0, "=-fixed asset register"], ["int", "Interest income", "f", 1, 0, "=prior cash * 0.3%"], ["tax", "Income tax", "f", -1, 0, "=state minimum taxes"], ["ni", "Net income", "f", 1, 1, "=EBITDA - depreciation + interest - tax"]],
      5: [["cash", "Cash", "s", 1, 0, "=Cash flow!closing cash"], ["ar", "Accounts receivable", "s", 1, 0, "=revenue * Assumptions!days to collect / 30"], ["pre", "Prepaid expenses", "s", 1, 0, "=held flat"], ["fa", "Fixed assets, net", "s", 1, 0, "=prior + purchases - depreciation"], ["ta", "Total assets", "s", 1, 1, "=SUM(assets)"], ["ap", "Payables and accruals", "s", 1, 0, "=scaled to operating costs"], ["def", "Deferred revenue", "s", 1, 0, "=scaled to revenue"], ["tl", "Total liabilities", "s", 1, 1, "=payables + deferred revenue"], ["eq", "Equity", "s", 1, 1, "=prior + net income + new funding"], ["chk", "Check: assets less liabilities and equity", "c", 1, 0, "=total assets - total liabilities - equity"]],
      6: [["ni", "Net income", "f", 1, 0, "=Income statement!net income"], ["da", "Depreciation, added back", "f", 1, 0, "=Income statement!depreciation"], ["wc", "Change in working capital", "f", 1, 0, "=-change in receivables + change in deferred revenue + change in payables"], ["cfo", "Cash from operations", "f", 1, 1, "=net income + depreciation + working capital"], ["capex", "Equipment purchases", "f", -1, 0, "=-fixed asset purchases"], ["fin", "New funding", "f", 1, 0, "=Assumptions!round"], ["dcash", "Change in cash", "f", 1, 1, "=operations - purchases + funding"], ["cash", "Closing cash", "s", 1, 1, "=prior cash + change in cash"]],
      0: [["close", "Recurring revenue", "s", 1, 1, "=Revenue!closing"], ["rev", "Revenue", "f", 1, 0, "=Revenue!recognized"], ["ebitda", "EBITDA", "f", 1, 0, "=Income statement!EBITDA"], ["burn", "Cash burn", "f", 1, 0, "=-(cash from operations - purchases)"], ["cash", "Closing cash", "s", 1, 1, "=Cash flow!closing cash"], ["heads", "People", "s", 1, 0, "=People!total"]] };
    function cols() { if (view === 0) { var a = []; for (var m = 1; m <= 24; m++) a.push([mlabel(m), m, m]); return a; } if (view === 1) return [0, 1, 2, 3, 4, 5, 6, 7].map(function (q) { return ["Qtr to " + mlabel(q * 3 + 3), q * 3 + 1, q * 3 + 3]; }); return [["Year to Nov 27", 1, 12], ["Year to Nov 28", 13, 24]]; }
    function val(R, r, a, b) { var k = r[0]; if (k === "gm") { var g = 0, v = 0; for (var m = a; m <= b; m++) { g += R.gp[m]; v += R.rev[m]; } return g / v * 100; } if (k === "chk") return R.ta[b] - R.tl[b] - R.eq[b]; if (r[2] === "s") return R[k][b]; if (r[2] === "o") return R[k][a]; var s = 0; for (var i = a; i <= b; i++) s += R[k][i]; return s * r[3]; }
    function fmt(r, v) { if (r[0] === "gm") return v.toFixed(1) + "%"; if (r[0] === "chk") return Math.abs(v) < 0.5 ? "0" : n0(v); var x = Math.round(v); return x < 0 ? "(" + n0(-x) + ")" : n0(x); }
    function chart(R, k, col, zero) { var a = R[k], mx = Math.max.apply(null, a), mn = Math.min(0, Math.min.apply(null, a)), Wd = 300, H = 90; function y(v) { return 6 + (mx - v) / (mx - mn || 1) * (H - 12); } return '<svg viewBox="0 0 ' + Wd + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' + (zero ? '<line x1="0" x2="' + Wd + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#0B1B3A" stroke-width="1"></line>' : "") + '<polygon fill="' + col + '" opacity=".1" points="0,' + y(mn) + " " + a.map(function (v, m) { return (m / 24 * Wd).toFixed(1) + "," + y(v).toFixed(1); }).join(" ") + " " + Wd + "," + y(mn) + '"></polygon><polyline fill="none" stroke="' + col + '" stroke-width="2.5" points="' + a.map(function (v, m) { return (m / 24 * Wd).toFixed(1) + "," + y(v).toFixed(1); }).join(" ") + '"></polyline></svg>'; }
    function draw(keep) {
      var sc = SC[si], R = build(sc), C = cols(), out = -1, be = -1, low = Infinity, m;
      for (m = 1; m <= 24; m++) { if (out < 0 && R.cash[m] <= 0) out = m; if (be < 0 && R.burn[m] <= 0) be = m; if (R.cash[m] < low) low = R.cash[m]; }
      var body;
      if (tab === 1) {
        var D = [["New recurring revenue a month, $k", "nw", ""], ["Growth in new business a month", "ng", "%"], ["Expansion a month, share of opening", "ex", "%"], ["Churn a month, share of opening", "ch", "%"], ["Gross margin", "gm", "%"], ["Sales hires from January", "sh", ""], ["Engineering hires from February", "eh", ""], ["Days to collect", "dso", ""]];
        body = '<div class="x-wrap nosb"><div class="x-grid" style="grid-template-columns:34px minmax(220px,2fr) repeat(3,minmax(90px,1fr))"><i></i><i>A</i><i>B</i><i>C</i><i>D</i><i>1</i><b>Driver</b>' + SC.map(function (x, i) { return '<b class="x-r' + (i === si ? " x-hi" : "") + '">' + x.n + "</b>"; }).join("") + D.map(function (d, ri) { return "<i>" + (ri + 2) + "</i><span>" + d[0] + "</span>" + SC.map(function (x, i) { return '<span class="x-c x-in' + (i === si ? " x-hi" : "") + '">' + x[d[1]] + d[2] + "</span>"; }).join(""); }).join("") + "<i>10</i><span>New funding round</span>" + SC.map(function (x, i) { return '<span class="x-c x-in' + (i === si ? " x-hi" : "") + '">' + (x.rm ? "$" + x.ra + "M, " + mlabel(x.rm) : "None") + "</span>"; }).join("") + '</div></div><p class="x-key"><span class="x-in">Blue</span> cells are inputs you can change. <span>Black</span> cells are formulas. <span class="x-ac">Shaded</span> cells are actuals from the closed books.</p>';
      } else {
        var rows = ROWS[tab], sr = sel ? +sel.split(":")[0] : -1, scn = sel ? +sel.split(":")[1] : -1, fx = sel && rows[sr] ? (scn === 0 ? "Actual, from the closed books" : rows[sr][5]) : "Tap a cell to see its formula", ref = sel && rows[sr] ? String.fromCharCode(66 + Math.min(scn, 24)) + (sr + 2) : "";
        body = (tab === 0 ? '<div class="x-sum"><div><small>RECURRING REVENUE</small>' + chart(R, "close", "#2450DC") + "</div><div><small>CASH</small>" + chart(R, "cash", "#0B1B3A", 1) + "</div><div><small>MONTHLY BURN</small>" + chart(R, "burn", "#8A5A00", 1) + "</div></div>" : "") + '<div class="x-fx"><b>' + (ref || "fx") + "</b><span>" + fx + '</span></div><div class="x-wrap nosb"><div class="x-grid" style="grid-template-columns:34px minmax(210px,2fr) repeat(' + (C.length + 1) + ',minmax(' + (view === 0 ? 62 : 84) + 'px,1fr))"><i></i><i>A</i>' + [0].concat(C).map(function (c, i) { return "<i>" + (i < 26 ? String.fromCharCode(66 + i) : "") + "</i>"; }).join("") + '<i>1</i><b>USD thousands</b><b class="x-r x-act">Nov 26 A</b>' + C.map(function (c) { return '<b class="x-r">' + c[0] + "</b>"; }).join("") + rows.map(function (r, ri) { return "<i>" + (ri + 2) + '</i><span class="' + (r[4] ? "x-tot" : "") + (r[0] === "chk" ? " x-chk" : "") + '">' + r[1] + '</span><button type="button" data-c="' + ri + ':0" class="x-c x-act' + (r[4] ? " x-tot" : "") + (sel === ri + ":0" ? " x-sel" : "") + '">' + fmt(r, val(R, r, 0, 0)) + "</button>" + C.map(function (c, ci) { return '<button type="button" data-c="' + ri + ":" + (ci + 1) + '" class="x-c' + (r[4] ? " x-tot" : "") + (r[0] === "chk" ? " x-chk" : "") + (sel === ri + ":" + (ci + 1) ? " x-sel" : "") + '">' + fmt(r, val(R, r, c[1], c[2])) + "</button>"; }).join(""); }).join("") + "</div></div>";
      }
      el.innerHTML = '<div class="x-bar"><span class="x-file">Sample Co. operating model.xlsx</span><div class="m-opts">' + SC.map(function (x, i) { return '<button type="button" data-s="' + i + '" aria-pressed="' + (i === si) + '">' + x.n + '</button>'; }).join("") + '</div><div class="m-opts">' + ["Monthly", "Quarterly", "Annual"].map(function (x, i) { return '<button type="button" data-v="' + i + '" aria-pressed="' + (i === view) + '">' + x + '</button>'; }).join("") + '</div><button type="button" class="m-btn m-sm" data-a="dl">' + (done ? "Prepared" : "Export to Excel") + "</button></div>" + kp([["RECURRING REVENUE, NOV 28", "$" + (R.close[24] / 1000).toFixed(2) + "M", "from $4.02M today"], ["LOWEST CASH", low <= 0 ? "Runs out" : "$" + (low / 1000).toFixed(2) + "M", out > 0 ? "cash out " + mlabel(out) : "never below zero"], ["BREAKS EVEN", be > 0 ? mlabel(be) : "Not in 24 months", be > 0 ? "month " + be : "burn of $" + n0(R.burn[24]) + "k at the end"], ["PEOPLE, NOV 28", R.heads[24], "from 24 today"]]) + body + '<div class="x-tabs nosb">' + TABS.map(function (t, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + t + '</button>'; }).join("") + '</div><div class="x-chk-row"><span>' + CHECK + " Balance sheet balances in every month</span><span>" + CHECK + " Cash flow ties to the balance sheet</span><span>" + CHECK + " November ties to the closed books</span></div>" +
        '<div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane m-form"><span class="m-lab">' + sc.n.toUpperCase() + ": CHANGE A DRIVER</span>" + [["New recurring revenue a month", "nw", 20, 250, 10, "$", "k"], ["Churn a month", "ch", 0.3, 2, 0.1, "", "%"], ["Gross margin", "gm", 65, 85, 1, "", "%"]].map(function (d) { return '<div class="m-kv" style="border:0;padding-bottom:0"><span>' + d[0] + "</span><b>" + d[5] + sc[d[1]] + d[6] + '</b></div><input type="range" min="' + d[2] + '" max="' + d[3] + '" step="' + d[4] + '" value="' + sc[d[1]] + '" aria-label="' + d[0] + '" data-r="' + d[1] + '">'; }).join("") + '</div><div class="m-pane m-form"><span class="m-lab">PEOPLE AND FUNDING</span><div class="m-kv"><span>Sales hires from January</span><span class="m-stp"><button type="button" data-a="sh-">&minus;</button><output>' + sc.sh + '</output><button type="button" data-a="sh+">+</button></span></div><div class="m-kv"><span>Engineering hires from February</span><span class="m-stp"><button type="button" data-a="eh-">&minus;</button><output>' + sc.eh + '</output><button type="button" data-a="eh+">+</button></span></div><div class="m-kv"><span>New funding round</span><span class="m-opts"><button type="button" data-a="r0" aria-pressed="' + !sc.rm + '">No</button><button type="button" data-a="r1" aria-pressed="' + !!sc.rm + '">Yes</button></span></div>' + (sc.rm ? '<div class="m-kv"><span>Amount raised</span><span class="m-stp"><button type="button" data-a="ra-" aria-label="Raise less">&minus;</button><output style="min-width:64px">$' + sc.ra + 'M</output><button type="button" data-a="ra+" aria-label="Raise more">+</button></span></div><div class="m-kv"><span>Money arrives</span><span class="m-stp"><button type="button" data-a="rm-" aria-label="Earlier">&minus;</button><output style="min-width:84px">' + mlabel(sc.rm) + '</output><button type="button" data-a="rm+" aria-label="Later">+</button></span></div>' : "") + (done ? '<div class="m-note">' + CHECK + " In the product this downloads the workbook with every formula live, so an investor can change an input and watch three statements move. On this page it is a preview.</div>" : '<p class="m-foot" style="padding:0">A three-statement model for 24 months, rebuilt from the ledger each time. Sample assumptions.</p>') + "</div></div>";
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { SC[si][r.getAttribute("data-r")] = +this.value; draw(r.getAttribute("data-r")); }); });
      if (keep) { var x = el.querySelector('[data-r="' + keep + '"]'); if (x) x.focus(); }
    }
    on(el, "[data-c]", function (t) { sel = t.getAttribute("data-c"); draw(); });
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); sel = null; draw(); });
    on(el, "[data-s]", function (t) { si = +t.getAttribute("data-s"); draw(); });
    on(el, "[data-v]", function (t) { view = +t.getAttribute("data-v"); sel = null; draw(); });
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"), s = SC[si]; if (a === "dl") done = true; if (a === "sh-") s.sh = Math.max(0, s.sh - 1); if (a === "sh+") s.sh = Math.min(8, s.sh + 1); if (a === "eh-") s.eh = Math.max(0, s.eh - 1); if (a === "eh+") s.eh = Math.min(8, s.eh + 1); if (a === "r0") s.rm = 0; if (a === "r1") s.rm = 7; if (a === "ra-") s.ra = Math.max(1, s.ra - 1); if (a === "ra+") s.ra = Math.min(40, s.ra + 1); if (a === "rm-") s.rm = Math.max(1, s.rm - 1); if (a === "rm+") s.rm = Math.min(24, s.rm + 1); draw(); });
    draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function n0(v) { return Math.round(v).toLocaleString("en-US"); }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function kp(a, cls) { return '<div class="a-kp ' + (cls || "") + '">' + a.map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + "</div>"; }
  function views(items, cur) { return '<div class="a-views">' + items.map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === cur) + '">' + x + "</button>"; }).join("") + "</div>"; }
  function chip(t, c) { return '<span class="m-chip ' + (c || "") + '">' + t + "</span>"; }

  /* ---------- tax: kept ready, filed by your adviser ---------- */
  W.tax = function (el) {
    var tab = 0, pack = false;
    function draw() {
      var b;
      if (tab === 0) b = '<div class="f-row f-hd f-5"><span>Where you are registered</span><b>Sales, 12 mo</b><b>Collected, qtr</b><b>Next return</b><b>Status</b></div>' + [["California", "$1.18M", "4,180", "Jan 31", "On track"], ["New York", "$0.82M", "2,960", "Dec 20", "On track"], ["Texas", "$0.47M", "1,740", "Jan 20", "On track"], ["United Kingdom, VAT", "$0.80M", "3,420", "Jan 7", "On track"]].map(function (r) { return '<div class="f-row f-5"><span>' + r[0] + "</span><b>" + r[1] + "</b><b>" + r[2] + "</b><b>" + r[3] + "</b><b>" + r[4] + "</b></div>"; }).join("") + '<div class="f-row f-hd f-5"><span>Where you sell but are not registered</span><b>Sales, 12 mo</b><b>Threshold on file</b><b>Reached</b><b>Status</b></div>' + [["Washington", "$84k", "$100k", "84%", "Tell your adviser"], ["Illinois", "$41k", "$100k", "41%", "Watching"], ["Germany, VAT", "$0.61M", "Registered entity", "", "Handled by GmbH"]].map(function (r, i) { return '<div class="f-row f-5"><span>' + r[0] + (i === 0 ? " " + chip("CLOSE", "m-warn") : "") + "</span><b>" + r[1] + "</b><b>" + r[2] + "</b><b>" + r[3] + "</b><b>" + r[4] + "</b></div>"; }).join("") + '<p class="m-foot">Tax is worked out on each invoice from where the customer is, and held in its own account until it is paid over. Thresholds are the ones your adviser has set.</p>';
      else if (tab === 1) b = '<div class="m-two m-tw2"><div class="m-pane" style="padding:0"><div class="f-row f-hd" style="grid-template-columns:minmax(0,2.4fr) minmax(0,1fr)"><span>Year to date, USD thousands</span><b>2026</b></div>' + [["Loss in the books", "(2,480)", "f-sub"], ["Share-based pay, not deductible", "210", ""], ["Meals and entertainment, half disallowed", "12", ""], ["Depreciation, tax faster than books", "(18)", ""], ["Estimated loss for tax", "(2,276)", "f-total"]].map(function (r) { return '<div class="f-row ' + r[2] + '" style="grid-template-columns:minmax(0,2.4fr) minmax(0,1fr)"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">KEPT READY FOR YOUR ADVISER</span><div class="m-fl"><span>Losses carried forward</span><b>$6.9M</b></div><div class="m-fl"><span>Engineering payroll tagged for research credit review</span><b>$1.9M</b></div><div class="m-fl"><span>State minimum taxes accrued</span><b>$12k</b></div><div class="m-fl"><span>Transactions between your own companies</span><b>14, documented</b></div><p class="m-foot" style="padding:8px 0 0">An agent tags the items that are treated differently for tax as they are booked, so the year-end adjustment list is already written. Your adviser decides the treatment.</p></div></div>';
      else if (tab === 2) b = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">CONTRACTORS, FOR YEAR-END FORMS</span><div class="m-fl"><span>Contractors paid this year</span><b>14</b></div><div class="m-fl"><span>Over the reporting level</span><b>9</b></div><div class="m-fl"><span>Tax form on file</span><b>7 of 9</b></div><div class="m-note">Two contractors have no tax form on file. An agent has asked both, and payments are flagged until it arrives.</div></div><div class="m-pane"><span class="m-lab">PAYROLL TAXES</span><div class="m-fl"><span>Withheld and paid by</span><b>Your payroll provider</b></div><div class="m-fl"><span>Agreed to the ledger</span><b>12 of 12 pay runs</b></div><div class="m-fl"><span>Employer taxes this year</span><b>$468k</b></div><div class="m-fl"><span>States with employees</span><b>4</b></div><p class="m-foot" style="padding:8px 0 0">Each pay run is matched to what the provider filed, so a difference shows up the same day.</p></div></div>';
      else b = '<div class="m-pane">' + [["Dec 20", "New York sales tax return", "Adviser", "Figures ready"], ["Jan 7", "United Kingdom VAT return", "Adviser", "Figures ready"], ["Jan 31", "Contractor year-end forms", "You", "7 of 9 ready"], ["Jan 31", "California sales tax return", "Adviser", "Open"], ["Mar 1", "Delaware franchise tax", "You", "Reminder set"], ["Apr 15", "Federal income tax return", "Adviser", "Pack in progress"]].map(function (r) { return '<div class="cx-tl" style="grid-template-columns:64px minmax(0,1fr) auto"><small style="font-weight:800;color:#2450DC">' + r[0] + "</small><span><b>" + r[1] + "</b><small>Owner: " + r[2] + "</small></span>" + chip(r[3].toUpperCase(), /ready|set/i.test(r[3]) ? "m-blue" : "m-warn") + "</div>"; }).join("") + "</div>";
      el.innerHTML = kp([["TAX HELD TO PAY OVER", "$12,300", "sales tax and VAT"], ["NEXT DEADLINE", "Dec 20", "New York sales tax"], ["FILINGS THIS YEAR", "23", "all on time"], ["OPEN QUESTIONS", "2", "for your adviser"]]) + views(["Sales tax and VAT", "Income tax", "Contractors and payroll", "Deadlines"], tab) + b + '<div class="m-pane" style="border-top:1px solid var(--ink);background:#F6F8FC">' + (pack ? '<div class="m-note">' + CHECK + " Your adviser now has read-only access to the pack: trial balance, tax-sensitive accounts, fixed assets, contractor payments and sales by place, each number opening to its entries.</div>" : '<div class="m-acts" style="align-items:center;flex-wrap:wrap"><button type="button" class="m-btn" data-a="p">Share the tax pack with your adviser</button><span class="m-foot" style="padding:0">Countahead keeps the books tax-ready and tracks the deadlines. Returns are prepared and filed by you and your tax adviser.</span></div>') + "</div>";
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-a]", function () { pack = true; draw(); }); draw();
  };

  /* ---------- policies ---------- */
  W.policy = function (el) {
    function $(v) { return "$" + n0(v); }
    var P = [{ g: 0, n: "What agents may do alone", own: "Finance lead", v: 3, ack: 6, s: { auto: 500, two: 10000 }, c: [["Agents post routine entries alone up to", "auto", 0, 2000, 100, "$", ""], ["Two people approve above", "two", 5000, 50000, 5000, "$", ""]], doc: function (s) { return [["Agents may read documents, match bank lines and draft entries without asking.", s.auto ? "Routine entries up to " + $(s.auto) + ", from a supplier or customer you already know, are posted and logged." : "Agents never post alone. Every entry waits for a person.", "Anything " + (s.auto ? "above " + $(s.auto) + ", anything " : "") + "unusual and anything new waits for a person.", "Above " + $(s.two) + ", two people approve.", "Agents never pay a new supplier, change bank details, alter a signed contract or reopen a closed month."], ["Everything an agent does alone is logged with the rule that allowed it.", "A weekly list shows what was done alone, so you can spot-check it.", "Tighten a limit and it applies from the very next entry."]]; } },
      { g: 0, n: "When agents must ask", own: "Finance lead", v: 2, ack: 6, s: { conf: 90, big: 50 }, c: [["Ask when less sure than", "conf", 70, 99, 1, "", "%"], ["Ask when a bill is above its usual by", "big", 10, 200, 10, "", "%"]], doc: function (s) { return [["An agent asks before coding anything it is less than " + s.conf + "% sure of.", "It asks when a bill is more than " + s.big + "% above that supplier's usual amount.", "It always asks about a new supplier, a new customer or a new kind of transaction.", "It never guesses a tax treatment. It asks, or leaves it for your accountant."], ["Questions arrive in one list, with the document and the agent's best guess.", "Your answer becomes the rule next time, and you can see every rule it has learned.", "The share of entries that needed a question is reported each month."]]; } },
      { g: 0, n: "What agents may send", own: "Finance lead", v: 1, ack: 6, s: { rem: 14, cap: 20000 }, c: [["Send payment reminders alone for the first", "rem", 0, 30, 1, "", " days"], ["A person handles customers owing more than", "cap", 5000, 50000, 5000, "$", ""]], doc: function (s) { return [[s.rem ? "Agents send payment reminders on their own for the first " + s.rem + " days an invoice is late." : "Agents never send a reminder on their own.", "After that, each message is drafted and waits for a person.", "Customers owing more than " + $(s.cap) + " are always handled by a person.", "Agents never send a contract, a price or a legal notice on their own.", "Every message says who it is from and how to reach a person."], ["Everything sent is filed on the customer record.", "A reply from the customer stops the sequence and comes to you.", "One switch pauses all sending."]]; } },
      { g: 1, n: "Spending and approvals", own: "Finance lead", v: 4, ack: 22, s: { lim: 500, mgr: 5000 }, c: [["Approved automatically up to", "lim", 100, 2000, 100, "$", ""], ["Finance lead signs off above", "mgr", 1000, 20000, 1000, "$", ""]], doc: function (s) { return [["Spend up to " + $(s.lim) + " with a known supplier needs no approval.", "Above " + $(s.lim) + ", the budget owner approves.", "Above " + $(s.mgr) + ", the finance lead approves as well.", "New suppliers are always reviewed once, whatever the amount."], ["Bills under " + $(s.lim) + " are posted and paid on their due date.", "Larger bills wait in the approver's queue, with the invoice attached.", "Card spend without a receipt after 7 days is chased automatically."]]; } },
      { g: 1, n: "Travel and expenses", own: "Finance lead", v: 2, ack: 19, s: { fl: 6, ht: 220, ml: 75 }, c: [["Economy for flights under", "fl", 3, 10, 1, "", " hours"], ["Hotels up to, a night", "ht", 120, 400, 10, "$", ""], ["Meals up to, a day", "ml", 40, 150, 5, "$", ""]], doc: function (s) { return [["Fly economy on flights under " + s.fl + " hours, and premium economy on longer ones.", "Hotels up to " + $(s.ht) + " a night, or " + $(Math.round(s.ht * 1.35 / 10) * 10) + " in London, New York and San Francisco.", "Meals up to " + $(s.ml) + " a day. No receipt needed under $25.", "Book at least 14 days ahead where you can."], ["Receipts are read by an agent and matched to the trip.", "Anything over a limit goes to your manager with the reason you give.", "Approved expenses are repaid with the next pay run."]]; } },
      { g: 1, n: "Discounts", own: "Head of sales", v: 3, ack: 5, s: { rep: 10, max: 25 }, c: [["A rep can discount up to", "rep", 0, 30, 5, "", "%"], ["Nobody discounts beyond", "max", 10, 50, 5, "", "%"]], doc: function (s) { return [["Sales can offer up to " + s.rep + "% off list price without asking.", "From " + s.rep + "% to " + s.max + "%, finance approves before the contract goes out.", "Nothing above " + s.max + "% without the chief executive.", "Free months count as a discount."], ["Contracts above " + s.rep + "% cannot be sent for signature until approved.", "The discount is shown on the commission statement.", "Discounts given are reported to the board each month."]]; } },
      { g: 1, n: "Chasing unpaid invoices", own: "Finance lead", v: 2, ack: 6, s: { d1: 3, d2: 30 }, c: [["First reminder after", "d1", 1, 14, 1, "", " days"], ["Account owner copied after", "d2", 14, 60, 2, "", " days"]], doc: function (s) { return [["A friendly reminder goes out " + s.d1 + " days after an invoice falls due.", "Follow-ups get firmer every two weeks.", "At " + s.d2 + " days the account owner is copied and calls the customer.", "No service is paused without the finance lead's say."], ["Reminders in the first 14 days are sent automatically.", "Later ones are drafted and wait for approval.", "Overdue customers are flagged on the customer record and in the forecast."]]; } },
      { g: 1, n: "What counts as an asset", own: "Controller", v: 1, ack: 4, s: { cap: 2500, yrs: 3 }, c: [["Treated as an asset above", "cap", 500, 10000, 500, "$", ""], ["Laptops written off over", "yrs", 2, 5, 1, "", " years"]], doc: function (s) { return [["Equipment costing more than " + $(s.cap) + " is recorded as an asset.", "Anything cheaper is an expense in the month it is bought.", "Laptops are written off over " + s.yrs + " years, furniture over 5.", "Software subscriptions are never assets."], ["An agent spots equipment in bills and suggests the treatment.", "Depreciation is posted each month from the register.", "Assets are checked against the people who hold them once a year."]]; } }], cur = 0, pub = {};
    function draw(keep) {
      var p = P[cur], d = p.doc(p.s);
      el.innerHTML = '<div class="m-two m-tw2"><div class="m-pane m-form" style="padding:0"><div class="m-list" style="border:0">' + P.map(function (x, i) { return (i === 0 || P[i - 1].g !== x.g ? '<div class="m-grp pl-g' + x.g + '"><span>' + (x.g ? "Rules for your people" : "Rules for the agents") + "</span><b>" + P.filter(function (y) { return y.g === x.g; }).length + "</b></div>" : "") + '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + x.n + "</b><small>Owner: " + x.own + ", version " + x.v + "</small></span>" + chip(pub[i] === 0 ? "EDITED" : "LIVE", pub[i] === 0 ? "m-warn" : "m-blue") + "</button>"; }).join("") + '</div><div style="padding:16px;display:flex;flex-direction:column;gap:4px;border-top:1px solid #D5DBE5"><span class="m-lab">THE RULES, AS NUMBERS</span>' + p.c.map(function (c) { return '<div class="m-kv" style="border:0;padding-bottom:0"><span>' + c[0] + "</span><b>" + c[5] + n0(p.s[c[1]]) + c[6] + '</b></div><input type="range" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" value="' + p.s[c[1]] + '" aria-label="' + c[0] + '" data-r="' + c[1] + '">'; }).join("") + '<p class="m-foot" style="padding:0">Move a number and the written policy rewrites itself. Sample policies.</p></div></div><div class="m-pane"><div class="m-page"><div class="m-doch"><b>' + p.n + "</b><span>" + (p.g ? "Company handbook" : "Agent rulebook") + ", version " + p.v + '</span></div><span class="m-lab">THE RULES</span><ol class="p-ol">' + d[0].map(function (t) { return "<li>" + t + "</li>"; }).join("") + '</ol><span class="m-lab">' + (p.g ? "WHAT THE SOFTWARE DOES ABOUT IT" : "HOW YOU KEEP AN EYE ON IT") + "</span>" + d[1].map(function (t) { return '<div class="fc-ck">' + CHECK + "<span>" + t + "</span></div>"; }).join("") + '<div class="m-fl" style="margin-top:6px"><span>' + (p.g ? "Read and acknowledged" : "Applies to") + "</span><b>" + (!p.g ? "Every agent, from the next entry" : pub[cur] === 1 ? "0 of 24, just sent" : p.ack + " of 24 people") + "</b></div></div>" + (pub[cur] === 0 ? '<div class="m-acts"><button type="button" class="m-btn" data-a="pub">Publish version ' + (p.v + 1) + "</button></div>" : pub[cur] === 1 ? '<div class="m-note">' + CHECK + (p.g ? " Published to 24 people, who are asked to read it. The software follows the new rules from now, and the old version is kept in the history." : " Agents follow the new version from the next entry. The finance team is told what changed, and the old version is kept in the history.") + "</div>" : "") + "</div></div>";
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { p.s[r.getAttribute("data-r")] = +this.value; pub[cur] = 0; draw(r.getAttribute("data-r")); }); });
      if (keep) { var x = el.querySelector('[data-r="' + keep + '"]'); if (x) x.focus(); }
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); on(el, "[data-a]", function () { P[cur].v++; pub[cur] = 1; draw(); }); draw();
  };

  /* ---------- audit readiness ---------- */
  W.audit = function (el) {
    var AR = [["Cash and bank", 148, 1, ""], ["Revenue and contracts", 312, 0, "One sale to Brightdesk was booked in November, but the amendment was signed on December 2. A correcting entry of $2,000 is drafted."], ["Receivables", 96, 1, ""], ["Costs and suppliers", 284, 1, ""], ["Payroll", 72, 1, ""], ["Fixed assets", 41, 1, ""], ["Manual journals", 188, 0, "One reclassification in September has no explanation recorded. The person who posted it has been asked for a note."], ["Equity and share capital", 143, 1, ""]];
    var SM = [["Kestrel Freight", "INV-0150", 1, 1, 1, 1], ["Harbor Labs", "INV-0153", 1, 1, 1, 1], ["Northwind Ltd", "INV-0141", 1, 1, 0, 1], ["Brightdesk", "INV-0148", 1, 1, 1, 0], ["Corvid Systems", "INV-0137", 1, 1, 1, 1], ["Atlas Payroll", "INV-0135", 1, 1, 1, 1], ["Tallis and Co", "INV-0147", 1, 1, 0, 1]];
    var RQ = [["Trial balance and ledger at year end", 1], ["Bank statements and confirmations", 1], ["Contracts for the 20 largest customers", 1], ["Revenue schedules and deferred revenue", 1], ["Receivables ageing and payments after year end", 1], ["Fixed asset additions with invoices", 1], ["Payroll reports agreed to the ledger", 1], ["Board minutes and share issuances", 1], ["Manual journals over $10k with explanations", 0], ["Transactions with directors and shareholders", 0], ["Letters from your lawyers", 2], ["Management's going-concern assessment", 0]];
    var TR = [["Income statement", "Revenue, November", "$335,000", "Built from 41 contracts and 212 card charges"], ["Contract", "Harbor Labs, subscription agreement", "$48,000 a year", "Signed on the platform by Tom Reyes, Nov 20, 14:02"], ["Invoice", "INV-0153", "$12,000", "Drafted by an agent, approved by the finance lead, Nov 20, 14:10"], ["Journal entry", "JE-1196", "$4,000 to revenue", "Posted under the revenue policy, version 3. Not edited since"], ["Bank", "Incoming wire, Harbor Labs", "$12,000", "Matched by an agent, Nov 27, 08:31"]];
    var tab = 0, cur = 1, shared = false;
    function draw() {
      var clean = AR.filter(function (a) { return a[2]; }).length, tests = AR.reduce(function (a, x) { return a + x[1]; }, 0), ready = RQ.filter(function (r) { return r[1] === 1; }).length, pct = Math.round(clean / AR.length * 100), b;
      function tk(v) { return v ? '<b class="sl-up">&#10003;</b>' : '<b class="sl-dn">&#10007;</b>'; }
      if (tab === 0) b = '<div class="m-two m-tw2"><div class="m-list">' + AR.map(function (a, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + a[0] + "</b><small>" + a[1] + " checks run</small></span>" + chip(a[2] ? "CLEAN" : "1 FINDING", a[2] ? "m-blue" : "m-warn") + "</button>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">' + AR[cur][0].toUpperCase() + "</span>" + (AR[cur][2] ? '<div class="m-note">' + CHECK + " All " + AR[cur][1] + " checks passed. The evidence file is prepared and can be shared as it is.</div>" : '<div class="m-inv"><div class="m-doch"><b>' + (AR[cur][1] - 1) + " of " + AR[cur][1] + " checks passed</b>" + chip("NEEDS YOU", "m-warn") + '</div><p class="m-p" style="font-size:14.5px;margin:6px 0 0">' + AR[cur][3] + '</p></div><div class="m-acts"><button type="button" class="m-btn" data-a="fix">' + (cur === 1 ? "Approve the correcting entry" : "Add the explanation") + "</button></div>") + '<p class="m-foot" style="padding:0">The same checks run every night, so problems are found in the month they happen and not at year end.</p></div></div>';
      else if (tab === 1) b = '<div class="au-s au-hd"><span>25 sales picked at random. Showing 7.</span><b>Contract</b><b>Invoice</b><b>Paid</b><b>Right month</b></div>' + SM.map(function (s) { return '<div class="au-s"><span><b>' + s[0] + "</b><small>" + s[1] + "</small></span>" + tk(s[2]) + tk(s[3]) + tk(s[4]) + tk(s[5]) + "</div>"; }).join("") + '<p class="m-foot">Each sale is traced to a signed contract, an invoice, a payment and the month it was earned. Unpaid is not a failure, it is listed for the auditor. One sale is in the wrong month.</p>';
      else if (tab === 2) b = '<div class="m-two m-tw2"><div class="m-pane" style="padding:0">' + RQ.map(function (r) { return '<div class="m-acct" style="cursor:default"><span>' + r[0] + "</span>" + chip(["NEEDS YOU", "READY", "WITH YOUR LAWYER"][r[1]], r[1] === 1 ? "m-blue" : "m-warn") + "</div>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">THE AUDITOR\'S LIST, ALREADY ANSWERED</span><p class="m-p" style="font-size:15.5px">' + ready + " of " + RQ.length + " of the usual requests are prepared from your own records before anyone asks.</p>" + (shared ? '<div class="m-note">' + CHECK + " Your auditor has read-only access. They can open any number down to its documents, and their questions arrive here as a list.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="share">Give your auditor access</button></div>') + '<p class="m-foot" style="padding:0">The three that need you are judgement calls that only management can make.</p></div></div>';
      else b = '<div class="m-pane"><span class="m-lab">FROM A NUMBER ON THE STATEMENTS TO THE MONEY IN THE BANK</span><div class="au-tr">' + TR.map(function (t, i) { return '<div><i>' + (i + 1) + "</i><span><small>" + t[0].toUpperCase() + "</small><b>" + t[1] + "</b><em>" + t[3] + "</em></span><b>" + t[2] + "</b></div>"; }).join("") + '</div><p class="m-foot" style="padding:8px 0 0">Every step records who did it and when, and the record cannot be edited afterwards. A correction is a new entry that points back to the old one.</p></div>';
      el.innerHTML = '<div class="au-top"><div class="au-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="#E3E7EE" stroke-width="12"></circle><circle cx="50" cy="50" r="42" fill="none" stroke="' + (pct === 100 ? "#2450DC" : "#FFD15C") + '" stroke-width="12" stroke-dasharray="' + (pct * 2.64) + ' 264" transform="rotate(-90 50 50)"></circle><circle cx="50" cy="50" r="42" fill="none" stroke="#2450DC" stroke-width="12" stroke-dasharray="' + ((pct - 3) * 2.64) + ' 264" transform="rotate(-90 50 50)"></circle></svg><b>' + pct + "%</b></div>" + kp([["AREAS CLEAN", clean + " of " + AR.length, clean === AR.length ? "ready for the auditors" : (AR.length - clean) + " with one finding each"], ["CHECKS RUN LAST NIGHT", n0(tests), n0(tests - (AR.length - clean)) + " passed"], ["AUDITOR REQUESTS READY", ready + " of " + RQ.length, "before anyone asks"]], "a-k3") + "</div>" + views(["Readiness", "Sample testing", "Auditor requests", "Trace a number"], tab) + b + '<p class="m-foot" style="border-top:1px solid #D5DBE5">This prepares you for an audit and shortens it. It does not replace the audit or the auditor\'s opinion.</p>';
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); });
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-a]", function (t) { if (t.getAttribute("data-a") === "share") shared = true; else { AR[cur][2] = 1; if (cur === 1) SM[3][5] = 1; if (cur === 6) RQ[8][1] = 1; } draw(); }); draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  var CAT = { Banking: ["#0B1B3A", "Transactions and balances", "Nothing. Read only", "Every few hours", "Sign in to your bank once"], Spend: ["#2450DC", "Card spend, receipts and bills", "Accounting codes, so both sides agree", "As each card is used", "Connect and choose which cards"], Payments: ["#5B8CFF", "Charges, refunds, fees and payouts", "Nothing. Read only", "As each payment happens", "Connect your account"], Commerce: ["#8A5A00", "Orders, refunds, fees and payouts", "Nothing. Read only", "Every hour", "Connect each store"], Payroll: ["#2B3648", "Pay runs, taxes and who works where", "Nothing. Read only", "After every pay run", "Connect and map teams to departments"], Deals: ["#2450DC", "Companies, contacts, deals and signed terms", "Contract status, invoices paid and recurring revenue", "Both ways, within minutes", "Connect and match your deal stages"], Work: ["#4B5565", "Bills from the inbox, files and usage data", "Approvals and answers where you already work", "Continuously", "Connect and pick what it may read"], Setup: ["#0B1B3A", "Your history: accounts, balances and past entries", "Nothing. One-time import", "Once, when you start", "Connect, review the mapping, import"] };
  var I = [["Plaid", "Banking", "Bank feeds for most US banks", 1], ["Mercury", "Banking", "Balances and transactions as they clear", 1], ["Wise", "Banking", "Multi-currency balances and transfers", 1], ["Revolut Business", "Banking", "Accounts and cards across currencies", 0], ["Brex", "Spend", "Cards, receipts and reimbursements", 1], ["Ramp", "Spend", "Cards, bills and receipts", 1], ["Stripe", "Payments", "Charges, payouts, fees and subscriptions", 1], ["PayPal", "Payments", "Payments, fees and payouts", 0], ["Shopify", "Commerce", "Orders, refunds and payouts", 1], ["Amazon", "Commerce", "Settlements and marketplace fees", 1], ["Square", "Commerce", "Till sales, tips and payouts", 0], ["Toast", "Commerce", "Restaurant sales, tips and payouts", 0], ["eBay and Etsy", "Commerce", "Marketplace orders, fees and payouts", 0], ["Gusto", "Payroll", "Pay runs and payroll taxes", 1], ["Rippling", "Payroll", "Payroll and headcount changes", 1], ["Deel", "Payroll", "Contractors and international payroll", 0], ["Remote", "Payroll", "International employment and payroll", 0], ["HubSpot", "Deals", "Companies, deals and contract values", 1], ["Salesforce", "Deals", "Companies, deals and contract values", 1], ["DocuSign", "Deals", "Contracts signed outside the platform", 0], ["Gmail", "Work", "Bills and receipts from the inbox", 1], ["Slack", "Work", "Approvals and questions where you work", 1], ["Claude", "Work", "Ask your books from Claude", 0], ["Snowflake", "Work", "Usage data for usage-based billing", 0], ["QuickBooks", "Setup", "Bring your history across", 1], ["Xero", "Setup", "Bring your history across", 1], ["Stripe Atlas", "Setup", "Books that start the day the company is formed", 0]];
  /* ---------- integrations directory ---------- */
  W.integrations = function (el) {
    var cat = "All", q = "", sel = 0, CATS = ["All"].concat(Object.keys(CAT));
    function list() { return I.map(function (x, i) { return [x, i]; }).filter(function (p) { var x = p[0]; return (cat === "All" || x[1] === cat) && (!q || (x[0] + " " + x[1] + " " + x[2]).toLowerCase().indexOf(q) > -1); }); }
    function mono(x) { return '<i class="ig-m" style="background:' + CAT[x[1]][0] + '">' + x[0].replace(/[^A-Za-z ]/g, "").split(" ").slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase() + "</i>"; }
    function grid() {
      var L = list(); if (L.length && !L.some(function (p) { return p[1] === sel; })) sel = L[0][1];
      var x = I[sel], c = CAT[x[1]];
      el.querySelector(".ig-body").innerHTML = '<div class="ig-grid">' + (L.length ? L.map(function (p) { var y = p[0]; return '<button type="button" class="ig-card" data-i="' + p[1] + '" aria-pressed="' + (p[1] === sel) + '">' + mono(y) + "<span><b>" + y[0] + "</b><small>" + y[2] + '</small></span><em class="' + (y[3] ? "ig-e" : "") + '">' + (y[3] ? "EARLY ACCESS" : "LATER") + "</em></button>"; }).join("") : '<p class="m-foot">Nothing matches. Tell us what you use when you ask for early access.</p>') + '</div><div class="ig-det">' + (L.length ? '<div class="ig-dh">' + mono(x) + "<span><b>" + x[0] + "</b><small>" + x[1] + " &middot; " + (x[3] ? "planned for early access" : "planned for later") + '</small></span></div><div class="ig-flow"><div><small>COMES IN</small><b>' + c[1] + '</b></div><em>&rarr;</em><div class="ig-us"><small>COUNTAHEAD</small><b>Booked, matched and forecast</b></div><em>&rarr;</em><div><small>GOES BACK</small><b>' + c[2] + '</b></div></div><div class="m-fl"><span>How often</span><b>' + c[3] + '</b></div><div class="m-fl"><span>To set up</span><b>' + c[4] + '</b></div><div class="m-fl"><span>What you see</span><b>' + x[2] + '</b></div><p class="m-foot" style="padding:8px 0 0">Planned, not live. The list and the order may change before early access opens.</p>' : "") + "</div>";
      [].forEach.call(el.querySelectorAll("[data-c]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-c") === cat); });
    }
    el.innerHTML = '<div class="ig-top"><div class="ig-src">' + [["Money", "Banks, cards, payments"], ["Sales", "CRM, stores, tills"], ["People", "Payroll and HR"], ["Work", "Email, chat, data"]].map(function (s) { return "<div><b>" + s[0] + "</b><small>" + s[1] + "</small></div>"; }).join("") + '</div><em>&rarr;</em><div class="ig-hub"><b>One ledger</b><small>Every item booked once</small></div><em>&rarr;</em><div class="ig-src">' + [["Books", "Closed and auditable"], ["Plan", "Forecast and model"], ["Board", "Pack and data room"]].map(function (s) { return "<div><b>" + s[0] + "</b><small>" + s[1] + "</small></div>"; }).join("") + '</div></div><div class="ig-bar"><input type="search" placeholder="Search ' + I.length + ' planned integrations" aria-label="Search integrations"><div class="ig-cats nosb">' + CATS.map(function (c) { return '<button type="button" data-c="' + c + '">' + c + " <small>" + (c === "All" ? I.length : I.filter(function (x) { return x[1] === c; }).length) + "</small></button>"; }).join("") + '</div></div><div class="ig-body"></div><div class="ig-foot"><b>Not on the list?</b><span>Anything else can come in as a spreadsheet or a file export. An open way for your own systems to connect is planned too.</span></div>';
    el.querySelector("input").addEventListener("input", function () { q = this.value.trim().toLowerCase(); grid(); });
    el.addEventListener("click", function (e) { var c = e.target.closest("[data-c]"); if (c) { cat = c.getAttribute("data-c"); grid(); return; } var i = e.target.closest("[data-i]"); if (i) { sel = +i.getAttribute("data-i"); grid(); } });
    grid();
  };
})();

/* Round eight: scenario planner, ask by voice, option grants, company calendar. Sample data. */
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  function n0(v) { return Math.round(v).toLocaleString("en-US"); }
  function M(v) { return (v < 0 ? "-" : "") + "$" + (Math.abs(v) / 1000).toFixed(2) + "M"; }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';

  /* ---------- scenario planner ---------- */
  W.scen = function (el) {
    var build = W._build, ml = W._mlabel;
    var RA = 8;
    var EV = [["sh", "Hire 3 salespeople in January", 2, function (s) { s.sh += 3; }], ["eh", "Hire 2 engineers in February", 3, function (s) { s.eh += 2; }], ["raise", "", 7, function (s) { s.rm = 7; s.ra = RA; }], ["price", "Raise prices 6% in March", 4, function (s) { s.priceM = 4; }], ["loss", "Lose the largest customer in April", 5, function (s) { s.lossM = 5; }], ["cut", "Cut non-payroll costs 20%", 2, function (s) { s.cut = 1; }]];
    var SC = [{ n: "Downside", t: "Growth stalls and a big customer leaves", col: "#8A5A00", d: { nw: 40, ng: 0, ex: 0.6, ch: 1.3, gm: 74, sh: 0, eh: 0, dso: 40, rm: 0, ra: 0 }, ev: { loss: 1 } }, { n: "Base", t: "The plan as it stands", col: "#0B1B3A", d: { nw: 110, ng: 1, ex: 1.0, ch: 0.9, gm: 75, sh: 1, eh: 1, dso: 37, rm: 0, ra: 0 }, ev: {} }, { n: "Upside", t: "Invest in sales and raise", col: "#2450DC", d: { nw: 170, ng: 2.5, ex: 1.3, ch: 0.7, gm: 76, sh: 0, eh: 1, dso: 35, rm: 0, ra: 0 }, ev: { sh: 1, raise: 1 } }], sel = 1, met = 0, MET = [["Cash", "cash"], ["Recurring revenue", "close"], ["Monthly burn", "burn"], ["People", "heads"]];
    function params(x, skip) { var s = {}, k; for (k in x.d) s[k] = x.d[k]; EV.forEach(function (e) { if (x.ev[e[0]] && e[0] !== skip) e[3](s); }); return s; }
    function stats(R) { var out = -1, be = -1, m; for (m = 1; m <= 24; m++) { if (out < 0 && R.cash[m] <= 0) out = m; if (be < 0 && R.burn[m] <= 0) be = m; } return { out: out, be: be }; }
    function run(st) { return st.out > 0 ? st.out + " months" : st.be > 0 ? "Self-funding" : "24+ months"; }
    function draw(keep) {
      var RS = SC.map(function (x) { return build(params(x)); }), ST = RS.map(stats), k = MET[met][1], x = SC[sel], R = RS[sel];
      var all = [].concat(RS[0][k], RS[1][k], RS[2][k]).map(function (v) { return k === "cash" ? Math.max(v, 0) : v; }), mx = Math.max.apply(null, all), mn = Math.min(0, Math.min.apply(null, all)), Wd = 660, H = 280, L = 54, Rr = 16, T = 16, Bt = 44;
      function X(m) { return L + m / 24 * (Wd - L - Rr); } function Y(v) { return T + (mx - v) / (mx - mn || 1) * (H - T - Bt); }
      var grid = ""; for (var i = 0; i <= 4; i++) { var v = mn + (mx - mn) / 4 * i; grid += '<line x1="' + L + '" x2="' + (Wd - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (Math.abs(v) < 1 ? "#0B1B3A" : "#E3E7EE") + '"></line><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="#4B5565">' + (k === "heads" ? Math.round(v) : k === "burn" ? "$" + Math.round(v) + "k" : "$" + (v / 1000).toFixed(1) + "M") + "</text>"; }
      var xs = [0, 6, 12, 18, 24].map(function (m) { return '<text x="' + X(m) + '" y="' + (H - 26) + '" text-anchor="' + (m === 0 ? "start" : m === 24 ? "end" : "middle") + '" font-size="11" fill="#4B5565">' + ml(m) + "</text>"; }).join("");
      var order = [0, 1, 2].filter(function (i) { return i !== sel; }).concat([sel]);
      var lines = order.map(function (i) { var pts = RS[i][k].map(function (v, m) { return X(m).toFixed(1) + "," + Y(k === "cash" ? Math.max(v, 0) : v).toFixed(1); }); return (i === sel ? '<polygon fill="' + SC[i].col + '" opacity=".08" points="' + X(0) + "," + Y(mn) + " " + pts.join(" ") + " " + X(24) + "," + Y(mn) + '"></polygon>' : "") + '<polyline fill="none" stroke="' + SC[i].col + '" stroke-width="' + (i === sel ? 4 : 2) + '"' + (i === sel ? "" : ' stroke-dasharray="5 5" opacity=".7"') + ' points="' + pts.join(" ") + '"></polyline>'; }).join("");
      var marks = EV.filter(function (e) { return x.ev[e[0]]; }).map(function (e, n) { return '<line x1="' + X(e[2]) + '" x2="' + X(e[2]) + '" y1="' + T + '" y2="' + (H - Bt) + '" stroke="' + x.col + '" stroke-dasharray="2 4"></line><circle cx="' + X(e[2]) + '" cy="' + (H - 12) + '" r="8" fill="#FFD15C" stroke="#0B1B3A"></circle><text x="' + X(e[2]) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#0B1B3A">' + (n + 1) + "</text>"; }).join("");
      var nEv = 0, evs = EV.map(function (e) { var on_ = !!x.ev[e[0]], w, wo; if (on_) { w = R.cash[18]; wo = build(params(x, e[0])).cash[18]; } else { var y = { d: x.d, ev: {} }, kk; for (kk in x.ev) y.ev[kk] = x.ev[kk]; y.ev[e[0]] = 1; w = build(params(y)).cash[18]; wo = R.cash[18]; } var d = w - wo; if (on_) nEv++; return '<button type="button" class="sp-ev" data-e="' + e[0] + '" aria-pressed="' + on_ + '"><i>' + (on_ ? nEv : "+") + "</i><span><b>" + (e[0] === "raise" ? "Raise $" + RA + "M in June 2027" : e[1]) + "</b><small>" + (d >= 0 ? "+" : "-") + "$" + n0(Math.abs(d)) + "k cash, 18 months in</small></span></button>"; }).join("");
      var SENS = [["New business 20% lower", function (s) { s.nw *= 0.8; }], ["Churn 0.3 points higher", function (s) { s.ch += 0.3; }], ["Gross margin 3 points lower", function (s) { s.gm -= 3; }], ["Customers pay 10 days slower", function (s) { s.dso += 10; }]], base18 = R.cash[18], sv = SENS.map(function (z) { var s = params(x); z[1](s); return [z[0], build(s).cash[18] - base18]; }), smx = Math.max.apply(null, sv.map(function (z) { return Math.abs(z[1]); })) || 1;
      function cost(i) { if (i === 1) return "The reference. Everything else is measured against it."; var dA = RS[i].close[18] - RS[1].close[18], dC = RS[i].cash[18] - RS[1].cash[18]; return (dA >= 0 ? "+" : "-") + M(Math.abs(dA)) + " recurring revenue, " + (dC >= 0 ? "+" : "-") + M(Math.abs(dC)) + " cash against base."; }
      var TR = [["Recurring revenue", function (r) { return M(r.close[18]); }], ["Growth, year on year", function (r) { return "+" + Math.round((r.close[18] / r.close[6] - 1) * 100) + "%"; }], ["Gross margin", function (r) { return (r.gp[18] / r.rev[18] * 100).toFixed(0) + "%"; }], ["Monthly burn", function (r) { return r.burn[18] <= 0 ? "Profitable" : "$" + n0(r.burn[18]) + "k"; }], ["Cash", function (r) { return r.cash[18] <= 0 ? "Run out" : M(r.cash[18]); }], ["People", function (r) { return r.heads[18]; }], ["Recurring revenue per person", function (r) { return "$" + n0(r.close[18] / r.heads[18]) + "k"; }], ["Runway from today", function (r, i) { return run(ST[i]); }]];
      el.innerHTML = '<div class="s-cards">' + SC.map(function (c, i) { var r = RS[i], mxx = Math.max.apply(null, r.cash) || 1; return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === sel) + '" style="--sc:' + c.col + '"><small>' + c.n.toUpperCase() + "</small><b>" + run(ST[i]) + "</b><span>" + (ST[i].out > 0 ? "Cash out " + ml(ST[i].out) : ST[i].be > 0 ? "Breaks even " + ml(ST[i].be) : "Cash lasts past " + ml(24)) + '</span><svg viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="' + c.col + '" stroke-width="2.5" points="' + r.cash.map(function (v, m) { return (m / 24 * 100).toFixed(1) + "," + (24 - Math.max(v, 0) / mxx * 22).toFixed(1); }).join(" ") + '"></polyline></svg><em>' + c.t + "</em></button>"; }).join("") + '</div><div class="s-main"><div class="s-chart"><div class="s-top"><span class="m-lab">NEXT 24 MONTHS</span><div class="m-opts">' + MET.map(function (m, i) { return '<button type="button" data-m="' + i + '" aria-pressed="' + (i === met) + '">' + m[0] + '</button>'; }).join("") + '</div></div><svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="' + MET[met][0] + ' over 24 months in three scenarios" style="width:100%;height:auto;display:block">' + grid + xs + marks + lines + '</svg><div class="m-legend" style="font-size:12.5px">' + SC.map(function (c) { return '<span><i style="background:' + c.col + ";border-color:" + c.col + '"></i>' + c.n + "</span>"; }).join("") + '<span><i style="background:#FFD15C;border-color:#0B1B3A;border-radius:50%"></i>Decisions in ' + x.n.toLowerCase() + '</span></div></div><div class="s-side"><span class="m-lab" style="color:' + x.col + '">' + x.n.toUpperCase() + ': DECISIONS YOU COULD MAKE</span><div class="sp-evs">' + evs + '</div><div class="m-kv" style="border:0"><span>Size of the raise</span><span class="m-stp"><button type="button" data-ra="-1" aria-label="Raise less">&minus;</button><output style="min-width:64px">$' + RA + 'M</output><button type="button" data-ra="1" aria-label="Raise more">+</button></span></div><span class="m-lab" style="margin-top:8px">AND TWO DRIVERS</span>' + [["New recurring revenue a month", "nw", 20, 250, 10, "$", "k"], ["Churn a month", "ch", 0.3, 2, 0.1, "", "%"]].map(function (d) { return '<div class="m-kv" style="border:0;padding-bottom:0"><span>' + d[0] + "</span><b>" + d[5] + x.d[d[1]] + d[6] + '</b></div><input type="range" min="' + d[2] + '" max="' + d[3] + '" step="' + d[4] + '" value="' + x.d[d[1]] + '" aria-label="' + d[0] + '" data-r="' + d[1] + '">'; }).join("") + '</div></div><div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="s-tbl" style="border-top:0"><div class="s-row s-hd"><span>18 months in</span>' + SC.map(function (c, i) { return '<b style="color:' + c.col + '"' + (i === sel ? ' class="s-on"' : "") + ">" + c.n + "</b>"; }).join("") + "</div>" + TR.map(function (row) { return '<div class="s-row"><span>' + row[0] + "</span>" + RS.map(function (r, i) { return "<b" + (i === sel ? ' class="s-on"' : "") + ">" + row[1](r, i) + "</b>"; }).join("") + "</div>"; }).join("") + '<div class="s-row s-cost"><span>The cost of choosing it</span>' + SC.map(function (c, i) { return "<b" + (i === sel ? ' class="s-on"' : "") + ">" + cost(i) + "</b>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">WHAT ' + x.n.toUpperCase() + ' IS MOST EXPOSED TO</span>' + sv.map(function (z) { return '<div class="sp-sn"><span>' + z[0] + '</span><i><u style="width:' + Math.abs(z[1]) / smx * 100 + '%"></u></i><b>-$' + n0(Math.abs(z[1])) + "k</b></div>"; }).join("") + '<p class="m-foot" style="padding:8px 0 0">Change in cash 18 months in if each thing goes wrong on its own. The longest bar is the assumption to watch.</p></div></div>';
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { x.d[r.getAttribute("data-r")] = +this.value; draw(r.getAttribute("data-r")); }); });
      if (keep) { var fo = el.querySelector('[data-r="' + keep + '"]'); if (fo) fo.focus(); }
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); });
    on(el, "[data-m]", function (t) { met = +t.getAttribute("data-m"); draw(); });
    on(el, "[data-ra]", function (t) { RA = Math.max(1, Math.min(40, RA + +t.getAttribute("data-ra"))); draw(); });
    on(el, "[data-e]", function (t) { var e = t.getAttribute("data-e"), x = SC[sel]; if (x.ev[e]) delete x.ev[e]; else x.ev[e] = 1; draw(); });
    draw();
  };

  /* ---------- option grants ---------- */
  W.options = function (el) {
    var G = [["Priya N.", "Account executive", 120000, "Jan 2025", 0.46, 0.85], ["Daniel R.", "Head of sales", 220000, "Jun 2024", 0.6, 0.6], ["Mei L.", "Staff engineer", 180000, "Mar 2024", 0.67, 0.6], ["Tomas V.", "Engineer", 60000, "Sep 2026", 0, 1.1], ["Sofia A.", "Account executive", 80000, "Feb 2026", 0, 1.1]], drafted = false, sel = 0;
    function draw() {
      var g = G[sel], vested = Math.round(g[2] * g[4]);
      el.innerHTML = '<div class="a-kp">' + [["GRANTED", "900,000", "to 11 people"], ["VESTED SO FAR", "412,500", "46% of granted"], ["AVAILABLE TO GRANT", drafted ? "560,000" : "600,000", "left in the pool"], ["EXPENSE THIS MONTH", "$17.5k", "posted for approval"]].map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid #D5DBE5"><div class="m-list"><div class="m-grp"><span>Option holders. Showing 5 of 11.</span><b>OPTIONS</b></div>' + G.map(function (x, i) { return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span><b>' + x[0] + "</b><small>" + x[1] + ", granted " + x[3] + '</small><span class="m-track" style="margin-top:6px;width:160px"><i style="width:' + x[4] * 100 + '%"></i></span></span><b>' + n0(x[2]) + "</b></button>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">' + g[0].toUpperCase() + '</span><div class="m-fl"><span>Vested</span><b>' + n0(vested) + " of " + n0(g[2]) + '</b></div><div class="m-fl"><span>Price to exercise</span><b>$' + g[5].toFixed(2) + ' a share</b></div><div class="m-fl"><span>Schedule</span><b>4 years, 1 year cliff</b></div><div class="m-fl"><span>' + (g[4] ? "Next vesting" : "Cliff date") + "</span><b>" + (g[4] ? "December 1, monthly" : g[3].replace("2026", "2027")) + "</b></div>" + (drafted ? '<div class="m-note">' + CHECK + " Grant of 40,000 options drafted for the new senior engineer. The board consent is prepared for signature, and the expense is added to the forecast.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="g">Draft a grant for a new hire</button></div>') + '<p class="m-foot" style="padding:0">A register and the accounting for it. The exercise price comes from your valuation provider, and grants need board approval.</p></div></div>';
    }
    on(el, "[data-i]", function (t) { sel = +t.getAttribute("data-i"); draw(); }); on(el, "[data-a]", function () { drafted = true; draw(); }); draw();
  };

  /* ---------- company calendar ---------- */
  W.cocal = function (el) {
    var E = [["Dec 1", "Vesting", "56,250 options vest for 6 people", "Automatic", 1], ["Dec 4", "Board", "Board meeting. Pack drafted, one consent to sign", "You", 0], ["Dec 15", "Insurance", "Directors' insurance renews", "You", 0], ["Jan 14", "Vesting", "Sofia A. reaches her one-year cliff", "Automatic", 1], ["Jan 31", "Investors", "Quarterly update due under the shareholders agreement", "Agent drafts", 0], ["Mar 1", "Filing", "Delaware franchise tax and annual report", "You", 0], ["Mar 20", "Valuation", "Share valuation expires. New one needed before more grants", "Your provider", 0]];
    function draw() {
      var open = E.filter(function (e) { return !e[4]; }).length;
      el.innerHTML = '<div class="m-pane"><div class="m-doch"><b>Next 120 days</b><span>' + open + " need someone, " + (E.length - open) + " handled</span></div>" + E.map(function (e, i) { return '<div class="cx-tl" style="grid-template-columns:64px minmax(0,1fr) auto"><small style="font-weight:800;color:#2450DC">' + e[0] + "</small><span><b>" + e[2] + "</b><small>" + e[1] + " &middot; " + e[3] + "</small></span>" + (e[4] ? '<span class="m-chip m-blue">HANDLED</span>' : '<button type="button" class="m-btn m-sm" data-i="' + i + '">Mark done</button>') + "</div>"; }).join("") + '<p class="m-foot" style="padding:8px 0 0">Dates are read from your documents and filings. Reminders go out 60 and 30 days ahead.</p></div>';
    }
    on(el, "[data-i]", function (t) { E[+t.getAttribute("data-i")][4] = 1; draw(); }); draw();
  };

  /* ---------- ask: type or speak, past and future ---------- */
  function runway(h, extra, g) { var cash = 3060 + (extra || 0), rev = 335, opx = 178; for (var m = 1; m <= 120; m++) { rev *= 1 + (g == null ? 2 : g) / 100; opx *= 1.01; cash -= 372 + h * 17 + opx - rev; if (cash <= 0) return m; } return 120; }
  W.ask = function (el) {
    var A = [[/margin/, "Gross margin fell from 78.4% to 74.9% in November.", "It is cost, not price. Hosting rose $11.2k after a new region went live on November 3, and support contractors rose $3.3k. Revenue grew 4.0% in the same month.", "14 entries in 5100 Hosting, 6 in 5200 Support", [["October", "78.4%"], ["November", "74.9%"], ["Hosting", "+$11.2k"]]],
      [/hire|hiring|headcount/, function (q) { var n = +(q.match(/\d+/) || [0])[0] || ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 })[(q.match(/one|two|three|four|five|six/) || [""])[0]] || 5; n = Math.min(n, 12); return [n + (n === 1 ? " hire takes" : " hires take") + " runway from 20 months to " + runway(n) + ".", "Each is counted at $17k a month from January, with no revenue from them. Sales hires usually start paying back after about three months.", "Base scenario and payroll forecast", [["Today", "20 months"], ["With " + n, runway(n) + " months"], ["Extra cost", "$" + n * 17 + "k a month"]]]; }],
      [/raise|fundrais|funding|round/, function (q) { var n = +((q.match(/(\d+(\.\d+)?)\s*(m|million)/) || [0, 8])[1]) || 8; n = Math.max(1, Math.min(n, 40)); var r = runway(0, n * 1000), dil = n / (32 + n), f = Math.round(60 * (1 - dil)); return ["Raising $" + n + "M would take runway from 20 months to " + (r >= 120 ? "past break-even" : r + " months") + ".", "At $32M before the round, new investors would hold " + Math.round(dil * 100) + "% and the founders would go from 60% to " + f + "%. Ask with a different amount to compare.", "Base scenario and the cap table", [["Runway today", "20 months"], ["After $" + n + "M", r >= 120 ? "Self-funding" : r + " months"], ["Founders", "60% to " + f + "%"]]]; }],
      [/growth (stop|slow|stall)|stop growing|no growth|slow/, function () { return ["If growth slows to 0.5% a month, runway drops from 20 months to " + runway(0, 0, 0.5) + ".", "Costs keep rising 1% a month in that case. Cutting non-payroll costs by a fifth would give back about two months.", "Downside scenario", [["Base", "20 months"], ["Slow growth", runway(0, 0, 0.5) + " months"], ["Cash out", "Feb 2028"]]]; }],
      [/break.?even|profitab/, "On the base case you do not break even before the cash runs out.", "You would need growth of about 4% a month, or the upside plan with three sales hires, to reach break-even around April 2028.", "Base and upside scenarios", [["Base", "Not reached"], ["Upside", "Apr 2028"], ["Needed", "4% a month"]]],
      [/runway|how long|cash last|run out/, "You have 20 months of runway, to July 2028.", "That is the base case: revenue growing 2% a month and costs 1%. With slower growth it is 15 months.", "Cash of $3.06M, burn of $215k, base scenario", [["Cash", "$3.06M"], ["Burn", "$215k"], ["Cash out", "Jul 2028"]]],
      [/expense|cost|spend|increase/, "Hosting increased most: up $11.2k on October.", "Next were support contractors, up $3.3k, and commissions, up $2.1k. Every other cost line moved by less than $2k.", "All expense accounts, November against October", [["Hosting", "+$11.2k"], ["Support", "+$3.3k"], ["Commissions", "+$2.1k"]]],
      [/late|overdue|owe|collect|unpaid/, "Three customers owe $32k past due.", "Northwind is $18k and 34 days late, Tallis and Co is $9k and 12 days late, and Oakline Health is $5k and 3 days late. Follow-ups are drafted for all three.", "Open invoices and payment history", [["Northwind", "$18k"], ["Tallis and Co", "$9k"], ["Oakline", "$5k"]]],
      [/renew|churn|lost|cancel|at risk/, "Two renewals are due by February, worth $252k a year.", "Corvid Systems, $180k, looks safe and the quote is drafted. Brightdesk, $72k, cut seats in November and is worth a call. Meridian Labs left last month.", "Signed contracts and renewal dates", [["Corvid", "$180k, Jan"], ["Brightdesk", "$72k, Feb"], ["Lost in Nov", "$92k"]]],
      [/revenue|sales|growth|arr|recurring/, "Revenue was $335k in November, up 4.0%.", "Recurring revenue reached $4.02M a year, up $160k: $276k gained from new customers and upsells, $116k lost.", "41 contracts, November revenue schedule", [["Revenue", "$335k"], ["Gained", "$276k"], ["Lost", "$116k"]]],
      [/cash|bank|balance/, "You have $3.06M in the bank.", "That is $215k less than October, in line with the month's loss. All three accounts are reconciled to today.", "3 bank accounts, reconciled today", [["Cash", "$3.06M"], ["Change", "-$215k"], ["Accounts", "3, reconciled"]]]];
    var PAST = ["Why did gross margin fall?", "Who is late paying?", "Which costs went up most?"], NEXT = ["What if we hire five people?", "What if we raise $8M?", "What if growth slows?", "When do we break even?"];
    var T = [], voice = false, hearing = false, speaking = false, SR = window.SpeechRecognition || window.webkitSpeechRecognition, canSpeak = "speechSynthesis" in window;
    function answer(q) { var l = q.toLowerCase(); for (var i = 0; i < A.length; i++) if (A[i][0].test(l)) { var a = A[i]; return typeof a[1] === "function" ? a[1](l) : [a[1], a[2], a[3], a[4]]; } return ["This preview only knows a handful of sample questions.", "Try one of the suggestions. In the product, the answer comes from your own ledger and plan, with the entries behind it.", "", null]; }
    function say(t) { if (!voice || !canSpeak) return; try { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.rate = 1.02; u.onend = function () { speaking = false; var o = el.querySelector(".k-orb"); if (o) o.classList.remove("k-talk"); }; speaking = true; window.speechSynthesis.speak(u); } catch (e) {} }
    function ask(q) { q = (q || "").trim(); if (!q) return; var a = answer(q); T.push([q, a]); if (T.length > 2) T.shift(); say(a[0] + " " + a[1]); draw(); }
    function chips(list) { return list.map(function (s) { return '<button type="button" data-s="' + s + '">' + s + "</button>"; }).join(""); }
    function draw() {
      el.innerHTML = '<div class="k"><div class="k-voice"><button type="button" class="k-orb' + (hearing ? " k-hear" : "") + (speaking ? " k-talk" : "") + '" data-a="mic" aria-label="Speak your question"><span></span><span></span><span></span><span></span><span></span></button><b>' + (hearing ? "Listening..." : speaking ? "Answering out loud" : SR ? "Tap and ask out loud" : "Voice works in Chrome and Safari") + "</b><small>" + (SR ? "or type below" : "you can still type below") + "</small>" + (canSpeak ? '<button type="button" class="k-tog" data-a="voice" aria-pressed="' + voice + '"><i></i>Read answers aloud</button>' : "") + '</div><div class="k-main"><div class="k-thread">' + (T.length ? T.map(function (x) { var a = x[1]; return '<div class="k-q">' + x[0].replace(/</g, "&lt;") + '</div><div class="k-a"><b>' + a[0] + "</b>" + (a[3] ? '<div class="k-viz">' + a[3].map(function (v) { return "<div><small>" + v[0] + "</small><strong>" + v[1] + "</strong></div>"; }).join("") + "</div>" : "") + "<p>" + a[1] + "</p>" + (a[2] ? "<small><strong>Working:</strong> " + a[2] + "</small>" : "") + "</div>"; }).join("") : '<div class="k-empty"><b>Ask about what happened, or what happens next.</b><span>The books answer the first. The plan answers the second. It is one system, so you can ask both in the same breath.</span></div>') + '</div><div class="k-sug"><div><small>WHAT HAPPENED</small>' + chips(PAST) + "</div><div><small>WHAT HAPPENS NEXT</small>" + chips(NEXT) + '</div></div><form class="q-bar"><input type="text" placeholder="Ask about your numbers" aria-label="Ask about your numbers" autocomplete="off"><button type="submit" class="m-btn">Ask</button></form><p class="k-foot">Sample answers on sample data. In the product, every answer shows the entries and assumptions behind it.</p></div></div>';
      var th = el.querySelector(".k-thread"); th.scrollTop = th.scrollHeight;
    }
    el.addEventListener("submit", function (e) { e.preventDefault(); ask(el.querySelector("input").value); });
    el.addEventListener("click", function (e) {
      var s = e.target.closest("[data-s]"); if (s) { ask(s.getAttribute("data-s")); return; }
      var a = e.target.closest("[data-a]"); if (!a) return;
      if (a.getAttribute("data-a") === "voice") { voice = !voice; if (!voice && canSpeak) { window.speechSynthesis.cancel(); speaking = false; } draw(); }
      else if (SR && !hearing) { try { var r = new SR(); r.lang = "en-US"; r.interimResults = false; hearing = true; if (canSpeak) voice = true; draw(); r.onresult = function (ev) { hearing = false; ask(ev.results[0][0].transcript); }; r.onerror = r.onend = function () { if (hearing) { hearing = false; draw(); } }; r.start(); } catch (x) { hearing = false; draw(); } }
    });
    draw();
  };
})();
(function () {
  var W = window.CAWidgets;
  function on(root, sel, fn) { root.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest(sel) : null; if (t && root.contains(t)) fn(t, e); }); }
  var CHECK = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="17" fill="#2450DC" stroke="#2450DC"></rect><path d="M4.5 9.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2"></path></svg>';
  function rows(a) { return a.map(function (r) { return '<div class="f-row ' + (r[2] || "") + '" style="grid-template-columns:minmax(0,2.4fr) minmax(0,1fr)"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>"; }).join(""); }
  /* ---------- accounting basis and rules ---------- */
  W.basis = function (el) {
    var tab = 0, cash = 0, ifrs = 0;
    function draw() {
      var b;
      if (tab === 0) b = '<div class="m-two m-tw2"><div class="m-pane" style="padding:0"><div class="m-filters"><button type="button" data-c="0" aria-pressed="' + !cash + '">Accrual: when it was earned</button><button type="button" data-c="1" aria-pressed="' + !!cash + '">Cash: when money moved</button></div>' + rows(cash ? [["Received from customers", "321"], ["Interest received", "9"], ["Paid to people and suppliers", "(545)"], ["Net cash, November", "(215)", "f-total"]] : [["Revenue earned", "335"], ["Costs incurred", "(559)"], ["Interest earned", "9"], ["Net income, November", "(215)", "f-total"]]) + '</div><div class="m-pane"><span class="m-lab">ONE SET OF ENTRIES, TWO VIEWS</span><p class="m-p" style="font-size:15.5px">' + (cash ? "The cash view counts money only when it reaches or leaves the bank. Many small businesses file their taxes this way." : "The accrual view counts revenue when it is earned and costs when they are incurred. Investors, lenders and auditors expect it.") + '</p><div class="m-fl"><span>Customers owe $14k more than last month</span><b>' + (cash ? "Not counted yet" : "Counted as revenue") + '</b></div><div class="m-fl"><span>Depreciation of $4k</span><b>' + (cash ? "Not a cash cost" : "Counted as a cost") + '</b></div><p class="m-foot" style="padding:8px 0 0">The books are kept on the accrual basis. The cash view is one click, with no second set of books to maintain.</p></div></div>';
      else if (tab === 1) b = '<div class="m-two m-tw2"><div class="m-pane" style="padding:0"><div class="f-row f-hd" style="grid-template-columns:minmax(0,2.4fr) minmax(0,1fr)"><span>From the official number to the adjusted one, $k</span><b>Nov</b></div>' + rows([["Net income, as reported", "(215.0)", "f-sub"], ["Depreciation", "4.0"], ["Interest income", "(9.0)"], ["Income tax", "1.0"], ["EBITDA", "(219.0)", "f-sub"], ["Share-based pay", "17.5"], ["One-off hosting migration", "6.0"], ["Adjusted EBITDA", "(195.5)", "f-total"]]) + '</div><div class="m-pane"><span class="m-lab">TWO NUMBERS, ONE DEFINITION</span><p class="m-p" style="font-size:15.5px">Boards and investors usually look at an adjusted figure. The official one follows accounting rules. The difference between them should never be a mystery.</p><div class="m-note">' + CHECK + ' Your definition of "adjusted" is set once and locked. Every report shows this bridge, and any change to the definition is logged with who made it.</div><p class="m-foot" style="padding:0">The same applies to recurring revenue against recognized revenue, on the Revenue page.</p></div></div>';
      else b = '<div class="m-two m-tw2"><div class="m-pane" style="padding:0"><div class="f-row f-hd" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)"><span>Company</span><b>Local books</b><b>Year end</b></div>' + [["Sample Co., Inc.", "US GAAP", "December"], ["Sample Co. UK Ltd", "UK, FRS 102", "December"], ["Sample Co. GmbH", "Germany, HGB", "December"]].map(function (r) { return '<div class="f-row" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)"><span>' + r[0] + "</span><b>" + r[1] + "</b><b>" + r[2] + "</b></div>"; }).join("") + '<div class="m-filters" style="border-top:1px solid #D5DBE5"><button type="button" data-g="0" aria-pressed="' + !ifrs + '">Group under US GAAP</button><button type="button" data-g="1" aria-pressed="' + !!ifrs + '">Group under IFRS</button></div>' + rows(ifrs ? [["Office leases shown as assets and debts", "+412 each side"], ["Development costs treated as an asset", "+38 to profit"], ["Group net income, November", "(177)", "f-total"]] : [["German books restated to US GAAP", "2 entries"], ["UK books restated to US GAAP", "1 entry"], ["Group net income, November", "(215)", "f-total"]]) + '</div><div class="m-pane"><span class="m-lab">EACH COMPANY BY ITS OWN RULES, THE GROUP BY ONE</span><p class="m-p" style="font-size:15.5px">Every company keeps the books its own country requires. The differences are posted as adjustments when the group is put together, so nothing is kept twice.</p><div class="m-fl"><span>Revenue recognition</span><b>ASC 606 and IFRS 15</b></div><div class="m-fl"><span>Tax books</span><b>Kept alongside, per company</b></div><div class="m-fl"><span>Year end and periods</span><b>Set per company</b></div><p class="m-foot" style="padding:8px 0 0">Sample adjustments. Which rules apply to you is a question for your accountant, and the system then follows the answer.</p></div></div>';
      el.innerHTML = '<div class="a-views">' + ["Cash or accrual", "Official and adjusted", "Rules by country"].map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + x + "</button>"; }).join("") + "</div>" + b;
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-c]", function (t) { cash = +t.getAttribute("data-c"); draw(); }); on(el, "[data-g]", function (t) { ifrs = +t.getAttribute("data-g"); draw(); }); draw();
  };
  /* ---------- about: the three seats ---------- */
  W.seats = function (el) {
    var D = [["SEAT 01", "Banking and investing", "Investment banking in London, then venture capital, and an angel investor since.", "From this seat you read other people's numbers, in deals where someone is paid to find the gap. You learn how often the board pack, the data room and the model disagree, and what that costs a company in trust and in price.", "The board pack, the data room and the model all read one ledger, so they cannot disagree.", "company#data-room", "See the data room"],
      ["SEAT 02", "Finance leader", "Ran finance at Holded, the European accounting software company acquired by Visma, then CFO of an international enterprise software company with a US subsidiary.", "From this seat you see accounting software from the inside, and you run the close, the forecast, the fundraise and the sale of the company on tools that do not talk to each other.", "Customers, contracts, billing, books and plan sit on one record, entered once.", "./#cycle", "See the full cycle"],
      ["SEAT 03", "Fractional CFO", "Finance lead for hire to startups, including two with US entities: software and AI companies that sell to businesses, and consumer brands that sell to people.", "From this seat you see that every kind of business has the same finance problems under different names. Subscriptions or stock, seats or shipments, the questions are still what was earned, what is owed and how long the cash lasts.", "Each way of selling has its own billing, its own dashboard and its own board pack, on the same books.", "revenue#how-you-sell", "See the ways to sell"],
      ["SEAT 04", "Founder", "Co-founded Lazare Farms, a vertical farming company, from 2024 to 2026. Now building Countahead.", "From this seat you are the customer: a founder with no finance team, who needs to know today what the cash looks like and cannot wait for month end to find out.", "A daily view of what is behind you, what needs you today and what is ahead, and answers you can ask for in plain words.", "plan#today", "See the daily view"]], cur = 0;
    function draw() {
      var d = D[cur];
      el.innerHTML = '<div class="ab-tabs" role="group" aria-label="Seat">' + D.map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><small>' + x[0] + "</small><b>" + x[1] + "</b></button>"; }).join("") + '</div><div class="ab-seat"><p class="ab-what">' + d[2] + '</p><span class="m-lab">WHAT YOU SEE FROM THERE</span><p>' + d[3] + '</p><div class="ab-became"><span class="m-lab">WHAT IT BECAME IN COUNTAHEAD</span><p>' + d[4] + '</p><a href="' + d[5] + '">' + d[6] + ' <span aria-hidden="true">&rarr;</span></a></div></div>';
    }
    on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); draw();
  };
  /* ---------- revenue forecast, built up (v2) ---------- */
  W.revplan = function (el) {
    var P = { ch: 7, ex: 11, pipe: 1, reps: 3, q: 40, att: 75 }, NOW = 4020, GOAL = 6000, MO = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    function k(v) { return Math.round(v).toLocaleString("en-US"); } function M(v) { return "$" + (v / 1000).toFixed(2) + "M"; }
    function calc(p) {
      var pv = p.pipe === 0 ? 0 : p.pipe === 1 ? (p.pv == null ? 190 : p.pv) : 348, R = { kept: [], exp: [], pipe: [], nb: [], tot: [] }, per = p.q * p.att / 100;
      for (var m = 0; m <= 12; m++) { var old = Math.min(p.reps, 3) * per * Math.max(0, m - 3), add = 0, s = m - 2; for (var j = 1; j <= s; j++) add += Math.min(j / 3, 1); add *= Math.max(0, p.reps - 3) * per;
        R.kept.push(NOW * (1 - p.ch / 100 * m / 12)); R.exp.push(NOW * p.ex / 100 * m / 12); R.pipe.push(pv * Math.min(m / 5, 1)); R.nb.push(old + add); R.tot.push(R.kept[m] + R.exp[m] + R.pipe[m] + R.nb[m]); }
      return R;
    }
    function draw(keep) {
      var R = calc(P), end = R.tot[12], lo = calc({ ch: P.ch + 2, ex: Math.max(0, P.ex - 3), pipe: P.pipe, pv: 95, reps: P.reps, q: P.q, att: Math.max(0, P.att - 15) }).tot[12], hi = calc({ ch: Math.max(0, P.ch - 2), ex: P.ex + 3, pipe: P.pipe ? 2 : 0, reps: P.reps, q: P.q, att: P.att + 15 }).tot[12], gap = GOAL - end;
      var need = 0, t = { ch: P.ch, ex: P.ex, pipe: P.pipe, reps: P.reps, q: P.q, att: P.att }; while (calc(t).tot[12] < GOAL && need < 20) { t.reps++; need++; }
      var attN = R.nb[12] > 0 ? Math.ceil(P.att * (R.nb[12] + gap) / R.nb[12]) : 999;
      var Wd = 660, H = 290, L = 46, Rr = 54, T = 18, B = 28, mx = Math.max(GOAL, hi) * 1.06, bw = (Wd - L - Rr) / 13;
      function Y(v) { return T + (1 - v / mx) * (H - T - B); }
      var g = ""; for (var i = 0; i <= 3; i++) { var v = i * 2000; if (v > mx) break; g += '<line x1="' + L + '" x2="' + (Wd - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (i ? "#E3E7EE" : "#0B1B3A") + '"></line><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="#4B5565">$' + v / 1000 + "M</text>"; }
      var bars = ""; for (var m = 0; m <= 12; m++) { var x = L + m * bw + 2, w = bw - 4, y = 0; [["kept", "#0B1B3A"], ["exp", "#2450DC"], ["pipe", "#FFD15C"], ["nb", "#5B8CFF"]].forEach(function (s) { var v = R[s[0]][m]; if (v > 0.5) bars += '<rect x="' + x.toFixed(1) + '" y="' + Y(y + v).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(0, Y(y) - Y(y + v)).toFixed(1) + '" fill="' + s[1] + '"></rect>'; y += v; });
        if (m % 2 === 0) bars += '<text x="' + (x + w / 2) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="#4B5565">' + MO[m] + "</text>"; }
      var xe = L + 12 * bw + bw / 2, rng = '<line x1="' + (xe + bw / 2 + 6) + '" x2="' + (xe + bw / 2 + 6) + '" y1="' + Y(hi) + '" y2="' + Y(lo) + '" stroke="#0B1B3A" stroke-width="2"></line><line x1="' + (xe + bw / 2 + 1) + '" x2="' + (xe + bw / 2 + 11) + '" y1="' + Y(hi) + '" y2="' + Y(hi) + '" stroke="#0B1B3A" stroke-width="2"></line><line x1="' + (xe + bw / 2 + 1) + '" x2="' + (xe + bw / 2 + 11) + '" y1="' + Y(lo) + '" y2="' + Y(lo) + '" stroke="#0B1B3A" stroke-width="2"></line><text x="' + (xe + bw / 2 + 15) + '" y="' + (Y(hi) + 4) + '" font-size="10.5" font-weight="700" fill="#0B1B3A">' + (hi / 1000).toFixed(1) + '</text><text x="' + (xe + bw / 2 + 15) + '" y="' + (Y(lo) + 4) + '" font-size="10.5" font-weight="700" fill="#0B1B3A">' + (lo / 1000).toFixed(1) + "</text>";
      var goal = '<line x1="' + L + '" x2="' + (Wd - Rr) + '" y1="' + Y(GOAL) + '" y2="' + Y(GOAL) + '" stroke="#8A5A00" stroke-width="2" stroke-dasharray="6 5"></line><text x="' + (L + 6) + '" y="' + (Y(GOAL) - 6) + '" font-size="11" font-weight="800" fill="#8A5A00">GOAL $6.0M</text>';
      var BR = [["Customers who leave or shrink", -(NOW - R.kept[12]), "#8A5A00", "41 signed contracts and their renewal dates"], ["Customers who grow", R.exp[12], "#2450DC", "Upsells and price steps already in contracts, plus your history"], ["Open pipeline", R.pipe[12], "#FFD15C", "7 open deals worth $348k, $190k at stage odds"], ["New business from the team", R.nb[12], "#5B8CFF", P.reps + (P.reps === 1 ? " rep" : " reps") + (P.reps > 3 ? ", " + (P.reps - 3) + " starting in January" : "") + ", from the headcount plan"]], bm = Math.max.apply(null, BR.map(function (b) { return Math.abs(b[1]); })) || 1;
      function sl(lab, key, mn, mxx, st, val, bench) { return '<div class="m-kv" style="border:0;padding-bottom:0"><span>' + lab + "</span><b>" + val + '</b></div><input type="range" min="' + mn + '" max="' + mxx + '" step="' + st + '" value="' + P[key] + '" aria-label="' + lab + '" data-r="' + key + '">' + (bench ? '<div class="m-bench"><span>' + bench + "</span></div>" : ""); }
      el.innerHTML = '<div class="fx-kp"><div class="m-good"><small>IN 12 MONTHS</small><b>' + M(end) + "</b><span>from $4.02M today</span></div><div><small>GROWTH</small><b>+" + Math.round((end / NOW - 1) * 100) + "%</b><span>$" + k(end - NOW) + 'k net new</span></div><div><small>LIKELY RANGE</small><b>' + M(lo).replace("M", "") + " to " + M(hi) + '</b><span>if things go worse or better</span></div><div class="' + (gap > 0 ? "m-bad" : "m-good") + '"><small>AGAINST THE $6.0M GOAL</small><b>' + (gap > 0 ? "$" + k(gap) + "k short" : "$" + k(-gap) + "k ahead") + "</b><span>" + (gap > 0 ? "the goal is set on the other tab" : "the build supports the goal") + "</span></div></div>" +
        '<div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane m-form"><span class="m-lab">1. THE CUSTOMERS YOU HAVE <em class="fx-src">from contracts</em></span>' + sl("Leave or shrink, a year", "ch", 0, 15, 1, P.ch + "%") + sl("Grow, a year", "ex", 0, 25, 1, P.ex + "%", "Net retention " + (100 - P.ch + P.ex) + "%. Your last 12 months: 104%") +
        '<span class="m-lab" style="margin-top:10px">2. DEALS ALREADY OPEN <em class="fx-src">from the pipeline</em></span><div class="m-opts fx-3">' + ["Ignore", "At stage odds", "All close"].map(function (p, i) { return '<button type="button" data-a="p" data-v="' + i + '" aria-pressed="' + (i === P.pipe) + '">' + p + "</button>"; }).join("") + "</div>" +
        '<span class="m-lab" style="margin-top:10px">3. WHAT THE TEAM CAN SELL <em class="fx-src">from the headcount plan</em></span><div class="m-kv"><span>Reps selling</span><span class="m-stp"><button type="button" data-a="r-" aria-label="Fewer reps">&minus;</button><output>' + P.reps + '</output><button type="button" data-a="r+" aria-label="More reps">+</button></span></div>' + sl("Quota each, a month", "q", 20, 80, 5, "$" + P.q + "k") + sl("Share of quota they hit", "att", 40, 120, 5, P.att + "%", "Your last four quarters: 72%") + "</div>" +
        '<div class="m-pane"><span class="m-lab">RECURRING REVENUE, MONTH BY MONTH</span><svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="Recurring revenue forecast for 12 months, by source, against the goal" style="width:100%;height:auto;display:block;margin-top:8px">' + g + bars + goal + rng + '</svg><div class="m-legend" style="font-size:12.5px"><span><i style="background:#0B1B3A"></i>Kept</span><span><i style="background:#2450DC;border-color:#2450DC"></i>Growth</span><span><i style="background:#FFD15C;border-color:#8A5A00"></i>Pipeline</span><span><i style="background:#5B8CFF;border-color:#5B8CFF"></i>New business</span><span><i style="background:#fff;border-color:#0B1B3A;width:3px"></i>Range</span></div>' +
        '<div class="fx-br"><div class="fx-row fx-tot"><span>Today</span><i></i><b>$' + k(NOW) + "k</b></div>" + BR.map(function (b) { return '<div class="fx-row"><span>' + b[0] + "<small>" + b[3] + '</small></span><i><u style="width:' + Math.abs(b[1]) / bm * 100 + "%;background:" + b[2] + '"></u></i><b>' + (b[1] < 0 ? "&minus;" : "+") + "$" + k(Math.abs(b[1])) + "k</b></div>"; }).join("") + '<div class="fx-row fx-tot"><span>In 12 months</span><i></i><b>$' + k(end) + "k</b></div></div></div></div>" +
        '<div class="fx-gap">' + (gap > 0 ? "<b>To reach $6.0M:</b> " + (need < 20 ? "hire " + need + " more " + (need === 1 ? "rep" : "reps") + " to start in January" : "more reps alone will not do it in 12 months") + (attN <= 130 ? ", or have the team hit " + attN + "% of quota" : "") + ". Each added rep takes three months to reach full quota." : "<b>The build supports the goal.</b> Check that the hiring plan and the cash to pay for it agree, in scenarios.") + ' <span>Pipeline covers the first three months, so today\'s reps count from March. Sample figures.</span></div>';
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { P[r.getAttribute("data-r")] = +this.value; draw(r.getAttribute("data-r")); }); });
      if (keep) { var f = el.querySelector('[data-r="' + keep + '"]'); if (f) f.focus(); }
    }
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"); if (a === "p") P.pipe = +t.getAttribute("data-v"); if (a === "r-") P.reps = Math.max(0, P.reps - 1); if (a === "r+") P.reps = Math.min(12, P.reps + 1); draw(); }); draw();
  };

  /* ---------- data room with sharing, tracking and questions (v2) ---------- */
  W.dataroom = function (el) {
    var F = [["Financials", [["Monthly accounts, to November 2026", "live", "Closed 3 days after month end"], ["Financial model.xlsx", "live", "Rebuilt from the ledger today"], ["Board packs, last 12 months", "live", "November added on the 4th"], ["Audited accounts, 2025", "file", "Uploaded by your auditor"]]], ["Revenue and customers", [["Recurring revenue by customer", "live", "41 customers, updated today"], ["Retention by cohort", "live", "Updated today"], ["Top 20 customer contracts", "live", "Signed copies, from contracts"], ["Sales pipeline", "live", "7 open deals"]]], ["Company and cap table", [["Cap table", "live", "From company records"], ["Shareholders agreement", "file", "Signed March 2024"], ["Articles and board minutes", "file", "14 documents"], ["Option plan and grants", "live", "11 holders"]]], ["Team", [["Headcount and payroll summary", "live", "24 people"], ["Employment agreements", "file", "24 of 24 on file"], ["Key person insurance", "miss", "Not uploaded yet"]]], ["Tax and compliance", [["Sales tax by jurisdiction", "live", "This quarter to date"], ["Corporate tax returns, 2025", "file", "Uploaded by your adviser"], ["Data protection policy", "miss", "Not uploaded yet"]]]];
    var CH = { live: ["LIVE", "m-blue"], file: ["ON FILE", ""], miss: ["MISSING", "m-warn"] };
    var V = [["Harbour Ventures", "Maya Lindqvist, partner", "All folders", "Active, 22 days left", 9, "1h 48m", "Today, 09:12", 14, [["Financial model.xlsx", "42m", 6], ["Retention by cohort", "24m", 3], ["Monthly accounts, to November 2026", "19m", 4], ["Cap table", "11m", 2], ["Top 20 customer contracts", "12m", 2]]], ["Tern Partners", "Leo Brandt, principal", "All folders", "Active, 27 days left", 4, "47m", "Yesterday", 8, [["Financial model.xlsx", "21m", 3], ["Recurring revenue by customer", "14m", 2], ["Board packs, last 12 months", "12m", 1]]], ["Ninefold Capital", "Priya Raman, associate", "Financials, Revenue", "Invited 6 days ago", 0, "0m", "Not opened", 0, []], ["Ruth Okafor", "Angel investor", "Financials only", "Expired", 2, "16m", "3 weeks ago", 3, [["Monthly accounts, to November 2026", "9m", 2], ["Board packs, last 12 months", "7m", 1]]]];
    var ACT = [["Today, 09:12", "Maya Lindqvist", "Harbour Ventures", "opened", "Financial model.xlsx", "14 minutes, Assumptions and Cash flow tabs"], ["Today, 08:55", "Maya Lindqvist", "Harbour Ventures", "asked a question on", "Monthly accounts, to November 2026", "Why did gross margin fall?"], ["Yesterday, 17:40", "Leo Brandt", "Tern Partners", "opened", "Recurring revenue by customer", "9 minutes"], ["Yesterday, 17:22", "Leo Brandt", "Tern Partners", "tried to download", "Cap table", "Blocked, downloads are off"], ["Monday, 11:03", "Maya Lindqvist", "Harbour Ventures", "forwarded the link to", "a colleague", "Asked to verify their own email first"]];
    var DOCS = [["Financial model.xlsx", "1h 03m", 2, 100], ["Monthly accounts, to November 2026", "28m", 2, 44], ["Retention by cohort", "24m", 1, 38], ["Board packs, last 12 months", "19m", 2, 30], ["Recurring revenue by customer", "14m", 1, 22], ["Top 20 customer contracts", "12m", 1, 19], ["Cap table", "11m", 1, 17]];
    var tab = 0, cur = 0, who = 0, sent = false, made = false, S = { email: 1, nda: 1, mark: 1, dl: 0 }, days = 30, FO = [1, 1, 1, 0, 0];
    function draw() {
      var all = [].concat.apply([], F.map(function (x) { return x[1]; })), live = all.filter(function (d) { return d[1] === "live"; }).length, body;
      if (tab === 0) body = '<div class="m-two m-tw2"><div class="m-list">' + F.map(function (x, i) { var m = x[1].filter(function (d) { return d[1] === "miss"; }).length; return '<button type="button" class="m-row" data-i="' + i + '" aria-pressed="' + (i === cur) + '"><span><b>' + x[0] + "</b><small>" + x[1].length + " documents" + (m ? ", " + m + " missing" : "") + "</small></span><b>" + (i + 1) + "</b></button>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">' + F[cur][0].toUpperCase() + "</span>" + F[cur][1].map(function (d) { return '<div class="m-li" style="padding:10px 0"><span><b>' + d[0] + "</b><small>" + d[2] + '</small></span><span class="m-chip ' + CH[d[1]][1] + '">' + CH[d[1]][0] + "</span></div>"; }).join("") + '<p class="m-foot" style="padding:0">Live documents are built from the books, contracts and company records each time someone opens them, so nobody is ever reading last month\'s export.</p></div></div>';
      if (tab === 1) body = '<div class="m-two m-tw2"><div class="m-pane m-form"><span class="m-lab">NEW LINK</span><div class="m-kv"><span>Who is it for</span><b>One person at one firm</b></div><span class="m-lab" style="margin-top:6px">FOLDERS THEY CAN SEE</span><div class="dr-chips">' + F.map(function (x, i) { return '<button type="button" data-f="' + i + '" aria-pressed="' + !!FO[i] + '">' + x[0] + "</button>"; }).join("") + '</div><span class="m-lab" style="margin-top:6px">RULES</span>' + [["email", "Verify their email before opening", "Each person signs in as themselves, so forwarded links do not work."], ["nda", "Sign a confidentiality agreement first", "Signed on the platform and filed in company records."], ["mark", "Watermark every page with their name", "And the date and time they opened it."], ["dl", "Allow downloads", "Off means view only, in the browser."]].map(function (r) { return '<button type="button" class="dr-tg" data-s="' + r[0] + '" aria-pressed="' + !!S[r[0]] + '"><span><b>' + r[1] + "</b><small>" + r[2] + "</small></span><i></i></button>"; }).join("") + '<div class="m-kv"><span>Link expires after</span><span class="m-stp"><button type="button" data-a="d-" aria-label="Fewer days">&minus;</button><output style="min-width:84px">' + days + ' days</output><button type="button" data-a="d+" aria-label="More days">+</button></span></div>' + (made ? '<div class="m-note">' + CHECK + " Link created: " + FO.filter(Boolean).length + " of 5 folders, " + (S.dl ? "downloads allowed" : "view only") + ", expires in " + days + " days. You can switch it off at any moment, and it stops working the instant you do.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="mk">Create link</button></div>') + '</div><div class="m-pane"><span class="m-lab">WHO HAS ACCESS</span>' + V.map(function (v) { return '<div class="m-li" style="padding:11px 0"><span><b>' + v[0] + "</b><small>" + v[1] + " &middot; " + v[2] + '</small></span><span class="m-chip ' + (v[3] === "Expired" ? "" : v[4] ? "m-blue" : "m-warn") + '">' + v[3].toUpperCase() + "</span></div>"; }).join("") + '<p class="m-foot" style="padding:0">One link per person. Change what they see, extend it or switch it off without sending anything new.</p></div></div>';
      if (tab === 2) { var v = V[who]; body = '<div class="m-two m-tw2"><div class="m-list">' + V.map(function (x, i) { return '<button type="button" class="m-row" data-w="' + i + '" aria-pressed="' + (i === who) + '"><span><b>' + x[0] + "</b><small>" + (x[4] ? x[4] + " visits, " + x[5] + ", last seen " + x[6].toLowerCase() : x[3]) + '</small></span><span class="dr-eng"><i style="width:' + x[7] / 18 * 100 + '%"></i></span></button>'; }).join("") + '<div class="m-pane" style="border-top:1px solid #D5DBE5"><span class="m-lab">MOST READ, ALL INVESTORS</span>' + DOCS.slice(0, 5).map(function (d) { return '<div class="dr-doc"><span>' + d[0] + '</span><i><u style="width:' + d[3] + '%"></u></i><b>' + d[1] + "</b></div>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">' + v[0].toUpperCase() + '</span><div class="dr-st"><div><small>VISITS</small><b>' + v[4] + "</b></div><div><small>TIME IN THE ROOM</small><b>" + v[5] + "</b></div><div><small>DOCUMENTS OPENED</small><b>" + v[7] + " of 18</b></div></div>" + (v[8].length ? v[8].map(function (d) { return '<div class="m-li" style="padding:10px 0"><span><b>' + d[0] + "</b><small>Opened " + d[2] + (d[2] === 1 ? " time" : " times") + "</small></span><b>" + d[1] + "</b></div>"; }).join("") : '<div class="m-note" style="background:#FFF3D1;border-color:#8A5A00">The link has not been opened. A reminder is drafted for you to send.</div>') + (v[4] ? '<span class="m-lab" style="margin-top:14px">LATEST ACTIVITY</span>' : "") + ACT.filter(function (a) { return a[2] === v[0]; }).map(function (a) { return '<div class="dr-act"><small>' + a[0] + "</small><span><b>" + a[1] + "</b> " + a[3] + " <b>" + a[4] + "</b><em>" + a[5] + "</em></span></div>"; }).join("") + "</div></div>"; }
      if (tab === 3) body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">QUESTION FROM HARBOUR VENTURES</span><div class="dr-q"><small>Maya Lindqvist, on Monthly accounts, to November 2026 &middot; today, 08:55</small><p>Why did gross margin fall from 78% to 75% in November? Is that a one-off?</p></div><span class="m-lab" style="margin-top:14px">ANSWER DRAFTED FROM THE LEDGER</span><div class="dr-a"><p>Gross margin fell from 78.4% to 74.9%. It is cost, not price: hosting rose $11.2k after a new region went live on November 3, and support contractors rose $3.3k. Revenue grew 4.0% in the same month. The hosting cost continues; the contractor cost ends in January.</p><small>Sources attached for the investor: 14 entries in 5100 Hosting, 6 in 5200 Support.</small></div>' + (sent ? '<div class="m-note">' + CHECK + " Sent to Maya Lindqvist, and added to the questions every investor in the room can see.</div>" : '<div class="m-acts"><button type="button" class="m-btn" data-a="send">Approve and send</button><button type="button" class="m-btn m-ghost" data-a="send">Edit first</button></div>') + '</div><div class="m-pane"><span class="m-lab">ANSWERED ALREADY</span>' + [["What is the largest customer as a share of revenue?", "Tern Partners", "Answered from recurring revenue by customer"], ["Are any contracts up for renewal before the round closes?", "Harbour Ventures", "Answered from signed contracts"], ["How many options are unallocated?", "Harbour Ventures", "Answered from the cap table"]].map(function (q) { return '<div class="m-li" style="padding:11px 0"><span><b>' + q[0] + "</b><small>" + q[1] + " &middot; " + q[2] + "</small></span></div>"; }).join("") + '<p class="m-foot" style="padding:0">Nothing goes to an investor until you approve it. Answer once and choose whether everyone in the room sees it.</p></div></div>';
      el.innerHTML = '<div class="fx-kp"><div><small>DOCUMENTS</small><b>' + all.length + "</b><span>" + live + ' always current</span></div><div><small>INVESTORS WITH A LINK</small><b>4</b><span>2 active this week</span></div><div><small>TIME SPENT IN THE ROOM</small><b>2h 51m</b><span>mostly on the model</span></div><div class="' + (sent ? "m-good" : "m-bad") + '"><small>QUESTIONS WAITING</small><b>' + (sent ? 0 : 1) + "</b><span>" + (sent ? "all answered" : "an answer is drafted") + '</span></div></div><div class="a-views">' + ["Documents", "Share a link", "Who read what", "Questions"].map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + x + "</button>"; }).join("") + "</div>" + body;
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-i]", function (t) { cur = +t.getAttribute("data-i"); draw(); }); on(el, "[data-w]", function (t) { who = +t.getAttribute("data-w"); draw(); });
    on(el, "[data-f]", function (t) { var i = +t.getAttribute("data-f"); FO[i] = FO[i] ? 0 : 1; made = false; draw(); }); on(el, "[data-s]", function (t) { var s = t.getAttribute("data-s"); S[s] = S[s] ? 0 : 1; made = false; draw(); });
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"); if (a === "d-") days = Math.max(7, days - 7 + (days === 30 ? 5 : 0)); if (a === "d+") days = Math.min(90, days + 7); if (a === "mk") made = true; if (a === "send") sent = true; draw(); }); draw();
  };
  /* ---------- company: draft formal documents from notes ---------- */
  W.drafter = function (el) {
    var SRC = [["Call transcript", "Board call, December 4, 47 minutes", [["Anna", "Everyone is here, so we have a quorum. Any changes to the September minutes? No? Approved."], ["Daniel", "November revenue was 335, cash is 3.06 million, about 20 months of runway."], ["Jonas", "I am fine with the hosting contract as long as it is capped at three years."], ["Anna", "Then that is approved. And the option grant for the new VP Sales, 40,000 options, standard vesting. All in favour? Great."], ["Ines", "Can finance bring a pricing proposal to the next meeting?"], ["Anna", "Yes. Next one is February 11."]]], ["Email thread", "Re: board items for sign-off, 9 emails", [["Anna", "Can we agree the hosting contract and the VP Sales grant by email, and minute it on the 4th?"], ["Jonas", "Hosting is fine with me if the term is capped at three years."], ["Ines", "Agreed on both. I would like a pricing proposal from finance in February."], ["Tom", "Agreed. 40,000 options, standard vesting, as in the offer letter."], ["Daniel", "For the record: November revenue 335, cash 3.06 million, 20 months of runway."], ["Anna", "Thanks all. Next meeting February 11."]]], ["Rough notes", "Typed during the meeting", [["", "all 4 there. sept mins ok"], ["", "nov: rev 335 / cash 3.06m / 20 mo runway"], ["", "hosting contract OK, 3 yrs max (Jonas)"], ["", "VP Sales options 40k, std vesting, approved"], ["", "Ines wants pricing proposal next mtg, finance"], ["", "next board 11 Feb"]]]];
    var DOC = [["Board minutes", "MINUTES OF A MEETING OF THE BOARD OF DIRECTORS", "Sample Co., Inc. Held by video call on December 4, 2026.", [["Present", "Anna Reyes (chair), Tom Becker, Jonas Hale, Ines Calder. In attendance: Daniel Osei, finance. A quorum was present."], ["1. Previous minutes", "The minutes of the meeting held on September 17, 2026 were approved."], ["2. Financial report", "The board noted November revenue of $335,000, cash of $3.06 million and runway of approximately 20 months."], ["3. Hosting agreement", "RESOLVED that the Company enter into the hosting agreement presented to the meeting, for a term not exceeding three years."], ["4. Option grant", "RESOLVED that 40,000 options be granted to the VP Sales under the 2024 option plan, vesting over four years with a one-year cliff, at an exercise price of [to be confirmed]."], ["5. Actions", "Finance to present a pricing proposal at the next meeting."], ["6. Next meeting", "February 11, 2027."]], "Signed by the chair"], ["Written consent", "UNANIMOUS WRITTEN CONSENT OF THE BOARD OF DIRECTORS", "Sample Co., Inc. In lieu of a meeting.", [["Background", "The Company has offered the position of VP Sales and wishes to grant options under the 2024 option plan."], ["Resolution", "RESOLVED that 40,000 options be granted to the VP Sales, vesting over four years with a one-year cliff, at an exercise price of [to be confirmed]."], ["Authority", "Any officer of the Company is authorized to sign the documents needed to carry this out."], ["Signatures", "Anna Reyes, Tom Becker, Jonas Hale, Ines Calder. 0 of 4 signed."]], "Signed by every director"], ["Investor update", "NOVEMBER UPDATE TO INVESTORS", "Sample Co., Inc. Sent under the information rights in the shareholders agreement.", [["The month", "Revenue was $335,000, up 4.0% on October. Cash is $3.06 million, which is about 20 months of runway on the base plan."], ["Decisions", "The board approved a hosting agreement of up to three years and an option grant for the incoming VP Sales."], ["What we are working on", "A pricing proposal, to be presented to the board on February 11."], ["Attached", "November accounts and the board pack, from the data room."]], "Approved by you before it is sent"], ["Action list", "ACTIONS FROM THE BOARD MEETING", "December 4, 2026. Added to the company calendar.", [["Finance, by February 4", "Prepare a pricing proposal for the February board meeting."], ["Chair, by December 11", "Sign the minutes and circulate them to directors."], ["Legal, by December 18", "Confirm the option exercise price and issue the grant paperwork."], ["Finance, by December 18", "Sign the hosting agreement once legal has reviewed the term."]], "Owners are reminded as each date approaches"]];
    var CK = [[1, "Quorum", "4 of 4 directors present, matching the register."], [1, "Option grant fits the plan", "40,000 of the 600,000 options still available."], [1, "Numbers match the books", "Revenue, cash and runway agree to the closed November accounts."], [1, "No investor consent needed", "Neither item is on the consent list in the shareholders agreement."], [0, "Exercise price was not mentioned", "Left blank for your lawyer to confirm. Nothing is invented to fill a gap."]];
    var s = 0, d = 0, sent = 0;
    function draw() {
      var S = SRC[s], D = DOC[d];
      el.innerHTML = '<div class="dn-top"><div><span class="m-lab">1. DROP IN WHAT YOU HAVE</span><div class="m-opts" style="justify-content:flex-start">' + SRC.map(function (x, i) { return '<button type="button" data-s="' + i + '" aria-pressed="' + (i === s) + '">' + x[0] + '</button>'; }).join("") + '</div></div><div><span class="m-lab">2. CHOOSE WHAT YOU NEED</span><div class="m-opts" style="justify-content:flex-start">' + DOC.map(function (x, i) { return '<button type="button" data-d="' + i + '" aria-pressed="' + (i === d) + '">' + x[0] + "</button>"; }).join("") + '</div></div></div><div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane dn-in"><span class="m-lab">' + S[1].toUpperCase() + "</span>" + S[2].map(function (l) { return '<p class="' + (l[0] ? "" : "dn-raw") + '">' + (l[0] ? "<b>" + l[0] + "</b> " : "") + l[1] + "</p>"; }).join("") + '<span class="m-lab" style="margin-top:14px">CHECKED AGAINST YOUR RECORDS</span>' + CK.map(function (c) { return '<div class="dn-ck' + (c[0] ? "" : " dn-w") + '"><i>' + (c[0] ? "&#10003;" : "!") + "</i><span><b>" + c[1] + "</b><small>" + c[2] + "</small></span></div>"; }).join("") + '</div><div class="m-pane dn-out"><div class="dn-paper"><span class="dn-draft">DRAFT</span><h5>' + D[1] + "</h5><p class=\"dn-sub\">" + D[2] + "</p>" + D[3].map(function (r) { return "<div><b>" + r[0] + "</b><p>" + r[1].replace("[to be confirmed]", '<mark>[to be confirmed]</mark>') + "</p></div>"; }).join("") + '<p class="dn-sig">' + D[4] + "</p></div>" + (sent ? '<div class="m-note">' + CHECK + (sent === 1 ? " Sent to your lawyer with the source attached. Their changes come back as tracked edits." : " Sent for signature on the platform. The signed copy is filed in company records and the actions go on the calendar.") + '</div>' : '<div class="m-acts"><button type="button" class="m-btn" data-a="1">Send to your lawyer</button><button type="button" class="m-btn m-ghost" data-a="2">Send for signature</button></div>') + '<p class="m-foot" style="padding:0">A first draft in the right form, not legal advice. Your lawyer or company secretary reviews it before anything is signed.</p></div></div>';
    }
    on(el, "[data-s]", function (t) { s = +t.getAttribute("data-s"); draw(); }); on(el, "[data-d]", function (t) { d = +t.getAttribute("data-d"); sent = 0; draw(); }); on(el, "[data-a]", function (t) { sent = +t.getAttribute("data-a"); draw(); }); draw();
  };
  /* ---------- books hero: the three statements (v2) ---------- */
  W.statements = function (el) {
    var tab = 0, cmp = 0, open = "cogs";
    function f(v) { var a = Math.abs(v).toLocaleString("en-US"); return v < 0 ? "(" + a + ")" : a; }
    function ser(a, o, n, w) { var r = []; for (var i = 0; i < 11; i++) r.push(a + (o - a) * i / 10 + (i % 3 === 1 ? w : i % 3 === 2 ? -w : 0) * (i < 10 ? 1 : 0)); r[10] = o; r.push(n); return r; }
    function spark(d, col) { var mx = Math.max.apply(null, d), mn = Math.min.apply(null, d), sp = mx - mn || 1; return '<svg viewBox="0 0 88 24" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="' + col + '" stroke-width="1.6" points="' + d.map(function (v, i) { return (i / 11 * 86 + 1).toFixed(1) + "," + (21 - (v - mn) / sp * 18).toFixed(1); }).join(" ") + '"></polyline><circle cx="87" cy="' + (21 - (d[11] - mn) / sp * 18).toFixed(1) + '" r="2.2" fill="' + col + '"></circle></svg>'; }
    var PL = [["rev", "Revenue", 335, 322, 330, 0, [2640, 2750, 2860, 2970, 3080, 3190, 3300, 3432, 3576, 3720, 3860, 4020].map(function (v) { return v / 12; })], ["cogs", "Cost of revenue", -84, -70, -73, 0, ser(52, 70, 84, 1.5)], ["gp", "Gross profit", 251, 252, 257, 1, ser(168, 252, 251, 2)], ["rd", "Research and development", -228, -224, -226, 0, ser(196, 224, 228, 2)], ["sm", "Sales and marketing", -142, -139, -144, 0, ser(112, 139, 142, 3)], ["ga", "General and administrative", -100, -98, -98, 0, ser(86, 98, 100, 1)], ["ebitda", "EBITDA", -219, -209, -211, 1, ser(226, 209, 219, 4)], ["da", "Depreciation", -4, -4, -4, 0, ser(3, 4, 4, 0)], ["op", "Operating result", -223, -213, -215, 1, ser(229, 213, 223, 4)], ["int", "Interest income", 9, 9, 9, 0, ser(12, 9, 9, 0)], ["tax", "Income tax", -1, -1, -1, 0, ser(1, 1, 1, 0)], ["net", "Net income", -215, -205, -207, 2, ser(218, 205, 215, 4)]];
    var DR = { rev: [[["4000", "Subscriptions", 323, 311], ["4100", "Implementation and one-off work", 12, 11]], "41 customers. Two new contracts started in November and one upgrade took effect.", "186 entries from signed contracts"], cogs: [[["5100", "Hosting", 52, 41], ["5200", "Support contractors", 21, 18], ["5300", "Payment fees", 6, 6], ["5400", "Software in the product", 5, 5]], "Hosting rose $11k after a new region went live on November 3. Support contractors rose $3k and end in January.", "20 entries, all approved"], rd: [[["6100", "Salaries and benefits", 186, 184], ["6150", "Contractors", 22, 21], ["6200", "Development tools", 20, 19]], "One engineer's pay review took effect on November 1.", "34 entries, 31 approved in bulk"], sm: [[["6300", "Salaries and benefits", 88, 87], ["6350", "Commissions", 16, 14], ["6400", "Advertising", 24, 24], ["6450", "Events and travel", 14, 14]], "Commissions rose $2k with November's two new contracts.", "58 entries, 3 held for a missing receipt"], ga: [[["6600", "Salaries and benefits", 58, 57], ["6700", "Legal and accounting", 16, 15], ["6800", "Rent and office", 14, 14], ["6900", "Insurance and other", 12, 12]], "Legal rose $1k for the hosting contract review.", "41 entries, all approved"] };
    function wf() {
      var S = [["Revenue", 335, 0, "#2450DC"], ["Cost", -84, 0, "#B9C3D3"], ["Gross profit", 251, 1, "#0B1B3A"], ["R&D", -228, 0, "#B9C3D3"], ["S&M", -142, 0, "#B9C3D3"], ["G&A", -100, 0, "#B9C3D3"], ["EBITDA", -219, 1, "#0B1B3A"]], Wd = 520, H = 230, T = 22, B = 26, mx = 335, mn = -219, bw = Wd / S.length, run = 0, o = "";
      function Y(v) { return T + (mx - v) / (mx - mn) * (H - T - B); }
      S.forEach(function (s, i) { var a, b; if (s[2]) { a = 0; b = s[1]; run = s[1]; } else if (i === 0) { a = 0; b = s[1]; run = s[1]; } else { a = run; b = run + s[1]; run = b; } var y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b)), x = i * bw + 8; o += '<rect x="' + x + '" y="' + y1.toFixed(1) + '" width="' + (bw - 16) + '" height="' + Math.max(1, y2 - y1).toFixed(1) + '" fill="' + s[3] + '"></rect><text x="' + (x + (bw - 16) / 2) + '" y="' + ((s[1] < 0 && s[2] ? y2 - 8 : y1 - 6)).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + (s[1] < 0 && s[2] ? "#fff" : "#0B1B3A") + '">' + f(s[1]) + '</text><text x="' + (x + (bw - 16) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#4B5565">' + s[0].replace("&", "&amp;") + "</text>"; if (i < S.length - 1 && !S[i + 1][2]) o += '<line x1="' + (x + bw - 16) + '" x2="' + (x + bw) + '" y1="' + Y(run) + '" y2="' + Y(run) + '" stroke="#0B1B3A" stroke-dasharray="2 3"></line>'; });
      return '<svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="From revenue of 335 to EBITDA of minus 219, in thousands of dollars" style="width:100%;height:auto;display:block">' + o + '<line x1="0" x2="' + Wd + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="#0B1B3A"></line></svg>';
    }
    function kpi(a) { return '<div class="st-kp">' + a.map(function (k) { return '<div><small>' + k[0] + "</small><b>" + k[1] + '</b><span class="' + (k[3] || "") + '">' + k[2] + "</span></div>"; }).join("") + "</div>"; }
    function pnl() {
      var ci = cmp ? 4 : 3, mxc = Math.max.apply(null, PL.map(function (r) { return Math.abs(r[2] - r[ci]); })) || 1;
      return '<div class="st-two"><div>' + kpi([["REVENUE", "$335k", "+4.0% on October", "st-up"], ["GROSS MARGIN", "74.9%", "down 3.5 points", "st-dn"], ["EBITDA", "($219k)", "plan ($211k)", "st-dn"], ["NET INCOME", "($215k)", "October ($205k)", ""]]) + '</div><div class="st-wf"><span class="m-lab">FROM REVENUE TO EBITDA, USD THOUSANDS</span>' + wf() + '</div></div><div class="st-tb"><div class="st-r st-h"><span>USD thousands</span><span class="st-sp">12 months</span><b>Nov</b><b>' + (cmp ? "Plan" : "Oct") + '</b><b>Change</b><span class="st-bar"></span><b class="st-pc">% of revenue</b></div>' + PL.map(function (r) { var ch = r[2] - r[ci], can = !!DR[r[0]], isO = open === r[0], d = DR[r[0]];
        return '<' + (can ? 'button type="button" data-o="' + r[0] + '" aria-expanded="' + isO + '"' : "div") + ' class="st-r' + (r[5] === 1 ? " st-t" : r[5] === 2 ? " st-f" : "") + '"><span>' + (can ? '<i class="st-car"></i>' : "") + r[1] + '</span><span class="st-sp">' + spark(r[6], r[5] === 2 ? "#fff" : "#2450DC") + "</span><b>" + f(r[2]) + "</b><b class=\"st-m\">" + f(r[ci]) + '</b><b class="' + (ch > 0 ? "st-up" : ch < 0 ? "st-dn" : "st-m") + '">' + (ch > 0 ? "+" : "") + (ch === 0 ? "0" : f(ch)) + '</b><span class="st-bar"><u class="' + (ch >= 0 ? "st-g" : "st-b") + '" style="width:' + Math.abs(ch) / mxc * 50 + "%;" + (ch >= 0 ? "left:50%" : "right:50%") + '"></u></span><b class="st-pc st-m">' + (Math.abs(r[2]) / 335 * 100).toFixed(1) + "%</b></" + (can ? "button" : "div") + ">" + (can && isO ? '<div class="st-dr"><div>' + d[0].map(function (a) { return '<div class="st-ac"><small>' + a[0] + "</small><span>" + a[1] + "</span><b>" + a[2] + '</b><b class="st-m">' + a[3] + '</b><b class="' + (a[2] - a[3] ? "st-dn" : "st-m") + '">' + (a[2] - a[3] > 0 ? "+" : "") + (a[2] - a[3]) + "</b></div>"; }).join("") + '</div><div class="st-why"><span class="m-lab">WHY IT MOVED</span><p>' + d[1] + "</p><small>" + CHECK + " " + d[2] + ". Each opens to the document behind it.</small></div></div>" : ""); }).join("") + "</div>";
    }
    function bs() {
      function col(t, rows) { return '<div class="st-tb"><div class="st-r st-h st-3"><span>' + t + "</span><b>Nov</b><b>Oct</b><b>Change</b></div>" + rows.map(function (r) { if (r.length === 1) return '<div class="st-r st-3 st-sec"><span>' + r[0] + "</span></div>"; var ch = r[1] - r[2]; return '<div class="st-r st-3' + (r[3] === 1 ? " st-t" : r[3] === 2 ? " st-f" : "") + '"><span>' + r[0] + "</span><b>" + f(r[1]) + '</b><b class="st-m">' + f(r[2]) + '</b><b class="st-m">' + (ch > 0 ? "+" : "") + (ch === 0 ? "0" : f(ch)) + "</b></div>"; }).join("") + "</div>"; }
      var A = [["Cash", 3060, "#2450DC"], ["Owed by customers", 412, "#5B8CFF"], ["Prepaid", 86, "#B9C3D3"], ["Equipment", 74, "#8A94A6"]], Fd = [["Owed to suppliers and staff", 319, "#B9C3D3"], ["Deferred revenue", 540, "#FFD15C"], ["Equity", 2773, "#0B1B3A"]];
      function bar(t, d) { return '<div class="st-bb"><small>' + t + '</small><div>' + d.map(function (x) { return '<i style="flex:' + x[1] + ";background:" + x[2] + '" title="' + x[0] + " " + f(x[1]) + '"></i>'; }).join("") + '</div><p>' + d.map(function (x) { return '<span><i style="background:' + x[2] + '"></i>' + x[0] + " <b>" + f(x[1]) + "</b></span>"; }).join("") + "</p></div>"; }
      return kpi([["CASH", "$3.06M", "84% of everything owned", ""], ["WORKING CAPITAL", "$2.70M", "current assets less liabilities", ""], ["CURRENT RATIO", "4.1x", "$4.10 for every $1 due", "st-up"], ["DEFERRED REVENUE", "$540k", "paid for, still to deliver", ""]]) + '<div class="st-bars">' + bar("WHAT THE COMPANY OWNS, 3,632", A) + bar("HOW IT IS FUNDED, 3,632", Fd) + '</div><div class="st-cols">' + col("Assets, USD thousands", [["Current assets"], ["Cash and equivalents", 3060, 3275], ["Accounts receivable", 412, 398], ["Prepaid expenses", 86, 92], ["Total current assets", 3558, 3765, 1], ["Long-term assets"], ["Fixed assets, net", 74, 78], ["Total assets", 3632, 3843, 2]]) + col("Liabilities and equity", [["Liabilities"], ["Accounts payable", 142, 150], ["Card payable", 56, 49], ["Payroll liabilities", 48, 46], ["Accrued expenses", 73, 88], ["Deferred revenue", 540, 540], ["Total liabilities", 859, 873, 1], ["Equity"], ["Paid-in capital", 9800, 9782], ["Accumulated deficit", -7027, -6812], ["Total equity", 2773, 2970, 1], ["Total liabilities and equity", 3632, 3843, 2]]) + '</div><div class="st-ok">' + CHECK + " <b>In balance.</b> Assets of 3,632 equal liabilities of 859 plus equity of 2,773. Paid-in capital rose 18 for share-based pay, taken from the option register.</div>";
    }
    function cf() {
      var S = [["Opening cash", 3275, 1], ["Net loss", -215, 0], ["Non-cash costs", 22, 0], ["Working capital", -22, 0], ["Investing", 0, 0], ["Financing", 0, 0], ["Closing cash", 3060, 1]], Wd = 660, H = 220, T = 24, B = 26, mn = 2950, mx = 3300, bw = Wd / S.length, run = 0, o = "";
      function Y(v) { return T + (mx - v) / (mx - mn) * (H - T - B); }
      S.forEach(function (s, i) { var a, b; if (s[2]) { a = mn; b = s[1]; run = s[1]; } else { a = run; b = run + s[1]; run = b; } var y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b)), x = i * bw + 10, w = bw - 20; o += '<rect x="' + x + '" y="' + y1.toFixed(1) + '" width="' + w + '" height="' + Math.max(2, y2 - y1).toFixed(1) + '" fill="' + (s[2] ? "#0B1B3A" : s[1] > 0 ? "#2450DC" : s[1] < 0 ? "#FFD15C" : "#B9C3D3") + '"' + (s[1] < 0 && !s[2] ? ' stroke="#8A5A00"' : "") + '></rect><text x="' + (x + w / 2) + '" y="' + (y1 - 7).toFixed(1) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="#0B1B3A">' + (s[2] ? f(s[1]) : (s[1] > 0 ? "+" : "") + (s[1] === 0 ? "0" : f(s[1]))) + '</text><text x="' + (x + w / 2) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="11" fill="#4B5565">' + s[0] + "</text>"; if (i < S.length - 1) o += '<line x1="' + (x + w) + '" x2="' + (x + bw) + '" y1="' + Y(run) + '" y2="' + Y(run) + '" stroke="#0B1B3A" stroke-dasharray="2 3"></line>'; });
      var R = [["Cash from operations"], ["Net loss", -215], ["Depreciation", 4], ["Share-based pay", 18], ["Customers owing more", -14], ["Prepaid costs used up", 6], ["Suppliers and cards", -1], ["Payroll and accrued costs", -13], ["Deferred revenue", 0], ["Net cash from operations", -215, 1], ["Cash from investing"], ["Equipment bought", 0], ["Net cash from investing", 0, 1], ["Cash from financing"], ["Shares issued or loans", 0], ["Net cash from financing", 0, 1], ["Change in cash", -215, 2]];
      return kpi([["CHANGE IN CASH", "($215k)", "3,275 to 3,060", "st-dn"], ["FROM OPERATIONS", "($215k)", "the whole movement", ""], ["INVESTED AND RAISED", "$0", "nothing bought, nothing raised", ""], ["RUNWAY", "20 months", "to July 2028, base plan", ""]]) + '<div class="st-two st-cf"><div class="st-wf"><span class="m-lab">WHERE THE CASH WENT IN NOVEMBER, USD THOUSANDS</span><svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="Cash fell from 3,275 to 3,060" style="width:100%;height:auto;display:block">' + o + '<line x1="0" x2="' + Wd + '" y1="' + Y(mn) + '" y2="' + Y(mn) + '" stroke="#0B1B3A"></line></svg><p class="st-ax">The scale starts at 2,950 so the movements are visible.</p><div class="st-why" style="border:0;padding:12px 0 0"><span class="m-lab">PROFIT AND CASH THIS MONTH</span><p>The loss was 215 and cash fell by 215. That is a coincidence: 22 of costs used no cash, and 22 of cash went into customers paying later and bills being settled.</p></div></div><div class="st-tb"><div class="st-r st-h st-2"><span>USD thousands</span><b>Nov</b></div>' + R.map(function (r) { if (r.length === 1) return '<div class="st-r st-2 st-sec"><span>' + r[0] + "</span></div>"; return '<div class="st-r st-2' + (r[2] === 1 ? " st-t" : r[2] === 2 ? " st-f" : "") + '"><span>' + r[0] + "</span><b>" + (r[1] === 0 ? "0" : f(r[1])) + "</b></div>"; }).join("") + '</div></div><div class="st-ok">' + CHECK + " <b>Ties out.</b> Opening cash of 3,275 less 215 is the 3,060 on the balance sheet and in the bank, reconciled to today.</div>";
    }
    function draw() {
      el.innerHTML = '<div class="st-top"><span><b>Sample Co., Inc.</b> November 2026</span><span class="st-tags"><i>Consolidated</i><i>USD</i><i>Accrual</i><i>US GAAP</i><i class="st-cl">Books current today</i></span></div><div class="st-tabs"><div>' + ["Income statement", "Balance sheet", "Cash flow"].map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + x + "</button>"; }).join("") + "</div>" + (tab === 0 ? '<div class="m-opts">' + ["Against October", "Against plan"].map(function (x, i) { return '<button type="button" data-c="' + i + '" aria-pressed="' + (i === cmp) + '">' + x + "</button>"; }).join("") + "</div>" : "") + '</div><div class="st-body">' + (tab === 0 ? pnl() : tab === 1 ? bs() : cf()) + '</div><div class="st-foot">' + (tab === 0 ? "Tap a line with an arrow to see the accounts and the reason behind it." : "Every figure opens to the entries behind it.") + " Sample data, illustrative interface.</div>";
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-c]", function (t) { cmp = +t.getAttribute("data-c"); draw(); }); on(el, "[data-o]", function (t) { var k = t.getAttribute("data-o"); open = open === k ? "" : k; draw(); }); draw();
  };
  /* ---------- books: groups and consolidation ---------- */
  W.group = function (el) {
    var E = [["Sample Co., Inc.", "United States", "USD", "Parent", "US GAAP"], ["Sample Co. UK Ltd", "United Kingdom", "GBP", "100% owned", "UK rules, FRS 102"], ["Sample Co. GmbH", "Germany", "EUR", "100% owned", "German rules, HGB"]];
    var WS = [["Revenue", 272, 52, 35, -24, 335, 0, "Fees the parent charges its subsidiaries are removed."], ["Costs", -440, -78, -56, 24, -550, 0, "The same fees, as the subsidiaries' cost."], ["Net income", -168, -26, -21, 0, -215, 1, ""], ["Cash", 2655, 240, 165, 0, 3060, 0, ""], ["Owed between group companies", 61, -38, -23, 0, 0, 0, "Nets to nothing once both sides agree."]];
    var IC = [["Management fee, November", "Inc. to UK Ltd", "&pound;11,024", "$14k", 1, "Invoice and bill created together, same day"], ["Management fee, November", "Inc. to GmbH", "&euro;9,174", "$10k", 0, "Inc. booked November 30, GmbH booked December 1"], ["Loan balance", "Inc. to UK Ltd", "&pound;29,921", "$38k", 1, "Both sides agree to the penny"], ["Loan balance", "Inc. to GmbH", "&euro;21,101", "$23k", 1, "Both sides agree to the penny"]];
    var tab = 0, fixed = false;
    function f(v) { var a = Math.abs(v).toLocaleString("en-US"); return v < 0 ? "(" + a + ")" : v === 0 ? "0" : a; }
    function draw() {
      var ok = IC.filter(function (x) { return x[4] || fixed; }).length, body;
      if (tab === 0) body = '<div class="gp-tb nosb"><div class="gp-r gp-h"><span>November, USD thousands</span><b>Inc.</b><b>UK Ltd</b><b>GmbH</b><b class="gp-el">Removed</b><b class="gp-co">Group</b></div>' + WS.map(function (r) { return '<div class="gp-r' + (r[6] ? " gp-t" : "") + '"><span>' + r[0] + (r[7] ? "<small>" + r[7] + "</small>" : "") + "</span><b>" + f(r[1]) + "</b><b>" + f(r[2]) + "</b><b>" + f(r[3]) + '</b><b class="gp-el">' + (r[4] ? f(r[4]) : "&ndash;") + '</b><b class="gp-co">' + f(r[5]) + "</b></div>"; }).join("") + '</div><div class="st-ok">' + CHECK + " <b>Group revenue of 335 and cash of 3,060</b> are the same figures as the statements at the top of this page. UK Ltd is translated from &pound;41k and GmbH from &euro;32k.</div>";
      if (tab === 1) body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">WHAT THE COMPANIES CHARGE AND OWE EACH OTHER</span>' + IC.map(function (x, i) { var g = x[4] || fixed; return '<div class="m-li" style="padding:11px 0"><span><b>' + x[0] + "</b><small>" + x[1] + " &middot; " + x[2] + " (" + x[3] + ") &middot; " + (i === 1 && fixed ? "Moved to November 30 in GmbH" : x[5]) + '</small></span><span class="m-chip ' + (g ? "m-blue" : "m-warn") + '">' + (g ? "AGREES" : "1 DAY APART") + "</span></div>"; }).join("") + '</div><div class="m-pane"><span class="m-lab">' + (fixed ? "ALL FOUR AGREE" : "ONE TO FIX") + "</span>" + (fixed ? '<div class="m-note">' + CHECK + " GmbH's bill now sits in November, so the fee is removed cleanly on consolidation. The change is logged in both companies.</div>" : '<p class="m-p" style="font-size:15.5px">GmbH recorded the fee a day after the parent, in a different month. Left alone, November group revenue would be overstated by $10k.</p><div class="m-acts"><button type="button" class="m-btn" data-a="fix">Approve the fix in GmbH</button></div>') + '<p class="m-foot" style="padding:0">When one group company invoices another, both sides are created together. Differences like this one only come from entries made by hand, and they are caught the day they happen.</p></div></div>';
      if (tab === 2) body = '<div class="m-two m-tw2"><div class="m-pane"><span class="m-lab">RATES USED FOR NOVEMBER</span><div class="f-row f-hd" style="grid-template-columns:minmax(0,1.4fr) 1fr 1fr"><span>To US dollars</span><b>Month average</b><b>Month end</b></div><div class="f-row" style="grid-template-columns:minmax(0,1.4fr) 1fr 1fr"><span>British pound</span><b>1.270</b><b>1.268</b></div><div class="f-row" style="grid-template-columns:minmax(0,1.4fr) 1fr 1fr"><span>Euro</span><b>1.090</b><b>1.092</b></div><p class="m-foot" style="padding:8px 0 0">Sample rates. In the product they come from a published source each day and are locked when the month is closed.</p></div><div class="m-pane"><span class="m-lab">HOW EACH NUMBER IS TRANSLATED</span>' + [["Income and costs", "At the month's average rate"], ["Assets and liabilities", "At the month-end rate"], ["Share capital", "At the rate on the day it was paid in"], ["The difference", "Shown in equity, not in profit"]].map(function (r) { return '<div class="m-fl"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>"; }).join("") + '<div class="m-note">' + CHECK + " Bills and invoices in a foreign currency are revalued at month end, and the gain or loss is prepared for you to approve.</div></div></div>";
      el.innerHTML = '<div class="gp-ents">' + E.map(function (e, i) { return '<div class="' + (i ? "" : "gp-par") + '"><small>' + e[3].toUpperCase() + "</small><b>" + e[0] + "</b><span>" + e[1] + " &middot; books in " + e[2] + "</span><em>" + e[4] + "</em></div>"; }).join("") + '<div class="gp-grp"><small>GROUP VIEW</small><b>Consolidated</b><span>3 companies &middot; reported in USD</span><em>US GAAP or IFRS</em></div></div><div class="fx-kp" style="border-top:1px solid var(--ink)"><div><small>COMPANIES</small><b>3</b><span>3 countries, 3 currencies</span></div><div><small>GROUP NUMBERS</small><b>Live</b><span>as of today, not year end</span></div><div class="' + (ok === 4 ? "m-good" : "m-bad") + '"><small>BETWEEN GROUP COMPANIES</small><b>' + ok + " of 4 agree</b><span>" + (ok === 4 ? "nothing to fix" : "one timing difference") + '</span></div><div><small>REMOVED ON CONSOLIDATION</small><b>$24k</b><span>fees charged inside the group</span></div></div><div class="a-views">' + ["Adding it up", "Between group companies", "Currencies"].map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + x + "</button>"; }).join("") + "</div>" + body;
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-a]", function () { fixed = true; draw(); }); draw();
  };

  /* ---------- books: approvals in batches, with the safeguards (v2) ---------- */
  W.bulk = function (el) {
    var step = 0, off = 0, X = [["Lattice Legal, new supplier", "$7,400.00", "First invoice from this supplier", 0], ["Orbit Cloud, hosting", "$16,012.40", "38% higher than the last three months", 0], ["Refund to Meridian Labs", "$2,300.00", "Agent is unsure which invoice this reverses", 0]];
    var G = [["Bank and card lines matched to a document", 148, "$61,240", "Amount, date and payee all match"], ["Bills from known suppliers, under $500", 41, "$12,870", "Spending policy, version 4"], ["Monthly schedule entries", 22, "$10,200", "Schedules you approved earlier"]];
    var SM = [["Figma", "$45.00", "6200 Development tools", "Card line and receipt"], ["Brightline Couriers", "$212.40", "5400 Delivery", "Bill, supplier since 2024"], ["Prepaid insurance, November", "$1,150.00", "6900 Insurance", "Schedule 4 of 12"], ["Linear", "$96.00", "6200 Development tools", "Card line and receipt"], ["Oakline Health, payment received", "$5,000.00", "1200 Receivables", "Bank line and invoice 1187"], ["Notion", "$160.00", "6200 Development tools", "Card line and receipt"], ["City Water", "$84.15", "6800 Rent and office", "Bill, supplier since 2023"], ["Depreciation, laptops", "$1,640.00", "6950 Depreciation", "Asset register"], ["Uber, 3 trips", "$71.80", "6450 Travel", "Card lines and receipts"], ["Staples", "$129.99", "6800 Rent and office", "Bill, supplier since 2025"]];
    function draw() {
      var left = X.filter(function (x) { return !x[3]; }).length, sm = SM.slice(off, off + 5);
      el.innerHTML = '<div class="fx-kp"><div><small>PREPARED TODAY</small><b>214</b><span>by agents, from documents</span></div><div class="m-good"><small>ROUTINE, MATCH YOUR RULES</small><b>' + (step === 2 ? "Posted" : "211") + "</b><span>$84,310 in total</span></div><div><small>LARGEST IN THE BATCH</small><b>$5,000</b><span>a customer payment, matched</span></div><div class=\"" + (left ? "m-bad" : "") + '"><small>KEPT OUT FOR A LOOK</small><b>' + left + '</b><span>never part of a batch</span></div></div><div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane"><span class="m-lab">THE BATCH, AND THE RULE BEHIND EACH PART</span>' + G.map(function (g) { return '<div class="m-li" style="padding:10px 0"><span><b>' + g[0] + "</b><small>" + g[3] + '</small></span><span style="text-align:right"><b>' + g[1] + "</b><small>" + g[2] + "</small></span></div>"; }).join("") +
        (step === 0 ? '<div class="m-acts"><button type="button" class="m-btn" data-a="s">Check 5 at random first</button></div>' : step === 1 ? '<span class="m-lab" style="margin-top:14px">5 PICKED AT RANDOM</span>' + sm.map(function (s) { return '<div class="bk-s"><span><b>' + s[0] + "</b><small>" + s[2] + " &middot; " + s[3] + "</small></span><b>" + s[1] + "</b></div>"; }).join("") + '<div class="m-acts"><button type="button" class="m-btn" data-a="all">Approve all 211</button><button type="button" class="m-btn m-ghost" data-a="more">Show 5 more</button></div>' : '<div class="m-note">' + CHECK + " 211 entries posted under your name at 09:14, each with the rule that put it in the batch. Any of them can be reversed until the month is closed.</div>") + '</div>' +
        '<div class="m-pane"><span class="m-lab">KEPT OUT OF THE BATCH</span>' + X.map(function (x, i) { return '<div class="m-li" style="padding:10px 0"><span><b>' + x[0] + "</b><small>" + x[2] + '</small></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><b>' + x[1] + "</b>" + (x[3] ? '<span class="m-chip m-blue">APPROVED</span>' : '<button type="button" class="m-btn m-sm" data-i="' + i + '">Open and approve</button>') + "</span></div>"; }).join("") + '<span class="m-lab" style="margin-top:14px">WHAT KEEPS THIS SAFE</span>' + ["Only entries that match a rule you wrote can be in a batch.", "Anything new, unusual or over a limit is always kept out.", "You check a random sample before approving, as an auditor would.", "Above $10,000 a second person approves, batch or not.", "The record shows who approved, when and under which rule."].map(function (t) { return '<div class="fc-ck">' + CHECK + "<span>" + t + "</span></div>"; }).join("") + "</div></div>";
    }
    on(el, "[data-a]", function (t) { var a = t.getAttribute("data-a"); if (a === "s") step = 1; if (a === "more") off = off ? 0 : 5; if (a === "all") step = 2; draw(); }); on(el, "[data-i]", function (t) { X[+t.getAttribute("data-i")][3] = 1; draw(); }); draw();
  };
  /* ---------- revenue forecast, from the goal backwards (v2) ---------- */
  W.method = function (el) {
    var P = { goal: 6000, nrr: 104, att: 75 }, NOW = 4020, PIPE = 190, DEAL = 52, WIN = 25, pick = -1;
    function k(v) { return Math.round(v).toLocaleString("en-US"); } function M(v) { return "$" + (v / 1000).toFixed(2) + "M"; }
    function tag(l) { return '<em class="gl-v gl-' + l + '">' + ["REALISTIC", "A STRETCH", "UNLIKELY"][l] + "</em>"; }
    el.classList.add("gl-w");
    function draw(keep) {
      var kept = NOW * P.nrr / 100, find = Math.max(0, P.goal - kept - PIPE), perRep = 40 * P.att / 100, team = 3 * perRep * 9, gap = Math.max(0, find - team), hireCap = perRep * 9;
      var deals = Math.ceil(find / DEAL), opps = Math.ceil(deals / (WIN / 100)), pipe = opps * DEAL, hires = Math.ceil(gap / hireCap);
      var attN = Math.ceil(P.att * (team + gap) / team), nrrN = Math.ceil((P.goal - PIPE - team) / NOW * 1000) / 10;
      var h2 = Math.ceil(gap * 0.5 / hireCap), rest = Math.max(0, gap - h2 * hireCap), rPts = Math.ceil(rest / 2 / (NOW / 100) * 10) / 10, aPts = Math.ceil(rest / 2 / ((team + h2 * hireCap) / P.att));
      var W_ = [["Hire", hires + (hires === 1 ? " more rep" : " more reps") + ", starting in January", "Each takes three months to reach full quota. About $" + k(hires * 17 * 11) + "k in pay over the year, before what they sell.", hires <= 2 ? 0 : hires <= 4 ? 1 : 2, hires + " roles opened in the headcount plan for January"], ["Sell more per rep", "The team hits " + attN + "% of quota", "Against " + P.att + "% assumed and 72% over your last four quarters. No new cost.", attN <= 85 ? 0 : attN <= 100 ? 1 : 2, "Quota assumption changed to " + attN + "% in the plan"], ["Keep and grow customers", "Net retention of " + nrrN.toFixed(1) + "%", "Against " + P.nrr + "% assumed and 104% over your last 12 months.", nrrN <= 107 ? 0 : nrrN <= 112 ? 1 : 2, "Retention target of " + nrrN.toFixed(1) + "% set for customer success"], ["A mix of all three", h2 + (h2 === 1 ? " hire" : " hires") + ", retention " + (P.nrr + rPts).toFixed(1) + "%, quota at " + (P.att + aPts) + "%", "Half the gap from hiring, the rest split between keeping customers and selling more. About $" + k(h2 * 17 * 11) + "k in pay.", (h2 <= 2 && rPts <= 3 && aPts <= 10) ? 0 : (h2 <= 4 && rPts <= 8 && aPts <= 25) ? 1 : 2, h2 + " roles opened, retention and quota targets updated"]];
      var Wd = 660, H = 172, L = 46, R = 104, T = 16, B = 26, mx = Math.max(P.goal, 5400) * 1.05, mn = 3500, cur = [], gl = [];
      for (var m = 0; m <= 12; m++) { cur.push(NOW + (kept - NOW) * m / 12 + PIPE * Math.min(m / 5, 1) + 3 * perRep * Math.max(0, m - 3)); gl.push(NOW + (P.goal - NOW) * m / 12); }
      function X(m) { return L + m / 12 * (Wd - L - R); } function Y(v) { return T + (mx - v) / (mx - mn) * (H - T - B); }
      var grid = ""; for (var v = 4000; v <= mx; v += 1000) grid += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#E3E7EE"></line><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="#4B5565">$' + v / 1000 + "M</text>";
      var pc = cur.map(function (v, m) { return X(m).toFixed(1) + "," + Y(v).toFixed(1); }), pg = gl.map(function (v, m) { return X(m).toFixed(1) + "," + Y(v).toFixed(1); }), end = cur[12], short = P.goal - end;
      var svg = '<svg viewBox="0 0 ' + Wd + " " + H + '" role="img" aria-label="The path the goal needs against the path you are on" style="width:100%;height:auto;display:block;margin-top:8px">' + grid + (short > 0 ? '<polygon fill="#FFD15C" opacity=".35" points="' + pg.join(" ") + " " + pc.slice().reverse().join(" ") + '"></polygon>' : "") + '<polyline fill="none" stroke="#0B1B3A" stroke-width="3" points="' + pc.join(" ") + '"></polyline><polyline fill="none" stroke="#8A5A00" stroke-width="2.5" stroke-dasharray="6 5" points="' + pg.join(" ") + '"></polyline><text x="' + (X(12) + 8) + '" y="' + (Y(P.goal) + 4) + '" font-size="11.5" font-weight="800" fill="#8A5A00">Goal ' + (P.goal / 1000).toFixed(1) + '</text><text x="' + (X(12) + 8) + '" y="' + (Y(end) + (Math.abs(Y(end) - Y(P.goal)) < 14 ? 16 : 4)) + '" font-size="11.5" font-weight="800" fill="#0B1B3A">On track ' + (end / 1000).toFixed(1) + "</text>" + ["Nov", "Feb", "May", "Aug", "Nov"].map(function (t, i) { return '<text x="' + X(i * 3) + '" y="' + (H - 7) + '" text-anchor="' + (i === 0 ? "start" : i === 4 ? "end" : "middle") + '" font-size="11" fill="#4B5565">' + t + "</text>"; }).join("") + "</svg>";
      function sl(lab, key, mn_, mx_, st, val, bench) { return '<div class="gl-sl"><span>' + lab + (bench ? "<small>" + bench + "</small>" : "") + "</span><b>" + val + '</b></div><input type="range" min="' + mn_ + '" max="' + mx_ + '" step="' + st + '" value="' + P[key] + '" aria-label="' + lab + '" data-r="' + key + '">'; }
      var CAS = [["The goal, in 12 months", P.goal, 1, ""], ["Today's customers, at " + P.nrr + "% net retention", -kept, 0, "from 41 signed contracts"], ["Open deals, at stage odds", -PIPE, 0, "from the pipeline"], ["New business to find", find, 2, ""], ["Your 3 reps at today's pace", -team, 0, "$40k quota each at " + P.att + "%, counted from March"], ["Still not covered", gap, 3, gap > 0 ? "the same gap the build-up shows" : "the team you have can carry it"]];
      el.innerHTML = '<div class="fx-kp"><div class="m-good"><small>THE GOAL</small><b>' + M(P.goal) + "</b><span>+" + Math.round((P.goal / NOW - 1) * 100) + '% on today</span></div><div><small>NEW BUSINESS TO FIND</small><b>$' + k(find) + "k</b><span>after customers and open deals</span></div><div><small>DEALS TO WIN</small><b>" + deals + "</b><span>" + (deals / 12).toFixed(1) + ' a month, last year 1.9</span></div><div class="' + (gap > 0 ? "m-bad" : "m-good") + '"><small>NOT COVERED YET</small><b>' + (gap > 0 ? "$" + k(gap) + "k" : "Nothing") + "</b><span>" + (gap > 0 ? "four ways to close it below" : "the plan supports the goal") + "</span></div></div>" +
        '<div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane m-form"><span class="m-lab">1. SET THE GOAL</span>' + sl("Recurring revenue in 12 months", "goal", 4500, 9000, 100, M(P.goal), "Today: $4.02M. The board plan says $6.0M.") + '<span class="m-lab" style="margin-top:6px">2. WHAT YOU ARE WILLING TO ASSUME</span>' + sl("Net retention", "nrr", 90, 120, 1, P.nrr + "%", "Your last 12 months: 104%") + sl("Share of quota the team hits", "att", 40, 120, 5, P.att + "%", "Your last four quarters: 72%") +
        '<span class="m-lab" style="margin-top:8px">THE PATH IT NEEDS, AGAINST THE PATH YOU ARE ON</span>' + svg + '<div class="m-legend" style="font-size:12.5px"><span><i style="background:#0B1B3A"></i>On track</span><span><i style="background:#fff;border-color:#8A5A00;border-style:dashed"></i>Needed for the goal</span><span><i style="background:#FFD15C;border-color:#FFD15C;opacity:.6"></i>The gap</span></div></div>' +
        '<div class="m-pane"><span class="m-lab">WORKING BACKWARDS FROM THE GOAL, USD THOUSANDS</span><div class="gl-cas">' + CAS.map(function (c) { return '<div class="gl-r gl-t' + c[2] + '"><span>' + c[0] + (c[3] ? "<small>" + c[3] + "</small>" : "") + "</span><b>" + (c[1] < 0 ? "&minus;" : c[2] >= 2 ? "= " : "") + k(Math.abs(c[1])) + "</b></div>"; }).join("") + '</div><span class="m-lab" style="margin-top:12px">WHAT FINDING $' + k(find) + 'k OF NEW BUSINESS REQUIRES</span><div class="gl-req"><div><b>' + deals + "</b><span>deals to win<small>at $" + DEAL + "k each</small></span></div><div><b>" + opps + "</b><span>qualified opportunities<small>at a " + WIN + "% win rate</small></span></div><div><b>$" + (pipe / 1000).toFixed(1) + "M</b><span>of pipeline to create<small>$348k open today</small></span></div><div><b>" + (3 + hires) + "</b><span>reps selling<small>you have 3" + (hires ? ", hire " + hires : "") + "</small></span></div></div></div></div>" +
        (gap > 0 ? '<div class="gl-ways"><span class="m-lab">FOUR WAYS TO CLOSE THE $' + k(gap) + "k GAP. PICK ONE TO PLAN ON.</span><div>" + W_.map(function (w, i) { return '<button type="button" data-w="' + i + '" aria-pressed="' + (i === pick) + '"><small>' + w[0].toUpperCase() + "</small><b>" + w[1] + "</b><span>" + w[2] + "</span>" + tag(w[3]) + "</button>"; }).join("") + "</div>" + (pick >= 0 ? '<div class="m-note">' + CHECK + " Planned on: " + W_[pick][4] + ". The cost and the cash effect now show in scenarios, and the board pack will report against it." + (W_[pick][3] === 2 ? " This path asks for more than your history supports, and the plan will say so." : "") + "</div>" : "") + "</div>" : '<div class="fx-gap"><b>The goal is covered on these assumptions.</b> Check them against your history before you plan on it. <span>Sample figures.</span></div>');
      [].forEach.call(el.querySelectorAll("input[data-r]"), function (r) { r.addEventListener("input", function () { P[r.getAttribute("data-r")] = +this.value; pick = -1; draw(r.getAttribute("data-r")); }); });
      if (keep) { var f = el.querySelector('[data-r="' + keep + '"]'); if (f) f.focus(); }
    }
    on(el, "[data-w]", function (t) { pick = +t.getAttribute("data-w"); draw(); }); draw();
  };
  /* ---------- books: controls (roles, period locks, the trail behind an entry) ---------- */
  W.controlx = function (el) {
    var tab = 0, role = 1, mon = 10, tried = 0, acct = 0;
    var RO = [["Founder", "2 people", "Sees everything and approves spending. Does not touch the entries."], ["Finance lead", "1 person", "Runs the books day to day and closes the month."], ["Fractional CFO", "1 person", "Reviews, posts adjustments and locks the month. Cannot pay anyone."], ["Outside accountant", "2 people", "Prepares and posts entries for review. Cannot approve or pay."], ["Auditor", "1 person, until March 31", "Reads everything and changes nothing. Access ends on a set date."], ["Agents", "Software", "Prepare everything. Post only what your policy lets them post alone."]];
    var AC = [["See everything", [1, 1, 1, 1, 1, 1]], ["Prepare entries", [0, 1, 1, 1, 0, 1]], ["Approve bills", [1, 1, 1, 0, 0, 0]], ["Post entries", [0, 1, 1, 1, 0, "P"]], ["Pay suppliers", [1, 1, 0, 0, 0, 0]], ["Lock a month", [0, 1, 1, 0, 0, 0]], ["Reopen a locked month", [2, 2, 0, 0, 0, 0]], ["Change a policy", [1, 1, 0, 0, 0, 0]]];
    var MO = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"], DAYS = [9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 0], ENT = [1180, 1210, 1175, 1260, 1290, 1320, 1305, 1380, 1410, 1445, 1490, 1120];
    var AK = [["5100", "Hosting"], ["6200", "Software"], ["6300", "Office"]];
    function cell(v) { return v === 1 ? '<i class="ct-y">&#10003;</i>' : v === 2 ? '<i class="ct-2">2 people</i>' : v === "P" ? '<i class="ct-p">Within policy</i>' : '<i class="ct-n">&ndash;</i>'; }
    function draw() {
      var body;
      if (tab === 0) body = '<div class="ct-mx nosb"><div class="ct-r ct-h"><span>Who can do what</span>' + RO.map(function (r, i) { return '<button type="button" data-ro="' + i + '" aria-pressed="' + (i === role) + '">' + r[0] + "</button>"; }).join("") + "</div>" + AC.map(function (a) { return '<div class="ct-r"><span>' + a[0] + "</span>" + a[1].map(function (v, i) { return '<b class="' + (i === role ? "ct-on" : "") + '">' + cell(v) + "</b>"; }).join("") + "</div>"; }).join("") + '</div><div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane"><span class="m-lab">' + RO[role][0].toUpperCase() + " &middot; " + RO[role][1].toUpperCase() + '</span><p class="m-p" style="font-size:17px;margin-top:8px">' + RO[role][2] + '</p><p class="m-foot" style="padding:0">Roles are yours to change. Every change to a role is itself logged.</p></div><div class="m-pane"><span class="m-lab">CHECKS THAT ALWAYS HOLD</span>' + ["Nobody approves a payment to a supplier they added.", "Nobody approves their own expense.", "Agents cannot change their own limits.", "Reopening a closed month takes two people and a written reason.", "Outside users get an end date, and access stops on it."].map(function (t) { return '<div class="fc-ck">' + CHECK + "<span>" + t + "</span></div>"; }).join("") + "</div></div>";
      if (tab === 1) { var lk = mon < 11, mx = 9; body = '<div class="ct-mo">' + MO.map(function (m, i) { return '<button type="button" data-mo="' + i + '" aria-pressed="' + (i === mon) + '" class="' + (i < 11 ? "ct-lk" : "ct-op") + '"><b>' + m + "</b><small>" + (i < 11 ? "Locked" : "Open") + '</small><i style="height:' + (i < 11 ? DAYS[i] / mx * 34 + 4 : 0) + 'px"></i><em>' + (i < 11 ? DAYS[i] + "d" : "") + '</em></button>'; }).join("") + '</div><p class="ct-cap">The bar under each month is how many working days it took to close. Sample figures.</p><div class="m-two m-tw2" style="border-top:1px solid var(--ink)"><div class="m-pane"><span class="m-lab">' + MO[mon].toUpperCase() + (mon === 0 ? " 2025" : " 2026") + '</span><div class="m-fl"><span>Status</span><b>' + (lk ? "Locked" : "Open, books current today") + '</b></div><div class="m-fl"><span>' + (lk ? "Closed in" : "Expected to close") + "</span><b>" + (lk ? DAYS[mon] + " working days" : "December 3") + '</b></div><div class="m-fl"><span>Entries</span><b>' + ENT[mon].toLocaleString("en-US") + (lk ? "" : " so far") + '</b></div><div class="m-fl"><span>' + (lk ? "Locked by" : "Closing checklist") + "</span><b>" + (lk ? "Finance lead" : "14 of 22 steps done") + "</b></div></div><div class=\"m-pane\"><span class=\"m-lab\">" + (lk ? "WHAT A LOCK MEANS" : "WHILE THE MONTH IS OPEN") + "</span>" + (lk ? (tried === 1 ? '<div class="m-note" style="background:#FFF3D1;border-color:#8A5A00">Blocked. ' + MO[mon] + " is locked, so nothing can be posted into it, by a person or an agent. The correction was drafted in November instead, with a note pointing back to " + MO[mon] + ".</div>" : tried === 2 ? '<div class="m-note">' + CHECK + " Request sent. Reopening " + MO[mon] + " needs the founder and the finance lead to agree, and a written reason. Both the request and the answer are logged.</div>" : '<p class="m-p" style="font-size:15.5px">The numbers for ' + MO[mon] + " are final. Statements, board packs and tax figures that used them cannot drift afterwards.</p>") + '<div class="m-acts"><button type="button" class="m-btn" data-a="post">Try to post into ' + MO[mon] + '</button><button type="button" class="m-btn m-ghost" data-a="open">Ask to reopen it</button></div>' : '<p class="m-p" style="font-size:15.5px">Agents post as transactions arrive, inside your policy. At month end the checklist runs, you review what is left and lock the month.</p>') + "</div></div>"; }
      if (tab === 2) { var moved = acct > 0, T = [["09:14", "Agent", "Read invoice 2291 from Orbit Cloud", "Supplier, date, amount and tax read from the PDF."], ["09:14", "Agent", "Matched it to a card payment", "Card ending 4417, same amount, one day apart."], ["09:14", "Agent", "Coded it to 5100 Hosting", "The last 14 bills from Orbit Cloud went to 5100, and the invoice lists compute and storage."], ["09:14", "Policy", "Held it for a person", "Above the $500 that agents may post alone."], ["09:31", "Finance lead", "Approved", "On a phone, with the invoice open."], ["09:31", "System", "Posted to November", "Debit 5100 Hosting 4,812.40. Credit 2100 Card payable 4,812.40."]].concat(moved ? [["Now", "You", "Moved it to " + AK[acct][0] + " " + AK[acct][1], "The original entry stays. A reversing pair is posted and linked to it. The agent will ask before assuming 5100 next time."]] : []);
        body = '<div class="m-two m-tw2"><div class="m-pane"><div class="m-doch"><b>JE-1182 &middot; Orbit Cloud</b><span>$4,812.40</span></div><div class="m-fl"><span>Account</span><b>' + AK[acct][0] + " " + AK[acct][1] + '</b></div><div class="m-fl"><span>Document</span><b>Invoice 2291, PDF</b></div><div class="m-fl"><span>Paid by</span><b>Card ending 4417</b></div><div class="m-fl"><span>Approved by</span><b>Finance lead, 09:31</b></div><div class="ct-why"><span class="m-lab">WHY WAS IT CODED THIS WAY?</span><p>The last 14 bills from Orbit Cloud went to 5100 Hosting, and this invoice lists compute and storage. Confidence was high, so it was proposed without a question.</p></div><span class="m-lab" style="margin-top:14px">DISAGREE? MOVE IT YOURSELF</span><div class="m-opts" style="justify-content:flex-start;flex-wrap:wrap">' + AK.map(function (a, i) { return '<button type="button" data-ak="' + i + '" aria-pressed="' + (i === acct) + '">' + a[0] + " " + a[1] + "</button>"; }).join("") + '</div></div><div class="m-pane"><span class="m-lab">EVERYTHING THAT HAPPENED TO THIS ENTRY</span><ol class="ct-tl">' + T.map(function (t, i) { return '<li class="' + (t[1] === "Agent" ? "ct-ag" : t[1] === "You" ? "ct-you" : "") + (moved && i === T.length - 1 ? " ct-new" : "") + '"><small>' + t[0] + "</small><span><em>" + t[1] + "</em><b>" + t[2] + "</b><i>" + t[3] + "</i></span></li>"; }).join("") + '</ol><p class="m-foot" style="padding:0">Nothing in the trail can be edited or deleted, by anyone. It exports as it stands for your auditor.</p></div></div>'; }
      el.innerHTML = '<div class="a-views">' + ["Who can do what", "Locked months", "The trail behind an entry"].map(function (x, i) { return '<button type="button" data-t="' + i + '" aria-pressed="' + (i === tab) + '">' + x + "</button>"; }).join("") + "</div>" + body;
    }
    on(el, "[data-t]", function (t) { tab = +t.getAttribute("data-t"); draw(); }); on(el, "[data-ro]", function (t) { role = +t.getAttribute("data-ro"); draw(); }); on(el, "[data-mo]", function (t) { mon = +t.getAttribute("data-mo"); tried = 0; draw(); }); on(el, "[data-ak]", function (t) { acct = +t.getAttribute("data-ak"); draw(); });
    on(el, "[data-a]", function (t) { tried = t.getAttribute("data-a") === "post" ? 1 : 2; draw(); }); draw();
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
    ["Deel", "Payroll", "Contractors and international payroll."], ["Remote", "Payroll", "International employment and payroll."], ["Snowflake", "Context", "Usage and product data for usage-based billing."], ["Square", "Commerce", "Till sales, tips and payouts."], ["Toast", "Commerce", "Restaurant sales, tips and payouts."], ["eBay and Etsy", "Commerce", "Marketplace orders, fees and payouts."],
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
    var here = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    if (hash && file.replace(/\.html$/, "") === here && document.getElementById(hash)) { document.getElementById(hash).scrollIntoView(); if (push) { try { if (window.top === window) history.pushState({}, "", "#" + hash); } catch (e) {} } return Promise.resolve(); }
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
    var m = /^(\.\/|revenue|books|plan|company|integrations|about)(#[\w-]+)?$/.exec(href);
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
