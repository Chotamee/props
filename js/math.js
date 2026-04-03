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
    
    // Ensure Chart is loaded
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded yet.");
        return;
    }

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
