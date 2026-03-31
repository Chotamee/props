const API_URL = 'https://script.google.com/macros/s/AKfycbw6JcJLXzqYFmyfZmsFBc9Q0LAbYRc2IkM5PQAaPkneMtKtX3r92D5wpsqABzLlDTO8/exec';
let publicationsCache = null;

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
        // Save to auto-login
        localStorage.setItem('savedUsername', document.getElementById('auth-username').value.trim());
        localStorage.setItem('savedPassword', document.getElementById('auth-password').value.trim());

        document.getElementById('view-login').style.display = 'none';
        document.getElementById('display-name').innerText = res.username || "Пайдаланушы";
        if(res.id) document.getElementById('display-id').innerText = `ID: ${res.id}`;
        
        if(res.progress && typeof res.progress === 'object' && !Array.isArray(res.progress)) {
            userMethodologyProgress = res.progress;
            updateProgressUI();
        } else {
            userMethodologyProgress = {};
            updateProgressUI();
        }
        
        document.getElementById('login-trigger-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';

        // Optimization: Fetch publications immediately to update badge
        fetchUserPublications();
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
    updateProgressUI();
}


// --- VIEW NAVIGATION LOGIC ---
const allViews = [
    'view-dashboard', 'view-query', 'view-methodology', 
    'view-course', 'view-plagiarism', 'view-math', 'view-coming-soon', 'view-publications'
];

function showView(viewId) {
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    const target = document.getElementById(viewId);
    if(target) target.style.display = 'flex'; 

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Trigger data fetches on view open ONLY if not cached
    if (viewId === 'view-publications' && !publicationsCache) {
        fetchUserPublications();
    }

    if(viewId === 'view-dashboard') {
        if(sidebar) sidebar.style.display = ''; // Let CSS media queries handle display state
    } else {
        if(sidebar) sidebar.style.display = 'none';
    }

    // Always close mobile sidebar when switching views
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.classList.remove('active');
}

window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    
    // If resized to desktop, clean up mobile menu states
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        
        // Re-evaluate display based on active view
        const dashboard = document.getElementById('view-dashboard');
        if (dashboard && dashboard.style.display !== 'none') {
            sidebar.style.display = ''; // Let CSS handle it
        } else {
            sidebar.style.display = 'none';
        }
    } else {
        // If resized to mobile, rely on CSS 
        const dashboard = document.getElementById('view-dashboard');
        if (dashboard && dashboard.style.display !== 'none') {
            sidebar.style.display = ''; 
        }
    }
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(sidebar) sidebar.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
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

// --- COURSE LOGIC ---
const baseCourseData = [
    {
        title: "1-қадам: Әдебиеттерге шолу",
        desc: "Әдебиеттерге шолу - сіздің ғылыми жұмысыңыздың іргетасы. Мұнда бұрынғы ғалымдардың еңбектерін талдау және зерттеудегі бос орындарды (research gap) табу көзделеді.",
        keywords: ["Ақпарат іздеу", "Сыни талдау", "Scopus", "Web of Science", "Деректер базасы", "Библиография", "Әдебиеттерді сүзу", "Citation", "Reference Management"],
        paragraphs: [
            "Әдебиеттерге шолу жасау барысында ең сенімді дерекқорларды (Scopus немесе Web of Science сияқты) қолданған дұрыс. Ондағы мақалалар қатаң рецензиялаудан (peer-review) өткендіктен, ғылыми зерттеу үшін ең мықты негіз бола алады.",
            "Зерттеу барысында көптеген ғалымдар жүйелілік мәселесімен бетпе-бет келеді. Мақалаларды сақтау және оларға дұрыс сілтеме жасау үшін Mendeley, Zotero немесе EndNote сияқты библиографиялық менеджерлерді қолдану уақытыңызды айтарлықтай үнемдейді.",
            "Сыни талдау (Critical Analysis) – көзсіз сенімге емес, фактілерді сараптауға сүйенетін процесс. Оқылған әртүрлі авторлардың пікірлерін салыстырып, олардың әдістемелеріндегі кемшіліктерді (limitations) табу сіздің жұмысыңыздың өзектілігін көрсетеді.",
            "Жаңашылдық (Research gap) іздеу – зерттелмеген аймақты табу деген сөз. Ол үшін бұрынғы жұмыстардың соңындағы «Келесі зерттеулер үшін ұсыныстар» (Future research directions) бөлімін мұқият оқыған абзал.",
            "Іздеу сауалдарын дұрыс құру да маңызды. Операторлар (AND, OR, NOT) арқылы іздеу жүйесін барынша тарылтып, жүздеген мақалалардың ішінен өзіңізге қажетті 10-15 негізгі дереккөзді дәл табуға болады.",
            "Мақалаларды оқығанда дереу конспект жасап отыруды ұмытпаңыз. Көп ақпаратты мида сақтау мүмкін емес, сондықтан әрбір құнды ойды немесе цитатаны автордың аты-жөні мен бет нөмірін көрсете отырып жеке файлға түртіп қойыңыз."
        ]
    },
    {
        title: "2-қадам: Диссертация құру",
        desc: "Зерттеу сұрағын және гипотезасын (диссертациясын) тұжырымдау. Нақты бағыт пен мақсатсыз ғылыми жұмыс жасау мүмкін емес.",
        keywords: ["Гипотеза", "Зерттеу сұрағы", "Теориялық негіз", "Зерттеу мақсаттары", "Өзектілік", "Практикалық маңыздылық", "Ғылыми жаңалық", "Концепция", "Аргументация"],
        paragraphs: [
            "Жақсы тұжырымдалған зерттеу сұрағы – бүкіл жұмыстың компасы. Ол тым ауқымды (кең) немесе тым тар болмауы тиіс. Ол нақты, өлшенетін және зерттеуге келетін (researchable) болуы керек.",
            "Гипотеза – зерттеу сұрағына берілетін алдын-ала, дәлелденбеген жауап. Эксперимент барысында осы гипотезаны не жоққа шығару (null hypothesis), не дәлелдеу (alternative hypothesis) қажет.",
            "Бұл кезеңде айнымалыларды (variables) нақтылау да жүзеге асады. Тәуелсіз айнымалы (сіз басқаратын) және тәуелді айнымалы (өзгерістері өлшенетін) арасындағы байланыс өте айқын болуы керек.",
            "Өзектілік (Relevance) жұмыстың маңыздылығын көрсетеді. Бұл зерттеу қоғамға, ғылымға не немесе белгілі бір индустрияға қандай пайда әкелетінін дәлелдейтін басты аргумент.",
            "Диссертациядағы концептуалды негіз – бұл жұмыстың архитектурасы. Қандай теориялар мен модельдерге сүйенетініңізді алдын-ала анықтап, зерттеудің теориялық шекарасын сызып алу өте маңызды.",
            "Осы кезеңде басты зерттеу мақсатын және оған жету үшін қажетті 3-4 нақты міндеттерді (objectives) жазу қажет. Мақсаттар SMART (Specific, Measurable, Achievable, Relevant, Time-bound) форматына сай болуы тиіс."
        ]
    },
    {
        title: "3-қадам: Әдістемені жобалау",
        desc: "Әдістеме (Методология) — деректерді жинау мен талдаудың жүйелі жолы. Бұл бөлім зерттеудің қайталанбастығын (reproducibility) қамтамасыз етеді.",
        keywords: ["Сапалық зерттеу", "Сандық зерттеу", "Респонденттер", "Эксперимент", "Аралас әдістер", "Айнымалылар", "Іріктеу", "Интервью", "Сауалнама"],
        paragraphs: [
            "Зерттеу дизайнын таңдау – ең маңызды шешімдердің қатарында. Егер мақсатыңыз сандар мен статистиканы қолданып заңдылықтарды анықтау болса, сандық (Quantitative) әдіс таңдалады.",
            "Егер сіз құбылыстың терең себеп-салдарлық байланыстарын түсінгіңіз келсе, сапалық (Qualitative) әдістер – сұхбат, фокус-топтар немесе бақылау қажет.",
            "Көптеген заманауи зерттеулер екі әдістің де үйлесімін (Mixed Methods) қолданады. Мәселен, алдымен кең көлемді сауалнама (сандық), кейін тереңірек түсіну үшін 10-15 адамнан сұхбат алу (сапалық).",
            "Респонденттерді іріктеу (Sampling) өте мұқият жүзеге асуы керек. Кездейсоқ (Random sampling) іріктеу нәтижелердің шынайылығын арттырса, ал мақсатты іріктеу (purposive sampling) белгілі бір топтың пікірін білуге бағытталады.",
            "Әдістеме бөліміндегі басты талап – оның қайталанбастығы. Кез келген басқа ғалым сіздің әдістемеңізді дәл сол ретпен қайталап жасап, дәл сондай нәтиже алуы тиіс. Егер олай болмаса, әдістеме бұрыс жазылған.",
            "Құралдардың (Research instruments) валидтілігі мен сенімділігін (Validity and Reliability) тексеру міндетті. Мысалы, сауалнама сұрақтары алдын-ала 5-10 адамға пилоттық түрде (pilot study) беріліп тексерілуі керек."
        ]
    },
    {
        title: "4-қадам: Жобаны жазу",
        desc: "Алынған нәтижелерді қағаз бетіне түсіру. IMRAD (Кіріспе, Әдістер, Нәтижелер, Талқылау) форматын қолдана отырып алғашқы жобаны (draft) жазу.",
        keywords: ["IMRAD форматы", "Академиялық тіл", "Талқылау", "Нәтижелер интрепретациясы", "Графиктер мен кестелер", "Кіріспе жазу", "Абстракт", "Қорытынды", "Drafting"],
        paragraphs: [
            "Академиялық жазудың IMRAD құрылымы өте түсінікті формат: Introduction (Неге бұл тақырып зерттелді?), Methods (Ол қалай зерттелді?), Results (Не табылды?) және Discussion (Бұл табылулардың мағынасы қандай?).",
            "Нәтижелерді сипаттағанда субъективті пікірлерге орын бермеу керек. Алынған деректер (кестелер, графиктер) өте объективті, құрғақ ғылыми тілмен ғана сипатталуы тиіс.",
            "Талқылау (Discussion) – мақаланың ең күрделі бөлімі. Бұл жерде сіз өз нәтижелеріңізді басқа ғалымдардың жұмыстарымен салыстыра отырып, мағынасын (интерпретациясын) ашып көрсетесіз.",
            "Графиктер мен диаграммалар зерттеудің көрнекілігі үшін таптырмас құрал. Олар өзін-өзі түсіндіретін (self-explanatory) болуы тиіс. Мәтінге қарамай-ақ графиктен негізгі ойды түсініп алуға мүмкіндік беру қажет.",
            "Кіріспе (Introduction) жазу кезінде дедуктивті тәсілді (Жалпыдан жалқыға) қолданыңыз. Онда мәселенің жалпы көрінісін суреттеп, содан кейін ғана өзіңіздің зерттеу гипотезаңызға әкелуіңіз қажет.",
            "Абстракт – бүкіл жұмыстың айнасы. Ол 150-250 сөзден тұрады және жұмыстың мақсатын, әдісін, негізгі нәтижелері мен қорытындысын толықтай қамтуы керек."
        ]
    },
    {
        title: "5-қадам: Өңдеу және пішімдеу",
        desc: "Мәтінді редакциялау, плагиатқа тексеру және журнал талаптарына сай пішімдеу (референстерді дұрыстау).",
        keywords: ["APA стилі", "IEEE стилі", "Плагиат", "Корректорлық оқу", "Дәйексөз келтіру", "Peer-review", "Журнал таңдау", "Рецензия", "Submission"],
        paragraphs: [
            "Мақаланы журналға жібермес бұрын, мәтінді міндетті түрде бірнеше рет оқып (proofreading) шығу қажет. Грамматикалық немесе пунктуациялық қателіктер зерттеудің маңыздылығын төмендетуі мүмкін.",
            "Журналдың форматын (Author Guidelines) қатаң сақтаңыз. Референстер мен цитаталарды мысалы APA (гуманитарлық ғылымдар үшін) немесе IEEE (инженерия үшін) стиліне сай бірдей форматта келтіріңіз.",
            "Академиялық плагиатқа жол бермеу – басты шарт. Турнитин (Turnitin) немесе басқа да антиплагиат жүйелерінен өтіп, жұмыстың түпнұсқалығын кем дегенде 85% деңгейінде қамтамасыз етіңіз.",
            "Peer-review (құрдастар рецензиясы) кезінде редакторлар мен сарапшылардан сын алуыңыз әбден мүмкін. Сынды конструктивті қабылдап, түзетулерді дәлелді жауаптармен (Response to Reviewers) қайтару маңызды.",
            "Журнал таңдау процесі де өте маңызды. Оның Q1-Q4 квартиліне, импакт-факторына (Impact Factor) және аудиториясына назар аударыңыз. Жыртқыш журналдардан (Predatory Journals) мейлінше сақтаныңыз.",
            "Ең бастысы, академиялық төзімділік танытыңыз. Көптеген әлемдік деңгейдегі ғалымдардың мақалалары бірінші ретте қабылданбайды (rejection). Бұл – ғылым жолындағы қалыпты процесс."
        ]
    }
];

const courseData = baseCourseData.map((section, sIdx) => {
    let pages = [];
    for (let p = 1; p <= 30; p++) {
        let k1 = section.keywords[p % section.keywords.length];
        let k2 = section.keywords[(p + 1) % section.keywords.length];
        
        // Procedurally select 3 diverse paragraphs for this page to make each page unique and very informative
        let para1 = section.paragraphs[p % section.paragraphs.length];
        let para2 = section.paragraphs[(p * 2 + 1) % section.paragraphs.length];
        let para3 = section.paragraphs[(p * 3 + 2) % section.paragraphs.length];
        
        let content = `
            <h3>${section.title} - ${p}-бет</h3>
            <div style="margin-top: 20px; padding: 20px; background: #fafafa; border-radius: 10px; border-left: 5px solid var(--primary-red);">
                <h4 style="margin-bottom: 15px; color: #333;">Негізгі концепция: ${k1}</h4>
                <p style="margin-bottom: 15px; text-align: justify; line-height: 1.8;">
                    ${para1}
                </p>
                <div style="background: #fff; border: 1px solid #eee; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h5 style="margin-bottom: 10px; color: var(--primary-red);"><i class="fa-solid fa-microscope"></i> Зерттеу барысындағы назар аударатын тұстар</h5>
                    <p style="margin-bottom: 0; text-align: justify; line-height: 1.8; color: #555;">
                        ${para2} Сонымен қатар, <b>${k2}</b> ұғымын тереңірек түсіну осы процестің сапасын еселей түседі. Ғылымда егжей-тегжейлі талдау жасау әрқашан құнды саналады.
                    </p>
                </div>
                <p style="margin-bottom: 15px; text-align: justify; line-height: 1.8;">
                    ${para3}
                </p>
                <div style="background: #fce4e4; padding: 15px; border-radius: 8px; font-size: 14px;">
                    <i class="fa-solid fa-lightbulb"></i> <b>Жадынама:</b> Осы беттегі маңызды ақпараттар мен қағидаларды зерттеу жұмысыңыздың әрбір кезеңінде мұқият ескеру ұсынылады. Бұл сіздің қателескіш мүмкіндігіңізді төмендетеді.
                </div>
            </div>
        `;
        pages.push({ title: `${p}-бет: ${k1}`, content: content });
    }
    return { title: section.title, pages: pages };
});

let userMethodologyProgress = {}; // Format: { "0": [true, false...], "1": [...] }
let currentSectionIndex = -1;
let currentPageIndex = -1;

function openCourse(index) {
    currentSectionIndex = index;
    currentPageIndex = -1;
    
    document.getElementById('course-title').innerText = courseData[index].title;
    renderPageList();
    
    document.getElementById('course-page-list').style.display = 'block';
    document.getElementById('course-page-content').style.display = 'none';
    
    showView('view-course');
}

function handleCourseBack() {
    if (currentPageIndex === -1) {
        showView('view-methodology');
    } else {
        currentPageIndex = -1;
        renderPageList();
        document.getElementById('course-page-list').style.display = 'block';
        document.getElementById('course-page-content').style.display = 'none';
    }
}

function renderPageList() {
    const grid = document.getElementById('page-grid-items');
    grid.innerHTML = '';
    
    const sectionProgress = userMethodologyProgress[currentSectionIndex] || Array(30).fill(false);
    
    courseData[currentSectionIndex].pages.forEach((page, pIdx) => {
        const item = document.createElement('div');
        item.className = 'page-item' + (sectionProgress[pIdx] ? ' completed' : '');
        item.onclick = () => openPage(pIdx);
        
        item.innerHTML = `
            <div class="check"><i class="fa-solid fa-circle-check"></i></div>
            <div class="page-number">${pIdx + 1}</div>
            <div class="page-name">${page.title}</div>
        `;
        grid.appendChild(item);
    });
}

function openPage(pIdx) {
    currentPageIndex = pIdx;
    const page = courseData[currentSectionIndex].pages[pIdx];
    
    document.getElementById('course-text').innerHTML = page.content;
    
    const nextBtn = document.getElementById('course-next-btn');
    const finishBtn = document.getElementById('course-finish-btn');
    
    if (pIdx < 29) {
        nextBtn.style.display = 'block';
        finishBtn.style.display = 'none';
        nextBtn.innerHTML = `Келесі бет (${pIdx + 2}) <i class="fa-solid fa-arrow-right"></i>`;
    } else {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'block';
    }
    
    document.getElementById('course-page-list').style.display = 'none';
    document.getElementById('course-page-content').style.display = 'flex';
}

function nextPage() {
    // Current page is finished
    markPageComplete(currentPageIndex);
    
    if (currentPageIndex < 29) {
        openPage(currentPageIndex + 1);
    }
}

function finishSection() {
    markPageComplete(currentPageIndex);
    setTimeout(() => {
        handleCourseBack();
    }, 500);
}

function markPageComplete(pIdx) {
    if (!userMethodologyProgress[currentSectionIndex]) {
        userMethodologyProgress[currentSectionIndex] = Array(30).fill(false);
    }
    
    if (!userMethodologyProgress[currentSectionIndex][pIdx]) {
        userMethodologyProgress[currentSectionIndex][pIdx] = true;
        updateProgressUI();
        saveProgressToServer();
    }
}

function updateProgressUI() {
    for (let sIdx = 0; sIdx < 5; sIdx++) {
        const bar = document.getElementById('progress-' + sIdx);
        const item = document.getElementById('step-item-' + sIdx);
        
        const progArray = userMethodologyProgress[sIdx] || Array(30).fill(false);
        const completedCount = progArray.filter(v => v === true).length;
        const percentage = Math.round((completedCount / 30) * 100);
        
        if (bar) bar.style.width = percentage + '%';
        
        if (item) {
            const icon = item.querySelector('.step-icon');
            if (percentage === 100) {
                item.style.borderColor = '#4caf50';
                if (icon) {
                    icon.style.color = '#4caf50';
                    icon.style.backgroundColor = '#e8f5e9';
                }
            } else if (percentage > 0) {
                item.style.borderColor = '#ff9800'; // Orange for in-progress
                if (icon) {
                    icon.style.color = '#ff9800';
                    icon.style.backgroundColor = '#fff3e0';
                }
            } else {
                item.style.borderColor = 'var(--border-color)';
                if (icon) {
                    icon.style.color = 'var(--primary-red)';
                    icon.style.backgroundColor = '#fce4e4';
                }
            }
        }
    }
}

function saveProgressToServer() {
    const user = document.getElementById('display-name').innerText;
    if (user === "Пайдаланушы" || !user) return;
    
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_progress', username: user, progress: userMethodologyProgress })
    }).then(res => res.json())
      .then(data => console.log("Progress save:", data))
      .catch(e => console.error("Progress save error:", e));
}

// --- PUBLICATION UPLOAD LOGIC ---
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');

if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    const user = document.getElementById('display-name').innerText;
    if (user === "Пайдаланушы" || !user) {
        alert("Жүктеу үшін алдымен жеке кабинетіңізге кіріңіз!");
        return;
    }

    const status = document.getElementById('upload-status');
    status.innerText = "Файл оқылуда...";
    status.style.color = '#ff9800';

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result.split(',')[1];
        
        status.innerText = "Файл бұлтқа жүктелуде. Күте тұрыңыз...";
        
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'upload_file',
                username: user,
                filename: file.name,
                mimeType: file.type,
                base64: base64Data
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.success) {
                status.innerText = "Сәтті жүктелді!";
                status.style.color = '#4caf50';
                fetchUserPublications(true); // Force refresh to update cache with new file
            } else {
                status.innerText = "Қате: " + (data.message || "Жүктеу мүмкін болмады.");
                status.style.color = 'var(--primary-red)';
            }
        })
        .catch(err => {
            console.error("Upload Error:", err);
            status.innerText = "Байланыс қатесі.";
            status.style.color = 'var(--primary-red)';
        });
    };
    reader.readAsDataURL(file);
}

function fetchUserPublications(force = false) {
    const user = document.getElementById('display-name').innerText;
    if (user === "Пайдаланушы" || !user) return;
    
    const listDiv = document.getElementById('files-list');
    
    // If we have cache and NOT forcing, just render and return
    if (publicationsCache && !force) {
        renderFilesList(publicationsCache);
        updatePublicationsBadge(publicationsCache.length);
        return;
    }

    if(listDiv) listDiv.innerHTML = '<div style="text-align: center; color: #777; padding: 20px;">Жүктелуде... <i class="fa-solid fa-spinner fa-spin"></i></div>';
    
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'get_files', username: user })
    })
    .then(res => res.json())
    .then(data => {
        if (data && data.success && data.files) {
            publicationsCache = data.files;
            renderFilesList(data.files);
            updatePublicationsBadge(data.files.length);
        } else {
            publicationsCache = [];
            if(listDiv) listDiv.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 30px; font-size: 14px;">Файлдар жүктелген жоқ.</div>';
            updatePublicationsBadge(0);
        }
    })
    .catch(err => {
        console.error("Fetch Files Error:", err);
        if(listDiv) listDiv.innerHTML = '<div style="text-align: center; color: var(--primary-red); padding: 20px;">Деректерді алу мүмкін болмады.</div>';
    });
}

function updatePublicationsBadge(count) {
    const badge = document.getElementById('publications-badge');
    if (badge) badge.innerText = count;
}

function manualRefreshPublications() {
    fetchUserPublications(true);
}

function renderFilesList(files) {
    const listDiv = document.getElementById('files-list');
    if(!listDiv) return;
    listDiv.innerHTML = '';
    
    // Sort files newest first if possible (assuming timestamp is chronologically valid string or number)
    try {
        files.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch(e) {}

    files.forEach(f => {
        const dateStr = new Date(f.timestamp).toLocaleDateString('kk-KZ', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        let icon = 'fa-file-lines';
        const nameLower = f.originalName.toLowerCase();
        if(nameLower.endsWith('.pdf')) icon = 'fa-file-pdf';
        else if(nameLower.endsWith('.docx') || nameLower.endsWith('.doc')) icon = 'fa-file-word';
        else if(nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) icon = 'fa-file-image';

        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
            <div class="file-info">
                <i class="fa-solid ${icon}"></i>
                <div>
                    <div class="file-name">${f.originalName}</div>
                    <div class="file-date">${dateStr}</div>
                </div>
            </div>
            <a href="${f.url}" target="_blank" class="btn" style="text-decoration: none; padding: 6px 15px; font-size: 13px; width: auto;"><i class="fa-solid fa-download"></i> Жүктеу</a>
        `;
        listDiv.appendChild(card);
    });
}

// Auto-login check on load
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('savedUsername');
    const savedPass = localStorage.getItem('savedPassword');
    if (savedUser && savedPass) {
        document.getElementById('auth-username').value = savedUser;
        document.getElementById('auth-password').value = savedPass;
        isLoginMode = true;
        // Don't show modal, just fetch in background
        console.log("Checking saved credentials...");
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'login', username: savedUser, password: savedPass })
        })
        .then(res => res.json())
        .then(data => {
            if(data && data.success) {
                onAuthResponse(data);
            } else {
                localStorage.removeItem('savedUsername');
                localStorage.removeItem('savedPassword');
            }
        })
        .catch(e => console.error("Auto-login error:", e));
    }
});
