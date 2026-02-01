import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Monitor, Terminal, CheckCircle, AlertCircle, LucideIcon } from "lucide-react";

type Platform = "windows" | "mac" | "linux";

interface DownloadOption {
  platform: Platform;
  icon: string;
  name: string;
  fileName: string;
  size: string;
  available: boolean;
}

const downloadOptions: DownloadOption[] = [
  {
    platform: "windows",
    icon: "W",
    name: "Windows",
    fileName: "NexusOS-Setup-1.0.0.exe",
    size: "~85 MB",
    available: false,
  },
  {
    platform: "mac",
    icon: "M",
    name: "macOS",
    fileName: "NexusOS-1.0.0.dmg",
    size: "~90 MB",
    available: false,
  },
  {
    platform: "linux",
    icon: "L",
    name: "Linux",
    fileName: "NexusOS-1.0.0.AppImage",
    size: "~80 MB",
    available: false,
  },
];

const features = [
  "Full desktop experience in a native window",
  "All 30+ apps included",
  "Works with your NexusOS account",
  "Automatic updates",
  "System tray integration",
  "Keyboard shortcuts",
];

export function DownloadApp() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  const handleDownload = (option: DownloadOption) => {
    if (!option.available) {
      setSelectedPlatform(option.platform);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6" data-testid="download-app">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-3xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NexusOS Desktop</h1>
          <p className="text-gray-400">
            Download NexusOS as a desktop application for your computer
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {downloadOptions.map((option) => (
              <Card 
                key={option.platform}
                className="p-4 bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => handleDownload(option)}
                data-testid={`download-${option.platform}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{option.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{option.name}</h3>
                    <p className="text-gray-400 text-sm">{option.fileName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">{option.size}</p>
                    {option.available ? (
                      <Button size="sm" className="mt-1">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    ) : (
                      <span className="text-yellow-400 text-xs">Coming Soon</span>
                    )}
                  </div>
                </div>
              </Card>
          ))}
        </div>

        {selectedPlatform && (
          <Card className="p-4 mb-8 bg-yellow-500/10 border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-medium">Desktop App Coming Soon</h4>
                <p className="text-gray-300 text-sm mt-1">
                  The NexusOS desktop app is currently in development. For now, you can use NexusOS directly in your browser at this URL. 
                  You can also add it to your home screen or bookmark it for quick access.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            System Requirements
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-white font-medium mb-1">Windows</h4>
              <p className="text-gray-400">Windows 10 or later, 64-bit</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">macOS</h4>
              <p className="text-gray-400">macOS 10.15 (Catalina) or later</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Linux</h4>
              <p className="text-gray-400">Ubuntu 18.04+, Fedora 32+, or equivalent</p>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-gray-400">
                All platforms require an active internet connection to use NexusOS features.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-gray-500 text-xs mt-6">
          NexusOS Desktop is powered by Electron and requires an internet connection.
        </p>
      </div>
    </div>
  );
}
