const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentTranslations = {};
let isDocumentDirty = false;

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
    if (ext === '.scr' || ext === '.chr' || ext === '.ch8') {
      const buffer = fs.readFileSync(filePath);
      const type = ext === '.ch8' ? 'ch8' : ext.slice(1);
      if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-open-file', { content: Array.from(buffer), filePath, type });
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
    if (a && (a.toLowerCase().endsWith('.zxp') || a.toLowerCase().endsWith('.scr') || a.toLowerCase().endsWith('.chr') || a.toLowerCase().endsWith('.ch8'))) return a;
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
        {
          label: t['menu.import'] || 'Import',
          submenu: [
            { label: t['menu.import_image'] || 'Image…', click: () => mainWindow.webContents.send('menu-import-image') },
            { label: t['menu.import_boriel_putchars'] || 'Boriel Basic (PutChars)…', click: () => mainWindow.webContents.send('menu-import-boriel-putchars') },
            { label: t['menu.import_chr'] || 'CHR Font/Tiles…', click: () => mainWindow.webContents.send('menu-import-chr') },
            { label: t['menu.import_ch8'] || 'CH8 Font/Tiles…', click: () => mainWindow.webContents.send('menu-import-ch8') }
          ]
        },
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
                { label: t['menu.export_scr'] || 'Export SCR…', click: () => mainWindow.webContents.send('menu-export-scr') },
                { label: t['menu.export_chr'] || 'Export CHR…', click: () => mainWindow.webContents.send('menu-export-chr') },
                { label: t['menu.export_ch8'] || 'Export CH8…', click: () => mainWindow.webContents.send('menu-export-ch8') },
                { label: t['menu.export_sp1'] || 'Export SP1 Sprite (z88dk)…', click: () => mainWindow.webContents.send('menu-export-sp1') },
                { label: t['menu.export_cyd_json'] || 'Export CYD Charset (json)\u2026', click: () => mainWindow.webContents.send('menu-export-cyd-json') }
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
        { label: t['menu.about'] || 'About ZXDrawer', click: () => mainWindow.webContents.send('menu-about') },
      ],
    },
  ];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'ZXDrawer',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // disable DevTools in packaged (production) builds
      devTools: !app.isPackaged,
      // Security hardening
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      backgroundThrottling: false,
    },
  });

  // Block all permission requests (Geolocation, Camera, Microphone, etc.)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log(`Permission request for ${permission} was automatically denied.`);
    return callback(false);
  });

  mainWindow.loadFile('index.html');
  // Build localized menu
  const sysLang = (app.getLocale && app.getLocale().slice(0,2)) || 'en';
  const translations = loadTranslations(sysLang);
  currentTranslations = translations || {};
  const menuTpl = buildMenuTemplate(translations);
  const menu = Menu.buildFromTemplate(menuTpl);
  Menu.setApplicationMenu(menu);

  // Intercept window close to ask about unsaved changes
  mainWindow.on('close', async (e) => {
    if (!isDocumentDirty) return;
    e.preventDefault();
    const t = currentTranslations;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: [
        t['dialog.close.discard'] || 'Discard changes',
        t['dialog.close.cancel'] || 'Cancel',
      ],
      defaultId: 1,
      cancelId: 1,
      title: t['dialog.close.title'] || 'Unsaved changes',
      message: t['dialog.close.message'] || 'You have unsaved changes. Close without saving?',
    });
    if (response === 0) {
      isDocumentDirty = false;
      mainWindow.destroy();
    }
  });
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

ipcMain.handle('export-cyd-json', async (event, content, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export CYD JSON',
    defaultPath: defaultName || 'charset.json',
    filters: [{ name: 'CYD JSON Charset', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }
  return null;
});

ipcMain.handle('export-chr', async (event, buffer, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export CHR Font/Tiles',
    defaultPath: defaultName || 'export.chr',
    filters: [{ name: 'CHR Font/Tiles', extensions: ['chr'] }, { name: 'All Files', extensions: ['*'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  }
  return null;
});

ipcMain.handle('export-sp1-asm', async (event, content, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export SP1 Sprite',
    defaultPath: defaultName || 'sprite.asm',
    filters: [{ name: 'ASM Source', extensions: ['asm'] }, { name: 'All Files', extensions: ['*'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }
  return null;
});

ipcMain.handle('export-ch8', async (event, buffer, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export CH8 Font/Tiles',
    defaultPath: defaultName || 'export.ch8',
    filters: [{ name: 'CH8 Font/Tiles', extensions: ['ch8'] }, { name: 'All Files', extensions: ['*'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  }
  return null;
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
      { name: 'ZX Images', extensions: ['zxp', 'scr', 'chr', 'ch8'] },
      { name: 'ZX-Paintbrush (.zxp)', extensions: ['zxp'] },
      { name: 'ZX Spectrum Screen (.scr)', extensions: ['scr'] },
      { name: 'CHR Font/Tiles (.chr)', extensions: ['chr'] },
      { name: 'CH8 Font/Tiles (.ch8)', extensions: ['ch8'] },
    ],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    const ext = path.extname(filePaths[0]).toLowerCase();
    if (ext === '.scr' || ext === '.chr' || ext === '.ch8') {
      const buffer = fs.readFileSync(filePaths[0]);
      const type = ext === '.ch8' ? 'ch8' : ext.slice(1);
      return { content: Array.from(buffer), filePath: filePaths[0], type };
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
    if (ext === '.scr' || ext === '.chr' || ext === '.ch8') {
      const buffer = fs.readFileSync(filePath);
      const type = ext === '.ch8' ? 'ch8' : ext.slice(1);
      return { content: Array.from(buffer), filePath: filePath, type };
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      return { content, filePath: filePath, type: 'zxp' };
    }
  } catch (e) {
    console.error('load-file-path error', e);
    return null;
  }
});

ipcMain.handle('load-file-bas', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Boriel Basic',
    filters: [
      { name: 'Boriel Basic (.bas)', extensions: ['bas'] },
    ],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { content, filePath: filePaths[0], type: 'bas' };
  }
  return null;
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

// Track document dirty state from renderer
ipcMain.on('set-document-dirty', (event, isDirty) => {
  isDocumentDirty = isDirty;
});

// Renderer-initiated close (e.g. from menu)
ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Cross-instance clipboard sharing via a shared JSON file in userData
const CLIPBOARD_STORE = () => path.join(app.getPath('userData'), 'clipboard.json');

ipcMain.handle('zxdrawer-clipboard-set', (event, data) => {
  try {
    fs.writeFileSync(CLIPBOARD_STORE(), JSON.stringify(data), 'utf8');
  } catch (e) { console.warn('zxdrawer-clipboard-set failed', e); }
});

ipcMain.handle('zxdrawer-clipboard-get', () => {
  try {
    const p = CLIPBOARD_STORE();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) { console.warn('zxdrawer-clipboard-get failed', e); }
  return null;
});
