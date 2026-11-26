# Countahead website

The marketing site at countahead.ai. A static site served by GitHub Pages from this repository's main branch.

All figures, companies and screens shown are illustrative sample data. Every product screen is planned, not live.

## Layout

- `*.html`: the built pages. Do not edit by hand.
- `assets/`: built, hashed CSS and JavaScript. **Old versions are kept on purpose.** Browsers may hold an older page that still asks for them, and deleting them once left the live site unstyled.
- `src/`: the source.
  - `build.js`: builds every page. Header, menu, icons, footer, role pages and the section rows live here.
  - `Main.dc.html`: the home page template and its logic.
  - `sectors.js`, `people.js`, `accountants.js`, `pricing.js`, `about.js`, `legal.js`: page modules.
  - `widgets*.js`: the interactive demos, each registered as `W.name`. `widgets2.css` holds their styles.
  - `site.js`: page-to-page navigation, the section row and its progress line.
  - `email/gen.js`: the early-access confirmation email.
- `tests/`: browser checks. See below.

## Build

```
npm i jsdom
node src/build.js
node src/email/gen.js https://countahead.ai/ email-early-access.html
```

Adding a page: add its slug to the two slug lists, one in `src/build.js` and one in `src/site.js`, or links to it will not resolve.

## Check before publishing

The checks need `puppeteer-core`, a local Chrome, and the site served on port 8766:

```
npm i puppeteer-core
python3 -m http.server 8766 &
node tests/audit.js      # every page on a phone: nothing wider than the screen
node tests/fit.js        # section row fits at 1440, 1280 and 1100
node tests/chk.js        # each industry page shows its own demo
```

The other files in `tests/` click through one demo each. Run them with a timeout: a hung browser will not stop on its own.

## Publish

Commit the built pages, `src/` and the new files in `assets/`, and push to main. Do not remove older files from `assets/`.

## Wording rules

US spelling. No customer names, no competitor names, no invented statistics, no certifications. Prices are planned launch prices. Never claim the product replaces an accountant or tax adviser. The full list is in the Claude Project, in `website-handbook.md`.
