/**
 * Standard Data Exporter for ZXDraw
 * SevenuP-compatible: full 5-priority loop system, mask support,
 * attribute mask, zigzag, z88dk, flexible interleave.
 *
 * Priority indices (p0=innermost .. p4=outermost):
 *   0 = X char, 1 = Char line, 2 = Y char, 3 = Mask, 4 = Frame number
 *
 * Interleave values:
 *   0=Line, 1=Character, 2=Column, 4=Frames, 5=Sprite
 */
window.ZXExportData = function(pixels, attributes, imgWidth, imgHeight, options) {
    const {
        name           = 'sprite',
        type           = 'gfx',       // 'gfx+attr'|'attr+gfx'|'gfx'|'attr'
        priorities     = [0, 1, 2, 3, 4], // p0=innermost to p4=outermost
        interleave     = 5,           // 0=Line,1=Char,2=Col,4=Frames,5=Sprite
        format         = 'asm',
        nolabel        = false,
        maskPixels     = null,        // Uint8Array mask pixel data, or null
        maskfirst      = false,       // true = mask data output before gfx data
        attrMask       = false,       // enable attribute mask substitution
        attrMaskInk    = false,
        attrMaskPaper  = false,
        attrMaskBright = false,
        attrMaskFlash  = false,
        zigzag         = false,       // horizontal zig-zag traversal
        z88dk          = false,       // prepend y/x pixel size bytes
        frames         = 1,           // animation frame count
    } = options;

    const hasMask    = maskPixels != null;
    const maskrev    = maskfirst ? 1 : 0;
    const x_charsize = Math.floor(imgWidth  / 8);
    const y_charsize = Math.floor(imgHeight / 8);

    // opts: 0=Gfx+Attr, 1=Attr+Gfx, 2=Gfx, 3=Attr
    const optsMap = { 'gfx+attr': 0, 'attr+gfx': 1, 'gfx': 2, 'attr': 3 };
    const opts = optsMap[type] !== undefined ? optsMap[type] : 2;

    // Attribute mask byte value (SevenuP formula)
    const attrMaskValue = (attrMaskFlash  ? 128 : 0)
                        + (attrMaskBright ?  64 : 0)
                        + (attrMaskPaper  ?  56 : 0)
                        + (attrMaskInk    ?   7 : 0);

    // Dimension limits indexed by dimension id
    // [x_char, line, y_char, mask_dim, frame, sprite(dummy=1)]
    const lim   = [x_charsize, 8, y_charsize, hasMask ? 2 : 1, frames, 1];
    const atlim = [x_charsize, 1, y_charsize, hasMask ? 2 : 1, frames, 1];

    // pr[i] = which dimension runs at loop level i (0=innermost, 4=outermost)
    const pr = [...priorities, 5]; // pr[5]=5 is the dummy "sprite" dimension

    // rp[k] = which loop level dimension k occupies
    const rp = new Array(6);
    rp[5] = 5;
    for (let i = 0; i < 5; i++) rp[pr[i]] = i;

    // --- Helpers ---
    function getPixByte(pixArr, xc, yc, frameIdx, lineNum) {
        let val = 0;
        const py = (frameIdx * y_charsize + yc) * 8 + lineNum;
        const bx = xc * 8;
        for (let b = 0; b < 8; b++) {
            const px = bx + b;
            if (py < imgHeight * frames && px < imgWidth) {
                if (pixArr[py * imgWidth + px]) val |= (1 << (7 - b));
            }
        }
        return val;
    }

    function getAttrByte(xc, yc, frameIdx) {
        return attributes[(frameIdx * y_charsize + yc) * x_charsize + xc] || 0;
    }

    // --- Build graphics buffer (5-level nested loop) ---
    const graphBuf = [];
    const lop = [0, 0, 0, 0, 0];
    for (lop[4] = 0; lop[4] < lim[pr[4]]; lop[4]++) {
    for (lop[3] = 0; lop[3] < lim[pr[3]]; lop[3]++) {
    for (lop[2] = 0; lop[2] < lim[pr[2]]; lop[2]++) {
    for (lop[1] = 0; lop[1] < lim[pr[1]]; lop[1]++) {
    for (lop[0] = 0; lop[0] < lim[pr[0]]; lop[0]++) {
        const frameIdx  = lop[rp[4]];
        const maskLevel = lop[rp[3]];
        const lineNum   = lop[rp[1]];
        const yc        = lop[rp[2]];

        // Zigzag: flip x_char on odd iterations of the 'line' dimension
        let xc = lop[rp[0]];
        if (zigzag && rp[1] > rp[0] && (lop[rp[1]] % 2) === 1) {
            xc = x_charsize - xc - 1;
        }

        let byteVal;
        if (!hasMask) {
            byteVal = getPixByte(pixels, xc, yc, frameIdx, lineNum);
        } else {
            // maskrev=0 → graphSave[0]=pixels(gfx), graphSave[1]=maskPixels(mask)
            // maskrev=1 → graphSave[0]=maskPixels(mask), graphSave[1]=pixels(gfx)
            const useGfx = (maskLevel === maskrev);
            byteVal = getPixByte(useGfx ? pixels : maskPixels, xc, yc, frameIdx, lineNum);
        }
        graphBuf.push(byteVal);
    }}}}}

    // --- Build attribute buffer ---
    const attrBuf = [];
    const qlop = [0, 0, 0, 0, 0];
    for (qlop[4] = 0; qlop[4] < atlim[pr[4]]; qlop[4]++) {
    for (qlop[3] = 0; qlop[3] < atlim[pr[3]]; qlop[3]++) {
    for (qlop[2] = 0; qlop[2] < atlim[pr[2]]; qlop[2]++) {
    for (qlop[1] = 0; qlop[1] < atlim[pr[1]]; qlop[1]++) {
    for (qlop[0] = 0; qlop[0] < atlim[pr[0]]; qlop[0]++) {
        const frameIdx  = qlop[rp[4]];
        const maskLevel = qlop[rp[3]];
        const xc        = qlop[rp[0]];
        const yc        = qlop[rp[2]];

        if (!hasMask) {
            attrBuf.push(getAttrByte(xc, yc, frameIdx));
        } else if (maskLevel === maskrev) {
            attrBuf.push(getAttrByte(xc, yc, frameIdx));
        } else if (attrMask) {
            attrBuf.push(attrMaskValue);
        }
        // else: no attr output for the mask side when attrMask=false
    }}}}}

    // --- Interleave mixer (Gfx+Attr / Attr+Gfx) ---
    const saisGr = graphBuf.length;
    const saisAt = attrBuf.length;
    let finalData;

    if (opts === 2) {
        finalData = graphBuf;
    } else if (opts === 3) {
        finalData = attrBuf;
    } else {
        let intlv = interleave;
        if (rp[intlv] < rp[1]) intlv = 1; // can't interleave inner than line

        let multGr = 1;
        for (let i = 0; i <= rp[intlv]; i++) multGr *= lim[pr[i]];
        let multAt   = Math.floor(multGr / 8);
        let multMask = 0;
        const steps  = Math.floor(saisGr / multGr);

        if (saisAt > 0 && Math.round(saisGr / saisAt) === 16) {
            // Masked sprite: gfx ratio 16:1 vs attrs
            if (rp[3] < rp[intlv]) {
                multAt = Math.floor(multAt / 2);
            } else {
                multMask = 1;
                for (let i = rp[intlv] + 1; i < rp[3]; i++) multMask *= lim[pr[i]];
            }
        }

        finalData = [];
        let gIdx = 0, aIdx = 0, mIdx = 0;
        for (let i = 0; i < steps; i++) {
            if (opts === 0) { // Gfx then Attr
                for (let j = 0; j < multGr; j++) finalData.push(graphBuf[gIdx++]);
                if (multMask === 0) {
                    for (let j = 0; j < multAt; j++) finalData.push(attrBuf[aIdx++]);
                } else {
                    if (Math.floor(mIdx / multMask) % 2 === maskrev) {
                        for (let j = 0; j < multAt; j++) finalData.push(attrBuf[aIdx++]);
                    }
                    mIdx++;
                }
            } else { // Attr then Gfx
                if (multMask === 0) {
                    for (let j = 0; j < multAt; j++) finalData.push(attrBuf[aIdx++]);
                } else {
                    if (Math.floor(mIdx / multMask) % 2 === maskrev) {
                        for (let j = 0; j < multAt; j++) finalData.push(attrBuf[aIdx++]);
                    }
                    mIdx++;
                }
                for (let j = 0; j < multGr; j++) finalData.push(graphBuf[gIdx++]);
            }
        }
    }

    // --- Output: BIN ---
    if (format === 'bin') {
        const extra = z88dk ? 2 : 0;
        const bin = new Uint8Array(finalData.length + extra);
        let offset = 0;
        if (z88dk) { bin[offset++] = imgHeight; bin[offset++] = imgWidth % 256; }
        for (const b of finalData) bin[offset++] = b;
        return bin;
    }

    // --- Output: ASM (SevenuP format — decimal, 3-char right-justified) ---
    const DEFB    = '\tDEFB\t';
    const FW      = 3;       // field width
    const PER_LINE = 8;

    const asmLines = [];
    asmLines.push('; ASM source file created by ZXDraw');
    asmLines.push('');
    asmLines.push(';GRAPHIC DATA:');
    asmLines.push(`;Pixel Size:      (${String(imgWidth).padStart(FW)}, ${String(imgHeight).padStart(FW)})`);
    asmLines.push(`;Char Size:       (${String(x_charsize).padStart(FW)}, ${String(y_charsize).padStart(FW)})`);
    if (frames > 1) asmLines.push(`;Frames:           ${String(frames).padStart(FW)}`);

    // Sort priorities — only dimensions with lim > 1
    const dimNames = ['X char', 'Char line', 'Y char', 'Mask', 'Frame number', 'Sprite'];
    let sortStr = '';
    for (let i = 0; i < 5; i++) {
        if (lim[pr[i]] !== 1) {
            if (sortStr) sortStr += ', ';
            sortStr += dimNames[pr[i]];
        }
    }
    asmLines.push(`;Sort Priorities: ${sortStr}`);

    const typeNames  = ['Gfx+Attr', 'Attr+Gfx', 'Gfx', 'Attr'];
    const intlvNames = ['Line', 'Character', 'Column', '', 'Frames', 'Sprite'];
    const maskNum    = hasMask ? (1 + maskrev + 2 * (attrMask ? 1 : 0)) : 0;
    const maskNames  = ['No', 'Yes', 'Yes, before graphic',
                        'Yes, including attributes',
                        'Yes, including attributes and before graphic'];

    asmLines.push(`;Data Outputted:  ${typeNames[opts]}`);
    asmLines.push(`;Interleave:      ${intlvNames[interleave]}`);
    asmLines.push(`;Mask:            ${maskNames[maskNum]}`);
    if (attrMask)                asmLines.push(`;Attribute Mask:  ${String(attrMaskValue).padStart(FW)}`);
    if (zigzag && rp[1] > rp[0]) asmLines.push(`;Zigzag:          Horizontal`);
    if (z88dk)                   asmLines.push(`;First two bytes are y and x pixel size, for z88dk libraries`);
    asmLines.push('');

    if (!nolabel) asmLines.push(`${name}:`);

    if (z88dk) {
        asmLines.push(DEFB + [imgHeight, imgWidth % 256].map(b => String(b).padStart(FW)).join(','));
    }

    let row = [];
    for (let i = 0; i < finalData.length; i++) {
        row.push(String(finalData[i]).padStart(FW));
        if (row.length === PER_LINE || i === finalData.length - 1) {
            asmLines.push(DEFB + row.join(','));
            row = [];
        }
    }

    return asmLines.join('\n');
};
