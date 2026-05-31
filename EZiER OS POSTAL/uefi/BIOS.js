// BIOS Boot Script
let bootTimer = null;
let countdownInterval = null;
let fPressed = false;
let biosOpen = false;

// Load performance optimization script
const perfScript = document.createElement('script');
perfScript.src = 'sys64/Performance.js';
document.head.appendChild(perfScript);

// Key tracking for F+1 combination
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'f') {
        fPressed = true;
    }

    // Check for 1 key while F is pressed
    if (key === '1' && fPressed) {
        e.preventDefault();
        openBIOS();
    }

    // ESC to exit BIOS
    if (e.key === 'Escape' && biosOpen) {
        closeBIOS();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'f') {
        fPressed = false;
    }
});

function openBIOS() {
    if (biosOpen) return; // Prevent re-triggering if already open
    biosOpen = true;
    
    const menu = document.getElementById('bios-menu');
    const container = document.getElementById('bios-container');
    
    if (menu) menu.style.display = 'block'; 
    if (container) container.style.display = 'none';

    // Stop all timers
    clearInterval(countdownInterval);
    clearTimeout(bootTimer);
}

function closeBIOS() {
    biosOpen = false;
    
    const menu = document.getElementById('bios-menu');
    const container = document.getElementById('bios-container');
    
    if (menu) menu.style.display = 'none';
    if (container) container.style.display = 'block';

    startBootTimer();
}

function bootDesktop() {
    // Standard BIOS practice: clear intervals before navigating
    clearInterval(countdownInterval);
    window.location.href = '../AwkLoader/loader.html';
}

function resetBIOS() {
    if (confirm('Reset BIOS to Factory Defaults?')) {
        localStorage.clear();
        location.reload();
    }
}

function startBootTimer() {
    // Clear any existing intervals first to prevent "speed-up" bugs
    clearInterval(countdownInterval);
    
    let timeRemaining = 3;
    const timerDisplay = document.getElementById('countdown-timer');
    
    if (timerDisplay) {
        timerDisplay.innerText = timeRemaining;
    }

    countdownInterval = setInterval(() => {
        timeRemaining--;
        
        if (timerDisplay) {
            timerDisplay.innerText = timeRemaining;
        }

        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            bootDesktop();
        }
    }, 1000);
}

// System info detection and initialization sequence
document.addEventListener('DOMContentLoaded', () => {
    const memoryDisplay = document.getElementById('total-memory');
    if (memoryDisplay) {
        // navigator.deviceMemory returns RAM in GB
        if (navigator.deviceMemory) {
            memoryDisplay.innerText = navigator.deviceMemory + ' GB';
        } else {
            memoryDisplay.innerText = '8 GB (Estimated)';
        }
    }
    
    // Check if biosskip.txt exists before running normal timer
    fetch('biosskip.txt', { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                // File exists, bypass everything and go straight to AwkLoader
                bootDesktop();
            } else {
                // File does not exist, start the normal countdown
                startBootTimer();
            }
        })
        .catch(() => {
            // If the fetch fails completely (e.g., offline/network issues), default back to normal boot
            startBootTimer();
        });
});

const kernelDisplay = document.getElementById('kernel-version');
if (kernelDisplay) {
    kernelDisplay.innerText = "1.0.0 AwkKernal";
}