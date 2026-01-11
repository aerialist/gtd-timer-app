# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GTD (Getting Things Done) timer app built with Tauri 2.6. It's a personal productivity timer application that runs as a desktop app with an always-on-top feature for focused work sessions.

## Architecture

- **Framework**: Tauri 2.6 (Rust backend + HTML/CSS/JS frontend)
- **Frontend**: Single HTML file (`src/index.html`) with vanilla JavaScript, CSS, and inline styles
- **Backend**: Minimal Rust application using Tauri's default setup with logging plugin
- **Window Configuration**: Fixed-size window (350x450) with always-on-top capability

## Key Components

### Frontend (`src/index.html`)
- Complete timer application in a single HTML file
- Features a 2-minute countdown timer with circular progress visualization
- Includes play/pause, reset controls, and cycle tracking
- Keyboard shortcuts: Space (play/pause), R (reset), H (toggle controls)
- Japanese UI elements and text

### Backend (`src-tauri/`)
- **`src/main.rs`**: Entry point that calls the library
- **`src/lib.rs`**: Main Tauri application setup with logging plugin for debug builds
- **`tauri.conf.json`**: Configuration for window properties, build settings, and app metadata
- **`Cargo.toml`**: Dependencies including Tauri core, logging, and serialization

## Development Commands

Based on the Tauri configuration:
- **Development**: `npx tauri dev` (runs the Tauri app in development mode)
- **Build**: `npm run build` (builds the frontend before Tauri bundling)
- **Tauri Build**: `npx tauri build` (creates production bundles for macOS)

## Cross-Platform Building

### macOS (Native)
```bash
npx tauri build
```
Creates native macOS app bundle and DMG installer.

### Windows (Cross-compilation from macOS)
```bash
# Setup (one-time)
rustup target add x86_64-pc-windows-gnu
brew install mingw-w64

# Build
npx tauri build --target x86_64-pc-windows-gnu
```
Creates Windows executable at `src-tauri/target/x86_64-pc-windows-gnu/release/app.exe`.

**Note**: Cross-compilation produces the executable but not Windows installers (MSI/NSIS). For full Windows support including installers, use GitHub Actions or build on a Windows machine.

## Window Behavior

The app is configured with specific window properties:
- Always on top functionality
- Non-resizable but user can change via controls
- Centered on screen
- Skip taskbar option available
- Custom window dimensions optimized for timer display

## Language and Localization

The application uses Japanese language for UI elements and notifications. Text content includes Japanese characters for labels and messages.

## Chrome Extension Version

A Chrome extension version is available in the `chrome-extension/` directory. This provides the same timer functionality in a browser extension format.

### Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" 
3. Click "Load unpacked" and select the `chrome-extension` folder
4. Add icon files (16x16, 32x32, 48x48, 128x128 PNG) to `chrome-extension/icons/`

### Key Features
- **Background operation**: Timer continues when popup is closed
- **Persistent state**: Maintains timer state across browser sessions  
- **Desktop notifications**: Alerts when 2-minute sessions complete
- **Cycle tracking**: Counts completed focus sessions