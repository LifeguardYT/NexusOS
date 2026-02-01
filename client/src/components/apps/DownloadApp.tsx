import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Monitor, Terminal, CheckCircle, AlertCircle, Package, Loader2 } from "lucide-react";

const features = [
  "Full desktop experience in a native window",
  "All 30+ apps included",
  "Works with your NexusOS account",
  "System tray integration",
  "No browser required",
  "Cross-platform support",
];

const requirements = [
  { title: "Node.js", desc: "Version 18 or higher (download from nodejs.org)" },
  { title: "Internet", desc: "Required to connect to NexusOS servers" },
  { title: "Storage", desc: "~200MB for dependencies" },
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
            Download NexusOS as a desktop application for your computer
          </p>
        </div>

        <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-white font-semibold text-lg">Universal Package</h3>
              <p className="text-gray-400 text-sm">Works on Windows, macOS, and Linux</p>
              <p className="text-gray-500 text-xs mt-1">Requires Node.js to run</p>
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
                  Download
                </>
              )}
            </Button>
          </div>
        </Card>

        {showInstructions && (
          <Card className="p-4 mb-6 bg-green-500/10 border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="text-green-400 font-medium">Download Complete!</h4>
                <div className="text-gray-300 text-sm mt-2 space-y-2">
                  <p>To run NexusOS Desktop:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Extract the ZIP file</li>
                    <li>Open a terminal in the extracted folder</li>
                    <li>Run: <code className="bg-black/30 px-2 py-0.5 rounded">npm install</code></li>
                    <li>Run: <code className="bg-black/30 px-2 py-0.5 rounded">npm start</code></li>
                  </ol>
                  <p className="text-gray-400 mt-2">See the README file for more details.</p>
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

        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Requirements
          </h2>
          <div className="space-y-3">
            {requirements.map((req, i) => (
              <div key={i}>
                <h4 className="text-white font-medium">{req.title}</h4>
                <p className="text-gray-400 text-sm">{req.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium">Note</h4>
              <p className="text-gray-300 text-sm mt-1">
                This package requires Node.js installed on your computer. 
                Download Node.js from <span className="text-blue-400">nodejs.org</span> if you don't have it.
                The app needs an internet connection to work.
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
