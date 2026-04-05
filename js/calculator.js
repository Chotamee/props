// --- SCIENTIFIC CALCULATOR LOGIC ---

let calcExpression = '';
let lastResult = null;

function inputCalc(val) {
    const display = document.getElementById('calc-formula');
    calcExpression += val;
    display.innerText = calcExpression;
}

function inputFunc(func) {
    const display = document.getElementById('calc-formula');
    calcExpression += func;
    display.innerText = calcExpression;
}

function clearCalc() {
    calcExpression = '';
    document.getElementById('calc-formula').innerText = '';
    document.getElementById('calc-result').innerText = '0';
}

function backspaceCalc() {
    calcExpression = calcExpression.slice(0, -1);
    document.getElementById('calc-formula').innerText = calcExpression;
}

function calculateResult() {
    try {
        // Pre-process for math functions
        let processed = calcExpression
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log10\(/g, 'Math.log10(')
            .replace(/π/g, 'Math.PI');

        // Note: Math functions in JS take radians. 
        // We could add degree support, but scientific is usually radians or explicitly converted.
        
        const result = eval(processed);
        document.getElementById('calc-result').innerText = Number.isInteger(result) ? result : result.toFixed(6);
        lastResult = result;
    } catch (e) {
        document.getElementById('calc-result').innerText = 'Error';
    }
}

// --- STATISTICS ---
function runStats() {
    const input = document.getElementById('stats-input').value;
    const nums = input.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

    if (nums.length === 0) return;

    const mean = nums.reduce((a, b) => a + b) / nums.length;
    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
    const sd = Math.sqrt(variance);

    document.getElementById('stat-mean').innerText = mean.toFixed(4);
    document.getElementById('stat-var').innerText = variance.toFixed(4);
    document.getElementById('stat-sd').innerText = sd.toFixed(4);
}

// --- CONVERSIONS ---
const units = {
    length: { mm: 1, cm: 10, m: 1000, km: 1000000, inch: 25.4, ft: 304.8 },
    weight: { mg: 1, g: 1000, kg: 1000000, oz: 28349.5, lb: 453592 },
    temp: { c: 'c', f: 'f', k: 'k' }
};

function updateUnits() {
    const type = document.getElementById('conv-type').value;
    const u1 = document.getElementById('conv-unit1');
    const u2 = document.getElementById('conv-unit2');
    
    u1.innerHTML = '';
    u2.innerHTML = '';
    
    for (let u in units[type]) {
        u1.options.add(new Option(u, u));
        u2.options.add(new Option(u, u));
    }
    
    if (u2.options.length > 1) u2.selectedIndex = 1;
    convert(1);
}

function convert(source) {
    const type = document.getElementById('conv-type').value;
    const val1 = parseFloat(document.getElementById('conv-val1').value);
    const val2 = parseFloat(document.getElementById('conv-val2').value);
    const unit1 = document.getElementById('conv-unit1').value;
    const unit2 = document.getElementById('conv-unit2').value;

    if (type === 'temp') {
        let celsius;
        const v = source === 1 ? val1 : val2;
        const from = source === 1 ? unit1 : unit2;
        const to = source === 1 ? unit2 : unit1;

        if (isNaN(v)) return;

        if (from === 'c') celsius = v;
        else if (from === 'f') celsius = (v - 32) * 5/9;
        else celsius = v - 273.15;

        let res;
        if (to === 'c') res = celsius;
        else if (to === 'f') res = (celsius * 9/5) + 32;
        else res = celsius + 273.15;

        if (source === 1) document.getElementById('conv-val2').value = res.toFixed(2);
        else document.getElementById('conv-val1').value = res.toFixed(2);
        
    } else {
        const factor1 = units[type][unit1];
        const factor2 = units[type][unit2];
        
        if (source === 1) {
            if (isNaN(val1)) return;
            document.getElementById('conv-val2').value = (val1 * factor1 / factor2).toFixed(4);
        } else {
            if (isNaN(val2)) return;
            document.getElementById('conv-val1').value = (val2 * factor2 / factor1).toFixed(4);
        }
    }
}

function switchCalcTab(tab) {
    document.querySelectorAll('.calculator-sidebar .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.calculator-sidebar .tab-content').forEach(c => c.style.display = 'none');
    
    if (tab === 'stats') {
        document.querySelector('.tab-btn[onclick*="stats"]').classList.add('active');
        document.getElementById('calc-stats').style.display = 'block';
    } else {
        document.querySelector('.tab-btn[onclick*="conv"]').classList.add('active');
        document.getElementById('calc-conv').style.display = 'block';
    }
}

// Init units on load
document.addEventListener('DOMContentLoaded', () => {
    // Only if view exists
    if (document.getElementById('conv-type')) {
        updateUnits();
    }
});
