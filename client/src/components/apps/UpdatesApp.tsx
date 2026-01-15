import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Update } from "@shared/schema";

export function UpdatesApp() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: updates = [], isLoading } = useQuery<Update[]>({
    queryKey: ["/api/updates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      return apiRequest("POST", "/api/updates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/updates"] });
      setNewTitle("");
      setNewContent("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/updates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/updates"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newContent.trim()) {
      createMutation.mutate({ title: newTitle.trim(), content: newContent.trim() });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-indigo-900 to-purple-900">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">System Updates</h1>
              <p className="text-xs text-white/60">Latest news and announcements</p>
            </div>
          </div>
          <Button
            variant={isAdmin ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAdmin(!isAdmin)}
            className="text-xs"
            data-testid="btn-toggle-admin"
          >
            {isAdmin ? "Exit Admin" : "Admin Mode"}
          </Button>
        </div>
      </div>

      {/* Admin Form */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-white/10 bg-white/5">
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Update title..."
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-indigo-400"
              data-testid="input-update-title"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Update content..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-indigo-400 resize-none"
              data-testid="input-update-content"
            />
            <Button
              type="submit"
              disabled={!newTitle.trim() || !newContent.trim() || createMutation.isPending}
              className="w-full gap-2"
              data-testid="btn-post-update"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post Update
            </Button>
          </div>
        </form>
      )}

      {/* Updates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/60">
            <Bell className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No updates yet</p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 group"
              data-testid={`update-card-${update.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white mb-1">{update.title}</h3>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{update.content}</p>
                  <p className="text-xs text-white/40 mt-2">{formatDate(update.createdAt)}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(update.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    data-testid={`btn-delete-update-${update.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
