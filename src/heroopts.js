// Builds hero-options.html: the home hero in three versions, for review. Not linked from the site.
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
module.exports = function () {
  let s = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const tx = (s) => {
  const i = s.indexOf('data-widget="hero"'), a = s.lastIndexOf("<section", i), b = s.indexOf("</section>", i) + 10, f = s.indexOf("<footer");
  if (i < 0 || f < 0) throw new Error("hero options: hero or footer not found");
  const A = s.slice(a, b);
  const lab = (k, t) => '<div class="ho-lab"><div class="wrap"><b>' + k + "</b><span>" + t + "</span></div></div>";
  const LEAD = "One ledger for the past and the future. Agents keep the books inside the rules you set, and your forecast, runway and board pack read the same numbers.";
  if (A.indexOf(LEAD) < 0) throw new Error("hero options: lead not found");
  const fix = (h, id) => h.replace('id="top"', 'id="' + id + '"').replace(/href="#(access|different)"/g, 'href=".\/#$1"');
  const B = fix(A, "top-b").replace('data-widget="hero"', 'data-widget="hero" data-kinds');
  const FOR = '<p class="ho-for"><small>Built for</small><a href="founders">Founders and CEOs</a><a href="finance-leads">Finance leads</a><a href="investors">Investors and boards</a><a href="accountants">Accountants</a></p>';
  let C = fix(A, "top-c").replace('data-widget="hero"', 'data-widget="hero" data-kinds').replace(LEAD, "Sales, books, plan, people and company on one ledger. Agents do the work inside the rules you set, so the numbers you plan on are the numbers in your books.");
  const cta = C.indexOf("</div>", C.indexOf("See why it is different"));
  C = C.slice(0, cta + 6) + "\n" + FOR + C.slice(cta + 6);
  return s.slice(0, a) + lab("Option A", "Today's hero, unchanged. The panel tells a software company's story only.") + fix(A, "top") + lab("Option B", "Same words. The panel adds four kinds of business, each with its own four events, so a cafe or a store sees itself in the first screen.") + B + lab("Option C", "Option B, plus a lead that names all five parts of the product and a row of links by role.") + C + s.slice(f);
  };
  const t = s.indexOf('<template id="tpl">');
  const out = tx(s.slice(0, t)) + tx(s.slice(t));
  fs.writeFileSync(path.join(root, "hero-options.html"), out.replace("<head>", '<head><meta name="robots" content="noindex">').replace(/<title>[^<]*<\/title>/, "<title>Hero options | Countahead</title>"));
};
if (require.main === module) module.exports();
