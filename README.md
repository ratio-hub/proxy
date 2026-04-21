# Ratio Proxy

A small macOS app (built with [Electron Forge](https://www.electronforge.io/)) that runs
the Ratio PDF-fetching proxy locally. Tick the checkbox to start the proxy on
`http://localhost:6969`; untick (or close the window) to stop it.

Endpoints: `GET /proxy/health`, `GET /proxy/pdf-file?url=...`, `GET /proxy/parse-pdf?url=...`.

## Install (end users)

Download the DMG from `https://cdn.ratio.global/internal/ratio-proxy-latest.dmg`,
mount it, and drag **Ratio Proxy** into `Applications`. First launch: right-click
the app and choose **Open** (the build is currently unsigned, so Gatekeeper asks
for confirmation).

Requires macOS 11 (Big Sur) or later.

## Develop

```bash
npm install
npm start
```

Forge launches the app in dev mode with Vite HMR for the renderer.

## Build the DMG

```bash
npm run make
```

Output lives under `out/make/`. The first DMG produced is unsigned; to ship a
signed + notarized build, set `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`
in the environment and uncomment the `osxSign` / `osxNotarize` blocks in
`forge.config.ts`.
