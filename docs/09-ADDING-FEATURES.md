# Adding Features

Step-by-step recipes for the most common kinds of changes in FreeShow.

## Table of Contents
- [Before You Start](#before-you-start)
- [Adding a UI Component](#adding-a-ui-component)
- [Adding a Store](#adding-a-store)
- [Adding IPC Communication](#adding-ipc-communication)
- [Adding Server Features](#adding-server-features)
- [Adding a Context Menu Item](#adding-a-context-menu-item)
- [Adding Translations](#adding-translations)
- [Feature Checklist](#feature-checklist)

---

## Before You Start

1. **Find a similar existing feature** and copy its structure — the codebase is very pattern-consistent.
2. Identify which layers your feature touches:
   - UI only → `src/frontend/`
   - Needs file system / OS / hardware → add IPC + `src/electron/`
   - Should appear on connected devices → server messages (`stageTalk`/`remoteTalk` + `src/server/`)
3. Run the app (`npm start`) and keep DevTools open.

---

## Adding a UI Component

🎯 **Goal:** Add a new panel/button/tool to the main UI.

### 1. Create the component

```svelte
<!-- src/frontend/components/drawer/mytool/MyTool.svelte -->
<script lang="ts">
    import { activeShow } from "../../../stores"
    import { translateText } from "../../../utils/language"
    import Button from "../../inputs/Button.svelte"

    function doSomething() {
        console.log("Active show:", $activeShow)
    }
</script>

<div class="main">
    <p>{translateText("category.mytool")}</p>
    <Button on:click={doSomething} center dark>
        {translateText("actions.apply")}
    </Button>
</div>

<style>
    .main {
        display: flex;
        flex-direction: column;
        padding: 10px;
    }
</style>
```

💡 Reuse the input components in `components/inputs/` (`Button`, `TextInput`, `Dropdown`, `Checkbox`, ...) — they handle theming and focus consistently.

### 2. Mount it

Find where sibling components render. Examples:
- Drawer tab content: `components/drawer/Content.svelte`
- Settings page: `components/settings/`
- Popup: add to the popup switch in `components/main/Popup.svelte` and open with `activePopup.set("my_popup")`

### 3. Style with theme variables

Use CSS variables so themes apply: `var(--primary)`, `var(--primary-darker)`, `var(--text)`, `var(--secondary)`, ... (see existing components).

---

## Adding a Store

🎯 **Goal:** Add global state, optionally persisted between launches.

### 1. Declare it

```typescript
// src/frontend/stores.ts
export const myFeatureEnabled: Writable<boolean> = writable(false) // false
```

(The trailing comment documents the default — a convention in this file.)

### 2. Persist it (optional)

If the value should survive restarts, wire it into the save/load cycle:

1. Add the key to the appropriate list in `src/types/Save.ts` (`SaveListSettings` for settings-like values, `SaveListSyncedSettings` for cloud-synced values)
2. Add the store to the matching object in `src/frontend/utils/save.ts` (it is read from there on every save)
3. Add it to the load path in `src/frontend/utils/updateSettings.ts` so the stored value is applied at startup

📝 Un-persisted stores are just runtime state — they reset on every launch.

---

## Adding IPC Communication

🎯 **Goal:** Let the frontend call main-process code (file access, OS APIs, ...).

### 1. Define the channel + types

```typescript
// src/types/IPC/Main.ts
export enum Main {
    ...
    MY_FEATURE = "MY_FEATURE",
}

// in the payload maps in the same file:
export interface MainSendPayloads {
    ...
    [Main.MY_FEATURE]: { path: string }
}
export interface MainReturnPayloads {
    ...
    [Main.MY_FEATURE]: { success: boolean; content?: string }
}
```

### 2. Implement the handler (main process)

```typescript
// src/electron/IPC/responsesMain.ts
export const mainResponses = {
    ...
    [Main.MY_FEATURE]: (data) => myFeatureHandler(data),
}

// e.g. in src/electron/utils/files.ts
export function myFeatureHandler({ path }: { path: string }) {
    if (!doesPathExist(path)) return { success: false }
    return { success: true, content: readFile(path) }
}
```

### 3. Call it (frontend)

```typescript
import { requestMain, sendMain } from "../IPC/main"
import { Main } from "../../types/IPC/Main"

const result = await requestMain(Main.MY_FEATURE, { path })
if (!result?.success) newToast("error.myFeature")   // resolves undefined on timeout!
```

For electron→frontend pushes, use the `ToMain` enum instead (`sendToMain()` in electron, `receiveToMain()` in the frontend).

⚠️ Restart Electron after changing main-process code — only the frontend hot-reloads.

---

## Adding Server Features

🎯 **Goal:** Show something on / receive something from RemoteShow, StageShow, etc.

### App → client (push)

```typescript
// wherever the data changes (or in utils/listeners.ts for store-driven pushes)
import { STAGE } from "../../types/Channels"
import { send } from "./request"

send(STAGE, ["MY_CHANNEL"], { value: 42 })
```

```typescript
// client: src/server/stage/util/receiver.ts
MY_CHANNEL: (data: any) => {
    myStore.set(data.value)
},
```

### Client → app (request)

```typescript
// client
send("MY_REQUEST", { id })
```

```typescript
// app: src/frontend/utils/stageTalk.ts (receiveSTAGE map)
MY_REQUEST: (data: any) => {
    data.result = computeSomething(data.id)
    return data   // returning a value sends it back to the requesting socket
},
```

The same pattern applies to REMOTE (`remoteTalk.ts`) and CONTROLLER (`controllerTalk.ts`). Remote/controller clients can also trigger any **API action** with `send("API:action_id", data)` — see `src/frontend/components/actions/api.ts`.

📝 Server apps are rebuilt on change in dev (`watchServers.js`) — refresh the browser tab to load the new bundle.

---

## Adding a Context Menu Item

Right-click menus are defined centrally:

1. Add the item in `src/frontend/components/context/contextMenus.ts`:
   ```typescript
   export const contextMenuItems: { [key: string]: ContextMenuItem } = {
       ...
       my_action: { label: "context.my_action", icon: "edit" },
   }
   ```
2. Add it to the right menu layout(s) in the same file
3. Handle the click in `src/frontend/components/context/menuClick.ts`
4. Add the `context.my_action` label to translations (below)

---

## Adding Translations

UI strings live in `public/lang/*.json` (keyed dictionaries, `en.json` is the reference):

```json
{ "category": { "mytool": "My Tool" } }
```

Use them via `translateText("category.mytool")` (`src/frontend/utils/language.ts`) or the `<T id="category.mytool" />` helper component. Only `en.json` must be complete — other languages fall back to English.

---

## Feature Checklist

Before opening a PR:

- ✅ Works in dev (`npm start`) — main window AND output window if relevant
- ✅ Works after restart (persisted state loads correctly)
- ✅ Strings are translated (no hardcoded UI text)
- ✅ Undoable if it edits show data (use `history()` — see `components/helpers/history.ts`)
- ✅ `npm run lint` and `npm run test:format` pass
- ✅ `npm run test:svelte` introduces no new errors
- ✅ Tested a production build if the change touches build/paths (`npm run build && npm run pack`)

---

[← Back to Common Patterns](08-COMMON-PATTERNS.md) | [Back to Index](00-INDEX.md) | [Next: Debugging →](10-DEBUGGING.md)
