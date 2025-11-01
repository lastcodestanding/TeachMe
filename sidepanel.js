// Side panel functionality
let profiles = [];
let currentTab = null;
let isGenerating = false;
let currentAbortController = null;

// DOM elements
let profileSelect, generateBtn, summaryContainer, statusIndicator;
let emptyState, pageInfo, pageTitle;
let copyBtn, newSummaryBtn;
let contextCard, contextContent, initialSummaryCard, initialSummaryContent, finalSummaryCard, finalSummaryContent;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    await loadProfiles();
    await getCurrentTab();
    setupEventListeners();
    updateUI();
});

// Initialize DOM elements
function initializeElements() {
    profileSelect = document.getElementById('profileSelect');
    generateBtn = document.getElementById('generateBtn');
    summaryContainer = document.getElementById('summaryContainer');
    statusIndicator = document.getElementById('statusIndicator');
    emptyState = document.getElementById('emptyState');
    pageInfo = document.getElementById('pageInfo');
    pageTitle = document.getElementById('pageTitle');
    copyBtn = document.getElementById('copyBtn');
    newSummaryBtn = document.getElementById('newSummaryBtn');
    contextCard = document.getElementById('contextCard');
    contextContent = document.getElementById('contextContent');
    initialSummaryCard = document.getElementById('initialSummaryCard');
    initialSummaryContent = document.getElementById('initialSummaryContent');
    finalSummaryCard = document.getElementById('finalSummaryCard');
    finalSummaryContent = document.getElementById('finalSummaryContent');
}

// Load profiles from storage
async function loadProfiles() {
    const result = await chrome.storage.local.get(['profiles']);
    profiles = result.profiles || [];
    populateProfileSelect();
}

// Get current active tab
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (currentTab) {
        pageTitle.textContent = currentTab.title;
        pageInfo.style.display = 'block';
    }
}

// Populate profile dropdown
function populateProfileSelect() {
    if (profiles.length === 0) {
        profileSelect.innerHTML = '<option value="">No profiles yet - Create one!</option>';
        profileSelect.disabled = true;
        generateBtn.disabled = true;
        return;
    }

    profileSelect.innerHTML = '<option value="">Choose a learning profile...</option>' +
        profiles.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    profileSelect.disabled = false;
}

// Setup event listeners
function setupEventListeners() {
    profileSelect.addEventListener('change', () => {
        generateBtn.disabled = !profileSelect.value || isGenerating;
        hideSummary();
    });

    generateBtn.addEventListener('click', handleGenerate);
    
    document.getElementById('openSettings').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    copyBtn.addEventListener('click', handleCopy);
    newSummaryBtn.addEventListener('click', handleNewSummary);

    // Listen for profile updates
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.profiles) {
            profiles = changes.profiles.newValue || [];
            const currentSelection = profileSelect.value;
            populateProfileSelect();
            if (profiles.find(p => p.id === currentSelection)) {
                profileSelect.value = currentSelection;
            }
        }
    });
}

// Handle generate button click
async function handleGenerate() {
    if (isGenerating || !profileSelect.value) return;

    const selectedProfile = profiles.find(p => p.id === profileSelect.value);
    if (!selectedProfile) {
        showStatus('Profile not found', 'error');
        return;
    }

    // Cancel any previous ongoing request
    if (currentAbortController) {
        console.log('Cancelling previous request...');
        currentAbortController.abort();
    }

    // Create new abort controller for this request
    currentAbortController = new AbortController();

    isGenerating = true;
    generateBtn.disabled = true;
    hideSummary();
    initialSummaryContent.innerHTML = '';
    finalSummaryContent.innerHTML = '';

    try {
        // Step 1: Extract page content
        showStatus('📄 Extracting page content...', 'processing');
        const pageContent = await extractPageContent();

        if (!pageContent || pageContent.trim().length === 0) {
            throw new Error('Unable to extract content from this page');
        }

        // Show the final summary card
        finalSummaryCard.style.display = 'block';
        summaryContainer.style.display = 'block';

        // Step 2: Generate context for summarizer using Prompt API
        showStatus('Preparing AI context...', 'processing');
        const summarizerContext = await generateSummarizerContext(selectedProfile, currentAbortController.signal);
        
        // Log context for debugging (hidden from user)
        if (summarizerContext) {
            console.log('Generated context:', summarizerContext);
        }
        
        // Step 3: Summarize with context (hidden from user)
        showStatus('Processing content...', 'processing');
        const summary = await summarizeContentStreaming(pageContent, summarizerContext, currentAbortController.signal);
        console.log('Summary generated, length:', summary.length);

        // Step 4: Format with learning profile and stream final output
        showStatus('Formatting with your learning style...', 'processing');
        await formatWithProfile(summary, selectedProfile, currentAbortController.signal);

        showStatus('Complete!', 'success');
        emptyState.style.display = 'none';
        
    } catch (error) {
        // Check if error is from abort
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
            console.log('Request cancelled by user');
            showStatus('Request cancelled', 'error');
        } else {
            console.error('Generation error:', error);
            showStatus(`Error: ${error.message}`, 'error');
            finalSummaryContent.innerHTML = `<p style="color: #e53e3e;">Failed to generate summary. ${error.message}</p>`;
            summaryContainer.style.display = 'block';
            finalSummaryCard.style.display = 'block';
        }
    } finally {
        isGenerating = false;
        generateBtn.disabled = !profileSelect.value;
        currentAbortController = null;
    }
}

// Extract content from the current page
async function extractPageContent() {
    try {
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                // Extract main content from the page
                const article = document.querySelector('article');
                const main = document.querySelector('main');
                const content = article || main || document.body;

                // Remove script, style, and nav elements
                const clone = content.cloneNode(true);
                clone.querySelectorAll('script, style, nav, header, footer, iframe, .ad, .advertisement').forEach(el => el.remove());

                // Get text content
                let text = clone.innerText || clone.textContent || '';
                
                // Clean up the text
                text = text.replace(/\s+/g, ' ').trim();
                
                // More conservative limit to prevent "input too large" errors
                // Prompt API has token limits (~4000-8000 tokens depending on model)
                const maxLength = 15000; // ~15k characters (roughly 3000-4000 tokens)
                if (text.length > maxLength) {
                    text = text.substring(0, maxLength);
                }

                return text;
            }
        });

        return result.result;
    } catch (error) {
        console.error('Content extraction error:', error);
        throw new Error('Unable to access page content. Try reloading the page.');
    }
}

// Generate context for Summarizer API using Prompt API
async function generateSummarizerContext(profile, signal) {
    try {
        const availability = await LanguageModel.availability({
            expectedOutputs: [{ type: 'text', languages: ['en'] }]
        });
        if (availability === 'no' || availability === 'unavailable') {
            return null; // Fall back to no context if unavailable
        }

        const session = await LanguageModel.create({ 
            signal,
            expectedOutputs: [{ type: 'text', languages: ['en'] }]
        });
        
        const contextPrompt = `Based on this learning style preference: "${profile.prompt}", generate a brief 1-2 sentence context instruction that would help a summarizer focus on the most important details for this learning style. Keep it concise and actionable.`;
        
        const context = await session.prompt(contextPrompt, { signal });
        session.destroy();
        
        return context.trim();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        console.error('Context generation error:', error);
        return null;
    }
}

// Summarize content using Chrome's Summarizer API with streaming
async function summarizeContentStreaming(text, context = null, signal = null) {
    // Check if the API is available
    if (typeof Summarizer === 'undefined') {
        throw new Error('Summarizer API not available');
    }

    try {
        const availability = await Summarizer.availability({
            outputLanguages: ['en']
        });
        if (availability === 'no' || availability === 'unavailable') {
            throw new Error('Summarizer not available on this device');
        }

        // Summarizer has its own limits, typically handles longer text better
        // But we should still be reasonable - limit to ~50k chars
        let textToSummarize = text;
        const summarizerMaxLength = 50000;
        if (text.length > summarizerMaxLength) {
            textToSummarize = text.substring(0, summarizerMaxLength);
            console.log(`Truncated text from ${text.length} to ${summarizerMaxLength} chars for summarizer`);
        }

        const options = {
            type: 'key-points',
            format: 'plain-text',
            length: 'medium',
            outputLanguages: ['en']
        };

        if (context) {
            options.sharedContext = context;
        }

        if (signal) {
            options.signal = signal;
        }

        const summarizer = await Summarizer.create(options);

        // Use streaming for immediate feedback
        const stream = summarizer.summarizeStreaming(textToSummarize);
        
        let fullSummary = '';
        let lastUpdate = Date.now();
        const updateInterval = 50; // Update every 50ms for smoother display
        let chunkCount = 0;
        
        for await (const chunk of stream) {
            // Check if aborted
            if (signal && signal.aborted) {
                summarizer.destroy();
                throw new DOMException('Aborted', 'AbortError');
            }
            
            chunkCount++;
            
            // Chunks are individual tokens - they include their own spacing
            // Just concatenate them directly
            fullSummary += chunk;
            
            // Log for debugging only - no UI update for intermediate summary
            if (chunkCount % 50 === 0) {
                console.log(`Summarizer progress: ${chunkCount} chunks, ${fullSummary.length} chars`);
            }
        }
        
        console.log('Summarizer complete:', fullSummary.length, 'chars');

        summarizer.destroy();

        return fullSummary;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        console.error('Summarization error:', error);
        throw error;
    }
}

// Format content with user's learning profile using Prompt API with streaming
async function formatWithProfile(content, profile, signal = null) {
    // Check if Prompt API is available
    if (typeof LanguageModel === 'undefined') {
        throw new Error('Prompt API not available. Please ensure you have Chrome 138+ with AI features enabled.');
    }

    try {
        const availability = await LanguageModel.availability({
            expectedOutputs: [{ type: 'text', languages: ['en'] }]
        });
        if (availability === 'no' || availability === 'unavailable') {
            throw new Error('Language model not available on this device');
        }

        const sessionOptions = {
            systemPrompt: `You are a helpful learning assistant. Your task is to take content and explain it according to the user's preferred learning style. Be clear, engaging, and follow the style instructions precisely.`,
            expectedOutputs: [{ type: 'text', languages: ['en'] }]
        };

        if (signal) {
            sessionOptions.signal = signal;
        }

        const session = await LanguageModel.create(sessionOptions);

        // Limit content length for Prompt API
        let contentToFormat = content;
        const promptMaxLength = 8000;
        if (content.length > promptMaxLength) {
            contentToFormat = content.substring(0, promptMaxLength);
            console.log(`Truncated content from ${content.length} to ${promptMaxLength} chars for prompt API`);
        }

        const prompt = `${profile.prompt}\n\nContent to explain:\n${contentToFormat}`;

        // Stream the response into final summary
        finalSummaryContent.innerHTML = '<span class="streaming-cursor"></span>';
        let fullText = '';
        let lastUpdate = Date.now();
        const updateInterval = 50;
        let chunkCount = 0;

        const stream = session.promptStreaming(prompt);
        
        try {
            for await (const chunk of stream) {
                // Check if aborted
                if (signal && signal.aborted) {
                    session.destroy();
                    throw new DOMException('Aborted', 'AbortError');
                }
                
                chunkCount++;
                
                // Chunks are individual tokens - they include their own spacing
                // Just concatenate them directly
                fullText += chunk;
                
                // Log occasionally for debugging
                if (chunkCount % 20 === 0) {
                    console.log(`Prompt API chunk ${chunkCount}, total length: ${fullText.length}`);
                }
                
                const now = Date.now();
                if (now - lastUpdate > updateInterval || chunkCount === 1) {
                    const formattedText = formatText(fullText);
                    finalSummaryContent.innerHTML = formattedText + '<span class="streaming-cursor"></span>';
                    finalSummaryContent.scrollTop = finalSummaryContent.scrollHeight;
                    lastUpdate = now;
                }
            }
        } catch (streamError) {
            if (streamError.name === 'AbortError') {
                throw streamError;
            }
            console.error('Streaming error:', streamError);
            // Fallback to non-streaming
            if (!fullText || fullText.trim().length === 0) {
                showStatus('⚠️ Streaming failed, using non-streaming mode...', 'processing');
                const promptOptions = signal ? { signal } : {};
                fullText = await session.prompt(prompt, promptOptions);
            }
        }

        // Final update without cursor
        finalSummaryContent.innerHTML = formatText(fullText);
        finalSummaryContent.scrollTop = finalSummaryContent.scrollHeight;
        
        console.log('Prompt API final text length:', fullText.length);

        session.destroy();

        if (!fullText || fullText.trim().length === 0) {
            throw new Error('No response generated. The AI model may be downloading or unavailable.');
        }

    } catch (error) {
        console.error('Formatting error:', error);
        throw new Error(`AI formatting failed: ${error.message}`);
    }
}

// Format text with basic markdown-like styling
function formatText(text) {
    if (!text || text.trim().length === 0) {
        return '<p>Generating...</p>';
    }

    // Escape HTML
    const div = document.createElement('div');
    div.textContent = text;
    let html = div.innerHTML;

    // Convert double newlines to paragraph breaks
    const paragraphs = html.split('\n\n');
    
    if (paragraphs.length > 1) {
        // Multiple paragraphs - format each one
        html = paragraphs
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    } else {
        // Single paragraph or text with single newlines - just replace newlines with breaks
        html = `<p>${html.replace(/\n/g, '<br>')}</p>`;
    }

    return html;
}

// Show summary container
function showSummary() {
    summaryContainer.classList.add('visible');
    emptyState.style.display = 'none';
}

// Hide summary container
function hideSummary() {
    summaryContainer.style.display = 'none';
    contextCard.style.display = 'none';
    initialSummaryCard.style.display = 'none';
    finalSummaryCard.style.display = 'none';
    emptyState.style.display = 'block';
}

// Show status message
function showStatus(message, type = 'processing') {
    statusIndicator.innerHTML = `
        <div class="status-indicator ${type}">
            ${type === 'processing' ? '<div class="spinner"></div>' : ''}
            <span>${message}</span>
        </div>
    `;
    statusIndicator.style.display = 'block';

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusIndicator.style.display = 'none';
        }, 3000);
    }
}

// Handle copy button
async function handleCopy() {
    try {
        // Copy the final summary (the formatted one)
        const text = finalSummaryContent.innerText;
        await navigator.clipboard.writeText(text);
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.disabled = true;
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Copy failed:', error);
        showStatus('Failed to copy', 'error');
    }
}

// Handle new lesson button
function handleNewSummary() {
    hideSummary();
    summaryContent.innerHTML = '';
    statusIndicator.style.display = 'none';
}

// Update UI based on current state
function updateUI() {
    generateBtn.disabled = !profileSelect.value || isGenerating;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
