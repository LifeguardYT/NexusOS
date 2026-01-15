# NexusOS - Web-Based Operating System

## Overview
A fully functional web-based operating system simulation built with React and TypeScript. Features a complete desktop environment with window management, taskbar, start menu, and multiple applications.

## Features
- **Desktop Environment**: Full desktop with customizable wallpapers, desktop icons, and context menus
- **Window Management**: Draggable, resizable windows with minimize/maximize/close controls
- **Taskbar**: Shows running applications with active indicators, system tray with clock/wifi/volume
- **Start Menu**: App launcher with search functionality

### Applications
1. **Browser** - Web browser with tabs, navigation, and iframe-based browsing (YouTube, Google, etc.)
2. **Settings** - Full settings app with theme, wallpaper, display, sound, network, and notifications
3. **File Explorer** - Navigate virtual file system with grid/list view
4. **Calculator** - Fully functional calculator with standard operations
5. **Notes** - Create, edit, and delete notes with search
6. **Weather** - Weather app with mock data for multiple cities
7. **Music Player** - Music player with playlist, controls, and playback simulation
8. **Snake** - Classic snake game with high score tracking
9. **Minesweeper** - Classic minesweeper game
10. **Terminal** - Command-line interface with common commands (help, ls, cat, neofetch, etc.)

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **State Management**: React Context API
- **Persistence**: localStorage for client-side, in-memory storage for backend

## Project Structure
```
client/src/
├── components/
│   ├── apps/           # Individual application components
│   │   ├── BrowserApp.tsx
│   │   ├── SettingsApp.tsx
│   │   ├── CalculatorApp.tsx
│   │   ├── NotesApp.tsx
│   │   ├── FilesApp.tsx
│   │   ├── WeatherApp.tsx
│   │   ├── MusicApp.tsx
│   │   ├── SnakeGame.tsx
│   │   ├── MinesweeperGame.tsx
│   │   └── TerminalApp.tsx
│   ├── os/             # OS environment components
│   │   ├── Desktop.tsx
│   │   ├── Window.tsx
│   │   ├── Taskbar.tsx
│   │   ├── StartMenu.tsx
│   │   ├── DesktopIcons.tsx
│   │   └── ContextMenu.tsx
│   └── ui/             # Shadcn UI components
├── lib/
│   └── os-context.tsx  # Global OS state management
shared/
└── schema.ts           # Type definitions and schemas
server/
├── routes.ts           # API endpoints
└── storage.ts          # Data persistence layer
```

## API Endpoints
- `GET /api/settings` - Retrieve user settings
- `PATCH /api/settings` - Update user settings

## User Preferences
- Dark theme by default
- Settings persist in localStorage
- Window positions and sizes are managed in memory during session

## Recent Changes
- Initial implementation of NexusOS with all core features
- 10 applications including browser, settings, games, and utilities
- Full window management system
- Responsive taskbar and start menu
