const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Check if we are in dev mode
  const isDev = process.env.NODE_ENV === 'development';

  // Determine start URL
  let startUrl;
  if (isDev) {
    startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../client/dist/index.html')}`;
  } else {
    // In production, we expect the client build to be in 'client-build' sibling folder
    startUrl = `file://${path.join(__dirname, 'client-build/index.html')}`;
  }

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  const isDev = process.env.NODE_ENV === 'development';
  let serverPath;

  if (isDev) {
    serverPath = path.join(__dirname, '../server/index.js');
  } else {
    // In production, we expect the server to be in 'server-build' sibling folder
    // Note: We will configure electron-builder to unpack this directory (asarUnpack)
    // so we can reference it normally.
    serverPath = path.join(__dirname, 'server-build/index.js');

    // However, if we are inside an asar archive, __dirname might be .../app.asar/
    // and if we unpacked server-build, it might be in .../app.asar.unpacked/server-build/
    // Electron automatically handles 'app.asar' replacement in paths usually,
    // but for 'child_process' we often need the real path.
    // Let's rely on electron-builder's standard behavior:
    // If we reference a file inside app.asar that is unpacked, Electron usually patches fs/path
    // to point to the unpacked version. BUT 'fork' is a Node API.

    // Common workaround: check if we are in ASAR, and if so, point to unpacked.
    if (serverPath.includes('app.asar')) {
      serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
    }
  }

  console.log('Starting server from:', serverPath);

  // Fork the server process
  serverProcess = fork(serverPath, [], {
    stdio: 'inherit',
    env: { ...process.env, PORT: 3001 }
  });
}

app.on('ready', () => {
  startServer();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
