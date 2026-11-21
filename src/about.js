// About page sections. Static HTML so it is prerendered; one small widget (seats).
module.exports = function (subhero, C) {
  const sec = (id, bg, ey, h2, lead, inner) => `<section id="${id}" class="ab-sec" style="background: ${bg}">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey">${ey}</p><h2 class="h2">${h2}</h2>${lead ? `<p class="lead">${lead}</p>` : ""}</div>
${inner}
</div>
</section>`;

  const line = `<div class="ab-line r4" role="img" aria-label="The past and the future on one ledger">
<div class="ab-half"><span class="ab-k">THE PAST <i>required</i></span><div class="ab-chips"><span>Bank</span><span>Bills</span><span>Invoices</span><span>Payroll</span><span>Month-end close</span><span>Statements</span></div></div>
<div class="ab-now"><b>TODAY</b></div>
<div class="ab-half ab-fut"><span class="ab-k">THE FUTURE <i>where decisions are made</i></span><div class="ab-chips"><span>Forecast</span><span>Hiring</span><span>Runway</span><span>Scenarios</span><span>Board pack</span><span>Fundraising</span></div></div>
<div class="ab-led"><span>ONE LEDGER UNDERNEATH BOTH</span></div>
</div>`;
  const top = subhero("About", "Finance has two halves.", "They have never shared a ledger.", "Accounting records what happened. Planning decides what happens next. Countahead is being built so both read the same numbers.", line);

  const chain = (items) => items.map((x, i) => `<span class="ab-box">${x}</span>${i < items.length - 1 ? '<span class="ab-gap"><i>copy</i></span>' : ""}`).join("");
  const why = sec("why", "#FFFFFF", "Why it exists", "The books are mandatory. " + C("The future is where the value is."), "", `<div class="ab-two rv">
<div class="ab-prose">
<p>Every company has to keep books. The law asks for them, and so do investors and the bank. They are mostly a record of things that have already happened.</p>
<p>The questions that decide where a company ends up point the other way. Can we afford this hire? When does the cash run out? What happens if our biggest customer leaves?</p>
<p>Today those questions get answered in a spreadsheet. The spreadsheet is fed by an export from the accounting system, which is fed by the billing tool, which someone keeps in step with the customer list by hand. Every copy is a chance for the numbers to disagree.</p>
<p><b>Countahead puts the whole chain on one record,</b> so the plan is as current as the books and nobody has to copy anything.</p>
</div>
<div class="ab-diag">
<div class="ab-d1"><span class="m-lab">HOW IT USUALLY WORKS</span><div class="ab-chain">${chain(["Customer list", "Contracts", "Billing", "Accounting", "Spreadsheet plan"])}</div><p>Five tools, four hand-offs. The plan is the last to know.</p></div>
<div class="ab-d2"><span class="m-lab">HOW COUNTAHEAD WORKS</span><div class="ab-one"><span>Customers</span><span>Contracts</span><span>Billing</span><span>Books</span><span>Plan</span><b>One record</b></div><p>Entered once. Everything after it reads the same entry.</p></div>
</div>
</div>`);

  const now = [["01", "Software can now draft the bookkeeping", "Matching a bank line to an invoice, coding a bill, proposing an accrual: an agent can prepare this work and a person can check it. The human moves from typing to judging."], ["02", "A ledger is no longer a ten-year project", "A full double-entry system used to need a large team and many years. We think it can now be built far faster, which makes it realistic to start from the ledger and not sit on top of someone else's."], ["03", "One record makes the plan worth trusting", "When the forecast reads the ledger directly there is nothing to export and nothing to reconcile. Change a hire and the runway moves, on the real numbers."]];
  const whyNow = sec("why-now", "#F6F8FC", "Why now", "Three things changed " + C("at the same time."), "This is our view of the moment, and the reason the product is shaped the way it is.", `<div class="ab-grid3 rv">${now.map((n) => `<div class="ab-card"><span class="ab-n">${n[0]}</span><b>${n[1]}</b><p>${n[2]}</p></div>`).join("")}</div>`);

  const pr = [["Accounting first", "If the books are not solid, nothing built on them is worth reading. The ledger is real double entry, with period locks and a full audit trail.", "books.html", "See the books"], ["You set the rules, agents work inside them", "You decide what an agent may do alone and what waits for a person. One approval can cover many routine entries, and the exceptions are pulled out for you.", "books.html#policies", "See the policies"], ["Every number shows its working", "Any figure in a statement, a forecast or an answer can be traced back to the entries and documents behind it.", "books.html#audit", "See audit readiness"], ["One record, entered once", "A customer, a contract or a hire is captured once. Invoices, revenue, the forecast and the board pack all read it.", "index.html#cycle", "See the full cycle"], ["Many countries from the start", "Several entities and several currencies are part of the design from day one, with the United States as the first market.", "books.html#accounting", "See entities"], ["Honest about limits", "Countahead does not replace your accountant or tax adviser for filings. It prepares the work and the evidence so their time goes further.", "books.html#tax", "See how tax is handled"]];
  const principles = `<section id="principles" class="ab-sec ab-dark">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey" style="color: #FFFFFF">How we build</p><h2 class="h2" style="color: #FFFFFF">Six rules the product <span style="color: var(--pop)">has to keep.</span></h2></div>
<div class="ab-rules rv">${pr.map((p, i) => `<div class="ab-rule"><span class="ab-n">0${i + 1}</span><b>${p[0]}</b><p>${p[1]}</p><a href="${p[2]}">${p[3]} <span aria-hidden="true">&rarr;</span></a></div>`).join("")}</div>
</div>
</section>`;

  const founder = sec("founder", "#FFFFFF", "Who is building it", "Built by a CFO " + C("who has done this job."), "", `<div class="ab-fd rv">
<div class="ab-bio">
<div class="ab-id"><span aria-hidden="true">FT</span><div><b>Felipe Tunnell</b><small>Founder, Countahead</small></div></div>
<p>Felipe is a former Bank of America investment banker who became a venture capital investor, a CFO, and a founder. He has led finance for companies in the United States and Europe, from first hire to exit, on the tools Countahead replaces.</p>
<div class="ab-path"><span>Bank of America, investment banking</span><span>Venture capital</span><span>CFO</span><span>Fractional CFO</span><span>Founder</span></div>
<div class="ab-links"><a href="https://felipetunnell.com" target="_blank" rel="noopener">felipetunnell.com <span aria-hidden="true">&nearr;</span></a><a href="https://ftventures.io" target="_blank" rel="noopener">ftventures.io <span aria-hidden="true">&nearr;</span></a></div>
</div>
<div class="ab-nums">
<div><b>US</b><span>and Europe: he has led finance on both sides of the Atlantic</span></div>
<div><b>7</b><span>countries worked from, keeping books across entities and currencies</span></div>
<div><b>2</b><span>exits delivered from the finance seat, including Holded to Visma</span></div>
<div><b>40+</b><span>technology companies invested in since 2017</span></div>
</div>
</div>
<div class="ab-grid3 ab-why3 rv">
<div class="ab-card"><small>INSIDE ACCOUNTING SOFTWARE</small><b>He helped build one of these.</b><p>Felipe was VP Finance at Holded, the Barcelona company whose accounting and business software is used by small companies across Spain. He was there through its growth and its exit to Visma in 2021, so he knows how these products are built, sold and used.</p></div>
<div class="ab-card"><small>FUNDRAISING AND EXITS</small><b>He has sat on both sides of the deal.</b><p>First as an investment banker at Bank of America and a venture investor, judging other companies' numbers, then as the finance lead raising the round and running the exit. That is why the model, the data room and the board pack are built in from the start.</p></div>
<div class="ab-card"><small>MANY SIZES, MANY SECTORS</small><b>From first hire to exit.</b><p>Software, AI, fintech, health, food and robotics, selling to businesses and to consumers. The basics carry over: cash, margin and getting paid. The details differ a lot, which is why each kind of business gets its own billing, dashboard and board pack.</p></div>
</div>`);

  const stages = [["01", "Design", "NOW", "Every demo on this site is a working design of the product, running on sample data."], ["02", "Build", "NEXT", "The ledger first, then revenue and planning on top of it."], ["03", "Early access", "THEN", "A small group of startups, in the United States first."], ["04", "Wider release", "LATER", "More countries, more kinds of business and a mobile app."]];
  const yes = ["The scope shown on this site is what is being built.", "Startups first, in any sector.", "United States first, designed for several entities and currencies.", "You decide what agents may do alone. Everything else waits for a person."];
  const no = [["Customers", "None yet, so no logos and no testimonials."], ["Certifications", "None yet. No badge appears here until it is earned."], ["Pricing", "Not set."], ["Integrations", "Planned. None is live."], ["Figures on this site", "Samples, made up to show how the product works."]];
  const status = sec("status", "#F6F8FC", "Where we are", "In development, " + C("and saying so."), "A finance product asks for a lot of trust. It starts with being plain about what exists today.", `<ol class="ab-stages rv">${stages.map((s, i) => `<li class="${i === 0 ? "ab-on" : ""}"><span class="ab-n">${s[0]}</span><em>${s[2]}</em><b>${s[1]}</b><p>${s[3]}</p></li>`).join("")}</ol>
<div class="ab-truth rv">
<div><span class="m-lab">WHAT WE CAN SAY TODAY</span><ul>${yes.map((y) => `<li><i aria-hidden="true">&#10003;</i>${y}</li>`).join("")}</ul></div>
<div class="ab-not"><span class="m-lab">WHAT WE WILL NOT CLAIM YET</span><ul>${no.map((n) => `<li><b>${n[0]}</b><span>${n[1]}</span></li>`).join("")}</ul></div>
</div>`);

  const roles = [["Founders", "Tell us the question about your company you cannot answer today without waiting for someone.", "You get a say in what the daily view shows first."], ["Finance leads", "Show us the spreadsheet you rebuild every month, and the export it starts from.", "You get a say in the model, the close and the board pack."], ["Accountants and bookkeepers", "Tell us what it would take for you to trust an entry an agent prepared.", "You get a say in approvals, controls and the audit trail."]];
  const shape = sec("shape", "#FFFFFF", "Help shape it", "We are looking for people " + C("to build this with."), "Early access is small on purpose. We would rather get it right with a few companies than roughly right with many.", `<div class="ab-grid3 rv">${roles.map((r) => `<div class="ab-card ab-role"><b>${r[0]}</b><p>${r[1]}</p><small>${r[2]}</small></div>`).join("")}</div>
<div class="rv"><a href="#access" class="ab-cta">Ask for early access <span aria-hidden="true">&rarr;</span></a></div>`);

  const qa = [["Does Countahead replace my accountant?", "No. Agents prepare the bookkeeping inside rules you set, and you or your accountant approve the rest. Filings and tax advice stay with a qualified accountant or tax adviser. Countahead gets the books and the evidence ready for them."], ["Who decides what goes into my books?", "You do. A policy you write sets what agents may post alone, for example small routine bills from a supplier you already know. Everything else waits for a person, routine entries can be approved together, and every action is logged."], ["Is it only for software companies?", "No. It is for startups first, in any sector: software, services, online stores and others. The analytics and board packs change with the kind of business."], ["Where will it be available?", "The United States first. Several entities and currencies are part of the design from the start, so companies that work across borders are in scope, and more countries follow."], ["Will it work with the tools I already use?", 'That is the plan. Banks, payment processors, payroll, online stores and the main sales tools are on the list. None is live yet. <a href="integrations.html">See the planned integrations</a>.'], ["Is it certified or independently audited?", "Not yet. We will not show a badge or name a standard until it has been earned."], ["What will it cost?", "Pricing is not set."], ["Can I use it today?", 'Not yet. Countahead is in development. <a href="#access">Leave your email</a> and we will write when early access opens.']];
  const faq = sec("questions", "#F6F8FC", "Questions", "Asked often, " + C("answered plainly."), "", `<div class="ab-faq rv">${qa.map((q, i) => `<details${i === 0 ? " open" : ""}><summary>${q[0]}<i aria-hidden="true"></i></summary><p>${q[1]}</p></details>`).join("")}</div>`);

  return [top, why, whyNow, principles, founder, status, shape, faq];
};
