// Query Hub Gemini logic
let chatFontSizeIndex = 1; // 0: small, 1: normal, 2: large, 3: xlarge
const fontClasses = ['chat-font-small', 'chat-font-normal', 'chat-font-large', 'chat-font-xlarge'];

function adjustChatFontSize(delta) {
    const chatContainer = document.getElementById('chat-history');
    if (!chatContainer) return;

    chatContainer.classList.remove(fontClasses[chatFontSizeIndex]);
    chatFontSizeIndex = Math.max(0, Math.min(fontClasses.length - 1, chatFontSizeIndex + delta));
    chatContainer.classList.add(fontClasses[chatFontSizeIndex]);
    localStorage.setItem('chatFontSizeIndex', chatFontSizeIndex);
}

function formatMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="project-link">$1</a>');

    const lines = text.split('\n');
    let inList = false;
    let formatted = lines.map(line => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            let res = (inList ? '' : '<ul style="margin-top:5px; padding-left:20px;">') + `<li>${line.trim().substring(2)}</li>`;
            inList = true;
            return res;
        } else {
            let res = (inList ? '</ul>' : '') + line;
            inList = false;
            return res;
        }
    }).join('\n');
    if (inList) formatted += '</ul>';

    return formatted.replace(/\n/g, '<br>');
}

function searchProjects() {
    const topicInput = document.getElementById('search-topic');
    const topic = topicInput.value.trim();
    if (!topic) return;

    const resultsContainer = document.getElementById('search-results-container');
    resultsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; background: white; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-flask-vial fa-spin" style="font-size: 40px; color: var(--primary-red); margin-bottom: 20px;"></i>
            <div style="color: var(--text-primary); font-weight: 600; font-size: 16px;">Ғылыми мәліметтер ізделуде...</div>
            <div style="color: var(--text-secondary); font-size: 13px; margin-top: 8px;">Модель тақырыбыңызды талдап жатыр.</div>
        </div>`;

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'search_projects', topic: topic })
    })
        .then(response => response.json())
        .then(data => {
            // Handle both structured {success: true, response: ...} and raw string responses
            const success = (typeof data === 'object' && data !== null) ? data.success : true;
            let rawResponse = (typeof data === 'object' && data !== null) ? data.response : data;

            if (success && rawResponse) {
                let articles = [];
                try {
                    let responseText = rawResponse.trim();
                    // Extract JSON array using a more robust approach
                    const startIdx = responseText.indexOf('[');
                    const endIdx = responseText.lastIndexOf(']');
                    
                    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                        responseText = responseText.substring(startIdx, endIdx + 1);
                    }
                    
                    articles = JSON.parse(responseText);
                } catch (e) {
                    console.error("JSON Parse Error:", e, "Raw Data:", rawResponse);
                    resultsContainer.innerHTML = '<div style="grid-column: 1 / -1; color: var(--primary-red); text-align: center; padding: 40px;">Мәліметтерді өңдеу кезінде қате орын алды (JSON Format).</div>';
                    return;
                }

                resultsContainer.innerHTML = '';
                if (Array.isArray(articles)) {
                    articles.forEach((art, index) => {
                        const card = document.createElement('div');
                        card.className = 'project-card';
                        card.style.animationDelay = `${index * 0.1}s`;
                        card.innerHTML = `
                            <h3 class="project-title">${art.title || 'Тақырыпсыз мақала'}</h3>
                            <div class="project-meta">
                                <div class="meta-item"><i class="fa-solid fa-user-graduate"></i> <span>${art.authors || 'Белгісіз автор'}</span></div>
                                <div class="meta-item"><i class="fa-solid fa-calendar-days"></i> <span>${art.year || 'Жыл көрсетілмеген'}</span></div>
                            </div>
                            <a href="${art.link}" target="_blank" class="project-link">
                                <span>Толық оқу</span>
                                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                        `;
                        resultsContainer.appendChild(card);
                    });
                }
            } else {
                resultsContainer.innerHTML = '<div style="grid-column: 1 / -1; color: var(--primary-red); text-align: center; padding: 40px;">Серверден мақала алу мүмкін болмады.</div>';
            }
        })
        .catch(error => {
            resultsContainer.innerHTML = '<div style="grid-column: 1 / -1; color: var(--primary-red); text-align: center; padding: 40px;">Желі қателігі орын алды.</div>';
        });
}

function sendQuery() {
    const promptInput = document.getElementById('gemini-prompt');
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const chatContainer = document.getElementById('chat-history');

    const userMsg = document.createElement('div');
    userMsg.className = "chat-message user-message";
    userMsg.textContent = prompt;
    chatContainer.appendChild(userMsg);

    promptInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = "typing-indicator";
    typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    typingIndicator.id = "typing-indicator-el";
    chatContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ask_gemini', prompt: prompt })
    })
        .then(response => response.json())
        .then(data => {
            const indicator = document.getElementById('typing-indicator-el');
            if (indicator) indicator.remove();

            const textResponse = (data && data.success) ? data.response : ((data && data.message) ? data.message : "Жауап жоқ.");
            const botMsg = document.createElement('div');
            botMsg.className = "chat-message bot-message";
            chatContainer.appendChild(botMsg);

            animateTextWordByWord(botMsg, textResponse);
        })
        .catch(error => {
            const indicator = document.getElementById('typing-indicator-el');
            if (indicator) indicator.remove();
            const errorMsg = document.createElement('div');
            errorMsg.className = "chat-message bot-message";
            errorMsg.style.color = "red";
            errorMsg.textContent = "Желі қателігі орын алды.";
            chatContainer.appendChild(errorMsg);
        });
}

function animateTextWordByWord(element, text) {
    const words = text.split(' ');
    let currentIdx = 0;
    element.innerHTML = ''; 

    function addWord() {
        if (currentIdx < words.length) {
            const currentText = words.slice(0, currentIdx + 1).join(' ');
            element.innerHTML = formatMarkdown(currentText);
            
            const chatContainer = document.getElementById('chat-history');
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
            
            currentIdx++;
            setTimeout(addWord, 40); 
        }
    }
    addWord();
}
