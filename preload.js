const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName) => ipcRenderer.invoke('save-file', content, defaultName),
  saveFileDirect: (filePath, content) => ipcRenderer.invoke('save-file-direct', filePath, content),
  exportPng: (dataURL) => ipcRenderer.invoke('export-png', dataURL),
  loadFile: () => ipcRenderer.invoke('load-file'),
  onMenuEvent: (channel, cb) => ipcRenderer.on(channel, cb),
});
