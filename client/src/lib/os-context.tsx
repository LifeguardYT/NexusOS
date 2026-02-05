import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Settings, WindowState, App, FileItem, Note } from "@shared/schema";

import memoryMatchIcon from "../assets/icons/memory-match-icon.png";
import chessIcon from "../assets/icons/chess-icon.png";
import clockIcon from "../assets/icons/clock-icon.png";
import stopwatchIcon from "../assets/icons/stopwatch-icon.png";
import timerIcon from "../assets/icons/timer-icon.png";
import qrcodeIcon from "../assets/icons/qrcode-icon.png";
import voiceRecorderIcon from "../assets/icons/voice-recorder-icon.png";
import gifMakerIcon from "../assets/icons/gif-maker-icon.png";

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
  { id: "bugreport", name: "Report Bug", icon: "bug", color: "bg-red-500", defaultWidth: 500, defaultHeight: 600 },
  { id: "tetris", name: "Tetris", icon: "gamepad-2", color: "bg-cyan-500", defaultWidth: 450, defaultHeight: 600 },
  { id: "2048", name: "2048", icon: "grid-3x3", color: "bg-amber-600", defaultWidth: 450, defaultHeight: 550 },
  { id: "solitaire", name: "Solitaire", icon: "spade", color: "bg-emerald-600", defaultWidth: 900, defaultHeight: 650 },
  { id: "paint", name: "Paint", icon: "paintbrush", color: "bg-rose-500", defaultWidth: 900, defaultHeight: 650 },
  { id: "camera", name: "Camera", icon: "camera", color: "bg-gray-700", defaultWidth: 700, defaultHeight: 550 },
  { id: "email", name: "Email", icon: "mail", color: "bg-blue-600", defaultWidth: 900, defaultHeight: 600 },
  { id: "friends", name: "Friends", icon: "users", color: "bg-purple-500", defaultWidth: 500, defaultHeight: 600 },
  { id: "tictactoe", name: "Tic-Tac-Toe", icon: "grid-3x3", color: "bg-indigo-500", defaultWidth: 450, defaultHeight: 550 },
  { id: "flappybird", name: "Flappy Bird", icon: "bird", color: "bg-sky-400", defaultWidth: 450, defaultHeight: 650 },
  { id: "memorymatch", name: "Memory Match", icon: "brain", color: "bg-slate-600", defaultWidth: 500, defaultHeight: 550, iconImage: memoryMatchIcon },
  { id: "pong", name: "Pong", icon: "gamepad-2", color: "bg-gray-800", defaultWidth: 650, defaultHeight: 550 },
  { id: "sudoku", name: "Sudoku", icon: "grid-3x3", color: "bg-blue-800", defaultWidth: 500, defaultHeight: 650 },
  { id: "chess", name: "Chess", icon: "crown", color: "bg-amber-800", defaultWidth: 550, defaultHeight: 650, iconImage: chessIcon },
  { id: "clock", name: "Clock", icon: "clock", color: "bg-slate-700", defaultWidth: 500, defaultHeight: 550, iconImage: clockIcon },
  { id: "stopwatch", name: "Stopwatch", icon: "timer", color: "bg-gray-900", defaultWidth: 450, defaultHeight: 550, iconImage: stopwatchIcon },
  { id: "timer", name: "Timer", icon: "alarm-clock", color: "bg-indigo-600", defaultWidth: 450, defaultHeight: 550, iconImage: timerIcon },
  { id: "qrcode", name: "QR Code", icon: "qr-code", color: "bg-gray-600", defaultWidth: 550, defaultHeight: 500, iconImage: qrcodeIcon },
  { id: "voicerecorder", name: "Voice Recorder", icon: "mic", color: "bg-red-600", defaultWidth: 450, defaultHeight: 500, iconImage: voiceRecorderIcon },
  { id: "gifmaker", name: "GIF Maker", icon: "film", color: "bg-purple-600", defaultWidth: 700, defaultHeight: 550, iconImage: gifMakerIcon },
  { id: "download", name: "Download", icon: "download", color: "bg-teal-600", defaultWidth: 600, defaultHeight: 650 },
];

const defaultFiles: FileItem[] = [
  { id: "1", name: "Documents", type: "folder", parentId: null },
  { id: "2", name: "Pictures", type: "folder", parentId: null },
  { id: "3", name: "Music", type: "folder", parentId: null },
  { id: "4", name: "Downloads", type: "folder", parentId: null },
  { id: "5", name: "welcome.txt", type: "file", content: "Welcome to NexusOS! This is a project made by LifeguardYT as part of lgyt.dev. This is my best project, and I am very proud of it. This project will be getting updates and more! Thank you for using NexusOS, and have fun!\n\n-LifeguardYT\nJoin lgyt.dev! https://discord.gg/RaY3xeM6d4", parentId: null },
  { id: "6", name: "notes.txt", type: "file", content: "My notes go here...", parentId: "1" },
  { id: "7", name: "easteregg.txt", type: "file", content: "Open the calculater app, type 111111 and press % twice. See what happens :)", parentId: null },
];

const defaultNotes: Note[] = [
  { id: "1", title: "Welcome", content: "Welcome to Notes! Start writing...", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

interface SecuritySettings {
  password: string | null;
  pin: string | null;
  requireSignInOnWake: boolean;
}

export interface CustomAppInfo {
  id: string;
  name: string;
  externalUrl: string;
  logoBase64: string;
  category?: string;
}

export interface DebugLogEntry {
  id: string;
  timestamp: Date;
  type: "info" | "warn" | "error" | "event";
  category: string;
  message: string;
}

export interface DesktopWidget {
  id: string;
  type: "clock" | "weather" | "notes" | "stats";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  appId?: string;
}

export interface ThemeProfile {
  id: string;
  name: string;
  settings: Settings;
  createdAt: string;
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
  installApp: (appId: string, customAppInfo?: CustomAppInfo) => void;
  uninstallApp: (appId: string) => void;
  customAppsInfo: CustomAppInfo[];
  openCustomApp: (appId: string) => void;
  desktopShortcuts: string[];
  addDesktopShortcut: (appId: string) => void;
  removeDesktopShortcut: (appId: string) => void;
  debugLogs: DebugLogEntry[];
  addDebugLog: (type: DebugLogEntry["type"], category: string, message: string) => void;
  clearDebugLogs: () => void;
  widgets: DesktopWidget[];
  addWidget: (type: DesktopWidget["type"]) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type?: NotificationItem["type"], appId?: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  themeProfiles: ThemeProfile[];
  saveThemeProfile: (name: string) => void;
  loadThemeProfile: (id: string) => void;
  deleteThemeProfile: (id: string) => void;
  exportThemeCode: () => string;
  importThemeCode: (code: string) => boolean;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
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
  const [isPoweredOn, setIsPoweredOn] = useState(() => {
    const saved = localStorage.getItem("os-powered-on");
    return saved ? JSON.parse(saved) : false;
  });
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isStartingUp, setIsStartingUp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasCompletedStartup, setHasCompletedStartup] = useState(false);
  
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem("os-security");
    return saved ? JSON.parse(saved) : { password: null, pin: null, requireSignInOnWake: false };
  });

  const [installedApps, setInstalledApps] = useState<string[]>(() => {
    const saved = localStorage.getItem("os-installed-apps");
    return saved ? JSON.parse(saved) : [];
  });

  const [customAppsInfo, setCustomAppsInfo] = useState<CustomAppInfo[]>(() => {
    const saved = localStorage.getItem("os-custom-apps-info");
    return saved ? JSON.parse(saved) : [];
  });

  const [desktopShortcuts, setDesktopShortcuts] = useState<string[]>(() => {
    const saved = localStorage.getItem("os-desktop-shortcuts");
    return saved ? JSON.parse(saved) : [];
  });

  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  const [widgets, setWidgets] = useState<DesktopWidget[]>(() => {
    const saved = localStorage.getItem("os-widgets");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("os-notifications");
    return saved ? JSON.parse(saved).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })) : [];
  });

  const addWidget = useCallback((type: DesktopWidget["type"]) => {
    const widgetDefaults = {
      clock: { width: 200, height: 120 },
      weather: { width: 220, height: 180 },
      notes: { width: 250, height: 200 },
      stats: { width: 220, height: 150 },
    };
    const newWidget: DesktopWidget = {
      id: `widget-${Date.now()}`,
      type,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      ...widgetDefaults[type],
    };
    setWidgets(prev => [...prev, newWidget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWidgetPosition = useCallback((id: string, x: number, y: number) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const addNotification = useCallback((title: string, message: string, type: NotificationItem["type"] = "info", appId?: string) => {
    if (!settings.notifications) return;
    
    const notification: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date(),
      read: false,
      type,
      appId,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  }, [settings.notifications]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    localStorage.setItem("os-widgets", JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem("os-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const [themeProfiles, setThemeProfiles] = useState<ThemeProfile[]>(() => {
    const saved = localStorage.getItem("os-theme-profiles");
    return saved ? JSON.parse(saved) : [];
  });

  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(() => {
    return localStorage.getItem("os-seen-onboarding") === "true";
  });

  const [soundEnabled, setSoundEnabledState] = useState(() => {
    const saved = localStorage.getItem("os-sound-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const setHasSeenOnboarding = useCallback((seen: boolean) => {
    setHasSeenOnboardingState(seen);
    localStorage.setItem("os-seen-onboarding", String(seen));
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("os-sound-enabled", JSON.stringify(enabled));
  }, []);

  const saveThemeProfile = useCallback((name: string) => {
    const profile: ThemeProfile = {
      id: `theme-${Date.now()}`,
      name,
      settings: { ...settings },
      createdAt: new Date().toISOString(),
    };
    setThemeProfiles(prev => [...prev, profile]);
  }, [settings]);

  const loadThemeProfile = useCallback((id: string) => {
    const profile = themeProfiles.find(p => p.id === id);
    if (profile && profile.settings) {
      setSettings(profile.settings);
    }
  }, [themeProfiles]);

  const deleteThemeProfile = useCallback((id: string) => {
    setThemeProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  const exportThemeCode = useCallback(() => {
    return btoa(JSON.stringify(settings));
  }, [settings]);

  const importThemeCode = useCallback((code: string): boolean => {
    try {
      const themeData = JSON.parse(atob(code));
      if (themeData.wallpaper && themeData.theme) {
        setSettings(prev => ({
          ...prev,
          ...themeData,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("os-theme-profiles", JSON.stringify(themeProfiles));
  }, [themeProfiles]);

  const addDebugLog = useCallback((type: DebugLogEntry["type"], category: string, message: string) => {
    const entry: DebugLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      category,
      message,
    };
    setDebugLogs(prev => [...prev.slice(-99), entry]);
  }, []);

  const clearDebugLogs = useCallback(() => {
    setDebugLogs([]);
  }, []);

  useEffect(() => {
    localStorage.setItem("os-security", JSON.stringify(security));
  }, [security]);

  useEffect(() => {
    localStorage.setItem("os-installed-apps", JSON.stringify(installedApps));
  }, [installedApps]);

  useEffect(() => {
    localStorage.setItem("os-custom-apps-info", JSON.stringify(customAppsInfo));
  }, [customAppsInfo]);

  useEffect(() => {
    localStorage.setItem("os-desktop-shortcuts", JSON.stringify(desktopShortcuts));
  }, [desktopShortcuts]);

  // Save powered on state
  useEffect(() => {
    localStorage.setItem("os-powered-on", JSON.stringify(isPoweredOn));
  }, [isPoweredOn]);

  // Auto-start if previously powered on (page refresh scenario)
  useEffect(() => {
    if (isPoweredOn && !hasCompletedStartup) {
      setIsStartingUp(true);
      addDebugLog("info", "System", "System resuming from previous session");
      setTimeout(() => {
        setIsStartingUp(false);
        setHasCompletedStartup(true);
        addDebugLog("event", "System", "Startup complete");
        // Lock if credentials are set
        if (security.password || security.pin) {
          setIsLocked(true);
          addDebugLog("info", "Security", "Lock screen activated");
        }
      }, 2000);
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
    addDebugLog("event", "System", "Shutdown initiated");
    setStartMenuOpen(false);
    setIsShuttingDown(true);
    // Wait for animation to complete
    setTimeout(() => {
      setWindows([]);
      setIsPoweredOn(false);
      setIsShuttingDown(false);
      setHasCompletedStartup(false);
      addDebugLog("info", "System", "System powered off");
    }, 1500);
  }, [addDebugLog]);

  const startup = useCallback(() => {
    addDebugLog("event", "System", "System startup initiated");
    setIsStartingUp(true);
    setIsPoweredOn(true);
    // Wait for animation to complete
    setTimeout(() => {
      setIsStartingUp(false);
      setHasCompletedStartup(true);
      addDebugLog("info", "System", "System startup complete");
      // Lock if credentials are set and require sign-in is enabled
      if (security.requireSignInOnWake && (security.password || security.pin)) {
        setIsLocked(true);
        addDebugLog("info", "Security", "Lock screen activated");
      }
    }, 2000);
  }, [security, addDebugLog]);

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

  // Check for new updates and global notifications
  useEffect(() => {
    if (!isPoweredOn || !hasCompletedStartup) return;
    
    const checkForNewUpdates = async () => {
      try {
        const response = await fetch("/api/updates");
        if (!response.ok) return;
        
        const updates = await response.json();
        if (!updates || updates.length === 0) return;
        
        const latestUpdate = updates[0];
        const lastSeenUpdateId = localStorage.getItem("os-last-seen-update-id");
        
        if (lastSeenUpdateId !== latestUpdate.id) {
          addNotification(
            "Update",
            "Check the Updates app!",
            "info",
            "updates"
          );
          localStorage.setItem("os-last-seen-update-id", latestUpdate.id);
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };
    
    const checkForGlobalNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) return;
        
        const notifications = await response.json();
        if (!notifications || notifications.length === 0) return;
        
        const lastSeenNotificationId = localStorage.getItem("os-last-seen-notification-id");
        const lastSeenTimestamp = localStorage.getItem("os-last-seen-notification-timestamp");
        
        // Find all notifications newer than the last seen one
        const newNotifications = [];
        for (const notification of notifications) {
          if (notification.id === lastSeenNotificationId) break;
          // Also check timestamp to catch notifications we haven't seen
          if (lastSeenTimestamp && new Date(notification.createdAt) <= new Date(lastSeenTimestamp)) break;
          newNotifications.push(notification);
        }
        
        // Show all new notifications (in reverse order so oldest shows first)
        for (const notification of newNotifications.reverse()) {
          addNotification(
            notification.title,
            notification.message,
            notification.type || "info"
          );
        }
        
        // Update last seen to the latest notification
        if (notifications.length > 0) {
          localStorage.setItem("os-last-seen-notification-id", notifications[0].id);
          localStorage.setItem("os-last-seen-notification-timestamp", notifications[0].createdAt);
        }
      } catch (error) {
        console.error("Failed to check for global notifications:", error);
      }
    };
    
    const checkAll = () => {
      checkForNewUpdates();
      checkForGlobalNotifications();
    };
    
    // Check immediately after startup
    const initialTimer = setTimeout(checkAll, 2000);
    
    // Then check every 10 seconds for new notifications
    const interval = setInterval(checkAll, 10000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isPoweredOn, hasCompletedStartup, addNotification]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const openWindow = useCallback((appId: string) => {
    const customApp = customAppsInfo.find(app => app.id === appId);
    if (customApp && customApp.externalUrl) {
      const offset = (windows.length % 5) * 30;
      const newWindow: WindowState = {
        id: `${appId}-${Date.now()}`,
        appId: appId,
        title: customApp.name,
        x: 100 + offset,
        y: 50 + offset,
        width: 1000,
        height: 700,
        isMaximized: false,
        isMinimized: false,
        zIndex: nextZIndex,
        customAppUrl: customApp.externalUrl,
      };
      setWindows(prev => [...prev, newWindow]);
      setNextZIndex(prev => prev + 1);
      setStartMenuOpen(false);
      return;
    }

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
  }, [windows, nextZIndex, customAppsInfo]);

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

  const installApp = useCallback((appId: string, customAppInfo?: CustomAppInfo) => {
    setInstalledApps(prev => prev.includes(appId) ? prev : [...prev, appId]);
    if (customAppInfo) {
      setCustomAppsInfo(prev => {
        const exists = prev.some(app => app.id === customAppInfo.id);
        return exists ? prev : [...prev, customAppInfo];
      });
    }
  }, []);

  const uninstallApp = useCallback((appId: string) => {
    setInstalledApps(prev => prev.filter(id => id !== appId));
    setCustomAppsInfo(prev => prev.filter(app => app.id !== appId));
  }, []);

  const openCustomApp = useCallback((appId: string) => {
    openWindow(appId);
  }, []);

  const addDesktopShortcut = useCallback((appId: string) => {
    setDesktopShortcuts(prev => prev.includes(appId) ? prev : [...prev, appId]);
  }, []);

  const removeDesktopShortcut = useCallback((appId: string) => {
    setDesktopShortcuts(prev => prev.filter(id => id !== appId));
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
      customAppsInfo,
      openCustomApp,
      desktopShortcuts,
      addDesktopShortcut,
      removeDesktopShortcut,
      debugLogs,
      addDebugLog,
      clearDebugLogs,
      widgets,
      addWidget,
      removeWidget,
      updateWidgetPosition,
      notifications,
      addNotification,
      markNotificationRead,
      clearNotifications,
      dismissNotification,
      themeProfiles,
      saveThemeProfile,
      loadThemeProfile,
      deleteThemeProfile,
      exportThemeCode,
      importThemeCode,
      hasSeenOnboarding,
      setHasSeenOnboarding,
      soundEnabled,
      setSoundEnabled,
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
