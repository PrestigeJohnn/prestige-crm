const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: function() { return ipcRenderer.invoke('get-app-info'); },
  showNotification: function(title, body) { return ipcRenderer.invoke('show-notification', { title: title, body: body }); },
  openExternal: function(url) { return ipcRenderer.invoke('open-external', url); },
  onNotification: function(callback) { ipcRenderer.on('notification', function(_, data) { callback(data); }); },
});
