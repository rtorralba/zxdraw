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
    // Normalise line endings only; preserve all other content
    return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// ── Snapshot paths ────────────────────────────────────────────────────────────
const SNAP_DIR  = path.join(__dirname, 'snapshots', 'Data');
const INPUT_ZXP = path.join(SNAP_DIR, 'input.zxp');
const EXP_ASM   = path.join(SNAP_DIR, 'output_gfx+attr_xchar_sprite.asm');
const EXP_BIN   = path.join(SNAP_DIR, 'output_gfx+attr_xchar_sprite.bin');

let passed = 0;
let failed = 0;

function assert(label, actual, expected, isBin) {
    let ok;
    if (isBin) {
        ok = actual.length === expected.length &&
             actual.every((b, i) => b === expected[i]);
    } else {
        ok = actual === expected;
    }

    if (ok) {
        console.log(`  PASS: ${label}`);
        passed++;
    } else {
        console.error(`  FAIL: ${label}`);
        if (!isBin) {
            // Find first differing line
            const aLines = actual.split('\n');
            const eLines = expected.split('\n');
            const maxL   = Math.max(aLines.length, eLines.length);
            for (let i = 0; i < maxL; i++) {
                if (aLines[i] !== eLines[i]) {
                    console.error(`    First diff at line ${i + 1}:`);
                    console.error(`      expected: ${JSON.stringify(eLines[i])}`);
                    console.error(`      actual  : ${JSON.stringify(aLines[i])}`);
                    break;
                }
            }
            // Write actual output for diffing
            const actualPath = path.join(SNAP_DIR, 'actual_output.asm');
            fs.writeFileSync(actualPath, actual);
            console.error(`    Actual output written to: ${actualPath}`);
        } else {
            const actualPath = path.join(SNAP_DIR, 'actual_output.bin');
            fs.writeFileSync(actualPath, actual);
            console.error(`    Actual output written to: ${actualPath}`);
        }
        failed++;
    }
}

// ── Run tests ─────────────────────────────────────────────────────────────────
console.log('Running Data Snapshot Tests...\n');

const { pixels, attributes, imgWidth, imgHeight } = parseZXP(
    fs.readFileSync(INPUT_ZXP, 'utf8')
);

// Options matching output_gfx+attr_xchar_sprite.*
//   Sort: X char (0), Char line (1), Y char (2) — innermost first
//   Data: Gfx+Attr   Interleave: Sprite (5)
const OPTIONS = {
    name:       'input',
    type:       'gfx+attr',
    priorities: [0, 1, 2, 3, 4],
    interleave: 5,
    nolabel:    false,
};

// ── ASM test ──────────────────────────────────────────────────────────────────
const expectedAsm = normalise(fs.readFileSync(EXP_ASM, 'utf8'));
const actualAsm   = window.ZXExportData(pixels, attributes, imgWidth, imgHeight,
                        { ...OPTIONS, format: 'asm' });
assert('output_gfx+attr_xchar_sprite.asm matches snapshot', actualAsm, expectedAsm, false);

// ── BIN test ──────────────────────────────────────────────────────────────────
const expectedBin = new Uint8Array(fs.readFileSync(EXP_BIN));
const actualBin   = window.ZXExportData(pixels, attributes, imgWidth, imgHeight,
                        { ...OPTIONS, format: 'bin' });
assert('output_gfx+attr_xchar_sprite.bin matches snapshot',
    actualBin, expectedBin, true);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

