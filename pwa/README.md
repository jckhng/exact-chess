# Exact Chess PWA

This folder contains a browser/PWA version of Exact Chess. It is intentionally
isolated from the native e-ink/KUAL build in the parent project.

## What It Does

- Runs in Chrome and other modern browsers.
- Can be installed from Chrome using Add to Home screen / install app.
- Works offline after first load through a small service worker.
- Saves the current game automatically in browser `localStorage`.
- Supports manual Save and Load restore points.
- Supports Play White, Play Black, 2 Player, and AI Demo modes.
- Uses bundled `stockfish.js` for engine play.
- Falls back to a small built-in legal-move opponent if Stockfish cannot start.
- Uses the GNOME Chess-derived simple/fancy SVG piece assets copied from the
  parent project.
- Keeps the interface intentionally grayscale to match the e-ink direction of
  the native app.

## Build And Run

```bash
cd pwa
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

The production output is generated in:

```text
pwa/dist
```

## Stockfish

The native ARM Stockfish binary used by the e-ink/KUAL package cannot run
inside Chrome. This PWA bundles the browser-oriented `stockfish.js` package
instead:

```text
public/engine/stockfish.js
public/licenses/stockfish.js-GPL-3.0.txt
```

`stockfish.js` is GPL-3.0 and comes from:

```text
https://github.com/niklasf/stockfish.js
```

This package is larger than the threaded `stockfish.wasm` option, but it is
more portable for normal Chrome and Android PWA usage because it does not
require `SharedArrayBuffer` or COOP/COEP headers.

## Licensing

This PWA remains part of the Exact Chess derivative project. The GNOME-derived
piece artwork and project license/provenance notes from the parent repository
still apply.

Additional browser-side dependencies:

- `chess.js`, BSD-2-Clause, https://github.com/jhlywa/chess.js
- `stockfish.js`, GPL-3.0, https://github.com/niklasf/stockfish.js
- `React`, MIT, https://react.dev/
- `Vite`, MIT, https://vite.dev/
