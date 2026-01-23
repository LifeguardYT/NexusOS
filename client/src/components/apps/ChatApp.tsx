import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Users, Search, Send, Globe, User, ArrowLeft, Trash2, Crown, Shield, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string | null;
  content: string;
  isGlobal: boolean;
  createdAt: string;
  senderIsOwner?: boolean;
  senderIsAdmin?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
}

interface ChatUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

type ChatView = "global" | "direct" | "search";

// Bad word filter - replaces profanity with asterisks
const badWords = [
  "fuck", "shit", "ass", "bitch", "damn", "crap", "hell", "dick", "cock", 
  "pussy", "bastard", "asshole", "cunt", "whore", "slut", "fag", "nigger",
  "nigga", "retard", "piss", "bollocks", "wanker", "twat", "prick"
];

function filterBadWords(text: string): string {
  let filtered = text;
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
}

interface AdminStatus {
  isAdmin: boolean;
  isOwner: boolean;
  userId: string | null;
}

export function ChatApp() {
  const [chatView, setChatView] = useState<ChatView>("global");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: currentUser } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
  });

  const { data: adminStatus } = useQuery<AdminStatus>({
    queryKey: ["/api/admin/status"],
  });

  const isAdmin = adminStatus?.isAdmin || adminStatus?.isOwner;

  const { data: globalMessages = [], isLoading: isLoadingGlobal } = useQuery<Message[]>({
    queryKey: ["/api/chat/global"],
    refetchInterval: 3000,
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/chat/conversations"],
    enabled: !!currentUser,
  });

  const { data: directMessages = [], isLoading: isLoadingDirect } = useQuery<Message[]>({
    queryKey: ["/api/chat/direct", selectedUserId],
    enabled: !!selectedUserId && !!currentUser,
    refetchInterval: 3000,
  });

  const { data: searchResults = [] } = useQuery<ChatUser[]>({
    queryKey: ["/api/chat/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await fetch(`/api/chat/users/search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const startCooldown = () => {
    setCooldown(3);
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const sendGlobalMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat/global", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/global"] });
      setMessageInput("");
      startCooldown();
    },
  });

  const sendDirectMutation = useMutation({
    mutationFn: async ({ userId, content }: { userId: string; content: string }) => {
      return apiRequest("POST", `/api/chat/direct/${userId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/direct", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setMessageInput("");
      startCooldown();
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("DELETE", `/api/chat/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/global"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/direct", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalMessages, directMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || cooldown > 0) return;
    
    if (chatView === "global") {
      sendGlobalMutation.mutate(messageInput);
    } else if (chatView === "direct" && selectedUserId) {
      sendDirectMutation.mutate({ userId: selectedUserId, content: messageInput });
    }
  };

  const canDeleteMessage = (msg: Message) => {
    return msg.senderId === currentUser?.id || isAdmin;
  };

  const handleSelectUser = (user: ChatUser | Conversation) => {
    const userId = user.id;
    const userName = 'name' in user ? user.name : `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setChatView("direct");
    setSearchQuery("");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const messages = chatView === "global" ? globalMessages : directMessages;
  const isLoading = chatView === "global" ? isLoadingGlobal : isLoadingDirect;

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center" data-testid="chat-login-prompt">
        <MessageCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign in to Chat</h2>
        <p className="text-muted-foreground">You need to be signed in to use the chat feature.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background" data-testid="chat-app">
      <div className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) {
                  setChatView("search");
                }
              }}
              className="pl-9 bg-white/5 border-white/10"
              data-testid="input-search-users"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                setChatView("global");
                setSelectedUserId(null);
                setSearchQuery("");
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                chatView === "global" ? "bg-blue-500/20 text-blue-400" : "hover:bg-white/5"
              }`}
              data-testid="btn-global-chat"
            >
              <Globe className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Global Chat</p>
                <p className="text-xs text-muted-foreground">Chat with everyone</p>
              </div>
            </button>

            {chatView === "search" && searchQuery.length >= 2 && (
              <div className="pt-2">
                <p className="px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider">Search Results</p>
                {searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No users found</p>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                      data-testid={`search-result-${user.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {conversations.length > 0 && chatView !== "search" && (
              <div className="pt-2">
                <p className="px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider">Direct Messages</p>
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectUser(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedUserId === conv.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {conv.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{conv.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-white/10 flex items-center gap-3">
          {chatView === "direct" && (
            <button
              onClick={() => {
                setChatView("global");
                setSelectedUserId(null);
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              data-testid="btn-back-to-global"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            {chatView === "global" ? (
              <>
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Global Chat</span>
              </>
            ) : chatView === "direct" && selectedUserName ? (
              <>
                <User className="w-5 h-5 text-purple-400" />
                <span className="font-medium">{selectedUserName}</span>
              </>
            ) : (
              <span className="font-medium">Select a chat</span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div className={`flex items-end gap-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-white/10 rounded-bl-md"
                        }`}
                      >
                        {chatView === "global" && (
                          <div className={`flex items-center flex-wrap gap-1.5 mb-1 ${isOwn ? "justify-end" : ""}`}>
                            <p className={`text-xs font-medium ${isOwn ? "text-blue-100" : "text-blue-400"}`}>
                              {isOwn ? "You" : msg.senderName}
                            </p>
                            {msg.senderIsOwner && (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isOwn ? "bg-yellow-500/30 text-yellow-200 border border-yellow-400/40" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}>
                                <Crown className="w-2.5 h-2.5" />
                                OWNER
                              </span>
                            )}
                            {msg.senderIsAdmin && !msg.senderIsOwner && (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isOwn ? "bg-white/20 text-white border border-white/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                                <Shield className="w-2.5 h-2.5" />
                                ADMIN
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm break-words">{filterBadWords(msg.content)}</p>
                        <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-muted-foreground"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                      {canDeleteMessage(msg) && (
                        <button
                          onClick={() => deleteMessageMutation.mutate(msg.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
                          title={isOwn ? "Delete message" : "Delete message (Admin)"}
                          data-testid={`btn-delete-message-${msg.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-white/10 relative">
          {showEmojiPicker && (
            <div 
              ref={emojiPickerRef}
              className="absolute bottom-16 left-3 z-50"
              data-testid="emoji-picker"
            >
              <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={(chatView === "direct" && !selectedUserId) || cooldown > 0}
              data-testid="btn-emoji-picker"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
            <Input
              ref={inputRef}
              placeholder={chatView === "global" ? "Message everyone..." : `Message ${selectedUserName}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              className="flex-1 bg-white/5 border-white/10"
              disabled={(chatView === "direct" && !selectedUserId) || cooldown > 0}
              data-testid="input-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || (chatView === "direct" && !selectedUserId) || cooldown > 0}
              size="icon"
              data-testid="btn-send-message"
              title={cooldown > 0 ? `Wait ${cooldown}s` : "Send message"}
            >
              {cooldown > 0 ? (
                <span className="text-xs font-bold">{cooldown}</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {cooldown > 0 && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Please wait {cooldown} second{cooldown !== 1 ? 's' : ''} before sending another message
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
