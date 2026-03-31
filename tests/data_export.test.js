// I'll create a standalone test file that mocks the environment.
const fs = require('fs');
// Mock window
global.window = {};

const dataContent = fs.readFileSync('export/data.js', 'utf8');
eval(dataContent); // This will define window.ZXExportData

const pixels = new Uint8Array(64).fill(0); // 8x8
// Set some pixels
pixels[0] = 1; pixels[7] = 1;
const attributes = new Uint8Array(1).fill(0x38); // Paper 7, Ink 0

const options = {
    name: 'test',
    type: 'gfx',
    sort: 'x_line_y',
    format: 'asm',
    nolabel: false,
    startX: 0,
    startY: 0
};

console.log('Testing ZXExportData...');
const output = window.ZXExportData(pixels, attributes, 8, 8, 8, 1, 1, options);
console.log('Output:\n', output);

if (output.includes('DEFB 081h')) {
    console.log('PASSED: Correct byte found (10000001 binary is 081h)');
} else {
    console.log('FAILED: Expected byte not found.');
    process.exit(1);
}
