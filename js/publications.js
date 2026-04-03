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
    reader.onload = function (e) {
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
                    fetchUserPublications(true); 
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

    if (publicationsCache && !force) {
        renderFilesList(publicationsCache);
        updatePublicationsBadge(publicationsCache.length);
        return;
    }

    if (listDiv) listDiv.innerHTML = '<div style="text-align: center; color: #777; padding: 20px;">Жүктелуде... <i class="fa-solid fa-spinner fa-spin"></i></div>';

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
                if (listDiv) listDiv.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 30px; font-size: 14px;">Файлдар жүктелген жоқ.</div>';
                updatePublicationsBadge(0);
            }
        })
        .catch(err => {
            console.error("Fetch Files Error:", err);
            if (listDiv) listDiv.innerHTML = '<div style="text-align: center; color: var(--primary-red); padding: 20px;">Деректерді алу мүмкін болмады.</div>';
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
    if (!listDiv) return;
    listDiv.innerHTML = '';

    try {
        files.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) { }

    files.forEach(f => {
        const dateStr = new Date(f.timestamp).toLocaleDateString('kk-KZ', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let icon = 'fa-file-lines';
        const nameLower = f.originalName.toLowerCase();
        if (nameLower.endsWith('.pdf')) icon = 'fa-file-pdf';
        else if (nameLower.endsWith('.docx') || nameLower.endsWith('.doc')) icon = 'fa-file-word';
        else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) icon = 'fa-file-image';

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
