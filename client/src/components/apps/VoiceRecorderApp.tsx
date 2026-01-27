import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Download, ExternalLink } from "lucide-react";

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
}

export function VoiceRecorderApp() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkIfInIframe = useCallback(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        
        setRecordings(prev => [{
          id: Date.now().toString(),
          blob,
          url,
          duration: recordingTime,
          timestamp: new Date(),
        }, ...prev]);
        
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Recording error:", err);
      
      if (checkIfInIframe()) {
        setIsInIframe(true);
        setError("Microphone access is blocked in this preview. Please open in a new tab.");
      } else if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found.");
      } else {
        setError(err.message || "Unable to access microphone.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = (recording: Recording) => {
    if (playingId === recording.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(recording.url);
      audioRef.current = audio;
      audio.play();
      setPlayingId(recording.id);
      
      audio.onended = () => setPlayingId(null);
    }
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const downloadRecording = (recording: Recording) => {
    const link = document.createElement("a");
    link.href = recording.url;
    link.download = `recording-${recording.timestamp.toISOString()}.webm`;
    link.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const openInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordings.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-red-900 to-red-950 p-6" data-testid="voicerecorder-app">
      <h1 className="text-2xl font-bold text-white text-center mb-6">Voice Recorder</h1>

      <div className="flex-1 flex flex-col items-center justify-center">
        {error ? (
          <div className="text-center">
            <Mic className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-red-300 mb-4">{error}</p>
            {isInIframe ? (
              <Button onClick={openInNewTab} data-testid="button-open-new-tab">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            ) : (
              <Button onClick={startRecording} data-testid="button-retry">
                Try Again
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-6 transition-all ${
              isRecording ? "bg-red-500 animate-pulse" : "bg-white/10"
            }`}>
              <Mic className={`w-20 h-20 ${isRecording ? "text-white" : "text-red-400"}`} />
            </div>

            {isRecording && (
              <div className="text-4xl font-mono text-white mb-6">
                {formatTime(recordingTime)}
              </div>
            )}

            <div className="flex gap-4">
              {isRecording ? (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="w-40 h-14"
                  data-testid="button-stop"
                >
                  <Square className="w-6 h-6 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="w-40 h-14 bg-red-500 hover:bg-red-600"
                  data-testid="button-record"
                >
                  <Mic className="w-6 h-6 mr-2" />
                  Record
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {recordings.length > 0 && (
        <div className="mt-6 max-h-48 overflow-y-auto space-y-2">
          <h2 className="text-white font-semibold mb-2">Recordings ({recordings.length})</h2>
          {recordings.map(recording => (
            <div
              key={recording.id}
              className="bg-white/10 rounded-lg p-3 flex items-center gap-3"
              data-testid={`recording-${recording.id}`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playRecording(recording)}
                className="text-white"
              >
                {playingId === recording.id ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              
              <div className="flex-1">
                <div className="text-white text-sm">
                  {recording.timestamp.toLocaleTimeString()}
                </div>
                <div className="text-gray-400 text-xs">
                  {formatTime(recording.duration)}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => downloadRecording(recording)}
                className="text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteRecording(recording.id)}
                className="text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
