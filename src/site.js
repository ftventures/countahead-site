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
        return { label: c, pressed: on ? "true" : "false", bg: on ? "#0B1B3A" : "#FFFFFF", fg: on ? "#FFFFFF" : "#0B1B3A", pick: function () { self.setState({ cat: c }); } };
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
      var ns = d.querySelector('script[src*="assets/app."]'), cs = document.querySelector('script[src*="assets/app."]'), nl = d.querySelector('link[href*="assets/site."]'), cl = document.querySelector('link[href*="assets/site."]');
      if ((ns && cs && ns.getAttribute("src") !== cs.getAttribute("src")) || (nl && cl && nl.getAttribute("href") !== cl.getAttribute("href"))) { location.href = url.replace(/^index\.html/, "./").replace(/\.html/, ""); return; }
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
    var mb = e.target.closest && e.target.closest(".mn-btn");
    if (mb) { var open = document.documentElement.classList.toggle("mn-open"); mb.setAttribute("aria-expanded", open); return; }
    if (e.target.closest && e.target.closest(".mn a")) { document.documentElement.classList.remove("mn-open"); var bb = document.querySelector(".mn-btn"); if (bb) bb.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") document.documentElement.classList.remove("mn-open"); });
  document.addEventListener("click", function (e) {
    if (app && app.__click) app.__click(e);
    var a = e.target; while (a && a.nodeName !== "A") a = a.parentNode;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var href = a.getAttribute("href") || "";
    var m = /^(\.\/|revenue|books|plan|company|integrations|about|software|online-stores|services|hospitality|other-industries|accountants|people|pricing|refunds|privacy|terms)(#[\w-]+)?$/.exec(href);
    if (m) href = (m[1] === "./" ? "index" : m[1]) + ".html" + (m[2] || "");
    if (/^[\w-]+\.html(#[\w-]+)?$/.test(href)) {
      e.preventDefault();
      go(href, true).catch(function () { try { location.href = href; } catch (x) {} });
    }
  });
  document.addEventListener("submit", function (e) { e.preventDefault(); });
  window.addEventListener("popstate", function () { var f = location.pathname.split("/").pop() || "index.html"; if (!/\.html$/.test(f)) f += ".html"; go(f + location.hash, false).catch(function () {}); });

  /* section row under the header: mark the section in view and slide a marker to it */
  var spyT = 0, spyLast = "";
  function spy() {
    spyT = 0;
    var nav = document.querySelector("header .subnav.onpage[aria-label='On this page']"); if (!nav || !nav.offsetParent) return;
    var links = [].slice.call(nav.querySelectorAll("a[href^='#']")), cur = null, line = 150;
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute("href").slice(1)); if (el && el.getBoundingClientRect().top <= line) cur = a; });
    var mk = { style: {} }, pr = document.querySelector("header .prog");
    if (pr && links.length) {
      var y = window.scrollY + line, tops = links.map(function (a) { var el = document.getElementById(a.getAttribute("href").slice(1)); return el ? el.getBoundingClientRect().top + window.scrollY : 1e9; }), rc = links.map(function (a) { return a.getBoundingClientRect(); }), ix = -1, x;
      tops.forEach(function (t, i) { if (t <= y) ix = i; });
      if (ix < 0) x = rc[0].left * Math.max(0, Math.min(1, window.scrollY / Math.max(1, tops[0] - line)));
      else { var nx = ix + 1 < tops.length ? tops[ix + 1] : document.documentElement.scrollHeight - window.innerHeight + line, f = Math.max(0, Math.min(1, (y - tops[ix]) / Math.max(1, nx - tops[ix]))), to = ix + 1 < rc.length ? rc[ix + 1].left : rc[ix].right; x = rc[ix].left + f * (to - rc[ix].left); }
      pr.style.animation = "none"; pr.style.display = "block"; pr.style.transformOrigin = "0 50%"; pr.style.transform = "scaleX(" + Math.max(0, Math.min(1, x / window.innerWidth)).toFixed(4) + ")";
    }
    var ci = links.indexOf(cur); links.forEach(function (a, i) { if (a === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); if (ci > -1 && i < ci) a.setAttribute("data-done", "1"); else a.removeAttribute("data-done"); });
    if (cur) { mk.style.width = cur.offsetWidth + "px"; mk.style.transform = "translateX(" + cur.offsetLeft + "px)"; mk.style.opacity = "1"; var id = cur.getAttribute("href"); if (id !== spyLast) { spyLast = id; var l = cur.offsetLeft - 24, r = cur.offsetLeft + cur.offsetWidth + 24; if (l < nav.scrollLeft) nav.scrollLeft = l; else if (r > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = r - nav.clientWidth; } }
    else { mk.style.opacity = "0"; spyLast = ""; }
  }
  function spyQ() { if (!spyT) spyT = requestAnimationFrame(spy); }
  if (!window.__PRERENDER) { window.addEventListener("scroll", spyQ, { passive: true }); window.addEventListener("resize", spyQ); setTimeout(spyQ, 600); document.addEventListener("click", function () { setTimeout(spyQ, 500); }); }

  boot();
})();
