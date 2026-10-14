// Kalkulyator holati (State)
let currentInput = '0';
let previousInput = '';
let operation = null;
let shouldResetScreen = false;
let history = JSON.parse(localStorage.getItem('calc_history') || '[]');

// DOM elementlari
const currDisplay = document.getElementById('currInput');
const prevDisplay = document.getElementById('prevOp');
const themeBtn = document.getElementById('themeBtn');
const historyBtn = document.getElementById('historyBtn');
const historyOverlay = document.getElementById('historyOverlay');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Displeyni yangilash
function updateDisplay() {
    currDisplay.textContent = formatNumber(currentInput);
    if (operation != null) {
        prevDisplay.textContent = `${formatNumber(previousInput)} ${operation}`;
    } else {
        prevDisplay.textContent = '';
    }

    // Raqamlar sig'imi bo'yicha shrift o'lchamini moslashtirish
    if (currentInput.length > 9) {
        currDisplay.style.fontSize = '30px';
    } else if (currentInput.length > 7) {
        currDisplay.style.fontSize = '36px';
    } else {
        currDisplay.style.fontSize = '42px';
    }
}

// Raqamlarni chiroyli formatlash (3 xonadan probel qo'yish)
function formatNumber(numStr) {
    if (numStr === '' || numStr === undefined) return '';
    if (numStr === 'Xato') return 'Xato';
    const parts = numStr.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
}

// Raqam qo'shish
function appendNumber(num) {
    if (currentInput === '0' || shouldResetScreen) {
        currentInput = num.toString();
        shouldResetScreen = false;
    } else {
        if (currentInput.replace('.', '').length >= 15) return;
        currentInput += num.toString();
    }
    updateDisplay();
}

// O'nlik nuqta qo'shish
function appendDecimal() {
    if (shouldResetScreen) {
        currentInput = '0.';
        shouldResetScreen = false;
        updateDisplay();
        return;
    }
    if (!currentInput.includes('.')) {
        currentInput += '.';
        updateDisplay();
    }
}

// Hammasini tozalash (AC)
function clearAll() {
    currentInput = '0';
    previousInput = '';
    operation = null;
    updateDisplay();
}

// Bitta belgini o'chirish (⌫)
function deleteDigit() {
    if (shouldResetScreen) return;
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
        currentInput = '0';
    } else {
        currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
}

// Arifmetik amalni tanlash (+, -, ×, ÷)
function chooseOperation(op) {
    if (currentInput === 'Xato') clearAll();
    if (operation !== null && !shouldResetScreen) {
        compute();
    }
    operation = op;
    previousInput = currentInput;
    shouldResetScreen = true;
    updateDisplay();
}

// Foizni hisoblash (%)
function calculatePercent() {
    const current = parseFloat(currentInput);
    if (isNaN(current)) return;
    currentInput = (current / 100).toString();
    updateDisplay();
}

// Natijani hisoblash (=)
function compute() {
    let computation;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);

    if (isNaN(prev) || isNaN(current) || operation === null) return;

    switch (operation) {
        case '+':
            computation = prev + current;
            break;
        case '-':
            computation = prev - current;
            break;
        case '×':
            computation = prev * current;
            break;
        case '÷':
            if (current === 0) {
                currentInput = 'Xato';
                previousInput = '';
                operation = null;
                updateDisplay();
                return;
            }
            computation = prev / current;
            break;
        default:
            return;
    }

    // Float xatolarini to'g'irlash
    computation = Math.round(computation * 10000000000) / 10000000000;

    // Tarixga yozish
    saveHistory(`${previousInput} ${operation} ${currentInput}`, computation);

    currentInput = computation.toString();
    operation = null;
    previousInput = '';
    shouldResetScreen = true;
    updateDisplay();
}

// Hisob tarixini saqlash
function saveHistory(expr, res) {
    history.unshift({ expr, res });
    if (history.length > 25) history.pop();
    localStorage.setItem('calc_history', JSON.stringify(history));
    renderHistory();
}

// Tarix ro'yxatini chiqarish
function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 30px;">Hozircha tarix mavjud emas</div>';
        return;
    }
    historyList.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="hist-expr">${item.expr} =</div>
            <div class="hist-res">${formatNumber(item.res)}</div>
        `;
        div.addEventListener('click', () => {
            currentInput = item.res.toString();
            shouldResetScreen = false;
            updateDisplay();
            historyOverlay.classList.remove('active');
        });
        historyList.appendChild(div);
    });
}

// Tugmalarga bosish hodisasi (Event Delegation)
document.querySelector('.keypad').addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const num = target.dataset.num;
    const op = target.dataset.operator;
    const action = target.dataset.action;

    if (num !== undefined) appendNumber(num);
    if (op !== undefined) chooseOperation(op);
    if (action === 'clear') clearAll();
    if (action === 'delete') deleteDigit();
    if (action === 'decimal') appendDecimal();
    if (action === 'calculate') compute();
    if (action === 'percent') calculatePercent();
});

// Klaviatura orqali boshqarish
window.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9')) {
        appendNumber(e.key);
    } else if (e.key === '.' || e.key === ',') {
        appendDecimal();
    } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        compute();
    } else if (e.key === 'Backspace') {
        deleteDigit();
    } else if (e.key === 'Escape') {
        clearAll();
    } else if (e.key === '+') {
        chooseOperation('+');
    } else if (e.key === '-') {
        chooseOperation('-');
    } else if (e.key === '*') {
        chooseOperation('×');
    } else if (e.key === '/') {
        e.preventDefault();
        chooseOperation('÷');
    } else if (e.key === '%') {
        calculatePercent();
    }
});

// Tarix oynasini ochish / yopish
historyBtn.addEventListener('click', () => {
    renderHistory();
    historyOverlay.classList.add('active');
});

closeHistoryBtn.addEventListener('click', () => {
    historyOverlay.classList.remove('active');
});

clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
});

// Mavzu (Dark / Light) almashtirish
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

// Dastlabki ko'rinish
updateDisplay();
