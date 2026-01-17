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

  // Check if we are in dev mode (env var or argument)
  const isDev = process.env.NODE_ENV === 'development';

  // In production (packaged), load the built file.
  // We assume the client has been built to ../client/dist
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../client/dist/index.html')}`;

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  const serverPath = path.join(__dirname, '../server/index.js');
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
