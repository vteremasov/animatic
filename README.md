# Animatic Overlay

Transparent canvas overlay with swinging snowflakes, chains, socks, candies, leaves, and cherries driven by lightweight pendulum-style physics. Includes PNG assets and a minimal `index.html` for integration.

## Usage

1) Serve the folder (any static server):
```bash
npx serve .
# or python -m http.server 8000
```
2) Open `index.html` in a browser. The overlay mounts a full-screen, transparent, non-interactive canvas on top of the page.

## Files

- `index.js` – sets up the canvas, loads assets, runs physics, draws everything.
- `index.html` – transparent host page that just loads `index.js`.
- PNG assets – top line, snowflakes, socks, candies (kendy), leaves, cherries, sosul.

## Deploy

- GitHub Pages: serve from `main` root and enable Pages in repo settings.
- Any static host (Vercel/Netlify/Cloudflare Pages): deploy the folder as-is.
