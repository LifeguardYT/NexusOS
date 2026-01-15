import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
}

interface AdminStatus {
  isAdmin: boolean;
  userId?: string;
}

const ADMIN_COMMANDS = ["users", "sysadmin", "logs", "shutdown"];

const COMMANDS: Record<string, (args: string[], isAdmin?: boolean) => string | Promise<string>> = {
  help: (args, isAdmin) => {
    let output = `Available commands:
  help     - Show this help message
  echo     - Print a message
  date     - Show current date and time
  whoami   - Display current user
  pwd      - Print working directory
  ls       - List directory contents
  cat      - Display file contents
  clear    - Clear the terminal
  uname    - Print system information
  history  - Show command history
  neofetch - Show system info (simplified)`;
    
    if (isAdmin) {
      output += `

\x1b[33mAdmin Commands:\x1b[0m
  users    - List all registered users
  sysadmin - Show system administration info
  logs     - View recent system logs
  shutdown - Simulate system shutdown`;
    }
    return output;
  },
  echo: (args) => args.join(" "),
  date: () => new Date().toString(),
  whoami: () => "user",
  pwd: () => "/home/user",
  ls: () => `Documents  Downloads  Music  Pictures  Videos  Desktop
readme.txt  notes.txt  .bashrc  .profile`,
  cat: (args) => {
    if (args.length === 0) return "cat: missing file operand";
    const files: Record<string, string> = {
      "readme.txt": "Welcome to NexusOS Terminal!\nType 'help' for available commands.",
      "notes.txt": "My notes go here...",
      ".bashrc": "# ~/.bashrc: executed by bash for interactive shells",
      ".profile": "# ~/.profile: executed by login shells",
    };
    const content = files[args[0]];
    return content || `cat: ${args[0]}: No such file or directory`;
  },
  uname: (args) => {
    if (args.includes("-a")) {
      return "NexusOS 1.0.0 x86_64 GNU/Linux";
    }
    return "NexusOS";
  },
  neofetch: () => `
       .--.        user@nexusos
      |o_o |       -----------
      |:_/ |       OS: NexusOS 1.0.0
     //   \\ \\      Host: Web Browser
    (|     | )     Kernel: JavaScript
   /'\\_   _/'\`\\    Uptime: ${Math.floor(Math.random() * 24)} hours
   \\___)=(___/    Shell: nsh 1.0
                  Terminal: NexusOS Terminal
                  CPU: Virtual @ Web GHz
                  Memory: Unlimited
`,
  users: async (args, isAdmin) => {
    if (!isAdmin) return "Permission denied: Admin access required";
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return "Failed to fetch users";
      const users = await res.json();
      if (users.length === 0) return "No registered users";
      let output = "USER ID          | EMAIL                    | NAME\n";
      output += "-".repeat(60) + "\n";
      users.forEach((u: any) => {
        const id = u.id.substring(0, 14).padEnd(16);
        const email = (u.email || "N/A").substring(0, 24).padEnd(26);
        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "N/A";
        output += `${id}| ${email}| ${name}\n`;
      });
      return output;
    } catch (e) {
      return "Error fetching users";
    }
  },
  sysadmin: async (args, isAdmin) => {
    if (!isAdmin) return "Permission denied: Admin access required";
    try {
      const res = await fetch("/api/admin/diagnostics");
      if (!res.ok) return "Failed to fetch diagnostics";
      const d = await res.json();
      return `System Administration Panel
==============================
Platform:     ${d.system.platform}
Architecture: ${d.system.arch}
Node Version: ${d.system.nodeVersion}
System Uptime: ${Math.floor(d.system.uptime / 3600)}h ${Math.floor((d.system.uptime % 3600) / 60)}m

Memory:
  Total: ${(d.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
  Used:  ${(d.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB
  Free:  ${(d.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB

Process:
  PID: ${d.process.pid}
  CPU Cores: ${d.cpu.cores}
  Heap Used: ${(d.process.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`;
    } catch (e) {
      return "Error fetching system info";
    }
  },
  logs: (args, isAdmin) => {
    if (!isAdmin) return "Permission denied: Admin access required";
    const now = new Date();
    const logs = [
      `[${new Date(now.getTime() - 300000).toISOString()}] INFO  System startup complete`,
      `[${new Date(now.getTime() - 240000).toISOString()}] INFO  Database connection established`,
      `[${new Date(now.getTime() - 180000).toISOString()}] INFO  Authentication service ready`,
      `[${new Date(now.getTime() - 120000).toISOString()}] DEBUG Session middleware initialized`,
      `[${new Date(now.getTime() - 60000).toISOString()}] INFO  All services operational`,
      `[${now.toISOString()}] INFO  Admin accessed system logs`,
    ];
    return logs.join("\n");
  },
  shutdown: (args, isAdmin) => {
    if (!isAdmin) return "Permission denied: Admin access required";
    return `Shutdown initiated...
Broadcasting message to all terminals...
System going down for maintenance in 60 seconds!

[SIMULATED] - This is a simulated shutdown.
In a real system, this would gracefully stop all services.`;
  },
};

export function TerminalApp() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "NexusOS Terminal v1.0.0" },
    { type: "output", content: "Type 'help' for available commands.\n" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const { data: adminStatus } = useQuery<AdminStatus>({
    queryKey: ["/api/admin/status"],
  });

  const isAdmin = adminStatus?.isAdmin === true;

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const trimmedInput = input.trim();
    const [cmd, ...args] = trimmedInput.split(" ");

    setLines(prev => [...prev, { type: "input", content: `$ ${trimmedInput}` }]);
    setHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);
    setInput("");

    if (cmd === "clear") {
      setLines([]);
      return;
    }
    
    if (cmd === "history") {
      const historyOutput = history.map((h, i) => `  ${i + 1}  ${h}`).join("\n");
      setLines(prev => [...prev, { type: "output", content: historyOutput || "No history" }]);
      return;
    }
    
    if (cmd in COMMANDS) {
      // Check if it's an admin command and user is not admin
      if (ADMIN_COMMANDS.includes(cmd) && !isAdmin) {
        setLines(prev => [...prev, { type: "error", content: `${cmd}: Permission denied - Admin access required` }]);
        return;
      }
      
      setIsProcessing(true);
      try {
        const result = COMMANDS[cmd](args, isAdmin);
        const output = result instanceof Promise ? await result : result;
        setLines(prev => [...prev, { type: "output", content: output }]);
      } catch (e) {
        setLines(prev => [...prev, { type: "error", content: `Error executing ${cmd}` }]);
      }
      setIsProcessing(false);
    } else if (cmd) {
      setLines(prev => [...prev, { type: "error", content: `${cmd}: command not found` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-gray-950 font-mono text-sm p-4 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto space-y-0.5"
      >
        {lines.map((line, index) => (
          <div 
            key={index} 
            className={`whitespace-pre-wrap ${
              line.type === "input" ? "text-green-400" :
              line.type === "error" ? "text-red-400" : "text-gray-300"
            }`}
          >
            {line.content}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-gray-300 caret-green-400"
            autoFocus
            spellCheck={false}
            data-testid="input-terminal"
          />
        </form>
      </div>
    </div>
  );
}
