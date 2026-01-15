import { useState, useRef, useEffect } from "react";

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
}

const COMMANDS: Record<string, (args: string[]) => string> = {
  help: () => `Available commands:
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
  neofetch - Show system info (simplified)`,
  echo: (args) => args.join(" "),
  date: () => new Date().toString(),
  whoami: () => "user",
  pwd: () => "/home/user",
  ls: () => `Documents  Downloads  Music  Pictures  Videos  Desktop
readme.txt  notes.txt  .bashrc  .profile`,
  cat: (args) => {
    if (args.length === 0) return "cat: missing file operand";
    const files: Record<string, string> = {
      "readme.txt": "Welcome to WebOS Terminal!\nType 'help' for available commands.",
      "notes.txt": "My notes go here...",
      ".bashrc": "# ~/.bashrc: executed by bash for interactive shells",
      ".profile": "# ~/.profile: executed by login shells",
    };
    const content = files[args[0]];
    return content || `cat: ${args[0]}: No such file or directory`;
  },
  uname: (args) => {
    if (args.includes("-a")) {
      return "WebOS 1.0.0 x86_64 GNU/Linux";
    }
    return "WebOS";
  },
  neofetch: () => `
       .--.        user@webos
      |o_o |       ---------
      |:_/ |       OS: WebOS 1.0.0
     //   \\ \\      Host: Web Browser
    (|     | )     Kernel: JavaScript
   /'\\_   _/'\`\\    Uptime: ${Math.floor(Math.random() * 24)} hours
   \\___)=(___/    Shell: wsh 1.0
                  Terminal: WebOS Terminal
                  CPU: Virtual @ Web GHz
                  Memory: Unlimited
`,
};

export function TerminalApp() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "WebOS Terminal v1.0.0" },
    { type: "output", content: "Type 'help' for available commands.\n" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    const [cmd, ...args] = trimmedInput.split(" ");

    setLines(prev => [...prev, { type: "input", content: `$ ${trimmedInput}` }]);
    setHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);

    if (cmd === "clear") {
      setLines([]);
    } else if (cmd === "history") {
      const historyOutput = history.map((h, i) => `  ${i + 1}  ${h}`).join("\n");
      setLines(prev => [...prev, { type: "output", content: historyOutput || "No history" }]);
    } else if (cmd in COMMANDS) {
      const output = COMMANDS[cmd](args);
      setLines(prev => [...prev, { type: "output", content: output }]);
    } else if (cmd) {
      setLines(prev => [...prev, { type: "error", content: `${cmd}: command not found` }]);
    }

    setInput("");
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
