const { app, BrowserWindow, shell, Menu, Tray, nativeImage, clipboard } = require('electron');
const path = require('path');

// NexusOS URL - This points to the live NexusOS web app
const NEXUSOS_URL = process.env.NEXUSOS_URL || 'https://nexusos.live';

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Remove the default menu
  Menu.setApplicationMenu(null);

  // Set custom user agent to include 'NexusOS-Desktop' for detection
  const userAgent = mainWindow.webContents.getUserAgent() + ' NexusOS-Desktop';
  mainWindow.webContents.setUserAgent(userAgent);

  // Load NexusOS
  mainWindow.loadURL(NEXUSOS_URL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle all navigation - open auth URLs in system browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAuthUrl(url)) {
      event.preventDefault();
      // Open in system's default browser
      shell.openExternal(url);
    }
  });

  // Handle new window requests
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAuthUrl(url)) {
      // Open auth in system browser
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    // External URLs - open in browser
    if (!url.startsWith(NEXUSOS_URL) && url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    return { action: 'allow' };
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Check if URL is an authentication URL
function isAuthUrl(url) {
  return url.includes('replit.com/auth') || 
         url.includes('repl.co/auth') ||
         url.includes('replit.com/login') ||
         url.includes('/api/auth') ||
         url.includes('accounts.google.com/o/oauth') ||
         url.includes('github.com/login/oauth');
}

// Create system tray
function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Show NexusOS', 
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { 
        label: 'Refresh (after login)', 
        click: () => {
          if (mainWindow) {
            mainWindow.loadURL(NEXUSOS_URL);
          }
        }
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          app.quit();
        }
      }
    ]);
    
    tray.setToolTip('NexusOS');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.log('Could not create tray icon');
  }
}

// Register custom protocol for deep linking
app.setAsDefaultProtocolClient('nexusos');

// Handle protocol URL on Windows/Linux
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to open a second instance or a protocol link
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // Refresh to pick up any new auth state
      mainWindow.loadURL(NEXUSOS_URL);
    }
  });
}

// Handle protocol URL on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.focus();
    mainWindow.loadURL(NEXUSOS_URL);
  }
});

// App ready
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});
