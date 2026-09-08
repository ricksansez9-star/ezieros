// Central Debug State
const EZiER_DEBUG = {
    active: false,
    verboseLogging: true,

    toggle() {
        this.active = !this.active;

        const overlay = document.getElementById('ezier-debug-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !this.active);
        } else {
            console.warn("[EZiER Debug]: Could not find element with id 'ezier-debug-overlay'");
        }

        this.log(`Debug mode ${this.active ? 'ENABLED' : 'DISABLED'}`);
    },

    log(msg, type = 'info') {
        if (!this.verboseLogging) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[EZiER ${timestamp}] [${type.toUpperCase()}]:`, msg);

        // Push directly to an on-screen debug terminal component
        const consoleUI = document.getElementById('debug-console-output');
        if (consoleUI) {
            consoleUI.innerHTML += `<div>[${timestamp}] [${type}]: ${msg}</div>`;
            consoleUI.scrollTop = consoleUI.scrollHeight;
        }
    }
};

// Global Shortcut Listener
window.addEventListener('keydown', (e) => {
    // Check for Ctrl + Shift + D (handles uppercase or lowercase 'd')
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        EZiER_DEBUG.toggle();
    }
});