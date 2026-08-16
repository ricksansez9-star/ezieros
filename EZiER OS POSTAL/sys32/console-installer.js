/* ═══════════════════════════════════════════════════════════════
 * console-installer.js
 * ───────────────────────────────────────────────────────────────
 * A terminal-style app for EZiER OS that installs apps packaged as
 * .ezstaller files (see ezstaller-format.js for the format itself).
 *
 * DROP-IN INTEGRATION
 * Place this file, console-installer.css, and ezstaller-format.js
 * next to your EZiER OS html file, then add near your other
 * <script src="..."> tags at the bottom of <body> (same place as
 * updatechecker.js / hinux/terminal.js):
 *
 *   <link rel="stylesheet" href="console-installer.css">   (in <head>)
 *   <script src="ezstaller-format.js"></script>
 *   <script src="console-installer.js"></script>
 *
 * That's it — no edits to the core EZiER OS file are required. This
 * script injects its own window, registers "Console Installer" as a
 * normal system app (shows up in the Start Menu, search, and
 * taskbar exactly like Settings or Task Manager), and non-destructively
 * wraps openSysWin()/closeWin() so its window behaves like the
 * other persistent system windows.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (typeof BUILT_IN_APPS === 'undefined') {
        console.error('[console-installer] EZiER OS globals not found — load this script after the main EZiER OS script.');
        return;
    }

    const WIN_ID = 'win-consoleinstaller';
    const APP_ID = 'consoleinstaller';
    const PROMPT = 'ezier@installer:~$';

    let history = [];
    let historyIndex = -1;
    let welcomed = false;

    // ───────────────────────────────────────────
    // Window markup + Start Menu registration
    // ───────────────────────────────────────────
    function injectWindow() {
        if (document.getElementById(WIN_ID)) return;
        document.body.insertAdjacentHTML('beforeend', `
            <div id="${WIN_ID}" class="window ci-window" style="width:560px;height:420px;" onmousedown="focusWin(this)">
                <div class="title-bar" onmousedown="dragWin(this)">
                    <span>\u{1F5A5}\uFE0F Console Installer</span>
                    <div>
                        <span class="win-btn" onclick="minimizeWin('${WIN_ID}')">[MINIMIZE]</span>
                        <span class="win-btn" onclick="maximizeWin('${WIN_ID}')">[FULLSCREEN]</span>
                        <span class="win-btn" onclick="closeWin('${WIN_ID}')">[CLOSE]</span>
                    </div>
                </div>
                <div id="ci-screen" class="ci-screen">
                    <div id="ci-output" class="ci-output"></div>
                    <div class="ci-input-row">
                        <span class="ci-prompt">${PROMPT}</span>
                        <input type="text" id="ci-input" class="ci-input" autocomplete="off" spellcheck="false" autocapitalize="off">
                    </div>
                </div>
                <div id="ci-dropzone" class="ci-dropzone">Drop a .ezstaller file to install</div>
                <input type="file" id="ci-file-input" accept=".ezstaller" style="display:none;">
            </div>`);
    }

    function registerApp() {
        if (BUILT_IN_APPS.some(a => a.id === APP_ID)) return;
        BUILT_IN_APPS.push({
            id: APP_ID,
            name: 'Console Installer',
            icon: 'https://img.icons8.com/color/48/console.png',
            isSys: true,
            sysId: WIN_ID
        });
        if (typeof renderOS === 'function') renderOS();
    }

    // ───────────────────────────────────────────
    // Make the window persistent (hide, don't destroy)
    // — the same lifecycle Settings / Task Manager / App
    // Installer already use, applied non-destructively.
    // ───────────────────────────────────────────
    function patchWindowLifecycle() {
        const originalClose = window.closeWin;
        window.closeWin = function (id) {
            if (id !== WIN_ID) return originalClose && originalClose(id);
            const win = document.getElementById(id);
            if (!win) return;
            win.classList.add('closing');
            setTimeout(() => {
                win.style.display = 'none';
                win.classList.remove('closing');
                if (typeof updateTM === 'function') updateTM();
                if (typeof updateRunningArea === 'function') updateRunningArea();
            }, 250);
        };

        const originalOpen = window.openSysWin;
        window.openSysWin = function (id) {
            if (typeof originalOpen === 'function') originalOpen(id);
            if (id === WIN_ID) {
                if (!welcomed) { printWelcome(); welcomed = true; }
                setTimeout(focusInput, 50);
            }
        };
    }

    // ───────────────────────────────────────────
    // Output helpers
    // ───────────────────────────────────────────
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function printLine(text, type) {
        const out = document.getElementById('ci-output');
        if (!out) return;
        const line = document.createElement('div');
        line.className = 'ci-line ci-' + (type || 'plain');
        line.innerHTML = escapeHtml(text);
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
    }

    function printWelcome() {
        printLine('EZiER OS Console Installer v1.0.0', 'heading');
        printLine("Type 'help' for a list of commands, or drop a .ezstaller file onto this window.", 'dim');
        printLine('', 'plain');
    }

    function focusInput() {
        const input = document.getElementById('ci-input');
        if (input) input.focus();
    }

    function getApps() {
        return typeof getAllApps === 'function' ? getAllApps() : [];
    }

    // ───────────────────────────────────────────
    // Commands
    // ───────────────────────────────────────────
    const COMMANDS = {
        help() {
            printLine('Available commands:', 'heading');
            [
                ['help', 'Show this help message'],
                ['list, ls', 'List all installed applications'],
                ['info <id>', 'Show details about an installed application'],
                ['install', 'Open the file picker and install a .ezstaller package'],
                ['uninstall <id>', 'Remove a custom or .ezstaller-installed app'],
                ['whoami', 'Show the signed-in account'],
                ['about', 'About Console Installer'],
                ['clear, cls', 'Clear the screen'],
                ['exit, close', 'Close this window']
            ].forEach(([cmd, desc]) => printLine('  ' + cmd.padEnd(18) + desc, 'plain'));
            printLine('', 'plain');
            printLine('Tip: you can also drag and drop a .ezstaller file anywhere on this window.', 'dim');
        },

        list() {
            const apps = getApps();
            if (!apps.length) { printLine('No applications installed.', 'dim'); return; }
            printLine(`${apps.length} application(s):`, 'heading');
            apps.forEach(app => {
                const tag = app.isSys ? '[SYSTEM]' : app.ezstaller ? '[EZSTALLER]' : app.custom ? '[CUSTOM]' : '[BUILTIN]';
                printLine(`  ${tag.padEnd(11)} ${String(app.id).padEnd(16)} ${app.name}`, 'plain');
            });
        },

        info(args) {
            const id = args[0];
            if (!id) { printLine('Usage: info <id>', 'error'); return; }
            const app = getApps().find(a => a.id === id);
            if (!app) { printLine(`No application found with id "${id}". Run 'list' to see installed apps.`, 'error'); return; }
            printLine(app.name, 'heading');
            printLine(`  id:          ${app.id}`, 'plain');
            printLine(`  type:        ${app.isSys ? 'system' : app.ezstaller ? 'ezstaller package' : app.custom ? 'custom' : 'built-in'}`, 'plain');
            if (app.version) printLine(`  version:     ${app.version}`, 'plain');
            if (app.author) printLine(`  author:      ${app.author}`, 'plain');
            if (app.description) printLine(`  description: ${app.description}`, 'plain');
            if (app.file) printLine(`  source:      ${app.file.startsWith('blob:') ? '(local package)' : app.file}`, 'plain');
        },

        install() {
            const input = document.getElementById('ci-file-input');
            if (!input) { printLine('File picker is unavailable.', 'error'); return; }
            input.value = '';
            input.click();
        },

        uninstall(args) {
            const id = args[0];
            if (!id) { printLine('Usage: uninstall <id>', 'error'); return; }
            const customApps = typeof getCustomApps === 'function' ? getCustomApps() : [];
            const app = customApps.find(a => a.id === id);
            if (!app) {
                const builtIn = getApps().find(a => a.id === id);
                if (builtIn) printLine(`"${id}" is a built-in EZiER OS app and cannot be uninstalled.`, 'error');
                else printLine(`No application found with id "${id}".`, 'error');
                return;
            }
            if (typeof removeCustomApp === 'function') removeCustomApp(id);
            printLine(`Removed "${app.name}" (${id}).`, 'success');
        },

        whoami() {
            const account = typeof getAccount === 'function' ? getAccount() : null;
            if (!account) { printLine('Not signed in.', 'dim'); return; }
            printLine(`${account.name} (@${account.username})`, 'plain');
        },

        about() {
            printLine('EZiER OS Console Installer', 'heading');
            printLine('v1.0.0 — installs apps packaged as .ezstaller files.', 'plain');
            printLine('Part of EZiER OS.', 'dim');
        },

        clear() {
            const out = document.getElementById('ci-output');
            if (out) out.innerHTML = '';
        },

        exit() {
            if (typeof closeWin === 'function') closeWin(WIN_ID);
        }
    };
    COMMANDS.ls = COMMANDS.list;
    COMMANDS.cls = COMMANDS.clear;
    COMMANDS.close = COMMANDS.exit;
    COMMANDS.remove = COMMANDS.uninstall;

    async function runCommand(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return;
        const [cmd, ...args] = trimmed.split(/\s+/);
        const handler = COMMANDS[cmd.toLowerCase()];
        if (!handler) {
            printLine(`Command not found: ${cmd}. Type 'help' for a list of commands.`, 'error');
            return;
        }
        await handler(args);
    }

    // ───────────────────────────────────────────
    // Install pipeline (shared by `install` and drag/drop)
    // ───────────────────────────────────────────
    async function runInstall(file) {
        try {
            const app = await Ezstaller.installApp(file, msg => printLine(msg, 'dim'));
            printLine(`\u2714 "${app.name}" installed successfully. (id: ${app.id})`, 'success');
            printLine('Find it in the Start Menu, or run: list', 'dim');
        } catch (err) {
            printLine(`\u2718 Install failed: ${err && err.message ? err.message : err}`, 'error');
        }
    }

    // ───────────────────────────────────────────
    // Input wiring
    // ───────────────────────────────────────────
    function handleSubmit() {
        const input = document.getElementById('ci-input');
        if (!input) return;
        const value = input.value;
        printLine(`${PROMPT} ${value}`, 'echo');
        input.value = '';
        if (value.trim()) {
            history.push(value);
            historyIndex = history.length;
        }
        runCommand(value);
    }

    function wireInput() {
        const input = document.getElementById('ci-input');
        if (!input) return;
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    input.value = history[historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < history.length) {
                    historyIndex++;
                    input.value = history[historyIndex] || '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const partial = input.value.trim().toLowerCase();
                if (partial) {
                    const match = Object.keys(COMMANDS).find(c => c.startsWith(partial));
                    if (match) input.value = match;
                }
            }
        });
    }

    function wireFileInput() {
        const fileInput = document.getElementById('ci-file-input');
        if (!fileInput) return;
        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            printLine(`${PROMPT} install   (selected ${file.name})`, 'echo');
            runInstall(file);
        });
    }

    function wireDragAndDrop() {
        const win = document.getElementById(WIN_ID);
        if (!win) return;
        ['dragenter', 'dragover'].forEach(evt => win.addEventListener(evt, e => {
            e.preventDefault();
            win.classList.add('ci-dragover');
        }));
        ['dragleave', 'dragend'].forEach(evt => win.addEventListener(evt, () => win.classList.remove('ci-dragover')));
        win.addEventListener('drop', e => {
            e.preventDefault();
            win.classList.remove('ci-dragover');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith('.ezstaller')) {
                printLine(`"${file.name}" is not a .ezstaller file.`, 'error');
                return;
            }
            printLine(`${PROMPT} install   (dropped ${file.name})`, 'echo');
            runInstall(file);
        });
    }

    function wireFocusOnClick() {
        const screen = document.getElementById('ci-screen');
        if (!screen) return;
        screen.addEventListener('mousedown', e => {
            if (e.target.id !== 'ci-input') setTimeout(focusInput, 0);
        });
    }

    // ───────────────────────────────────────────
    // Boot
    // ───────────────────────────────────────────
    injectWindow();
    registerApp();
    patchWindowLifecycle();
    wireInput();
    wireFileInput();
    wireDragAndDrop();
    wireFocusOnClick();
})();
