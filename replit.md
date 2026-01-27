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
6. **Weather** - Weather app with mock data for multiple cities (temperatures in Fahrenheit)
7. **Music Player** - Music player with playlist, controls, and playback simulation
8. **Snake** - Classic snake game with high score tracking
9. **Minesweeper** - Classic minesweeper game
10. **Terminal** - Command-line interface with common commands (help, ls, cat, neofetch, figlet, shutdown, etc.)
11. **Chat** - Real-time chat with profanity filtering and emoji support
12. **Updates** - Admin-only app for viewing system updates
13. **App Store** - Browse and install apps (admins can add custom apps)
14. **Bug Report** - Submit bugs (admins view, owner resolves)
15. **Tetris** - Classic Tetris game with high score tracking
16. **2048** - Number puzzle game
17. **Solitaire** - Classic card game
18. **Paint** - Drawing application with brush tools
19. **Camera** - Webcam capture (requires new tab for permissions)
20. **Email** - Email client (Username@nexusos.com format)
21. **Tic-Tac-Toe** - Two-player tic-tac-toe with score tracking
22. **Flappy Bird** - Classic flappy bird clone with high score
23. **Memory Match** - Card matching game with best score tracking
24. **Pong** - Classic Pong vs AI (first to 5 wins)
25. **Sudoku** - Number puzzle with hints and validation
26. **Chess** - Two-player chess with valid move highlighting
27. **Clock** - World clock with multiple timezones
28. **Stopwatch** - Stopwatch with lap times and best/worst lap indicators
29. **Timer** - Countdown timer with presets and alarm
30. **QR Code** - Generate QR codes for any text/URL
31. **Voice Recorder** - Record audio (requires new tab for permissions)
32. **GIF Maker** - Create animated GIFs frame-by-frame

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

### Bug Report System
Users can report bugs through the "Report Bug" system app on the desktop:
- `POST /api/bug-reports` - Authenticated users: submit a bug report (location, description)
- `GET /api/bug-reports` - Admin only: view all bug reports
- `PATCH /api/bug-reports/:id/resolve` - Owner only: mark bug report as resolved/reopened

The Bug Report app shows:
- All users: Form to submit bug reports with location and description
- Admins/Owner: Expandable section to view all bug reports with status badges
- Owner only: Resolve/Reopen buttons on each bug report

### IP Ban System
When a user is banned, their IP address is also blocked:
- User IPs are tracked via the `lastIp` field in the users table
- When banning a user, their last known IP is added to `banned_ips` table
- When unbanning, the IP is removed from the banned IPs list
- IP ban middleware blocks banned IPs from all API endpoints (returns 403)
- `GET /api/ip-ban-status` - Public endpoint to check if current IP is banned
- Banned IPs cannot access the system even without logging in
- Shows "Access Denied" screen with reason for IP bans

## Recent Changes
- Custom apps from App Store now open inside NexusOS as web apps (in browser window) instead of opening externally
- Added IP banning system - banned users' IPs are blocked even if they log out
- Added Bug Report system app on desktop for users to report bugs, admins to view, and owner to resolve
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
