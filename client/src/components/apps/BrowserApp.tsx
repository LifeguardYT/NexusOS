import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Plus, X, Search, Lock, ExternalLink, AlertTriangle, Download, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOS } from "@/lib/os-context";

interface Tab {
  id: string;
  url: string;
  title: string;
}

interface DownloadItem {
  id: string;
  name: string;
  url: string;
  status: "downloading" | "complete" | "error";
  type: string;
}

function getEmbeddableUrl(url: string): { embedUrl: string; isEmbeddable: boolean } {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes("youtube.com")) {
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return { embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0`, isEmbeddable: true };
      }
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return { embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=0`, isEmbeddable: true };
      }
      return { embedUrl: url, isEmbeddable: false };
    }
    
    if (urlObj.hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return { embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0`, isEmbeddable: true };
      }
    }
    
    return { embedUrl: url, isEmbeddable: true };
  } catch {
    return { embedUrl: url, isEmbeddable: true };
  }
}

function needsExternalWarning(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    const blockedSites = [
      "twitter.com", "x.com", "facebook.com", "instagram.com", 
      "linkedin.com", "reddit.com", "tiktok.com", "twitch.tv"
    ];
    
    return blockedSites.some(site => hostname.includes(site));
  } catch {
    return false;
  }
}

function getFileTypeFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return "image";
    if (pathname.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/)) return "audio";
    if (pathname.match(/\.(mp4|webm|mkv|avi|mov)$/)) return "video";
    if (pathname.match(/\.(pdf|doc|docx|txt|md)$/)) return "document";
    if (pathname.match(/\.(zip|rar|7z|tar|gz)$/)) return "archive";
    
    return "file";
  } catch {
    return "file";
  }
}

function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || 'download';
    return decodeURIComponent(fileName);
  } catch {
    return 'download';
  }
}

export function BrowserApp() {
  const { addFile, openWindow } = useOS();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "https://www.google.com/webhp?igu=1", title: "Google" }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [inputUrl, setInputUrl] = useState("https://www.google.com");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    const storedUrl = localStorage.getItem("browser-navigate-url");
    if (storedUrl) {
      localStorage.removeItem("browser-navigate-url");
      setTimeout(() => {
        navigateToUrl(storedUrl);
      }, 100);
    }
  }, []);

  const navigateToUrl = (url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) {
        url = "https://" + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
      }
    }

    setTabs(prev => prev.map(t => 
      t.id === activeTabId ? { ...t, url, title: new URL(url).hostname } : t
    ));
    setInputUrl(url);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex(prev => prev + 1);
  };

  const navigateTo = useCallback((url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) {
        url = "https://" + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
      }
    }

    setTabs(prev => prev.map(t => 
      t.id === activeTabId ? { ...t, url, title: new URL(url).hostname } : t
    ));
    setInputUrl(url);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex(prev => prev + 1);
  }, [activeTabId, historyIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(inputUrl);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setInputUrl(url);
      setTabs(prev => prev.map(t => 
        t.id === activeTabId ? { ...t, url, title: new URL(url).hostname } : t
      ));
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setInputUrl(url);
      setTabs(prev => prev.map(t => 
        t.id === activeTabId ? { ...t, url, title: new URL(url).hostname } : t
      ));
    }
  };

  const refresh = () => {
    const iframe = document.getElementById("browser-frame") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: "https://www.google.com/webhp?igu=1",
      title: "Google"
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setInputUrl(newTab.url);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    setTabs(prev => prev.filter(t => t.id !== tabId));
    
    if (tabId === activeTabId) {
      const newActiveTab = tabs[tabIndex === 0 ? 1 : tabIndex - 1];
      setActiveTabId(newActiveTab.id);
      setInputUrl(newActiveTab.url);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl.trim()) return;
    
    let url = downloadUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const fileName = getFileNameFromUrl(url);
    const fileType = getFileTypeFromUrl(url);
    const downloadId = Date.now().toString();

    const newDownload: DownloadItem = {
      id: downloadId,
      name: fileName,
      url: url,
      status: "downloading",
      type: fileType
    };

    setDownloads(prev => [newDownload, ...prev]);
    setDownloadUrl("");

    setTimeout(() => {
      const fileId = `download-${Date.now()}`;
      addFile({
        id: fileId,
        name: fileName,
        type: "file",
        content: url,
        parentId: "4"
      });

      setDownloads(prev => prev.map(d => 
        d.id === downloadId ? { ...d, status: "complete" } : d
      ));
    }, 1500);
  };

  const openDownloadsFolder = () => {
    openWindow("files");
  };

  const quickLinks = [
    { name: "Google", url: "https://www.google.com/webhp?igu=1" },
    { name: "YouTube", url: "https://www.youtube.com" },
    { name: "Wikipedia", url: "https://www.wikipedia.org" },
    { name: "GitHub", url: "https://www.github.com" },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTabId(tab.id);
              setInputUrl(tab.url);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer max-w-[200px] group ${
              tab.id === activeTabId ? "bg-gray-900" : "bg-gray-700 hover:bg-gray-600"
            }`}
            data-testid={`browser-tab-${tab.id}`}
          >
            <span className="text-xs text-white truncate flex-1">{tab.title}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20"
            >
              <X className="w-3 h-3 text-white/60" />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          data-testid="btn-new-tab"
        >
          <Plus className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            data-testid="btn-browser-back"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            data-testid="btn-browser-forward"
          >
            <ArrowRight className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="btn-browser-refresh"
          >
            <RotateCw className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => navigateTo("https://www.google.com/webhp?igu=1")}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="btn-browser-home"
          >
            <Home className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full pl-9 pr-10 py-2 rounded-full bg-gray-700 border border-gray-600 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Search or enter URL"
              data-testid="input-browser-url"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </form>

        <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <Star className="w-4 h-4 text-white/70" />
        </button>
        <button 
          onClick={() => setShowDownloadPanel(!showDownloadPanel)}
          className={`p-1.5 rounded-lg transition-colors ${showDownloadPanel ? 'bg-blue-500/30 text-blue-400' : 'hover:bg-white/10'}`}
          data-testid="btn-download-toggle"
        >
          <Download className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Quick Links */}
      <div className="flex items-center px-3 py-1.5 bg-gray-800/30 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          {quickLinks.map(link => (
            <button
              key={link.name}
              onClick={() => navigateTo(link.url)}
              className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              data-testid={`quick-link-${link.name.toLowerCase()}`}
            >
              {link.name}
            </button>
          ))}
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 bg-gray-900 relative flex">
        <div className="flex-1 relative">
          {(() => {
            const urlResult = activeTab?.url ? getEmbeddableUrl(activeTab.url) : null;
            const showWarning = (urlResult && !urlResult.isEmbeddable) || (activeTab?.url && needsExternalWarning(activeTab.url));
            
            return (
              <>
                {urlResult?.isEmbeddable && (
                  <iframe
                    id="browser-frame"
                    src={urlResult.embedUrl}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Browser"
                    data-testid="browser-iframe"
                  />
                )}
                
                {showWarning && (
                  <div className={`${urlResult?.isEmbeddable ? 'absolute bottom-4 left-4 right-4' : 'absolute inset-0 flex items-center justify-center'}`}>
                    <div className={`bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg p-6 ${urlResult?.isEmbeddable ? '' : 'max-w-md text-center'}`}>
                      <div className={`flex ${urlResult?.isEmbeddable ? 'items-center justify-between' : 'flex-col items-center gap-4'}`}>
                        <div className={`flex ${urlResult?.isEmbeddable ? 'items-center gap-3' : 'flex-col items-center gap-3'}`}>
                          <AlertTriangle className="w-8 h-8 text-yellow-500 shrink-0" />
                          <div className="text-sm">
                            <p className="text-white font-medium">This site cannot be embedded</p>
                            <p className="text-gray-400 text-xs mt-1">This website blocks embedding. Click to open in a new tab.</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => window.open(activeTab?.url, '_blank')}
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-2 mt-4"
                          data-testid="btn-open-external"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Download Panel */}
        {showDownloadPanel && (
          <div className="w-80 border-l border-gray-700 bg-gray-800/95 flex flex-col">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Downloads</h3>
              <button 
                onClick={() => setShowDownloadPanel(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Enter a direct link to download:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://example.com/file.png"
                  className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                  data-testid="input-download-url"
                />
                <Button 
                  size="sm" 
                  onClick={handleDownload}
                  disabled={!downloadUrl.trim()}
                  data-testid="btn-download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Supports: Images, Audio, Video, Documents
              </p>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {downloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Download className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs">No downloads yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {downloads.map(download => (
                    <div 
                      key={download.id}
                      className="p-2 rounded bg-gray-700/50 border border-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        {download.status === "downloading" ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                        ) : download.status === "complete" ? (
                          <Check className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{download.name}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{download.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-700">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={openDownloadsFolder}
                data-testid="btn-open-downloads"
              >
                <Download className="w-4 h-4" />
                Open Downloads Folder
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
