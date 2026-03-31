/**
 * Standard Data Exporter for ZXDraw
 * Allows flexible byte ordering, data interleaving, and ASM/BIN output.
 */

window.ZXExportData = function(pixels, attributes, imgWidth, imgHeight, w, rows, cols, options) {
    const { name, type, sort, format, nolabel } = options;
    const total_sprites = rows * cols;
    const spriteWChars = w / 8;
    const spriteHChars = w / 8; // Assuming square sprites for now as per other exporters

    const getSpriteBytes = (sIdx) => {
        const sRow = Math.floor(sIdx / cols);
        const sCol = sIdx % cols;
        const startBlockX = (options.startX || 0) + sCol * spriteWChars;
        const startBlockY = (options.startY || 0) + sRow * spriteHChars;

        let spriteBytes = [];
        let spriteAttrs = [];

        // Determine loop order based on sort parameter
        // sort can be: x_line_y, y_x_line, line_x_y, line_y_x
        // We'll map these to a prioritized list of loops: 'cx', 'cy', 'line'
        let order = [];
        switch(sort) {
            case 'y_x_line': order = ['cy', 'cx', 'line']; break;
            case 'line_x_y': order = ['line', 'cx', 'cy']; break;
            case 'line_y_x': order = ['line', 'cy', 'cx']; break;
            case 'x_line_y': 
            default:         order = ['cx', 'line', 'cy']; break;
        }

        const runLoops = (depth, currentIndices) => {
            if (depth === 3) {
                const { cx, cy, line } = currentIndices;
                // Process Pixel Byte
                const py = (startBlockY + cy) * 8 + line;
                const pxBase = (startBlockX + cx) * 8;
                let byteVal = 0;
                for (let x = 0; x < 8; x++) {
                    const px = pxBase + x;
                    if (py < imgHeight && px < imgWidth) {
                        if (pixels[py * imgWidth + px]) {
                            byteVal |= (1 << (7 - x));
                        }
                    }
                }
                spriteBytes.push(byteVal);
                
                // Process Attribute Byte (only once per char block, usually at line 0 or end)
                if (line === 0) {
                    const attrIdx = (startBlockY + cy) * (imgWidth / 8) + (startBlockX + cx);
                    spriteAttrs.push(attributes[attrIdx]);
                }
                return;
            }

            const loopVar = order[depth];
            let limit = 0;
            if (loopVar === 'cx') limit = spriteWChars;
            else if (loopVar === 'cy') limit = spriteHChars;
            else if (loopVar === 'line') limit = 8;

            for (let i = 0; i < limit; i++) {
                currentIndices[loopVar] = i;
                runLoops(depth + 1, currentIndices);
            }
        };

        runLoops(0, {});

        // Data Outputted: gfx_attr, attr_gfx, gfx, attr
        let finalData = [];
        if (type === 'gfx_attr') {
            finalData = [...spriteBytes, ...spriteAttrs];
        } else if (type === 'attr_gfx') {
            finalData = [...spriteAttrs, ...spriteBytes];
        } else if (type === 'gfx') {
            finalData = spriteBytes;
        } else if (type === 'attr') {
            finalData = spriteAttrs;
        }
        return finalData;
    };

    let allData = [];
    for (let i = 0; i < total_sprites; i++) {
        allData.push(getSpriteBytes(i));
    }

    if (format === 'bin') {
        // Concatenate all sprite data into one Uint8Array
        let totalSize = 0;
        allData.forEach(d => totalSize += d.length);
        let bin = new Uint8Array(totalSize);
        let offset = 0;
        allData.forEach(d => {
            bin.set(d, offset);
            offset += d.length;
        });
        return bin;
    } else {
        // ASM Format
        let out = [];
        if (!nolabel) {
            out.push(`; Exported with ZXDraw (Standard)`);
            out.push(`${name}:`);
        }

        for (let i = 0; i < allData.length; i++) {
            let data = allData[i];
            if (!nolabel && allData.length > 1) {
                out.push(`${name}_${i}:`);
            }
            
            for (let chunk = 0; chunk < data.length; chunk += 8) {
                let lineBytes = [];
                for (let b = 0; b < 8 && (chunk + b) < data.length; b++) {
                    let hex = '0' + data[chunk + b].toString(16).toUpperCase().padStart(2, '0') + 'h';
                    lineBytes.push(hex);
                }
                out.push(`    DEFB ` + lineBytes.join(', '));
            }
            if (i < allData.length - 1) out.push('');
        }
        return out.join('\n');
    }
};
