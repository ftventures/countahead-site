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
