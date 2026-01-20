import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null;
let serverProcess: ChildProcess | undefined;

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
    // In dev, the dist will be in main.js's parent (electron/dist/main.js -> electron/)
    // then ../client/dist/index.html
    // BUT typically dev mode runs via electron . (source) or compiled.
    // If we run `tsc` then `electron dist/main.js`, __dirname is `electron/dist`.
    // So `../client/dist` becomes `electron/client/dist` which is wrong.
    // We need `../../client/dist` from `electron/dist`.

    // However, usually "dev" means we run `electron .` which uses ts-node or requires compilation.
    // If we assume we run compiled JS from `electron/dist/`:
    startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../../client/dist/index.html')}`;
  } else {
    // In production, we expect the client build to be in 'client-build' sibling folder to the main script
    // If main script is at resources/app.asar/dist/main.js
    // We might place client-build at resources/app.asar/client-build
    // So `../client-build`
    startUrl = `file://${path.join(__dirname, '../client-build/index.html')}`;
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
    // From electron/dist/main.js -> electron/server/dist/index.js (if server is built there)
    // Actually server is built to server/dist/index.js
    // So from electron/dist -> ../../server/dist/index.js
    serverPath = path.join(__dirname, '../../server/dist/index.js');
  } else {
    // In production, we expect the server to be in 'server-build' sibling folder
    // Note: We will configure electron-builder to unpack this directory (asarUnpack)
    // so we can reference it normally.
    // from dist/main.js -> ../server-build/index.js
    serverPath = path.join(__dirname, '../server-build/index.js');

    // However, if we are inside an asar archive, __dirname might be .../app.asar/dist
    // and if we unpacked server-build, it might be in .../app.asar.unpacked/server-build/
    // Electron automatically handles 'app.asar' replacement in paths usually,
    // but for 'child_process' we often need the real path.

    // Common workaround: check if we are in ASAR, and if so, point to unpacked.
    if (serverPath.includes('app.asar')) {
      serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
    }
  }

  console.log('Starting server from:', serverPath);

  // Fork the server process
  serverProcess = fork(serverPath, [], {
    stdio: 'inherit',
    env: { ...process.env, PORT: "3001" }
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
