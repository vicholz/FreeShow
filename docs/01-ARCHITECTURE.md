# FreeShow Architecture Overview

This document provides a high-level overview of FreeShow's architecture and design philosophy.

## Table of Contents
- [What is FreeShow?](#what-is-freeshow)
- [High-Level Architecture](#high-level-architecture)
- [Three-Part System](#three-part-system)
- [Mental Model](#mental-model)
- [Design Philosophy](#design-philosophy)
- [Technology Choices](#technology-choices)

---

## What is FreeShow?

FreeShow is a **free, open-source presentation software** designed primarily for churches and venues to display:
- Song lyrics and worship content
- Bible verses and scriptures
- Multimedia presentations
- Live video and audio
- Custom overlays and graphics

**Key Features:**
- 🎤 Stage display for audience-facing content
- 📱 Remote control from mobile devices
- 🎵 Audio playback with visualization
- 🎨 Customizable themes and layouts
- 📡 Network streaming and NDI support
- 🔄 Import from PowerPoint, PDF, EasyWorship, OpenSong, etc.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                FreeShow Desktop Application             │
│                      (Electron)                         │
│                                                         │
│  ┌─────────────────────┐     ┌─────────────────────┐  │
│  │   Main Process      │◄───►│  Renderer Process   │  │
│  │   (Node.js)         │ IPC │  (Chromium/Svelte)  │  │
│  │                     │     │                     │  │
│  │ • File I/O          │     │ • UI Components     │  │
│  │ • Socket.io Servers │     │ • Show Editor       │  │
│  │ • Window Management │     │ • State Management  │  │
│  │ • Hardware Access   │     │ • Preview/Control   │  │
│  │ • Media Processing  │     │ • Settings          │  │
│  └──────────┬──────────┘     └─────────────────────┘  │
│             │                                           │
└─────────────┼───────────────────────────────────────────┘
              │
              │ Socket.io (WebSocket)
              ▼
   ┌──────────────────────────────────────────┐
   │        Four Web Servers (Express)        │
   ├───────────┬───────────┬───────────┬──────┤
   │  REMOTE   │   STAGE   │CONTROLLER │STREAM│
   │  :5510    │   :5511   │  :5512    │:5513 │
   │           │           │           │      │
   │ Mobile    │ Audience  │ Control   │Video │
   │ Control   │ Display   │ Panel     │Feed  │
   └───────────┴───────────┴───────────┴──────┘
              ▲
              │ Browser Access
              │
   ┌──────────────────────────────────────────┐
   │  Connected Devices (any browser)         │
   │  • Phones/Tablets (Remote Control)       │
   │  • Secondary Monitors (Stage Display)    │
   │  • Operator Stations (Controller)        │
   │  • Streaming Viewers (Output Stream)     │
   └──────────────────────────────────────────┘
```

---

## Three-Part System

FreeShow consists of three distinct but interconnected applications:

### 1. Desktop Control Center (Electron App)

**Main Process (Node.js):**
- Manages application lifecycle
- Handles file system operations
- Runs four Socket.io servers
- Controls output windows
- Interfaces with hardware (audio, video, NDI, Blackmagic)

**Renderer Process (Chromium + Svelte):**
- User interface for show editing
- Preview and control panels
- Settings and configuration
- Real-time feedback and monitoring

**Communication:** Electron's IPC (Inter-Process Communication)

### 2. Connected Displays (Web Browsers)

Four separate Svelte web applications served from the Electron main process:

**REMOTE (Port 5510):**
- Mobile-friendly control interface
- Show selection and navigation
- Next/Previous slide controls
- Profile switching
- Optional password protection

**STAGE (Port 5511):**
- Audience-facing display
- Lyrics, verses, and content
- Custom backgrounds and themes
- Animations and transitions
- Multi-screen support

**CONTROLLER (Port 5512):**
- Operator control station
- Advanced show management
- Multi-user coordination
- Status monitoring

**OUTPUT_STREAM (Port 5513):**
- Live video feed of output
- Remote monitoring
- Streaming integration
- Preview capabilities

**Communication:** Socket.io (WebSocket protocol)

### 3. Output Windows (Additional Electron Windows)

Separate Electron BrowserWindow instances:
- Display content on specific monitors
- Full-screen presentation mode
- Managed by OutputHelper
- Direct rendering from main process state

---

## Mental Model

### Think of FreeShow as a Broadcasting System

```
┌─────────────────────────────────────────────┐
│         CONTROL ROOM (Desktop App)          │
│                                             │
│  Operator prepares shows, selects slides,  │
│  adjusts settings, monitors output          │
│                                             │
└──────────────┬──────────────────────────────┘
               │
               │ Commands & Content
               ▼
┌─────────────────────────────────────────────┐
│      DISTRIBUTION HUB (Socket Servers)      │
│                                             │
│  Routes content to appropriate displays     │
│  Synchronizes state across devices          │
│                                             │
└──────────────┬──────────────────────────────┘
               │
               │ Broadcasts to:
               ▼
┌───────────────────────────────────────────────┐
│        ENDPOINTS (Displays & Controls)        │
│                                               │
│  • Stage Display → Shows lyrics to audience  │
│  • Remote Control → Operator controls show   │
│  • Output Windows → Secondary monitors       │
│  • Stream → Internet broadcast               │
│                                               │
└───────────────────────────────────────────────┘
```

### Key Concepts

**Unidirectional Data Flow (mostly):**
1. User action in desktop app OR remote control
2. State update in Svelte stores (frontend)
3. IPC message to Electron (if needed)
4. Socket.io broadcast to connected clients
5. Clients render updated content

**Reactive Updates:**
- Svelte's reactivity ensures UI stays in sync
- Socket.io ensures network clients stay in sync
- Changes propagate automatically

**Separation of Concerns:**
- **Desktop App:** Editing, preparation, control
- **Stage Display:** Presentation to audience
- **Remote Control:** Operator convenience
- **Output Stream:** Monitoring and streaming

---

## Design Philosophy

### 1. **Easy to Use, Powerful Features**

FreeShow aims to be accessible to non-technical users while providing advanced features for power users.

**Examples:**
- Simple show editor with drag-and-drop
- One-click slide transitions
- Advanced timeline for choreographed presentations
- Scriptable automation via API

### 2. **Open and Extensible**

Open-source with clear architecture for community contributions.

**Examples:**
- Import from multiple formats (PowerPoint, PDF, EasyWorship)
- Export to various platforms
- Plugin system (in development)
- API for external control

### 3. **Performance First**

Smooth 60fps rendering even with complex content.

**Examples:**
- Vite for fast development builds
- Efficient Svelte compilation
- Hardware acceleration for media
- Optimized socket communication

### 4. **Cross-Platform Compatibility**

Works on Windows, macOS, and Linux.

**Examples:**
- Electron for desktop
- Web-based displays (any browser)
- Responsive mobile interface
- Platform-specific optimizations

### 5. **Offline-First**

Core functionality works without internet connection.

**Examples:**
- Local storage for shows and settings
- No cloud dependencies for basic use
- Optional cloud sync for collaboration
- Cached media and assets

---

## Technology Choices

### Why Electron?

**Pros:**
- Cross-platform desktop apps with web technologies
- Access to Node.js for file system and hardware
- Chromium for reliable rendering
- Large ecosystem of libraries

**Cons:**
- Larger app size (~200MB)
- Higher memory usage

**Decision:** Desktop app with hardware access (audio, video capture, NDI) requires native capabilities. Electron provides the best balance.

### Why Svelte?

**Pros:**
- Compiles to vanilla JavaScript (no runtime)
- Excellent performance
- Simple, readable syntax
- Built-in reactivity
- Small bundle size

**Cons:**
- Smaller ecosystem than React/Vue
- Less third-party components

**Decision:** Performance is critical for real-time presentations. Svelte's compiled output and built-in reactivity make it ideal.

### Why Vite?

**Pros:**
- Extremely fast dev server (ESM-based)
- Lightning-fast hot module replacement
- Optimized production builds (Rollup)
- Simple configuration

**Cons:**
- Different dev vs. production behavior (rare issues)

**Decision:** Developer experience and build speed are important for an active open-source project.

### Why Socket.io?

**Pros:**
- Automatic reconnection
- Fallback to HTTP long-polling
- Room/namespace support
- Battle-tested reliability

**Cons:**
- Larger than raw WebSocket
- Additional abstraction layer

**Decision:** Reliability is paramount for live presentations. Socket.io's automatic reconnection prevents show interruptions.

### Why TypeScript?

**Pros:**
- Type safety catches bugs early
- Better IDE support (autocomplete, refactoring)
- Self-documenting code
- Scales well with codebase growth

**Cons:**
- Additional build step
- Learning curve for new contributors

**Decision:** The codebase is large (100K+ lines). TypeScript prevents common bugs and makes collaboration easier.

---

## System Components Overview

### Frontend (Renderer Process)
- **Framework:** Svelte 3
- **Build Tool:** Vite 4
- **Language:** TypeScript
- **State:** Writable stores (Svelte)
- **Routing:** Component switching via stores
- **Styling:** SCSS with scoped styles

### Backend (Main Process)
- **Runtime:** Node.js (via Electron)
- **Language:** TypeScript
- **Storage:** electron-store (JSON), better-sqlite3 (DB)
- **Servers:** Express + Socket.io
- **IPC:** Electron's ipcMain/ipcRenderer

### Servers (Web Apps)
- **Framework:** Svelte 3
- **Build Tool:** Rollup
- **Language:** TypeScript
- **Communication:** Socket.io-client
- **Served By:** Express static middleware

### Build System
- **Frontend:** Vite (dev), Vite + Rollup (prod)
- **Servers:** Rollup with Svelte plugin
- **Electron:** TypeScript compiler
- **Packaging:** electron-builder

---

## Data Storage

### Persistent Storage (electron-store)
- **Location:** User data directory (OS-specific)
- **Format:** JSON
- **Contents:**
  - App settings and preferences
  - Show data (projects, overlays, templates)
  - Stage layouts and themes
  - Media references
  - User profiles

### Temporary Storage
- **Memory:** Svelte stores (runtime state)
- **Cache:** Downloaded media, thumbnails
- **Session:** Active timers, connections

### File System
- **Shows:** Individual `.show` files (JSON)
- **Media:** User-selected directories
- **Backups:** Automatic timestamped backups
- **Logs:** Error and debug logs

---

## Network Architecture

### Local Network Communication

```
┌─────────────────────────────────────┐
│  FreeShow Desktop (192.168.1.100)   │
│                                     │
│  Listens on:                        │
│  • 0.0.0.0:5510 (REMOTE)           │
│  • 0.0.0.0:5511 (STAGE)            │
│  • 0.0.0.0:5512 (CONTROLLER)       │
│  • 0.0.0.0:5513 (OUTPUT_STREAM)    │
│                                     │
│  Advertises via Bonjour/mDNS:      │
│  • _freeshow-remote._tcp           │
│  • _freeshow-stage._tcp            │
└─────────────────┬───────────────────┘
                  │
                  │ Local Network
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Phone  │  │ Tablet │  │ Laptop │
│ :5510  │  │ :5511  │  │ :5512  │
└────────┘  └────────┘  └────────┘
```

### Discovery Methods

1. **Bonjour/mDNS:** Automatic discovery on local network
2. **Manual IP:** Enter IP address manually
3. **QR Code:** Scan QR code for connection

---

## Security Model

### IPC Security (Electron)
- **Context Isolation:** Enabled (preload script only)
- **Node Integration:** Disabled in renderer
- **Context Bridge:** Controlled API exposure
- **Sandboxing:** Enabled where possible

### Network Security
- **CORS:** Configured for local network only
- **Authentication:** Optional password protection
- **Encryption:** Optional HTTPS/WSS (future)
- **Rate Limiting:** Connection limits per server

### File System Access
- **Restricted Paths:** Only user-selected directories
- **Validation:** File type and size checks
- **Sandboxing:** Media rendering in isolated contexts

---

## Performance Considerations

### Frontend Optimization
- **Virtual Scrolling:** Large show lists
- **Lazy Loading:** Media thumbnails
- **Debounced Updates:** Rapid changes (sliders, timers)
- **Web Workers:** Heavy computations (future)

### Media Handling
- **Thumbnail Generation:** Background processing
- **Video Playback:** Hardware acceleration
- **Image Optimization:** Resizing and compression
- **Caching:** Frequently used assets

### Network Optimization
- **Message Batching:** Group updates
- **Compression:** Socket.io compression enabled
- **Binary Data:** Use for media (Base64 for simplicity)
- **Heartbeat:** Keep-alive for reliability

---

## Scalability

### Current Limits
- **Shows:** Unlimited (storage-dependent)
- **Slides per Show:** 1000+ tested
- **Connected Clients:** 10 per server (configurable)
- **Output Windows:** Limited by hardware
- **Media Size:** Limited by RAM

### Optimization Strategies
- **Pagination:** Large datasets
- **Streaming:** Media delivery
- **Lazy Loading:** On-demand content
- **Database:** Better-sqlite3 for large datasets (partially implemented)

---

## Next Steps

Now that you understand the high-level architecture:

1. **[Project Structure](02-PROJECT-STRUCTURE.md)** - Explore the codebase organization
2. **[Quick Start Guide](03-QUICK-START.md)** - Get the app running
3. **[Communication Patterns](04-COMMUNICATION.md)** - Deep dive into data flow

---

[← Back to Index](00-INDEX.md) | [Next: Project Structure →](02-PROJECT-STRUCTURE.md)
