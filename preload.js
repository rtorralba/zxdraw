const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName) => ipcRenderer.invoke('save-file', content, defaultName),
  saveFileDirect: (filePath, content) => ipcRenderer.invoke('save-file-direct', filePath, content),
  exportPng: (dataURL) => ipcRenderer.invoke('export-png', dataURL),
  loadFile: () => ipcRenderer.invoke('load-file'),
  loadImage: () => ipcRenderer.invoke('load-image'),
  onMenuEvent: (channel, cb) => ipcRenderer.on(channel, cb),
  openDevTools: () => ipcRenderer.send('open-devtools'),
  getLocale: (lang) => {
    try {
      const p = path.join(__dirname, 'locales', `${lang}.json`);
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      }
      return null;
    } catch (e) {
      console.error('preload.getLocale error', e);
      return null;
    }
  }
  ,
  setAppLanguage: (lang) => ipcRenderer.send('set-language', lang)
});
