import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Plus, X, Search, Lock, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tab {
  id: string;
  url: string;
  title: string;
}

export function BrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "https://www.youtube.com", title: "YouTube" }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [inputUrl, setInputUrl] = useState("https://www.youtube.com");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const activeTab = tabs.find(t => t.id === activeTabId);

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
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/30 border-b border-gray-700/50">
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

      {/* Browser Content */}
      <div className="flex-1 bg-gray-900 relative">
        <iframe
          id="browser-frame"
          src={activeTab?.url}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Browser"
          data-testid="browser-iframe"
        />
        
        {/* Iframe blocked notice overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="text-sm">
              <p className="text-white font-medium">Some sites may not load in the iframe</p>
              <p className="text-gray-400 text-xs">Sites like YouTube block embedded viewing. Click to open in a new tab.</p>
            </div>
          </div>
          <Button
            onClick={() => window.open(activeTab?.url, '_blank')}
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            data-testid="btn-open-external"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}
