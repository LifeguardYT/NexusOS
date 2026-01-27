import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  MessageSquare, ScreenShare, X, Send, RefreshCw, ExternalLink, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export function VideoCallApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  useEffect(() => {
    if (user && !displayName) {
      const name = user.firstName || user.email.split("@")[0] || "Guest";
      setDisplayName(name);
    }
  }, [user, displayName]);

  const checkIfInIframe = useCallback(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  const connectWebSocket = useCallback((meetingId: string, userName: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({
        type: "join_meeting",
        meetingId,
        userName,
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "meeting_joined":
            setParticipants(message.participants || []);
            setChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: "System",
              text: "You joined the meeting",
              timestamp: new Date().toISOString(),
            }]);
            break;
            
          case "participant_joined":
            setParticipants(message.participants || []);
            if (message.userName !== userName) {
              setChatMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: "System",
                text: `${message.userName} joined the meeting`,
                timestamp: new Date().toISOString(),
              }]);
            }
            break;
            
          case "participant_left":
            setParticipants(message.participants || []);
            setChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: "System",
              text: `${message.userName} left the meeting`,
              timestamp: new Date().toISOString(),
            }]);
            break;
            
          case "chat_message":
            setChatMessages(prev => [...prev, {
              id: message.id,
              sender: message.sender,
              text: message.text,
              timestamp: message.timestamp,
            }]);
            break;
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };
    
    ws.onclose = () => {
      setWsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
    };
    
    wsRef.current = ws;
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave_meeting" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      setIsInIframe(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsStreaming(true);
          setIsLoading(false);
        };
      } else {
        setIsStreaming(true);
        setIsLoading(false);
      }
      
      return true;
    } catch (err: any) {
      console.error("Media access error:", err);
      setIsLoading(false);
      
      if (checkIfInIframe()) {
        setIsInIframe(true);
        setError("Camera/microphone access is blocked in this preview. Please open in a new tab.");
      } else if (err.name === "NotAllowedError") {
        setError("Camera/microphone access denied. Please allow permissions in your browser.");
      } else if (err.name === "NotFoundError") {
        setError("No camera or microphone found.");
      } else if (err.name === "NotReadableError") {
        setError("Camera/microphone is already in use by another application.");
      } else {
        setError(err.message || "Unable to access camera/microphone.");
      }
      return false;
    }
  }, [checkIfInIframe]);

  const stopAllMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleJoinCall = async () => {
    if (!displayName.trim()) {
      setError("Please enter your display name");
      return;
    }
    
    const actualMeetingId = meetingId || generateMeetingIdValue();
    setMeetingId(actualMeetingId);
    
    const success = await startCamera();
    if (!success) return;
    
    connectWebSocket(actualMeetingId, displayName);
    setIsInCall(true);
  };

  const handleLeaveCall = () => {
    disconnectWebSocket();
    stopAllMedia();
    setIsInCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setChatMessages([]);
    setParticipants([]);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          setError("Screen sharing not supported in this browser");
          return;
        }
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false 
        });
        screenStreamRef.current = screenStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };
      } catch (err: any) {
        console.error("Screen share error:", err);
        if (err.name !== "AbortError") {
          setError("Unable to share screen.");
        }
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: "chat_message",
      text: chatInput.trim(),
    }));
    
    setChatInput("");
  };

  const generateMeetingIdValue = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateMeetingId = () => {
    setMeetingId(generateMeetingIdValue());
  };

  if (!isInCall) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 p-8" data-testid="video-call-app">
        <div className="text-center mb-8">
          <Video className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">NexusOS Meet</h1>
          <p className="text-gray-400">Start or join a video call</p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your Name</label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-display-name"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Meeting ID</label>
              <div className="flex gap-2">
                <Input
                  value={meetingId}
                  onChange={e => setMeetingId(e.target.value.toUpperCase())}
                  placeholder="Enter meeting ID"
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-meeting-id"
                />
                <Button variant="outline" onClick={generateMeetingId} data-testid="button-generate-id">
                  Generate
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleJoinCall} 
              className="w-full bg-blue-600"
              size="lg"
              disabled={isLoading || !displayName.trim()}
              data-testid="button-join-call"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  {meetingId ? "Join Meeting" : "Start New Meeting"}
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              {isInIframe && (
                <Button onClick={openInNewTab} variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          )}
          
          <p className="text-gray-500 text-xs text-center">
            Share the Meeting ID with others to let them join your call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900" data-testid="video-call-app">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Meeting: {meetingId}</span>
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participants.length} {participants.length === 1 ? "participant" : "participants"}
          </span>
          {!wsConnected && (
            <span className="text-yellow-400 text-xs">(Reconnecting...)</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={`text-white ${showChat ? "bg-blue-600" : ""}`}
            data-testid="button-toggle-chat"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full max-w-3xl aspect-video">
            {isVideoOff ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Avatar className="w-32 h-32">
                  <AvatarFallback className="text-4xl bg-blue-600">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: isScreenSharing ? "none" : "scaleX(-1)" }}
                data-testid="video-self"
              />
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
              <span>{displayName} {isScreenSharing ? "(Screen)" : "(You)"}</span>
              {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
            </div>
            {error && (
              <div className="absolute top-2 left-2 right-2 bg-red-500/80 px-2 py-1 rounded text-white text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {showChat && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <span className="text-white font-medium">Chat</span>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="text-gray-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`${msg.sender === displayName ? "text-right" : ""}`}>
                  <div className={`inline-block max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.sender === displayName ? "bg-blue-600 text-white" : 
                    msg.sender === "System" ? "bg-gray-700 text-gray-400 text-xs" : "bg-gray-700 text-white"
                  }`}>
                    {msg.sender !== displayName && msg.sender !== "System" && (
                      <div className="text-xs text-gray-400 mb-1">{msg.sender}</div>
                    )}
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-chat"
              />
              <Button size="icon" onClick={sendChatMessage} disabled={!wsConnected} data-testid="button-send-chat">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-center gap-3">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          onClick={toggleMute}
          className="rounded-full"
          data-testid="button-mute"
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          size="icon"
          onClick={toggleVideo}
          className="rounded-full"
          data-testid="button-video"
        >
          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </Button>
        <Button
          variant={isScreenSharing ? "secondary" : "outline"}
          size="icon"
          onClick={toggleScreenShare}
          className="rounded-full"
          data-testid="button-screen-share"
        >
          <ScreenShare className="w-4 h-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleLeaveCall}
          className="rounded-full"
          data-testid="button-leave-call"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
