import { useState, useEffect, useRef } from "react";
import { 
  Inbox, Send, FileText, Trash2, Star, Archive, Mail, 
  Pencil, X, Search, RefreshCw, Reply, Forward, Loader2, User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailSuggestion {
  email: string;
  name: string;
}

interface Email {
  id: string;
  fromUserId: string;
  fromName: string;
  fromEmail: string;
  toUserId: string;
  toEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  createdAt: string;
}

interface EmailsResponse {
  inbox: Email[];
  sent: Email[];
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

type Folder = "inbox" | "sent" | "drafts" | "trash" | "archive" | "starred";

export function EmailApp() {
  const { toast } = useToast();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: emailsData, isLoading, refetch } = useQuery<EmailsResponse>({
    queryKey: ["/api/emails"],
    refetchInterval: 30000,
  });

  const getUserNexusEmail = (): string => {
    if (user?.firstName) {
      return `${user.firstName}@nexusos.live`;
    }
    if (user?.email) {
      const username = user.email.split("@")[0];
      return `${username}@nexusos.live`;
    }
    return "Guest@nexusos.live";
  };

  const userEmail = getUserNexusEmail();

  const [selectedFolder, setSelectedFolder] = useState<Folder>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  
  // Email autocomplete state
  const [emailSuggestions, setEmailSuggestions] = useState<EmailSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search for users as they type
  useEffect(() => {
    const searchUsers = async () => {
      const query = composeData.to.split("@")[0]; // Get part before @
      if (query.length < 1) {
        setEmailSuggestions([]);
        return;
      }
      
      setIsSearchingUsers(true);
      try {
        const res = await fetch(`/api/emails/search-users?query=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const suggestions = await res.json();
          setEmailSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [composeData.to]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        toInputRef.current &&
        !toInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectEmailSuggestion = (email: string) => {
    setComposeData(prev => ({ ...prev, to: email }));
    setShowSuggestions(false);
    setEmailSuggestions([]);
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { toEmail: string; subject: string; body: string }) => {
      return apiRequest("POST", "/api/emails", data);
    },
    onSuccess: () => {
      toast({ title: "Email sent successfully" });
      setComposeData({ to: "", subject: "", body: "" });
      setIsComposing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send email", 
        description: error.message || "Recipient not found",
        variant: "destructive" 
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ emailId, isRead }: { emailId: string; isRead: boolean }) => {
      return apiRequest("PATCH", `/api/emails/${emailId}/read`, { isRead });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const starMutation = useMutation({
    mutationFn: async ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) => {
      return apiRequest("PATCH", `/api/emails/${emailId}/star`, { isStarred });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: async ({ emailId, folder }: { emailId: string; folder: string }) => {
      return apiRequest("PATCH", `/api/emails/${emailId}/folder`, { folder });
    },
    onSuccess: () => {
      setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const folders = [
    { id: "inbox" as Folder, label: "Inbox", icon: Inbox },
    { id: "starred" as Folder, label: "Starred", icon: Star },
    { id: "sent" as Folder, label: "Sent", icon: Send },
    { id: "drafts" as Folder, label: "Drafts", icon: FileText },
    { id: "archive" as Folder, label: "Archive", icon: Archive },
    { id: "trash" as Folder, label: "Trash", icon: Trash2 },
  ];

  const getAllEmails = (): Email[] => {
    if (!emailsData) return [];
    return [...emailsData.inbox, ...emailsData.sent];
  };

  const getFilteredEmails = (): Email[] => {
    const allEmails = getAllEmails();
    let filtered: Email[] = [];
    
    if (selectedFolder === "starred") {
      filtered = allEmails.filter(e => e.isStarred && e.folder !== "trash");
    } else if (selectedFolder === "sent") {
      filtered = emailsData?.sent.filter(e => e.folder !== "trash") || [];
    } else if (selectedFolder === "inbox") {
      filtered = emailsData?.inbox.filter(e => e.folder === "inbox") || [];
    } else {
      filtered = allEmails.filter(e => e.folder === selectedFolder);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.subject.toLowerCase().includes(query) ||
        e.fromName.toLowerCase().includes(query) ||
        e.body.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getUnreadCount = (folder: Folder): number => {
    if (!emailsData) return 0;
    const allEmails = getAllEmails();
    
    if (folder === "starred") {
      return allEmails.filter(e => e.isStarred && !e.isRead && e.folder !== "trash").length;
    }
    if (folder === "inbox") {
      return emailsData.inbox.filter(e => e.folder === "inbox" && !e.isRead).length;
    }
    return allEmails.filter(e => e.folder === folder && !e.isRead).length;
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markReadMutation.mutate({ emailId: email.id, isRead: true });
    }
  };

  const handleToggleStar = (emailId: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    starMutation.mutate({ emailId, isStarred: !currentStarred });
  };

  const handleDelete = (emailId: string) => {
    moveFolderMutation.mutate({ emailId, folder: "trash" });
  };

  const handleArchive = (emailId: string) => {
    moveFolderMutation.mutate({ emailId, folder: "archive" });
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject) return;
    sendEmailMutation.mutate({
      toEmail: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background" data-testid="email-app">
      <div className="w-48 bg-muted/30 border-r flex flex-col">
        <div className="p-2">
          <Button 
            onClick={() => setIsComposing(true)} 
            className="w-full gap-2"
            data-testid="button-compose"
          >
            <Pencil className="w-4 h-4" />
            Compose
          </Button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => { setSelectedFolder(folder.id); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFolder === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              data-testid={`folder-${folder.id}`}
            >
              <folder.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{folder.label}</span>
              {getUnreadCount(folder.id) > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5">
                  {getUnreadCount(folder.id)}
                </Badge>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-2 border-t text-xs text-muted-foreground truncate">
          {userEmail}
        </div>
      </div>

      <div className="w-72 border-r flex flex-col">
        <div className="p-2 border-b flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="pl-8 h-8"
              data-testid="input-search"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {getFilteredEmails().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Mail className="w-12 h-12 mb-2" />
              <p>No emails</p>
            </div>
          ) : (
            getFilteredEmails().map(email => (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`p-3 border-b cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id ? "bg-muted" : "hover:bg-muted/50"
                } ${!email.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                data-testid={`email-${email.id}`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={e => handleToggleStar(email.id, email.isStarred, e)}
                    className={`mt-0.5 ${email.isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                  >
                    <Star className="w-4 h-4" fill={email.isStarred ? "currentColor" : "none"} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-sm truncate ${!email.isRead ? "font-semibold" : ""}`}>
                        {email.fromName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {formatDate(email.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${!email.isRead ? "font-medium" : ""}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {email.body.substring(0, 50)}...
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-3 border-b flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
                <X className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                title="Reply" 
                data-testid="button-reply"
                onClick={() => {
                  setComposeData({
                    to: selectedEmail.fromEmail,
                    subject: `Re: ${selectedEmail.subject}`,
                    body: `\n\n---\nOn ${new Date(selectedEmail.createdAt).toLocaleString()}, ${selectedEmail.fromName} wrote:\n${selectedEmail.body}`,
                  });
                  setIsComposing(true);
                }}
              >
                <Reply className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Forward" 
                data-testid="button-forward"
                onClick={() => {
                  setComposeData({
                    to: "",
                    subject: `Fwd: ${selectedEmail.subject}`,
                    body: `\n\n---\nForwarded message from ${selectedEmail.fromName}:\n${selectedEmail.body}`,
                  });
                  setIsComposing(true);
                }}
              >
                <Forward className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleArchive(selectedEmail.id)} title="Archive" data-testid="button-archive">
                <Archive className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedEmail.id)} title="Delete" data-testid="button-delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-xl font-semibold mb-4">{selectedEmail.subject}</h2>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                  {selectedEmail.fromName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{selectedEmail.fromName}</div>
                  <div className="text-sm text-muted-foreground">{selectedEmail.fromEmail}</div>
                  <div className="text-xs text-muted-foreground">
                    To: {selectedEmail.toEmail} &bull; {new Date(selectedEmail.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm">{selectedEmail.body}</div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {isComposing && (
        <div className="absolute inset-4 bg-background border rounded-lg shadow-xl flex flex-col z-50" data-testid="compose-modal">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">New Message</h3>
            <div className="text-sm text-muted-foreground">From: {userEmail}</div>
            <Button variant="ghost" size="icon" onClick={() => setIsComposing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Input
                ref={toInputRef}
                value={composeData.to}
                onChange={e => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                onFocus={() => emailSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="To (e.g. Username@nexusos.live)"
                data-testid="input-to"
              />
              {isSearchingUsers && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {showSuggestions && emailSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto"
                  data-testid="email-suggestions"
                >
                  {emailSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectEmailSuggestion(suggestion.email)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 transition-colors"
                      data-testid={`suggestion-${idx}`}
                    >
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{suggestion.name}</div>
                        <div className="text-xs text-muted-foreground">{suggestion.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input
              value={composeData.subject}
              onChange={e => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject"
              data-testid="input-subject"
            />
          </div>
          <Textarea
            value={composeData.body}
            onChange={e => setComposeData(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Write your message..."
            className="flex-1 border-0 resize-none focus-visible:ring-0"
            data-testid="input-body"
          />
          <div className="p-3 border-t flex justify-end">
            <Button 
              onClick={handleSendEmail} 
              disabled={!composeData.to || !composeData.subject || sendEmailMutation.isPending} 
              data-testid="button-send"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
