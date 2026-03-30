const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName) => ipcRenderer.invoke('save-file', content, defaultName),
  saveFileDirect: (filePath, content) => ipcRenderer.invoke('save-file-direct', filePath, content),
  exportPng: (dataURL) => ipcRenderer.invoke('export-png', dataURL),
  loadFile: () => ipcRenderer.invoke('load-file'),
  loadFilePath: (filePath) => ipcRenderer.invoke('load-file-path', filePath),
  addRecentFile: (filePath) => ipcRenderer.send('add-recent-file', filePath),
  loadImage: () => ipcRenderer.invoke('load-image'),
  onMenuEvent: (channel, cb) => ipcRenderer.on(channel, cb),
  openDevTools: () => ipcRenderer.send('open-devtools'),
  // Synchronous locale via IPC — guaranteed available before DOMContentLoaded,
  // even when contextBridge is still being set up. Avoids any async latency.
  getLocale: (lang) => {
    try {
      return ipcRenderer.sendSync('get-locale-sync', lang);
    } catch (e) {
      console.error('preload.getLocale error', e);
      return null;
    }
  }
  ,
  setAppLanguage: (lang) => ipcRenderer.send('set-language', lang)
  ,
  getAppVersion: () => {
    try {
      const pkg = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
      const obj = JSON.parse(pkg);
      return obj.version || null;
    } catch (e) {
      console.error('preload.getAppVersion error', e);
      return null;
    }
  }
});
