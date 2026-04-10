# Common Patterns in FreeShow

Real-world code patterns and examples from the FreeShow codebase.

## Table of Contents
- [Component Patterns](#component-patterns)
- [Store Patterns](#store-patterns)
- [IPC Patterns](#ipc-patterns)
- [Socket Patterns](#socket-patterns)
- [Data Management](#data-management)
- [UI Patterns](#ui-patterns)
- [Performance Patterns](#performance-patterns)

---

## Component Patterns

### Pattern 1: List with Selection

Display a list of items with selection state.

```svelte
<!-- Shows.svelte -->
<script lang="ts">
  import { showsCache, activeShow, selected } from '../../stores'
  import Show from './Show.svelte'
  
  function handleSelect(event: CustomEvent) {
    const { id } = event.detail
    
    // Update active show
    activeShow.set({ id, type: 'show' })
    
    // Update selected items
    selected.set({ id: [id] })
  }
  
  function handleMultiSelect(event: CustomEvent) {
    const { id, ctrlKey } = event.detail
    
    if (ctrlKey) {
      // Add to selection
      selected.update(s => ({
        ...s,
        id: [...(s.id || []), id]
      }))
    } else {
      // Replace selection
      selected.set({ id: [id] })
    }
  }
</script>

<div class="shows-grid">
  {#each Object.values($showsCache) as show (show.id)}
    <Show 
      {show}
      active={$activeShow?.id === show.id}
      selected={$selected.id?.includes(show.id)}
      on:select={handleSelect}
      on:multiselect={handleMultiSelect}
    />
  {/each}
</div>

<style lang="scss">
  .shows-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    padding: 20px;
  }
</style>
```

```svelte
<!-- Show.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Show } from '../../types/Show'
  
  export let show: Show
  export let active: boolean = false
  export let selected: boolean = false
  
  const dispatch = createEventDispatcher()
  
  function handleClick(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      dispatch('multiselect', { 
        id: show.id, 
        ctrlKey: true 
      })
    } else {
      dispatch('select', { id: show.id })
    }
  }
</script>

<div 
  class="show-card"
  class:active
  class:selected
  on:click={handleClick}
>
  <h3>{show.name}</h3>
  <p>{show.category}</p>
</div>

<style lang="scss">
  .show-card {
    padding: 20px;
    background: white;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: #ccc;
    }
    
    &.active {
      border-color: blue;
      background: #e3f2fd;
    }
    
    &.selected {
      background: #f5f5f5;
    }
  }
</style>
```

### Pattern 2: Modal/Popup Component

Reusable popup with backdrop.

```svelte
<!-- Popup.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  
  export let title: string = ''
  export let width: string = '500px'
  export let closeButton: boolean = true
  
  const dispatch = createEventDispatcher()
  
  function close() {
    dispatch('close')
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Backdrop -->
<div 
  class="backdrop" 
  transition:fade={{ duration: 200 }}
  on:click={close}
/>

<!-- Popup -->
<div 
  class="popup" 
  style="width: {width}"
  transition:fade={{ duration: 200 }}
  on:click|stopPropagation
>
  <div class="header">
    <h2>{title}</h2>
    {#if closeButton}
      <button class="close" on:click={close}>×</button>
    {/if}
  </div>
  
  <div class="content">
    <slot />
  </div>
  
  <div class="footer">
    <slot name="footer">
      <button on:click={close}>Close</button>
    </slot>
  </div>
</div>

<style lang="scss">
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
  
  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 1001;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
      
      h2 {
        margin: 0;
        font-size: 20px;
      }
      
      .close {
        background: none;
        border: none;
        font-size: 30px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        
        &:hover {
          color: red;
        }
      }
    }
    
    .content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .footer {
      padding: 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  }
</style>
```

**Usage:**
```svelte
<script lang="ts">
  import Popup from './Popup.svelte'
  import { activePopup } from '../stores'
  
  function closePopup() {
    activePopup.set(null)
  }
</script>

{#if $activePopup === 'settings'}
  <Popup 
    title="Settings" 
    width="700px"
    on:close={closePopup}
  >
    <div>
      <!-- Settings content -->
    </div>
    
    <div slot="footer">
      <button on:click={closePopup}>Cancel</button>
      <button on:click={save}>Save</button>
    </div>
  </Popup>
{/if}
```

### Pattern 3: Dropdown/Select Component

Custom dropdown with search.

```svelte
<!-- Dropdown.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  
  export let options: { value: string; label: string }[] = []
  export let value: string = ''
  export let placeholder: string = 'Select...'
  export let searchable: boolean = false
  
  const dispatch = createEventDispatcher()
  
  let open = false
  let search = ''
  
  $: filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )
  
  function select(option: typeof options[0]) {
    value = option.value
    dispatch('change', { value: option.value })
    open = false
    search = ''
  }
  
  function toggle() {
    open = !open
  }
  
  $: selectedLabel = options.find(o => o.value === value)?.label || placeholder
</script>

<div class="dropdown" class:open>
  <button class="trigger" on:click={toggle}>
    {selectedLabel}
    <span class="arrow">▼</span>
  </button>
  
  {#if open}
    <div class="menu">
      {#if searchable}
        <input 
          type="text" 
          bind:value={search}
          placeholder="Search..."
          class="search"
        />
      {/if}
      
      <div class="options">
        {#each filteredOptions as option (option.value)}
          <button 
            class="option"
            class:selected={option.value === value}
            on:click={() => select(option)}
          >
            {option.label}
          </button>
        {:else}
          <div class="empty">No options</div>
        {/each}
      </div>
    </div>
    
    <!-- Click outside to close -->
    <div class="overlay" on:click={() => open = false} />
  {/if}
</div>

<style lang="scss">
  .dropdown {
    position: relative;
    width: 100%;
    
    .trigger {
      width: 100%;
      padding: 10px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      &:hover {
        border-color: #999;
      }
      
      .arrow {
        transition: transform 0.2s;
      }
    }
    
    &.open .trigger .arrow {
      transform: rotate(180deg);
    }
    
    .menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-top: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1001;
      max-height: 300px;
      display: flex;
      flex-direction: column;
      
      .search {
        padding: 10px;
        border: none;
        border-bottom: 1px solid #eee;
        outline: none;
      }
      
      .options {
        overflow-y: auto;
        
        .option {
          width: 100%;
          padding: 10px;
          background: white;
          border: none;
          text-align: left;
          cursor: pointer;
          
          &:hover {
            background: #f5f5f5;
          }
          
          &.selected {
            background: #e3f2fd;
            color: blue;
          }
        }
        
        .empty {
          padding: 20px;
          text-align: center;
          color: #999;
        }
      }
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
    }
  }
</style>
```

---

## Store Patterns

### Pattern 1: Derived Store

Create computed store values.

```typescript
// stores.ts
import { writable, derived } from 'svelte/store'

export const showsCache = writable<{ [key: string]: Show }>({})
export const activeShow = writable<ActiveShow | null>(null)

// Derived: Get current show from cache
export const currentShow = derived(
  [showsCache, activeShow],
  ([$showsCache, $activeShow]) => {
    if (!$activeShow) return null
    return $showsCache[$activeShow.id]
  }
)

// Derived: Count slides
export const slideCount = derived(
  currentShow,
  ($currentShow) => $currentShow?.slides?.length || 0
)

// Derived: Filter shows by category
export const filteredShows = derived(
  [showsCache, selectedCategory],
  ([$showsCache, $category]) => {
    if (!$category) return Object.values($showsCache)
    
    return Object.values($showsCache).filter(
      show => show.category === $category
    )
  }
)
```

**Usage:**
```svelte
<script lang="ts">
  import { currentShow, slideCount } from '../stores'
</script>

<h1>{$currentShow?.name}</h1>
<p>Slides: {$slideCount}</p>
```

### Pattern 2: Custom Store with Methods

```typescript
// stores.ts
import { writable } from 'svelte/store'

function createOutputStore() {
  const { subscribe, set, update } = writable<{ [key: string]: Output }>({})
  
  return {
    subscribe,
    set,
    update,
    
    // Add output
    add: (id: string, output: Output) => {
      update(outputs => ({
        ...outputs,
        [id]: output
      }))
    },
    
    // Remove output
    remove: (id: string) => {
      update(outputs => {
        const { [id]: removed, ...rest } = outputs
        return rest
      })
    },
    
    // Toggle output
    toggle: (id: string) => {
      update(outputs => ({
        ...outputs,
        [id]: {
          ...outputs[id],
          enabled: !outputs[id].enabled
        }
      }))
    },
    
    // Clear all
    clear: () => set({})
  }
}

export const outputs = createOutputStore()
```

**Usage:**
```svelte
<script lang="ts">
  import { outputs } from '../stores'
  
  function addOutput() {
    outputs.add('out1', {
      id: 'out1',
      enabled: true,
      background: null
    })
  }
  
  function toggleOutput(id: string) {
    outputs.toggle(id)
  }
</script>
```

### Pattern 3: Persistent Store (localStorage)

```typescript
// stores.ts
import { writable } from 'svelte/store'

function createPersistentStore<T>(key: string, initial: T) {
  // Load from localStorage
  const stored = localStorage.getItem(key)
  const data = stored ? JSON.parse(stored) : initial
  
  const store = writable<T>(data)
  
  // Save to localStorage on change
  store.subscribe(value => {
    localStorage.setItem(key, JSON.stringify(value))
  })
  
  return store
}

export const userPreferences = createPersistentStore('preferences', {
  theme: 'light',
  language: 'en',
  fontSize: 14
})
```

---

## IPC Patterns

### Pattern 1: Request with Loading State

```svelte
<script lang="ts">
  import { requestMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  
  let loading = false
  let error = null
  let result = null
  
  async function loadData() {
    loading = true
    error = null
    
    try {
      result = await requestMain(Main.SHOWS, {})
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<button on:click={loadData} disabled={loading}>
  {loading ? 'Loading...' : 'Load Data'}
</button>

{#if error}
  <div class="error">{error}</div>
{/if}

{#if result}
  <div>Success: {result}</div>
{/if}
```

### Pattern 2: Batch Operations

```svelte
<script lang="ts">
  import { requestMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  
  async function importMultiple(files: File[]) {
    const results = []
    
    for (const file of files) {
      try {
        const result = await requestMain(
          Main.IMPORT_FILES,
          { files: [file.path] },
          30000  // 30 second timeout
        )
        results.push({ file: file.name, success: true })
      } catch (error) {
        results.push({ 
          file: file.name, 
          success: false, 
          error: error.message 
        })
      }
    }
    
    return results
  }
</script>
```

### Pattern 3: Listen for Updates

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { receiveMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  
  let updates = []
  
  function handleUpdate(data: any) {
    updates = [...updates, data]
  }
  
  onMount(() => {
    receiveMain(Main.UPDATE_PROGRESS, handleUpdate)
  })
  
  // Note: receiveMain doesn't return cleanup function
  // Cleanup happens automatically on component destroy
</script>

<div>
  {#each updates as update}
    <p>{update.message}</p>
  {/each}
</div>
```

---

## Socket Patterns

### Pattern 1: Send and Receive

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { socket } from '../util/socket'
  
  let messages = []
  
  function send(message: string) {
    socket.emit('STAGE', {
      channel: 'MESSAGE',
      data: { text: message }
    })
  }
  
  function handleMessage(msg: any) {
    if (msg.channel === 'MESSAGE') {
      messages = [...messages, msg.data.text]
    }
  }
  
  onMount(() => {
    socket.on('STAGE', handleMessage)
  })
  
  onDestroy(() => {
    socket.off('STAGE', handleMessage)
  })
</script>
```

### Pattern 2: Connection Status

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { socket } from '../util/socket'
  
  let connected = false
  
  function handleConnect() {
    connected = true
    console.log('Connected to server')
  }
  
  function handleDisconnect() {
    connected = false
    console.log('Disconnected from server')
  }
  
  onMount(() => {
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    
    // Check initial state
    connected = socket.connected
  })
  
  onDestroy(() => {
    socket.off('connect', handleConnect)
    socket.off('disconnect', handleDisconnect)
  })
</script>

<div class="status" class:connected>
  {connected ? 'Connected' : 'Disconnected'}
</div>

<style>
  .status {
    padding: 5px 10px;
    border-radius: 4px;
    background: red;
    color: white;
    
    &.connected {
      background: green;
    }
  }
</style>
```

### Pattern 3: Throttled Updates

```svelte
<script lang="ts">
  import { send } from '../utils/stageTalk'
  
  let throttleTimer: any = null
  let pendingUpdate: any = null
  
  function sendThrottled(data: any) {
    // Store latest update
    pendingUpdate = data
    
    // Skip if already scheduled
    if (throttleTimer) return
    
    // Schedule send
    throttleTimer = setTimeout(() => {
      if (pendingUpdate) {
        send('UPDATE', pendingUpdate)
        pendingUpdate = null
      }
      throttleTimer = null
    }, 100)  // Max 10 updates per second
  }
  
  function handleSliderChange(value: number) {
    sendThrottled({ opacity: value })
  }
</script>

<input 
  type="range" 
  min="0" 
  max="100"
  on:input={(e) => handleSliderChange(Number(e.target.value))}
/>
```

---

## Data Management

### Pattern 1: CRUD Operations

```typescript
// showManager.ts
import { requestMain, sendMain } from './IPC/main'
import { Main } from '../types/IPC/Main'
import { showsCache } from './stores'
import type { Show } from '../types/Show'

export async function loadShows() {
  const shows = await requestMain(Main.SHOWS, {})
  showsCache.set(shows)
  return shows
}

export async function createShow(show: Partial<Show>) {
  const newShow = await requestMain(Main.CREATE_SHOW, show)
  
  showsCache.update(cache => ({
    ...cache,
    [newShow.id]: newShow
  }))
  
  return newShow
}

export async function updateShow(id: string, changes: Partial<Show>) {
  await sendMain(Main.UPDATE_SHOW, { id, changes })
  
  showsCache.update(cache => ({
    ...cache,
    [id]: {
      ...cache[id],
      ...changes
    }
  }))
}

export async function deleteShow(id: string) {
  await sendMain(Main.DELETE_SHOWS, { ids: [id] })
  
  showsCache.update(cache => {
    const { [id]: removed, ...rest } = cache
    return rest
  })
}
```

### Pattern 2: Optimistic Updates

```svelte
<script lang="ts">
  import { sendMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  import { showsCache } from '../stores'
  
  async function updateShowName(id: string, name: string) {
    // Update UI immediately (optimistic)
    showsCache.update(cache => ({
      ...cache,
      [id]: {
        ...cache[id],
        name
      }
    }))
    
    try {
      // Send to backend
      await sendMain(Main.UPDATE_SHOW, { id, name })
    } catch (error) {
      // Revert on error
      console.error('Failed to update:', error)
      // Could reload or show error
    }
  }
</script>
```

### Pattern 3: Cache with Expiry

```typescript
// cache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
}

class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private ttl: number  // milliseconds
  
  constructor(ttl: number = 5 * 60 * 1000) {  // 5 minutes default
    this.ttl = ttl
  }
  
  set(key: string, data: T) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  clear() {
    this.cache.clear()
  }
}

export const thumbnailCache = new Cache<string>(10 * 60 * 1000)  // 10 minutes
```

---

## UI Patterns

### Pattern 1: Keyboard Shortcuts

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  
  function handleKeydown(event: KeyboardEvent) {
    // Check modifiers
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey
    
    // Ctrl+S: Save
    if (ctrl && event.key === 's') {
      event.preventDefault()
      save()
      return
    }
    
    // Ctrl+Z: Undo
    if (ctrl && event.key === 'z') {
      event.preventDefault()
      undo()
      return
    }
    
    // Ctrl+Shift+Z: Redo
    if (ctrl && shift && event.key === 'z') {
      event.preventDefault()
      redo()
      return
    }
    
    // Space: Play/Pause
    if (event.key === ' ' && !event.target.matches('input, textarea')) {
      event.preventDefault()
      togglePlay()
      return
    }
    
    // Arrow keys: Navigate
    if (event.key === 'ArrowLeft') {
      previousSlide()
    } else if (event.key === 'ArrowRight') {
      nextSlide()
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
  })
  
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
</script>
```

### Pattern 2: Drag and Drop

```svelte
<script lang="ts">
  let dragging = false
  let draggedItem: any = null
  
  function handleDragStart(event: DragEvent, item: any) {
    dragging = true
    draggedItem = item
    event.dataTransfer.effectAllowed = 'move'
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }
  
  function handleDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault()
    dragging = false
    
    if (draggedItem) {
      // Reorder items
      reorderItems(draggedItem, targetIndex)
      draggedItem = null
    }
  }
  
  function handleDragEnd() {
    dragging = false
    draggedItem = null
  }
</script>

{#each items as item, i (item.id)}
  <div
    class="item"
    draggable="true"
    on:dragstart={(e) => handleDragStart(e, item)}
    on:dragover={handleDragOver}
    on:drop={(e) => handleDrop(e, i)}
    on:dragend={handleDragEnd}
    class:dragging={draggedItem === item}
  >
    {item.name}
  </div>
{/each}

<style>
  .item {
    padding: 10px;
    margin: 5px;
    background: white;
    border: 1px solid #ccc;
    cursor: move;
    
    &.dragging {
      opacity: 0.5;
    }
  }
</style>
```

### Pattern 3: Infinite Scroll

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  
  let items = []
  let page = 1
  let loading = false
  let hasMore = true
  let container: HTMLElement
  
  async function loadMore() {
    if (loading || !hasMore) return
    
    loading = true
    
    try {
      const newItems = await fetchItems(page)
      
      if (newItems.length === 0) {
        hasMore = false
      } else {
        items = [...items, ...newItems]
        page += 1
      }
    } finally {
      loading = false
    }
  }
  
  function handleScroll() {
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    const bottom = scrollHeight - scrollTop - clientHeight
    
    // Load more when 100px from bottom
    if (bottom < 100) {
      loadMore()
    }
  }
  
  onMount(() => {
    loadMore()
  })
</script>

<div 
  class="container"
  bind:this={container}
  on:scroll={handleScroll}
>
  {#each items as item (item.id)}
    <div class="item">{item.name}</div>
  {/each}
  
  {#if loading}
    <div class="loading">Loading...</div>
  {/if}
  
  {#if !hasMore}
    <div class="end">No more items</div>
  {/if}
</div>

<style>
  .container {
    height: 500px;
    overflow-y: auto;
  }
</style>
```

---

## Performance Patterns

### Pattern 1: Virtual List

For large lists (1000+ items).

```svelte
<script lang="ts">
  export let items: any[] = []
  export let itemHeight: number = 50
  
  let scrollTop = 0
  let containerHeight = 500
  
  $: visibleStart = Math.floor(scrollTop / itemHeight)
  $: visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight)
  $: visibleItems = items.slice(visibleStart, visibleEnd + 1)
  $: totalHeight = items.length * itemHeight
  $: offsetY = visibleStart * itemHeight
  
  function handleScroll(event: Event) {
    scrollTop = (event.target as HTMLElement).scrollTop
  }
</script>

<div 
  class="container"
  style="height: {containerHeight}px"
  on:scroll={handleScroll}
>
  <div style="height: {totalHeight}px; position: relative;">
    <div style="transform: translateY({offsetY}px)">
      {#each visibleItems as item, i (items[visibleStart + i].id)}
        <div 
          class="item"
          style="height: {itemHeight}px"
        >
          <slot {item} />
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .container {
    overflow-y: auto;
  }
</style>
```

### Pattern 2: Debounced Input

```svelte
<script lang="ts">
  let searchTerm = ''
  let debounceTimer: any
  
  function handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value
    
    // Clear previous timer
    clearTimeout(debounceTimer)
    
    // Set new timer
    debounceTimer = setTimeout(() => {
      searchTerm = value
      performSearch(value)
    }, 300)  // Wait 300ms after typing stops
  }
  
  function performSearch(term: string) {
    console.log('Searching for:', term)
    // Perform expensive search
  }
</script>

<input 
  type="text"
  on:input={handleInput}
  placeholder="Search..."
/>
```

### Pattern 3: Lazy Load Images

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  
  export let src: string
  export let alt: string = ''
  
  let loaded = false
  let visible = false
  let img: HTMLImageElement
  
  onMount(() => {
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible = true
          observer.disconnect()
        }
      })
    }, { rootMargin: '100px' })
    
    if (img) {
      observer.observe(img)
    }
    
    return () => observer.disconnect()
  })
  
  function handleLoad() {
    loaded = true
  }
</script>

<img
  bind:this={img}
  src={visible ? src : ''}
  {alt}
  class:loaded
  on:load={handleLoad}
/>

<style>
  img {
    opacity: 0;
    transition: opacity 0.3s;
    
    &.loaded {
      opacity: 1;
    }
  }
</style>
```

---

[← Back to Vite/Build](07-VITE-BUILD.md) | [Back to Index](00-INDEX.md) | [Next: Adding Features →](09-ADDING-FEATURES.md)
