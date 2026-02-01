# NexusOS Desktop

A desktop application wrapper for NexusOS.

## Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

## Quick Start

1. Extract this folder to your computer
2. Open a terminal/command prompt in this folder
3. Run these commands:

```bash
npm install
npm start
```

NexusOS will open as a desktop application!

## Building Installers

To create installable versions:

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

Built files will be in the `dist` folder.

## Customization

Edit `main.js` to change the NexusOS URL if needed (line 5).

## Features

- Native desktop window
- System tray integration
- All NexusOS features work the same
- Automatic updates (when connected to internet)

## Troubleshooting

**"npm is not recognized"**
- Install Node.js from https://nodejs.org/

**Window is blank**
- Check your internet connection
- The app requires internet to load NexusOS

**Permission errors on Linux**
- Run: `chmod +x NexusOS-*.AppImage`

## License

MIT License
