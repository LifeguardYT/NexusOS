import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Monitor, CheckCircle, AlertCircle, Package, Loader2, ExternalLink } from "lucide-react";

const features = [
  "Full desktop experience in a native window",
  "All 30+ apps included",
  "Works with your NexusOS account",
  "System tray integration",
  "No browser required",
  "Cross-platform support",
];

export function DownloadApp() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/download/nexusos-desktop");
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "NexusOS-Desktop.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowInstructions(true);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
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
            Run NexusOS as a desktop app on your computer
          </p>
        </div>

        <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-white font-semibold text-lg">Download NexusOS Desktop</h3>
              <p className="text-gray-400 text-sm">Works on Windows, Mac, and Linux</p>
            </div>
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-download"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download ZIP
                </>
              )}
            </Button>
          </div>
        </Card>

        {showInstructions && (
          <Card className="p-5 mb-6 bg-green-500/10 border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-green-400 font-semibold text-lg mb-3">Download Complete! Here's how to run it:</h4>
                <div className="text-gray-200 space-y-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">Step 1: Install Node.js (if you don't have it)</p>
                    <p className="text-gray-400 text-sm mb-2">Go to this website and download the installer:</p>
                    <a 
                      href="https://nodejs.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      https://nodejs.org <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-gray-500 text-xs mt-2">Download the "LTS" version and install it like any other program</p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">Step 2: Extract the ZIP file</p>
                    <p className="text-gray-400 text-sm">Find the downloaded "NexusOS-Desktop.zip" file and extract it (right-click → Extract All on Windows, or double-click on Mac)</p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">Step 3: Open Command Prompt / Terminal</p>
                    <p className="text-gray-400 text-sm mb-2"><strong>Windows:</strong> Open the extracted folder, click the address bar, type <code className="bg-black/50 px-1 rounded">cmd</code> and press Enter</p>
                    <p className="text-gray-400 text-sm"><strong>Mac:</strong> Open Terminal, type <code className="bg-black/50 px-1 rounded">cd </code> (with a space), then drag the extracted folder into Terminal and press Enter</p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">Step 4: Install and Run</p>
                    <p className="text-gray-400 text-sm mb-2">Type these commands one at a time and press Enter after each:</p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="bg-black/50 px-3 py-2 rounded text-green-400">npm install</div>
                      <p className="text-gray-500 text-xs">Wait for it to finish (might take a minute)...</p>
                      <div className="bg-black/50 px-3 py-2 rounded text-green-400">npm start</div>
                    </div>
                  </div>
                  
                  <p className="text-green-400 font-medium">NexusOS will open in its own window!</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-white/5 border-white/10 mb-6">
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

        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium">Important</h4>
              <p className="text-gray-300 text-sm mt-1">
                You need Node.js installed on your computer. It's free and safe to install from nodejs.org. 
                The app also needs internet to connect to NexusOS.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-gray-500 text-xs mt-6">
          NexusOS Desktop is powered by Electron
        </p>
      </div>
    </div>
  );
}
