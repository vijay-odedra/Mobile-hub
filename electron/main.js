const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
const PORT = process.env.PORT || 3002;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// User data and paths setup
const userDataPath = app.getPath('userData');
const stocklyDataDir = path.join(userDataPath, 'data');
if (!fs.existsSync(stocklyDataDir)) {
  try { fs.mkdirSync(stocklyDataDir, { recursive: true }); } catch (e) {}
}
process.env.STOCKLY_DATA_DIR = stocklyDataDir;

// Logging for troubleshooting
const logFile = path.join(stocklyDataDir, 'stockly.log');
function log(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

// Ensure database-and-config is present in userData if bundled
try {
  const appDir = path.dirname(process.execPath);
  const bundledDb = fs.existsSync(path.join(appDir, 'database-and-config'))
    ? path.join(appDir, 'database-and-config')
    : path.join(process.resourcesPath || '', 'database-and-config');
  const targetDb = path.join(stocklyDataDir, 'database-and-config');
  if (fs.existsSync(bundledDb) && !fs.existsSync(targetDb)) {
    fs.cpSync(bundledDb, targetDb, { recursive: true });
    log('database-and-config synchronized');
  }

  // Ensure APK folder exists with Stockly.apk
  const bundledApkDir = fs.existsSync(path.join(appDir, 'APK'))
    ? path.join(appDir, 'APK')
    : path.join(process.resourcesPath || '', 'APK');
  const targetApkDir = path.join(stocklyDataDir, 'APK');
  if (fs.existsSync(bundledApkDir) && !fs.existsSync(targetApkDir)) {
    fs.cpSync(bundledApkDir, targetApkDir, { recursive: true });
    log('APK folder synchronized');
  }
} catch (e) {
  log(`Folder sync note: ${e.message}`);
}

// Configure service account path
const bundledServiceAccount = path.join(__dirname, '..', 'firebase-service-account.json');
if (fs.existsSync(bundledServiceAccount)) {
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH = bundledServiceAccount;
}

// Start embedded Express server
try {
  require('../server.js');
  log('Embedded server module loaded successfully');
} catch (err) {
  log(`Failed to start embedded server: ${err.stack || err.message}`);
}

function waitForServer(url, timeout = 15000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) {
          log(`Server responded with HTTP ${res.statusCode}`);
          return resolve(true);
        }
        setTimeout(check, 250);
      }).on('error', (err) => {
        if (Date.now() - startTime > timeout) {
          log(`Server wait timed out: ${err.message}`);
          resolve(false);
        } else {
          setTimeout(check, 250);
        }
      });
    };
    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Stockly - Retail & Inventory Management Suite',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });

  const appUrl = `http://127.0.0.1:${PORT}`;
  log(`Waiting for server at ${appUrl}...`);
  await waitForServer(`${appUrl}/api/firebase/status`);

  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    log('Main window ready to show, displaying UI');
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`Load failed (${errorCode}): ${errorDescription}, retrying...`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(appUrl);
      }
    }, 1000);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://api.whatsapp.com') || url.startsWith('https://wa.me')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return { action: 'allow' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('print-invoice', async () => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
    return true;
  }
  return false;
});

ipcMain.handle('open-url', async (event, url) => {
  if (url) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
