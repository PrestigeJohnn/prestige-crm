const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3002;
let serverProcess = null;
let mainWindow = null;

// ── Remove default menu bar ──
Menu.setApplicationMenu(null);

function startServer() {
  return new Promise(function(resolve, reject) {
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(function() {
      if (!started) {
        started = true;
        resolve();
      }
    }, 8000);

    serverProcess.stdout.on('data', function(data) {
      const text = data.toString().trim();
      if (text) console.log('[Server]', text);
      if (text.includes('AI CRM Server Started') || text.includes('Prestige CRM Server Started') || text.includes('localhost')) {
        started = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr.on('data', function(data) {
      const text = data.toString().trim();
      if (text) console.error('[Server]', text);
      if (text.includes('EADDRINUSE')) {
        started = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.on('error', function(err) {
      console.error('[Server] Failed to start:', err.message);
      if (!started) {
        started = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Prestige CRM',
    backgroundColor: '#0A1628',
    icon: path.join(__dirname, 'public', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
    show: false,
  });

  mainWindow.loadURL('http://localhost:' + PORT);

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', function() {
    setTimeout(function() {
      mainWindow.loadURL('http://localhost:' + PORT);
    }, 2000);
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.whenReady().then(async function() {
  try {
    await startServer();
  } catch(e) {
    console.error('Server failed to start:', e);
  }
  createWindow();
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on('activate', function() {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
