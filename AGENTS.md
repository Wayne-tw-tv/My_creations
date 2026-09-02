# AGENTS.md

## Cursor Cloud specific instructions

This repository (`My_creations`) is a collection of **purely static websites** — plain HTML, CSS, and vanilla JavaScript with **no build system, no package manager, and no dependencies**. It is published via GitHub Pages.

### Products / entry points
- `index.html` — root personal portfolio / business-card hub (links to the three projects below).
- `coffee_website_static/index.html` — 青焙咖啡 single-page coffee roastery marketing site.
- `Lucky_Wheel/index.html` — 幸運轉盤 client-side spin-wheel raffle app (uses browser `localStorage`).
- `Medical_Clinic/index.html` — 敏維智慧診所 multi-page demo clinic site (embeds Unsplash images, Google Maps, YouTube).

### Running locally
There is **no build step and nothing to install** beyond Python (preinstalled). Serve the repo root with a static file server and open the entry points directly:

```bash
python3 -m http.server 8000   # run from the repo root
```

Then visit `http://localhost:8000/index.html`, `.../coffee_website_static/index.html`, `.../Lucky_Wheel/index.html`, `.../Medical_Clinic/index.html`.

Notes:
- The root `index.html` portfolio links point to the live GitHub Pages URLs (`wayne-tw-tv.github.io/My_creations/...`), **not** to localhost. To test local copies, navigate to the local sub-paths above directly rather than clicking the portfolio cards.
- There is **no lint, no test, and no build tooling** in this repo. "Linting" is limited to HTML/CSS/JS validity; there is no configured linter or test framework.
- External CDN assets (Google Fonts, Unsplash, Google Maps, YouTube embeds) require internet access but only affect visual polish/embeds; the sites load and function without them.
