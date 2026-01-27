import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, Check, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";

export function QRCodeApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputText, setInputText] = useState("https://nexusos.app");
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(200);
  const [error, setError] = useState<string | null>(null);

  const drawQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !inputText.trim()) return;

    try {
      setError(null);
      await QRCodeLib.toCanvas(canvas, inputText, {
        width: qrSize,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch (e: any) {
      setError(e.message || "Failed to generate QR code");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, qrSize, qrSize);
        ctx.fillStyle = "#ff0000";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Error generating QR", qrSize / 2, qrSize / 2);
      }
    }
  };

  useEffect(() => {
    drawQRCode();
  }, [inputText, qrSize]);

  const downloadQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-6" data-testid="qrcode-app">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <QrCode className="w-8 h-8" />
          QR Code Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate QR codes for URLs, text, or any data
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Enter text or URL</label>
            <Textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Enter text, URL, or any data..."
              className="min-h-[100px]"
              data-testid="input-text"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">QR Code Size</label>
            <div className="flex gap-2">
              {[150, 200, 250, 300].map(size => (
                <Button
                  key={size}
                  variant={qrSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQrSize(size)}
                  data-testid={`size-${size}`}
                >
                  {size}px
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              Error: {error}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <canvas
              ref={canvasRef}
              width={qrSize}
              height={qrSize}
              className="block"
              data-testid="qr-canvas"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadQRCode} disabled={!inputText.trim() || !!error} data-testid="button-download">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={copyToClipboard} disabled={!inputText.trim() || !!error} data-testid="button-copy">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
