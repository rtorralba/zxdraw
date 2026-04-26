const fs = require('fs');
const path = require('path');

// Mock window for the exporter
global.window = {};
require('../export/sp1.js');

const snapshotDir = path.join(__dirname, 'snapshots/SP1');

// ---------------------------------------------------------------------------
// Pixel data: 8x8 circle derived from png2sp1sprite sample
// (https://github.com/jsmolina/png2sp1sprite/tree/master/sample)
// Frame 1 sprite bytes from circle_sprite_masked.asm:
//   row 0,7: 0x3C = 00111100
//   row 1,6: 0x42 = 01000010
//   row 2-5: 0x81 = 10000001
// ---------------------------------------------------------------------------
function makeCirclePixels(w, h) {
    // 8x8 circle occupies the left 8 columns; any extra columns are blank
    const circleRows = [
        [0,0,1,1,1,1,0,0],  // row 0 → 0x3C
        [0,1,0,0,0,0,1,0],  // row 1 → 0x42
        [1,0,0,0,0,0,0,1],  // row 2 → 0x81
        [1,0,0,0,0,0,0,1],  // row 3 → 0x81
        [1,0,0,0,0,0,0,1],  // row 4 → 0x81
        [1,0,0,0,0,0,0,1],  // row 5 → 0x81
        [0,1,0,0,0,0,1,0],  // row 6 → 0x42
        [0,0,1,1,1,1,0,0],  // row 7 → 0x3C
    ];
    const pixels = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < 8; x++) {
            pixels[y * w + x] = circleRows[y][x];
        }
        // columns 8+ remain 0 (blank)
    }
    return pixels;
}

// ---------------------------------------------------------------------------
// Helper: run one test case and report pass/fail
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function runCase(label, result, snapshotFile) {
    const snapshotPath = path.join(snapshotDir, snapshotFile);

    if (!fs.existsSync(snapshotPath)) {
        // Generate snapshot on first run
        fs.writeFileSync(snapshotPath, result, 'utf8');
        console.log(`  SNAPSHOT CREATED: ${snapshotFile}`);
        passed++;
        return;
    }

    const expected = fs.readFileSync(snapshotPath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
    const normalResult = result.replace(/\r\n/g, '\n').trimEnd();
    if (normalResult === expected) {
        console.log(`  PASSED: ${label}`);
        passed++;
    } else {
        console.error(`  FAILED: ${label}`);
        // Show first differing line
        const expLines = expected.split('\n');
        const gotLines = normalResult.split('\n');
        const maxLines = Math.max(expLines.length, gotLines.length);
        for (let i = 0; i < maxLines; i++) {
            if (expLines[i] !== gotLines[i]) {
                console.error(`    Line ${i + 1}:`);
                console.error(`      expected: ${JSON.stringify(expLines[i])}`);
                console.error(`      actual:   ${JSON.stringify(gotLines[i])}`);
                break;
            }
        }
        failed++;
    }
}

// ---------------------------------------------------------------------------
// Test 1: 8×8 circle, with mask
// Based on the sprite pixel data from the png2sp1sprite sample.
// Mask is computed as bitwise NOT of sprite byte (transparent where pixel=0).
// ---------------------------------------------------------------------------
function testCircleWithMask() {
    const pixels = makeCirclePixels(8, 8);
    const result = window.ZXExportSP1(pixels, 8, 8, 'circle', 'rodata_user', true);
    runCase('8×8 circle sprite with mask', result, 'circle_mask.asm');
}

// ---------------------------------------------------------------------------
// Test 2: 8×8 circle, without mask (bit-only mode)
// ---------------------------------------------------------------------------
function testCircleNoMask() {
    const pixels = makeCirclePixels(8, 8);
    const result = window.ZXExportSP1(pixels, 8, 8, 'circle', 'rodata_user', false);
    runCase('8×8 circle sprite without mask', result, 'circle_nomask.asm');
}

// ---------------------------------------------------------------------------
// Test 3: 16×8 two-column sprite with mask
// Left column = circle (same pixel data as above), right column = blank (all 0)
// The blank column produces sprite=0x00 and mask=0xFF for every row.
// ---------------------------------------------------------------------------
function testTwoColWithMask() {
    const pixels = makeCirclePixels(16, 8);
    const result = window.ZXExportSP1(pixels, 16, 8, 'sprite', 'rodata_user', true);
    runCase('16×8 two-column sprite with mask', result, 'two_col_mask.asm');
}

// ---------------------------------------------------------------------------
// Test 4: custom section name
// Verifies that the SECTION directive uses whatever name is passed in.
// ---------------------------------------------------------------------------
function testCustomSection() {
    const pixels = new Uint8Array(8 * 8); // all blank
    const result = window.ZXExportSP1(pixels, 8, 8, 'mysprite', 'BANK_2', false);
    const firstLine = result.split('\n')[0];
    if (firstLine === 'SECTION BANK_2') {
        console.log('  PASSED: custom section name');
        passed++;
    } else {
        console.error('  FAILED: custom section name');
        console.error(`    expected: "SECTION BANK_2", got: "${firstLine}"`);
        failed++;
    }
}

// ---------------------------------------------------------------------------
// Test 5: sprite name used in PUBLIC labels
// ---------------------------------------------------------------------------
function testSpriteNameInLabels() {
    const pixels = new Uint8Array(8 * 8);
    const result = window.ZXExportSP1(pixels, 8, 8, 'hero', 'rodata_user', false);
    const hasPublic = result.includes('PUBLIC _hero1');
    const hasLabel  = result.includes('._hero1');
    if (hasPublic && hasLabel) {
        console.log('  PASSED: sprite name in PUBLIC labels');
        passed++;
    } else {
        console.error('  FAILED: sprite name in PUBLIC labels');
        console.error(`    PUBLIC _hero1 found: ${hasPublic}, ._hero1 found: ${hasLabel}`);
        failed++;
    }
}

// ---------------------------------------------------------------------------
// Test 6: rotation table counts
// Header must have exactly 7 rotation lines; each column's trailing table 7.
// Use the circle sprite so pixel rows produce different output from rotation rows.
// ---------------------------------------------------------------------------
function testRotationTableCounts() {
    const pixels = makeCirclePixels(8, 8);
    const result = window.ZXExportSP1(pixels, 8, 8, 'sp', 'rodata_user', true);
    const allLines = result.split('\n');
    const rotLine = ' defb @11111111, @00000000';
    const publicIdx = allLines.indexOf('PUBLIC _sp1');
    const headerCount = allLines.slice(0, publicIdx).filter(l => l === rotLine).length;
    const trailingCount = allLines.slice(publicIdx).filter(l => l === rotLine).length;
    if (headerCount === 7 && trailingCount === 7) {
        console.log('  PASSED: rotation table counts (7 header, 7 trailing)');
        passed++;
    } else {
        console.error('  FAILED: rotation table counts');
        console.error(`    header: ${headerCount} (expected 7), trailing: ${trailingCount} (expected 7)`);
        failed++;
    }
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
console.log('Running SP1 Exporter Tests...');
console.log('(Pixel data based on png2sp1sprite sample fixed by @jorgegv1: https://github.com/jsmolina/png2sp1sprite/tree/master/sample)');
console.log('');

testCircleWithMask();
testCircleNoMask();
testTwoColWithMask();
testCustomSection();
testSpriteNameInLabels();
testRotationTableCounts();

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}
