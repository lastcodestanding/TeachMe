# 📚 TeachMe - Learning Assistant Chrome Extension

A beautiful, modern Chrome extension that transforms any webpage into a personalized learning experience using Chrome's built-in AI.

## 🌟 What Makes TeachMe Special?

- **On-Device AI**: Uses Chrome's built-in Gemini Nano - completely private, no API keys needed
- **Two-Stage Processing**: First condenses content, then personalizes it to your learning style
- **Real Streaming**: Watch summaries generate word-by-word in real-time
- **Infinitely Customizable**: Create unlimited profiles for different learning scenarios
- **Works Offline**: After initial setup, processes everything locally
- **Zero Cost**: No subscriptions, no API fees, completely free

## ✨ Key Features

- **Customizable Learning Profiles**: Create unlimited learning profiles with your preferred explanation styles
- **Dual-AI Pipeline**: Combines Chrome's Summarizer API (for condensing) and Prompt API (for formatting)
- **Real-Time Streaming**: Watch AI-generated summaries appear word-by-word in real-time
- **Modern Dark UI**: Sleek, minimalist interface with smooth animations and gradients
- **Smart Content Extraction**: Intelligently identifies and extracts main content from any webpage
- **Side Panel Integration**: Non-intrusive side panel that doesn't disrupt your browsing
- **Zero Configuration**: Works offline with on-device AI - no API keys needed

## 🚀 Installation

### System Requirements

- **Chrome Version**: 127 or later (Dev/Canary channels for latest features)
- **Operating System**: Windows, macOS, Linux, or ChromeOS
- **Storage**: ~1.5GB for Gemini Nano model download
- **RAM**: 8GB+ recommended for smooth AI processing
- **Internet**: Required only for initial model download

### Prerequisites

- Chrome 127 or later (for AI features)
- AI features enabled in Chrome (see below)

### Enable Chrome AI Features

1. Open Chrome and go to `chrome://flags`
2. Search for and enable these flags:
   - `#optimization-guide-on-device-model` - Downloads Gemini Nano model
   - `#prompt-api-for-gemini-nano` - Enables Prompt API for custom instructions
   - `#summarization-api-for-gemini-nano` - Enables Summarizer API
3. Restart Chrome
4. Wait for model download (can take a few minutes, happens automatically)
5. Verify APIs are ready in DevTools console:
   ```javascript
   await ai.languageModel.capabilities()  // Should show available
   await ai.summarizer.capabilities()     // Should show available
   ```

### Install the Extension

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" toggle in the top right
4. Click "Load unpacked"
5. Select the `teachMe` folder
6. The TeachMe icon should appear in your toolbar!

## 🎯 How to Use

### First Time Setup

1. Click the TeachMe extension icon (or right-click and select "Options")
2. You'll see three default profiles already created
3. Add your own custom learning profile:
   - **Profile Name**: Give it a descriptive name (e.g., "Explain Like I'm 10")
   - **Learning Style Prompt**: Describe exactly how you want content explained
4. Click "Add Profile" to save

### Generating Personalized Summaries

1. Navigate to any article or webpage you want to learn from
2. Click the TeachMe extension icon to open the side panel
3. Select a learning profile from the dropdown menu
4. Click "Generate Summary"
5. Watch the AI process in three stages:
   - **Extracting**: Pulls clean content from the page
   - **Processing**: Uses Summarizer API to condense the content
   - **Formatting**: Uses Prompt API to rewrite in your learning style with real-time streaming
6. Read your personalized summary!
7. Use "Copy" to save it or "New Summary" to try a different profile

### Managing Profiles

- **View All**: Open Settings to see all your profiles
- **Add New**: Fill in name and prompt, click "Add Profile"
- **Delete**: Click the 🗑️ icon next to any profile
- **Customize**: Create profiles for different purposes (quick reads, deep dives, casual learning, etc.)

## 🎨 Default Profiles

The extension comes with three pre-configured starter profiles on first install:

1. **Teach Me Like I'm 5**
   - Uses very simple language and fun analogies
   - Breaks down complex concepts into easy-to-grasp ideas
   - Perfect for completely new topics

2. **Quick 2-Sentence Summary**
   - Ultra-concise: just the main point and key takeaway
   - Direct and clear
   - Great for quick scanning

3. **Technical Deep Dive**
   - Detailed, technical explanation with terminology
   - Assumes advanced knowledge
   - Includes important technical details and concepts

You can use these as-is or as inspiration for creating your own!

## 🛠️ Technical Details

### How It Works

TeachMe uses a **two-stage AI pipeline** to create personalized learning summaries:

1. **Content Extraction** (content.js)
   - Identifies main content areas on the webpage
   - Removes navigation, ads, footers, and other noise
   - Extracts clean text up to 50,000 characters

2. **Summarization Stage** (Summarizer API)
   - Condenses long content into key points
   - Uses Chrome's on-device Gemini Nano model
   - Generates context-aware summaries optimized for your learning profile
   - Handles up to 50,000 characters of input

3. **Formatting Stage** (Prompt API)
   - Takes the condensed summary
   - Rewrites it according to your learning profile's instructions
   - Streams output word-by-word for immediate feedback
   - Handles up to 8,000 characters of input

### Project Structure

```text
teachMe/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker - handles installation, icon clicks
├── content.js            # Content extraction script (runs on all pages)
├── sidepanel.html        # Side panel UI (dark theme)
├── sidepanel.js          # Side panel logic - AI pipeline orchestration
├── settings.html         # Settings page UI
├── settings.js           # Settings page logic - profile management
├── styles.css            # Shared styles (dark theme, gradients)
├── package.json          # Project metadata
├── icons/                # Extension icons (16, 32, 48, 128 PNG)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Technologies Used

- **Chrome Extensions Manifest V3** - Modern extension architecture
- **Chrome Built-in AI**:
  - `Summarizer` API - For content condensation (Gemini Nano)
  - `LanguageModel` API - For profile-based formatting (Gemini Nano)
  - Both run on-device, no internet required after model download
- **Side Panel API** - Non-intrusive side panel UI
- **Chrome Storage API** - Local storage for profiles (no cloud sync)
- **Content Scripts** - For smart content extraction
- **Modern CSS** - Dark theme with gradients, animations, and smooth scrolling
- **Vanilla JavaScript** - No frameworks, pure ES6+

### AI API Usage Examples

#### Summarizer API (Stage 1)

```javascript
const summarizer = await Summarizer.create({
    type: 'key-points',
    format: 'plain-text',
    length: 'medium',
    outputLanguages: ['en'],
    sharedContext: 'Focus on practical examples...'  // Optional context
});

const stream = summarizer.summarizeStreaming(text);
for await (const chunk of stream) {
    // Process chunks as they arrive
}
```

#### Prompt API with Streaming (Stage 2)

```javascript
const session = await LanguageModel.create({
    systemPrompt: 'You are a helpful learning assistant...',
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
});

const stream = session.promptStreaming(prompt);
for await (const chunk of stream) {
    // Display chunk immediately - smooth streaming effect
}
```

## 🎨 Customization

### Creating Effective Learning Profiles

The power of TeachMe is in creating profiles that match **your** learning style. Here's how to write effective prompts:

**Good prompts are:**

- **Specific**: Define exactly how you want content explained
- **Context-aware**: Mention your knowledge level or audience
- **Structured**: Request specific formats (lists, analogies, examples, etc.)
- **Actionable**: Give clear instructions the AI can follow

### Profile Examples

**For Visual Learners:**

```text
Explain this content using vivid descriptions and analogies. 
Include concrete examples and metaphors that create mental images.
Break concepts into visual chunks I can picture in my mind.
```

**For Busy Professionals:**

```text
Provide a bullet-point summary with:
- Main idea (1 sentence)
- Key points (3-5 bullets)
- Action items or takeaways
Keep it scannable and actionable.
```

**For Students:**

```text
Explain this as if preparing for an exam. Include:
- Main concepts and definitions
- Important details to remember
- Potential test questions
Use clear, academic language.
```

**For Kids:**

```text
Explain this using very simple words and fun examples that a 10-year-old would understand.
Use everyday situations and make it interesting with stories or comparisons.
```

**For Technical Deep Dives:**

```text
Provide a detailed, technical explanation. Include terminology, underlying mechanisms,
and technical details. Assume advanced knowledge. Go deep, not broad.
```

## 🐛 Troubleshooting

### "Prompt API not available"

- Ensure you're using Chrome 127+
- Enable the required flags at `chrome://flags` (see installation)
- Restart Chrome completely
- Wait a few minutes for Gemini Nano model to download in background
- Check availability: Open DevTools console and run `await ai.languageModel.capabilities()`
- Some features may not be available in all regions yet

### "Unable to extract content"

- Try refreshing the page and waiting for it to fully load
- Some sites may block content extraction (SPAs, heavily protected content)
- Check browser console for errors
- Make sure the page has actual readable text content

### Extension not working

- Check that all files are in the correct directory
- Look for errors in the console (DevTools → Console)
- Try reloading the extension from `chrome://extensions` (click refresh icon)
- Check permissions are granted
- Ensure you clicked "Load unpacked" on the correct folder

### Icons not showing

- PNG icon files are already included in the `icons/` folder
- If they're missing, you can regenerate them from SVG (see below)
- Check that the icons folder is in the same directory as manifest.json

### Summaries taking too long

- First use may take longer as the AI model downloads
- Very long articles (>50k chars) are automatically truncated
- Complex profiles with many instructions may take longer to process
- Background processes or low memory can slow down on-device AI

### "Model is downloading" errors

- The Gemini Nano model downloads automatically after enabling flags
- This can take 5-15 minutes depending on connection speed
- Check download status: `chrome://components/` → Look for "Optimization Guide On Device Model"
- Click "Check for update" if status shows "0.0.0.0"

## 🚧 Future Enhancement Ideas

- Edit existing profiles (currently must delete and recreate)
- Export/import profiles to share with others
- Summary history and favorites
- Keyboard shortcuts for quick access
- Support for more languages beyond English
- Custom summary length controls
- Annotations and highlights on summaries
- Integration with note-taking apps
- Compare multiple profiles side-by-side

## � Pro Tips

- **Long articles**: The two-stage pipeline automatically handles long content efficiently
- **Quick reads**: Perfect for blog posts, news articles, and documentation
- **Experiment**: Try different profile prompts to discover what works best for you
- **Combine styles**: Create profiles that blend multiple learning approaches
- **Be specific**: The more detailed your profile prompt, the better the results
- **Context matters**: Some topics work better with certain learning styles
- **No internet needed**: After initial model download, everything runs on-device

## 🔒 Privacy & Security

- **100% Local**: All AI processing happens on your device using Chrome's built-in Gemini Nano
- **No Data Collection**: No analytics, no tracking, no external servers
- **No API Keys**: No need for OpenAI, Anthropic, or any other API keys
- **Offline Capable**: Works without internet after initial model download
- **Open Source**: All code is visible and auditable

## 📄 License

MIT License - feel free to use, modify, and share!

## 🤝 Contributing

This is a personal learning project, but suggestions and improvements are welcome! Feel free to fork and experiment.

---

Made with ❤️ for learners everywhere

*Teaching you the web, one profile at a time.*
