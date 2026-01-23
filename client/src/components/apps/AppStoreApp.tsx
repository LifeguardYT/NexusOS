import { useState, useEffect, useRef } from "react";
import { useOS, type CustomAppInfo } from "@/lib/os-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Download, Check, Star, Globe, FileText, Calculator, 
  Cloud, Music, Gamepad2, Terminal, Settings, FolderOpen, MessageSquare,
  Package, TrendingUp, Sparkles, Clock, Blocks, Trash2, Plus, Upload, Image, Shield
} from "lucide-react";
import geometryLessonsMonsterLogo from "@assets/download_(79)_1768587249858.png";
import type { CustomApp } from "@shared/schema";

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
  customAppId?: string;
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
    description: "Fun unblocked games that you can play in school.",
    icon: <img src={geometryLessonsMonsterLogo} alt="Geometry Lessons Monster" className="w-8 h-8 rounded-lg object-cover" />,
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
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  
  // Admin state
  const [newAppName, setNewAppName] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [newAppCategory, setNewAppCategory] = useState("Other");
  const [newAppUrl, setNewAppUrl] = useState("");
  const [newAppLogo, setNewAppLogo] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check admin status
  const { data: adminStatus } = useQuery<{ isAdmin: boolean; isOwner: boolean }>({
    queryKey: ["/api/admin/status"],
  });

  // Fetch custom apps
  const { data: customAppsData = [] } = useQuery<CustomApp[]>({
    queryKey: ["/api/custom-apps"],
  });

  // Create custom app mutation
  const createAppMutation = useMutation({
    mutationFn: async (appData: { name: string; description: string; logoBase64: string; category: string; externalUrl?: string }) => {
      return apiRequest("POST", "/api/custom-apps", appData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-apps"] });
      setNewAppName("");
      setNewAppDescription("");
      setNewAppCategory("Other");
      setNewAppUrl("");
      setNewAppLogo("");
      toast({ title: "App added successfully!", description: "The app is now available in the App Store for all users." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add app", description: error.message, variant: "destructive" });
    },
  });

  // Delete custom app mutation
  const deleteAppMutation = useMutation({
    mutationFn: async (appId: string) => {
      return apiRequest("DELETE", `/api/custom-apps/${appId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-apps"] });
      toast({ title: "App removed", description: "The app has been removed from the App Store." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove app", description: error.message, variant: "destructive" });
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast({ title: "File too large", description: "Please select an image under 500KB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAppLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddApp = () => {
    if (!newAppName.trim() || !newAppDescription.trim() || !newAppLogo) {
      toast({ title: "Missing information", description: "Please fill in all required fields and upload a logo", variant: "destructive" });
      return;
    }
    createAppMutation.mutate({
      name: newAppName.trim(),
      description: newAppDescription.trim(),
      logoBase64: newAppLogo,
      category: newAppCategory,
      externalUrl: newAppUrl.trim() || undefined,
    });
  };

  const isAdmin = adminStatus?.isAdmin || adminStatus?.isOwner;

  // Convert custom apps to AppInfo format
  const customAppInfos: AppInfo[] = customAppsData.map((app) => ({
    id: `custom-${app.id}`,
    name: app.name,
    description: app.description,
    icon: <img src={app.logoBase64} alt={app.name} className="w-8 h-8 rounded-lg object-cover" />,
    category: app.category || "Other",
    rating: 5.0,
    downloads: "New",
    size: "Web App",
    isSystemApp: false,
    externalUrl: app.externalUrl || undefined,
    customAppId: app.id,
  }));

  // Combine all apps
  const combinedApps = [...allApps, ...customAppInfos];

  const handleContextMenu = (e: React.MouseEvent, app: AppInfo) => {
    e.preventDefault();
    e.stopPropagation();
    // Show context menu for installed non-system apps OR custom apps (for admins to delete)
    const canShowUninstall = !app.isSystemApp && isInstalled(app.id);
    const canShowDelete = isAdmin && app.customAppId;
    if (canShowUninstall || canShowDelete) {
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

  const handleDeleteFromStore = () => {
    if (contextMenu?.app.customAppId) {
      deleteAppMutation.mutate(contextMenu.app.customAppId);
      closeContextMenu();
    }
  };

  const filteredApps = combinedApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredApps = combinedApps.filter(app => ["browser", "terminal", "notes", "chat"].includes(app.id));

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
      if (app.id.startsWith("custom-") && app.customAppId) {
        const customAppData = customAppsData.find(ca => ca.id === app.customAppId);
        if (customAppData) {
          const customAppInfo: CustomAppInfo = {
            id: app.id,
            name: app.name,
            externalUrl: customAppData.externalUrl || "",
            logoBase64: customAppData.logoBase64,
            category: app.category,
          };
          installApp(app.id, customAppInfo);
        } else {
          installApp(app.id);
        }
      } else {
        installApp(app.id);
      }
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
                  {isAdmin && selectedApp.customAppId && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteAppMutation.mutate(selectedApp.customAppId!);
                        setSelectedApp(null);
                      }}
                      disabled={deleteAppMutation.isPending}
                      data-testid={`btn-delete-from-store-${selectedApp.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete from Store
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleInstallToggle(selectedApp)}
                    data-testid={`btn-install-${selectedApp.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                  {isAdmin && selectedApp.customAppId && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteAppMutation.mutate(selectedApp.customAppId!);
                        setSelectedApp(null);
                      }}
                      disabled={deleteAppMutation.isPending}
                      data-testid={`btn-delete-from-store-${selectedApp.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete from Store
                    </Button>
                  )}
                </div>
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
          {!contextMenu.app.isSystemApp && isInstalled(contextMenu.app.id) && (
            <button
              onClick={handleUninstallFromContext}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="ctx-uninstall-app"
            >
              <Trash2 className="w-4 h-4" />
              Uninstall
            </button>
          )}
          {isAdmin && contextMenu.app.customAppId && (
            <button
              onClick={handleDeleteFromStore}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="ctx-delete-from-store"
            >
              <Trash2 className="w-4 h-4" />
              Delete from Store
            </button>
          )}
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
          {isAdmin && (
            <TabsTrigger 
              value="add-app"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-testid="tab-add-app"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add App
            </TabsTrigger>
          )}
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
            {combinedApps
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

        {isAdmin && (
          <TabsContent value="add-app" className="flex-1 overflow-y-auto p-4 mt-0" style={{ maxHeight: "calc(100% - 100px)" }}>
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                <h2 className="text-xl font-bold">Add New App</h2>
                <p className="text-sm text-muted-foreground">Add a new app to the App Store for all users</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="app-logo">App Logo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    data-testid="input-app-logo"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-24 h-24 rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    data-testid="btn-upload-logo"
                  >
                    {newAppLogo ? (
                      <img src={newAppLogo} alt="App logo" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="app-name">App Name *</Label>
                  <Input
                    id="app-name"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="Enter app name"
                    className="mt-1"
                    data-testid="input-app-name"
                  />
                </div>

                <div>
                  <Label htmlFor="app-description">Description *</Label>
                  <Textarea
                    id="app-description"
                    value={newAppDescription}
                    onChange={(e) => setNewAppDescription(e.target.value)}
                    placeholder="Describe what the app does..."
                    className="mt-1"
                    rows={3}
                    data-testid="input-app-description"
                  />
                </div>

                <div>
                  <Label htmlFor="app-category">Category</Label>
                  <Select value={newAppCategory} onValueChange={setNewAppCategory}>
                    <SelectTrigger className="mt-1" data-testid="select-app-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== "All").map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="app-url">External URL (optional)</Label>
                  <Input
                    id="app-url"
                    value={newAppUrl}
                    onChange={(e) => setNewAppUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1"
                    data-testid="input-app-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">If provided, the app will open in the browser</p>
                </div>

                <Button
                  onClick={handleAddApp}
                  disabled={createAppMutation.isPending}
                  className="w-full"
                  data-testid="btn-add-app"
                >
                  {createAppMutation.isPending ? (
                    "Adding..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add App
                    </>
                  )}
                </Button>
              </div>

              {customAppsData.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-3">Your Added Apps</h3>
                  <div className="space-y-2">
                    {customAppsData.map(app => (
                      <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <img src={app.logoBase64} alt={app.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{app.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{app.category}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAppMutation.mutate(app.id)}
                          disabled={deleteAppMutation.isPending}
                          data-testid={`btn-delete-custom-app-${app.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
