/**
 * ZX-Draw Renderer Logic
 */

const SPECTRUM_PALETTE = [
    ['#000000', '#0000D7', '#D70000', '#D700D7', '#00D700', '#00D7D7', '#D7D700', '#D7D7D7'], // Normal
    ['#000000', '#0000FF', '#FF0000', '#FF00FF', '#00FF00', '#00FFFF', '#FFFF00', '#FFFFFF']  // Bright
];

class ZXDraw {
    constructor() {
        this.zoom = 4;
        this.gridVisible = true;
        this.flashInverted = false;
        this.currentTool = 'draw';
        
        // Selection/Clipboard
        this.selection = null; // { x, y, w, h } in blocks
        this.clipboard = null; // { pixels, attributes, w, h }
        this.isPasting = false;
        this.pastePos = { bx: 0, by: 0 };

        // Undo / Redo
        this.undoStack = [];
        this.redoStack = [];

        // Animation viewer
        this.animInterval = null;
        this.animCurrentFrame = 0;
        
        // State
        this.pixels = null; // Uint8Array (0 or 1)
        this.attributes = null; // Uint8Array (attribute bytes)
        
        // Active Selection
        this.ink = 7;
        this.paper = 0;
        this.bright = 0;
        this.flash = 0;

        // DOM elements
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridCanvas = document.getElementById('grid-canvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.selCanvas = document.getElementById('selection-canvas');
        this.selCtx = this.selCanvas.getContext('2d');
        this.canvasWrapper = document.getElementById('canvas-wrapper');
        
        this.init();
    }

    init() {
        this.resetData(256, 192);
        this.setupEventListeners();
        this.setupPalettes();
        this.setupAnimationViewer();
        this.render();
        this.updateUI();

        // Start Flash timer
        setInterval(() => {
            this.flashInverted = !this.flashInverted;
            this.render();
            this.renderAnimFrame();
        }, 1000);
    }

    resetData(w, h) {
        this.width = w;
        this.height = h;
        this.pixels = new Uint8Array(w * h);
        this.attributes = new Uint8Array((w / 8) * (h / 8));
        
        // Default attribute: Ink 7, Paper 0 (White on Black)
        for(let i=0; i < this.attributes.length; i++) {
            this.attributes[i] = 0x38; // 00 111 000 (Flash 0, Bright 0, Paper 7, Ink 0) -> Wait
            // Spectrum attributes: F B P P P I I I
            // Paper 7 (111), Ink 0 (000) -> 00 111 000 = 0x38. Actually Paper 0, Ink 7 is 00 000 111 = 0x07.
            // Let's use 0x07 as default (Paper 0, Ink 7).
            this.attributes[i] = 0x07;
        }

        this.canvas.width = w;
        this.canvas.height = h;
        this.gridCanvas.width = w;
        this.gridCanvas.height = h;
        this.selCanvas.width = w;
        this.selCanvas.height = h;
        this.updateZoom();
    }

    setupPalettes() {
        const inkGrid = document.getElementById('ink-palette');
        const paperGrid = document.getElementById('paper-palette');
        
        const createSwatches = (container, type) => {
            container.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = SPECTRUM_PALETTE[0][i];
                swatch.dataset.index = i;
                if ((type === 'ink' && this.ink === i) || (type === 'paper' && this.paper === i)) {
                    swatch.classList.add('active');
                }
                swatch.onclick = () => {
                    if (type === 'ink') this.ink = i;
                    else this.paper = i;
                    document.querySelectorAll(`#${type}-palette .color-swatch`).forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');
                    this.updateUI();
                };
                container.appendChild(swatch);
            }
        };

        createSwatches(inkGrid, 'ink');
        createSwatches(paperGrid, 'paper');
    }

    setupEventListeners() {
        // Zoom
        document.getElementById('zoom-in').onclick = () => { this.zoom = Math.min(16, this.zoom + 1); this.updateZoom(); };
        document.getElementById('zoom-out').onclick = () => { if(this.zoom > 1) this.zoom--; this.updateZoom(); };

        document.getElementById('canvas-container').addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoom = Math.min(16, this.zoom + 1);
            } else {
                this.zoom = Math.max(1, this.zoom - 1);
            }
            this.updateZoom();
        }, { passive: false });
        
        // Tools
        document.getElementById('tool-draw').onclick = () => this.setTool('draw');
        document.getElementById('tool-select').onclick = () => this.setTool('select');
        document.getElementById('tool-text').onclick = () => this.setTool('text');
        
        document.getElementById('copy-btn').onclick = () => this.copySelection();
        document.getElementById('paste-btn').onclick = () => this.startPaste();

        // Grid Toggle
        document.getElementById('grid-toggle').onclick = (e) => {
            this.gridVisible = !this.gridVisible;
            e.target.classList.toggle('active', this.gridVisible);
            this.drawGrid();
        };

        // Mods
        document.getElementById('bright-toggle').onchange = (e) => { this.bright = e.target.checked ? 1 : 0; this.updateUI(); };
        document.getElementById('flash-toggle').onchange = (e) => { this.flash = e.target.checked ? 1 : 0; this.updateUI(); };

        // Undo / Redo
        document.getElementById('undo-btn').onclick = () => this.undo();
        document.getElementById('redo-btn').onclick = () => this.redo();

        // Flip
        document.getElementById('flip-h-btn').onclick = () => this.flipSelection('h');
        document.getElementById('flip-v-btn').onclick = () => this.flipSelection('v');

        // Invert
        document.getElementById('invert-pixels-btn').onclick = () => this.invertPixels();
        document.getElementById('invert-attrs-btn').onclick = () => this.invertAttrs();

        // Canvas Painting
        let isDrawing = false;
        
        const handlePaint = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.zoom);
            const y = Math.floor((e.clientY - rect.top) / this.zoom);
            
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const bx = Math.floor(x / 8);
                const by = Math.floor(y / 8);

                if (this.isPasting && this.clipboard) {
                    this.saveHistory();
                    this.executePaste(bx, by);
                    isDrawing = false; // Stop drawing after paste
                    return;
                }

                if (this.currentTool === 'draw') {
                    const attrIdx = by * (this.width / 8) + bx;
                    // Update pixels
                    if (e.buttons & 1) { // Left click
                        this.pixels[y * this.width + x] = 1;
                        this.attributes[attrIdx] = this.getCurrentAttrByte();
                    } else if (e.buttons & 2) { // Right click
                        this.pixels[y * this.width + x] = 0;
                        this.attributes[attrIdx] = this.getCurrentAttrByte();
                    }
                } else if (this.currentTool === 'select') {
                    if (isDrawing) {
                        const startBX = Math.floor(this.dragStart.x / 8);
                        const startBY = Math.floor(this.dragStart.y / 8);
                        const endBX = Math.floor(x / 8);
                        const endBY = Math.floor(y / 8);
                        
                        this.selection = {
                            x: Math.min(startBX, endBX),
                            y: Math.min(startBY, endBY),
                            w: Math.abs(startBX - endBX) + 1,
                            h: Math.abs(startBY - endBY) + 1
                        };
                        this.drawSelection();
                    }
                }
                
                this.render();
                this.updateStatus(x, y);
            }
        };

        this.canvasWrapper.onmousedown = (e) => { 
            const rect = this.canvas.getBoundingClientRect();
            this.dragStart = {
                x: Math.floor((e.clientX - rect.left) / this.zoom),
                y: Math.floor((e.clientY - rect.top) / this.zoom)
            };
            if (e.button === 2) e.preventDefault();
            isDrawing = true;
            if (this.currentTool === 'text' && e.button === 0) {
                isDrawing = false;
                const px = Math.floor((e.clientX - rect.left) / this.zoom);
                const py = Math.floor((e.clientY - rect.top) / this.zoom);
                this.openTextModal(px, py);
                return;
            }
            if (this.currentTool === 'draw' && !this.isPasting) this.saveHistory();
            handlePaint(e); 
        };
        this.canvasWrapper.oncontextmenu = (e) => e.preventDefault();
        window.onmousemove = (e) => { 
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.zoom);
            const y = Math.floor((e.clientY - rect.top) / this.zoom);

            if (this.isPasting) {
                this.pastePos = { bx: Math.floor(x / 8), by: Math.floor(y / 8) };
                this.drawSelection();
            }

            if (isDrawing) handlePaint(e); 
            
            // Update status even if not drawing
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.updateStatus(x, y);
            }
        };
        window.onmouseup = () => { isDrawing = false; };

        // Modal triggers
        document.getElementById('size-settings').onclick = () => {
            document.getElementById('size-modal').classList.remove('hidden');
        };
        document.getElementById('modal-cancel').onclick = () => {
             document.getElementById('size-modal').classList.add('hidden');
        };
        document.getElementById('modal-apply').onclick = () => {
            const w = parseInt(document.getElementById('width-input').value);
            const h = parseInt(document.getElementById('height-input').value);
            if (w % 8 === 0 && h % 8 === 0 && w > 0 && h > 0) {
                this.resetData(w, h);
                this.render();
                document.getElementById('size-modal').classList.add('hidden');
            } else {
                alert('Size must be a multiple of 8.');
            }
        };

        // File I/O
        document.getElementById('save-btn').onclick = async () => {
            const zxpContent = this.exportToZXP();
            const filePath = await window.electronAPI.saveFile(zxpContent, 'my_graphic.zxp');
            if(filePath) console.log('Saved to', filePath);
        };

        document.getElementById('load-btn').onclick = async () => {
            const file = await window.electronAPI.loadFile();
            if (file) {
                this.importFromZXP(file.content);
                this.render();
            }
        };

        document.getElementById('new-btn').onclick = () => {
            if(confirm('Start a new image? Progress will be lost.')) {
                this.resetData(this.width, this.height);
                this.render();
            }
        };

        // Shortcuts
        window.onkeydown = (e) => {
            if (e.ctrlKey && e.code === 'KeyC') {
                e.preventDefault();
                this.copySelection();
            } else if (e.ctrlKey && e.code === 'KeyV') {
                e.preventDefault();
                this.startPaste();
            } else if (e.ctrlKey && e.code === 'KeyZ') {
                e.preventDefault();
                this.undo();
            } else if ((e.ctrlKey && e.code === 'KeyY') || (e.ctrlKey && e.shiftKey && e.code === 'KeyZ')) {
                e.preventDefault();
                this.redo();
            } else if (!e.ctrlKey && e.key.toLowerCase() === 'h') {
                this.flipSelection('h');
            } else if (!e.ctrlKey && e.key.toLowerCase() === 'v') {
                this.flipSelection('v');
            } else if (!e.ctrlKey && e.key.toLowerCase() === 't') {
                this.setTool('text');
            } else if (e.key === 'Escape') {
                this.isPasting = false;
                this.selection = null;
                this.drawSelection();
                this.canvasWrapper.style.cursor = 'crosshair';
            } else if (e.key.toLowerCase() === 'p') {
                this.setTool('draw');
            } else if (e.key.toLowerCase() === 's') {
                this.setTool('select');
            }
        };
    }

    // ── Text Tool ────────────────────────────────────────────────────────────
    openTextModal(px, py) {
        this._textStampX = px;
        this._textStampY = py;
        const modal = document.getElementById('text-modal');
        modal.classList.remove('hidden');

        const updatePreview = () => {
            const text      = document.getElementById('text-input').value || 'A';
            const size      = parseInt(document.getElementById('text-size').value) || 16;
            const font      = document.getElementById('text-font').value;
            const bold      = document.getElementById('text-bold').checked ? 'bold ' : '';
            const italic    = document.getElementById('text-italic').checked ? 'italic ' : '';
            const threshold = parseInt(document.getElementById('text-threshold').value);
            document.getElementById('text-threshold-val').textContent = threshold;

            const offscreen = document.createElement('canvas');
            const octx = offscreen.getContext('2d');
            octx.font = `${italic}${bold}${size}px ${font}`;
            const metrics = octx.measureText(text);
            const w = Math.ceil(metrics.width) + 2;
            const h = size + 4;
            offscreen.width  = w;
            offscreen.height = h;
            octx.fillStyle = '#000';
            octx.fillRect(0, 0, w, h);
            octx.font = `${italic}${bold}${size}px ${font}`;
            octx.fillStyle = '#fff';
            octx.textBaseline = 'top';
            octx.fillText(text, 1, 1);

            // Binarize preview
            const prev = document.getElementById('text-preview-canvas');
            const scale = Math.max(1, Math.floor(220 / w));
            prev.width  = w * scale;
            prev.height = h * scale;
            const pctx = prev.getContext('2d');
            const imgD = octx.getImageData(0, 0, w, h);
            const out  = pctx.createImageData(prev.width, prev.height);
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    const r = imgD.data[(j * w + i) * 4];     // red = brightness
                    const on = r > threshold;
                    const v = on ? 255 : 0;
                    for (let sy = 0; sy < scale; sy++) {
                        for (let sx = 0; sx < scale; sx++) {
                            const idx = ((j * scale + sy) * prev.width + (i * scale + sx)) * 4;
                            out.data[idx] = v; out.data[idx+1] = v; out.data[idx+2] = v; out.data[idx+3] = 255;
                        }
                    }
                }
            }
            pctx.putImageData(out, 0, 0);
            this._textOffscreen = offscreen;
        };

        // Wire live preview inputs
        ['text-input','text-size','text-font','text-bold','text-italic','text-threshold'].forEach(id => {
            document.getElementById(id).oninput = updatePreview;
            document.getElementById(id).onchange = updatePreview;
        });
        updatePreview();

        document.getElementById('text-cancel').onclick = () => {
            modal.classList.add('hidden');
        };

        document.getElementById('text-apply').onclick = () => {
            modal.classList.add('hidden');
            const threshold = parseInt(document.getElementById('text-threshold').value);
            this.stampText(this._textOffscreen, this._textStampX, this._textStampY, threshold);
        };
    }

    stampText(offscreen, startX, startY, threshold) {
        if (!offscreen) return;
        this.saveHistory();
        const octx = offscreen.getContext('2d');
        const w = offscreen.width;
        const h = offscreen.height;
        const imgD = octx.getImageData(0, 0, w, h);
        const cols = this.width / 8;
        const attr = this.getCurrentAttrByte();

        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
                const tx = startX + i;
                const ty = startY + j;
                if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) continue;
                const r = imgD.data[(j * w + i) * 4];  // red = brightness
                if (r > threshold) {
                    this.pixels[ty * this.width + tx] = 1;
                    this.attributes[Math.floor(ty / 8) * cols + Math.floor(tx / 8)] = attr;
                }
            }
        }
        this.render();
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Flip ─────────────────────────────────────────────────────────────────
    flipSelection(dir) {
        if (!this.selection) return;
        this.saveHistory();

        const { x, y, w, h } = this.selection;
        const pw = w * 8;
        const ph = h * 8;
        const cols = this.width / 8;

        if (dir === 'h') {
            // Flip pixels horizontally (mirror each row)
            for (let j = 0; j < ph; j++) {
                const row = y * 8 + j;
                for (let i = 0; i < Math.floor(pw / 2); i++) {
                    const a = row * this.width + (x * 8 + i);
                    const b = row * this.width + (x * 8 + pw - 1 - i);
                    [this.pixels[a], this.pixels[b]] = [this.pixels[b], this.pixels[a]];
                }
            }
            // Flip attributes horizontally
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < Math.floor(w / 2); i++) {
                    const a = (y + j) * cols + (x + i);
                    const b = (y + j) * cols + (x + w - 1 - i);
                    [this.attributes[a], this.attributes[b]] = [this.attributes[b], this.attributes[a]];
                }
            }
        } else {
            // Flip pixels vertically (mirror each column)
            for (let j = 0; j < Math.floor(ph / 2); j++) {
                for (let i = 0; i < pw; i++) {
                    const a = (y * 8 + j) * this.width + (x * 8 + i);
                    const b = (y * 8 + ph - 1 - j) * this.width + (x * 8 + i);
                    [this.pixels[a], this.pixels[b]] = [this.pixels[b], this.pixels[a]];
                }
            }
            // Flip attributes vertically
            for (let j = 0; j < Math.floor(h / 2); j++) {
                for (let i = 0; i < w; i++) {
                    const a = (y + j) * cols + (x + i);
                    const b = (y + h - 1 - j) * cols + (x + i);
                    [this.attributes[a], this.attributes[b]] = [this.attributes[b], this.attributes[a]];
                }
            }
        }

        this.render();
    }

    invertPixels() {
        this.saveHistory();
        const cols = this.width / 8;
        if (this.selection) {
            const { x, y, w, h } = this.selection;
            for (let j = 0; j < h * 8; j++) {
                for (let i = 0; i < w * 8; i++) {
                    const idx = (y * 8 + j) * this.width + (x * 8 + i);
                    this.pixels[idx] = this.pixels[idx] ? 0 : 1;
                }
            }
        } else {
            for (let i = 0; i < this.pixels.length; i++) {
                this.pixels[i] = this.pixels[i] ? 0 : 1;
            }
        }
        this.render();
    }

    invertAttrs() {
        this.saveHistory();
        const cols = this.width / 8;
        const swapInkPaper = (attr) => {
            const f = (attr >> 7) & 1;
            const b = (attr >> 6) & 1;
            const paper = (attr >> 3) & 0x07;
            const ink = attr & 0x07;
            return (f << 7) | (b << 6) | (ink << 3) | paper;
        };
        if (this.selection) {
            const { x, y, w, h } = this.selection;
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    const idx = (y + j) * cols + (x + i);
                    this.attributes[idx] = swapInkPaper(this.attributes[idx]);
                }
            }
        } else {
            for (let i = 0; i < this.attributes.length; i++) {
                this.attributes[i] = swapInkPaper(this.attributes[i]);
            }
        }
        this.render();
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Animation Viewer ─────────────────────────────────────────────────────
    setupAnimationViewer() {
        document.getElementById('anim-frame-w').onchange = () => {
            this.animCurrentFrame = 0;
            this.resetAnimPlayer();
        };
        document.getElementById('anim-fps').onchange = () => {
            if (this.animInterval) { this.stopAnimation(); this.startAnimation(); }
        };
        document.getElementById('anim-play-btn').onclick = () => {
            if (this.animInterval) this.stopAnimation();
            else this.startAnimation();
        };
        this.renderAnimFrame();
    }

    getAnimParams() {
        const frameW = Math.max(1, parseInt(document.getElementById('anim-frame-w').value) || 1);
        const fps    = Math.max(1, parseInt(document.getElementById('anim-fps').value) || 8);
        return { frameW, fps };
    }

    resetAnimPlayer() {
        if (this.animInterval) { this.stopAnimation(); this.startAnimation(); }
        else this.renderAnimFrame();
    }

    startAnimation() {
        if (!this.clipboard) return;
        this.stopAnimation();
        this.renderAnimFrame();
        const tick = () => {
            const { frameW } = this.getAnimParams();
            const total = Math.max(1, Math.floor(this.clipboard.w / frameW));
            this.animCurrentFrame = (this.animCurrentFrame + 1) % total;
            this.renderAnimFrame();
        };
        const { fps } = this.getAnimParams();
        this.animInterval = setInterval(tick, 1000 / fps);
        document.getElementById('anim-play-btn').textContent = '\u23f9 Stop';
    }

    stopAnimation() {
        if (this.animInterval) { clearInterval(this.animInterval); this.animInterval = null; }
        document.getElementById('anim-play-btn').textContent = '\u25b6 Play';
    }

    renderAnimFrame() {
        const canvas = document.getElementById('anim-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (!this.clipboard) {
            canvas.width = 64; canvas.height = 32;
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, 64, 32);
            document.getElementById('anim-info').textContent = 'Copy a selection to preview';
            return;
        }

        const { frameW } = this.getAnimParams();
        const { pixels, attributes, w, h } = this.clipboard;
        const totalFrames = Math.max(1, Math.floor(w / frameW));
        const frameIdx    = this.animCurrentFrame % totalFrames;

        const fPixW = frameW * 8;
        const fPixH = h * 8;
        const panelW = 220;
        const scale  = Math.max(1, Math.floor(panelW / fPixW));

        canvas.width  = fPixW * scale;
        canvas.height = fPixH * scale;

        const imgData = ctx.createImageData(canvas.width, canvas.height);
        const data = imgData.data;

        for (let py = 0; py < fPixH; py++) {
            for (let px = 0; px < fPixW; px++) {
                const srcX = frameIdx * fPixW + px;
                if (srcX >= w * 8) continue;
                const bx = Math.floor(srcX / 8);
                const by = Math.floor(py / 8);
                const attr  = attributes[by * w + bx] || 0;
                const flash  = (attr >> 7) & 1;
                const bright = (attr >> 6) & 1;
                const ink    = attr & 0x07;
                const paper  = (attr >> 3) & 0x07;
                let inkC   = this.hexToRgb(SPECTRUM_PALETTE[bright][ink]);
                let paperC = this.hexToRgb(SPECTRUM_PALETTE[bright][paper]);
                if (flash && this.flashInverted) [inkC, paperC] = [paperC, inkC];
                const color = pixels[py * (w * 8) + srcX] ? inkC : paperC;
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const i = ((py * scale + sy) * canvas.width + (px * scale + sx)) * 4;
                        data[i] = color.r; data[i+1] = color.g; data[i+2] = color.b; data[i+3] = 255;
                    }
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
        document.getElementById('anim-info').textContent =
            `Frame ${frameIdx + 1}/${totalFrames} · ${frameW}×${h} blocks`;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Undo / Redo ──────────────────────────────────────────────────────────
    saveHistory() {
        const MAX = 50;
        this.undoStack.push({
            pixels: this.pixels.slice(),
            attributes: this.attributes.slice()
        });
        if (this.undoStack.length > MAX) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (!this.undoStack.length) return;
        this.redoStack.push({
            pixels: this.pixels.slice(),
            attributes: this.attributes.slice()
        });
        const state = this.undoStack.pop();
        this.pixels = state.pixels;
        this.attributes = state.attributes;
        this.render();
    }

    redo() {
        if (!this.redoStack.length) return;
        this.undoStack.push({
            pixels: this.pixels.slice(),
            attributes: this.attributes.slice()
        });
        const state = this.redoStack.pop();
        this.pixels = state.pixels;
        this.attributes = state.attributes;
        this.render();
    }
    // ─────────────────────────────────────────────────────────────────────────

    getCurrentAttrByte() {
        // F B P P P I I I
        return (this.flash << 7) | (this.bright << 6) | (this.paper << 3) | this.ink;
    }

    setTool(tool) {
        this.currentTool = tool;
        this.isPasting = false;
        document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
        if (document.getElementById(`tool-${tool}`)) {
            document.getElementById(`tool-${tool}`).classList.add('active');
        }
        
        // Update cursor
        const cursorMap = { select: 'cell', text: 'text' };
        this.canvasWrapper.style.cursor = cursorMap[tool] || 'crosshair';
        
        this.drawSelection();
    }

    updateZoom() {
        this.canvas.style.width = (this.width * this.zoom) + 'px';
        this.canvas.style.height = (this.height * this.zoom) + 'px';
        
        // Grid canvas should have actual pixel resolution for sharpness
        this.gridCanvas.width = this.width * this.zoom;
        this.gridCanvas.height = this.height * this.zoom;
        this.gridCanvas.style.width = (this.width * this.zoom) + 'px';
        this.gridCanvas.style.height = (this.height * this.zoom) + 'px';

        this.selCanvas.width = this.width * this.zoom;
        this.selCanvas.height = this.height * this.zoom;
        this.selCanvas.style.width = (this.width * this.zoom) + 'px';
        this.selCanvas.style.height = (this.height * this.zoom) + 'px';
        
        document.getElementById('zoom-level').innerText = (this.zoom * 100) + '%';
        this.drawGrid();
        this.drawSelection();
    }

    updateUI() {
        const preview = document.getElementById('current-attr-preview');
        const normalPalette = SPECTRUM_PALETTE[this.bright];
        
        preview.style.backgroundColor = normalPalette[this.paper];
        preview.style.color = normalPalette[this.ink];
        preview.innerText = 'Aa';
        
        document.getElementById('attr-info').innerText = `Ink: ${this.ink}, Paper: ${this.paper}, B: ${this.bright}, F: ${this.flash}`;
        
        if (this.isPasting) {
            this.drawSelection();
        }

        // Update palette colors to reflect Bright toggle
        document.querySelectorAll('#ink-palette .color-swatch').forEach((s, i) => {
            s.style.backgroundColor = SPECTRUM_PALETTE[this.bright][i];
        });
        document.querySelectorAll('#paper-palette .color-swatch').forEach((s, i) => {
            s.style.backgroundColor = SPECTRUM_PALETTE[this.bright][i];
        });
    }

    updateStatus(x, y) {
        document.getElementById('status-coords').innerText = `X: ${x} Y: ${y}`;
        const bx = Math.floor(x / 8);
        const by = Math.floor(y / 8);
        document.getElementById('status-block').innerText = `Block: ${bx}, ${by}`;
        document.getElementById('status-size').innerText = `Size: ${this.width}x${this.height}`;
    }

    drawGrid() {
        this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        if (!this.gridVisible) return;
        
        // Golden Spectrum color
        this.gridCtx.strokeStyle = '#D7D700'; 
        this.gridCtx.lineWidth = 1;

        this.gridCtx.beginPath();
        // 8x8 blocks scaled by zoom
        const step = 8 * this.zoom;
        
        for (let x = 0; x <= this.gridCanvas.width; x += step) {
            this.gridCtx.moveTo(x, 0);
            this.gridCtx.lineTo(x, this.gridCanvas.height);
        }
        for (let y = 0; y <= this.gridCanvas.height; y += step) {
            this.gridCtx.moveTo(0, y);
            this.gridCtx.lineTo(this.gridCanvas.width, y);
        }
        this.gridCtx.stroke();
    }

    drawSelection() {
        this.selCtx.clearRect(0, 0, this.selCanvas.width, this.selCanvas.height);
        
        let area = null;
        let color = '#fff';

        if (this.isPasting && this.clipboard) {
            area = {
                x: this.pastePos.bx,
                y: this.pastePos.by,
                w: this.clipboard.w,
                h: this.clipboard.h
            };
            color = '#00ff00'; // Green for paste preview
        } else if (this.selection) {
            area = this.selection;
        }

        if (area) {
            this.selCtx.strokeStyle = color;
            this.selCtx.setLineDash([5, 5]);
            this.selCtx.lineWidth = 2;
            this.selCtx.strokeRect(
                area.x * 8 * this.zoom,
                area.y * 8 * this.zoom,
                area.w * 8 * this.zoom,
                area.h * 8 * this.zoom
            );
        }
    }

    // Clipboard Logic
    copySelection() {
        if (!this.selection) {
            alert('Selection required! Switch to select tool (S) and drag an area.');
            return;
        }

        const { x, y, w, h } = this.selection;
        const clipPixels = new Uint8Array(w * 8 * h * 8);
        const clipAttrs = new Uint8Array(w * h);

        try {
            for (let j = 0; j < h * 8; j++) {
                for (let i = 0; i < w * 8; i++) {
                    const px = (x * 8 + i);
                    const py = (y * 8 + j);
                    clipPixels[j * (w * 8) + i] = this.pixels[py * this.width + px];
                }
            }

            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    clipAttrs[j * w + i] = this.attributes[(y+j) * (this.width / 8) + (x+i)];
                }
            }

            this.clipboard = { pixels: clipPixels, attributes: clipAttrs, w, h };
            this.animCurrentFrame = 0;
            this.renderAnimFrame();
            this.selection = null; // Clear selection after copy
            this.drawSelection();
        } catch (e) {
            console.error('Copy failed', e);
            alert('Selection error. Try staying within bounds.');
        }
    }

    startPaste() {
        if (!this.clipboard) {
            alert('No content copied. Select an area and press Ctrl+C.');
            return;
        }
        this.currentTool = 'draw'; // Switch tool without clearing isPasting
        document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
        if (document.getElementById('tool-draw')) {
            document.getElementById('tool-draw').classList.add('active');
        }
        this.isPasting = true;
        this.canvasWrapper.style.cursor = 'move';
        this.drawSelection();
    }

    executePaste(bx, by) {
        if (!this.clipboard) return;
        
        const { pixels, attributes, w, h } = this.clipboard;

        for (let j = 0; j < h * 8; j++) {
            for (let i = 0; i < w * 8; i++) {
                const tx = (bx * 8 + i);
                const ty = (by * 8 + j);
                if (tx < this.width && ty < this.height) {
                    this.pixels[ty * this.width + tx] = pixels[j * (w * 8) + i];
                }
            }
        }

        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
                const tbx = bx + i;
                const tby = by + j;
                if (tbx < (this.width / 8) && tby < (this.height / 8)) {
                    this.attributes[tby * (this.width / 8) + tbx] = attributes[j * w + i];
                }
            }
        }

        this.isPasting = false;
        this.canvasWrapper.style.cursor = 'crosshair';
        this.render();
        this.drawSelection();
    }

    render() {
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let by = 0; by < this.height / 8; by++) {
            for (let bx = 0; bx < this.width / 8; bx++) {
                const attr = this.attributes[by * (this.width / 8) + bx];
                const flash = (attr >> 7) & 0x01;
                const ink = attr & 0x07;
                const paper = (attr >> 3) & 0x07;
                const bright = (attr >> 6) & 0x01;
                
                let inkColor = this.hexToRgb(SPECTRUM_PALETTE[bright][ink]);
                let paperColor = this.hexToRgb(SPECTRUM_PALETTE[bright][paper]);

                if (flash && this.flashInverted) {
                    [inkColor, paperColor] = [paperColor, inkColor];
                }

                for (let py = 0; py < 8; py++) {
                    for (let px = 0; px < 8; px++) {
                        const x = bx * 8 + px;
                        const y = by * 8 + py;
                        const isSet = this.pixels[y * this.width + x];
                        const color = isSet ? inkColor : paperColor;
                        
                        const idx = (y * this.width + x) * 4;
                        data[idx] = color.r;
                        data[idx + 1] = color.g;
                        data[idx + 2] = color.b;
                        data[idx + 3] = 255;
                    }
                }
            }
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // .zxp Format Logic
    exportToZXP() {
        let lines = ['ZX-Paintbrush image', ''];
        
        // Bitmap section
        for (let y = 0; y < this.height; y++) {
            let row = '';
            for (let x = 0; x < this.width; x++) {
                row += this.pixels[y * this.width + x] ? '1' : '0';
            }
            lines.push(row);
        }
        
        lines.push(''); // Blank line separator
        
        // Attribute section
        for (let by = 0; by < this.height / 8; by++) {
            let attrRow = [];
            for (let bx = 0; bx < this.width / 8; bx++) {
                const attr = this.attributes[by * (this.width / 8) + bx];
                attrRow.push(attr.toString(16).toUpperCase().padStart(2, '0'));
            }
            lines.push(attrRow.join(' '));
        }
        
        return lines.join('\n');
    }

    importFromZXP(content) {
        const lines = content.split(/\r?\n/);
        if (lines[0] !== 'ZX-Paintbrush image') {
            alert('Invalid .zxp file.');
            return;
        }

        let bitmapRows = [];
        let attrRows = [];
        let parsingAttributes = false;
        
        // Skip header lines
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '' && bitmapRows.length > 0) {
                parsingAttributes = true;
                continue;
            }
            
            if (!parsingAttributes) {
                if (/^[01]+$/.test(line)) {
                    bitmapRows.push(line);
                }
            } else {
                if (line !== '') {
                    attrRows.push(line.split(/\s+/));
                }
            }
        }

        if (bitmapRows.length === 0) return;

        const h = bitmapRows.length;
        const w = bitmapRows[0].length;
        
        this.resetData(w, h);
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                this.pixels[y * w + x] = bitmapRows[y][x] === '1' ? 1 : 0;
            }
        }

        let attrFlat = attrRows.flat();
        for (let i = 0; i < Math.min(this.attributes.length, attrFlat.length); i++) {
            this.attributes[i] = parseInt(attrFlat[i], 16);
        }
    }
}

window.onload = () => {
    window.zxDraw = new ZXDraw();
};
