import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Download, Check, Star, Globe, FileText, Calculator, 
  Cloud, Music, Gamepad2, Terminal, Settings, FolderOpen, MessageSquare,
  Package, TrendingUp, Sparkles, Clock, Blocks, Trash2
} from "lucide-react";

interface AppInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  rating: number;
  downloads: string;
  size: string;
  isSystemApp: boolean;
  externalUrl?: string;
}

const allApps: AppInfo[] = [
  {
    id: "browser",
    name: "Browser",
    description: "Browse the web with tabs, bookmarks, and full navigation support.",
    icon: <Globe className="w-8 h-8 text-blue-400" />,
    category: "Utilities",
    rating: 4.8,
    downloads: "10M+",
    size: "45 MB",
    isSystemApp: true,
  },
  {
    id: "files",
    name: "Files",
    description: "Manage your files and folders with an intuitive file explorer.",
    icon: <FolderOpen className="w-8 h-8 text-yellow-400" />,
    category: "Utilities",
    rating: 4.7,
    downloads: "10M+",
    size: "12 MB",
    isSystemApp: true,
  },
  {
    id: "notes",
    name: "Notes",
    description: "Create, edit, and organize your notes with search functionality.",
    icon: <FileText className="w-8 h-8 text-orange-400" />,
    category: "Productivity",
    rating: 4.6,
    downloads: "5M+",
    size: "8 MB",
    isSystemApp: true,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform calculations with a clean, easy-to-use calculator.",
    icon: <Calculator className="w-8 h-8 text-gray-400" />,
    category: "Utilities",
    rating: 4.5,
    downloads: "8M+",
    size: "2 MB",
    isSystemApp: true,
  },
  {
    id: "weather",
    name: "Weather",
    description: "Check current weather and forecasts for any location.",
    icon: <Cloud className="w-8 h-8 text-cyan-400" />,
    category: "Utilities",
    rating: 4.4,
    downloads: "3M+",
    size: "15 MB",
    isSystemApp: true,
  },
  {
    id: "music",
    name: "Music",
    description: "Play and manage your music library with playlist support.",
    icon: <Music className="w-8 h-8 text-pink-400" />,
    category: "Entertainment",
    rating: 4.3,
    downloads: "2M+",
    size: "20 MB",
    isSystemApp: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Command-line interface with package management and utilities.",
    icon: <Terminal className="w-8 h-8 text-green-400" />,
    category: "Developer Tools",
    rating: 4.9,
    downloads: "1M+",
    size: "5 MB",
    isSystemApp: true,
  },
  {
    id: "settings",
    name: "Settings",
    description: "Customize your NexusOS experience with system settings.",
    icon: <Settings className="w-8 h-8 text-gray-400" />,
    category: "System",
    rating: 4.7,
    downloads: "10M+",
    size: "10 MB",
    isSystemApp: true,
  },
  {
    id: "snake",
    name: "Snake",
    description: "Classic snake game with high score tracking.",
    icon: <Gamepad2 className="w-8 h-8 text-green-500" />,
    category: "Games",
    rating: 4.2,
    downloads: "500K+",
    size: "1 MB",
    isSystemApp: true,
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    description: "Classic puzzle game - find the mines without detonating them.",
    icon: <Gamepad2 className="w-8 h-8 text-red-400" />,
    category: "Games",
    rating: 4.4,
    downloads: "800K+",
    size: "1 MB",
    isSystemApp: true,
  },
  {
    id: "chat",
    name: "Chat",
    description: "Global chat and direct messaging with other NexusOS users.",
    icon: <MessageSquare className="w-8 h-8 text-purple-400" />,
    category: "Social",
    rating: 4.5,
    downloads: "2M+",
    size: "18 MB",
    isSystemApp: true,
  },
  {
    id: "updates",
    name: "Updates",
    description: "View system updates and announcements from admins.",
    icon: <Package className="w-8 h-8 text-blue-500" />,
    category: "System",
    rating: 4.1,
    downloads: "10M+",
    size: "3 MB",
    isSystemApp: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Watch videos, music, and live streams from creators around the world.",
    icon: <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center"><div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent ml-1" /></div>,
    category: "Entertainment",
    rating: 4.7,
    downloads: "10B+",
    size: "Web App",
    isSystemApp: false,
    externalUrl: "https://www.youtube.com",
  },
  {
    id: "coolmathgames",
    name: "CoolMathGames",
    description: "Play fun brain-training games, puzzles, and strategy games for free.",
    icon: <img src="/assets/coolmathgames-logo.jpeg" alt="CoolMathGames" className="w-8 h-8 rounded-lg object-cover" />,
    category: "Games",
    rating: 4.6,
    downloads: "5B+",
    size: "Web App",
    isSystemApp: false,
    externalUrl: "https://www.coolmathgames.com/",
  },
  {
    id: "geometry-lessons-monster",
    name: "Geometry Lessons Monster",
    description: "Learn geometry with interactive lessons and fun monster-themed challenges.",
    icon: <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">GL</div>,
    category: "Games",
    rating: 4.5,
    downloads: "1M+",
    size: "Web App",
    isSystemApp: false,
    externalUrl: "https://geometry-lessons.monster/",
  },
  {
    id: "request-app",
    name: "Request App",
    description: "Request a new app to be added to the NexusOS App Store.",
    icon: <Package className="w-8 h-8 text-emerald-400" />,
    category: "Utilities",
    rating: 5.0,
    downloads: "1K+",
    size: "Web App",
    isSystemApp: true,
    externalUrl: "https://forms.gle/5FHCupNne952nvcBA",
  },
];

const categories = ["All", "Utilities", "Productivity", "Entertainment", "Games", "Social", "Developer Tools", "System"];

interface ContextMenuState {
  x: number;
  y: number;
  app: AppInfo;
}

export default function AppStoreApp() {
  const { installedApps, installApp, uninstallApp, openWindow } = useOS();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = (e: React.MouseEvent, app: AppInfo) => {
    e.preventDefault();
    e.stopPropagation();
    if (!app.isSystemApp && isInstalled(app.id)) {
      setContextMenu({ x: e.clientX, y: e.clientY, app });
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleUninstallFromContext = () => {
    if (contextMenu) {
      uninstallApp(contextMenu.app.id);
      closeContextMenu();
    }
  };

  const filteredApps = allApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredApps = allApps.filter(app => ["browser", "terminal", "notes", "chat"].includes(app.id));

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  const isInstalled = (appId: string) => installedApps.includes(appId);

  const handleInstallToggle = (app: AppInfo) => {
    if (app.isSystemApp) return;
    
    if (isInstalled(app.id)) {
      uninstallApp(app.id);
    } else {
      installApp(app.id);
    }
  };

  const handleOpenExternalApp = (app: AppInfo) => {
    if (app.externalUrl) {
      openWindow("browser");
      // Store the URL to open in localStorage so BrowserApp can pick it up
      localStorage.setItem("browser-navigate-url", app.externalUrl);
    }
  };

  if (selectedApp) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedApp(null)}
            data-testid="btn-back-to-store"
          >
            Back to Store
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center">
              {selectedApp.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{selectedApp.name}</h1>
              <p className="text-muted-foreground mb-2">{selectedApp.category}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{selectedApp.size}</span>
              </div>
            </div>
            <div>
              {selectedApp.isSystemApp ? (
                <div className="flex gap-2">
                  {selectedApp.externalUrl && (
                    <Button
                      onClick={() => handleOpenExternalApp(selectedApp)}
                      data-testid={`btn-open-${selectedApp.id}`}
                    >
                      Open
                    </Button>
                  )}
                  <Badge variant="secondary" className="px-4 py-2">
                    <Check className="w-4 h-4 mr-2" />
                    System App
                  </Badge>
                </div>
              ) : isInstalled(selectedApp.id) ? (
                <div className="flex gap-2">
                  {selectedApp.externalUrl && (
                    <Button
                      onClick={() => handleOpenExternalApp(selectedApp)}
                      data-testid={`btn-open-${selectedApp.id}`}
                    >
                      Open
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleInstallToggle(selectedApp)}
                    data-testid={`btn-uninstall-${selectedApp.id}`}
                  >
                    Uninstall
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleInstallToggle(selectedApp)}
                  data-testid={`btn-install-${selectedApp.id}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-muted-foreground">{selectedApp.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">What's New</h2>
              <p className="text-muted-foreground text-sm">
                Latest version includes bug fixes and performance improvements.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p>1.0.0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p>{selectedApp.size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p>{selectedApp.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Compatibility</p>
                  <p>NexusOS 1.0+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col" onClick={closeContextMenu}>
      {contextMenu && (
        <div 
          className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={handleUninstallFromContext}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            data-testid="ctx-uninstall-app"
          >
            <Trash2 className="w-4 h-4" />
            Uninstall
          </button>
        </div>
      )}

      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-apps"
          />
        </div>
      </div>

      <Tabs defaultValue="discover" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-transparent h-auto p-0">
          <TabsTrigger 
            value="discover" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-discover"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger 
            value="categories"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-categories"
          >
            <Package className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="installed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-installed"
          >
            <Check className="w-4 h-4 mr-2" />
            Installed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="flex-1 overflow-y-auto p-4 mt-0" style={{ maxHeight: "calc(100% - 100px)" }}>
          {!searchQuery && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Featured Apps</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {featuredApps.map(app => (
                    <div
                      key={app.id}
                      className="p-4 rounded-lg bg-white/5 hover-elevate cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                      data-testid={`featured-app-${app.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{app.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{app.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Recently Updated</h2>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            {filteredApps.map(app => (
              <div
                key={app.id}
                className="flex items-center gap-4 p-3 rounded-lg hover-elevate cursor-pointer"
                onClick={() => setSelectedApp(app)}
                onContextMenu={(e) => handleContextMenu(e, app)}
                data-testid={`app-item-${app.id}`}
              >
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{app.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{app.description}</p>
                </div>
                <div className="shrink-0">
                  {app.isSystemApp || isInstalled(app.id) ? (
                    <Badge variant="secondary">
                      <Check className="w-3 h-3 mr-1" />
                      Installed
                    </Badge>
                  ) : (
                    <Button size="sm" data-testid={`btn-get-${app.id}`}>
                      Get
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="flex-1 overflow-y-auto p-4 mt-0" style={{ maxHeight: "calc(100% - 100px)" }}>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`btn-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredApps.map(app => (
              <div
                key={app.id}
                className="flex items-center gap-4 p-3 rounded-lg hover-elevate cursor-pointer"
                onClick={() => setSelectedApp(app)}
                onContextMenu={(e) => handleContextMenu(e, app)}
                data-testid={`category-app-${app.id}`}
              >
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{app.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{app.description}</p>
                </div>
                <Badge variant="outline">{app.category}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="flex-1 overflow-y-auto p-4 mt-0" style={{ maxHeight: "calc(100% - 100px)" }}>
          <div className="space-y-2">
            {allApps
              .filter(app => app.isSystemApp || isInstalled(app.id))
              .map(app => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                  onContextMenu={(e) => handleContextMenu(e, app)}
                  data-testid={`installed-app-${app.id}`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{app.name}</h3>
                    <p className="text-sm text-muted-foreground">{app.size}</p>
                  </div>
                  {app.isSystemApp ? (
                    <Badge variant="secondary">System</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstallToggle(app);
                      }}
                      data-testid={`btn-remove-${app.id}`}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
