<script lang="ts">
    import { onMount } from "svelte"

    export let id: string | undefined
    export let alpha: boolean
    export let capture: any

    // Push-driven updates only (no polling).
    // The main process pushes STREAM / BUFFER updates via STAGE socket
    // when previewBuffers change for outputs used in current_output stage items.
    // This eliminates constant request overhead and reduces CPU/GC.

    // export let capture: any
    // export let fullscreen: any = false
    // export let disabled: any = false
    // export let id: string = ""
    // export let style: string = ""

    let canvas: any
    let ctx: any
    let width: number = 0
    let height: number = 0

    onMount(() => {
        if (!canvas) return

        ctx = canvas.getContext("2d")
        canvas.width = width * 1.2
        canvas.height = height * 1.2
    })

    let lastUpdate = 0
    const frameRateLimit = 1000 / 30 // Limit to 30 FPS client render (content can arrive at capture rate)
    $: if (capture) throttledUpdateCanvas()
    function throttledUpdateCanvas() {
        const now = Date.now()
        if (now - lastUpdate < frameRateLimit) return
        lastUpdate = now
        updateCanvas()
    }

    async function updateCanvas() {
        if (!canvas || !capture?.buffer || !capture?.size) return

        // Reuse typed array where possible; avoid unnecessary copies when stable
        const arr = new Uint8ClampedArray(capture.buffer)
        const pixels = new ImageData(arr, capture.size.width, capture.size.height)
        const bitmap = await createImageBitmap(pixels)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

        // Clean up immediately to help GC
        bitmap.close()
    }
</script>

<div class="center" bind:offsetWidth={width} bind:offsetHeight={height}>
    <canvas style="aspect-ratio: {capture?.size?.width || 16}/{capture?.size?.height || 9};" class="previewCanvas" bind:this={canvas} />
</div>

<style>
    .center {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 100%;
        height: 100%;
    }

    canvas {
        /* width: 100%; */
        height: 100%;
        aspect-ratio: 16/9;
        background-color: black;
    }
</style>
