// Pricing. Planned launch prices: one price by company size, everything included.
module.exports = function (subhero, mock, C, access) {
  const sec = (id, bg, ey, h2, lead, inner) => `<section id="${id}" class="ab-sec" style="background: ${bg}">
<div class="wrap" style="display: flex; flex-direction: column; gap: 32px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey">${ey}</p><h2 class="h2">${h2}</h2>${lead ? `<p class="lead">${lead}</p>` : ""}</div>
${inner}
</div>
</section>`;

  const top = subhero("Pricing", "One price, set by your size.", "Everything included.", "No plans to choose between and no seats to count. The books and the plan come together at every size. Pick a company like yours, or move the slider.", `<div class="r4" data-widget="pricefind"></div>`).replace("clamp(40px, 9.6vw, 96px)", "clamp(38px, 6.6vw, 68px)").replace("padding-top: 56px; padding-bottom: 80px; display: flex; flex-direction: column; gap: 40px", "padding-top: 40px; padding-bottom: 72px; display: flex; flex-direction: column; gap: 28px");

  const all = mock("included", "#FFFFFF", "What you get", "The same product " + C("at every size."), "Most software keeps the good parts for the expensive plan. We do not. Tap any size and see what changes.", "priceall");

  const compare = mock("compare", "#F6F8FC", "Compare", "What does your stack " + C("cost you today?"), "Finance work is usually spread over five or six tools, each with its own bill. Tick the ones you pay for, correct any price, and see your own number.", "pricestack");

  const path = mock("first-year", "#FFFFFF", "Your first year", "You pay nothing " + C("until it is proven."), "Moving your books to a new name is a risk. So the risk is ours. Step through what happens, and when the first bill arrives.", "pricepath");

  const terms = [["No setup fee", "Not for switching, not for onboarding, not ever."], ["No seats", "Invite the whole team, your board and your investors. The price does not move."], ["Your accountant is free", "Their seat costs nothing, and they get better tools than they have today."], ["No surprise bill for growing", "Your size is checked once a year, at renewal. Never in between."], ["Leave when you like", "On monthly there is no contract. Yearly is a one-year commitment. Either way, your books export in full at any time."], ["One discount, in plain sight", "Two months free if you pay yearly. No teaser price that jumps after six months."], ["Nothing to declare", "Revenue and spending are already in your books, so your size works itself out."]];
  const fair = sec("terms", "#F6F8FC", "The small print, in large print", "Seven terms " + C("you will not have to ask about."), "", `<div class="ab-grid3 ac-g3 rv">${terms.map((c) => `<div class="ab-card"><b>${c[0]}</b><p>${c[1]}</p></div>`).join("")}</div>`);

  const acct = `<section id="for-accountants" class="ab-sec ab-dark">
<div class="wrap" style="display: flex; flex-direction: column; gap: 28px">
<div class="rv" style="display: flex; flex-direction: column; gap: 14px; max-width: 900px"><p class="ey" style="color: #FFFFFF">For accountants and firms</p><h2 class="h2" style="color: #FFFFFF">Your seat is free. <span style="color: var(--pop)">Your client pays for theirs.</span></h2><p class="lead" style="color: #E1E7F2">You are invited by your client, as today, and work across all of them from one sign-in. Clients of a partner firm are planned to get 20% off, for as long as they stay. That holds whether they pay us directly or your firm pays for them and sets its own price.</p></div>
<div class="rv"><a href="accountants.html" class="ab-cta" style="background: #FFFFFF; color: #0B1B3A">See the accountants page <span aria-hidden="true">&rarr;</span></a></div>
</div>
</section>`;

  const qa = [
    ["size", "How do you measure my company's size?", "By the higher of your revenue or your spending over the last twelve months. Both figures are already in your books, so there is nothing to fill in or declare."],
    ["size", "Why not revenue alone?", "Because a funded startup with forty people and no revenue is not a small customer, and a shop with thin margins is not a big one. Taking the higher of the two is fair to both."],
    ["size", "What happens when we grow?", "Nothing, until your renewal. Your size is checked once a year. If you have moved into the next size, the price changes then, and you are told thirty days ahead."],
    ["size", "What if we shrink?", "Ask for an early recheck, once a year. If you have moved into a smaller size, the lower price applies from your next month on monthly, and from your renewal on yearly."],
    ["size", "We are above $50 million. What do we pay?", "We agree it with you. Everything is still included, and you get a named contact."],
    ["included", "Is anything held back for bigger companies?", "No. The books, the plan, revenue, contracts, the cap table and the data room are in every price. Three things change with size: how many companies in a group are included, how many AI credits come with your price, and the kind of support."],
    ["included", "Do you charge per user?", "No. Invite everyone who needs to see the numbers."],
    ["included", "What are AI credits?", "Everyday work by the agents is included and never uses credits, at the normal volume for a company your size: reading bills, matching your bank, proposing entries, chasing invoices. Bigger jobs that you ask for use AI credits: a written review of your plan, a full analysis of why a number moved, a long draft, or a large batch of documents read in one go. Your price includes 2, 5, 15, 40 or 80 credits a month as your size goes up."],
    ["included", "What if I need more credits?", "Add a pack whenever you like, with no change of plan. Extra credits are planned at $5 each. Credits from a pack carry over until you use them."],
    ["included", "Do my books stop if I run out of credits?", "No. Keeping your books never uses credits, and a job already running is never cut off. Credits only limit how many new big jobs you can start that month."],
    ["included", "We have more than one company. How does that work?", "Your size is measured across the whole group, and each company keeps its own books. Two companies are included at the two smallest sizes, then three, five and ten as the size goes up. Each extra company adds 20% of your monthly price. A company with no activity in the year is free."],
    ["practical", "Do I still need my accountant?", "Yes. Agents take the entry work. Review, judgment, tax filings and advice stay with a qualified person, and their seat here is free. The price on this page is for the software."],
    ["practical", "Do I have to drop my CRM or my signing tool?", "No. Deals and signing are built in, and many small companies will find them enough. If your sales team relies on a bigger CRM, keep it and connect it."],
    ["practical", "What does switching cost?", "Nothing. Your history comes across and each month is checked against your old books. You pay only after a month has closed here and agreed to the cent."],
    ["practical", "Can I buy it today?", "Not yet. Countahead is still being built. These are the prices we plan to launch with, and people on the early access list will hear first if anything changes."],
    ["size", "Is there a discount for paying yearly?", "Yes. Pay for the year and you pay for ten months, so two are free. It is the only discount we offer. There are no introductory prices that jump later."],
    ["size", "What if we pay yearly and then leave?", "Yearly is a commitment, and the two free months are what you get for making it. Unused months are not refunded. You keep full access until the end of the year you paid for, and your books export in full at any time. If you are not sure yet, start on monthly and switch to yearly later. <a href=\"refunds.html\">Billing and refunds</a>."]
  ];
  const chips = [["all", "All"], ["size", "Size and price"], ["included", "What is included"], ["practical", "Practical"]];
  const faq = sec("questions", "#FFFFFF", "Questions", "Asked before " + C("you have to."), "", `<div class="rv" data-widget="acctfaq"><div class="aq-chips" role="group" aria-label="Filter questions">${chips.map((c, i) => `<button type="button" data-f="${c[0]}" aria-pressed="${i === 0}">${c[1]}</button>`).join("")}</div><div class="ab-faq">${qa.map((q, i) => `<details data-cat="${q[0]}"${i === 0 ? " open" : ""}><summary>${q[1]}<i aria-hidden="true"></i></summary><p>${q[2]}</p></details>`).join("")}</div></div>
<div class="rv"><a href="#access" class="ab-cta">Ask for early access <span aria-hidden="true">&rarr;</span></a></div>`);

  return [["pricing.html", "Pricing: one price by company size | Countahead", "One price set by the size of your company, with the books, the plan, revenue and company records all included. Find your price and compare it with what your tools cost today.", [top, all, compare, path, fair, acct, faq, access]]];
};
