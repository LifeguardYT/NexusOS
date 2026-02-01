import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

// Detect if running in Electron/Desktop app
function isDesktopApp(): boolean {
  return typeof navigator !== 'undefined' && 
    (navigator.userAgent.includes('NexusOS-Desktop') || 
     navigator.userAgent.toLowerCase().includes('electron'));
}

async function fetchUser(): Promise<User | null> {
  const endpoint = isDesktopApp() ? "/api/desktop-auth/user" : "/api/auth/user";
  const response = await fetch(endpoint, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const authEndpoint = isDesktopApp() ? "/api/desktop-auth/user" : "/api/auth/user";
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: [authEndpoint],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData([authEndpoint], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
