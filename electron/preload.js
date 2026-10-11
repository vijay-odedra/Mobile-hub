const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  printInvoice: () => ipcRenderer.invoke('print-invoice'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url)
});
