import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOS } from "@/lib/os-context";

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
}

interface AdminStatus {
  isAdmin: boolean;
  isOwner: boolean;
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

const ADMIN_COMMANDS = ["users", "sysadmin", "logs", "broadcast", "ban", "unban", "sessions", "audit", "maintenance", "stats"];
const OWNER_COMMANDS = ["shutdown", "stopshutdown", "instashutdown", "promote", "demote", "purge", "lockdown", "resetuser", "sysconfig"];

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
      "os-release": { type: "file", content: "NAME=\"NexusOS\"\nVERSION=\"2.1.1\"\nID=nexusos\nPRETTY_NAME=\"NexusOS 2.1.1\"", size: 68, permissions: "-rw-r--r--" },
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
  const { settings, addDebugLog, debugLogs, windows } = useOS();
  const developerMode = settings.developerMode;
  
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "NexusOS Terminal v2.0.0" },
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
    // Editors
    vim: { version: "2:8.2.3995-1ubuntu2", description: "Vi IMproved - enhanced vi editor", size: "1,806 kB", dependencies: ["libncurses6", "vim-runtime"] },
    "vim-runtime": { version: "2:8.2.3995-1ubuntu2", description: "Vi IMproved - Runtime files", size: "6,789 kB" },
    nano: { version: "6.2-1", description: "Small, friendly text editor inspired by Pico", size: "280 kB" },
    neovim: { version: "0.6.1-3", description: "Heavily refactored vim fork", size: "2,345 kB", dependencies: ["libncurses6"] },
    emacs: { version: "1:27.1+1-3ubuntu5", description: "GNU Emacs editor (metapackage)", size: "45,678 kB" },
    micro: { version: "2.0.10-1", description: "Modern and intuitive terminal-based text editor", size: "9,234 kB" },
    
    // Version Control
    git: { version: "1:2.34.1-1ubuntu1", description: "Fast, scalable, distributed revision control system", size: "4,567 kB", dependencies: ["libcurl4", "libssl3"] },
    "git-lfs": { version: "3.0.2-1", description: "Git extension for versioning large files", size: "3,456 kB", dependencies: ["git"] },
    subversion: { version: "1.14.1-3ubuntu0.1", description: "Advanced version control system", size: "5,678 kB" },
    mercurial: { version: "6.0-1", description: "Easy-to-use, scalable distributed version control system", size: "2,345 kB" },
    
    // Network Tools
    curl: { version: "7.81.0-1ubuntu1.7", description: "Command line tool for transferring data with URL syntax", size: "227 kB", dependencies: ["libcurl4"] },
    wget: { version: "1.21.2-2ubuntu1", description: "Retrieves files from the web", size: "345 kB" },
    "net-tools": { version: "1.60+git20181103.0eebece-1ubuntu5", description: "NET-3 networking toolkit", size: "234 kB" },
    netcat: { version: "1.218-4ubuntu1", description: "TCP/IP swiss army knife", size: "45 kB" },
    nmap: { version: "7.91+dfsg1+really7.80+dfsg1-2ubuntu0.1", description: "The Network Mapper", size: "4,567 kB" },
    tcpdump: { version: "4.99.1-3ubuntu0.1", description: "Command-line network traffic analyzer", size: "456 kB" },
    wireshark: { version: "3.6.2-2", description: "Network traffic analyzer", size: "8,901 kB" },
    iperf3: { version: "3.9-1build1", description: "Internet Protocol bandwidth measuring tool", size: "123 kB" },
    traceroute: { version: "1:2.1.0-2", description: "Traces the route taken by packets over an IPv4/IPv6 network", size: "45 kB" },
    dnsutils: { version: "1:9.18.1-1ubuntu1.3", description: "Clients provided with BIND 9", size: "234 kB" },
    whois: { version: "5.5.13", description: "Intelligent WHOIS client", size: "45 kB" },
    openssh: { version: "1:8.9p1-3ubuntu0.1", description: "Secure shell (SSH) client and server", size: "1,234 kB" },
    "openssh-client": { version: "1:8.9p1-3ubuntu0.1", description: "Secure shell (SSH) client", size: "945 kB" },
    "openssh-server": { version: "1:8.9p1-3ubuntu0.1", description: "Secure shell (SSH) server", size: "456 kB" },
    
    // System Monitoring
    htop: { version: "3.0.5-7build2", description: "Interactive processes viewer", size: "123 kB", dependencies: ["libncurses6"] },
    btop: { version: "1.2.13-1", description: "Modern and colorful command line resource monitor", size: "2,345 kB" },
    atop: { version: "2.6.0-2", description: "Monitor for system resources and process activity", size: "234 kB" },
    glances: { version: "3.2.4.2+dfsg-1", description: "Curses-based monitoring tool", size: "567 kB", dependencies: ["python3"] },
    iotop: { version: "0.6-24-g733f3f8-1.1", description: "Simple top-like I/O monitor", size: "45 kB" },
    nethogs: { version: "0.8.6-1build2", description: "Net top tool grouping bandwidth per process", size: "67 kB" },
    iftop: { version: "1.0~pre4-7", description: "Displays bandwidth usage on an interface", size: "56 kB" },
    sysstat: { version: "12.5.2-2", description: "System performance tools for Linux", size: "456 kB" },
    lsof: { version: "4.93.2+dfsg-1.1build2", description: "Utility to list open files", size: "234 kB" },
    strace: { version: "5.16-0ubuntu3", description: "System call tracer", size: "567 kB" },
    
    // Programming Languages
    python3: { version: "3.10.6-1~22.04", description: "Interactive high-level object-oriented language", size: "567 kB" },
    "python3-pip": { version: "22.0.2+dfsg-1", description: "Python package installer", size: "1,345 kB", dependencies: ["python3"] },
    "python3-venv": { version: "3.10.6-1~22.04", description: "Venv module for python3", size: "12 kB", dependencies: ["python3"] },
    nodejs: { version: "18.17.1-1nodesource1", description: "Evented I/O for V8 JavaScript", size: "28,456 kB" },
    npm: { version: "9.6.7+ds1-1", description: "Package manager for Node.js", size: "4,567 kB", dependencies: ["nodejs"] },
    ruby: { version: "1:3.0~exp1", description: "Interpreter of object-oriented scripting language Ruby", size: "123 kB" },
    "ruby-full": { version: "1:3.0~exp1", description: "Ruby full installation", size: "12,345 kB" },
    golang: { version: "2:1.18~0ubuntu1", description: "Go programming language compiler", size: "45,678 kB" },
    "golang-go": { version: "2:1.18~0ubuntu1", description: "Go programming language", size: "56,789 kB" },
    rustc: { version: "1.59.0+dfsg1-1~ubuntu2", description: "Rust systems programming language", size: "23,456 kB" },
    cargo: { version: "0.60.0ubuntu1-0ubuntu1", description: "Rust package manager", size: "8,901 kB", dependencies: ["rustc"] },
    openjdk: { version: "11.0.17+8-1ubuntu2~22.04", description: "OpenJDK Development Kit", size: "89,123 kB" },
    "openjdk-17-jdk": { version: "17.0.5+8-2ubuntu1~22.04", description: "OpenJDK 17 Development Kit", size: "123,456 kB" },
    "openjdk-11-jdk": { version: "11.0.17+8-1ubuntu2~22.04", description: "OpenJDK 11 Development Kit", size: "112,345 kB" },
    php: { version: "2:8.1+92ubuntu1", description: "Server-side HTML embedded scripting language", size: "12 kB" },
    "php8.1": { version: "8.1.2-1ubuntu2.10", description: "PHP 8.1 interpreter", size: "5,678 kB" },
    perl: { version: "5.34.0-3ubuntu1.1", description: "Larry Wall's Practical Extraction and Report Language", size: "567 kB" },
    lua5: { version: "5.4.4-1", description: "Simple, extensible, embeddable programming language", size: "234 kB" },
    
    // Build Tools
    "build-essential": { version: "12.9ubuntu3", description: "Informational list of build-essential packages", size: "23 kB", dependencies: ["gcc", "g++", "make", "libc6-dev"] },
    gcc: { version: "4:11.2.0-1ubuntu1", description: "GNU C compiler", size: "45 kB" },
    "gcc-11": { version: "11.3.0-1ubuntu1~22.04", description: "GNU C compiler", size: "23,456 kB" },
    "g++": { version: "4:11.2.0-1ubuntu1", description: "GNU C++ compiler", size: "45 kB" },
    "g++-11": { version: "11.3.0-1ubuntu1~22.04", description: "GNU C++ compiler", size: "12,345 kB" },
    make: { version: "4.3-4.1build1", description: "Utility for directing compilation", size: "234 kB" },
    cmake: { version: "3.22.1-1ubuntu1", description: "Cross-platform make system", size: "8,901 kB" },
    ninja: { version: "1.10.1-1", description: "Small build system closest in spirit to Make", size: "123 kB" },
    "ninja-build": { version: "1.10.1-1", description: "Small build system closest in spirit to Make", size: "123 kB" },
    autoconf: { version: "2.71-2", description: "Automatic configure script builder", size: "567 kB" },
    automake: { version: "1:1.16.5-1.3", description: "Tool for generating GNU Standards-compliant Makefiles", size: "789 kB" },
    libtool: { version: "2.4.6-15build2", description: "Generic library support script", size: "456 kB" },
    pkg: { version: "0.29.2-1ubuntu4", description: "Manage compile and link flags for libraries", size: "56 kB" },
    "pkg-config": { version: "0.29.2-1ubuntu4", description: "Manage compile and link flags for libraries", size: "56 kB" },
    clang: { version: "1:14.0-55~exp2", description: "C, C++ and Objective-C compiler", size: "23,456 kB" },
    llvm: { version: "1:14.0-55~exp2", description: "Low-Level Virtual Machine (LLVM)", size: "34,567 kB" },
    
    // Databases
    postgresql: { version: "14+238", description: "Object-relational SQL database", size: "67 kB" },
    "postgresql-14": { version: "14.6-0ubuntu0.22.04.1", description: "PostgreSQL 14 database server", size: "16,789 kB" },
    mysql: { version: "8.0.32-0ubuntu0.22.04.2", description: "MySQL database server", size: "23,456 kB" },
    "mysql-server": { version: "8.0.32-0ubuntu0.22.04.2", description: "MySQL database server", size: "23,456 kB" },
    "mysql-client": { version: "8.0.32-0ubuntu0.22.04.2", description: "MySQL database client", size: "1,234 kB" },
    mariadb: { version: "1:10.6.11-0ubuntu0.22.04.1", description: "MariaDB database server", size: "12,345 kB" },
    "mariadb-server": { version: "1:10.6.11-0ubuntu0.22.04.1", description: "MariaDB database server", size: "12,345 kB" },
    sqlite3: { version: "3.37.2-2ubuntu0.1", description: "Command line interface for SQLite 3", size: "234 kB" },
    redis: { version: "5:6.0.16-1ubuntu1", description: "Persistent key-value database", size: "1,234 kB" },
    "redis-server": { version: "5:6.0.16-1ubuntu1", description: "Persistent key-value database server", size: "1,234 kB" },
    mongodb: { version: "6.0.4", description: "Document-oriented database", size: "67,890 kB" },
    memcached: { version: "1.6.14-1", description: "High-performance memory object caching system", size: "123 kB" },
    
    // Web Servers
    nginx: { version: "1.18.0-6ubuntu14.3", description: "Small, powerful, scalable web/proxy server", size: "1,234 kB" },
    "nginx-full": { version: "1.18.0-6ubuntu14.3", description: "Nginx with full set of core modules", size: "567 kB" },
    apache2: { version: "2.4.52-1ubuntu4.3", description: "Apache HTTP Server", size: "2,345 kB" },
    caddy: { version: "2.6.2-1", description: "Fast, multi-platform web server with automatic HTTPS", size: "23,456 kB" },
    lighttpd: { version: "1.4.63-1ubuntu3.1", description: "Fast webserver with minimal memory footprint", size: "345 kB" },
    
    // Containers & Virtualization
    docker: { version: "20.10.21-0ubuntu1~22.04.2", description: "Linux container runtime", size: "45,678 kB" },
    "docker.io": { version: "20.10.21-0ubuntu1~22.04.2", description: "Linux container runtime", size: "45,678 kB" },
    "docker-compose": { version: "1.29.2-1", description: "Compose multi-container Docker applications", size: "2,345 kB", dependencies: ["docker"] },
    podman: { version: "3.4.4+ds1-1ubuntu1", description: "Engine to run OCI-based containers in Pods", size: "23,456 kB" },
    lxc: { version: "1:5.0.0~git2209-g5a7b9ce67-0ubuntu1", description: "Linux Containers userspace tools", size: "567 kB" },
    qemu: { version: "1:6.2+dfsg-2ubuntu6.6", description: "Fast processor emulator", size: "12,345 kB" },
    "qemu-kvm": { version: "1:6.2+dfsg-2ubuntu6.6", description: "QEMU Full virtualization on x86 hardware", size: "23,456 kB" },
    vagrant: { version: "2.2.19+dfsg-1ubuntu1", description: "Tool for building and distributing virtualized environments", size: "5,678 kB" },
    virtualbox: { version: "6.1.38-dfsg-3~ubuntu1.22.04.1", description: "x86 virtualization solution", size: "89,123 kB" },
    
    // Terminal Utilities
    tmux: { version: "3.2a-4ubuntu0.1", description: "Terminal multiplexer", size: "567 kB", dependencies: ["libncurses6"] },
    screen: { version: "4.9.0-1", description: "Terminal multiplexer with VT100/ANSI terminal emulation", size: "678 kB" },
    tree: { version: "2.0.2-1", description: "Displays an indented directory tree, in color", size: "56 kB" },
    ncdu: { version: "1.15.1-1", description: "NCurses disk usage viewer", size: "89 kB" },
    ranger: { version: "1.9.3-3", description: "File manager with an ncurses frontend", size: "345 kB" },
    mc: { version: "3:4.8.27-1", description: "Midnight Commander - a powerful file manager", size: "1,234 kB" },
    "midnight-commander": { version: "3:4.8.27-1", description: "Midnight Commander - a powerful file manager", size: "1,234 kB" },
    fzf: { version: "0.29.0-1", description: "General-purpose command-line fuzzy finder", size: "1,234 kB" },
    ripgrep: { version: "13.0.0-2ubuntu0.1", description: "Recursively searches directories for a regex pattern", size: "2,345 kB" },
    fd: { version: "8.3.1-1", description: "Simple, fast and user-friendly alternative to find", size: "1,234 kB" },
    "fd-find": { version: "8.3.1-1", description: "Simple, fast and user-friendly alternative to find", size: "1,234 kB" },
    bat: { version: "0.19.0-3", description: "Cat clone with syntax highlighting and git integration", size: "3,456 kB" },
    exa: { version: "0.10.1-2", description: "Modern replacement for ls", size: "789 kB" },
    lsd: { version: "0.21.0-3", description: "LSDeluxe - ls command with a lot of pretty colors", size: "2,345 kB" },
    jq: { version: "1.6-2.1ubuntu3", description: "Lightweight and flexible command-line JSON processor", size: "123 kB" },
    yq: { version: "2.12.2-2", description: "YAML processor - jq wrapper for YAML documents", size: "45 kB" },
    zsh: { version: "5.8.1-1", description: "Shell with lots of features", size: "2,345 kB" },
    fish: { version: "3.3.1+ds-3", description: "Friendly interactive shell", size: "3,456 kB" },
    
    // Archives & Compression
    zip: { version: "3.0-12build2", description: "Archiver for .zip files", size: "234 kB" },
    unzip: { version: "6.0-26ubuntu3.1", description: "De-archiver for .zip files", size: "176 kB" },
    p7zip: { version: "16.02+dfsg-8", description: "7z and 7za file archivers with high compression ratio", size: "1,234 kB" },
    "p7zip-full": { version: "16.02+dfsg-8", description: "7z and 7za file archivers with high compression ratio", size: "1,234 kB" },
    rar: { version: "2:6.11-1~deb11u1", description: "Archiver for .rar files", size: "567 kB" },
    unrar: { version: "1:6.1.4-1", description: "Unarchiver for .rar files", size: "234 kB" },
    xz: { version: "5.2.5-2ubuntu1", description: "XZ-format compression utilities", size: "123 kB" },
    "xz-utils": { version: "5.2.5-2ubuntu1", description: "XZ-format compression utilities", size: "123 kB" },
    bzip2: { version: "1.0.8-5build1", description: "High-quality block-sorting file compressor", size: "56 kB" },
    zstd: { version: "1.4.8+dfsg-3build1", description: "Fast lossless compression algorithm", size: "456 kB" },
    
    // Media & Graphics
    ffmpeg: { version: "7:4.4.2-0ubuntu0.22.04.1", description: "Tools for transcoding, streaming and playing multimedia", size: "2,345 kB" },
    imagemagick: { version: "8:6.9.11.60+dfsg-1.3ubuntu0.22.04.1", description: "Image manipulation programs", size: "234 kB" },
    gimp: { version: "2.10.30-1build1", description: "GNU Image Manipulation Program", size: "23,456 kB" },
    inkscape: { version: "1.1.2-1ubuntu2", description: "Vector-based drawing program", size: "34,567 kB" },
    vlc: { version: "3.0.16-1build7", description: "Multimedia player and streamer", size: "12,345 kB" },
    mpv: { version: "0.34.1-1ubuntu3", description: "Video player based on MPlayer/mplayer2", size: "1,234 kB" },
    sox: { version: "14.4.2+git20190427-3.4ubuntu0.1", description: "Swiss army knife of sound processing", size: "567 kB" },
    youtube: { version: "2021.12.17-1", description: "Download videos from YouTube", size: "2,345 kB" },
    "youtube-dl": { version: "2021.12.17-1", description: "Download videos from YouTube", size: "2,345 kB" },
    "yt-dlp": { version: "2023.01.06-1", description: "YouTube-DL fork with additional features", size: "3,456 kB" },
    
    // Security
    openssl: { version: "3.0.2-0ubuntu1.7", description: "Secure Sockets Layer toolkit", size: "1,234 kB" },
    gnupg: { version: "2.2.27-3ubuntu2.1", description: "GNU privacy guard", size: "567 kB" },
    gnupg2: { version: "2.2.27-3ubuntu2.1", description: "GNU privacy guard", size: "567 kB" },
    fail2ban: { version: "0.11.2-6", description: "Ban hosts that cause multiple authentication errors", size: "456 kB" },
    ufw: { version: "0.36.1-4build1", description: "Program for managing a Netfilter firewall", size: "234 kB" },
    iptables: { version: "1.8.7-1ubuntu5", description: "Administration tools for packet filtering and NAT", size: "234 kB" },
    nftables: { version: "1.0.2-1ubuntu2", description: "Program to control packet filtering rules by Netfilter", size: "345 kB" },
    clamav: { version: "0.103.7+dfsg-1~22.04.1", description: "Anti-virus utility for Unix", size: "12,345 kB" },
    lynis: { version: "3.0.6-1", description: "Security auditing tool for Unix based systems", size: "567 kB" },
    
    // System Libraries
    libncurses6: { version: "6.3-2", description: "Shared libraries for terminal handling", size: "345 kB" },
    "libncurses-dev": { version: "6.3-2", description: "Developer's libraries for ncurses", size: "456 kB" },
    libcurl4: { version: "7.81.0-1ubuntu1.7", description: "Easy-to-use client-side URL transfer library", size: "345 kB" },
    "libcurl4-openssl-dev": { version: "7.81.0-1ubuntu1.7", description: "Development files for libcurl", size: "567 kB" },
    libssl3: { version: "3.0.2-0ubuntu1.7", description: "Secure Sockets Layer toolkit - shared libraries", size: "1,234 kB" },
    "libssl-dev": { version: "3.0.2-0ubuntu1.7", description: "Secure Sockets Layer toolkit - development files", size: "2,345 kB" },
    "libc6-dev": { version: "2.35-0ubuntu3.1", description: "GNU C Library: Development Libraries and Header Files", size: "2,345 kB" },
    zlib1g: { version: "1:1.2.11.dfsg-2ubuntu9.2", description: "Compression library - runtime", size: "67 kB" },
    "zlib1g-dev": { version: "1:1.2.11.dfsg-2ubuntu9.2", description: "Compression library - development", size: "234 kB" },
    
    // Misc Utilities
    neofetch: { version: "7.1.0-3", description: "Shows Linux System Information with Distribution Logo", size: "123 kB" },
    screenfetch: { version: "3.9.1-2", description: "Bash Screenshot Information Tool", size: "89 kB" },
    cowsay: { version: "3.03+dfsg2-8", description: "Configurable talking cow", size: "23 kB" },
    fortune: { version: "1:1.99.1-7build1", description: "Print a random, hopefully interesting, adage", size: "234 kB" },
    "fortune-mod": { version: "1:1.99.1-7build1", description: "Provides fortune cookies on demand", size: "234 kB" },
    figlet: { version: "2.2.5-3", description: "Make large character ASCII banners", size: "567 kB" },
    toilet: { version: "0.3-1.3", description: "Display large colourful characters in text mode", size: "89 kB" },
    sl: { version: "5.02-1build1", description: "Correct you if you type `sl` by mistake", size: "23 kB" },
    cmatrix: { version: "2.0-3", description: "Simulates the display from The Matrix", size: "34 kB" },
    asciinema: { version: "2.1.0-1", description: "Record and share terminal sessions", size: "345 kB" },
    tldr: { version: "0.5-2", description: "Simplified and community-driven man pages", size: "23 kB" },
    thefuck: { version: "3.32-2", description: "Application that corrects your previous console command", size: "456 kB" },
    mlocate: { version: "1.1.15-1ubuntu2", description: "Quickly find files on the filesystem based on their name", size: "67 kB" },
    plocate: { version: "1.1.15-1ubuntu2", description: "Much faster locate", size: "89 kB" },
    htpasswd: { version: "2.4.52-1ubuntu4.3", description: "Apache htpasswd utility", size: "45 kB" },
    rsync: { version: "3.2.3-8ubuntu3.1", description: "Fast, versatile, remote (and local) file-copying tool", size: "456 kB" },
    rclone: { version: "1.53.3-1ubuntu2", description: "Rsync for cloud storage", size: "23,456 kB" },
    "apt-transport-https": { version: "2.4.8", description: "HTTPS download transport for APT", size: "23 kB" },
    "ca-certificates": { version: "20211016ubuntu0.22.04.1", description: "Common CA certificates", size: "234 kB" },
    "software-properties-common": { version: "0.99.22.3", description: "Manage repositories from which you install software", size: "123 kB" },
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
        output += `\x1b[31mAdmin Commands:\x1b[0m\n  users, sysadmin, logs, broadcast, ban, unban, sessions, audit, maintenance, stats\n\n`;
      }
      
      if (adminStatus?.isOwner) {
        output += `\x1b[35mOwner Commands:\x1b[0m\n  shutdown, stopshutdown, instashutdown, promote, demote, purge, lockdown, resetuser, sysconfig\n\n`;
      }
      
      if (developerMode) {
        output += `\x1b[32mDeveloper Commands:\x1b[0m\n  debug, sysinfo, devlog, perf, windows\n\n`;
      }
      
      output += "Type 'help <command>' or 'man <command>' for detailed usage.";
      return output;
    },
    
    debug: () => {
      if (!developerMode) {
        return "debug: command requires developer mode to be enabled. Go to Settings > Developer to enable.";
      }
      addDebugLog("info", "Terminal", "Debug command executed");
      const memoryInfo = (performance as any).memory;
      let output = "\x1b[32m=== Debug Information ===\x1b[0m\n\n";
      output += `Developer Mode: \x1b[32mEnabled\x1b[0m\n`;
      output += `Open Windows: ${windows.length}\n`;
      output += `Debug Log Entries: ${debugLogs.length}\n`;
      output += `Session Storage: ${Object.keys(localStorage).length} items\n`;
      if (memoryInfo) {
        output += `JS Heap Used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
        output += `JS Heap Total: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
      }
      output += `\nUse 'devlog' to view debug logs or 'perf' for performance metrics.`;
      return output;
    },
    
    sysinfo: () => {
      if (!developerMode) {
        return "sysinfo: command requires developer mode to be enabled.";
      }
      addDebugLog("info", "Terminal", "System info requested");
      let output = "\x1b[36m=== System Information ===\x1b[0m\n\n";
      output += `User Agent: ${navigator.userAgent.substring(0, 60)}...\n`;
      output += `Language: ${navigator.language}\n`;
      output += `Online: ${navigator.onLine ? "Yes" : "No"}\n`;
      output += `Platform: ${navigator.platform}\n`;
      output += `Cookies Enabled: ${navigator.cookieEnabled ? "Yes" : "No"}\n`;
      output += `Screen: ${window.screen.width}x${window.screen.height}\n`;
      output += `Color Depth: ${window.screen.colorDepth}-bit\n`;
      output += `Device Pixel Ratio: ${window.devicePixelRatio}\n`;
      return output;
    },
    
    devlog: (args) => {
      if (!developerMode) {
        return "devlog: command requires developer mode to be enabled.";
      }
      if (args[0] === "clear") {
        return "Use Settings > Developer > Clear Logs to clear the debug log.";
      }
      if (debugLogs.length === 0) {
        return "No debug logs available. System events will be logged here when developer mode is enabled.";
      }
      let output = "\x1b[33m=== Debug Logs ===\x1b[0m\n\n";
      const recentLogs = debugLogs.slice(-20);
      for (const log of recentLogs) {
        const time = log.timestamp.toLocaleTimeString();
        const typeColor = log.type === "error" ? "\x1b[31m" : 
                          log.type === "warn" ? "\x1b[33m" : 
                          log.type === "event" ? "\x1b[34m" : "\x1b[37m";
        output += `${time} ${typeColor}[${log.type.toUpperCase()}]\x1b[0m [${log.category}] ${log.message}\n`;
      }
      if (debugLogs.length > 20) {
        output += `\n... and ${debugLogs.length - 20} more entries (showing last 20)`;
      }
      return output;
    },
    
    perf: () => {
      if (!developerMode) {
        return "perf: command requires developer mode to be enabled.";
      }
      addDebugLog("info", "Terminal", "Performance metrics requested");
      const timing = performance.timing;
      const memoryInfo = (performance as any).memory;
      let output = "\x1b[35m=== Performance Metrics ===\x1b[0m\n\n";
      if (timing.loadEventEnd && timing.navigationStart) {
        output += `Page Load Time: ${timing.loadEventEnd - timing.navigationStart}ms\n`;
      }
      if (timing.domContentLoadedEventEnd && timing.navigationStart) {
        output += `DOM Ready: ${timing.domContentLoadedEventEnd - timing.navigationStart}ms\n`;
      }
      if (memoryInfo) {
        output += `\n\x1b[36mMemory Usage:\x1b[0m\n`;
        output += `  Used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
        output += `  Total: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
        output += `  Limit: ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB\n`;
      }
      output += `\nOpen Windows: ${windows.length}`;
      return output;
    },
    
    windows: () => {
      if (!developerMode) {
        return "windows: command requires developer mode to be enabled.";
      }
      if (windows.length === 0) {
        return "No windows currently open.";
      }
      let output = "\x1b[36m=== Open Windows ===\x1b[0m\n\n";
      for (const win of windows) {
        const status = win.isMinimized ? "[minimized]" : win.isMaximized ? "[maximized]" : "";
        output += `${win.title} ${status}\n`;
        output += `  ID: ${win.id}\n`;
        output += `  Position: (${win.x}, ${win.y})\n`;
        output += `  Size: ${win.width}x${win.height}\n`;
        output += `  Z-Index: ${win.zIndex}\n\n`;
      }
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
      const sudoCmd = args[0];
      const sudoArgs = args.slice(1);
      if (COMMANDS[sudoCmd]) {
        const passwordPrompt = `[sudo] password for ${env.USER}: \n`;
        const result = COMMANDS[sudoCmd](sudoArgs, true);
        if (result instanceof Promise) {
          return result.then(r => passwordPrompt + r);
        }
        return passwordPrompt + result;
      }
      return `sudo: ${sudoCmd}: command not found`;
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
    
    secret: () => `\x1b[35m╔═══════════════════════════════════════════╗
║       \x1b[1;33m🤫 SECRET COMMANDS 🤫\x1b[0m\x1b[35m              ║
╚═══════════════════════════════════════════╝\x1b[0m

You found the secret command list! Here are some hidden gems:

  \x1b[36mcmatrix\x1b[0m      - Matrix-style falling code animation
  \x1b[36msl\x1b[0m           - Steam locomotive (when you mistype 'ls')
  \x1b[36mcowsay\x1b[0m       - A cow says your message
  \x1b[36mfortune\x1b[0m      - Random fortune cookie wisdom
  \x1b[36mfiglet\x1b[0m       - Create ASCII art text banners
  \x1b[36mlolcat\x1b[0m       - Rainbow colored text output
  \x1b[36mparrot\x1b[0m       - Party parrot animation
  \x1b[36maquarium\x1b[0m     - ASCII fish tank
  \x1b[36mfire\x1b[0m         - Animated fire effect
  \x1b[36mhack\x1b[0m         - "Hacker" mode simulation
  \x1b[36mrickroll\x1b[0m     - Never gonna give you up...
  \x1b[36m42\x1b[0m           - The answer to everything
  \x1b[36mxyzzy\x1b[0m        - Nothing happens... or does it?
  \x1b[36msudo rm -rf\x1b[0m  - Don't try this at home

\x1b[33mTip:\x1b[0m Some commands have hidden easter eggs. Explore!
`,
    
    users: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) return "Failed to fetch users";
        const users = await res.json();
        if (users.length === 0) return "No registered users";
        
        // Get owner ID
        const adminStatusRes = await fetch("/api/admin/status", { credentials: "include" });
        let ownerId = "";
        if (adminStatusRes.ok) {
          const adminStatus = await adminStatusRes.json();
          ownerId = adminStatus.ownerId || "";
        }
        
        // Fetch tags for all users
        const userTags: Record<string, string[]> = {};
        await Promise.all(users.map(async (u: any) => {
          try {
            const tagsRes = await fetch(`/api/users/${u.id}/tags`, { credentials: "include" });
            if (tagsRes.ok) {
              const tags = await tagsRes.json();
              userTags[u.id] = tags.map((t: any) => t.name);
            }
          } catch (e) {
            userTags[u.id] = [];
          }
        }));
        
        let output = "USER ID          | NAME                | STATUS      | TAGS\n";
        output += "-".repeat(80) + "\n";
        users.forEach((u: any) => {
          const id = u.id.substring(0, 14).padEnd(16);
          const displayName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
          const name = (displayName || u.email || "N/A").substring(0, 18).padEnd(20);
          const status = u.banned ? "\x1b[31mBANNED\x1b[0m    " : "\x1b[32mActive\x1b[0m    ";
          
          // Build tags list with role tags first
          const allTags: string[] = [];
          if (u.id === ownerId) {
            allTags.push("\x1b[33mOWNER\x1b[0m");
          } else if (u.isAdmin) {
            allTags.push("\x1b[36mADMIN\x1b[0m");
          }
          if (userTags[u.id]?.length > 0) {
            allTags.push(...userTags[u.id]);
          }
          const tagsStr = allTags.length > 0 ? allTags.join(", ") : "-";
          
          output += `${id}| ${name}| ${status}| ${tagsStr}\n`;
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
    
    broadcast: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      if (args.length === 0) return "Usage: broadcast <message>\nSends a system-wide notification to all users.";
      const message = args.join(" ");
      try {
        const response = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message }),
        });
        if (!response.ok) {
          return `\x1b[33mBroadcast simulated (API not implemented):\x1b[0m\n\n  "${message}"\n\nMessage would be sent to all connected users.`;
        }
        return `\x1b[32mBroadcast sent successfully:\x1b[0m\n\n  "${message}"`;
      } catch (e) {
        return `\x1b[33mBroadcast simulated:\x1b[0m\n\n  "${message}"\n\nMessage would be sent to all connected users.`;
      }
    },
    
    ban: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      if (args.length === 0) return "Usage: ban <userId> [reason]\nBans a user from the system by their user ID.";
      const userId = args[0];
      const reason = args.slice(1).join(" ") || "Banned by administrator";
      try {
        const response = await fetch(`/api/admin/users/${userId}/ban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ banned: true, reason }),
        });
        if (!response.ok) {
          const data = await response.json();
          return `\x1b[31mError:\x1b[0m ${data.error || "Failed to ban user"}`;
        }
        return `\x1b[32mUser ${userId} has been banned.\x1b[0m\nReason: ${reason}`;
      } catch (e) {
        return "Error: Failed to connect to user management service";
      }
    },
    
    unban: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      if (args.length === 0) return "Usage: unban <userId>\nUnbans a previously banned user.";
      const userId = args[0];
      try {
        const response = await fetch(`/api/admin/users/${userId}/ban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ banned: false }),
        });
        if (!response.ok) {
          const data = await response.json();
          return `\x1b[31mError:\x1b[0m ${data.error || "Failed to unban user"}`;
        }
        return `\x1b[32mUser ${userId} has been unbanned.\x1b[0m`;
      } catch (e) {
        return "Error: Failed to connect to user management service";
      }
    },
    
    sessions: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) return "Failed to fetch session data";
        const users = await res.json();
        const now = new Date();
        let output = `\x1b[36mActive Sessions\x1b[0m\n${"=".repeat(50)}\n\n`;
        output += `Total Registered Users: ${users.length}\n`;
        output += `Server Uptime: ${Math.floor((now.getTime() - (now.getTime() - Math.random() * 86400000)) / 3600000)}h ${Math.floor(Math.random() * 60)}m\n\n`;
        output += "Recent Activity:\n";
        users.slice(0, 5).forEach((u: any, i: number) => {
          const status = Math.random() > 0.5 ? "\x1b[32monline\x1b[0m" : "\x1b[33midle\x1b[0m";
          output += `  ${i + 1}. ${(u.email || "unknown").padEnd(30)} [${status}]\n`;
        });
        return output;
      } catch (e) {
        return "Error fetching session data";
      }
    },
    
    audit: (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      const now = new Date();
      const actions = [
        { time: new Date(now.getTime() - 7200000), admin: "admin", action: "User ban", target: "user123" },
        { time: new Date(now.getTime() - 3600000), admin: "admin", action: "Settings changed", target: "system" },
        { time: new Date(now.getTime() - 1800000), admin: "admin", action: "App approved", target: "CustomApp" },
        { time: new Date(now.getTime() - 900000), admin: "admin", action: "Bug resolved", target: "BUG-001" },
        { time: new Date(now.getTime() - 300000), admin: "admin", action: "Broadcast sent", target: "all users" },
        { time: now, admin: "admin", action: "Audit log viewed", target: "system" },
      ];
      
      let output = `\x1b[36mAdmin Audit Log\x1b[0m\n${"=".repeat(70)}\n\n`;
      output += "TIMESTAMP                | ADMIN    | ACTION            | TARGET\n";
      output += "-".repeat(70) + "\n";
      actions.forEach(a => {
        output += `${a.time.toISOString()} | ${a.admin.padEnd(8)} | ${a.action.padEnd(17)} | ${a.target}\n`;
      });
      return output;
    },
    
    maintenance: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      const mode = args[0]?.toLowerCase();
      if (!mode || !["on", "off", "status"].includes(mode)) {
        return `Usage: maintenance <on|off|status>
        
Commands:
  maintenance on     - Enable maintenance mode (new logins blocked)
  maintenance off    - Disable maintenance mode
  maintenance status - Check current maintenance status`;
      }
      
      if (mode === "status") {
        return `\x1b[36mMaintenance Mode: \x1b[32mOFF\x1b[0m\n\nSystem is operating normally.`;
      } else if (mode === "on") {
        return `\x1b[33m╔════════════════════════════════════════════╗
║         MAINTENANCE MODE ENABLED           ║
╠════════════════════════════════════════════╣
║  New user logins are now blocked.          ║
║  Existing sessions remain active.          ║
║  Use 'maintenance off' to restore.         ║
╚════════════════════════════════════════════╝\x1b[0m`;
      } else {
        return `\x1b[32mMaintenance mode disabled.\x1b[0m\n\nSystem is now accepting new connections.`;
      }
    },
    
    stats: async (args, isAdmin) => {
      if (!isAdmin) return "Permission denied: Admin access required";
      try {
        const usersRes = await fetch("/api/admin/users");
        const users = usersRes.ok ? await usersRes.json() : [];
        const bugsRes = await fetch("/api/bug-reports");
        const bugs = bugsRes.ok ? await bugsRes.json() : [];
        const appsRes = await fetch("/api/custom-apps");
        const apps = appsRes.ok ? await appsRes.json() : [];
        
        const resolvedBugs = bugs.filter((b: any) => b.resolved).length;
        const openBugs = bugs.length - resolvedBugs;
        
        const uptime = Math.floor(Math.random() * 72) + 24;
        const memUsage = Math.floor(Math.random() * 30) + 40;
        const cpuUsage = Math.floor(Math.random() * 20) + 10;
        
        return `\x1b[36m╔══════════════════════════════════════════════════╗
║              NEXUSOS SYSTEM STATISTICS           ║
╚══════════════════════════════════════════════════╝\x1b[0m

\x1b[33mUsers\x1b[0m
  Total Registered:  ${users.length}
  Banned Users:      ${users.filter((u: any) => u.banned).length}
  Active Today:      ${Math.min(users.length, Math.floor(Math.random() * 10) + 1)}

\x1b[33mBug Reports\x1b[0m
  Total Reports:     ${bugs.length}
  Open:              ${openBugs}
  Resolved:          ${resolvedBugs}

\x1b[33mApp Store\x1b[0m
  Custom Apps:       ${apps.length}
  Total Installs:    ${Math.floor(Math.random() * 100) + apps.length * 5}

\x1b[33mSystem Health\x1b[0m
  Uptime:            ${uptime} hours
  Memory Usage:      ${memUsage}%
  CPU Usage:         ${cpuUsage}%
  Status:            \x1b[32mHealthy\x1b[0m`;
      } catch (e) {
        return "Error fetching system statistics";
      }
    },
    
    shutdown: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      try {
        const response = await fetch("/api/shutdown", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json();
          return `Error: ${data.error || "Failed to initiate shutdown"}`;
        }
        return `\x1b[31mShutdown initiated...\x1b[0m
Broadcasting message to all terminals...
System going down for maintenance in 60 seconds!`;
      } catch (e) {
        return "Error: Failed to connect to shutdown service";
      }
    },

    stopshutdown: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      try {
        const response = await fetch("/api/shutdown/stop", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json();
          return `Error: ${data.error || "Failed to stop shutdown"}`;
        }
        return `\x1b[32mShutdown cancelled.\x1b[0m
All users have been restored access to the system.`;
      } catch (e) {
        return "Error: Failed to connect to shutdown service";
      }
    },

    instashutdown: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      try {
        const reason = args.length > 0 ? args.join(" ") : null;
        const response = await fetch("/api/shutdown/instant", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (!response.ok) {
          const data = await response.json();
          return `Error: ${data.error || "Failed to execute instant shutdown"}`;
        }
        const reasonDisplay = reason ? `\n║  Reason: ${reason.substring(0, 37).padEnd(37)} ║` : "";
        return `\x1b[31m╔═══════════════════════════════════════════════╗
║           INSTANT SHUTDOWN EXECUTED           ║
╠═══════════════════════════════════════════════╣
║  All non-admin users have been locked out.    ║${reasonDisplay}
║  Use 'stopshutdown' to restore access.        ║
╚═══════════════════════════════════════════════╝\x1b[0m`;
      } catch (e) {
        return "Error: Failed to connect to shutdown service";
      }
    },
    
    promote: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      if (args.length === 0) return "Usage: promote <username|email>\nGrants admin privileges to a user.";
      const identifier = args[0];
      try {
        const response = await fetch("/api/owner/grant-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ identifier, grant: true }),
        });
        if (!response.ok) {
          const data = await response.json();
          return `\x1b[31mError:\x1b[0m ${data.error || "Failed to promote user"}`;
        }
        return `\x1b[32m╔════════════════════════════════════════════╗
║            USER PROMOTED TO ADMIN          ║
╠════════════════════════════════════════════╣
║  User: ${identifier.padEnd(35)} ║
║  Status: \x1b[33mADMIN\x1b[32m                             ║
║                                            ║
║  User now has access to admin commands     ║
║  and admin-only features.                  ║
╚════════════════════════════════════════════╝\x1b[0m`;
      } catch (e) {
        return "Error: Failed to connect to user management service";
      }
    },
    
    demote: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      if (args.length === 0) return "Usage: demote <username|email>\nRevokes admin privileges from a user.";
      const identifier = args[0];
      try {
        const response = await fetch("/api/owner/grant-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ identifier, grant: false }),
        });
        if (!response.ok) {
          const data = await response.json();
          return `\x1b[31mError:\x1b[0m ${data.error || "Failed to demote user"}`;
        }
        return `\x1b[33m╔════════════════════════════════════════════╗
║          ADMIN PRIVILEGES REVOKED          ║
╠════════════════════════════════════════════╣
║  User: ${identifier.padEnd(35)} ║
║  Status: \x1b[37mREGULAR USER\x1b[33m                      ║
║                                            ║
║  User no longer has admin access.          ║
╚════════════════════════════════════════════╝\x1b[0m`;
      } catch (e) {
        return "Error: Failed to connect to user management service";
      }
    },
    
    purge: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      const target = args[0]?.toLowerCase();
      if (!target || !["bugs", "apps", "bans", "all"].includes(target)) {
        return `Usage: purge <bugs|apps|bans|all>
        
Commands:
  purge bugs  - Clear all resolved bug reports
  purge apps  - Remove all custom apps from the store
  purge bans  - Unban all banned users and IPs
  purge all   - Clear all of the above

\x1b[31mWarning: This action cannot be undone!\x1b[0m`;
      }
      
      let output = "\x1b[31m╔════════════════════════════════════════════╗\n";
      output += "║              SYSTEM PURGE                  ║\n";
      output += "╠════════════════════════════════════════════╣\n";
      
      if (target === "bugs" || target === "all") {
        output += "║  \x1b[33m[✓]\x1b[31m Resolved bug reports cleared          ║\n";
      }
      if (target === "apps" || target === "all") {
        output += "║  \x1b[33m[✓]\x1b[31m Custom apps removed                   ║\n";
      }
      if (target === "bans" || target === "all") {
        output += "║  \x1b[33m[✓]\x1b[31m All bans lifted                       ║\n";
      }
      output += "╚════════════════════════════════════════════╝\x1b[0m\n";
      output += "\nPurge operation simulated. In production, this would clear the specified data.";
      
      return output;
    },
    
    lockdown: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      const mode = args[0]?.toLowerCase();
      if (!mode || !["enable", "disable", "status"].includes(mode)) {
        return `Usage: lockdown <enable|disable|status>
        
Commands:
  lockdown enable  - Enable full system lockdown (only owner can access)
  lockdown disable - Disable lockdown and restore normal access
  lockdown status  - Check current lockdown status

\x1b[31mWarning: Lockdown blocks ALL users including admins!\x1b[0m`;
      }
      
      if (mode === "status") {
        return `\x1b[36mSystem Lockdown: \x1b[32mDISABLED\x1b[0m\n\nSystem is operating normally. All authorized users have access.`;
      } else if (mode === "enable") {
        return `\x1b[31m╔═══════════════════════════════════════════════════╗
║             SYSTEM LOCKDOWN ENABLED               ║
╠═══════════════════════════════════════════════════╣
║  ⚠  CRITICAL SECURITY MODE ACTIVATED              ║
║                                                   ║
║  All users (including admins) are now locked out. ║
║  Only the system owner can access NexusOS.        ║
║                                                   ║
║  Use 'lockdown disable' to restore access.        ║
╚═══════════════════════════════════════════════════╝\x1b[0m`;
      } else {
        return `\x1b[32mLockdown disabled.\x1b[0m\n\nSystem access has been restored for all authorized users.`;
      }
    },
    
    resetuser: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      if (args.length === 0) return `Usage: resetuser <userId> [--force]

Resets a user's account to default state:
  - Clears all installed apps
  - Resets settings to defaults
  - Removes desktop shortcuts
  - Clears session data

Use --force to skip confirmation.`;
      
      const userId = args[0];
      const force = args.includes("--force");
      
      if (!force) {
        return `\x1b[33mConfirmation required.\x1b[0m

You are about to reset user: ${userId}

This will:
  - Clear all installed apps
  - Reset all settings
  - Remove desktop shortcuts
  - Clear session data

Run 'resetuser ${userId} --force' to confirm.`;
      }
      
      return `\x1b[32m╔════════════════════════════════════════════╗
║            USER ACCOUNT RESET              ║
╠════════════════════════════════════════════╣
║  User ID: ${userId.substring(0, 30).padEnd(32)} ║
║                                            ║
║  [✓] Installed apps cleared                ║
║  [✓] Settings reset to defaults            ║
║  [✓] Desktop shortcuts removed             ║
║  [✓] Session data cleared                  ║
║                                            ║
║  User will see fresh state on next login.  ║
╚════════════════════════════════════════════╝\x1b[0m`;
    },
    
    sysconfig: async (args, isAdmin) => {
      if (!adminStatus?.isOwner) return "Permission denied: Owner access required";
      const action = args[0]?.toLowerCase();
      const key = args[1];
      const value = args.slice(2).join(" ");
      
      if (!action || !["get", "set", "list", "reset"].includes(action)) {
        return `Usage: sysconfig <get|set|list|reset> [key] [value]

Commands:
  sysconfig list            - Show all system configuration
  sysconfig get <key>       - Get a specific config value
  sysconfig set <key> <val> - Set a config value
  sysconfig reset           - Reset all config to defaults

Available Keys:
  max_users          - Maximum concurrent users
  session_timeout    - Session timeout in minutes
  allow_registration - Allow new user registration
  debug_mode         - Enable debug logging
  motd               - Message of the day`;
      }
      
      const config: Record<string, string> = {
        max_users: "100",
        session_timeout: "60",
        allow_registration: "true",
        debug_mode: "false",
        motd: "Welcome to NexusOS!",
      };
      
      if (action === "list") {
        let output = "\x1b[36mSystem Configuration\x1b[0m\n" + "=".repeat(50) + "\n\n";
        output += "KEY                    VALUE\n";
        output += "-".repeat(50) + "\n";
        for (const [k, v] of Object.entries(config)) {
          output += `${k.padEnd(22)} ${v}\n`;
        }
        return output;
      } else if (action === "get") {
        if (!key) return "Usage: sysconfig get <key>";
        const val = config[key];
        if (!val) return `\x1b[31mError:\x1b[0m Unknown config key '${key}'`;
        return `${key} = ${val}`;
      } else if (action === "set") {
        if (!key || !value) return "Usage: sysconfig set <key> <value>";
        if (!config[key]) return `\x1b[31mError:\x1b[0m Unknown config key '${key}'`;
        return `\x1b[32mConfig updated:\x1b[0m ${key} = ${value}`;
      } else if (action === "reset") {
        return `\x1b[33mSystem configuration reset to defaults.\x1b[0m

All configuration values have been restored to their default settings.`;
      }
      return "Unknown sysconfig command";
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
      
      if (OWNER_COMMANDS.includes(cmd) && !adminStatus?.isOwner) {
        setLines(prev => [...prev, { type: "error", content: `${cmd}: Permission denied - Owner access required` }]);
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
    } else if (installedPackages[cmd] || AVAILABLE_PACKAGES[cmd]) {
      // Check if the command is an installed package that can be executed
      const pkgInfo = installedPackages[cmd];
      if (!pkgInfo) {
        setLines(prev => [...prev, { type: "error", content: `${cmd}: command not found. Install it with: sudo apt install ${cmd}` }]);
        return;
      }
      
      // Provide simulated output for installed packages
      const packageOutputs: Record<string, () => string> = {
        btop: () => `\x1b[32mbtop\x1b[0m - Resource monitor
┌─ CPU ────────────────────────────────────────────────────┐
│ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄ 45% @ 3.2GHz                 │
│ Core 0: 52%  Core 1: 38%  Core 2: 47%  Core 3: 41%       │
└──────────────────────────────────────────────────────────┘
┌─ Memory ─────────────────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░░░░  4.2G / 16G (26%)       │
│ Swap: ░░░░░░░░░░░░░░░░░░░░░░░░░░  0.0G / 2G (0%)         │
└──────────────────────────────────────────────────────────┘
Press 'q' to quit (simulated)`,
        htop: () => `\x1b[32mhtop\x1b[0m - Interactive process viewer
  CPU[||||||||||||        32.5%]   Tasks: 187, 412 thr
  Mem[||||||||||||||||    8.23G/16.0G]   Load: 1.24 1.56 1.32
  Swp[                    0K/2.00G]   Uptime: 04:32:15

  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+ Command
 1234 user       20   0  512M   45M   12M S  5.2  0.3  1:23.45 node server.js
 5678 user       20   0  256M   32M    8M S  2.1  0.2  0:45.12 npm run dev
 9012 root       20   0  128M   16M    4M S  0.5  0.1  0:12.34 systemd

Press q to quit`,
        vim: () => args.length > 0 
          ? `\x1b[7m ${args[0]} \x1b[0m
~
~
~                    VIM - Vi IMproved
~
~                     version 8.2
~                 by Bram Moolenaar et al.
~
~           type :q to exit    :help for help
~
-- INSERT --`
          : `VIM - Vi IMproved 8.2
Usage: vim [arguments] [file ...]
   or: vim [arguments] -

Arguments:
   --                   Only file names after this
   -v                   Vi mode
   -e                   Ex mode
   -R                   Readonly mode
   -m                   Modifications not allowed`,
        nano: () => args.length > 0
          ? `  GNU nano 6.2                    ${args[0]}

${args[0] === "test.txt" ? "Hello World!\nThis is a test file." : ""}




                              [ New File ]
^G Help    ^O Write Out   ^W Where Is   ^K Cut       ^T Execute
^X Exit    ^R Read File   ^\ Replace    ^U Paste     ^J Justify`
          : `Usage: nano [OPTIONS] [[+LINE[,COLUMN]] FILE]...

To place the cursor on a specific line of a file, put the line
number with a '+' before the filename.`,
        neovim: () => `NVIM v0.6.1
Build type: Release
Compilation: /usr/bin/cc
Features: +acl +iconv +tui

Run :checkhealth for more info`,
        git: () => {
          if (args[0] === "status") return `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
          if (args[0] === "log") return `commit a1b2c3d4e5f6 (HEAD -> main)
Author: User <user@nexusos.local>
Date:   ${new Date().toDateString()}

    Initial commit`;
          if (args[0] === "branch") return `* main`;
          return `usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           <command> [<args>]`;
        },
        nodejs: () => `Welcome to Node.js v18.17.0.
Type ".help" for more information.
> `,
        node: () => `Welcome to Node.js v18.17.0.
Type ".help" for more information.
> `,
        python3: () => `Python 3.10.6 (main, Nov 14 2022, 16:10:14) [GCC 11.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> `,
        python: () => `Python 3.10.6 (main, Nov 14 2022, 16:10:14) [GCC 11.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> `,
        ruby: () => `irb(main):001:0> `,
        tmux: () => args.length > 0 ? `[tmux session started]` : `usage: tmux [-2CluvV] [-c shell-command] [-f file] [-L socket-name]
            [-S socket-path] [command [flags]]`,
        tree: () => {
          const node = getNode(fileSystem, cwd);
          if (!node || node.type !== "directory") return "Error reading directory";
          let output = ".\n";
          const children = Object.entries(node.children || {});
          children.forEach(([name, child], i) => {
            const isLast = i === children.length - 1;
            const prefix = isLast ? "└── " : "├── ";
            const color = child.type === "directory" ? "\x1b[34m" : "";
            output += `${prefix}${color}${name}\x1b[0m\n`;
          });
          output += `\n${children.filter(([,c]) => c.type === "directory").length} directories, ${children.filter(([,c]) => c.type === "file").length} files`;
          return output;
        },
        ncdu: () => `ncdu 1.15.1 ~ Use the arrow keys to navigate, press ? for help
--- ${cwd} ----------------------------------------------------------------
    4.0 KiB [##########] /Documents
    2.0 KiB [#####     ] /Downloads  
    1.0 KiB [##        ]  readme.txt
    0.5 KiB [#         ]  .bashrc

 Total disk usage:   7.5 KiB  Apparent size:   7.5 KiB  Items: 4`,
        fzf: () => `fzf 0.29.0
Usage: fzf [options]

  Search mode:
    -x, --extended       Extended-search mode
    -e, --exact          Enable exact-match`,
        jq: () => args.length > 0 
          ? `jq - commandline JSON processor [version 1.6]
Usage: jq [OPTIONS...] FILTER [FILE...]`
          : `jq - commandline JSON processor [version 1.6]
Usage: jq [OPTIONS...] FILTER [FILE...]`,
        docker: () => {
          if (args[0] === "ps") return `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES`;
          if (args[0] === "images") return `REPOSITORY   TAG       IMAGE ID   CREATED   SIZE`;
          return `Usage:  docker [OPTIONS] COMMAND

A self-sufficient runtime for containers

Management Commands:
  container   Manage containers
  image       Manage images
  network     Manage networks
  volume      Manage volumes

Commands:
  build       Build an image from a Dockerfile
  pull        Pull an image or a repository from a registry
  push        Push an image or a repository to a registry
  run         Run a command in a new container`;
        },
        nginx: () => `nginx version: nginx/1.18.0 (Ubuntu)
Usage: nginx [-?hvVtTq] [-s signal] [-c filename] [-p prefix] [-g directives]`,
        redis: () => `redis-cli 6.0.16
Type 'help' for help, 'quit' to quit.
127.0.0.1:6379> `,
        ffmpeg: () => `ffmpeg version 4.4.2 Copyright (c) 2000-2021 the FFmpeg developers
  built with gcc 11 (Ubuntu 11.3.0-1ubuntu1~22.04)
  configuration: --enable-gpl --enable-version3 --enable-nonfree
  libavutil      56. 70.100 / 56. 70.100
  libavcodec     58.134.100 / 58.134.100`,
        neofetch: () => `\x1b[36m        _,met$$$$$gg.          \x1b[0muser@nexusos
\x1b[36m     ,g$$$$$$$$$$$$$$$P.       \x1b[0m--------------
\x1b[36m   ,g$$P"     """Y$$.".        \x1b[0mOS: NexusOS 1.0
\x1b[36m  ,$$P'              \`$$$.     \x1b[0mHost: Web Browser
\x1b[36m',$$P       ,ggs.     \`$$b:   \x1b[0mKernel: JavaScript ES2022
\x1b[36m\`d$$'     ,$P"'   .    $$$    \x1b[0mUptime: ${Math.floor(Math.random() * 24)} hours
\x1b[36m $$P      d$'     ,    $$P    \x1b[0mPackages: ${Object.keys(installedPackages).length} (apt)
\x1b[36m $$:      $$.   -    ,d$$'    \x1b[0mShell: bash 5.0
\x1b[36m $$;      Y$b._   _,d$P'      \x1b[0mTerminal: NexusOS Terminal
\x1b[36m Y$$.    \`.\`"Y$$$$P"'         \x1b[0mCPU: Virtual (4) @ 3.2GHz
\x1b[36m \`$$b      "-.__              \x1b[0mMemory: 4096MB / 16384MB
\x1b[36m  \`Y$$
\x1b[36m   \`Y$$.
\x1b[36m     \`$$b.
\x1b[36m       \`Y$$b.
\x1b[36m          \`"Y$b._
\x1b[36m              \`"""`,
        cmatrix: () => `\x1b[32m
   ▄▄▄▄▄▄▄  ▄▄   ▄▄  ▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄  ▄▄▄▄▄▄   ▄▄▄▄▄▄▄  ▄▄   ▄▄ 
  █       ██  █▄█  ██       ██       ██   ▄  █ █       ██  █ █  █
  █       ██       ██   ▄   ██▄     ▄██  █ █ █ █▄     ▄██  █▄█  █
  █     ▄▄██       ██  █▀█  █ █   █ ██   █▄▄█▄  █   █ ██       █
  █    █  ██       ██  █▄█  █ █   █ ██    ▄▄  █ █   █ ██▄     ▄█
  █    █▄▄██ ██▄██ ██       █ █   █ ██   █  █ █ █   █ █ █   █  
  █▄▄▄▄▄▄▄██▄█   █▄██▄▄▄▄▄▄▄█ █▄▄▄█ ██▄▄▄█  █▄█ █▄▄▄█ █  █▄▄█  
\x1b[0m
Press Ctrl+C to exit the Matrix...`,
        cowsay: () => {
          const msg = args.join(" ") || "Hello!";
          const border = "_".repeat(msg.length + 2);
          return ` ${border}
< ${msg} >
 ${"-".repeat(msg.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
        },
        figlet: () => {
          const text = args.join(" ") || "Hello";
          // ASCII art font - each letter is 6 lines tall
          const font: Record<string, string[]> = {
            'A': ['  ___  ', ' / _ \\ ', '/ /_\\ \\', '|  _  |', '| | | |', '\\_| |_/'],
            'B': [' ____  ', '| __ ) ', '|  _ \\ ', '| |_) |', '|____/ ', '       '],
            'C': ['  ____ ', ' / ___|', '| |    ', '| |___ ', ' \\____|', '       '],
            'D': [' ____  ', '|  _ \\ ', '| | | |', '| |_| |', '|____/ ', '       '],
            'E': [' _____ ', '| ____|', '|  _|  ', '| |___ ', '|_____|', '       '],
            'F': [' _____ ', '|  ___|', '| |_   ', '|  _|  ', '|_|    ', '       '],
            'G': ['  ____ ', ' / ___|', '| |  _ ', '| |_| |', ' \\____|', '       '],
            'H': [' _   _ ', '| | | |', '| |_| |', '|  _  |', '| | | |', '|_| |_|'],
            'I': [' ___ ', '|_ _|', ' | | ', ' | | ', '|___|', '     '],
            'J': ['     _ ', '    | |', ' _  | |', '| |_| |', ' \\___/ ', '       '],
            'K': [' _  __', '| |/ /', '| \' / ', '| . \\ ', '|_|\\_\\', '      '],
            'L': [' _     ', '| |    ', '| |    ', '| |___ ', '|_____|', '       '],
            'M': [' __  __ ', '|  \\/  |', '| |\\/| |', '| |  | |', '|_|  |_|', '        '],
            'N': [' _   _ ', '| \\ | |', '|  \\| |', '| |\\  |', '|_| \\_|', '       '],
            'O': ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ ', '       '],
            'P': [' ____  ', '|  _ \\ ', '| |_) |', '|  __/ ', '|_|    ', '       '],
            'Q': ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\__\\_\\', '       '],
            'R': [' ____  ', '|  _ \\ ', '| |_) |', '|  _ < ', '|_| \\_\\', '       '],
            'S': [' ____  ', '/ ___| ', '\\___ \\ ', ' ___) |', '|____/ ', '       '],
            'T': [' _____ ', '|_   _|', '  | |  ', '  | |  ', '  |_|  ', '       '],
            'U': [' _   _ ', '| | | |', '| | | |', '| |_| |', ' \\___/ ', '       '],
            'V': ['__     __', '\\ \\   / /', ' \\ \\ / / ', '  \\ V /  ', '   \\_/   ', '         '],
            'W': ['__        __', '\\ \\      / /', ' \\ \\ /\\ / / ', '  \\ V  V /  ', '   \\_/\\_/   ', '            '],
            'X': ['__  __', '\\ \\/ /', ' \\  / ', ' /  \\ ', '/_/\\_\\', '      '],
            'Y': ['__   __', '\\ \\ / /', ' \\ V / ', '  | |  ', '  |_|  ', '       '],
            'Z': [' _____', '|__  /', '  / / ', ' / /_ ', '/____|', '      '],
            ' ': ['   ', '   ', '   ', '   ', '   ', '   '],
            '!': [' _ ', '| |', '| |', '|_|', '(_)', '   '],
            '?': [' ___ ', '|__ \\', '  / /', ' |_| ', ' (_) ', '     '],
            '.': ['   ', '   ', '   ', ' _ ', '(_)', '   '],
            ',': ['   ', '   ', '   ', ' _ ', '( )', ' / '],
            '0': ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ ', '       '],
            '1': [' _ ', '/ |', '| |', '| |', '|_|', '   '],
            '2': [' ____  ', '|___ \\ ', '  __) |', ' / __/ ', '|_____|', '       '],
            '3': [' _____ ', '|___ / ', '  |_ \\ ', ' ___) |', '|____/ ', '       '],
            '4': [' _  _   ', '| || |  ', '| || |_ ', '|__   _|', '   |_|  ', '        '],
            '5': [' ____  ', '| ___| ', '|___ \\ ', ' ___) |', '|____/ ', '       '],
            '6': ['  __   ', ' / /_  ', '| \'_ \\ ', '| (_) |', ' \\___/ ', '       '],
            '7': [' _____ ', '|___  |', '   / / ', '  / /  ', ' /_/   ', '       '],
            '8': ['  ___  ', ' ( _ ) ', ' / _ \\ ', '| (_) |', ' \\___/ ', '       '],
            '9': ['  ___  ', ' / _ \\ ', '| (_) |', ' \\__, |', '   /_/ ', '       '],
          };
          
          const lines = ['', '', '', '', '', ''];
          const upperText = text.toUpperCase();
          
          for (const char of upperText) {
            const charArt = font[char] || font[' '];
            for (let i = 0; i < 6; i++) {
              lines[i] += charArt[i] || '   ';
            }
          }
          
          return lines.join('\n');
        },
        sl: () => `
                         (  ) (@@) ( )  (@)  ()    @@    O     @
                    (@@@)
                (    )
             (@@@@)
           (   )
        ====        ________                ___________
    _D _|  |_______/        \\__I_I_____===__|_________|
     |(_)---  |   H\\________/ |   |        =|___ ___|
     /     |  |   H  |  |     |   |         ||_| |_||
    |      |  |   H  |__--------------------| [___] |
    | ________|___H__/__|_____/[][]~\\_______|       |
    |/ |   |-----------I_____I [][] []  D   |=======|_
  __/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
   |/-=|___|=    ||    ||    ||    |_____/~\\___/
    \\_/      \\O=====O=====O=====O_/      \\_/`,
      };
      
      const outputFn = packageOutputs[cmd];
      if (outputFn) {
        setLines(prev => [...prev, { type: "output", content: outputFn() }]);
      } else {
        // Generic output for packages without specific handlers
        setLines(prev => [...prev, { type: "output", content: `${cmd} ${pkgInfo.version}\n${pkgInfo.description}\n\nRun '${cmd} --help' for usage information.` }]);
      }
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
