// --- AUTHENTICATION LOGIC ---

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Кіру' : 'Тіркелу';
    document.getElementById('auth-btn').innerText = isLoginMode ? 'Кіру' : 'Тіркелу';
    document.getElementById('auth-toggle').innerText = isLoginMode ? 'Аккаунтыңыз жоқ па? Тіркелу' : 'Аккаунтыңыз бар ма? Кіру';
    document.getElementById('auth-msg').innerText = '';
}

function openLogin() {
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-msg').innerText = '';
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
        msgBox.innerText = "Барлық өрістерді толтырыңыз.";
        return;
    }

    msgBox.innerText = "Күте тұрыңыз...";
    const action = isLoginMode ? 'login' : 'register';

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: action, username: user, password: pass })
    })
        .then(response => response.json())
        .then(data => onAuthResponse(data))
        .catch(error => {
            console.error("Fetch Error:", error);
            msgBox.innerText = "Қате орын алды (Сервермен байланыс жоқ).";
        });
}

function onAuthResponse(res) {
    if (res && res.success) {
        // Save to auto-login
        localStorage.setItem('savedUsername', document.getElementById('auth-username').value.trim());
        localStorage.setItem('savedPassword', document.getElementById('auth-password').value.trim());

        document.getElementById('view-login').style.display = 'none';
        document.getElementById('display-name').innerText = res.username || "Пайдаланушы";
        if (res.id) document.getElementById('display-id').innerText = `ID: ${res.id}`;

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
        document.getElementById('auth-msg').innerText = (res && res.message) ? res.message : "Қате орын алды.";
    }
}

function logout() {
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');

    document.getElementById('display-name').innerText = "Пайдаланушы";
    document.getElementById('display-id').innerText = "ID: Белгісіз";
    document.getElementById('login-trigger-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';

    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-msg').innerText = '';

    userMethodologyProgress = {};
    if (typeof updateProgressUI === 'function') updateProgressUI();
}
