import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bug, Send, CheckCircle, Clock, XCircle, FileText, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import type { BugReport } from "@shared/schema";

export function BugReportApp() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"report" | "view">("report");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: adminStatus } = useQuery<{ isAdmin: boolean; isOwner: boolean; userId: string | null }>({
    queryKey: ["/api/admin/status"],
  });

  const { data: bugReports = [], isLoading: reportsLoading } = useQuery<BugReport[]>({
    queryKey: ["/api/bug-reports"],
    enabled: adminStatus?.isAdmin === true,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { location: string; description: string; anonymous: boolean }) => {
      return apiRequest("POST", "/api/bug-reports", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      setSubmitError(null);
      setLocation("");
      setDescription("");
      setAnonymous(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (error: Error) => {
      setSubmitError(error.message || "Failed to submit bug report. Please try again.");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      return apiRequest("PATCH", `/api/bug-reports/${id}/resolve`, { resolved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) return;
    submitMutation.mutate({ location, description, anonymous });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isAdmin = adminStatus?.isAdmin === true;
  const isOwner = adminStatus?.isOwner === true;

  const unresolvedCount = bugReports.filter(r => !r.resolved).length;

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Bug className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Report a Bug</h1>
          <p className="text-xs text-muted-foreground">Help me improve NexusOS</p>
        </div>
      </div>

      {isAdmin && (
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "report"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            data-testid="tab-report-bug"
          >
            <FileText className="w-4 h-4" />
            Report Bug
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "view"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            data-testid="tab-view-reports"
          >
            <List className="w-4 h-4" />
            View Reports
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                {unresolvedCount}
              </Badge>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "report" ? (
          <div className="space-y-4">
            {submitError && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-red-500 font-medium">Failed to submit bug report</p>
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSubmitError(null)}
                  className="text-red-500 hover:text-red-400"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {submitted ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-500 font-medium">Bug report submitted successfully! Thank you for your feedback.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Where is the bug?</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Settings app, Calculator, Start Menu..."
                    className="w-full"
                    data-testid="input-bug-location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Describe the bug</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What happened? What did you expect to happen? Please provide as much detail as possible..."
                    className="w-full min-h-[150px] resize-none"
                    data-testid="input-bug-description"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anonymous"
                    checked={anonymous}
                    onCheckedChange={(checked) => setAnonymous(checked === true)}
                    data-testid="checkbox-anonymous"
                  />
                  <label 
                    htmlFor="anonymous" 
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Submit anonymously (hide my username)
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={!location.trim() || !description.trim() || submitMutation.isPending}
                  className="w-full"
                  data-testid="btn-submit-bug"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Bug Report"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reportsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading bug reports...
              </div>
            ) : bugReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No bug reports yet</p>
              </div>
            ) : (
              bugReports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border ${
                    report.resolved 
                      ? "bg-muted/30 border-border opacity-60" 
                      : "bg-card border-border"
                  }`}
                  data-testid={`bug-report-${report.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={report.resolved ? "secondary" : "destructive"}>
                          {report.resolved ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolved
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Open
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          by {report.userName}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-1">
                        Location: {report.location}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {report.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant={report.resolved ? "outline" : "default"}
                        onClick={() => resolveMutation.mutate({ 
                          id: report.id, 
                          resolved: !report.resolved 
                        })}
                        disabled={resolveMutation.isPending}
                        data-testid={`btn-resolve-${report.id}`}
                      >
                        {report.resolved ? "Reopen" : "Resolve"}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
