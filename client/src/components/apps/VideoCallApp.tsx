import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Users, Settings, MessageSquare, ScreenShare, X, Send, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

export function VideoCallApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const mockParticipants: Participant[] = [
    { id: "2", name: "John Doe", isMuted: false, isVideoOff: true },
    { id: "3", name: "Jane Smith", isMuted: true, isVideoOff: false },
  ];

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return true;
    } catch (err) {
      console.error("Media access error:", err);
      setError("Unable to access camera/microphone. Please check permissions.");
      return false;
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleJoinCall = async () => {
    const success = await startCamera();
    if (!success) return;
    setIsInCall(true);
    setChatMessages([
      { id: "1", sender: "System", message: "You joined the meeting", timestamp: new Date() },
    ]);
  };

  const handleLeaveCall = () => {
    stopMedia();
    setIsInCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setChatMessages([]);
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
      }
      await startCamera();
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setStream(screenStream);
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          startCamera();
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "You",
      message: chatInput,
      timestamp: new Date(),
    }]);
    setChatInput("");
  };

  const generateMeetingId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setMeetingId(id);
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
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              data-testid="button-join-call"
            >
              <Video className="w-5 h-5 mr-2" />
              {meetingId ? "Join Meeting" : "Start New Meeting"}
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900" data-testid="video-call-app">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Meeting: {meetingId || "New Meeting"}</span>
          <span className="text-gray-400 text-sm">({mockParticipants.length + 1} participants)</span>
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
        <div className="flex-1 p-4 grid grid-cols-2 gap-4 overflow-auto">
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            {isVideoOff ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-3xl bg-blue-600">You</AvatarFallback>
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
              <span>You {isScreenSharing ? "(Screen)" : ""}</span>
              {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
            </div>
          </div>

          {mockParticipants.map(participant => (
            <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              {participant.isVideoOff ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-3xl bg-purple-600">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-3xl">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
                <span>{participant.name}</span>
                {participant.isMuted && <MicOff className="w-3 h-3 text-red-500" />}
              </div>
            </div>
          ))}
        </div>

        {showChat && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <span className="text-white font-medium">Chat</span>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="h-6 w-6 text-gray-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`${msg.sender === "You" ? "text-right" : ""}`}>
                  <div className={`inline-block max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.sender === "You" ? "bg-blue-600 text-white" : 
                    msg.sender === "System" ? "bg-gray-700 text-gray-400 text-xs" : "bg-gray-700 text-white"
                  }`}>
                    {msg.sender !== "You" && msg.sender !== "System" && (
                      <div className="text-xs text-gray-400 mb-1">{msg.sender}</div>
                    )}
                    <p className="text-sm">{msg.message}</p>
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
              <Button size="icon" onClick={sendChatMessage} data-testid="button-send-chat">
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
