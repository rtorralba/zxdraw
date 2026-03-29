const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

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
  return [
    {
      label: t['menu.file'] || 'File',
      submenu: [
        { label: t['menu.new'] || 'New', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new') },
        { label: t['menu.open'] || 'Open…', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu-open') },
        { label: t['menu.import_image'] || 'Import Image…', click: () => mainWindow.webContents.send('menu-import-image') },
        { type: 'separator' },
        { label: t['menu.save'] || 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-save') },
        { label: t['menu.saveas'] || 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-saveas') },
        { type: 'separator' },
        {
          label: t['menu.export'] || 'Export',
          submenu: [
            { label: t['menu.export_png'] || 'PNG…', click: () => mainWindow.webContents.send('menu-export-png') },
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
  const menuTpl = buildMenuTemplate(translations);
  const menu = Menu.buildFromTemplate(menuTpl);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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
    title: 'Save .zxp Image',
    defaultPath: defaultName || 'image.zxp',
    filters: [{ name: 'ZX-Paintbrush (.zxp)', extensions: ['zxp'] }],
  });

  if (filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      let out = content;
      if (ext === '.zxp' && typeof out === 'string') {
        // Normalize to CRLF as required for .zxp files
        out = out.replace(/\r?\n/g, '\r\n');
      }
      fs.writeFileSync(filePath, out, 'utf8');
    } catch (e) {
      console.error('save-file write error', e);
      throw e;
    }
    return filePath;
  }
  return null;
});

ipcMain.handle('save-file-direct', async (event, filePath, content) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let out = content;
    if (ext === '.zxp' && typeof out === 'string') {
      out = out.replace(/\r?\n/g, '\r\n');
    }
    fs.writeFileSync(filePath, out, 'utf8');
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

// Rebuild menu when renderer requests language change
ipcMain.on('set-language', (event, lang) => {
  try {
    const translations = loadTranslations(lang);
    const menu = Menu.buildFromTemplate(buildMenuTemplate(translations));
    Menu.setApplicationMenu(menu);
  } catch (e) {
    console.error('Failed to set language menu', e);
  }
});
