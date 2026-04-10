# FreeShow Developer Documentation

Welcome to the FreeShow developer documentation! This guide will help you understand the codebase, make changes, add features, and fix bugs.

## 📚 Documentation Structure

### Getting Started
1. **[Architecture Overview](01-ARCHITECTURE.md)** - High-level system design and mental model
2. **[Project Structure](02-PROJECT-STRUCTURE.md)** - File organization and navigation guide
3. **[Quick Start Guide](03-QUICK-START.md)** - Get up and running in 15 minutes

### Core Concepts
4. **[Communication Patterns](04-COMMUNICATION.md)** - IPC, Socket.io, and data flow
5. **[Svelte Guide](05-SVELTE-GUIDE.md)** - Components, stores, reactivity deep-dive
6. **[Electron Guide](06-ELECTRON-GUIDE.md)** - Main process, IPC handlers, windows
7. **[Vite & Build System](07-VITE-BUILD.md)** - Development workflow and production builds

### Practical Guides
8. **[Common Patterns](08-COMMON-PATTERNS.md)** - Code patterns with examples
9. **[Adding Features](09-ADDING-FEATURES.md)** - Step-by-step feature implementation
10. **[Debugging Guide](10-DEBUGGING.md)** - Troubleshooting and debugging techniques
11. **[Testing Guide](11-TESTING.md)** - Writing and running tests

### Reference
12. **[Technology Stack](12-TECHNOLOGIES.md)** - Deep dive into libraries and tools
13. **[API Reference](13-API-REFERENCE.md)** - Key APIs and interfaces
14. **[Contributing](14-CONTRIBUTING.md)** - Code style, PR guidelines, best practices

## 🎯 Quick Navigation

### I want to...

**Understand the system:**
- [See the big picture](01-ARCHITECTURE.md#mental-model) → Architecture Overview
- [Understand data flow](04-COMMUNICATION.md#data-flow-examples) → Communication Patterns
- [Learn how Svelte works here](05-SVELTE-GUIDE.md) → Svelte Guide

**Make changes:**
- [Add a new feature](09-ADDING-FEATURES.md) → Adding Features Guide
- [Add a UI component](09-ADDING-FEATURES.md#adding-a-ui-component) → Component Guide
- [Add an IPC handler](09-ADDING-FEATURES.md#adding-ipc-communication) → IPC Guide
- [Add a server endpoint](09-ADDING-FEATURES.md#adding-server-features) → Server Guide

**Fix bugs:**
- [Debug frontend issues](10-DEBUGGING.md#frontend-debugging) → Debugging Guide
- [Debug IPC issues](10-DEBUGGING.md#ipc-debugging) → IPC Debugging
- [Debug server issues](10-DEBUGGING.md#server-debugging) → Server Debugging

**Learn specific tech:**
- [How Svelte works](05-SVELTE-GUIDE.md#how-svelte-works) → Svelte Deep Dive
- [How Electron works](06-ELECTRON-GUIDE.md#electron-fundamentals) → Electron Deep Dive
- [How Vite works](07-VITE-BUILD.md#how-vite-works) → Vite Deep Dive

## 🚀 Recommended Reading Order

### For Complete Beginners
1. Start with [Architecture Overview](01-ARCHITECTURE.md)
2. Read [Quick Start Guide](03-QUICK-START.md)
3. Explore [Project Structure](02-PROJECT-STRUCTURE.md)
4. Study [Common Patterns](08-COMMON-PATTERNS.md)
5. Try [Adding Features](09-ADDING-FEATURES.md)

### For Svelte Beginners
1. [Svelte Guide](05-SVELTE-GUIDE.md) - Comprehensive Svelte tutorial
2. [Common Patterns](08-COMMON-PATTERNS.md#svelte-patterns) - Svelte patterns used here
3. [Adding Features](09-ADDING-FEATURES.md#adding-a-ui-component) - Practice with examples

### For Electron Beginners
1. [Electron Guide](06-ELECTRON-GUIDE.md) - Electron fundamentals
2. [Communication Patterns](04-COMMUNICATION.md#ipc-communication) - IPC deep dive
3. [Adding Features](09-ADDING-FEATURES.md#adding-ipc-communication) - IPC examples

### For Experienced Developers
1. Skim [Architecture Overview](01-ARCHITECTURE.md)
2. Review [Communication Patterns](04-COMMUNICATION.md)
3. Check [Common Patterns](08-COMMON-PATTERNS.md)
4. Start coding with [Adding Features](09-ADDING-FEATURES.md)

## 📖 Documentation Conventions

### Code Examples

All code examples are real code from the FreeShow codebase or realistic examples that follow the project's patterns.

**File references:**
```
src/frontend/stores.ts:42
```
Means line 42 in `src/frontend/stores.ts`

**Type annotations:**
```typescript
// TypeScript example
const show: Show = { ... }
```

```svelte
<!-- Svelte example -->
<script lang="ts">
  // Component code
</script>
```

### Symbols Used

- 🎯 **Goal/Objective**
- ⚠️ **Warning/Gotcha**
- 💡 **Tip/Best Practice**
- 📝 **Note/Important**
- ✅ **Success/Correct**
- ❌ **Error/Incorrect**
- 🔧 **Tool/Configuration**
- 📊 **Data Flow**
- 🔌 **Integration Point**

## 🤝 Contributing to Documentation

Found something unclear? Have a suggestion? Please:

1. Open an issue on GitHub
2. Submit a PR with improvements
3. Ask questions in the Slack channel

## 📞 Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **Slack**: Live discussion and questions
- **Documentation**: You're reading it!

---

**Ready to dive in?** Start with the [Architecture Overview](01-ARCHITECTURE.md) →
