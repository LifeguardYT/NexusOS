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

## Role-Based Access Control

### Owner vs Admin
- **Owner**: The user whose ID matches `OWNER_USER_ID` environment variable. Has all admin privileges plus ability to grant/revoke admin to other users.
- **Admin**: Users with `isAdmin=true` in the database. Can access admin features but cannot manage other admins.

### Settings Sections by Role
- **Regular Users**: Appearance, Display, Sound, Network, Notifications, Accounts, About
- **Admins**: All above + Admin (user management, ban/unban), Developer (dev mode, diagnostics)
- **Owner**: All above + Owner (grant/revoke admin privileges by username or email)

### API Endpoints
- `GET /api/admin/status` - Returns `{ isAdmin, isOwner, userId }`
- `POST /api/admin/users/:userId/ban` - Admin only: ban/unban users
- `POST /api/owner/grant-admin` - Owner only: grant admin by username/email
- `POST /api/owner/users/:userId/admin` - Owner only: grant/revoke admin by user ID

### Global Shutdown System
Admin-only feature to shut down the OS for all non-admin users:
- `GET /api/shutdown/status` - Get current shutdown status
- `POST /api/shutdown` - Admin only: initiate 60-second shutdown countdown
- `POST /api/shutdown/stop` - Admin only: cancel shutdown and restore access

Terminal commands:
- `shutdown` - Admin only: broadcasts warning, shuts down OS after 60 seconds for non-admins
- `instashutdown` - Admin only: instant shutdown with no countdown
- `stopshutdown` - Admin only: cancels shutdown and restores access for all users

WebSocket endpoint `/ws` broadcasts real-time shutdown status to all connected clients.

### App Store Admin Features
Admins can add custom apps to the App Store that are visible to all users:
- `GET /api/custom-apps` - Get all custom apps
- `POST /api/custom-apps` - Admin only: add a new app (name, description, logoBase64, category, externalUrl)
- `DELETE /api/custom-apps/:id` - Admin only: remove a custom app

The "Add App" tab in the App Store is only visible to admins and allows uploading a logo, setting app name, description, category, and optional external URL.

## Recent Changes
- Added admin-only "Add App" feature in App Store with logo upload, name, description, category
- Added instashutdown command for instant global shutdown (no countdown)
- Added global shutdown system with real-time WebSocket updates and admin-only controls
- Weather app now displays temperatures in Fahrenheit
- Updated CoolMathGames app to use custom logo image
- Removed rating and download counts from App Store UI
- Added Owner-only tab in Settings with Crown icon for managing admin privileges
- Implemented owner/admin role separation: owner (from env) vs admins (isAdmin=true in DB)
- Added owner-only API endpoints for granting/revoking admin privileges
- Refactored admin status checking to support both owner and isAdmin users
- Added figlet command to Terminal for ASCII art generation
- Added user ban system with admin controls in Settings
- Made desktop right-click context menu functional
- Initial implementation of NexusOS with all core features
- 10 applications including browser, settings, games, and utilities
- Full window management system
- Responsive taskbar and start menu
