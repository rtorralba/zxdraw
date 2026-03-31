const fs = require('fs');
const path = require('path');

// Mock window for the exporter
global.window = {};
require('../export/putchars.js');

function parseZXP(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim());
    
    // Pixel lines (binary): must be long strings of 0s and 1s with no spaces
    const pixelLines = lines.filter(l => l.length > 64 && l.match(/^[01]+$/));
    let pixels = [];
    for (let py = 0; py < pixelLines.length; py++) {
        for (let px = 0; px < pixelLines[py].length; px++) {
            pixels.push(parseInt(pixelLines[py][px]) || 0);
        }
    }

    // Attribute lines (hex): lines which usually have spaces and are shorter or look like hex values
    // In ZXP, attributes usually start after the 48 pixel lines.
    const attrLines = lines.filter(l => l.match(/^([0-9A-F]{2}\s*)+$/i) && !l.match(/^[01]+$/));
    let attributes = [];
    for (let line of attrLines) {
        const bytes = line.split(/\s+/).filter(x => x.length > 0);
        for (let b of bytes) {
            attributes.push(parseInt(b, 16));
        }
    }

    return { pixels, attributes, imgHeight: pixelLines.length };
}

const testCases = [
    {
        name: 'PutChars Sprites',
        inputPath: path.join(__dirname, 'snapshots/PutChars/sprites/input.zxp'),
        expectedOutputPath: path.join(__dirname, 'snapshots/PutChars/sprites/output.bas'),
        config: {
            imgWidth: 256,
            w: 16,
            rows: 3,
            cols: 16,
            name: 'sprite',
            matrix: false,
            noAttrs: true
        }
    },
    {
        name: 'PutChars Tiles',
        inputPath: path.join(__dirname, 'snapshots/PutChars/tiles/input.zxp'),
        expectedOutputPath: path.join(__dirname, 'snapshots/PutChars/tiles/output.bas'),
        config: {
            imgWidth: 256,
            w: 8,
            rows: 6,
            cols: 32,
            name: 'tile',
            matrix: true,
            noAttrs: false
        }
    }
];

function runTests() {
    console.log('Running PutChars Snapshot Tests...');

    for (const tc of testCases) {
        console.log(`- Testing ${tc.name}...`);

        if (!fs.existsSync(tc.inputPath)) {
            console.error(`Input file not found: ${tc.inputPath}`);
            process.exit(1);
        }

        const { pixels, attributes, imgHeight } = parseZXP(tc.inputPath);

        // Call the PutChars exporter
        const result = window.ZXExportPutChars(
            pixels, 
            attributes,
            tc.config.imgWidth,
            imgHeight, 
            tc.config.w,
            tc.config.rows,
            tc.config.cols,
            tc.config.name,
            tc.config.matrix,
            tc.config.noAttrs
        );

        if (!fs.existsSync(tc.expectedOutputPath)) {
            console.log(`Generating new snapshot for ${tc.name}...`);
            fs.writeFileSync(tc.expectedOutputPath, result);
            console.log(`Snapshot created at: ${tc.expectedOutputPath}`);
            continue;
        }

        const expectedOutput = fs.readFileSync(tc.expectedOutputPath, 'utf8');
        const normalize = s => s.replace(/\r\n/g, '\n').trim();

        if (normalize(result) === normalize(expectedOutput)) {
            console.log(`PASSED: ${tc.name} output matches snapshot.`);
        } else {
            console.error(`FAILED: ${tc.name} output does NOT match snapshot.`);
            const diffPath = path.join(path.dirname(tc.expectedOutputPath), `actual_${path.basename(tc.expectedOutputPath)}`);
            fs.writeFileSync(diffPath, result);
            console.error(`Actual output written to: ${diffPath}`);
            process.exit(1);
        }
    }
}

runTests();
