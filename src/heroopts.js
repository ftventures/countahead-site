// Builds hero-options.html: the home hero with alternative right-hand panels, for review. Not linked from the site.
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
module.exports = function () {
  const s = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const icon = (k) => { const m = s.match(new RegExp('<svg class="nv-ic ni-' + k + '"[\\s\\S]*?</svg>')); if (!m) throw new Error("icon " + k); return '<span hidden data-ic="' + k + '">' + m[0] + "</span>"; };
  const ICONS = ["rev", "books", "plan", "people", "co"].map(icon).join("");
  const lab = (k, t) => '<div class="ho-lab"><div class="wrap"><b>' + k + "</b><span>" + t + "</span></div></div>";
  const tx = (part) => {
    const i = part.indexOf('data-widget="hero"'), a = part.lastIndexOf("<section", i), b = part.indexOf("</section>", i) + 10, f = part.indexOf("<footer");
    if (i < 0 || f < 0) throw new Error("hero or footer not found");
    const A = part.slice(a, b), d0 = A.lastIndexOf("<div", A.indexOf('data-widget="hero"')), d1 = A.lastIndexOf("</div>\n</section>") < 0 ? A.lastIndexOf("</div>", A.lastIndexOf("</div>") - 1) : A.lastIndexOf("</div>\n</section>");
    const fix = (h, id) => h.replace('id="top"', 'id="' + id + '"').replace(/href="#(access|different)"/g, 'href="./#$1"');
    const alt = (w, id) => fix(A.slice(0, d0) + '<div class="r5 w-hero" data-widget="' + w + '">' + ICONS + "</div>\n" + A.slice(d1), id);
    return part.slice(0, a) + lab("Option A", "Today's panel, unchanged, for reference.") + fix(A, "top") + lab("Option B", "One thing happens and every part of the company updates. Shows the all-in-one idea in one glance. Plays by itself.") + alt("heroparts", "top-b") + lab("Option C", "Six tools that disagree, against one system. Leads with the problem everyone recognizes.") + alt("herostack", "top-c") + lab("Option D", "A morning with Countahead: what agents did, what needs you, what is ahead.") + alt("heroday", "top-d") + part.slice(f);
  };
  const t = s.indexOf('<template id="tpl">');
  const out = tx(s.slice(0, t)) + tx(s.slice(t));
  fs.writeFileSync(path.join(root, "hero-options.html"), out.replace("<head>", '<head><meta name="robots" content="noindex">').replace(/<title>[^<]*<\/title>/, "<title>Hero options | Countahead</title>"));
};
if (require.main === module) module.exports();
