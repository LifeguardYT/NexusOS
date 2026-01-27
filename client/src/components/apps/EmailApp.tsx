import { useState, useEffect } from "react";
import { 
  Inbox, Send, FileText, Trash2, Star, Archive, Mail, 
  Pencil, X, Search, RefreshCw, Reply, Forward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  folder: "inbox" | "sent" | "drafts" | "trash" | "archive";
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

type Folder = "inbox" | "sent" | "drafts" | "trash" | "archive" | "starred";

function createMockEmails(userEmail: string): Email[] {
  return [
    {
      id: "1",
      from: "John Smith",
      fromEmail: "JohnSmith@nexusos.com",
      to: userEmail,
      subject: "Welcome to NexusOS!",
      body: "Hello!\n\nWelcome to NexusOS Mail. This is your first email in the system.\n\nWe hope you enjoy using NexusOS and all its features. If you have any questions, feel free to reach out.\n\nBest regards,\nThe NexusOS Team",
      timestamp: new Date(Date.now() - 3600000),
      isRead: false,
      isStarred: false,
      folder: "inbox",
    },
    {
      id: "2",
      from: "System",
      fromEmail: "System@nexusos.com",
      to: userEmail,
      subject: "Your account is set up",
      body: "Your NexusOS account has been successfully configured.\n\nYou can now access all features of the operating system including:\n- File Management\n- Applications\n- Settings\n- And much more!\n\nEnjoy your experience!",
      timestamp: new Date(Date.now() - 7200000),
      isRead: true,
      isStarred: true,
      folder: "inbox",
    },
  ];
}

export function EmailApp() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const getUserNexusEmail = (): string => {
    if (user?.firstName) {
      return `${user.firstName}@nexusos.com`;
    }
    if (user?.email) {
      const username = user.email.split("@")[0];
      return `${username}@nexusos.com`;
    }
    return "Guest@nexusos.com";
  };

  const userEmail = getUserNexusEmail();
  const userName = user?.firstName || user?.email?.split("@")[0] || "Guest";

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      setEmails(createMockEmails(getUserNexusEmail()));
      setInitialized(true);
    }
  }, [user, initialized]);

  const folders = [
    { id: "inbox" as Folder, label: "Inbox", icon: Inbox },
    { id: "starred" as Folder, label: "Starred", icon: Star },
    { id: "sent" as Folder, label: "Sent", icon: Send },
    { id: "drafts" as Folder, label: "Drafts", icon: FileText },
    { id: "archive" as Folder, label: "Archive", icon: Archive },
    { id: "trash" as Folder, label: "Trash", icon: Trash2 },
  ];

  const getFilteredEmails = () => {
    let filtered = emails;
    
    if (selectedFolder === "starred") {
      filtered = emails.filter(e => e.isStarred && e.folder !== "trash");
    } else {
      filtered = emails.filter(e => e.folder === selectedFolder);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.subject.toLowerCase().includes(query) ||
        e.from.toLowerCase().includes(query) ||
        e.body.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getUnreadCount = (folder: Folder) => {
    if (folder === "starred") {
      return emails.filter(e => e.isStarred && !e.isRead && e.folder !== "trash").length;
    }
    return emails.filter(e => e.folder === folder && !e.isRead).length;
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
    }
  };

  const handleToggleStar = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const handleDelete = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, folder: "trash" } : email
    ));
    setSelectedEmail(null);
  };

  const handleArchive = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, folder: "archive" } : email
    ));
    setSelectedEmail(null);
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject) return;
    
    const newEmail: Email = {
      id: Date.now().toString(),
      from: userName,
      fromEmail: userEmail,
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      timestamp: new Date(),
      isRead: true,
      isStarred: false,
      folder: "sent",
    };
    
    setEmails(prev => [newEmail, ...prev]);
    setComposeData({ to: "", subject: "", body: "" });
    setIsComposing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

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
          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    onClick={e => handleToggleStar(email.id, e)}
                    className={`mt-0.5 ${email.isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                  >
                    <Star className="w-4 h-4" fill={email.isStarred ? "currentColor" : "none"} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-sm truncate ${!email.isRead ? "font-semibold" : ""}`}>
                        {email.from}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {formatDate(email.timestamp)}
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
              <Button variant="ghost" size="icon" title="Reply" data-testid="button-reply">
                <Reply className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Forward" data-testid="button-forward">
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
                  {selectedEmail.from.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{selectedEmail.from}</div>
                  <div className="text-sm text-muted-foreground">{selectedEmail.fromEmail}</div>
                  <div className="text-xs text-muted-foreground">
                    To: {selectedEmail.to} &bull; {selectedEmail.timestamp.toLocaleString()}
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
            <Input
              value={composeData.to}
              onChange={e => setComposeData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="To (e.g. Username@nexusos.com)"
              data-testid="input-to"
            />
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
            <Button onClick={handleSendEmail} disabled={!composeData.to || !composeData.subject} data-testid="button-send">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
