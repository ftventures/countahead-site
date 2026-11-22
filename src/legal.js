// Privacy notice and terms. Plain pages, no demos.
module.exports = function (subhero) {
  const WHO = "Oasis Ventures FZE (license no. 10594, Umm Al Quwain Free Trade Zone Authority), Al Shmookh Business Center, One UAQ, UAQ Free Trade Zone, Umm Al Quwain, United Arab Emirates";
  const MAIL = '<a href="mailto:felipe@ftventures.io">felipe@ftventures.io</a>';
  const page = (blocks) => `<section style="padding: 64px 0 96px 0; border-bottom: 1px solid #D5DBE5"><div class="wrap"><div class="lg">${blocks.map(([h, ...ps]) => `<h2>${h}</h2>${ps.map((p) => (Array.isArray(p) ? "<ul>" + p.map((x) => "<li>" + x + "</li>").join("") + "</ul>" : "<p>" + p + "</p>")).join("")}`).join("")}</div></div></section>`;
  const privacy = [
    ["Who is responsible for your data", `Countahead is a trading name of ${WHO}. Oasis Ventures FZE decides how the personal data described here is used. For any privacy question or request, write to ${MAIL}.`],
    ["What we collect", "If you ask for early access, we collect your work email, the role you pick if you pick one, the page you signed up from and the time. We use this to send you one confirmation email, to write to you when early access opens and to understand who is interested. We do not sell it and we do not share it for advertising.", "We collect nothing else. There are no accounts on this site yet."],
    ["What stays on your device", "The demos on this site run in your browser on sample data. What you type into them, including questions in the ask box, is not sent to us.", "If you use the microphone in a demo, your browser's built-in speech recognition turns your speech into text. Depending on your browser, that may be processed by your browser's provider, for example Google or Apple. Countahead does not record, store or receive your audio or the text."],
    ["Who processes your data", ["Early access sign-ups are stored in a database run by Supabase, hosted in the European Union (Frankfurt).", "The confirmation email is sent through Resend, which processes your email address in the United States to deliver it. We do not track whether you open it.", "The site is hosted on GitHub Pages. Like any web host, GitHub receives your IP address when you load a page.", "Fonts are loaded from Google Fonts, so your browser contacts Google and shares your IP address with it."]],
    ["Cookies and tracking", "We do not use advertising or tracking cookies, and there is no analytics script on this site."],
    ["How long we keep it", "We keep your sign-up until you ask us to remove it, or until we stop offering early access."],
    ["Your choices", `You can ask for a copy of what we hold about you, ask us to correct it, or ask us to delete it, at any time and wherever you live. Write to ${MAIL} and we will do it.`],
    ["Changes", "If this notice changes, the date at the top changes with it."]
  ];
  const terms = [
    ["Who we are", `Countahead is a trading name of ${WHO}. In these terms, "Countahead", "we" and "us" mean Oasis Ventures FZE. You can reach us at ${MAIL}.`],
    ["What this site is", "This site is a preview of a product that is still being built. The screens are working designs that run on sample data. The companies, people and figures in them are made up to show how the product is meant to work.", "Nothing here is an offer to sell a product or a promise that a feature will ship. Scope, timing and pricing may change before early access opens."],
    ["Not professional advice", "Nothing on this site is accounting, tax, legal or investment advice. Countahead is not a substitute for a qualified accountant or tax adviser, and it does not prepare or file returns for you."],
    ["Other companies' names", "The integrations page lists tools we plan to connect to. None is live. Those names and marks belong to their owners, and listing them does not mean they endorse, sponsor or are affiliated with Countahead."],
    ["Early access", "Asking for early access puts you on a list. It does not commit you to anything, and it does not commit us to give you access."],
    ["Using the site", "You are welcome to read, link to and share this site. Please do not copy its designs or text for another product."],
    ["Our responsibility", "We work to keep this site accurate, but it is provided as it is, and it describes something unfinished. As far as the law allows, we are not responsible for decisions made by relying on it."],
    ["Governing law", "These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Umm Al Quwain. If you are a consumer, this does not take away any rights you have under the laws of the country where you live."],
    ["Changes", "We may update these terms. The date at the top shows the latest version."]
  ];
  return [
    ["privacy.html", "Privacy notice | Countahead", "What Countahead collects on this site, where it is kept and how to have it removed.", [subhero("Privacy", "Privacy notice", "", "Last updated November 22, 2026. Short version: we keep the email you give us for early access, and nothing else."), page(privacy)]],
    ["terms.html", "Terms of use | Countahead", "The terms for using the Countahead website while the product is in development.", [subhero("Terms", "Terms of use", "", "Last updated November 22, 2026. This site is a preview of a product in development."), page(terms)]]
  ];
};
