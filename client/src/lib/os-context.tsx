import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Settings, WindowState, App, FileItem, Note } from "@shared/schema";

const defaultSettings: Settings = {
  wallpaper: "gradient-1",
  theme: "dark",
  accentColor: "blue",
  fontSize: "medium",
  showDesktopIcons: true,
  taskbarPosition: "bottom",
  volume: 50,
  brightness: 100,
  notifications: true,
  wifi: true,
  bluetooth: false,
  developerMode: false,
  syncEnabled: false,
  displayName: "",
};

const defaultApps: App[] = [
  { id: "browser", name: "Browser", icon: "globe", color: "bg-blue-500", defaultWidth: 1000, defaultHeight: 700 },
  { id: "settings", name: "Settings", icon: "settings", color: "bg-gray-600", defaultWidth: 900, defaultHeight: 650 },
  { id: "files", name: "Files", icon: "folder", color: "bg-yellow-500", defaultWidth: 800, defaultHeight: 600 },
  { id: "calculator", name: "Calculator", icon: "calculator", color: "bg-orange-500", defaultWidth: 320, defaultHeight: 480 },
  { id: "notes", name: "Notes", icon: "file-text", color: "bg-amber-400", defaultWidth: 600, defaultHeight: 500 },
  { id: "weather", name: "Weather", icon: "cloud-sun", color: "bg-sky-400", defaultWidth: 400, defaultHeight: 500 },
  { id: "music", name: "Music", icon: "music", color: "bg-pink-500", defaultWidth: 400, defaultHeight: 550 },
  { id: "chat", name: "Chat", icon: "message-circle", color: "bg-emerald-500", defaultWidth: 700, defaultHeight: 550 },
  { id: "updates", name: "Updates", icon: "bell", color: "bg-indigo-500", defaultWidth: 450, defaultHeight: 550 },
  { id: "snake", name: "Snake", icon: "gamepad-2", color: "bg-green-500", defaultWidth: 500, defaultHeight: 550 },
  { id: "minesweeper", name: "Minesweeper", icon: "bomb", color: "bg-slate-600", defaultWidth: 400, defaultHeight: 500 },
  { id: "terminal", name: "Terminal", icon: "terminal", color: "bg-black", defaultWidth: 700, defaultHeight: 500 },
  { id: "appstore", name: "App Store", icon: "store", color: "bg-purple-500", defaultWidth: 700, defaultHeight: 550 },
];

const defaultFiles: FileItem[] = [
  { id: "1", name: "Documents", type: "folder", parentId: null },
  { id: "2", name: "Pictures", type: "folder", parentId: null },
  { id: "3", name: "Music", type: "folder", parentId: null },
  { id: "4", name: "Downloads", type: "folder", parentId: null },
  { id: "5", name: "welcome.txt", type: "file", content: "Welcome to NexusOS! This is a project made by LifeguardYT as part of lgyt.dev. This is my best project, and I am very proud of it. This project will be getting updates and more! Thank you for using NexusOS, and have fun!\n\n-LifeguardYT\nJoin lgyt.dev! https://discord.gg/RaY3xeM6d4", parentId: null },
  { id: "6", name: "notes.txt", type: "file", content: "My notes go here...", parentId: "1" },
];

const defaultNotes: Note[] = [
  { id: "1", title: "Welcome", content: "Welcome to Notes! Start writing...", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

interface SecuritySettings {
  password: string | null;
  pin: string | null;
  requireSignInOnWake: boolean;
}

interface OSContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  windows: WindowState[];
  openWindow: (appId: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  apps: App[];
  files: FileItem[];
  addFile: (file: FileItem) => void;
  updateFile: (id: string, updates: Partial<FileItem>) => void;
  deleteFile: (id: string) => void;
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  startMenuOpen: boolean;
  setStartMenuOpen: (open: boolean) => void;
  contextMenu: { x: number; y: number; items: { label: string; action: () => void }[] } | null;
  showContextMenu: (x: number, y: number, items: { label: string; action: () => void }[]) => void;
  hideContextMenu: () => void;
  currentTime: Date;
  isPoweredOn: boolean;
  isShuttingDown: boolean;
  isStartingUp: boolean;
  isLocked: boolean;
  shutdown: () => void;
  startup: () => void;
  unlock: (credential: string) => boolean;
  security: SecuritySettings;
  updateSecurity: (updates: Partial<SecuritySettings>) => void;
  installedApps: string[];
  installApp: (appId: string) => void;
  uninstallApp: (appId: string) => void;
}

const OSContext = createContext<OSContextType | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("os-settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<OSContextType["contextMenu"]>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("os-notes");
    return saved ? JSON.parse(saved) : defaultNotes;
  });
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem("os-files");
    return saved ? JSON.parse(saved) : defaultFiles;
  });
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isStartingUp, setIsStartingUp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem("os-security");
    return saved ? JSON.parse(saved) : { password: null, pin: null, requireSignInOnWake: false };
  });

  const [installedApps, setInstalledApps] = useState<string[]>(() => {
    const saved = localStorage.getItem("os-installed-apps");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("os-security", JSON.stringify(security));
  }, [security]);

  useEffect(() => {
    localStorage.setItem("os-installed-apps", JSON.stringify(installedApps));
  }, [installedApps]);

  // Check if we need to show lock screen on initial load
  useEffect(() => {
    if (security.password || security.pin) {
      setIsLocked(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updateSecurity = useCallback((updates: Partial<SecuritySettings>) => {
    setSecurity(prev => ({ ...prev, ...updates }));
  }, []);

  const unlock = useCallback((credential: string) => {
    if (security.password && credential === security.password) {
      setIsLocked(false);
      return true;
    }
    if (security.pin && credential === security.pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [security]);

  const shutdown = useCallback(() => {
    setStartMenuOpen(false);
    setIsShuttingDown(true);
    // Wait for animation to complete
    setTimeout(() => {
      setWindows([]);
      setIsPoweredOn(false);
      setIsShuttingDown(false);
    }, 1500);
  }, []);

  const startup = useCallback(() => {
    setIsStartingUp(true);
    setIsPoweredOn(true);
    // Wait for animation to complete
    setTimeout(() => {
      setIsStartingUp(false);
      // Lock if require sign-in on wake is enabled
      if (security.requireSignInOnWake && (security.password || security.pin)) {
        setIsLocked(true);
      }
    }, 1500);
  }, [security]);

  useEffect(() => {
    localStorage.setItem("os-settings", JSON.stringify(settings));
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("os-notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("os-files", JSON.stringify(files));
  }, [files]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const openWindow = useCallback((appId: string) => {
    const app = defaultApps.find(a => a.id === appId);
    if (!app) return;

    const existingWindow = windows.find(w => w.appId === appId && !w.isMinimized);
    if (existingWindow) {
      setWindows(prev => prev.map(w => 
        w.id === existingWindow.id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
      ));
      setNextZIndex(prev => prev + 1);
      return;
    }

    const minimizedWindow = windows.find(w => w.appId === appId && w.isMinimized);
    if (minimizedWindow) {
      setWindows(prev => prev.map(w => 
        w.id === minimizedWindow.id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
      ));
      setNextZIndex(prev => prev + 1);
      return;
    }

    const offset = (windows.length % 5) * 30;
    const newWindow: WindowState = {
      id: `${appId}-${Date.now()}`,
      appId,
      title: app.name,
      x: 100 + offset,
      y: 50 + offset,
      width: app.defaultWidth,
      height: app.defaultHeight,
      isMaximized: false,
      isMinimized: false,
      zIndex: nextZIndex,
    };

    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
    setStartMenuOpen(false);
  }, [windows, nextZIndex]);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, zIndex: nextZIndex } : w
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const updateWindowPosition = useCallback((windowId: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, x, y } : w
    ));
  }, []);

  const updateWindowSize = useCallback((windowId: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, width, height } : w
    ));
  }, []);

  const showContextMenu = useCallback((x: number, y: number, items: { label: string; action: () => void }[]) => {
    setContextMenu({ x, y, items });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const addNote = useCallback((note: Note) => {
    setNotes(prev => [...prev, note]);
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const addFile = useCallback((file: FileItem) => {
    setFiles(prev => [...prev, file]);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const installApp = useCallback((appId: string) => {
    setInstalledApps(prev => prev.includes(appId) ? prev : [...prev, appId]);
  }, []);

  const uninstallApp = useCallback((appId: string) => {
    setInstalledApps(prev => prev.filter(id => id !== appId));
  }, []);

  return (
    <OSContext.Provider value={{
      settings,
      updateSettings,
      windows,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      updateWindowPosition,
      updateWindowSize,
      apps: defaultApps,
      files,
      addFile,
      updateFile,
      deleteFile,
      notes,
      addNote,
      updateNote,
      deleteNote,
      startMenuOpen,
      setStartMenuOpen,
      contextMenu,
      showContextMenu,
      hideContextMenu,
      currentTime,
      isPoweredOn,
      isShuttingDown,
      isStartingUp,
      isLocked,
      shutdown,
      startup,
      unlock,
      security,
      updateSecurity,
      installedApps,
      installApp,
      uninstallApp,
    }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error("useOS must be used within OSProvider");
  }
  return context;
}
