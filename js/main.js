document.addEventListener('DOMContentLoaded', () => {
    // Set dashboard as default
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('main-content-area').style.display = 'block';
    
    if (typeof showView === 'function') showView('view-dashboard');
    if (typeof renderChart === 'function') renderChart();

    const savedUser = localStorage.getItem('savedUsername');
    const savedPass = localStorage.getItem('savedPassword');
    if (savedUser && savedPass) {
        document.getElementById('auth-username').value = savedUser;
        document.getElementById('auth-password').value = savedPass;
        isLoginMode = true;
        
        console.log("Checking saved credentials...");
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'login', username: savedUser, password: savedPass })
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    if (typeof onAuthResponse === 'function') onAuthResponse(data);
                } else {
                    localStorage.removeItem('savedUsername');
                    localStorage.removeItem('savedPassword');
                }
            })
            .catch(e => console.error("Auto-login error:", e));
    }

    // Load chat font preference
    const savedChatFont = localStorage.getItem('chatFontSizeIndex');
    if (savedChatFont !== null) {
        if (typeof chatFontSizeIndex !== 'undefined') {
            chatFontSizeIndex = parseInt(savedChatFont);
            const chatContainer = document.getElementById('chat-history');
            if (chatContainer && typeof fontClasses !== 'undefined') {
                fontClasses.forEach(c => chatContainer.classList.remove(c));
                chatContainer.classList.add(fontClasses[chatFontSizeIndex]);
            }
        }
    }

    if (typeof initSettings === 'function') initSettings();
});

let courseDataLoaded = false;
window.ensureCourseDataLoaded = function() {
    if (courseDataLoaded) return;
    courseDataLoaded = true;
    
    // Create script for data
    const dataScript = document.createElement('script');
    dataScript.src = 'js/methodology-data.js';
    
    // Create script for UI logic that depends on data
    const uiScript = document.createElement('script');
    uiScript.src = 'js/methodology-ui.js';
    
    dataScript.onload = () => {
        document.body.appendChild(uiScript);
    };
    
    document.body.appendChild(dataScript);
};
