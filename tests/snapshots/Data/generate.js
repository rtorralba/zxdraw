/**
 * Generates snapshot files for data_export.test.js.
 * Run with: node tests/snapshots/Data/generate.js
 *
 * Always regenerate when export/data.js changes AND the output has been
 * manually verified against SevenuP v1.20.
 */
const fs   = require('fs');
const path = require('path');

global.window = {};
require('../../../export/data.js');

const SNAP_DIR = __dirname;

// ── ZXP parser ─────────────────────────────────────────────────────────────
function parseZXP(content) {
    const lines = content.replace(/\r/g, '').split('\n');
    const pixelRows = lines.filter(l => /^[01]+$/.test(l));
    const attrRows  = lines.filter(l => /^[0-9A-Fa-f]{2}(\s+[0-9A-Fa-f]{2})+$/.test(l));

    const imgWidth   = pixelRows.length > 0 ? pixelRows[0].length : 0;
    const imgHeight  = pixelRows.length;
    const x_charsize = Math.floor(imgWidth  / 8);
    const y_charsize = Math.floor(imgHeight / 8);

    const pixels = new Uint8Array(imgWidth * imgHeight);
    for (let y = 0; y < pixelRows.length; y++)
        for (let x = 0; x < pixelRows[y].length; x++)
            pixels[y * imgWidth + x] = pixelRows[y][x] === '1' ? 1 : 0;

    const attributes = new Uint8Array(x_charsize * y_charsize);
    for (let row = 0; row < attrRows.length; row++) {
        const vals = attrRows[row].trim().split(/\s+/).map(v => parseInt(v, 16));
        for (let col = 0; col < vals.length; col++)
            attributes[row * x_charsize + col] = vals[col];
    }

    return { pixels, attributes, imgWidth, imgHeight };
}

// ──────────────────────────────────────────────────────────────────────────────
// All combinations to generate
// name: used as the snapshot filename stem
// Each entry also used as label in the test file
// ──────────────────────────────────────────────────────────────────────────────
const COMBINATIONS = [
    // ── gfx+attr / Sprite interleave – various priority orders ───────────────
    {
        stem: 'output_gfx+attr_xchar_sprite',     // already exists — keep as reference
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:5 },
    },
    {
        stem: 'output_gfx+attr_ychar_sprite',
        // Sort: Y char, X char, Char line (innermost first)
        opts: { name:'input', type:'gfx+attr', priorities:[2,0,1,3,4], interleave:5 },
    },
    {
        stem: 'output_gfx+attr_linexchar_sprite',
        // Sort: Char line, X char, Y char
        opts: { name:'input', type:'gfx+attr', priorities:[1,0,2,3,4], interleave:5 },
    },
    // ── different interleave values ──────────────────────────────────────────
    {
        stem: 'output_gfx+attr_xchar_line',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:0 },
    },
    {
        stem: 'output_gfx+attr_xchar_char',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:1 },
    },
    {
        stem: 'output_gfx+attr_xchar_col',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:2 },
    },
    // ── different output types ───────────────────────────────────────────────
    {
        stem: 'output_attr+gfx_xchar_sprite',
        opts: { name:'input', type:'attr+gfx', priorities:[0,1,2,3,4], interleave:5 },
    },
    {
        stem: 'output_gfx_xchar_sprite',
        opts: { name:'input', type:'gfx',      priorities:[0,1,2,3,4], interleave:5 },
    },
    {
        stem: 'output_attr_xchar_sprite',
        opts: { name:'input', type:'attr',     priorities:[0,1,2,3,4], interleave:5 },
    },
    // ── nolabel flag ─────────────────────────────────────────────────────────
    {
        stem: 'output_gfx_xchar_sprite_nolabel',
        opts: { name:'input', type:'gfx', priorities:[0,1,2,3,4], interleave:5, nolabel:true },
    },
];

// ──────────────────────────────────────────────────────────────────────────────
const { pixels, attributes, imgWidth, imgHeight } = parseZXP(
    fs.readFileSync(path.join(SNAP_DIR, 'input.zxp'), 'utf8')
);

let count = 0;
for (const { stem, opts } of COMBINATIONS) {
    const asmPath = path.join(SNAP_DIR, stem + '.asm');
    const binPath = path.join(SNAP_DIR, stem + '.bin');

    const asm = window.ZXExportData(pixels, attributes, imgWidth, imgHeight,
                    { ...opts, format: 'asm' });
    const bin = window.ZXExportData(pixels, attributes, imgWidth, imgHeight,
                    { ...opts, format: 'bin' });

    fs.writeFileSync(asmPath, asm, 'utf8');
    fs.writeFileSync(binPath, bin);
    console.log(`  wrote ${stem}.asm  (${asm.split('\n').length} lines)`);
    console.log(`  wrote ${stem}.bin  (${bin.length} bytes)`);
    count++;
}

console.log(`\nGenerated ${count} sets of snapshot files.`);
console.log('Note: manually verify new outputs against SevenuP v1.20 before committing.');
