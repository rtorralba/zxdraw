const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName) => ipcRenderer.invoke('save-file', content, defaultName),
  saveFileDirect: (filePath, content) => ipcRenderer.invoke('save-file-direct', filePath, content),
  exportBas: (content, defaultName) => ipcRenderer.invoke('export-bas', content, defaultName),
  exportBin: (buffer, defaultName) => ipcRenderer.invoke('export-bin', buffer, defaultName),
  exportPng: (dataURL) => ipcRenderer.invoke('export-png', dataURL),
  loadFile: () => ipcRenderer.invoke('load-file'),
  loadFileBas: () => ipcRenderer.invoke('load-file-bas'),
  loadFilePath: (filePath) => ipcRenderer.invoke('load-file-path', filePath),
  addRecentFile: (filePath) => ipcRenderer.send('add-recent-file', filePath),
  loadImage: () => ipcRenderer.invoke('load-image'),
  setDocumentDirty: (isDirty) => ipcRenderer.send('set-document-dirty', isDirty),
  closeWindow: () => ipcRenderer.send('close-window'),
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
  setAppLanguage: (lang) => ipcRenderer.send('set-language', lang),
  setClipboard: (data) => ipcRenderer.invoke('zxdraw-clipboard-set', data),
  getClipboard: () => ipcRenderer.invoke('zxdraw-clipboard-get')
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
