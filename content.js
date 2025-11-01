// Content script for TeachMe extension
// This script runs on all web pages and helps extract content

// Helper function to extract clean text from the page
function extractPageContent() {
    // Try to find the main content area
    const selectors = [
        'article',
        'main',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#content',
        '.content'
    ];

    let contentElement = null;

    // Try each selector
    for (const selector of selectors) {
        contentElement = document.querySelector(selector);
        if (contentElement) break;
    }

    // Fallback to body if no specific content area found
    if (!contentElement) {
        contentElement = document.body;
    }

    // Clone the element to avoid modifying the actual page
    const clone = contentElement.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        'iframe',
        'noscript',
        '.ad',
        '.ads',
        '.advertisement',
        '.social-share',
        '.comments',
        '.sidebar',
        '[role="navigation"]',
        '[role="banner"]',
        '[role="contentinfo"]',
        '[role="complementary"]'
    ];

    unwantedSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Get text content
    let text = clone.innerText || clone.textContent || '';

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Remove common footer/header patterns
    text = text.replace(/Cookie Policy.*?$/i, '');
    text = text.replace(/Privacy Policy.*?$/i, '');

    return text;
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        try {
            const content = extractPageContent();
            sendResponse({ success: true, content });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep the message channel open for async response
});

// Add a subtle indicator when the extension is active (optional)
console.log('📚 TeachMe Learning Assistant is ready!');
