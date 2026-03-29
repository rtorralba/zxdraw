ZXDraw
======

ZXDraw is a ZX Spectrum-inspired pixel art editor (Electron app) by Raül Torralba Adsuara.

License
-------
This project is licensed under the GNU Affero General Public License v3 (AGPLv3).
See the `LICENSE` file for the full terms.

Copyright
---------
© 2026 Raül Torralba Adsuara

Quick start
-----------
Requirements:
- Node.js 16+ (or compatible)
- npm

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm start
```

Build (bundle + obfuscate + package):

```bash
npm run build
```

Notes
-----
- The build process bundles `renderer.js` and `preload.js` and applies a fast obfuscation step before packaging. The generated installers/artifacts are placed in the `dist/` folder.
- `.zxp` files saved by the app are normalized to CRLF line endings.

Contributing
------------
Contributions are welcome under the terms of the AGPLv3. Please open issues or PRs on the repository.
