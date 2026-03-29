const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { spawnSync } = require('child_process');

// Files to bundle and obfuscate
const ROOT = __dirname;
const items = [
  { entry: path.join(ROOT, 'renderer.js'), outfile: path.join(ROOT, 'renderer.js'), platform: 'browser' },
  { entry: path.join(ROOT, 'preload.js'), outfile: path.join(ROOT, 'preload.js'), platform: 'node' },
];

async function doBuild() {
  const backups = [];
  try {
    for (const it of items) {
      if (!fs.existsSync(it.entry)) continue;
      const orig = fs.readFileSync(it.entry, 'utf8');
      const bak = it.entry + '.bak';
      fs.writeFileSync(bak, orig, 'utf8');
      backups.push({ file: it.entry, bak });

      // bundle with esbuild into a temp file
      const tmpOut = it.entry + '.tmp.js';
      await build({
        entryPoints: [it.entry],
        bundle: true,
        minify: true,
        platform: it.platform,
        format: 'cjs',
        outfile: tmpOut,
        define: { 'process.env.NODE_ENV': '"production"' },
      });

      const code = fs.readFileSync(tmpOut, 'utf8');

      // obfuscate
      const obf = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      }).getObfuscatedCode();

      // write obfuscated code back to original path
      fs.writeFileSync(it.outfile, obf, 'utf8');

      // remove temp
      fs.unlinkSync(tmpOut);
      console.log('Bundled & obfuscated:', it.entry);
    }

    // Run local electron-builder binary from node_modules to avoid relying on npx
    console.log('Running electron-builder...');
    // Pass through any CLI flags (e.g. --win / --mac / --linux)
    const flags = process.argv.slice(2);
    let flagsArr = flags.length ? flags : null;
    if (!flagsArr) {
      // default to current platform to avoid cross-platform build errors
      if (process.platform === 'win32') flagsArr = ['--win'];
      else if (process.platform === 'darwin') flagsArr = ['--mac'];
      else if (process.platform === 'linux') flagsArr = ['--linux'];
      else flagsArr = ['--win'];
    }
    const ebBin = path.join(ROOT, 'node_modules', '.bin', 'electron-builder' + (process.platform === 'win32' ? '.cmd' : ''));
    let res;
    if (process.platform === 'win32') {
      // On Windows run via cmd /c to execute the .cmd wrapper
      res = spawnSync('cmd', ['/c', ebBin, ...flagsArr], { stdio: 'inherit' });
    } else {
      res = spawnSync(ebBin, flagsArr, { stdio: 'inherit' });
    }
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error('electron-builder failed with code ' + res.status);

  } catch (err) {
    console.error('Build failed:', err);
    process.exitCode = 1;
  } finally {
    // restore backups
    for (const b of backups) {
      try {
        const bakContent = fs.readFileSync(b.bak, 'utf8');
        fs.writeFileSync(b.file, bakContent, 'utf8');
        fs.unlinkSync(b.bak);
        console.log('Restored original:', b.file);
      } catch (e) {
        console.warn('Failed to restore backup for', b.file, e);
      }
    }
  }
}

// ensure required modules are available and run
(async () => {
  try {
    await doBuild();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
