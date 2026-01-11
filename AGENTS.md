# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Static frontend (HTML/CSS/JS) used by the Tauri app.
- `src-tauri/`: Tauri Rust project (config, icons, Rust sources, build output under `target/`).
- `chrome-extension/`: Unpacked Chrome extension (manifest, popup, background worker, icons).
- `node_modules/`: Tooling only; do not edit.

## Build, Test, and Development Commands
- Desktop (Tauri) – run: `npx tauri dev` (launches app using `src/`).
- Desktop build – run: `npx tauri build` (artifacts in `src-tauri/target/`).
- Frontend build – run: `npm run build` (placeholder; update if you add a bundler).
- Extension – load `chrome-extension/` as an unpacked extension in Chrome.

## Coding Style & Naming Conventions
- JavaScript/HTML/CSS: 2‑space indent; `camelCase` for JS; file names lower‑case with hyphens (e.g., `popup.js`).
- Rust (`src-tauri/`): 4‑space indent; `snake_case` for files, functions; `UpperCamelCase` for types.
- Formatting: use `cargo fmt` for Rust. For web code, add Prettier if needed; keep existing style consistent.

## Testing Guidelines
- No automated tests yet. Prefer small, pure functions if adding JS.
- Rust tests: place in `src-tauri/` modules and run `cargo test` (none present yet).
- Manual checks: verify timer behavior, always‑on‑top toggle, notification appearance; for extension, test popup and alarm/notification flow.

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise subject (≤72 chars). Optional Conventional Commits (e.g., `feat:`, `fix:`).
- PRs: describe change, link issues, include screenshots for UI changes (Tauri window or extension popup), and test notes (OS, steps).

## Security & Configuration Tips
- Tauri `csp` is `null`; avoid injecting remote scripts and untrusted HTML.
- Chrome extension permissions are limited to `notifications` and `alarms`; justify any additions.
- Do not commit secrets or API keys.

## Agent Notes
- Keep changes minimal and aligned with this structure. If you introduce tooling (lint/test/build), document commands here.
