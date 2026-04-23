---
description: Electron Forge macOS app (DMG). Use npm + Node, not Bun.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

# Project notes for Codex

This repo is a macOS Electron app (built with Electron Forge + Vite + TypeScript)
that wraps the Ratio PDF-fetching proxy in a tiny GUI. Do **not** use Bun here —
Electron ships its own Node runtime and Bun has poor support for macOS 11, which
is our minimum target.

- Package manager: **npm**. Don't introduce bun, yarn, or pnpm.
- Main entry: `src/main.ts` (Electron main process; Hono server lives here).
- Preload: `src/preload.ts` (exposes `window.proxy.{start, stop}` via `contextBridge`).
- Renderer: `src/renderer.ts` + `index.html` + `src/index.css`.
- Forge config: `forge.config.ts` (DMG + ZIP makers for darwin).
- Proxy port: **6969**.

## Common commands

- `npm start` — run the app in dev mode.
- `npm run make` — produce `out/make/*.dmg`.
- `npm run lint` — eslint over `.ts`/`.tsx`.

## When editing the main process

`@hono/node-server`, `hono`, and `unpdf` are listed as `external` in
`vite.main.config.ts` so Vite doesn't try to bundle Node-only code. If you add
another Node-native dep used by the main process, mark it `external` there too.
