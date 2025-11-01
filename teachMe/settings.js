// Settings page functionality
let profiles = [];

// Load profiles on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfiles();
    renderProfiles();
    setupEventListeners();
});

// Load profiles from Chrome storage
async function loadProfiles() {
    const result = await chrome.storage.local.get(['profiles']);
    profiles = result.profiles || [];
}

// Save profiles to Chrome storage
async function saveProfiles() {
    await chrome.storage.local.set({ profiles });
}

// Setup event listeners
function setupEventListeners() {
    const addBtn = document.getElementById('addProfileBtn');
    addBtn.addEventListener('click', handleAddProfile);

    // Allow Enter key in name field to submit
    document.getElementById('profileName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddProfile();
        }
    });
}

// Handle adding a new profile
async function handleAddProfile() {
    const nameInput = document.getElementById('profileName');
    const promptInput = document.getElementById('profilePrompt');

    const name = nameInput.value.trim();
    const prompt = promptInput.value.trim();

    // Validation
    if (!name) {
        showToast('Please enter a profile name', 'error');
        nameInput.focus();
        return;
    }

    if (!prompt) {
        showToast('Please enter a learning style instruction', 'error');
        promptInput.focus();
        return;
    }

    // Check for duplicate names
    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showToast('A profile with this name already exists', 'error');
        nameInput.focus();
        return;
    }

    // Add new profile
    const newProfile = {
        id: Date.now().toString(),
        name,
        prompt,
        createdAt: new Date().toISOString()
    };

    profiles.push(newProfile);
    await saveProfiles();

    // Clear form
    nameInput.value = '';
    promptInput.value = '';
    nameInput.focus();

    // Update UI
    renderProfiles();
    showToast('Profile added successfully! ✨', 'success');
}

// Handle deleting a profile
async function handleDeleteProfile(profileId) {
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) return;

    if (confirm(`Are you sure you want to delete "${profile.name}"?`)) {
        profiles = profiles.filter(p => p.id !== profileId);
        await saveProfiles();
        renderProfiles();
        showToast('Profile deleted', 'success');
    }
}

// Render all profiles
function renderProfiles() {
    const container = document.getElementById('profilesList');

    if (profiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎓</div>
                <div class="empty-state-text">No learning profiles yet. Create your first one above!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = profiles.map(profile => `
        <div class="profile-item" data-id="${profile.id}">
            <div class="profile-header">
                <h3 class="profile-name">${escapeHtml(profile.name)}</h3>
                <div class="profile-actions">
                    <button class="btn-icon btn-delete" data-id="${profile.id}" title="Delete profile">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="profile-prompt">${escapeHtml(profile.prompt)}</div>
        </div>
    `).join('');

    // Add delete event listeners
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profileId = e.currentTarget.getAttribute('data-id');
            handleDeleteProfile(profileId);
        });
    });
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.4s ease reverse';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
