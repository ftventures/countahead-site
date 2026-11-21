# Countahead website

Static site, no build step needed to host it: the HTML, `assets/` and `favicon.svg` are ready to serve (GitHub Pages works as is).

- Pages: `index.html`, `product.html`, `planning.html`, `integrations.html`, `about.html`
- `assets/site.css`: styles. The palette is the variables at the top (`--ink` navy, `--pop` and `--hlt` azure accent).
- `assets/app.js`: the interactive demos and in-page navigation.
- `src/`: the source the pages are generated from. After editing `src/Main.dc.html`, `src/site.js` or `src/build.js`, run `npm i jsdom && node src/build.js`.

Not done yet: the early-access form does not send anywhere.
All figures, companies and interfaces shown are illustrative sample data. Integrations are planned, not live.
