// Infographic Creator Logic
let infographicChart = null;
let currentChartType = 'bar';
let currentPalette = 'professional';

const palettes = {
    professional: {
        border: '#d32f2f',
        background: 'rgba(211, 47, 47, 0.7)',
        hover: '#b71c1c',
        multi: ['#d32f2f', '#f44336', '#e57373', '#ef5350', '#c62828']
    },
    corporate: {
        border: '#1976d2',
        background: 'rgba(25, 118, 210, 0.7)',
        hover: '#1565c0',
        multi: ['#1976d2', '#2196f3', '#64b5f6', '#42a5f5', '#0d47a1']
    },
    eco: {
        border: '#388e3c',
        background: 'rgba(56, 142, 60, 0.7)',
        hover: '#2e7d32',
        multi: ['#388e3c', '#4caf50', '#81c784', '#66bb6a', '#1b5e20']
    },
    modern: {
        border: '#455a64',
        background: 'rgba(69, 90, 100, 0.7)',
        hover: '#37474f',
        multi: ['#455a64', '#607d8b', '#90a4ae', '#78909c', '#263238']
    }
};

function setChartType(type) {
    currentChartType = type;
    // Update UI active state
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-type-${type}`);
    if (activeBtn) activeBtn.classList.add('active');
    renderInfographic();
}

function setPalette(palName) {
    currentPalette = palName;
    // Update UI active state
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-pal-${palName}`);
    if (activeBtn) activeBtn.classList.add('active');
    renderInfographic();
}

function renderInfographic() {
    const labelsInput = document.getElementById('infographic-labels');
    const valuesInput = document.getElementById('infographic-values');
    if (!labelsInput || !valuesInput) return;

    const labels = labelsInput.value.split(',').map(s => s.trim());
    const values = valuesInput.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

    const canvas = document.getElementById('infographicCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');



    if (infographicChart) infographicChart.destroy();

    const pal = palettes[currentPalette];

    // Choose between single color or multi-color (for Pie/Doughnut)
    const isMulti = ['pie', 'doughnut', 'polarArea'].includes(currentChartType);

    infographicChart = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: labels,
            datasets: [{
                label: typeof t === 'function' ? t('chart_dataset') : 'Деректер жиынтығы',
                data: values,
                backgroundColor: isMulti ? pal.multi : pal.background,
                borderColor: isMulti ? '#ffffff' : pal.border,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: isMulti,
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 12 } }
                }
            },
            scales: isMulti ? {} : {
                y: { beginAtZero: true, grid: { color: '#eee' } },
                x: { grid: { display: false } }
            }
        },
        plugins: [{
            id: 'custom_canvas_background_color',
            beforeDraw: (chart) => {
                const ctx = chart.canvas.getContext('2d');
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        }]
    });
}

function downloadInfographic() {
    const canvas = document.getElementById('infographicCanvas');
    if (!canvas) return;

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.download = `infographic_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Chart.js is ready if loaded via defer
    setTimeout(() => {
        if (document.getElementById('infographicCanvas')) {
            renderInfographic();
        }
    }, 1000);
});
