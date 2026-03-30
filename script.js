const API_URL = 'https://script.google.com/macros/s/AKfycbw6JcJLXzqYFmyfZmsFBc9Q0LAbYRc2IkM5PQAaPkneMtKtX3r92D5wpsqABzLlDTO8/exec';

// --- AUTHENTICATION LOGIC ---
let isLoginMode = true;

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
    
    if(!user || !pass) {
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
    .then(response => {
        console.log("Fetch Raw Response:", response);
        return response.json();
    })
    .then(data => {
        console.log("Fetch Parsed Data:", data);
        onAuthResponse(data);
    })
    .catch(error => {
        console.error("Fetch Error:", error);
        msgBox.innerText = "Қате орын алды (Сервермен байланыс жоқ).";
    });
}

function onAuthResponse(res) {
    if(res && res.success) {
        document.getElementById('view-login').style.display = 'none';
        document.getElementById('display-name').innerText = res.username || "Пайдаланушы";
        if(res.id) document.getElementById('display-id').innerText = `ID: ${res.id}`;
        
        document.getElementById('login-trigger-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
    } else {
        document.getElementById('auth-msg').innerText = (res && res.message) ? res.message : "Қате орын алды.";
    }
}

function logout() {
    document.getElementById('display-name').innerText = "Пайдаланушы";
    document.getElementById('display-id').innerText = "ID: Белгісіз";
    document.getElementById('login-trigger-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
    
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-msg').innerText = '';
}


// --- VIEW NAVIGATION LOGIC ---
const allViews = [
    'view-dashboard', 'view-query', 'view-methodology', 
    'view-plagiarism', 'view-math', 'view-coming-soon'
];

function showView(viewId) {
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    const target = document.getElementById(viewId);
    if(target) target.style.display = 'flex'; 

    if(viewId === 'view-dashboard') {
        const sidebar = document.getElementById('sidebar');
        if(sidebar) sidebar.style.display = window.innerWidth > 768 ? 'flex' : 'none';
    } else {
        const sidebar = document.getElementById('sidebar');
        if(sidebar) sidebar.style.display = 'none';
    }
}

// Chart.js Setup for Math Tools
let myChart = null;
function renderChart() {
    const inputField = document.getElementById('chart-data');
    if (!inputField) return;
    const inputData = inputField.value;
    const vals = inputData.split(',').map(Number).filter(n => !isNaN(n));
    const labels = vals.map((_, i) => i + 1);

    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Динамикалық график',
                data: vals,
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } }
        }
    });
}
// Init chart later to ensure DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Set dashboard as default initially without jumping screen heavily
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('main-content-area').style.display = 'block';
    showView('view-dashboard');
    renderChart();
});

// Query Hub Gemini logic
function sendQuery() {
    const promptInput = document.getElementById('gemini-prompt');
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const chatContainer = document.getElementById('chat-history');
    
    const userMsg = document.createElement('div');
    userMsg.style.cssText = "background:#e3f2fd; padding:10px; border-radius:10px; margin-bottom:10px; align-self:flex-end; max-width:80%; margin-left:auto;";
    userMsg.textContent = "Сіз: " + prompt;
    chatContainer.appendChild(userMsg);
    
    promptInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ask_gemini', prompt: prompt })
    })
    .then(response => {
        console.log("Gemini Raw Fetch Output:", response);
        return response.json();
    })
    .then(data => {
        console.log("Gemini Parsed Data:", data);
        const textResponse = (data && data.success) ? data.response : ((data && data.message) ? data.message : "Жауап жоқ.");
        const botMsg = document.createElement('div');
        botMsg.style.cssText = "background:white; border:1px solid #ccc; padding:10px; border-radius:10px; margin-bottom:10px; align-self:flex-start; max-width:80%;";
        botMsg.textContent = "Ассистент: " + textResponse;
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => {
        console.error("Gemini Fetch Error:", error);
        const botMsg = document.createElement('div');
        botMsg.style.cssText = "background:white; border:1px solid #ccc; padding:10px; border-radius:10px; margin-bottom:10px; align-self:flex-start; max-width:80%; color:red;";
        botMsg.textContent = "Ассистент: Желі қателігі орын алды.";
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}
