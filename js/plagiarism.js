function checkPlagiarism() {
    const textArea = document.getElementById('plagiarism-text-area');
    if (!textArea) return;
    const text = textArea.value.trim();
    if (!text) {
        alert(typeof t === 'function' ? t('plag_alert_empty') : "Мәтінді енгізіңіз!");
        return;
    }

    const btn = document.getElementById('plag-check-btn');
    const rangeText = document.getElementById('plag-range-text');
    const statusBadge = document.getElementById('plag-status-badge');
    const tipsList = document.getElementById('plag-tips-list');
    const percentDisplay = document.getElementById('plag-percent-display');
    const scanRay = document.getElementById('scanning-ray');
    const statusIndicator = document.querySelector('.status-indicator');

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${typeof t === 'function' ? t('plag_analyzing') : 'ТАЛДАУ ЖАСАЛУДА...'}`;
    percentDisplay.innerHTML = '<i class="fa-solid fa-sync fa-spin"></i>';
    percentDisplay.style.fontSize = '32px';
    rangeText.innerText = typeof t === 'function' ? t('plag_calculating') : 'Есептелуде...';
    statusBadge.innerText = typeof t === 'function' ? t('plag_searching') : 'ІЗДЕУДЕ...';
    if (statusIndicator) statusIndicator.classList.add('active');
    
    if (scanRay) {
        scanRay.style.display = 'block';
        scanRay.style.animation = 'scanMove 3s linear infinite';
    }

    tipsList.innerHTML = `<div class="tip-placeholder"><i class="fa-solid fa-magnifying-glass-chart fa-beat"></i> ${typeof t === 'function' ? t('plag_ai_analyzing') : 'AI мәтін құрылымын талдап жатыр...'}</div>`;

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'check_plagiarism', text: text, lang: currentLang })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-bolt"></i> ${typeof t === 'function' ? t('plag_btn') : 'ТЕКСЕРУДІ БАСТАУ'}`;
        if (scanRay) scanRay.style.display = 'none';
        
        if (data.success) {
            try {
                let aiResponse = data.response.trim();
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) aiResponse = jsonMatch[0];
                const result = JSON.parse(aiResponse);

                const pValue = result.percentage.split('-')[1] || result.percentage;
                percentDisplay.innerText = pValue;
                percentDisplay.style.fontSize = '54px'; 
                rangeText.innerText = result.percentage;
                statusBadge.innerText = result.status;
                
                if (statusIndicator) statusIndicator.classList.add('active');

                tipsList.innerHTML = '';
                if (Array.isArray(result.tips)) {
                    result.tips.forEach((tip, idx) => {
                        const tipCard = document.createElement('div');
                        tipCard.className = 'tip-card-premium';
                        tipCard.style.animationDelay = (idx * 0.1) + 's';
                        
                        const icon = idx === 0 ? 'fa-lightbulb' : (idx === 1 ? 'fa-pen-fancy' : 'fa-check-double');
                        
                        tipCard.innerHTML = `
                            <div class="tip-icon"><i class="fa-solid ${icon}"></i></div>
                            <div class="tip-content">${tip}</div>
                        `;
                        tipsList.appendChild(tipCard);
                    });
                }
            } catch (e) {
                tipsList.innerHTML = `<div class="tip-card-premium" style="border-color: var(--primary-red);"><div class="tip-icon"><i class="fa-solid fa-circle-exclamation"></i></div><div class="tip-content">${typeof t === 'function' ? t('plag_err_parse') : 'Сервер жауабын өңдеу мүмкін болмады.'}</div></div>`;
                percentDisplay.innerText = '%';
            }
        } else {
            tipsList.innerHTML = `<div class="tip-card-premium" style="border-color: var(--primary-red);"><div class="tip-icon"><i class="fa-solid fa-circle-exclamation"></i></div><div class="tip-content">${data.message}</div></div>`;
            percentDisplay.innerText = 'ERR';
        }
    })
    .catch(e => {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-bolt"></i> ${typeof t === 'function' ? t('plag_btn') : 'ТЕКСЕРУДІ БАСТАУ'}`;
        if (scanRay) scanRay.style.display = 'none';
        tipsList.innerHTML = `<div class="tip-card-premium"><div class="tip-icon"><i class="fa-solid fa-wifi"></i></div><div class="tip-content">${typeof t === 'function' ? t('plag_err_network') : 'Желілік қате орын алды.'}</div></div>`;
        percentDisplay.innerText = '%';
    });
}
