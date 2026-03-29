# ZX Draw — ZX Spectrum-style Pixel Art Editor

ZX Draw is a lightweight editor inspired by the ZX Spectrum for creating 256×192 graphics with 8×8 block attributes.

## Recent additions
- Cross-platform packaging and releases: Windows (NSIS), macOS (DMG) and Linux (AppImage) builds plus a CI release workflow.
- `.scr` import: load ZX Spectrum screen dumps and convert them to the project `.zxp` format.
- PNG/JPG import: interactive modal with brightness, contrast and saturation controls and a live ZX Spectrum preview before importing.
- Improved Text tool: a wider modal with the preview on the right, threshold control, font/size/style options.
- Palette improvements: click to select/deselect ink or paper, and 3-position Bright/Flash controls (`keep/on/off`).
- Rotate selection 90°: button to rotate only the current selection (blocks and pixels).
- UX polish: clearer icons (invert pixels/attributes swapped for clarity) and removal of the Current Attribute preview panel.
- i18n: UI translations and a language selector (English, Español, Português) with native menu localization.

## Key features
- Scalable canvas with 8×8 grid and up to 16× zoom.
- Per-pixel editing with ZX Spectrum attribute support (ink, paper, bright, flash).
- Select / copy / paste / invert / flip operations.
- Save/load in `.zxp`, import `.scr`, export PNG.

## Try it
Download build artifacts from the release for your platform.

For development:

```powershell
npm install
npm start
```

## Screenshots
(Add screenshots in /screenshots)

## Contact
Built by Raül Torralba. Issues and contributions welcome on GitHub.
