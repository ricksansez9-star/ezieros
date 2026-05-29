// --- CONFIGURATION ---
const OS_TYPE = "POSTAL"; // Or "PrOSTAL"
const CURRENT_VERSION = "0.1.4"; // This should be updated with each release 

// FIX: If OS_TYPE is POSTAL, fetch the postal version file. 
// If it's PrOSTAL, fetch the prostal version file.
const VERSION_URL = OS_TYPE === "POSTAL" 
    ? "https://raw.githubusercontent.com/ricksansez9-star/ezierosdownloadpage/refs/heads/main/osfiles/postalversion.json"
    : "https://raw.githubusercontent.com/ricksansez9-star/ezierosdownloadpage/refs/heads/main/osfiles/prostalversion.json";

async function checkForUpdates() {
    // 1. Check if user permanently muted updates
    if (localStorage.getItem("update_pref") === "never") return;

    try {
        const response = await fetch(VERSION_URL);
        const data = await response.json();

        // 2. Compare versions
        if (data.version !== CURRENT_VERSION) {
            triggerUpdateUI(data.version);
        }
    } catch (error) {
        console.error("Update check failed:", error);
    }
}

function triggerUpdateUI(newVersion) {
    // 1. Create the modal & ask if the user wants to update or never ask this again.
    const modal = document.createElement('div');
    modal.id = "update-modal";
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Update Available: ${newVersion}</h3>
            <button id="update-yes">Yes</button>
            <button id="update-later">Remind me later</button>
            <button id="update-never">Don't ask me again</button>
        </div>
    `;
    document.body.appendChild(modal);

    // 2. Handle the button events
    document.getElementById('update-yes').onclick = () => window.open('https://ricksansez9-star.github.io/ezierosdownloadpage/mainpage.html#download', '_blank');
    document.getElementById('update-later').onclick = () => modal.remove();
    document.getElementById('update-never').onclick = () => {
        localStorage.setItem("update_pref", "never");
        modal.remove();
    };
}

// Run on boot
window.onload = checkForUpdates;           