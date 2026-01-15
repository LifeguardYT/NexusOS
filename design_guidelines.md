# Desktop Operating System Design Guidelines

## Design Approach: Modern OS Aesthetic
Drawing inspiration from **Windows 11** and **macOS** design languages - clean, professional, and intuitive. Focus on clarity, spatial organization, and familiar OS patterns.

## Core Design Principles
- **Glass morphism effects** for system UI (taskbar, window controls, menus)
- **Layered depth** with subtle shadows to establish hierarchy
- **Consistent iconography** using Heroicons throughout
- **Spatial clarity** with distinct zones for desktop, windows, and system UI

## Typography System
**Font Family:** 'Inter' from Google Fonts
- **System UI:** 13px (text-sm) - menus, buttons, labels
- **Window Titles:** 14px medium weight
- **App Content:** 14-16px regular weight
- **Settings Headers:** 18px (text-lg) semibold
- **Large Headers:** 24px (text-2xl) bold

## Layout System
**Spacing Units:** Tailwind 1, 2, 3, 4, 6, 8 (focused on tight, OS-like spacing)

**Desktop Structure:**
- Full viewport (100vh/100vw) fixed layout
- Taskbar: 48px height, fixed bottom with backdrop-blur
- Window chrome: 32px title bar height
- Desktop icons: 80px grid spacing
- System tray: 280px width for notifications/quick settings

## Component Architecture

### Desktop Environment
- **Wallpaper Layer:** Full-bleed gradient or image background
- **Icon Grid:** 80x80px cells with 12px icon labels below
- **Right-click Context Menu:** 200px width, rounded-lg with subtle shadow

### Taskbar/Dock
- Centered app icons (40x40px) with active indicators
- Start menu button (left-aligned for Windows-style or centered for macOS-style)
- System tray (right): clock, wifi, volume, user profile icons
- Running app indicators: 3px accent line beneath icons

### Window Management
**Window Chrome:**
- Title bar: 32px height with traffic light controls (left) or min/max/close (right)
- Window controls: 12px circles/squares with 8px spacing
- Title: centered or left-aligned, text-sm medium weight
- Draggable title bar for repositioning

**Window Sizing:**
- Default app window: 800x600px
- Browser window: 1000x700px
- Settings: 900x650px
- Minimum window: 400x300px
- Maximize leaves 8px margin from screen edges

**Window Shadows:** Large, soft drop shadows (shadow-2xl) for depth

### Application Windows

**Settings App:**
- Two-column layout: 240px sidebar (navigation), remaining space for content
- Sidebar: icon + label navigation items, grouped by category
- Content area: max-width prose with form elements, toggles, sliders
- Search bar at top of sidebar

**Web Browser:**
- Address bar: 40px height with rounded-full input, bookmark icons
- Tab bar: 36px height, tabs 200px max-width with close buttons
- Navigation: back/forward/refresh (32px icon buttons)
- Iframe content area with URL validation display

**File Explorer:**
- Sidebar: 200px with folder tree navigation
- Main area: Grid view (120px items) or list view options
- Top toolbar: breadcrumb navigation, view switcher, search

**App Launcher/Start Menu:**
- 600x500px overlay panel
- Grid of apps: 100x100px tiles with icons and labels
- Search bar at top (full width)
- Categorized sections or alphabetical grid

### Games & Entertainment Apps
- Full window canvas rendering
- Minimal chrome (just window controls)
- Score/status displays in corners

## Interaction Patterns
- **Window dragging:** Cursor changes to grab, smooth follow
- **Window resizing:** 8px resize handles on all edges/corners
- **App launching:** Fade-in animation (200ms) from taskbar
- **Window switching:** Click to bring to front (z-index management)
- **Minimize:** Animate to taskbar icon position

## Icons
Use **Heroicons** (outline style) via CDN for all system icons:
- Settings gear, folder, document, image, music, video icons
- Browser navigation (arrow-left, arrow-right, refresh)
- Window controls (minimize: minus, maximize: arrows-expand, close: x)
- System tray (wifi, volume, battery, user-circle)

## Images
**Desktop Wallpaper:** Abstract gradient or geometric pattern as default. Place as fixed background layer at lowest z-index. Consider providing 2-3 wallpaper options in settings.

**App Icons:** Use distinct, colorful icon backgrounds (64x64px) for desktop and taskbar - these should be simple, recognizable symbols.

## Key UI Elements
**Buttons:** px-4 py-2, rounded-md, medium weight text
**Form Inputs:** px-3 py-2, rounded-md, border focus rings
**Toggles:** iOS-style switches (w-11 h-6)
**Dropdowns:** Floating menus with max-height scroll
**Notifications:** Toast-style (320px) slide from top-right

## Production Notes
- All windows draggable and resizable
- Maintain window stacking order (z-index array)
- Taskbar shows running apps with visual indicators
- Settings persist in localStorage
- Browser uses iframe with sandbox attributes for external sites
- Minimum 6-8 functional apps required
- Desktop icons trigger app launches
- Double-click to open, single-click to select pattern