// --- SETTINGS LOGIC ---

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const switchEl = document.getElementById('dark-mode-switch');
    if (switchEl) switchEl.checked = isDark;
}

function initSettings() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const switchEl = document.getElementById('dark-mode-switch');
        if (switchEl) switchEl.checked = true;
    }

    // Initialize font size select from global state or localStorage
    const savedChatFont = localStorage.getItem('chatFontSizeIndex');
    const fontSelect = document.getElementById('setting-chat-font');
    if (fontSelect && savedChatFont !== null) {
        fontSelect.value = savedChatFont;
    }
}

function updateChatFontSizeFromSetting(val) {
    if (typeof adjustChatFontSize === 'function') {
        const delta = parseInt(val) - chatFontSizeIndex;
        adjustChatFontSize(delta);
    }
}
