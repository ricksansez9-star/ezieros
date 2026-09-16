async function checkWebAvailability() {
    try {
        const response = await fetch('https://ricksansez9-star.github.io/AwkStudios/', { 
            mode: 'no-cors', 
            cache: 'no-store',
            signal: AbortSignal.timeout(2000) // 2-second timeout
        });
        return true;
    } catch (error) {
        // Triggers if offline, DNS fails, or it times out
        return false;
    }
}