#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args[0]) die('Uso: node scripts/update-version.js <nueva-version>\nEj: node scripts/update-version.js 1.2.3');
const newVersion = args[0].trim();
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z-.]+)?$/.test(newVersion)) die('Versión inválida. Use formato semver como 1.2.3');

const repoRoot = path.join(__dirname, '..');
const pkgPath = path.join(repoRoot, 'package.json');
const snapPath = path.join(repoRoot, 'snap', 'snapcraft.yaml');

function updatePackageJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  let obj;
  try { obj = JSON.parse(raw); } catch (e) { die(`Error parseando ${p}: ${e.message}`); }
  obj.version = newVersion;
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`Actualizado ${p} -> version: ${newVersion}`);
}

function updateSnapcraftYaml(p) {
  if (!fs.existsSync(p)) {
    console.warn(`${p} no existe, omitiendo.`);
    return;
  }
  const raw = fs.readFileSync(p, 'utf8');
  const replaced = raw.replace(/^(\s*version:\s*).*/m, `$1${newVersion}`);
  if (replaced === raw) {
    // no hallado, añadir al principio
    const out = `version: ${newVersion}\n` + raw;
    fs.writeFileSync(p, out, 'utf8');
    console.log(`Añadida version en ${p} -> version: ${newVersion}`);
  } else {
    fs.writeFileSync(p, replaced, 'utf8');
    console.log(`Actualizado ${p} -> version: ${newVersion}`);
  }
}

try {
  updatePackageJson(pkgPath);
} catch (e) {
  die(`Fallo actualizando package.json: ${e.message}`);
}

try {
  updateSnapcraftYaml(snapPath);
} catch (e) {
  die(`Fallo actualizando snap/snapcraft.yaml: ${e.message}`);
}

console.log('Hecho.');
