// --- AUTHENTICATION LOGIC ---
let currentUser = null;
let currentUserId = null;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? t('auth_title_login') : t('auth_btn_register');
    document.getElementById('auth-btn').innerText = isLoginMode ? t('auth_btn_login') : t('auth_btn_register');
    document.getElementById('auth-toggle').innerText = isLoginMode ? t('auth_toggle_register') : t('auth_toggle_login');
    document.getElementById('auth-msg').innerText = '';
}

function openLogin() {
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-msg').innerText = '';
    
    // Make sure texts reflect current language state correctly
    document.getElementById('auth-title').innerText = isLoginMode ? t('auth_title_login') : t('auth_btn_register');
    document.getElementById('auth-btn').innerText = isLoginMode ? t('auth_btn_login') : t('auth_btn_register');
    document.getElementById('auth-toggle').innerText = isLoginMode ? t('auth_toggle_register') : t('auth_toggle_login');

    document.getElementById('view-login').style.display = 'flex';
}

function closeLogin() {
    document.getElementById('view-login').style.display = 'none';
}

function handleAuth() {
    const user = document.getElementById('auth-username').value.trim();
    const pass = document.getElementById('auth-password').value.trim();
    const msgBox = document.getElementById('auth-msg');

    if (!user || !pass) {
        msgBox.innerText = t('auth_err_fields');
        return;
    }

    msgBox.innerText = t('auth_wait');
    const action = isLoginMode ? 'login' : 'register';

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: action, username: user, password: pass, lang: currentLang })
    })
        .then(response => response.json())
        .then(data => onAuthResponse(data))
        .catch(error => {
            console.error("Fetch Error:", error);
            msgBox.innerText = t('auth_err_server');
        });
}

function onAuthResponse(res) {
    if (res && res.success) {
        currentUser = res.username;
        currentUserId = res.id;

        // Save to auto-login
        localStorage.setItem('savedUsername', document.getElementById('auth-username').value.trim());
        localStorage.setItem('savedPassword', document.getElementById('auth-password').value.trim());

        document.getElementById('view-login').style.display = 'none';
        
        // Use a function to update UI names to ensure consistency
        updateUserUI();

        if (res.progress && typeof res.progress === 'object' && !Array.isArray(res.progress)) {
            userMethodologyProgress = res.progress;
            if (typeof updateProgressUI === 'function') updateProgressUI();
        } else {
            userMethodologyProgress = {};
            if (typeof updateProgressUI === 'function') updateProgressUI();
        }

        document.getElementById('login-trigger-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';

        // Optimization: Fetch publications immediately to update badge
        if (typeof fetchUserPublications === 'function') fetchUserPublications();
    } else {
        document.getElementById('auth-msg').innerText = (res && res.message) ? res.message : t('auth_err_server');
    }
}

function updateUserUI() {
    const nameStr = currentUser || t('user_default');
    document.getElementById('display-name').innerText = nameStr;
    const headerName = document.getElementById('header-display-name');
    if (headerName) headerName.innerText = nameStr;

    const idStr = currentUserId ? `${t('id_prefix')}${currentUserId}` : t('id_unknown');
    document.getElementById('display-id').innerText = idStr;
}

function logout() {
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    currentUser = null;
    currentUserId = null;

    updateUserUI();
    
    document.getElementById('login-trigger-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';

    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-msg').innerText = '';

    userMethodologyProgress = {};
    if (typeof updateProgressUI === 'function') updateProgressUI();
}
