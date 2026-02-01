const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');

// NexusOS URL - This points to the live NexusOS web app
const NEXUSOS_URL = process.env.NEXUSOS_URL || 'https://nexusos.live';

let mainWindow;
let authWindow;
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

  // Load NexusOS
  mainWindow.loadURL(NEXUSOS_URL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle navigation - intercept auth URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAuthUrl(url)) {
      event.preventDefault();
      openAuthWindow(url);
    }
  });

  // Handle new window requests (popups, links, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAuthUrl(url)) {
      openAuthWindow(url);
      return { action: 'deny' };
    }
    
    // External URLs that aren't auth - open in browser
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

// Open authentication in a popup window
function openAuthWindow(url) {
  if (authWindow) {
    authWindow.focus();
    return;
  }

  authWindow = new BrowserWindow({
    width: 500,
    height: 700,
    parent: mainWindow,
    modal: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:nexusos-auth',
    },
    title: 'Sign in to NexusOS',
  });

  authWindow.loadURL(url);

  // Watch for successful auth redirect back to NexusOS
  authWindow.webContents.on('will-navigate', (event, navUrl) => {
    if (navUrl.startsWith(NEXUSOS_URL)) {
      // Auth complete, close popup and refresh main window
      authWindow.close();
      mainWindow.loadURL(NEXUSOS_URL);
    }
  });

  authWindow.webContents.on('did-navigate', (event, navUrl) => {
    if (navUrl.startsWith(NEXUSOS_URL)) {
      authWindow.close();
      mainWindow.loadURL(NEXUSOS_URL);
    }
  });

  authWindow.on('closed', () => {
    authWindow = null;
    // Refresh main window after auth window closes
    if (mainWindow) {
      mainWindow.loadURL(NEXUSOS_URL);
    }
  });
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
        label: 'Refresh', 
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
