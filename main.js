const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentTranslations = {};

const RECENT_STORE = () => path.join(app.getPath('userData') || __dirname, 'recent.json');

function loadRecentFiles() {
  try {
    const p = RECENT_STORE();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) { console.warn('loadRecentFiles failed', e); }
  return [];
}

function saveRecentFiles(arr) {
  try {
    const p = RECENT_STORE();
    fs.writeFileSync(p, JSON.stringify(arr || []), 'utf8');
  } catch (e) { console.warn('saveRecentFiles failed', e); }
}

function addRecentFile(filePath) {
  try {
    if (!filePath) return;
    const arr = loadRecentFiles().filter(p => p !== filePath);
    arr.unshift(filePath);
    while (arr.length > 10) arr.pop();
    saveRecentFiles(arr);
    // rebuild menu so recent submenu updates
    try {
      const menu = Menu.buildFromTemplate(buildMenuTemplate(currentTranslations));
      Menu.setApplicationMenu(menu);
    } catch (e) { console.warn('rebuild menu failed', e); }
  } catch (e) { console.warn('addRecentFile failed', e); }
}

function openFilePathAndSend(filePath) {
  try {
    if (!filePath) return;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.scr') {
      const buffer = fs.readFileSync(filePath);
      if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-open-file', { content: Array.from(buffer), filePath, type: 'scr' });
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-open-file', { content, filePath, type: 'zxp' });
    }
    addRecentFile(filePath);
  } catch (e) { console.error('openFilePathAndSend error', e); }
}

function findFileArg(argv) {
  if (!argv || argv.length === 0) return null;
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    if (a && (a.toLowerCase().endsWith('.zxp') || a.toLowerCase().endsWith('.scr'))) return a;
  }
  return null;
}

function loadTranslations(lang) {
  try {
    const p = path.join(__dirname, 'locales', `${lang}.json`);
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load translations', lang, e);
  }
  // fallback to english
  try {
    const p = path.join(__dirname, 'locales', `en.json`);
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function buildMenuTemplate(t) {
  const recent = loadRecentFiles();
  const recentSub = (recent && recent.length > 0) ? recent.map(p => ({ label: p, click: () => openFilePathAndSend(p) })) : [{ label: t['menu.recent_empty'] || 'No recent files', enabled: false }];
  return [
    {
      label: t['menu.file'] || 'File',
      submenu: [
        { label: t['menu.new'] || 'New', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new') },
        { label: t['menu.open'] || 'Open…', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu-open') },
        { label: t['menu.recent'] || 'Recent', submenu: recentSub },
        { label: t['menu.import_image'] || 'Import Image…', click: () => mainWindow.webContents.send('menu-import-image') },
        { type: 'separator' },
        { label: t['menu.save'] || 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-save') },
        { label: t['menu.saveas'] || 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-saveas') },
        { type: 'separator' },
        {
          label: t['menu.export'] || 'Export',
          submenu: [
            { label: t['menu.export_png'] || 'PNG…', click: () => mainWindow.webContents.send('menu-export-png') },
            {
              label: t['menu.export_boriel'] || 'Boriel Basic',
              submenu: [
                { label: t['menu.export_boriel_putchars'] || 'PutChars…', click: () => mainWindow.webContents.send('menu-export-boriel-putchars') },
                { label: t['menu.export_boriel_gusprites'] || 'GuSprites…', click: () => mainWindow.webContents.send('menu-export-boriel-gusprites') }
              ]
            },
                { label: t['menu.export_data'] || 'Export Data…', click: () => mainWindow.webContents.send('menu-export-data') },
                { label: t['menu.export_scr'] || 'Export SCR…', click: () => mainWindow.webContents.send('menu-export-scr') }
          ],
        },
        { type: 'separator' },
        { label: t['menu.quit'] || 'Quit', role: 'quit' },
      ],
    },
    {
      label: t['menu.edit'] || 'Edit',
      submenu: [
        { label: t['menu.undo'] || 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow.webContents.send('menu-undo') },
        { label: t['menu.redo'] || 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => mainWindow.webContents.send('menu-redo') },
        { type: 'separator' },
        { label: t['menu.copy'] || 'Copy', accelerator: 'CmdOrCtrl+C', click: () => mainWindow.webContents.send('menu-copy') },
        { label: t['menu.paste'] || 'Paste', accelerator: 'CmdOrCtrl+V', click: () => mainWindow.webContents.send('menu-paste') },
      ],
    },
    {
      label: t['menu.help'] || 'Help',
      submenu: [
        { label: t['menu.about'] || 'About ZXDraw', click: () => mainWindow.webContents.send('menu-about') },
      ],
    },
  ];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'ZXDraw',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // disable DevTools in packaged (production) builds
      devTools: !app.isPackaged,
    },
  });

  mainWindow.loadFile('index.html');
  // Build localized menu
  const sysLang = (app.getLocale && app.getLocale().slice(0,2)) || 'en';
  const translations = loadTranslations(sysLang);
  currentTranslations = translations || {};
  const menuTpl = buildMenuTemplate(translations);
  const menu = Menu.buildFromTemplate(menuTpl);
  Menu.setApplicationMenu(menu);
}

// Single instance lock removed to allow multiple simultaneous instances.
// Each launch or 'Open with' will now open a new window in its own instance.

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  createWindow();

  // If app started with a file argument (Windows "Open with"), open it now
  try {
    const initial = findFileArg(process.argv);
    if (initial) {
      // small delay to ensure window/webContents ready
      setTimeout(() => openFilePathAndSend(initial), 300);
    }
  } catch (e) { /* noop */ }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// macOS: open-file event when launching via Finder
app.on('open-file', (event, pathArg) => {
  event.preventDefault();
  if (!pathArg) return;
  if (mainWindow && mainWindow.webContents) {
    openFilePathAndSend(pathArg);
  } else {
    // If window not ready yet, open after ready
    app.once('ready', () => setTimeout(() => openFilePathAndSend(pathArg), 300));
  }
});

// Synchronous locale loader — used by renderer at startup before contextBridge async ready
ipcMain.on('get-locale-sync', (event, lang) => {
  event.returnValue = loadTranslations(lang);
});

// Allow renderer to request opening DevTools only during development
ipcMain.on('open-devtools', () => {
  if (app.isPackaged) {
    // ignore requests in production
    return;
  }
  if (mainWindow && mainWindow.webContents) mainWindow.webContents.openDevTools({ mode: 'undocked' });
});

// IPC Handlers for File I/O
ipcMain.handle('save-file', async (event, content, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Image',
    defaultPath: defaultName || 'image.zxp',
    filters: [
      { name: 'ZX-Paintbrush (.zxp)', extensions: ['zxp'] },
      { name: 'ZX Spectrum Screen (.scr)', extensions: ['scr'] }
    ],
  });

  if (filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      let out = content;

      if (content && typeof content === 'object' && !Array.isArray(content) && !Buffer.isBuffer(content)) {
        if (ext === '.scr' && content.scr) {
          fs.writeFileSync(filePath, Buffer.from(content.scr));
          return filePath;
        } else if (content.zxp) {
          out = content.zxp;
        }
      }

      if (ext === '.zxp' && typeof out === 'string') {
        out = out.replace(/\r?\n/g, '\r\n');
        fs.writeFileSync(filePath, out, 'utf8');
      } else if (Buffer.isBuffer(out) || out instanceof Uint8Array || Array.isArray(out)) {
        fs.writeFileSync(filePath, Buffer.from(out));
      } else {
        fs.writeFileSync(filePath, out, 'utf8');
      }
    } catch (e) {
      console.error('save-file write error', e);
      throw e;
    }
    return filePath;
  }
  return null;
});

ipcMain.handle('export-bas', async (event, content, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Boriel Basic',
    defaultPath: defaultName || 'export.bas',
    filters: [{ name: 'Boriel Basic Source', extensions: ['bas'] }, { name: 'All Files', extensions: ['*'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }
  return null;
});

ipcMain.handle('export-bin', async (event, buffer, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Binary Data',
    defaultPath: defaultName || 'export.bin',
    filters: [{ name: 'Binary Data', extensions: ['bin'] }, { name: 'All Files', extensions: ['*'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  }
  return null;
});

ipcMain.handle('save-file-direct', async (event, filePath, content) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (Buffer.isBuffer(content) || content instanceof Uint8Array || Array.isArray(content)) {
      fs.writeFileSync(filePath, Buffer.from(content));
    } else {
      let out = content;
      if (ext === '.zxp' && typeof out === 'string') {
        out = out.replace(/\r?\n/g, '\r\n');
      }
      fs.writeFileSync(filePath, out, 'utf8');
    }
    return filePath;
  } catch (e) {
    console.error('save-file-direct write error', e);
    throw e;
  }
});

ipcMain.handle('export-png', async (event, dataURL) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export as PNG',
    defaultPath: 'image.png',
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
  });
  if (filePath) {
    const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return filePath;
  }
  return null;
});

ipcMain.handle('load-image', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }],
    properties: ['openFile'],
  });
  if (filePaths && filePaths.length > 0) {
    const ext = path.extname(filePaths[0]).slice(1).toLowerCase();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    const buffer = fs.readFileSync(filePaths[0]);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }
  return null;
});

ipcMain.handle('load-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Open Image',
    filters: [
      { name: 'ZX Images', extensions: ['zxp', 'scr'] },
      { name: 'ZX-Paintbrush (.zxp)', extensions: ['zxp'] },
      { name: 'ZX Spectrum Screen (.scr)', extensions: ['scr'] },
    ],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    const ext = path.extname(filePaths[0]).toLowerCase();
    if (ext === '.scr') {
      const buffer = fs.readFileSync(filePaths[0]);
      return { content: Array.from(buffer), filePath: filePaths[0], type: 'scr' };
    } else {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      return { content, filePath: filePaths[0], type: 'zxp' };
    }
  }
  return null;
});

ipcMain.handle('load-file-path', async (event, filePath) => {
  try {
    if (!filePath) return null;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.scr') {
      const buffer = fs.readFileSync(filePath);
      return { content: Array.from(buffer), filePath: filePath, type: 'scr' };
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      return { content, filePath: filePath, type: 'zxp' };
    }
  } catch (e) {
    console.error('load-file-path error', e);
    return null;
  }
});

// Rebuild menu when renderer requests language change
ipcMain.on('set-language', (event, lang) => {
  try {
    const translations = loadTranslations(lang);
    currentTranslations = translations || {};
    const menu = Menu.buildFromTemplate(buildMenuTemplate(translations));
    Menu.setApplicationMenu(menu);
  } catch (e) {
    console.error('Failed to set language menu', e);
  }
});

// Renderer notifies main that a file was opened/saved and should be added to recent list
ipcMain.on('add-recent-file', (event, filePath) => {
  try { addRecentFile(filePath); } catch (e) { console.warn('add-recent-file ipc failed', e); }
});

// Cross-instance clipboard sharing via a shared JSON file in userData
const CLIPBOARD_STORE = () => path.join(app.getPath('userData'), 'clipboard.json');

ipcMain.handle('zxdraw-clipboard-set', (event, data) => {
  try {
    fs.writeFileSync(CLIPBOARD_STORE(), JSON.stringify(data), 'utf8');
  } catch (e) { console.warn('zxdraw-clipboard-set failed', e); }
});

ipcMain.handle('zxdraw-clipboard-get', () => {
  try {
    const p = CLIPBOARD_STORE();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) { console.warn('zxdraw-clipboard-get failed', e); }
  return null;
});
