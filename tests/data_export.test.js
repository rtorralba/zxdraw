const fs   = require('fs');
const path = require('path');

// Mock window so the exporter can register itself
global.window = {};
require('../export/data.js');

// ── ZXP parser ────────────────────────────────────────────────────────────────
function parseZXP(content) {
    const lines = content.replace(/\r/g, '').split('\n');

    // Pixel rows: lines containing only '0' and '1'
    const pixelRows = lines.filter(l => /^[01]+$/.test(l));
    // Attribute rows: space-separated two-digit hex values
    const attrRows  = lines.filter(l => /^[0-9A-Fa-f]{2}(\s+[0-9A-Fa-f]{2})+$/.test(l));

    const imgWidth  = pixelRows.length > 0 ? pixelRows[0].length : 0;
    const imgHeight = pixelRows.length;
    const x_charsize = Math.floor(imgWidth  / 8);
    const y_charsize = Math.floor(imgHeight / 8);

    const pixels = new Uint8Array(imgWidth * imgHeight);
    for (let y = 0; y < pixelRows.length; y++) {
        for (let x = 0; x < pixelRows[y].length; x++) {
            pixels[y * imgWidth + x] = pixelRows[y][x] === '1' ? 1 : 0;
        }
    }

    const attributes = new Uint8Array(x_charsize * y_charsize);
    for (let row = 0; row < attrRows.length; row++) {
        const vals = attrRows[row].trim().split(/\s+/).map(v => parseInt(v, 16));
        for (let col = 0; col < vals.length; col++) {
            attributes[row * x_charsize + col] = vals[col];
        }
    }

    return { pixels, attributes, imgWidth, imgHeight };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalise(str) {
    return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function stripComments(str) {
    return str.split('\n').filter(l => !l.startsWith(';')).join('\n');
}

// ── Snapshot dir & input ──────────────────────────────────────────────────────
const SNAP_DIR  = path.join(__dirname, 'snapshots', 'Data');
const INPUT_ZXP = path.join(SNAP_DIR, 'input.zxp');

let passed = 0;
let failed = 0;

function assertAsm(stem, actual) {
    const expPath = path.join(SNAP_DIR, stem + '.asm');
    const expected = normalise(fs.readFileSync(expPath, 'utf8'));
    const actualNorm   = stripComments(normalise(actual));
    const expectedNorm = stripComments(expected);
    if (actualNorm === expectedNorm) {
        console.log(`  PASS: ${stem}.asm`);
        passed++;
    } else {
        console.error(`  FAIL: ${stem}.asm`);
        const aLines = actualNorm.split('\n');
        const eLines = expectedNorm.split('\n');
        for (let i = 0; i < Math.max(aLines.length, eLines.length); i++) {
            if (aLines[i] !== eLines[i]) {
                console.error(`    First diff at line ${i + 1}:`);
                console.error(`      expected: ${JSON.stringify(eLines[i])}`);
                console.error(`      actual  : ${JSON.stringify(aLines[i])}`);
                break;
            }
        }
        fs.writeFileSync(path.join(SNAP_DIR, 'actual_' + stem + '.asm'), actual);
        console.error(`    Actual written to: actual_${stem}.asm`);
        failed++;
    }
}

function assertBin(stem, actual) {
    const expPath = path.join(SNAP_DIR, stem + '.bin');
    const expected = new Uint8Array(fs.readFileSync(expPath));
    const ok = actual.length === expected.length &&
               actual.every((b, i) => b === expected[i]);
    if (ok) {
        console.log(`  PASS: ${stem}.bin`);
        passed++;
    } else {
        console.error(`  FAIL: ${stem}.bin  (expected ${expected.length} bytes, got ${actual.length})`);
        fs.writeFileSync(path.join(SNAP_DIR, 'actual_' + stem + '.bin'), actual);
        console.error(`    Actual written to: actual_${stem}.bin`);
        failed++;
    }
}

// ── Load image ────────────────────────────────────────────────────────────────
console.log('Running Data Export Snapshot Tests...\n');

const { pixels, attributes, imgWidth, imgHeight } = parseZXP(
    fs.readFileSync(INPUT_ZXP, 'utf8')
);

// ── Test cases ────────────────────────────────────────────────────────────────
// Each entry mirrors a combination in generate.js
const CASES = [
    // ── Priority order: X char, Char line, Y char (SevenuP default) ──────────
    {
        stem: 'output_gfx+attr_xchar_sprite',
        desc: 'Gfx+Attr | X char, Char line, Y char | Sprite interleave (SevenuP reference)',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:5 },
    },
    // ── Priority order: Y char, X char, Char line ─────────────────────────────
    {
        stem: 'output_gfx+attr_ychar_sprite',
        desc: 'Gfx+Attr | Y char, X char, Char line | Sprite interleave',
        opts: { name:'input', type:'gfx+attr', priorities:[2,0,1,3,4], interleave:5 },
    },
    // ── Priority order: Char line, X char, Y char ─────────────────────────────
    {
        stem: 'output_gfx+attr_linexchar_sprite',
        desc: 'Gfx+Attr | Char line, X char, Y char | Sprite interleave',
        opts: { name:'input', type:'gfx+attr', priorities:[1,0,2,3,4], interleave:5 },
    },
    // ── Interleave: Line ──────────────────────────────────────────────────────
    {
        stem: 'output_gfx+attr_xchar_line',
        desc: 'Gfx+Attr | X char, Char line, Y char | Line interleave',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:0 },
    },
    // ── Interleave: Character ──────────────────────────────────────────────────
    {
        stem: 'output_gfx+attr_xchar_char',
        desc: 'Gfx+Attr | X char, Char line, Y char | Character interleave',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:1 },
    },
    // ── Interleave: Column ────────────────────────────────────────────────────
    {
        stem: 'output_gfx+attr_xchar_col',
        desc: 'Gfx+Attr | X char, Char line, Y char | Column interleave',
        opts: { name:'input', type:'gfx+attr', priorities:[0,1,2,3,4], interleave:2 },
    },
    // ── Output type: Attr+Gfx ────────────────────────────────────────────────
    {
        stem: 'output_attr+gfx_xchar_sprite',
        desc: 'Attr+Gfx | X char, Char line, Y char | Sprite interleave',
        opts: { name:'input', type:'attr+gfx', priorities:[0,1,2,3,4], interleave:5 },
    },
    // ── Output type: Gfx only ────────────────────────────────────────────────
    {
        stem: 'output_gfx_xchar_sprite',
        desc: 'Gfx only | X char, Char line, Y char | Sprite interleave',
        opts: { name:'input', type:'gfx',      priorities:[0,1,2,3,4], interleave:5 },
    },
    // ── Output type: Attr only ───────────────────────────────────────────────
    {
        stem: 'output_attr_xchar_sprite',
        desc: 'Attr only | X char, Char line, Y char | Sprite interleave',
        opts: { name:'input', type:'attr',     priorities:[0,1,2,3,4], interleave:5 },
    },
    // ── nolabel flag ─────────────────────────────────────────────────────────
    {
        stem: 'output_gfx_xchar_sprite_nolabel',
        desc: 'Gfx only | nolabel flag',
        opts: { name:'input', type:'gfx', priorities:[0,1,2,3,4], interleave:5, nolabel:true },
    },
];

for (const { stem, desc, opts } of CASES) {
    console.log(`  [${desc}]`);
    assertAsm(stem, window.ZXExportData(pixels, attributes, imgWidth, imgHeight, { ...opts, format:'asm' }));
    assertBin(stem, window.ZXExportData(pixels, attributes, imgWidth, imgHeight, { ...opts, format:'bin' }));
    console.log('');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

