// --- PHOTO CALCULATOR LOGIC (GEMMA 4 / GEMINI VISION) ---

let selectedPhotoBase64 = null;
let selectedPhotoMime = null;

/**
 * Handle image selection from file input
 */
function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedPhotoMime = file.type;
    const reader = new FileReader();

    // Show loading or UI transition if needed
    reader.onload = function(e) {
        selectedPhotoBase64 = e.target.result.split(',')[1];
        document.getElementById('photo-preview').src = e.target.result;
        
        // UI Transitions
        document.getElementById('photo-preview-container').style.display = 'block';
        document.getElementById('photo-drop-zone').style.display = 'none';
        document.getElementById('photo-result-container').style.display = 'none';
        
        // Smooth scroll to preview
        document.getElementById('photo-preview-container').scrollIntoView({ behavior: 'smooth' });
    };
    reader.readAsDataURL(file);
}

/**
 * Reset the photo calculator state
 */
function clearPhoto() {
    selectedPhotoBase64 = null;
    selectedPhotoMime = null;
    document.getElementById('photo-input').value = '';
    document.getElementById('photo-preview-container').style.display = 'none';
    document.getElementById('photo-drop-zone').style.display = 'flex';
    document.getElementById('photo-result-container').style.display = 'none';
    document.getElementById('photo-loading').style.display = 'none';
}

/**
 * Send the image to the backend for AI processing
 */
function solvePhotoProblem() {
    if (!selectedPhotoBase64) {
        alert(t('calc_err_no_img'));
        return;
    }

    // Update UI state
    document.getElementById('photo-loading').style.display = 'block';
    document.getElementById('photo-result-container').style.display = 'none';
    const solveBtn = document.getElementById('solve-btn');
    if (solveBtn) solveBtn.disabled = true;

    const payload = {
        action: 'solve_photo',
        base64: selectedPhotoBase64,
        mimeType: selectedPhotoMime,
        lang: currentLang
    };

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('photo-loading').style.display = 'none';
        if (solveBtn) solveBtn.disabled = false;
        
        if (data && data.success) {
            const resultText = document.getElementById('photo-result-text');
            // We use innerHTML if we want to support markdown-like formatting or simple replacement
            // For safety and simplicity, we'll use innerText but we can handle basic bolding
            resultText.innerHTML = formatAIResponse(data.response);
            
            document.getElementById('photo-result-container').style.display = 'block';
            
            // Scroll to result
            setTimeout(() => {
                document.getElementById('photo-result-container').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            alert(t('auth_msg_prefix') + (data.message || "Unknown error"));
        }
    })
    .catch(err => {
        console.error("Photo Solve Error:", err);
        document.getElementById('photo-loading').style.display = 'none';
        if (solveBtn) solveBtn.disabled = false;
        alert(t('auth_err_server'));
    });
}

/**
 * Simple formatter for AI response (handles bold and newlines)
 */
function formatAIResponse(text) {
    if (!text) return "";
    // Replace **bold** with <strong>bold</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace * bullet points
    formatted = formatted.replace(/^\*\s(.*)/gm, '<li>$1</li>');
    // Wrap lists if they exist
    if (formatted.includes('<li>')) {
        // This is a very basic wrapper, real markdown parser would be better
        // but for a single-purpose tool, this works for common AI styles.
    }
    return formatted;
}

// Add Drag & Drop support
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('photo-drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handlePhotoSelect({ target: { files: files } });
    }, false);
});
