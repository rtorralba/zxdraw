/**
 * GuSprites Boriel Basic Exporter
 * Converts ZX Spectrum pixel/attribute data into Boriel Basic code blocks using GuSprites format.
 * Format: Columns of 8 pixels wide, scanning from top to bottom (y=0 to w-1).
 */

window.ZXExportGuSprites = function(pixels, attributes, imgWidth, imgHeight, w, rows, cols, name, matrix, noAttrs) {
    const total_sprites = rows * cols;
    
    const extractSprite = (r, c) => {
        let sprite = [];
        let startCol = c * w;
        let startRow = r * w;
        for (let y = 0; y < w; y++) {
            let rowData = [];
            for (let x = 0; x < w; x++) {
                const py = startRow + y;
                const px = startCol + x;
                if (py < imgHeight && px < imgWidth) {
                    rowData.push(pixels[py * imgWidth + px]);
                } else {
                    rowData.push(0);
                }
            }
            sprite.push(rowData);
        }
        return sprite;
    };

    // GuSprites format: 8-pixel wide vertical columns
    const bitmapToBytes = (sprite) => {
        let bytesData = [];
        let charsPerCol = w / 8;
        for (let colBlock = 0; colBlock < charsPerCol; colBlock++) {
            for (let y = 0; y < w; y++) {
                let byteVal = 0;
                for (let xOffset = 0; xOffset < 8; xOffset++) {
                    let x = colBlock * 8 + xOffset;
                    if (sprite[y][x]) {
                        byteVal |= (1 << (7 - xOffset));
                    }
                }
                bytesData.push(byteVal);
            }
        }
        return bytesData;
    };

    let flatTiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let sprite = extractSprite(r, c);
            flatTiles.push(bitmapToBytes(sprite));
        }
    }

    let out = [];
    out.push(`'REM --SPRITE SECTION--`);
    out.push(``);
    out.push(`asm`);
    out.push(``);
    out.push(`SPRITE_BUFFER:`);
    
    let offsets = [];
    let currentOffset = 0;
    
    for (let i = 0; i < flatTiles.length; i++) {
        let bytesData = flatTiles[i];
        let sIdx = i.toString().padStart(2, '0');
        out.push(`S${sIdx}_ADDRESS:`);
        
        for (let chunk = 0; chunk < bytesData.length; chunk += 8) {
            let lineBytes = [];
            for (let b = 0; b < 8 && (chunk + b) < bytesData.length; b++) {
                let hex = '0' + bytesData[chunk + b].toString(16).toUpperCase().padStart(2, '0') + 'h';
                lineBytes.push(hex);
            }
            out.push(`    DEFB ` + lineBytes.join(', '));
        }
        out.push('');
        
        offsets.push(currentOffset);
        currentOffset += bytesData.length;
    }

    out.push(`SPRITE_INDEX:`);
    for (let i = 0; i < offsets.length; i++) {
        out.push(`    DEFW (SPRITE_BUFFER + ${offsets[i]})`);
    }

    out.push(``);
    out.push(`SPRITE_COUNT:`);
    out.push(`    DEFB ${flatTiles.length}`);
    out.push(``);
    out.push(`end asm`);
    out.push(``);

    return out.join('\n');
};
