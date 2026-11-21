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
hasBar: pct != null, w: (pct == null ? 0 : Math.min(pct, 100)) + "%", pct: pct == null ? "" : pct.toFixed(1) + "% of revenue", bar: "var(--ink)", hasNote: !!note, note: note || "" };
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
  var W = {};

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
    el.innerHTML = '<div class="w-seg" role="group" aria-label="View"><button type="button" data-r="tb">The books</button><button type="button" data-r="tf">The future</button></div><div class="w-panel w-glass" data-r="books"><div class="w-ph"><span>THE BOOKS, TODAY</span><span data-r="s" aria-live="polite"></span></div><div class="w-prog"><i data-r="p"></i></div><div class="w-feed" data-r="f" style="min-height:335px"></div><div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.14)"><button type="button" class="w-ghost" data-r="re">Replay</button></div></div><div class="w-panel w-glass" data-r="future" style="display:none"></div>';
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
