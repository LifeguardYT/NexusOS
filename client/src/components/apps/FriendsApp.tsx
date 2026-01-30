import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, UserCheck, UserMinus, Search, Circle, Loader2 } from "lucide-react";

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  createdAt: string;
}

interface OnlineUser {
  userId: string;
  userName: string;
  status: string;
  lastSeen: string;
  activity: string | null;
}

export function FriendsApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [friendIdentifier, setFriendIdentifier] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });
  
  const { data: requests = [], isLoading: requestsLoading } = useQuery<Friend[]>({
    queryKey: ["/api/friends/requests"],
  });
  
  const { data: onlineUsers = [], isLoading: onlineLoading } = useQuery<OnlineUser[]>({
    queryKey: ["/api/presence/online"],
    refetchInterval: 30000,
  });
  
  const sendRequestMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const response = await apiRequest("POST", "/api/friends/request", { identifier });
      return response.json();
    },
    onSuccess: (data) => {
      setFriendIdentifier("");
      setSuccessMessage(data.message || "Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });
  
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("POST", `/api/friends/accept/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });
  
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return apiRequest("DELETE", `/api/friends/${friendshipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });
  
  const filteredFriends = friends.filter(f => 
    f.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.friendId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      case "busy": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Friends
        </h1>
      </div>
      
      <Tabs defaultValue="friends" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 bg-white/5">
          <TabsTrigger value="friends" data-testid="tab-friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="online" data-testid="tab-online">
            Online ({onlineUsers.length})
          </TabsTrigger>
          <TabsTrigger value="add" data-testid="tab-add">
            <UserPlus className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="flex-1 px-4 pb-4 overflow-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
              data-testid="input-search-friends"
            />
          </div>
          
          {friendsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No friends yet</p>
              <p className="text-sm">Add friends to see them here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{friend.friendId}</p>
                      <p className="text-xs text-muted-foreground">
                        Friends since {new Date(friend.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFriendMutation.mutate(friend.id)}
                    data-testid={`btn-remove-friend-${friend.id}`}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="flex-1 px-4 pb-4 overflow-auto">
          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">{request.userId}</p>
                      <p className="text-xs text-muted-foreground">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acceptRequestMutation.mutate(request.id)}
                      className="text-green-400 hover:text-green-300"
                      data-testid={`btn-accept-${request.id}`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFriendMutation.mutate(request.id)}
                      className="text-red-400 hover:text-red-300"
                      data-testid={`btn-decline-${request.id}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="online" className="flex-1 px-4 pb-4 overflow-auto">
          {onlineLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : onlineUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No users online</p>
            </div>
          ) : (
            <div className="space-y-2">
              {onlineUsers.map(user => (
                <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(user.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium">{user.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.activity || "Online"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="add" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email or username of the person you want to add as a friend.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Email or username..."
                value={friendIdentifier}
                onChange={(e) => setFriendIdentifier(e.target.value)}
                className="bg-white/5 border-white/10"
                data-testid="input-friend-identifier"
              />
              <Button
                onClick={() => sendRequestMutation.mutate(friendIdentifier)}
                disabled={!friendIdentifier.trim() || sendRequestMutation.isPending}
                data-testid="btn-send-request"
              >
                {sendRequestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
            {successMessage && (
              <p className="text-sm text-green-400">{successMessage}</p>
            )}
            {sendRequestMutation.isError && (
              <p className="text-sm text-red-400">
                {(sendRequestMutation.error as any)?.message || "User not found or request already sent"}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
