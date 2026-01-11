# GTD Timer App

A productivity timer app built with Tauri 2.6 for focused work sessions using the Getting Things Done methodology.

## Overview

This is a desktop application featuring a 2-minute countdown timer with circular progress visualization, designed to run as an always-on-top window for distraction-free productivity sessions.

## Features

- 2-minute countdown timer with visual progress indicator
- Always-on-top window mode for focused work
- Play/pause, reset controls
- Cycle tracking to count completed sessions
- Keyboard shortcuts (Space: play/pause, R: reset, H: toggle controls)
- Japanese UI
- Cross-platform support (macOS, Windows)

## Tech Stack

- **Framework**: Tauri 2.6
- **Backend**: Rust
- **Frontend**: HTML/CSS/JavaScript (vanilla)
- **Build System**: Cargo + npm

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific requirements:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools

## Installation

```bash
# Clone the repository
git clone https://github.com/aerialist/gtd-timer-app.git
cd gtd-timer-app

# Install dependencies
npm install
```

## Development

### Running in Development Mode

```bash
npm run tauri dev
# or
npx tauri dev
```

This launches the app in development mode with hot-reload capabilities and debug logging enabled.

### Project Structure

```
gtd-timer-app/
├── src/
│   └── index.html          # Main frontend application
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs          # Tauri app setup with logging
│   │   └── main.rs         # Entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── chrome-extension/       # Chrome extension version
└── package.json
```

## Building for Production

### macOS (Native Build)

Build for your current architecture (Apple Silicon or Intel):

```bash
npx tauri build
```

Output locations:
- **App Bundle**: `src-tauri/target/release/bundle/macos/GTD Timer App.app`
- **DMG Installer**: `src-tauri/target/release/bundle/dmg/GTD Timer App_*.dmg`

Build for specific architecture:

```bash
# Apple Silicon (M1/M2/M3)
npx tauri build --target aarch64-apple-darwin

# Intel
npx tauri build --target x86_64-apple-darwin
```

### Windows Build

#### On Windows (Native)

```bash
npx tauri build
```

Output locations:
- **Executable**: `src-tauri/target/release/gtd-timer-app.exe`
- **MSI Installer**: `src-tauri/target/release/bundle/msi/GTD Timer App_*.msi`

#### Cross-Compilation from macOS to Windows

**Setup (one-time):**

```bash
# Add Windows target
rustup target add x86_64-pc-windows-gnu

# Install MinGW-w64 toolchain
brew install mingw-w64
```

**Build:**

```bash
npx tauri build --target x86_64-pc-windows-gnu
```

Output location:
- **Executable**: `src-tauri/target/x86_64-pc-windows-gnu/release/gtd-timer-app.exe`

**Note**: Cross-compilation from macOS produces the Windows executable but **not** the installers (MSI/NSIS). For full Windows installer support, use GitHub Actions or build on a Windows machine.

## GitHub Actions CI/CD

This project includes automated builds via GitHub Actions for both macOS and Windows.

### Automated Builds

The workflow ([.github/workflows/build.yml](.github/workflows/build.yml)) runs on:
- Push to `main` branch
- Pull requests to `main`
- Manual trigger via workflow_dispatch
- Version tags (e.g., `v1.0.0`)

### Build Matrix

| Platform | Target | Output |
|----------|--------|--------|
| macOS (Apple Silicon) | `aarch64-apple-darwin` | `.app`, `.dmg` |
| Windows | `x86_64-pc-windows-msvc` | `.exe`, `.msi` |

### CI Builds (Non-Release)

For regular commits and PRs:
- Builds are created for both platforms
- Artifacts are uploaded and available for 7 days
- No GitHub release is created

### Release Builds

To create a release with installers:

1. Create and push a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. GitHub Actions will:
   - Build for both macOS and Windows
   - Code sign the macOS build (if secrets are configured)
   - Notarize the macOS app with Apple
   - Create Windows MSI installer
   - Create a draft GitHub release with all artifacts

3. Review and publish the draft release on GitHub

### Required Secrets (for macOS Signing)

For macOS code signing and notarization, configure these secrets in your repository:

- `APPLE_CERTIFICATE` - Base64-encoded .p12 certificate
- `APPLE_CERTIFICATE_PASSWORD` - Certificate password
- `APPLE_SIGNING_IDENTITY` - Developer ID (e.g., "Developer ID Application: Your Name")
- `APPLE_ID` - Apple ID email
- `APPLE_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Apple Team ID

Without these secrets, macOS builds will succeed but won't be signed or notarized.

## Chrome Extension Version

A Chrome extension version is available in the [chrome-extension/](chrome-extension/) directory.

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` folder
4. Add icon files (16x16, 32x32, 48x48, 128x128 PNG) to `chrome-extension/icons/`

### Features

- Background operation (timer continues when popup closed)
- Persistent state across browser sessions
- Desktop notifications on session completion
- Cycle tracking

## Configuration

Window behavior can be configured in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json):

- Window size: 350x450 (optimized for timer display)
- Always-on-top capability
- Resizable/non-resizable options
- Skip taskbar option

## Development Tips

- The app uses a single HTML file ([src/index.html](src/index.html)) for simplicity
- Logging is enabled in debug builds via the Tauri logging plugin
- Check [CLAUDE.md](CLAUDE.md) for architecture details and AI assistant guidance

## License

ISC

## Author

Personal productivity tool for focused work sessions.

## Repository

[https://github.com/aerialist/gtd-timer-app](https://github.com/aerialist/gtd-timer-app)
