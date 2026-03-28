const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'ZX-Draw',
    icon: path.join(__dirname, 'icon.png'), // Placeholder icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools(); // Uncomment for debugging
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

ipcMain.handle('load-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Open .zxp Image',
    filters: [{ name: 'ZX-Paintbrush (.zxp)', extensions: ['zxp'] }],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { content, filePath: filePaths[0] };
  }
  return null;
});
