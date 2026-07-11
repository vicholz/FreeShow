# Svelte Guide for FreeShow

Comprehensive guide to using Svelte in the FreeShow codebase.

## Table of Contents
- [What is Svelte?](#what-is-svelte)
- [Svelte Basics](#svelte-basics)
- [Component Structure](#component-structure)
- [Reactivity](#reactivity)
- [Stores](#stores)
- [Props and Events](#props-and-events)
- [Lifecycle Methods](#lifecycle-methods)
- [Bindings](#bindings)
- [Conditionals and Loops](#conditionals-and-loops)
- [Animations and Transitions](#animations-and-transitions)
- [FreeShow Patterns](#freeshow-patterns)

---

## What is Svelte?

Svelte is a **compiler-based** frontend framework, different from React/Vue:

**Traditional Frameworks (React, Vue):**
```
Your Code → Framework Runtime (in browser) → DOM Updates
Size: ~40-100KB runtime + your code
```

**Svelte:**
```
Your Code → Svelte Compiler → Vanilla JavaScript → DOM Updates
Size: Just your compiled code (~10-20KB typical)
```

### Key Advantages

✅ **No Virtual DOM** - Direct DOM manipulation (faster)
✅ **Smaller bundle size** - No runtime framework code
✅ **Built-in reactivity** - No hooks or special APIs
✅ **Less boilerplate** - More concise code
✅ **True reactive statements** - `$:` syntax for computed values

---

## Svelte Basics

### Component File Structure

Every `.svelte` file has three sections:

```svelte
<!-- 1. SCRIPT: JavaScript/TypeScript logic -->
<script lang="ts">
  // Imports
  import { onMount } from 'svelte'
  import type { Show } from '../types/Show'
  
  // Props (component inputs)
  export let title: string
  export let show: Show
  
  // Local variables
  let count = 0
  let items = []
  
  // Functions
  function increment() {
    count += 1
  }
  
  // Lifecycle
  onMount(() => {
    console.log('Component mounted')
  })
  
  // Reactive statements
  $: doubled = count * 2
  $: if (count > 10) {
    console.log('Count is high!')
  }
</script>

<!-- 2. TEMPLATE: HTML markup -->
<div class="container">
  <h1>{title}</h1>
  <p>Count: {count}</p>
  <p>Doubled: {doubled}</p>
  <button on:click={increment}>Increment</button>
</div>

<!-- 3. STYLE: Scoped CSS -->
<style lang="scss">
  .container {
    padding: 20px;
    background: #f0f0f0;
    
    h1 {
      color: #333;
      font-size: 24px;
    }
    
    button {
      padding: 10px 20px;
      background: blue;
      color: white;
      border: none;
      cursor: pointer;
      
      &:hover {
        background: darkblue;
      }
    }
  }
  
  /* Styles are SCOPED to this component only */
  /* Won't affect other components */
</style>
```

---

## Component Structure

### Props (Inputs)

Props are declared with `export let`:

```svelte
<script lang="ts">
  // Required prop
  export let title: string
  
  // Optional prop with default
  export let count: number = 0
  
  // Optional prop (can be undefined)
  export let show: Show | undefined = undefined
  
  // Prop with type and default
  export let items: string[] = []
</script>

<h1>{title}</h1>
<p>Count: {count}</p>
```

**Parent component:**
```svelte
<script lang="ts">
  import MyComponent from './MyComponent.svelte'
</script>

<MyComponent title="Hello" count={5} />
```

### Events (Outputs)

**Child component dispatches events:**
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher()
  
  function handleClick() {
    dispatch('select', { id: 123 })
  }
</script>

<button on:click={handleClick}>Select</button>
```

**Parent listens to events:**
```svelte
<script lang="ts">
  import Child from './Child.svelte'
  
  function handleSelect(event) {
    console.log('Selected:', event.detail.id)
  }
</script>

<Child on:select={handleSelect} />
```

---

## Reactivity

Svelte's reactivity is **triggered by assignments**.

### Basic Reactivity

```svelte
<script lang="ts">
  let count = 0
  
  function increment() {
    count += 1  // Triggers update
  }
  
  function incrementNoUpdate() {
    count = count + 1  // Also triggers update
  }
</script>

<p>{count}</p>
<button on:click={increment}>+</button>
```

### Reactive Declarations (`$:`)

Run code whenever dependencies change:

```svelte
<script lang="ts">
  let count = 0
  
  // Computed value - updates when count changes
  $: doubled = count * 2
  
  // Reactive statement - runs when count changes
  $: {
    console.log(`Count is ${count}`)
    if (count > 10) {
      alert('Too high!')
    }
  }
  
  // Reactive function call
  $: updateTitle(count)
  
  function updateTitle(n: number) {
    document.title = `Count: ${n}`
  }
</script>
```

### Array and Object Reactivity

⚠️ **Gotcha:** Mutations don't trigger updates!

```svelte
<script lang="ts">
  let items = [1, 2, 3]
  
  function addItem() {
    // ❌ This does NOT trigger update
    items.push(4)
    
    // ✅ This DOES trigger update
    items = [...items, 4]
    // or
    items = items.concat(4)
  }
  
  function updateFirst() {
    // ❌ This does NOT trigger update
    items[0] = 99
    
    // ✅ This DOES trigger update
    items[0] = 99
    items = items  // Force update
    // or
    items = [...items]
  }
</script>
```

**Better pattern for objects:**
```svelte
<script lang="ts">
  let user = { name: 'John', age: 30 }
  
  function updateAge() {
    // ✅ Create new object
    user = { ...user, age: 31 }
  }
</script>
```

---

## Stores

Stores are global reactive variables.

### Using Stores

Location: `src/frontend/stores.ts`

```svelte
<script lang="ts">
  import { activeShow, outputs } from '../stores'
  
  // Option 1: Auto-subscribe with $
  // Automatically subscribes and cleans up
  console.log($activeShow)
  
  // Option 2: Manual subscribe
  import { onDestroy } from 'svelte'
  
  let show
  const unsubscribe = activeShow.subscribe(value => {
    show = value
  })
  
  onDestroy(unsubscribe)
</script>

<!-- Use $ prefix to access store value -->
<div>
  <h1>{$activeShow?.name || 'No show'}</h1>
  <p>Outputs: {Object.keys($outputs).length}</p>
</div>
```

### Updating Stores

```svelte
<script lang="ts">
  import { activeShow, outputs } from '../stores'
  
  function openShow(show: Show) {
    // Set entire value
    activeShow.set({
      id: show.id,
      type: 'show'
    })
  }
  
  function updateOutput(outputId: string) {
    // Update based on current value
    outputs.update(current => ({
      ...current,
      [outputId]: {
        ...current[outputId],
        enabled: true
      }
    }))
  }
</script>
```

### Reactive Store Changes

```svelte
<script lang="ts">
  import { activeShow } from '../stores'
  
  // Run code when store changes
  $: if ($activeShow) {
    console.log('Show opened:', $activeShow.name)
    loadSlides($activeShow.id)
  }
  
  // Computed from store
  $: slideCount = $activeShow?.slides?.length || 0
  
  function loadSlides(showId: string) {
    // Load slides
  }
</script>

<p>This show has {slideCount} slides</p>
```

---

## Props and Events

### Props Pattern in FreeShow

**Example: Show component**

`Shows.svelte` (Parent):
```svelte
<script lang="ts">
  import Show from './Show.svelte'
  import { showsCache } from '../../stores'
  
  function handleSelect(event) {
    const showId = event.detail.id
    openShow(showId)
  }
</script>

<div class="shows-grid">
  {#each Object.values($showsCache) as show}
    <Show 
      {show}
      on:select={handleSelect}
      on:delete={handleDelete}
    />
  {/each}
</div>
```

`Show.svelte` (Child):
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Show } from '../types/Show'
  
  export let show: Show
  
  const dispatch = createEventDispatcher()
  
  function select() {
    dispatch('select', { id: show.id })
  }
  
  function deleteShow() {
    dispatch('delete', { id: show.id })
  }
</script>

<div class="show-card" on:click={select}>
  <h3>{show.name}</h3>
  <button on:click|stopPropagation={deleteShow}>
    Delete
  </button>
</div>

<style>
  .show-card {
    padding: 20px;
    border: 1px solid #ccc;
    cursor: pointer;
  }
</style>
```

---

## Lifecycle Methods

```svelte
<script lang="ts">
  import { 
    onMount, 
    onDestroy, 
    beforeUpdate, 
    afterUpdate,
    tick
  } from 'svelte'
  
  // Runs after component is added to DOM
  onMount(() => {
    console.log('Component mounted')
    
    // Return cleanup function (optional)
    return () => {
      console.log('Cleanup on unmount')
    }
  })
  
  // Runs before component is removed from DOM
  onDestroy(() => {
    console.log('Component destroyed')
  })
  
  // Runs before DOM updates
  beforeUpdate(() => {
    console.log('Before update')
  })
  
  // Runs after DOM updates
  afterUpdate(() => {
    console.log('After update')
  })
  
  // Wait for next DOM update
  async function doSomething() {
    count = 5
    await tick()  // Wait for DOM to update
    // Now DOM has updated count
  }
</script>
```

### Common FreeShow Patterns

**Load data on mount:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { requestMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  
  let shows = []
  let loading = true
  
  onMount(async () => {
    try {
      shows = await requestMain(Main.SHOWS, {})
    } catch (error) {
      console.error('Failed to load shows:', error)
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <ul>
    {#each shows as show}
      <li>{show.name}</li>
    {/each}
  </ul>
{/if}
```

**Setup socket listeners:**
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { socket } from '../util/socket'
  
  let message = ''
  
  function handleMessage(msg) {
    message = msg.data
  }
  
  onMount(() => {
    socket.on('MESSAGE', handleMessage)
  })
  
  onDestroy(() => {
    socket.off('MESSAGE', handleMessage)
  })
</script>
```

---

## Bindings

### Two-Way Binding

```svelte
<script lang="ts">
  let name = ''
  let checked = false
  let selected = ''
</script>

<!-- Text input -->
<input type="text" bind:value={name} />
<p>Hello {name}</p>

<!-- Checkbox -->
<input type="checkbox" bind:checked />
<p>Checked: {checked}</p>

<!-- Select -->
<select bind:value={selected}>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</select>
<p>Selected: {selected}</p>
```

### Bind to Component Props

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import NumberInput from './NumberInput.svelte'
  
  let count = 0
</script>

<!-- Two-way binding to child prop -->
<NumberInput bind:value={count} />
<p>Count is: {count}</p>

<!-- NumberInput.svelte -->
<script lang="ts">
  export let value: number
</script>

<input type="number" bind:value />
```

### Bind to DOM Elements

```svelte
<script lang="ts">
  let div
  let input
  
  function focus() {
    input.focus()
  }
  
  function getWidth() {
    console.log('Div width:', div.offsetWidth)
  }
</script>

<div bind:this={div}>Content</div>
<input bind:this={input} type="text" />
<button on:click={focus}>Focus Input</button>
```

---

## Conditionals and Loops

### If Blocks

```svelte
<script lang="ts">
  let user = { loggedIn: true, name: 'John' }
  let count = 5
</script>

{#if user.loggedIn}
  <p>Welcome, {user.name}!</p>
{:else}
  <p>Please log in</p>
{/if}

{#if count > 10}
  <p>High</p>
{:else if count > 5}
  <p>Medium</p>
{:else}
  <p>Low</p>
{/if}
```

### Each Blocks

```svelte
<script lang="ts">
  let items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ]
</script>

<!-- Basic loop -->
{#each items as item}
  <p>{item.name}</p>
{/each}

<!-- With index -->
{#each items as item, i}
  <p>{i + 1}. {item.name}</p>
{/each}

<!-- With key (important for lists that change) -->
{#each items as item (item.id)}
  <p>{item.name}</p>
{/each}

<!-- With else (when empty) -->
{#each items as item}
  <p>{item.name}</p>
{:else}
  <p>No items</p>
{/each}
```

### Await Blocks

```svelte
<script lang="ts">
  import { requestMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  
  let promise = requestMain(Main.SHOWS, {})
</script>

{#await promise}
  <p>Loading...</p>
{:then shows}
  <ul>
    {#each shows as show}
      <li>{show.name}</li>
    {/each}
  </ul>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

---

## Animations and Transitions

### Transitions

```svelte
<script lang="ts">
  import { fade, fly, slide } from 'svelte/transition'
  
  let visible = true
</script>

<button on:click={() => visible = !visible}>
  Toggle
</button>

{#if visible}
  <div transition:fade>
    Fades in and out
  </div>
{/if}

{#if visible}
  <div transition:fly={{ x: 200, duration: 500 }}>
    Flies in from right
  </div>
{/if}

{#if visible}
  <div transition:slide>
    Slides in and out
  </div>
{/if}
```

### Animations

```svelte
<script lang="ts">
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'
  
  let items = [1, 2, 3, 4, 5]
  
  function shuffle() {
    items = items.sort(() => Math.random() - 0.5)
  }
</script>

<button on:click={shuffle}>Shuffle</button>

{#each items as item (item)}
  <div 
    animate:flip={{ duration: 300 }}
    transition:fade
  >
    {item}
  </div>
{/each}
```

---

## FreeShow Patterns

### Pattern 1: Loading Data on Mount

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { requestMain } from '../IPC/main'
  import { Main } from '../../types/IPC/Main'
  import { showsCache } from '../stores'
  
  let loading = true
  let error = false
  
  onMount(async () => {
    // ⚠️ requestMain resolves `undefined` on timeout — it does not throw
    const shows = await requestMain(Main.SHOWS)
    if (shows) showsCache.set(shows)
    else error = true
    loading = false
  })
</script>

{#if loading}
  <div class="loader">Loading...</div>
{:else if error}
  <div class="error">Could not load shows</div>
{:else}
  <!-- Content -->
{/if}
```

### Pattern 2: Reactive Updates to Stage

📝 In FreeShow, broadcasting state to output windows and web clients is centralized in `src/frontend/utils/listeners.ts` — store subscriptions rather than per-component reactive statements:

```typescript
// src/frontend/utils/listeners.ts (simplified)
import { OUTPUT, STAGE } from "../../types/Channels"
import { send } from "./request"
import { sendData } from "./sendData"

outputs.subscribe(async (data) => {
    // debounce rapid updates
    if (await hasNewerUpdate("LISTENER_OUTPUTS", 1)) return

    send(OUTPUT, ["OUTPUTS"], data)         // → output windows (IPC)
    sendData(STAGE, { channel: "OUT" })     // → StageShow clients (Socket.io)
})
```

If a component needs to push something itself, it uses the same helper:

```svelte
<script lang="ts">
  import { STAGE } from "../../types/Channels"
  import { send } from "../utils/request"

  function updateStage(data) {
    send(STAGE, ["BACKGROUND"], data)
  }
</script>
```

### Pattern 3: Form with Validation

```svelte
<script lang="ts">
  let name = ''
  let email = ''
  
  $: nameValid = name.length >= 3
  $: emailValid = email.includes('@')
  $: formValid = nameValid && emailValid
  
  function submit() {
    if (formValid) {
      // Submit form
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <input 
    type="text" 
    bind:value={name}
    class:invalid={!nameValid && name}
  />
  {#if !nameValid && name}
    <span class="error">Name too short</span>
  {/if}
  
  <input 
    type="email" 
    bind:value={email}
    class:invalid={!emailValid && email}
  />
  {#if !emailValid && email}
    <span class="error">Invalid email</span>
  {/if}
  
  <button disabled={!formValid}>Submit</button>
</form>

<style>
  .invalid {
    border-color: red;
  }
  .error {
    color: red;
    font-size: 12px;
  }
</style>
```

### Pattern 4: Context Menu

```svelte
<script lang="ts">
  let contextMenu = null
  let x = 0
  let y = 0
  
  function handleContextMenu(event) {
    event.preventDefault()
    x = event.clientX
    y = event.clientY
    contextMenu = 'show'
  }
  
  function closeMenu() {
    contextMenu = null
  }
</script>

<div 
  class="content"
  on:contextmenu={handleContextMenu}
>
  Right-click me
</div>

{#if contextMenu}
  <div 
    class="context-menu"
    style="left: {x}px; top: {y}px;"
  >
    <button on:click={closeMenu}>Option 1</button>
    <button on:click={closeMenu}>Option 2</button>
  </div>
  
  <!-- Click outside to close -->
  <div 
    class="overlay"
    on:click={closeMenu}
  />
{/if}

<style>
  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
  }
  
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }
</style>
```

---

## Common Gotchas

### 1. Mutations Don't Trigger Updates

```svelte
<script lang="ts">
  let arr = [1, 2, 3]
  
  // ❌ Does NOT work
  function addBad() {
    arr.push(4)
  }
  
  // ✅ DOES work
  function addGood() {
    arr = [...arr, 4]
  }
</script>
```

### 2. Reactive Statements Run Multiple Times

```svelte
<script lang="ts">
  let count = 0
  
  // This runs EVERY time count changes
  $: console.log(count)
  
  // Can run many times unexpectedly
  $: {
    expensiveOperation(count)  // Careful!
  }
</script>
```

### 3. Auto-Subscribe Cleanup

```svelte
<script lang="ts">
  import { myStore } from '../stores'
  
  // ✅ Auto-cleaned up
  $: console.log($myStore)
  
  // ❌ Must manually clean up
  const unsub = myStore.subscribe(v => console.log(v))
  // Don't forget: onDestroy(unsub)
</script>
```

---

[← Back to Communication](04-COMMUNICATION.md) | [Back to Index](00-INDEX.md) | [Next: Electron Guide →](06-ELECTRON-GUIDE.md)
