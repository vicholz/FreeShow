# FreeShow Quick Reference Card

One-page reference for common tasks and patterns in FreeShow development.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development
npm start

# Run tests
npm test

# Format code
npm run format:prettier
```

---

## 📂 Key Directories

```
src/
├── frontend/          # Svelte UI (renderer process)
│   ├── components/    # UI components
│   ├── stores.ts      # Global state (100+ stores)
│   ├── utils/         # Helper functions
│   └── IPC/main.ts    # IPC communication
│
├── electron/          # Electron main process
│   ├── index.ts       # App entry point
│   ├── servers.ts     # Socket.io servers
│   └── IPC/           # IPC handlers
│
├── server/            # Web server apps
│   ├── remote/        # Remote control (5510)
│   ├── stage/         # Stage display (5511)
│   └── controller/    # Controller (5512)
│
└── types/             # TypeScript types
    ├── Show.ts        # Show/Slide types
    └── IPC/Main.ts    # IPC channels
```

---

## 🔄 Communication Quick Reference

### IPC (Electron Main ↔ Renderer)

```typescript
// Send request and await response
const result = await requestMain(Main.SHOWS, { id: '123' })

// Send one-way message
sendMain(Main.SETTINGS, { key: 'theme', value: 'dark' })

// Listen for messages
receiveMain(Main.UPDATE, (data) => {
  console.log('Update received:', data)
})
```

### Socket.io (Desktop ↔ Web Clients)

```typescript
// Send to stage display
send('STAGE', 'SLIDE', { text: 'Hello' })

// Listen for messages
socket.on('REMOTE', (msg) => {
  if (msg.channel === 'NEXT_SLIDE') {
    goToNextSlide()
  }
})
```

### Svelte Stores

```svelte
<script lang="ts">
  import { activeShow } from '../stores'
  
  // Read store (auto-subscribe with $)
  console.log($activeShow)
  
  // Update store
  activeShow.set({ id: '123', type: 'show' })
  
  // Update based on current value
  activeShow.update(show => ({ ...show, name: 'New Name' }))
  
  // Reactive statement
  $: if ($activeShow) {
    loadSlides($activeShow.id)
  }
</script>
```

---

## 🧩 Component Template

```svelte
<!-- MyComponent.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import type { MyType } from '../../types/MyType'
  
  // Props
  export let title: string
  export let items: MyType[] = []
  
  // State
  let selected: string | null = null
  const dispatch = createEventDispatcher()
  
  // Computed
  $: itemCount = items.length
  
  // Functions
  function handleSelect(id: string) {
    selected = id
    dispatch('select', { id })
  }
  
  // Lifecycle
  onMount(() => {
    console.log('Component mounted')
  })
  
  onDestroy(() => {
    console.log('Component destroyed')
  })
</script>

<div class="container">
  <h1>{title}</h1>
  <p>Items: {itemCount}</p>
  
  {#each items as item (item.id)}
    <button 
      on:click={() => handleSelect(item.id)}
      class:selected={selected === item.id}
    >
      {item.name}
    </button>
  {/each}
</div>

<style lang="scss">
  .container {
    padding: 20px;
    
    button {
      padding: 10px;
      
      &.selected {
        background: blue;
        color: white;
      }
    }
  }
</style>
```

---

## 📋 Common Patterns Cheatsheet

### Loading Data

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { requestMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  
  let data = []
  let loading = true
  let error = null
  
  onMount(async () => {
    try {
      data = await requestMain(Main.SHOWS, {})
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else}
  <!-- Content -->
{/if}
```

### Form with Validation

```svelte
<script lang="ts">
  let email = ''
  let password = ''
  
  $: emailValid = email.includes('@')
  $: passwordValid = password.length >= 8
  $: formValid = emailValid && passwordValid
  
  function submit() {
    if (formValid) {
      // Submit form
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <input 
    type="email" 
    bind:value={email}
    class:invalid={!emailValid && email}
  />
  
  <input 
    type="password" 
    bind:value={password}
    class:invalid={!passwordValid && password}
  />
  
  <button disabled={!formValid}>Submit</button>
</form>
```

### Reactive Updates

```svelte
<script lang="ts">
  import { activeShow, outputs } from '../stores'
  import { send } from '../utils/stageTalk'
  
  // Run when store changes
  $: if ($activeShow) {
    console.log('Show changed:', $activeShow)
    loadSlideData($activeShow.id)
  }
  
  // Send to stage when outputs change
  $: if ($outputs) {
    Object.entries($outputs).forEach(([id, output]) => {
      send('OUTPUT', { id, ...output })
    })
  }
</script>
```

### List with Selection

```svelte
<script lang="ts">
  let items = [...]
  let selected = new Set<string>()
  
  function toggleSelect(id: string, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      if (selected.has(id)) {
        selected.delete(id)
      } else {
        selected.add(id)
      }
      selected = selected  // Trigger reactivity
    } else {
      // Single select
      selected = new Set([id])
    }
  }
</script>

{#each items as item (item.id)}
  <div 
    class:selected={selected.has(item.id)}
    on:click={(e) => toggleSelect(item.id, e)}
  >
    {item.name}
  </div>
{/each}
```

---

## 🎹 Keyboard Shortcuts

```svelte
<script lang="ts">
  function handleKeydown(event: KeyboardEvent) {
    const ctrl = event.ctrlKey || event.metaKey
    
    if (ctrl && event.key === 's') {
      event.preventDefault()
      save()
    } else if (ctrl && event.key === 'z') {
      event.preventDefault()
      undo()
    } else if (event.key === ' ') {
      event.preventDefault()
      togglePlay()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
```

---

## 🎨 Styling Tips

```scss
// Scoped to component
<style lang="scss">
  .container {
    padding: 20px;
    
    // Nested selectors
    .item {
      margin: 10px;
      
      // Pseudo-classes
      &:hover {
        background: #f0f0f0;
      }
      
      // Conditional classes
      &.active {
        border: 2px solid blue;
      }
    }
  }
  
  // Global styles (use sparingly)
  :global(.global-class) {
    color: red;
  }
</style>
```

---

## 🔧 IPC Channels Reference

```typescript
// Storage
Main.SHOWS          // Get/set shows
Main.PROJECTS       // Get/set projects
Main.SETTINGS       // Get/set settings
Main.THEMES         // Get/set themes

// Files
Main.IMPORT         // Import files
Main.SAVE           // Save show
Main.DELETE_SHOWS   // Delete shows

// Window
Main.CLOSE          // Close window
Main.MAXIMIZE       // Maximize window
Main.MINIMIZE       // Minimize window

// System
Main.VERSION        // Get app version
Main.OS             // Get OS info
Main.IP             // Get IP address

// Media
Main.GET_THUMBNAIL  // Get thumbnail
Main.CHECK_RAM      // Check RAM usage

// Network
Main.SEND_SOCKET_MESSAGE  // Send to Socket.io clients
```

---

## 📊 Store Reference

```typescript
// UI State
activePage          // Current page ("show", "edit", etc.)
activePopup         // Current popup (string | null)
focusMode           // Focus mode toggle
currentWindow       // Window type ("output" | "pdf")

// Show Data
activeShow          // Currently active show
showsCache          // All shows cache
projects            // All projects
selected            // Selected items

// Display
outputs             // Output window states
themes              // Theme definitions
overlays            // Overlay definitions

// Network
connections         // Server connections
disabledServers     // Disabled servers

// Media
activeTimers        // Active countdown timers
mediaDownloads      // Download progress
```

---

## 🐛 Debugging Tips

### Frontend Debugging

```javascript
// DevTools: Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)

// Console logging
console.log('Value:', $activeShow)

// Store subscription
activeShow.subscribe(v => console.log('Changed:', v))

// Reactive debugging
$: console.log('Active show:', $activeShow)
```

### Electron Debugging

```javascript
// Main process logging (check terminal)
console.log('Main process:', data)

// IPC debugging
mainResponses[Main.SHOWS] = async (data) => {
  console.log('IPC received:', data)
  return result
}
```

### Socket.io Debugging

```javascript
// Connection status
socket.on('connect', () => console.log('Connected'))
socket.on('disconnect', () => console.log('Disconnected'))

// Message logging
socket.on('STAGE', (msg) => {
  console.log('Stage message:', msg)
})
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific tests
npm run test:playwright
npm run test:format
npm run test:svelte

# Lint code
npm run lint

# Format code
npm run format:prettier
```

---

## 🏗️ Building

```bash
# Development build
npm run build:frontend:dev
npm run build:electron:dev
npm run build:servers:dev

# Production build
npm run build

# Package app
npm run pack

# Create installer
npm run release
```

---

## 📱 Server Ports

```
3000  - Vite dev server (frontend)
5510  - REMOTE server
5511  - STAGE server
5512  - CONTROLLER server
5513  - OUTPUT_STREAM server
```

---

## 🔗 Useful Links

- **Documentation:** `/docs/00-INDEX.md`
- **GitHub:** https://github.com/ChurchApps/FreeShow
- **Issues:** https://github.com/ChurchApps/FreeShow/issues
- **Slack:** https://join.slack.com/t/livechurchsolutions/...

---

## ⚡ Performance Tips

```svelte
<!-- Virtual scrolling for large lists -->
<VirtualList items={largeArray} />

<!-- Lazy load images -->
<img src={visible ? imageSrc : ''} />

<!-- Debounce expensive operations -->
<input on:input={debounced(search, 300)} />

<!-- Use keyed each blocks -->
{#each items as item (item.id)}
  <Item {item} />
{/each}
```

---

## 💡 Common Gotchas

```svelte
<script lang="ts">
  let items = [1, 2, 3]
  
  // ❌ Mutations don't trigger reactivity
  items.push(4)
  
  // ✅ Reassignments do
  items = [...items, 4]
  
  // ❌ Property mutations don't trigger
  obj.prop = 'new'
  
  // ✅ Object reassignment does
  obj = { ...obj, prop: 'new' }
</script>
```

---

**For more detailed information, see the [full documentation](00-INDEX.md)!**
