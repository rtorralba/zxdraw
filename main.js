const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

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
    },
  });

  mainWindow.loadFile('index.html');

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'New',      accelerator: 'CmdOrCtrl+N',       click: () => mainWindow.webContents.send('menu-new') },
        { label: 'Open…',   accelerator: 'CmdOrCtrl+O',       click: () => mainWindow.webContents.send('menu-open') },
        { label: 'Import Image…', click: () => mainWindow.webContents.send('menu-import-image') },
        { type: 'separator' },
        { label: 'Save',     accelerator: 'CmdOrCtrl+S',       click: () => mainWindow.webContents.send('menu-save') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-saveas') },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            { label: 'PNG…', click: () => mainWindow.webContents.send('menu-export-png') },
          ],
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo',  accelerator: 'CmdOrCtrl+Z',       click: () => mainWindow.webContents.send('menu-undo') },
        { label: 'Redo',  accelerator: 'CmdOrCtrl+Y',       click: () => mainWindow.webContents.send('menu-redo') },
        { type: 'separator' },
        { label: 'Copy',  accelerator: 'CmdOrCtrl+C',       click: () => mainWindow.webContents.send('menu-copy') },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V',       click: () => mainWindow.webContents.send('menu-paste') },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About ZXDraw', click: () => mainWindow.webContents.send('menu-about') },
      ],
    },
  ]);
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

// Allow renderer to request opening DevTools (useful during development)
ipcMain.on('open-devtools', () => {
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
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }
  return null;
});

ipcMain.handle('save-file-direct', async (event, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
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
