# Quick Start Guide

Get FreeShow running on your machine in 15 minutes.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [First Time Setup](#first-time-setup)
- [Development Workflow](#development-workflow)
- [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```
   Download: https://nodejs.org/

2. **Python 3.12**
   ```bash
   python3 --version  # Should be 3.12.x
   ```
   Download: https://www.python.org/downloads/
   
   **Install setuptools:**
   ```bash
   pip3 install setuptools
   ```

3. **Platform-Specific Requirements:**

   **Windows:**
   - Visual Studio with "Desktop development with C++"
   - Windows 10 SDK
   - Download: https://visualstudio.microsoft.com/downloads/

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get install libfontconfig1-dev
   ```

   **macOS:**
   - Xcode Command Line Tools
   ```bash
   xcode-select --install
   ```

### Recommended Tools

- **VS Code** - Best IDE support for Svelte
- **Git** - Version control
- **Svelte Extension** - VS Code extension for Svelte support

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ChurchApps/FreeShow.git
cd FreeShow
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install 150+ npm packages
- Compile native modules (better-sqlite3, grandiose, etc.)
- Run post-install scripts (electron-builder install-app-deps)

**Expected time:** 5-10 minutes (depending on internet speed)

⚠️ **Common Issues:**
- **Python not found:** Ensure Python 3.12 is in PATH
- **Visual Studio not found (Windows):** Install VS with C++ tools
- **Gyp errors:** Check Python and build tools installation

---

## Running the App

### Development Mode

```bash
npm start
```

This command:
1. Runs `scripts/start.js` orchestration script
2. Starts Vite dev server on port 3000
3. Compiles Electron TypeScript in watch mode
4. Builds server files (Remote, Stage, Controller)
5. Launches Electron application

**What you should see:**

```
Terminal output:
✓ Vite dev server running at http://localhost:3000
✓ Electron main process compiled
✓ Server files built
✓ Launching Electron...

Electron window opens with FreeShow interface
```

### Access Points

Once running, you can access:

- **Main App:** Electron window (auto-opens)
- **Remote Control:** http://localhost:5510 (in any browser)
- **Stage Display:** http://localhost:5511
- **Controller:** http://localhost:5512
- **Output Stream:** http://localhost:5513

### Hot Reload

**Frontend changes (Svelte):**
- Auto-reload in Electron window
- Changes appear instantly

**Electron changes (TypeScript):**
- Must restart Electron (Ctrl+R or Cmd+R in Electron)
- Or restart `npm start`

---

## First Time Setup

### 1. Initial Configuration

On first launch, FreeShow will:
- Create user data directory
- Initialize electron-store
- Set default settings
- Create example projects

### 2. Open DevTools

**In Electron window:**
- macOS: `Cmd+Option+I`
- Windows/Linux: `Ctrl+Shift+I`

**Console should show:**
```
[FreeShow] App initialized
[FreeShow] Stores loaded
[FreeShow] Servers started on ports 5510-5513
```

### 3. Create Your First Show

1. Click "Projects" in the left panel
2. Click "+" to create a new project
3. Name it "Test Project"
4. Click "+" again to create a show
5. Name it "Test Show"
6. Click on the show to open it
7. Click "+" in the slide area to add slides

### 4. Test Remote Control

1. Open a browser on your phone/tablet
2. Navigate to `http://[YOUR_COMPUTER_IP]:5510`
3. You should see the remote control interface
4. Select your show and test Next/Previous buttons

**Find your IP:**
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

---

## Development Workflow

### Typical Development Session

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install new dependencies (if package.json changed)
npm install

# 3. Start development server
npm start

# 4. Make changes
# Edit files in src/frontend/ or src/electron/

# 5. Test changes
# Frontend: Auto-reloads
# Electron: Restart with Ctrl+R

# 6. Run tests
npm test

# 7. Format code
npm run format:prettier

# 8. Commit changes
git add .
git commit -m "Description of changes"
git push
```

### File Watching

The development setup watches:
- `src/frontend/**/*.{svelte,ts,js}` → Vite hot reload
- `src/electron/**/*.ts` → TypeScript watch mode (must refresh Electron)
- `src/server/**/*` → Built once at startup (must restart `npm start`)

### Making Changes

**Frontend Component:**
1. Edit `src/frontend/components/YourComponent.svelte`
2. Save file
3. Changes appear instantly in Electron window

**Electron Main Process:**
1. Edit `src/electron/yourFile.ts`
2. Save file (TypeScript compiles automatically)
3. Restart Electron: `Ctrl+R` or `Cmd+R`

**Server App:**
1. Edit `src/server/remote/YourComponent.svelte`
2. Restart `npm start` (server files rebuilt on startup)
3. Refresh browser at `http://localhost:5510`

---

## Common Issues

### 1. "Cannot find module" Errors

**Problem:** TypeScript can't find imported modules

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Electron Window Blank/White Screen

**Problem:** Frontend not loading

**Check:**
1. Vite dev server running? (Check terminal for "http://localhost:3000")
2. Console errors? (Open DevTools: Ctrl+Shift+I)
3. Port 3000 in use? (Kill other processes using port 3000)

**Solution:**
```bash
# Restart with clean slate
npm start
```

### 3. Native Module Compilation Fails

**Problem:** `better-sqlite3`, `grandiose`, etc. won't compile

**Windows:**
```bash
# Ensure Visual Studio installed with C++ tools
# Ensure Windows 10 SDK installed
npm install --global windows-build-tools
```

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**Linux:**
```bash
# Install build essentials
sudo apt-get install build-essential
```

### 4. Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5510`

**Solution:**
```bash
# Find and kill process using port
# macOS/Linux:
lsof -ti:5510 | xargs kill -9

# Windows:
netstat -ano | findstr :5510
taskkill /PID [PID_NUMBER] /F
```

### 5. TypeScript Errors on Start

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Check tsconfig files
cat config/typescript/tsconfig.electron.json

# Try cleaning build directory
rm -rf build/
npm start
```

### 6. Vite ECONNREFUSED

**Problem:** Electron can't connect to Vite dev server

**Solution:**
1. Ensure Vite starts before Electron launches
2. Check firewall isn't blocking localhost:3000
3. Try restarting with longer delay:
   ```bash
   # Edit scripts/start.js and add delay if needed
   ```

---

## Environment Variables

### Development

```bash
# Force production mode (uses built files, not Vite)
NODE_ENV=production npm start

# Enable verbose logging
DEBUG=* npm start

# Custom port for Vite (if 3000 is taken)
PORT=3001 npm start
```

### Build Configuration

```bash
# Set app version
npm version 1.6.0

# Build for specific platform
npm run build
```

---

## Useful Commands

### Development

```bash
npm start                    # Start development mode
npm run build:frontend:dev   # Build frontend only (dev)
npm run build:electron:dev   # Build electron only (dev)
npm run build:servers:dev    # Build servers only (dev)
```

### Testing

```bash
npm test                     # Run all tests
npm run test:playwright      # E2E tests
npm run test:format          # Check formatting
npm run test:svelte          # Svelte type checking
```

### Linting & Formatting

```bash
npm run lint                 # Lint all code
npm run lint:electron        # Lint Electron code
npm run lint:frontend        # Lint frontend code
npm run lint:svelte          # Lint Svelte components
npm run format:prettier      # Format all code
```

### Production Build

```bash
npm run build                # Build all (frontend + electron + servers)
npm run pack                 # Package app (no installer)
npm run release              # Build and create installer
```

---

## Project Scripts Explained

### `npm start` Breakdown

```javascript
// scripts/start.js orchestrates:

1. Run preBuild.js
   - Clean build directories
   - Copy necessary files
   
2. Build server files (dev mode)
   - Compile Remote, Stage, Controller apps
   
3. Start Vite dev server (parallel)
   - Serve frontend on port 3000
   - Enable hot reload
   
4. Start Electron watch (parallel)
   - Compile Electron TypeScript
   - Watch for changes
   
5. Launch Electron
   - Open main window
   - Load from localhost:3000
```

---

## Directory Setup After First Run

After running the app for the first time:

```
FreeShow/
├── build/                   # Compiled code
│   ├── electron/            # ✓ Created
│   ├── remote/              # ✓ Created
│   ├── stage/               # ✓ Created
│   └── controller/          # ✓ Created
│
├── public/build/            # Frontend bundle
│   ├── bundle.js            # ✓ Created (dev mode uses Vite)
│   └── bundle.css           # ✓ Created
│
└── User Data Directory      # Platform-specific
    ├── config.json          # ✓ App settings
    ├── shows/               # ✓ Show files
    ├── cache/               # ✓ Thumbnails, etc.
    └── logs/                # ✓ Error logs
```

**User Data Locations:**
- **Windows:** `%APPDATA%/freeshow/`
- **macOS:** `~/Library/Application Support/freeshow/`
- **Linux:** `~/.config/freeshow/`

---

## Verify Installation

### Checklist

✅ **Dependencies installed:**
```bash
npm list --depth=0
# Should show ~150 packages
```

✅ **Build directories exist:**
```bash
ls build/
# Should show: electron/ remote/ stage/ controller/
```

✅ **Electron launches:**
```bash
npm start
# Window should open
```

✅ **Vite dev server accessible:**
```bash
curl http://localhost:3000
# Should return HTML
```

✅ **Servers accessible:**
```bash
curl http://localhost:5510
curl http://localhost:5511
# Should return HTML
```

✅ **DevTools work:**
- Open DevTools in Electron
- Console shows no critical errors

---

## Next Steps

Now that the app is running:

1. **[Communication Patterns](04-COMMUNICATION.md)** - Understand data flow
2. **[Svelte Guide](05-SVELTE-GUIDE.md)** - Learn Svelte basics
3. **[Common Patterns](08-COMMON-PATTERNS.md)** - See code examples
4. **[Adding Features](09-ADDING-FEATURES.md)** - Make your first change

---

## Getting Help

**Build issues?**
- Check [Common Issues](#common-issues)
- Search GitHub issues: https://github.com/ChurchApps/freeshow/issues
- Ask in Slack: https://join.slack.com/t/livechurchsolutions/...

**Development questions?**
- Read the documentation
- Check existing code for patterns
- Ask in Slack

---

[← Back to Project Structure](02-PROJECT-STRUCTURE.md) | [Back to Index](00-INDEX.md) | [Next: Communication Patterns →](04-COMMUNICATION.md)
