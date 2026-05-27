# DEAR AWK OS 2 APP MAKER - Complete Developer Guide

## How to Get a Window ID

To get Window IDs for existing windows:

1. **Open Task Manager** from the desktop
2. Click the **"Open Windows"** tab (NEW!)
3. You'll see all open windows listed with their **Window IDs**
4. Click **"📋 Copy ID"** to copy the Window ID to clipboard
5. Use the copied ID in your app with the AwkOSFrame API

**Example:**
```javascript
// Copy-paste a Window ID from Task Manager
const myWindowId = 'win-performance';

// Now control it
window.parent.AwkOSFrame.close(myWindowId);
window.parent.AwkOSFrame.maximize(myWindowId);
window.parent.AwkOSFrame.setContent(myWindowId, '<h2>Updated!</h2>');
```

---

## How to Use Window API in Your Custom Apps

Want to create multi-window applications? Use the **AwkOSFrame API**!

### Open a New Window

```javascript
// Open window with HTML content
const windowId = window.parent.AwkOSFrame.open({
    title: 'My Window',
    content: '<h1>Hello from custom app!</h1>',
    width: 600,
    height: 400,
    top: 100,
    left: 100
});

// Open window with URL/iframe
const windowId = window.parent.AwkOSFrame.open({
    title: 'External Site',
    url: 'https://example.com',
    width: 800,
    height: 600
});
```

### Control Windows

Once you have a Window ID, you can control it:

```javascript
// Close window
window.parent.AwkOSFrame.close(windowId);

// Maximize/restore window
window.parent.AwkOSFrame.maximize(windowId);

// Minimize window
window.parent.AwkOSFrame.minimize(windowId);

// Restore minimized window
window.parent.AwkOSFrame.restore(windowId);

// Bring window to front
window.parent.AwkOSFrame.focus(windowId);

// Update window content dynamically
window.parent.AwkOSFrame.setContent(windowId, '<p>New content here</p>');
```

## Available Methods

| Method | Description |
|--------|-------------|
| `open(options)` | Create new window with title, content/url, width, height, position |
| `close(winId)` | Close window by ID |
| `maximize(winId)` | Toggle maximize state |
| `minimize(winId)` | Hide window |
| `restore(winId)` | Show window |
| `focus(winId)` | Bring window to front |
| `setContent(winId, html)` | Update window content dynamically |

## Tips for App Developers

- Always use `window.parent.AwkOSFrame` (not just `window.AwkOSFrame`) because your app runs in an iframe
- Store Window IDs in variables for later use
- Dynamically generate Window IDs using `Date.now()` to avoid collisions
- Use the Task Manager to debug and find window IDs of running applications

---

## Storage Quota Error Fix

If you get: `QuotaExceededError: Failed to execute 'setItem' on 'Storage'`

**Solutions:**

1. **Remove unused custom apps:**
   - Open Settings app
   - Find "Manage Apps" section
   - Click "Remove" on apps you no longer need

2. **Factory Reset:**
   - Click "Factory Reset OS" button in Settings
   - This will clear ALL custom apps and free up storage

3. **Check storage usage:**
   - Each custom app takes up storage space
   - Avoid adding very large apps
   - Use external URLs instead of local files when possible

**Why this happens:**
- Browser localStorage has a limited quota (usually 5-10MB)
- Each custom app with data takes up storage
- When quota is exceeded, new apps cannot be installed

---

## Remaining Features




Want to do more with your app for example, open a new window?



Well you can with this example.



// Open window with HTML content

window.parent.AwkOSFrame.open({

&nbsp;   title: 'My Window',

&nbsp;   content: '<h1>Hello from custom app!</h1>',

&nbsp;   width: 600,

&nbsp;   height: 400

});



// Open window with URL/iframe

window.parent.AwkOSFrame.open({

&nbsp;   title: 'External Site',

&nbsp;   url: 'https://example.com',

&nbsp;   width: 800,

&nbsp;   height: 600

});



// Control windows

window.parent.AwkOSFrame.close(windowId);

window.parent.AwkOSFrame.maximize(windowId);

window.parent.AwkOSFrame.minimize(windowId);

window.parent.AwkOSFrame.restore(windowId);

window.parent.AwkOSFrame.focus(windowId);

window.parent.AwkOSFrame.setContent(windowId, '<p>New content</p>');







AVAILABLE METHODS:



open(options) - Create new window with title, content/url, width, height, position

close(winId) - Close window by ID

maximize(winId) - Toggle maximize

minimize(winId) - Hide window

restore(winId) - Show window

focus(winId) - Bring window to front

setContent(winId, html) - Update window content dynamically

