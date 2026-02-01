# NexusOS Desktop

Run NexusOS as a desktop application on your computer!

---

## How to Install & Run

### Step 1: Install Node.js

If you don't have Node.js installed:

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the big green button)
3. Run the installer and follow the steps (just click Next/Continue)

---

### Step 2: Extract This Folder

Make sure you've extracted this ZIP file to a folder on your computer.
Don't try to run it from inside the ZIP!

---

### Step 3: Open a Terminal/Command Prompt

**On Windows:**
1. Open the extracted "NexusOS-Desktop" folder
2. Click on the address bar at the top (where it shows the folder path)
3. Type `cmd` and press Enter
4. A black command window will open

**On Mac:**
1. Open the "Terminal" app (search for it in Spotlight)
2. Type `cd ` (with a space after it)
3. Drag the extracted folder into the Terminal window
4. Press Enter

**On Linux:**
1. Right-click inside the folder
2. Click "Open Terminal Here"

---

### Step 4: Install Dependencies

In the terminal, type this command and press Enter:

```
npm install
```

Wait for it to finish. This downloads everything the app needs.
(It might take a minute or two)

---

### Step 5: Run NexusOS

Type this command and press Enter:

```
npm start
```

**NexusOS will open in its own window!**

---

## Troubleshooting

**"npm is not recognized" or "command not found"**
- You need to install Node.js first (see Step 1)
- After installing, close and reopen the terminal

**The window is blank/white**
- Check your internet connection
- NexusOS needs internet to work

**It says "Cannot find module"**
- Run `npm install` again

---

## Tips

- To run NexusOS again later, just open a terminal in this folder and type `npm start`
- The app connects to https://nexusos.live

---

Enjoy NexusOS Desktop!
