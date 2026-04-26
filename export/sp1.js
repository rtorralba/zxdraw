/**
 * SP1 Sprite Exporter for ZXDrawer
 * Converts ZX Spectrum pixel data into z88dk SP1-compatible ASM.
 *
 * Based on the algorithm from png2sp1sprite by Jordi Sesmero:
 *   https://github.com/jsmolina/png2sp1sprite
 *
 * Format: each 8-pixel-wide column of the sprite becomes a PUBLIC label.
 * With mask enabled, each pixel row outputs: defb @maskByte, @spriteByte
 * where maskByte is the bitwise inverse of spriteByte (0=opaque, 1=transparent).
 * A 7-line rotation table header and a 7-line trailing table are added per column.
 */

window.ZXExportSP1 = function(pixels, imgWidth, imgHeight, spriteName, section, useMask) {
    const numCols = Math.floor(imgWidth / 8);
    const lines = [];

    lines.push(`SECTION ${section}`);
    lines.push('');
    lines.push(`; Original: ${imgWidth}, ${imgHeight} (=${numCols} x ${Math.floor(imgHeight / 8)} chars)`);
    lines.push(`; Blocks: ${numCols}`);
    if (useMask) lines.push('; mask, sprite');

    // 7-line rotation table header (before first column label)
    for (let i = 0; i < 7; i++) {
        lines.push(useMask ? ' defb @11111111, @00000000' : ' defb @00000000');
    }
    lines.push('');

    for (let colBlock = 0; colBlock < numCols; colBlock++) {
        const blockNum = colBlock + 1;
        lines.push(`PUBLIC _${spriteName}${blockNum}`);
        lines.push(`._${spriteName}${blockNum}`);
        lines.push('');

        for (let y = 0; y < imgHeight; y++) {
            let spriteByte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = colBlock * 8 + bit;
                if (pixels[y * imgWidth + x]) spriteByte |= (1 << (7 - bit));
            }
            const spriteBin = spriteByte.toString(2).padStart(8, '0');
            if (useMask) {
                const maskByte = (~spriteByte) & 0xFF;
                const maskBin = maskByte.toString(2).padStart(8, '0');
                lines.push(` defb @${maskBin}, @${spriteBin}`);
            } else {
                lines.push(` defb @${spriteBin}`);
            }
        }

        lines.push('');
        // 7-line trailing rotation table (max offset within a char is 7; offset 8 = next char at offset 0)
        for (let i = 0; i < 7; i++) {
            lines.push(useMask ? ' defb @11111111, @00000000' : ' defb @00000000');
        }
        lines.push('');
    }

    return lines.join('\n');
};
