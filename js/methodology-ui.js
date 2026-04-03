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
