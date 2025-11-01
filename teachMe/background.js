// Background service worker for TeachMe extension

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
    // Open the side panel for the current tab
    await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle installation
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Set up default profiles on first install
        const defaultProfiles = [
            {
                id: Date.now().toString(),
                name: 'Teach Me Like I\'m 5',
                prompt: 'Explain this content using very simple language and fun analogies that a 5-year-old child would understand. Break down complex concepts into easy-to-grasp ideas. Use everyday examples and keep it playful and engaging.',
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 1).toString(),
                name: 'Quick 2-Sentence Summary',
                prompt: 'Provide a concise 2-sentence summary of this content that captures the main point and key takeaway. Be direct and clear.',
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 2).toString(),
                name: 'Technical Deep Dive',
                prompt: 'Provide a detailed, technical explanation of this content. Include important terminology, concepts, and technical details. Assume the reader has advanced knowledge in the subject.',
                createdAt: new Date().toISOString()
            }
        ];

        await chrome.storage.local.set({ profiles: defaultProfiles });

        // Open the settings page to welcome the user
        chrome.runtime.openOptionsPage();
    }
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Placeholder for future message handling
    if (request.action === 'ping') {
        sendResponse({ status: 'pong' });
    }
    return true;
});
