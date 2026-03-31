const fs = require('fs');
const path = require('path');

// Mock window for the exporter
global.window = {};
require('../export/gusprites.js');

const inputPath = path.join(__dirname, 'snapshots/GuSprites/input.zxp');
const expectedOutputPath = path.join(__dirname, 'snapshots/GuSprites/output.bas');

function runTest() {
    console.log('Running GuSprites Snapshot Test...');

    if (!fs.existsSync(inputPath)) {
        console.error('Input file not found:', inputPath);
        process.exit(1);
    }

    const inputContent = fs.readFileSync(inputPath, 'utf8');
    const lines = inputContent.split('\n').map(l => l.trim());
    
    // ZXP format parsing: lines start from index 2
    let pixels = [];
    // The image is 256x48 (3 rows of 16x16 sprites vertically)
    // We only take the pixel lines (the binary ones)
    const pixelLines = lines.filter(l => l.match(/^[01]+$/));
    
    for (let py = 0; py < pixelLines.length; py++) {
        for (let px = 0; px < pixelLines[py].length; px++) {
            pixels.push(parseInt(pixelLines[py][px]) || 0);
        }
    }

    // Call the exporter
    // window.ZXExportGuSprites = function(pixels, attributes, imgWidth, imgHeight, w, rows, cols, name, matrix, noAttrs)
    const result = window.ZXExportGuSprites(
        pixels, 
        [],    // No attributes needed for this mode
        256,   // imgWidth
        pixelLines.length, // imgHeight 
        16,    // sprite size (w)
        pixelLines.length / 16, // rows
        256 / 16, // cols
        'sprites',
        false, // matrix
        true   // noAttrs
    );

    if (!fs.existsSync(expectedOutputPath)) {
        console.log('Generating new snapshot...');
        fs.writeFileSync(expectedOutputPath, result);
        console.log('Snapshot created at:', expectedOutputPath);
        return;
    }

    const expectedOutput = fs.readFileSync(expectedOutputPath, 'utf8');

    if (result === expectedOutput) {
        console.log('PASSED: Generated output matches snapshot.');
    } else {
        console.error('FAILED: Generated output does NOT match snapshot.');
        console.error('--- EXPECTED ---');
        console.error(expectedOutput.substring(0, 100) + '...');
        console.error('--- ACTUAL ---');
        console.error(result.substring(0, 100) + '...');
        
        // Optionally write a temp file for diffing
        const diffPath = path.join(__dirname, 'snapshots/GuSprites/actual_output.bas');
        fs.writeFileSync(diffPath, result);
        console.error('Actual output written to:', diffPath);
        
        process.exit(1);
    }
}

runTest();
