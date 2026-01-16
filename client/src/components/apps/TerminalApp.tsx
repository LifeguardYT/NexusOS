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

interface FileSystemNode {
  type: "file" | "directory";
  content?: string;
  children?: Record<string, FileSystemNode>;
  permissions?: string;
  owner?: string;
  size?: number;
  modified?: Date;
}

const ADMIN_COMMANDS = ["users", "sysadmin", "logs", "shutdown"];

const createFileSystem = (): Record<string, FileSystemNode> => ({
  home: {
    type: "directory",
    children: {
      user: {
        type: "directory",
        children: {
          Documents: { type: "directory", children: {
            "report.txt": { type: "file", content: "Quarterly report Q4 2025\n\nSales: $1.2M\nExpenses: $800K\nProfit: $400K", size: 58, permissions: "-rw-r--r--" },
            "notes.md": { type: "file", content: "# Meeting Notes\n\n- Project deadline: Friday\n- Review code changes\n- Update documentation", size: 89, permissions: "-rw-r--r--" },
          }},
          Downloads: { type: "directory", children: {
            "installer.sh": { type: "file", content: "#!/bin/bash\necho 'Installing...'", size: 32, permissions: "-rwxr-xr-x" },
            "data.csv": { type: "file", content: "name,age,city\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago", size: 52, permissions: "-rw-r--r--" },
          }},
          Music: { type: "directory", children: {} },
          Pictures: { type: "directory", children: {
            "photo.jpg": { type: "file", content: "[Binary image data]", size: 2048576, permissions: "-rw-r--r--" },
          }},
          Videos: { type: "directory", children: {} },
          Desktop: { type: "directory", children: {} },
          "readme.txt": { type: "file", content: "Welcome to NexusOS Terminal!\nType 'help' for available commands.\n\nThis is a simulated Linux environment.", size: 95, permissions: "-rw-r--r--" },
          "notes.txt": { type: "file", content: "My personal notes:\n- Learn Linux commands\n- Practice shell scripting\n- Build cool projects", size: 88, permissions: "-rw-r--r--" },
          ".bashrc": { type: "file", content: "# ~/.bashrc: executed by bash for interactive shells\n\nexport PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias cls='clear'", size: 124, permissions: "-rw-r--r--" },
          ".profile": { type: "file", content: "# ~/.profile: executed by login shells\n\nif [ -n \"$BASH_VERSION\" ]; then\n    if [ -f \"$HOME/.bashrc\" ]; then\n        . \"$HOME/.bashrc\"\n    fi\nfi", size: 145, permissions: "-rw-r--r--" },
          ".ssh": { type: "directory", children: {
            "known_hosts": { type: "file", content: "github.com ssh-rsa AAAAB3...", size: 256, permissions: "-rw-------" },
          }},
        }
      }
    }
  },
  etc: {
    type: "directory",
    children: {
      "passwd": { type: "file", content: "root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash", size: 74, permissions: "-rw-r--r--" },
      "hostname": { type: "file", content: "nexusos", size: 7, permissions: "-rw-r--r--" },
      "hosts": { type: "file", content: "127.0.0.1   localhost\n::1         localhost\n127.0.1.1   nexusos", size: 58, permissions: "-rw-r--r--" },
      "os-release": { type: "file", content: "NAME=\"NexusOS\"\nVERSION=\"1.0.0\"\nID=nexusos\nPRETTY_NAME=\"NexusOS 1.0.0\"", size: 68, permissions: "-rw-r--r--" },
    }
  },
  var: {
    type: "directory",
    children: {
      log: { type: "directory", children: {
        "syslog": { type: "file", content: "Jan 15 10:00:00 nexusos systemd[1]: Started NexusOS\nJan 15 10:00:01 nexusos kernel: All systems operational", size: 108, permissions: "-rw-r-----" },
        "auth.log": { type: "file", content: "Jan 15 10:00:00 nexusos login: User logged in", size: 45, permissions: "-rw-r-----" },
      }},
      tmp: { type: "directory", children: {} },
    }
  },
  usr: {
    type: "directory",
    children: {
      bin: { type: "directory", children: {} },
      local: { type: "directory", children: {
        bin: { type: "directory", children: {} },
      }},
      share: { type: "directory", children: {} },
    }
  },
  tmp: { type: "directory", children: {} },
  root: { type: "directory", children: {} },
  bin: { type: "directory", children: {} },
  dev: { type: "directory", children: {} },
  proc: { type: "directory", children: {} },
});

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}M`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`;
};

const getNode = (fs: Record<string, FileSystemNode>, path: string): FileSystemNode | null => {
  const parts = path.split("/").filter(p => p && p !== ".");
  let current: FileSystemNode | Record<string, FileSystemNode> = fs;
  
  for (const part of parts) {
    if (part === "..") continue;
    if (typeof current === "object" && "type" in current && current.type === "directory") {
      current = current.children || {};
    }
    if (!(part in (current as Record<string, FileSystemNode>))) return null;
    current = (current as Record<string, FileSystemNode>)[part];
  }
  
  return current as FileSystemNode;
};

const resolvePath = (cwd: string, path: string): string => {
  if (path.startsWith("/")) return path;
  if (path.startsWith("~")) return "/home/user" + path.slice(1);
  
  const parts = cwd.split("/").filter(p => p);
  const newParts = path.split("/");
  
  for (const part of newParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== "." && part !== "") {
      parts.push(part);
    }
  }
  
  return "/" + parts.join("/");
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
  const [cwd, setCwd] = useState("/home/user");
  const [fileSystem, setFileSystem] = useState<Record<string, FileSystemNode>>(createFileSystem);
  const [env, setEnv] = useState<Record<string, string>>({
    HOME: "/home/user",
    USER: "user",
    PATH: "/usr/local/bin:/usr/bin:/bin",
    SHELL: "/bin/bash",
    TERM: "xterm-256color",
    LANG: "en_US.UTF-8",
    PWD: "/home/user",
    HOSTNAME: "nexusos",
    EDITOR: "nano",
  });
  const [installedPackages, setInstalledPackages] = useState<Record<string, { version: string; description: string; size: string }>>({
    bash: { version: "5.0-6", description: "GNU Bourne Again SHell", size: "1,234 kB" },
    coreutils: { version: "8.30-3", description: "GNU core utilities", size: "6,789 kB" },
    grep: { version: "3.4-1", description: "GNU grep pattern matching utility", size: "456 kB" },
    sed: { version: "4.7-1", description: "GNU stream editor", size: "234 kB" },
    tar: { version: "1.30-6", description: "GNU tar archiving utility", size: "567 kB" },
    gzip: { version: "1.10-0", description: "GNU compression utility", size: "123 kB" },
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const AVAILABLE_PACKAGES: Record<string, { version: string; description: string; size: string; dependencies?: string[] }> = {
    vim: { version: "8.2.0", description: "Vi IMproved - enhanced vi editor", size: "3,456 kB", dependencies: ["libncurses6"] },
    nano: { version: "5.4-2", description: "Small, user-friendly text editor", size: "567 kB" },
    git: { version: "2.34.1", description: "Fast, scalable, distributed version control system", size: "12,345 kB", dependencies: ["libcurl4", "libssl1.1"] },
    curl: { version: "7.68.0", description: "Command line URL transfer tool", size: "456 kB", dependencies: ["libcurl4"] },
    wget: { version: "1.20.3", description: "Retrieves files from the web", size: "789 kB" },
    htop: { version: "3.0.5", description: "Interactive process viewer", size: "234 kB", dependencies: ["libncurses6"] },
    tree: { version: "1.8.0", description: "Display directory tree structure", size: "89 kB" },
    neofetch: { version: "7.1.0", description: "Fast, highly customizable system info script", size: "123 kB" },
    nodejs: { version: "18.17.0", description: "JavaScript runtime built on V8 engine", size: "28,456 kB" },
    python3: { version: "3.10.6", description: "Interactive high-level programming language", size: "45,678 kB" },
    "python3-pip": { version: "22.0.2", description: "Python package installer", size: "2,345 kB", dependencies: ["python3"] },
    nginx: { version: "1.18.0", description: "High-performance web server", size: "1,234 kB" },
    docker: { version: "20.10.17", description: "Container platform", size: "89,123 kB" },
    "docker-compose": { version: "2.10.2", description: "Define and run multi-container apps", size: "12,345 kB", dependencies: ["docker"] },
    postgresql: { version: "14.5", description: "Object-relational SQL database", size: "23,456 kB" },
    mysql: { version: "8.0.30", description: "MySQL database server", size: "34,567 kB" },
    redis: { version: "6.2.7", description: "In-memory data structure store", size: "2,345 kB" },
    mongodb: { version: "6.0.1", description: "NoSQL document database", size: "56,789 kB" },
    ffmpeg: { version: "4.4.2", description: "Complete, cross-platform solution for audio/video", size: "78,901 kB" },
    imagemagick: { version: "6.9.11", description: "Image manipulation programs", size: "12,345 kB" },
    tmux: { version: "3.2a", description: "Terminal multiplexer", size: "456 kB", dependencies: ["libncurses6"] },
    screen: { version: "4.8.0", description: "Terminal multiplexer with VT100/ANSI emulation", size: "567 kB" },
    ssh: { version: "8.4p1", description: "Secure shell client", size: "1,234 kB" },
    openssh: { version: "8.4p1", description: "Secure shell server and client", size: "2,345 kB" },
    "build-essential": { version: "12.8", description: "Essential build packages", size: "4,567 kB" },
    gcc: { version: "11.2.0", description: "GNU C compiler", size: "34,567 kB" },
    "g++": { version: "11.2.0", description: "GNU C++ compiler", size: "45,678 kB" },
    make: { version: "4.3", description: "GNU make utility", size: "567 kB" },
    cmake: { version: "3.22.1", description: "Cross-platform build system", size: "8,901 kB" },
    zip: { version: "3.0-12", description: "Archiver for .zip files", size: "234 kB" },
    unzip: { version: "6.0-26", description: "De-archiver for .zip files", size: "345 kB" },
    jq: { version: "1.6", description: "Lightweight command-line JSON processor", size: "123 kB" },
    ripgrep: { version: "13.0.0", description: "Recursively search directories for a regex pattern", size: "2,345 kB" },
    fzf: { version: "0.30.0", description: "Command-line fuzzy finder", size: "1,234 kB" },
    bat: { version: "0.21.0", description: "A cat clone with syntax highlighting", size: "3,456 kB" },
    exa: { version: "0.10.1", description: "Modern replacement for ls", size: "789 kB" },
    zsh: { version: "5.8.1", description: "Shell with advanced features", size: "2,345 kB" },
    fish: { version: "3.4.1", description: "Friendly interactive shell", size: "3,456 kB" },
    libncurses6: { version: "6.3-2", description: "Shared libraries for terminal handling", size: "456 kB" },
    libcurl4: { version: "7.68.0", description: "Easy-to-use client-side URL transfer library", size: "345 kB" },
    "libssl1.1": { version: "1.1.1n", description: "Secure Sockets Layer toolkit", size: "1,234 kB" },
    neovim: { version: "0.7.2", description: "Hyper-extensible Vim-based text editor", size: "8,901 kB" },
    emacs: { version: "27.2", description: "GNU Emacs editor", size: "45,678 kB" },
    code: { version: "1.70.0", description: "Visual Studio Code editor", size: "123,456 kB" },
  };

  const { data: adminStatus } = useQuery<AdminStatus>({
    queryKey: ["/api/admin/status"],
  });

  const isAdmin = adminStatus?.isAdmin === true;

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const COMMANDS: Record<string, (args: string[], isAdmin?: boolean) => string | Promise<string>> = {
    help: (args, isAdmin) => {
      const categories = {
        "File Operations": ["ls", "cd", "pwd", "cat", "head", "tail", "touch", "mkdir", "rm", "rmdir", "cp", "mv", "find", "locate", "file"],
        "Text Processing": ["grep", "sed", "awk", "sort", "uniq", "wc", "cut", "tr", "diff", "tee"],
        "System Info": ["uname", "hostname", "uptime", "date", "cal", "whoami", "id", "groups", "w", "who", "last"],
        "Process Management": ["ps", "top", "htop", "kill", "killall", "jobs", "bg", "fg", "nohup"],
        "Disk & Memory": ["df", "du", "free", "mount", "umount"],
        "Network": ["ping", "ifconfig", "ip", "netstat", "ss", "curl", "wget", "host", "dig", "nslookup"],
        "Permissions": ["chmod", "chown", "chgrp", "umask"],
        "Archives": ["tar", "gzip", "gunzip", "zip", "unzip"],
        "Package Management": ["apt", "apt-get", "dpkg"],
        "User Management": ["useradd", "userdel", "passwd", "su", "sudo"],
        "Misc": ["echo", "printf", "clear", "history", "alias", "unalias", "export", "env", "which", "whereis", "man", "info", "exit", "neofetch"],
        "Remote": ["ssh", "scp", "sftp", "rsync"],
      };
      
      if (args.length > 0) {
        const cmd = args[0];
        return getManPage(cmd);
      }
      
      let output = "NexusOS Terminal - Available Commands\n" + "=".repeat(40) + "\n\n";
      
      for (const [category, cmds] of Object.entries(categories)) {
        output += `\x1b[33m${category}:\x1b[0m\n  ${cmds.join(", ")}\n\n`;
      }
      
      if (isAdmin) {
        output += `\x1b[31mAdmin Commands:\x1b[0m\n  users, sysadmin, logs, shutdown\n\n`;
      }
      
      output += "Type 'help <command>' or 'man <command>' for detailed usage.";
      return output;
    },
    
    echo: (args) => {
      let text = args.join(" ");
      text = text.replace(/\$(\w+)/g, (_, varName) => env[varName] || "");
      if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
        text = text.slice(1, -1);
      }
      return text;
    },
    
    printf: (args) => {
      if (args.length === 0) return "printf: usage: printf format [arguments]";
      return args.join(" ").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    },
    
    date: (args) => {
      const now = new Date();
      if (args.includes("-u") || args.includes("--utc")) {
        return now.toUTCString();
      }
      if (args.includes("-I")) {
        return now.toISOString().split("T")[0];
      }
      if (args.includes("-R")) {
        return now.toUTCString();
      }
      return now.toString();
    },
    
    cal: (args) => {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = now.getDate();
      
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
      
      let output = `     ${monthNames[month]} ${year}\n`;
      output += "Su Mo Tu We Th Fr Sa\n";
      
      let dayStr = "   ".repeat(firstDay);
      for (let day = 1; day <= daysInMonth; day++) {
        const dayNum = day.toString().padStart(2, " ");
        if (day === today) {
          dayStr += `\x1b[7m${dayNum}\x1b[0m `;
        } else {
          dayStr += dayNum + " ";
        }
        if ((firstDay + day) % 7 === 0) dayStr += "\n";
      }
      
      return output + dayStr;
    },
    
    whoami: () => env.USER || "user",
    
    id: () => `uid=1000(${env.USER}) gid=1000(${env.USER}) groups=1000(${env.USER}),27(sudo),1001(docker)`,
    
    groups: () => `${env.USER} sudo docker`,
    
    hostname: (args) => {
      if (args.includes("-I")) return "192.168.1.100";
      if (args.includes("-f") || args.includes("--fqdn")) return "nexusos.local";
      return env.HOSTNAME || "nexusos";
    },
    
    pwd: () => cwd,
    
    cd: (args) => {
      const target = args[0] || env.HOME || "/home/user";
      const newPath = resolvePath(cwd, target);
      const node = getNode(fileSystem, newPath);
      
      if (!node) return `cd: ${target}: No such file or directory`;
      if (node.type !== "directory") return `cd: ${target}: Not a directory`;
      
      setCwd(newPath);
      setEnv(prev => ({ ...prev, PWD: newPath }));
      return "";
    },
    
    ls: (args) => {
      const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
      const longFormat = args.includes("-l") || args.includes("-la") || args.includes("-al") || args.includes("-lh");
      const humanReadable = args.includes("-h") || args.includes("-lh");
      const targetPath = args.filter(a => !a.startsWith("-"))[0] || ".";
      
      const fullPath = resolvePath(cwd, targetPath);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
      if (node.type === "file") {
        if (longFormat) {
          return `${node.permissions || "-rw-r--r--"} 1 user user ${formatSize(node.size || 0)} Jan 15 10:00 ${targetPath}`;
        }
        return targetPath;
      }
      
      const entries = Object.entries(node.children || {});
      if (!showAll) {
        entries.splice(0, entries.length, ...entries.filter(([name]) => !name.startsWith(".")));
      }
      
      if (longFormat) {
        let output = `total ${entries.length}\n`;
        if (showAll) {
          output += `drwxr-xr-x 2 user user 4096 Jan 15 10:00 .\n`;
          output += `drwxr-xr-x 2 user user 4096 Jan 15 10:00 ..\n`;
        }
        for (const [name, item] of entries.sort((a, b) => a[0].localeCompare(b[0]))) {
          const isDir = item.type === "directory";
          const perms = item.permissions || (isDir ? "drwxr-xr-x" : "-rw-r--r--");
          const size = humanReadable ? formatSize(item.size || (isDir ? 4096 : 0)) : (item.size || (isDir ? 4096 : 0)).toString();
          const colorName = isDir ? `\x1b[34m${name}\x1b[0m` : (item.permissions?.includes("x") ? `\x1b[32m${name}\x1b[0m` : name);
          output += `${perms} 1 user user ${size.toString().padStart(5)} Jan 15 10:00 ${colorName}\n`;
        }
        return output.trim();
      }
      
      return entries.map(([name, item]) => {
        if (item.type === "directory") return `\x1b[34m${name}\x1b[0m`;
        if (item.permissions?.includes("x")) return `\x1b[32m${name}\x1b[0m`;
        return name;
      }).sort().join("  ");
    },
    
    cat: (args) => {
      if (args.length === 0) return "cat: missing file operand";
      const showLineNumbers = args.includes("-n");
      const files = args.filter(a => !a.startsWith("-"));
      
      let output = "";
      for (const file of files) {
        const fullPath = resolvePath(cwd, file);
        const node = getNode(fileSystem, fullPath);
        
        if (!node) {
          output += `cat: ${file}: No such file or directory\n`;
          continue;
        }
        if (node.type === "directory") {
          output += `cat: ${file}: Is a directory\n`;
          continue;
        }
        
        if (showLineNumbers) {
          output += (node.content || "").split("\n").map((line, i) => `     ${i + 1}  ${line}`).join("\n") + "\n";
        } else {
          output += (node.content || "") + "\n";
        }
      }
      return output.trim();
    },
    
    head: (args) => {
      let lines = 10;
      const nIndex = args.indexOf("-n");
      if (nIndex !== -1 && args[nIndex + 1]) {
        lines = parseInt(args[nIndex + 1]) || 10;
      }
      const file = args.filter(a => !a.startsWith("-") && isNaN(parseInt(a)))[0];
      
      if (!file) return "head: missing file operand";
      
      const fullPath = resolvePath(cwd, file);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `head: cannot open '${file}': No such file or directory`;
      if (node.type === "directory") return `head: ${file}: Is a directory`;
      
      return (node.content || "").split("\n").slice(0, lines).join("\n");
    },
    
    tail: (args) => {
      let lines = 10;
      const nIndex = args.indexOf("-n");
      if (nIndex !== -1 && args[nIndex + 1]) {
        lines = parseInt(args[nIndex + 1]) || 10;
      }
      const file = args.filter(a => !a.startsWith("-") && isNaN(parseInt(a)))[0];
      
      if (!file) return "tail: missing file operand";
      
      const fullPath = resolvePath(cwd, file);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `tail: cannot open '${file}': No such file or directory`;
      if (node.type === "directory") return `tail: ${file}: Is a directory`;
      
      const contentLines = (node.content || "").split("\n");
      return contentLines.slice(-lines).join("\n");
    },
    
    touch: (args) => {
      if (args.length === 0) return "touch: missing file operand";
      const fileName = args[0];
      const dirPath = cwd;
      const node = getNode(fileSystem, dirPath);
      
      if (node && node.type === "directory" && node.children) {
        node.children[fileName] = { type: "file", content: "", size: 0, permissions: "-rw-r--r--" };
        setFileSystem({ ...fileSystem });
      }
      return "";
    },
    
    mkdir: (args) => {
      if (args.length === 0) return "mkdir: missing operand";
      const createParents = args.includes("-p");
      const dirName = args.filter(a => !a.startsWith("-"))[0];
      
      if (!dirName) return "mkdir: missing operand";
      
      const parentPath = cwd;
      const node = getNode(fileSystem, parentPath);
      
      if (node && node.type === "directory" && node.children) {
        if (node.children[dirName]) {
          return `mkdir: cannot create directory '${dirName}': File exists`;
        }
        node.children[dirName] = { type: "directory", children: {} };
        setFileSystem({ ...fileSystem });
      }
      return "";
    },
    
    rm: (args) => {
      if (args.length === 0) return "rm: missing operand";
      const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-R");
      const force = args.includes("-f") || args.includes("-rf");
      const files = args.filter(a => !a.startsWith("-"));
      
      for (const file of files) {
        const parentPath = cwd;
        const node = getNode(fileSystem, parentPath);
        
        if (node && node.type === "directory" && node.children) {
          if (!node.children[file] && !force) {
            return `rm: cannot remove '${file}': No such file or directory`;
          }
          if (node.children[file]?.type === "directory" && !recursive) {
            return `rm: cannot remove '${file}': Is a directory`;
          }
          delete node.children[file];
          setFileSystem({ ...fileSystem });
        }
      }
      return "";
    },
    
    rmdir: (args) => {
      if (args.length === 0) return "rmdir: missing operand";
      const dirName = args[0];
      const parentPath = cwd;
      const node = getNode(fileSystem, parentPath);
      
      if (node && node.type === "directory" && node.children) {
        const dir = node.children[dirName];
        if (!dir) return `rmdir: failed to remove '${dirName}': No such file or directory`;
        if (dir.type !== "directory") return `rmdir: failed to remove '${dirName}': Not a directory`;
        if (dir.children && Object.keys(dir.children).length > 0) {
          return `rmdir: failed to remove '${dirName}': Directory not empty`;
        }
        delete node.children[dirName];
        setFileSystem({ ...fileSystem });
      }
      return "";
    },
    
    cp: (args) => {
      if (args.length < 2) return "cp: missing file operand";
      const recursive = args.includes("-r") || args.includes("-R");
      const files = args.filter(a => !a.startsWith("-"));
      const src = files[0];
      const dest = files[1];
      
      const srcPath = resolvePath(cwd, src);
      const srcNode = getNode(fileSystem, srcPath);
      
      if (!srcNode) return `cp: cannot stat '${src}': No such file or directory`;
      if (srcNode.type === "directory" && !recursive) {
        return `cp: -r not specified; omitting directory '${src}'`;
      }
      
      const destParentPath = cwd;
      const destNode = getNode(fileSystem, destParentPath);
      
      if (destNode && destNode.type === "directory" && destNode.children) {
        destNode.children[dest] = JSON.parse(JSON.stringify(srcNode));
        setFileSystem({ ...fileSystem });
      }
      return "";
    },
    
    mv: (args) => {
      if (args.length < 2) return "mv: missing file operand";
      const files = args.filter(a => !a.startsWith("-"));
      const src = files[0];
      const dest = files[1];
      
      const parentPath = cwd;
      const node = getNode(fileSystem, parentPath);
      
      if (node && node.type === "directory" && node.children) {
        if (!node.children[src]) return `mv: cannot stat '${src}': No such file or directory`;
        node.children[dest] = node.children[src];
        delete node.children[src];
        setFileSystem({ ...fileSystem });
      }
      return "";
    },
    
    find: (args) => {
      const searchPath = args[0] || ".";
      const nameIndex = args.indexOf("-name");
      const pattern = nameIndex !== -1 ? args[nameIndex + 1] : "*";
      
      const results: string[] = [];
      const search = (path: string, node: FileSystemNode) => {
        if (node.type === "directory" && node.children) {
          for (const [name, child] of Object.entries(node.children)) {
            const fullPath = `${path}/${name}`;
            if (pattern === "*" || name.includes(pattern.replace(/\*/g, ""))) {
              results.push(fullPath);
            }
            if (child.type === "directory") {
              search(fullPath, child);
            }
          }
        }
      };
      
      const startNode = getNode(fileSystem, resolvePath(cwd, searchPath));
      if (startNode) search(searchPath === "." ? "." : searchPath, startNode);
      
      return results.join("\n") || `find: '${searchPath}': No matches found`;
    },
    
    locate: (args) => {
      if (args.length === 0) return "locate: no pattern to search for specified";
      return `locate: warning: database is not up to date\nUse 'updatedb' to update the database.\n/home/user/${args[0]}`;
    },
    
    file: (args) => {
      if (args.length === 0) return "file: missing file operand";
      const fileName = args[0];
      const fullPath = resolvePath(cwd, fileName);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `${fileName}: cannot open (No such file or directory)`;
      if (node.type === "directory") return `${fileName}: directory`;
      if (fileName.endsWith(".txt") || fileName.endsWith(".md")) return `${fileName}: ASCII text`;
      if (fileName.endsWith(".sh")) return `${fileName}: Bourne-Again shell script, ASCII text executable`;
      if (fileName.endsWith(".jpg") || fileName.endsWith(".png")) return `${fileName}: image data`;
      if (fileName.endsWith(".csv")) return `${fileName}: CSV text`;
      return `${fileName}: data`;
    },
    
    grep: (args) => {
      if (args.length < 2) return "grep: usage: grep [OPTION]... PATTERN [FILE]...";
      const ignoreCase = args.includes("-i");
      const lineNumbers = args.includes("-n");
      const countOnly = args.includes("-c");
      const invertMatch = args.includes("-v");
      
      const nonFlags = args.filter(a => !a.startsWith("-"));
      const pattern = nonFlags[0];
      const file = nonFlags[1];
      
      if (!file) return "grep: missing file operand";
      
      const fullPath = resolvePath(cwd, file);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `grep: ${file}: No such file or directory`;
      if (node.type === "directory") return `grep: ${file}: Is a directory`;
      
      const lines = (node.content || "").split("\n");
      const regex = new RegExp(pattern, ignoreCase ? "i" : "");
      
      let matches: string[] = [];
      let count = 0;
      
      lines.forEach((line, i) => {
        const match = regex.test(line);
        if ((match && !invertMatch) || (!match && invertMatch)) {
          count++;
          if (lineNumbers) {
            matches.push(`${i + 1}:${line}`);
          } else {
            matches.push(line);
          }
        }
      });
      
      if (countOnly) return count.toString();
      return matches.join("\n") || "";
    },
    
    sed: (args) => {
      if (args.length < 2) return "sed: usage: sed 's/pattern/replacement/' file";
      return `[sed simulation] Would process: ${args.join(" ")}`;
    },
    
    awk: (args) => {
      if (args.length < 1) return "awk: usage: awk 'pattern { action }' file";
      return `[awk simulation] Would process: ${args.join(" ")}`;
    },
    
    sort: (args) => {
      const reverse = args.includes("-r");
      const numeric = args.includes("-n");
      const unique = args.includes("-u");
      const file = args.filter(a => !a.startsWith("-"))[0];
      
      if (!file) return "sort: missing file operand";
      
      const fullPath = resolvePath(cwd, file);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `sort: ${file}: No such file or directory`;
      if (node.type === "directory") return `sort: ${file}: Is a directory`;
      
      let lines = (node.content || "").split("\n");
      if (numeric) {
        lines.sort((a, b) => parseFloat(a) - parseFloat(b));
      } else {
        lines.sort();
      }
      if (reverse) lines.reverse();
      if (unique) lines = Array.from(new Set(lines));
      
      return lines.join("\n");
    },
    
    uniq: (args) => {
      const countPrefixes = args.includes("-c");
      const file = args.filter(a => !a.startsWith("-"))[0];
      
      if (!file) return "uniq: missing file operand";
      
      const fullPath = resolvePath(cwd, file);
      const node = getNode(fileSystem, fullPath);
      
      if (!node || node.type === "directory") return `uniq: ${file}: No such file or directory`;
      
      const lines = (node.content || "").split("\n");
      const counts = new Map<string, number>();
      
      for (const line of lines) {
        counts.set(line, (counts.get(line) || 0) + 1);
      }
      
      if (countPrefixes) {
        return Array.from(counts.entries()).map(([line, count]) => `      ${count} ${line}`).join("\n");
      }
      return Array.from(counts.keys()).join("\n");
    },
    
    wc: (args) => {
      const showLines = args.includes("-l");
      const showWords = args.includes("-w");
      const showChars = args.includes("-c");
      const file = args.filter(a => !a.startsWith("-"))[0];
      
      if (!file) return "wc: missing file operand";
      
      const fullPath = resolvePath(cwd, file);
      const node = getNode(fileSystem, fullPath);
      
      if (!node) return `wc: ${file}: No such file or directory`;
      if (node.type === "directory") return `wc: ${file}: Is a directory`;
      
      const content = node.content || "";
      const lines = content.split("\n").length;
      const words = content.split(/\s+/).filter(w => w).length;
      const chars = content.length;
      
      if (showLines && !showWords && !showChars) return `${lines} ${file}`;
      if (showWords && !showLines && !showChars) return `${words} ${file}`;
      if (showChars && !showLines && !showWords) return `${chars} ${file}`;
      
      return `  ${lines}   ${words} ${chars} ${file}`;
    },
    
    cut: (args) => {
      return `[cut simulation] Would process: ${args.join(" ")}`;
    },
    
    tr: (args) => {
      if (args.length < 2) return "tr: usage: tr SET1 SET2";
      return `[tr simulation] Would translate ${args[0]} to ${args[1]}`;
    },
    
    diff: (args) => {
      if (args.length < 2) return "diff: missing operand after 'diff'";
      return `[diff simulation] Would compare ${args[0]} and ${args[1]}`;
    },
    
    tee: (args) => {
      if (args.length === 0) return "tee: missing file operand";
      return `[tee simulation] Would write to ${args.join(", ")}`;
    },
    
    uname: (args) => {
      if (args.includes("-a") || args.includes("--all")) {
        return "NexusOS nexusos 1.0.0-nexus #1 SMP PREEMPT x86_64 GNU/Linux";
      }
      if (args.includes("-r")) return "1.0.0-nexus";
      if (args.includes("-n")) return "nexusos";
      if (args.includes("-m")) return "x86_64";
      if (args.includes("-o")) return "GNU/Linux";
      return "NexusOS";
    },
    
    uptime: () => {
      const upHours = Math.floor(Math.random() * 24) + 1;
      const upMins = Math.floor(Math.random() * 60);
      const users = 1;
      const load = [0.5 + Math.random() * 0.5, 0.4 + Math.random() * 0.4, 0.3 + Math.random() * 0.3];
      return ` ${new Date().toLocaleTimeString()} up ${upHours}:${upMins.toString().padStart(2, "0")},  ${users} user,  load average: ${load[0].toFixed(2)}, ${load[1].toFixed(2)}, ${load[2].toFixed(2)}`;
    },
    
    w: () => {
      return `USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
user     pts/0    :0               10:00    0.00s  0.05s  0.00s terminal`;
    },
    
    who: () => {
      return `user     pts/0        ${new Date().toISOString().split("T")[0]} 10:00 (:0)`;
    },
    
    last: () => {
      return `user     pts/0        :0               ${new Date().toDateString().slice(4, 10)} 10:00   still logged in
reboot   system boot  1.0.0-nexus      ${new Date().toDateString().slice(4, 10)} 10:00   still running

wtmp begins ${new Date().toDateString().slice(4, 10)} 10:00`;
    },
    
    ps: (args) => {
      if (args.includes("aux") || args.includes("-aux") || args.includes("-ef")) {
        return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169936 11840 ?        Ss   10:00   0:01 /sbin/init
root         2  0.0  0.0      0     0 ?        S    10:00   0:00 [kthreadd]
user      1001  0.1  0.5 736532 43252 ?        Ssl  10:00   0:02 nexusos-desktop
user      1024  0.0  0.2 524288 16384 pts/0    Ss   10:00   0:00 /bin/bash
user      1156  0.0  0.1 449024  8192 pts/0    S+   10:01   0:00 terminal
user      1234  0.0  0.0  38372  3420 pts/0    R+   ${new Date().toLocaleTimeString().slice(0, 5)}   0:00 ps aux`;
      }
      return `  PID TTY          TIME CMD
 1024 pts/0    00:00:00 bash
 1234 pts/0    00:00:00 ps`;
    },
    
    top: () => {
      return `top - ${new Date().toLocaleTimeString()} up 5:00,  1 user,  load average: 0.52, 0.58, 0.59
Tasks:  89 total,   1 running,  88 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  0.7 sy,  0.0 ni, 96.7 id,  0.3 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   7976.8 total,   5234.2 free,   1842.6 used,    900.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5834.2 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1001 user      20   0  736532  43252  31268 S   0.3   0.5   0:02.14 nexusos-desktop
 1024 user      20   0  524288  16384  12288 S   0.0   0.2   0:00.52 bash
    1 root      20   0  169936  11840   8428 S   0.0   0.1   0:01.23 init

Press 'q' to exit (simulated)`;
    },
    
    htop: () => {
      return `[htop simulation - Interactive process viewer]

  CPU[||||||||||||                    28.3%]   Tasks: 89, 412 thr; 1 running
  Mem[||||||||||||||||||          4.2G/7.8G]   Load average: 0.52 0.58 0.59
  Swp[                              0K/2.0G]   Uptime: 05:00:00

  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command
 1001 user       20   0  719M 42252K 30524K S  0.3  0.5  0:02.14 nexusos-desktop
 1024 user       20   0  512M 16384K 12288K S  0.0  0.2  0:00.52 /bin/bash
    1 root       20   0  166M 11840K  8428K S  0.0  0.1  0:01.23 /sbin/init

F1Help  F2Setup  F3Search  F4Filter  F5Tree  F6SortBy  F7Nice  F8Nice+  F9Kill  F10Quit`;
    },
    
    kill: (args) => {
      if (args.length === 0) return "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]";
      if (args.includes("-l")) {
        return ` 1) SIGHUP       2) SIGINT       3) SIGQUIT      4) SIGILL       5) SIGTRAP
 6) SIGABRT      7) SIGBUS       8) SIGFPE       9) SIGKILL     10) SIGUSR1
11) SIGSEGV     12) SIGUSR2     13) SIGPIPE     14) SIGALRM     15) SIGTERM`;
      }
      const pid = args.filter(a => !a.startsWith("-"))[0];
      return `[Simulated] Sent signal to process ${pid}`;
    },
    
    killall: (args) => {
      if (args.length === 0) return "killall: no process selection criteria specified";
      return `[Simulated] Sent signal to all ${args[0]} processes`;
    },
    
    jobs: () => "[1]+  Running                 sleep 100 &",
    bg: () => "[1]+ sleep 100 &",
    fg: () => "sleep 100",
    nohup: (args) => `nohup: ignoring input and appending output to 'nohup.out'\n[Simulated] ${args.join(" ")} running in background`,
    
    df: (args) => {
      const humanReadable = args.includes("-h");
      if (humanReadable) {
        return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   35G  26% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
/dev/sda2       100G   45G   50G  48% /home`;
      }
      return `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/sda1       52428800 12582912  36700160  26% /
tmpfs            4096000        0   4096000   0% /dev/shm
/dev/sda2      104857600 47185920  52428800  48% /home`;
    },
    
    du: (args) => {
      const humanReadable = args.includes("-h");
      const summarize = args.includes("-s");
      const target = args.filter(a => !a.startsWith("-"))[0] || ".";
      
      if (summarize) {
        return humanReadable ? `156M\t${target}` : `159744\t${target}`;
      }
      
      return humanReadable ? 
        `4.0K\t./Documents
8.0K\t./Downloads
4.0K\t./Music
2.1M\t./Pictures
4.0K\t./Videos
4.0K\t./Desktop
156M\t.` :
        `4\t./Documents
8\t./Downloads
4\t./Music
2148\t./Pictures
4\t./Videos
4\t./Desktop
159744\t.`;
    },
    
    free: (args) => {
      const humanReadable = args.includes("-h");
      if (humanReadable) {
        return `              total        used        free      shared  buff/cache   available
Mem:          7.8Gi       1.8Gi       5.1Gi        64Mi       900Mi       5.7Gi
Swap:         2.0Gi          0B       2.0Gi`;
      }
      return `              total        used        free      shared  buff/cache   available
Mem:        8168448     1886208     5349376       65536      932864     5856256
Swap:       2097152           0     2097152`;
    },
    
    mount: () => {
      return `/dev/sda1 on / type ext4 (rw,relatime)
/dev/sda2 on /home type ext4 (rw,relatime)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)`;
    },
    
    umount: (args) => {
      if (args.length === 0) return "umount: usage: umount [-lf] <source>...";
      return `[Simulated] Unmounted ${args[0]}`;
    },
    
    ping: (args) => {
      if (args.length === 0) return "ping: usage: ping [-c count] destination";
      const host = args.filter(a => !a.startsWith("-"))[0] || "localhost";
      const count = 4;
      let output = `PING ${host} (${host === "localhost" ? "127.0.0.1" : "93.184.216.34"}) 56(84) bytes of data.\n`;
      for (let i = 1; i <= count; i++) {
        const time = (20 + Math.random() * 10).toFixed(1);
        output += `64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${time} ms\n`;
      }
      output += `\n--- ${host} ping statistics ---\n`;
      output += `${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms`;
      return output;
    },
    
    ifconfig: () => {
      return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)
        RX packets 125432  bytes 134567890 (128.3 MiB)
        TX packets 98765  bytes 12345678 (11.7 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)`;
    },
    
    ip: (args) => {
      if (args[0] === "addr" || args[0] === "a") {
        return `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
    inet6 ::1/128 scope host
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
    inet6 fe80::1/64 scope link`;
      }
      if (args[0] === "route" || args[0] === "r") {
        return `default via 192.168.1.1 dev eth0 proto dhcp metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100`;
      }
      return "Usage: ip [ addr | route | link | ... ]";
    },
    
    netstat: (args) => {
      return `Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN
tcp        0      0 192.168.1.100:22        192.168.1.50:54321      ESTABLISHED`;
    },
    
    ss: (args) => {
      return `Netid  State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port  Process
tcp    LISTEN  0       128          0.0.0.0:22        0.0.0.0:*
tcp    LISTEN  0       128        127.0.0.1:5432      0.0.0.0:*
tcp    ESTAB   0       0      192.168.1.100:22   192.168.1.50:54321`;
    },
    
    curl: (args) => {
      if (args.length === 0) return "curl: try 'curl --help' for more information";
      const url = args.filter(a => !a.startsWith("-"))[0];
      return `[curl simulation] Would fetch: ${url}
HTTP/1.1 200 OK
Content-Type: text/html
<!DOCTYPE html><html><body>Response from ${url}</body></html>`;
    },
    
    wget: (args) => {
      if (args.length === 0) return "wget: missing URL";
      const url = args[0];
      return `--${new Date().toISOString()}--  ${url}
Resolving ${url}... 93.184.216.34
Connecting to ${url}|93.184.216.34|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1256 (1.2K) [text/html]
Saving to: 'index.html'

index.html          100%[===================>]   1.23K  --.-KB/s    in 0s

${new Date().toISOString()} - 'index.html' saved [1256/1256]`;
    },
    
    host: (args) => {
      if (args.length === 0) return "Usage: host [-aCdilrTvVw] [-c class] [-N ndots] [-t type] [-W time] [-R number] [-m flag] hostname [server]";
      return `${args[0]} has address 93.184.216.34
${args[0]} has IPv6 address 2606:2800:220:1:248:1893:25c8:1946`;
    },
    
    dig: (args) => {
      const domain = args[0] || "example.com";
      return `; <<>> DiG 9.16.1-Ubuntu <<>> ${domain}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;${domain}.                  IN      A

;; ANSWER SECTION:
${domain}.           300     IN      A       93.184.216.34

;; Query time: 24 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
;; WHEN: ${new Date().toString()}
;; MSG SIZE  rcvd: 56`;
    },
    
    nslookup: (args) => {
      const domain = args[0] || "example.com";
      return `Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
Name:   ${domain}
Address: 93.184.216.34`;
    },
    
    chmod: (args) => {
      if (args.length < 2) return "chmod: missing operand";
      return `[Simulated] Changed permissions of ${args[1]} to ${args[0]}`;
    },
    
    chown: (args) => {
      if (args.length < 2) return "chown: missing operand";
      return `[Simulated] Changed owner of ${args[1]} to ${args[0]}`;
    },
    
    chgrp: (args) => {
      if (args.length < 2) return "chgrp: missing operand";
      return `[Simulated] Changed group of ${args[1]} to ${args[0]}`;
    },
    
    umask: (args) => {
      if (args.length === 0) return "0022";
      return `[Simulated] Set umask to ${args[0]}`;
    },
    
    tar: (args) => {
      if (args.length === 0) return "tar: You must specify one of the '-Acdtrux' options";
      const create = args.includes("-c") || args.includes("-cvf") || args.includes("-czvf");
      const extract = args.includes("-x") || args.includes("-xvf") || args.includes("-xzvf");
      const file = args.filter(a => !a.startsWith("-")).pop();
      
      if (create) return `[Simulated] Created archive ${file}`;
      if (extract) return `[Simulated] Extracted archive ${file}`;
      return "tar: invalid option";
    },
    
    gzip: (args) => {
      if (args.length === 0) return "gzip: missing file operand";
      return `[Simulated] Compressed ${args[0]} -> ${args[0]}.gz`;
    },
    
    gunzip: (args) => {
      if (args.length === 0) return "gunzip: missing file operand";
      return `[Simulated] Decompressed ${args[0]}`;
    },
    
    zip: (args) => {
      if (args.length < 2) return "zip: missing archive name";
      return `  adding: ${args.slice(1).join("\n  adding: ")} (deflated 60%)`;
    },
    
    unzip: (args) => {
      if (args.length === 0) return "unzip: missing archive name";
      return `Archive:  ${args[0]}
  inflating: file1.txt
  inflating: file2.txt
  extracting: file3.dat`;
    },
    
    apt: (args) => {
      if (args.length === 0) return "apt: missing command";
      const cmd = args[0];
      if (cmd === "update") {
        return `Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease
Hit:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease
Hit:3 http://security.ubuntu.com/ubuntu focal-security InRelease
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.`;
      }
      if (cmd === "upgrade") {
        return `Reading package lists... Done
Building dependency tree... Done
Calculating upgrade... Done
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`;
      }
      if (cmd === "install") {
        const packages = args.slice(1).filter(a => !a.startsWith("-"));
        if (packages.length === 0) return "E: Unable to locate package";
        
        const getPackageInfo = (pkg: string) => {
          if (AVAILABLE_PACKAGES[pkg]) return AVAILABLE_PACKAGES[pkg];
          const randomSize = Math.floor(Math.random() * 5000) + 100;
          const majorVer = Math.floor(Math.random() * 10) + 1;
          const minorVer = Math.floor(Math.random() * 20);
          const patchVer = Math.floor(Math.random() * 10);
          return {
            version: `${majorVer}.${minorVer}.${patchVer}`,
            description: `${pkg} - Package from Ubuntu repositories`,
            size: `${randomSize.toLocaleString()} kB`,
            dependencies: [] as string[],
          };
        };
        
        const toInstall: string[] = [];
        const alreadyInstalled: string[] = [];
        const deps: string[] = [];
        
        for (const pkg of packages) {
          if (installedPackages[pkg]) {
            alreadyInstalled.push(pkg);
          } else {
            toInstall.push(pkg);
            const pkgInfo = getPackageInfo(pkg);
            const pkgDeps = pkgInfo.dependencies || [];
            for (const dep of pkgDeps) {
              if (!installedPackages[dep] && !toInstall.includes(dep) && !deps.includes(dep)) {
                deps.push(dep);
              }
            }
          }
        }
        
        if (alreadyInstalled.length > 0 && toInstall.length === 0) {
          return `Reading package lists... Done
Building dependency tree... Done
${alreadyInstalled[0]} is already the newest version (${installedPackages[alreadyInstalled[0]].version}).
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`;
        }
        
        const allToInstall = [...deps, ...toInstall];
        let totalSize = 0;
        const pkgInfoCache: Record<string, { version: string; description: string; size: string }> = {};
        
        for (const pkg of allToInstall) {
          const info = getPackageInfo(pkg);
          pkgInfoCache[pkg] = { version: info.version, description: info.description, size: info.size };
          totalSize += parseInt(info.size.replace(/[^0-9]/g, "")) || 0;
        }
        
        let output = `Reading package lists... Done
Building dependency tree... Done
Reading state information... Done`;
        
        if (deps.length > 0) {
          output += `\nThe following additional packages will be installed:\n  ${deps.join(" ")}`;
        }
        
        output += `\nThe following NEW packages will be installed:\n  ${allToInstall.join(" ")}
0 upgraded, ${allToInstall.length} newly installed, 0 to remove.
Need to get ${totalSize.toLocaleString()} kB of archives.
After this operation, ${Math.floor(totalSize * 3.5).toLocaleString()} kB of additional disk space will be used.`;
        
        for (const pkg of allToInstall) {
          const pkgInfo = pkgInfoCache[pkg];
          output += `\nGet:${allToInstall.indexOf(pkg) + 1} http://archive.ubuntu.com/ubuntu focal/main amd64 ${pkg} amd64 ${pkgInfo.version} [${pkgInfo.size}]`;
        }
        
        output += `\nFetched ${totalSize.toLocaleString()} kB in 2s (${Math.floor(totalSize / 2).toLocaleString()} kB/s)`;
        output += `\nSelecting previously unselected package.`;
        
        for (const pkg of allToInstall) {
          const pkgInfo = pkgInfoCache[pkg];
          output += `\n(Reading database ... 123456 files and directories currently installed.)
Preparing to unpack .../${pkg}_${pkgInfo.version}_amd64.deb ...
Unpacking ${pkg} (${pkgInfo.version}) ...
Setting up ${pkg} (${pkgInfo.version}) ...`;
          
          setInstalledPackages(prev => ({
            ...prev,
            [pkg]: {
              version: pkgInfo.version,
              description: pkgInfo.description,
              size: pkgInfo.size,
            }
          }));
        }
        
        output += `\nProcessing triggers for man-db (2.9.1-1) ...`;
        
        return output;
      }
      if (cmd === "remove" || cmd === "purge") {
        const packages = args.slice(1).filter(a => !a.startsWith("-"));
        if (packages.length === 0) return "E: Unable to locate package";
        
        const toRemove: string[] = [];
        for (const pkg of packages) {
          if (installedPackages[pkg]) {
            toRemove.push(pkg);
          }
        }
        
        if (toRemove.length === 0) {
          return `Package '${packages[0]}' is not installed, so not removed`;
        }
        
        for (const pkg of toRemove) {
          setInstalledPackages(prev => {
            const newPkgs = { ...prev };
            delete newPkgs[pkg];
            return newPkgs;
          });
        }
        
        return `Reading package lists... Done
Building dependency tree... Done
The following packages will be REMOVED:
  ${toRemove.join(" ")}
0 upgraded, 0 newly installed, ${toRemove.length} to remove.
Do you want to continue? [Y/n] Y
(Reading database ... 123456 files and directories currently installed.)
Removing ${toRemove.join(", ")} ...
Processing triggers for man-db (2.9.1-1) ...`;
      }
      if (cmd === "list") {
        const showInstalled = args.includes("--installed");
        if (showInstalled) {
          const pkgs = Object.entries(installedPackages);
          if (pkgs.length === 0) return "Listing... Done";
          return `Listing... Done\n` + pkgs.map(([name, info]) => 
            `${name}/${info.version} [installed]`
          ).join("\n");
        }
        const allPkgs = { ...AVAILABLE_PACKAGES };
        return `Listing... Done\n` + Object.entries(allPkgs).slice(0, 20).map(([name, info]) => 
          `${name}/${info.version} amd64`
        ).join("\n") + "\n...and more. Use 'apt search <term>' to find specific packages.";
      }
      if (cmd === "search") {
        const query = args[1]?.toLowerCase() || "";
        if (!query) return "E: No search term specified";
        
        const matches = Object.entries(AVAILABLE_PACKAGES).filter(([name, info]) => 
          name.toLowerCase().includes(query) || info.description.toLowerCase().includes(query)
        );
        
        if (matches.length === 0) return `Sorting... Done\nFull Text Search... Done`;
        
        return `Sorting... Done
Full Text Search... Done
` + matches.slice(0, 10).map(([name, info]) => 
          `\x1b[32m${name}\x1b[0m/${info.version} amd64\n  ${info.description}`
        ).join("\n\n");
      }
      if (cmd === "show") {
        const pkg = args[1];
        if (!pkg) return "E: No package specified";
        
        const info = AVAILABLE_PACKAGES[pkg] || installedPackages[pkg];
        if (!info) return `E: Unable to locate package ${pkg}`;
        
        const isInstalled = !!installedPackages[pkg];
        return `Package: ${pkg}
Version: ${info.version}
Priority: optional
Section: misc
Maintainer: NexusOS Package Manager
Installed-Size: ${parseInt(info.size.replace(/[^0-9]/g, "")) * 3} kB
Download-Size: ${info.size}
APT-Sources: http://archive.ubuntu.com/ubuntu focal/main amd64 Packages
Description: ${info.description}
${isInstalled ? "\nStatus: Installed" : ""}`;
      }
      return `apt: command '${cmd}' not found. Try: apt install, apt remove, apt update, apt upgrade, apt search, apt list, apt show`;
    },
    
    "apt-get": (args) => COMMANDS.apt(args),
    
    dpkg: (args) => {
      if (args.includes("-l")) {
        let output = `Desired=Unknown/Install/Remove/Purge/Hold
| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
||/ Name           Version      Architecture Description
+++-==============-============-============-==================================\n`;
        for (const [name, info] of Object.entries(installedPackages)) {
          output += `ii  ${name.padEnd(14)} ${info.version.padEnd(12)} amd64        ${info.description}\n`;
        }
        return output.trim();
      }
      if (args.includes("-s")) {
        const pkg = args.filter(a => !a.startsWith("-"))[0];
        if (!pkg) return "dpkg: --status requires a package name";
        const info = installedPackages[pkg];
        if (!info) return `dpkg: package '${pkg}' is not installed`;
        return `Package: ${pkg}
Status: install ok installed
Priority: optional
Section: misc
Installed-Size: ${parseInt(info.size.replace(/[^0-9]/g, "")) * 3}
Maintainer: NexusOS
Version: ${info.version}
Description: ${info.description}`;
      }
      return "dpkg: usage: dpkg [<option> ...] <command>";
    },
    
    useradd: (args) => {
      if (args.length === 0) return "useradd: missing username";
      return `[Simulated] Created user ${args[args.length - 1]}`;
    },
    
    userdel: (args) => {
      if (args.length === 0) return "userdel: missing username";
      return `[Simulated] Deleted user ${args[0]}`;
    },
    
    passwd: (args) => {
      const user = args[0] || env.USER;
      return `[Simulated] Changing password for ${user}
New password: 
Retype new password: 
passwd: password updated successfully`;
    },
    
    su: (args) => {
      const user = args.filter(a => !a.startsWith("-"))[0] || "root";
      return `[Simulated] Switched to user ${user}`;
    },
    
    sudo: (args) => {
      if (args.length === 0) return "sudo: a command is required";
      if (args[0] === "-l") {
        return `User user may run the following commands on nexusos:
    (ALL : ALL) ALL`;
      }
      return `[sudo] password for ${env.USER}: 
[Simulated] Running '${args.join(" ")}' as root`;
    },
    
    ssh: (args) => {
      if (args.length === 0) return "usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] ... destination [command]";
      return `[Simulated] Connecting to ${args[args.length - 1]}...
The authenticity of host '${args[args.length - 1]}' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '${args[args.length - 1]}' (ED25519) to the list of known hosts.
Connection simulated.`;
    },
    
    scp: (args) => {
      if (args.length < 2) return "usage: scp [-346BCpqrTv] ... [[user@]host1:]file1 ... [[user@]host2:]file2";
      return `[Simulated] Copying ${args[0]} to ${args[1]}...
${args[0]}                                    100%  1234     1.2KB/s   00:01`;
    },
    
    sftp: (args) => {
      if (args.length === 0) return "usage: sftp [-46BCpqrv] ... [user@]host[:path]";
      return `[Simulated] Connecting to ${args[0]}...
Connected to ${args[0]}.
sftp>`;
    },
    
    rsync: (args) => {
      if (args.length < 2) return "rsync: missing destination";
      return `sending incremental file list
./
file1.txt
file2.txt

sent 1,234 bytes  received 89 bytes  2,646.00 bytes/sec
total size is 5,678  speedup is 4.29`;
    },
    
    which: (args) => {
      if (args.length === 0) return "";
      const cmd = args[0];
      const paths: Record<string, string> = {
        ls: "/usr/bin/ls",
        cat: "/usr/bin/cat",
        grep: "/usr/bin/grep",
        bash: "/bin/bash",
        python: "/usr/bin/python3",
        node: "/usr/bin/node",
        vim: "/usr/bin/vim",
        nano: "/usr/bin/nano",
      };
      return paths[cmd] || `${cmd} not found`;
    },
    
    whereis: (args) => {
      if (args.length === 0) return "whereis: usage: whereis program...";
      const cmd = args[0];
      return `${cmd}: /usr/bin/${cmd} /usr/share/man/man1/${cmd}.1.gz`;
    },
    
    man: (args) => {
      if (args.length === 0) return "What manual page do you want?";
      return getManPage(args[0]);
    },
    
    info: (args) => {
      if (args.length === 0) return "info: missing argument";
      return `[info simulation] Would display GNU info page for ${args[0]}`;
    },
    
    alias: (args) => {
      if (args.length === 0) {
        return `alias ll='ls -la'
alias cls='clear'
alias ..='cd ..'
alias grep='grep --color=auto'`;
      }
      return `[Simulated] Created alias: ${args.join(" ")}`;
    },
    
    unalias: (args) => {
      if (args.length === 0) return "unalias: usage: unalias name [name ...]";
      return `[Simulated] Removed alias: ${args[0]}`;
    },
    
    export: (args) => {
      if (args.length === 0) {
        return Object.entries(env).map(([k, v]) => `declare -x ${k}="${v}"`).join("\n");
      }
      const [key, value] = args[0].split("=");
      if (key && value) {
        setEnv(prev => ({ ...prev, [key]: value }));
        return "";
      }
      return `export: '${args[0]}': not a valid identifier`;
    },
    
    env: () => Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"),
    
    clear: () => "",
    
    history: () => history.map((h, i) => `  ${(i + 1).toString().padStart(4)}  ${h}`).join("\n") || "No history",
    
    exit: () => {
      setLines([
        { type: "output", content: "logout" },
        { type: "output", content: "\nNexusOS Terminal v1.0.0" },
        { type: "output", content: "Type 'help' for available commands.\n" },
      ]);
      return "";
    },
    
    neofetch: () => `
\x1b[34m       .--.        \x1b[0muser@nexusos
\x1b[34m      |o_o |       \x1b[0m-----------
\x1b[34m      |:_/ |       \x1b[33mOS:\x1b[0m NexusOS 1.0.0
\x1b[34m     //   \\ \\      \x1b[33mHost:\x1b[0m Web Browser
\x1b[34m    (|     | )     \x1b[33mKernel:\x1b[0m JavaScript
\x1b[34m   /'\\_   _/'\`\\    \x1b[33mUptime:\x1b[0m ${Math.floor(Math.random() * 24)} hours, ${Math.floor(Math.random() * 60)} mins
\x1b[34m   \\___)=(___/     \x1b[33mShell:\x1b[0m nsh 1.0
                   \x1b[33mTerminal:\x1b[0m NexusOS Terminal
                   \x1b[33mCPU:\x1b[0m Virtual @ Web GHz
                   \x1b[33mMemory:\x1b[0m 1842 MiB / 7976 MiB
                   
                   \x1b[30m███\x1b[31m███\x1b[32m███\x1b[33m███\x1b[34m███\x1b[35m███\x1b[36m███\x1b[37m███\x1b[0m
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

  const getManPage = (cmd: string): string => {
    const manPages: Record<string, string> = {
      ls: `LS(1)                            User Commands                           LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about the FILEs (the current directory by default).

       -a, --all
              do not ignore entries starting with .

       -l     use a long listing format

       -h, --human-readable
              with -l, print sizes like 1K 234M 2G etc.`,
      
      cd: `CD(1)                            User Commands                           CD(1)

NAME
       cd - change directory

SYNOPSIS
       cd [dir]

DESCRIPTION
       Change the current directory to dir. The default dir is HOME.`,
      
      cat: `CAT(1)                           User Commands                          CAT(1)

NAME
       cat - concatenate files and print on the standard output

SYNOPSIS
       cat [OPTION]... [FILE]...

DESCRIPTION
       -n, --number
              number all output lines`,
      
      grep: `GREP(1)                          User Commands                         GREP(1)

NAME
       grep - print lines that match patterns

SYNOPSIS
       grep [OPTION...] PATTERNS [FILE...]

DESCRIPTION
       -i, --ignore-case
              ignore case distinctions

       -n, --line-number
              prefix each line with line number

       -c, --count
              only print count of matching lines

       -v, --invert-match
              select non-matching lines`,
      
      chmod: `CHMOD(1)                         User Commands                        CHMOD(1)

NAME
       chmod - change file mode bits

SYNOPSIS
       chmod [OPTION]... MODE[,MODE]... FILE...

DESCRIPTION
       Change the mode of each FILE to MODE.
       
       MODE can be numeric (e.g., 755) or symbolic (e.g., u+x).`,
      
      ps: `PS(1)                            User Commands                           PS(1)

NAME
       ps - report a snapshot of the current processes

SYNOPSIS
       ps [options]

DESCRIPTION
       aux    show all processes for all users
       
       -ef    show full format listing`,
    };
    
    return manPages[cmd] || `No manual entry for ${cmd}
See 'help' for available commands.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const trimmedInput = input.trim();
    const [cmd, ...args] = trimmedInput.split(" ");

    setLines(prev => [...prev, { type: "input", content: `${env.USER}@nexusos:${cwd}$ ${trimmedInput}` }]);
    setHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);
    setInput("");

    if (cmd === "clear") {
      setLines([]);
      return;
    }
    
    if (cmd in COMMANDS) {
      if (ADMIN_COMMANDS.includes(cmd) && !isAdmin) {
        setLines(prev => [...prev, { type: "error", content: `${cmd}: Permission denied - Admin access required` }]);
        return;
      }
      
      setIsProcessing(true);
      try {
        const result = COMMANDS[cmd](args, isAdmin);
        const output = result instanceof Promise ? await result : result;
        if (output) {
          setLines(prev => [...prev, { type: "output", content: output }]);
        }
      } catch (e) {
        setLines(prev => [...prev, { type: "error", content: `Error executing ${cmd}` }]);
      }
      setIsProcessing(false);
    } else if (cmd) {
      setLines(prev => [...prev, { type: "error", content: `${cmd}: command not found. Type 'help' for available commands.` }]);
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
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion for files in current directory
      const parts = input.split(" ");
      const lastPart = parts[parts.length - 1];
      const node = getNode(fileSystem, cwd);
      
      if (node && node.type === "directory" && node.children) {
        const matches = Object.keys(node.children).filter(name => name.startsWith(lastPart));
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          setInput(parts.join(" "));
        } else if (matches.length > 1) {
          setLines(prev => [...prev, 
            { type: "input", content: `$ ${input}` },
            { type: "output", content: matches.join("  ") }
          ]);
        }
      }
    } else if (e.ctrlKey && e.key === "c") {
      setLines(prev => [...prev, { type: "input", content: `$ ${input}^C` }]);
      setInput("");
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setLines([]);
    }
  };

  const renderLine = (content: string) => {
    // Parse ANSI color codes
    const parts = content.split(/(\x1b\[\d+m)/);
    let currentColor = "";
    
    return parts.map((part, i) => {
      if (part.match(/\x1b\[(\d+)m/)) {
        const code = part.match(/\x1b\[(\d+)m/)?.[1];
        if (code === "0") currentColor = "";
        else if (code === "7") currentColor = "bg-gray-300 text-gray-900";
        else if (code === "30") currentColor = "text-gray-800";
        else if (code === "31") currentColor = "text-red-400";
        else if (code === "32") currentColor = "text-green-400";
        else if (code === "33") currentColor = "text-yellow-400";
        else if (code === "34") currentColor = "text-blue-400";
        else if (code === "35") currentColor = "text-purple-400";
        else if (code === "36") currentColor = "text-cyan-400";
        else if (code === "37") currentColor = "text-gray-100";
        return null;
      }
      return <span key={i} className={currentColor}>{part}</span>;
    });
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
            {renderLine(line.content)}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400">{env.USER}@nexusos:{cwd}$ </span>
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
