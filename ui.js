import { AutomatonLogic } from './logic.js';

const logic = new AutomatonLogic();
const inputEl = document.getElementById('regex-input');
const validationStatusEl = document.getElementById('validation-status');
const outputContainer = document.getElementById('output-container');
const themeSwitcher = document.getElementById('theme-switcher');

// --- DEBOUNCE PARA ENTRADA EN TIEMPO REAL ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- MANEJADORES DE EVENTOS ---
inputEl.addEventListener('input', debounce(handleConversion, 500));
themeSwitcher.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    if (outputContainer.innerHTML.trim() !== '') {
        handleConversion();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

function handleValidation(regex) {
    const validation = logic.validate(regex);
    validationStatusEl.textContent = validation.message;
    validationStatusEl.className = validation.valid ? 'valid' : 'invalid';
    validationStatusEl.classList.add('visible');
    if (!regex.trim()) validationStatusEl.classList.remove('visible');
    return validation.valid;
}

function handleConversion() {
    const regex = inputEl.value;
    if (!handleValidation(regex)) {
        outputContainer.innerHTML = '';
        return;
    }

    try {
        const { nfa, dfa, minDfa } = logic.convert(regex);
        
        // Limpiar contenedor y crear columnas
        outputContainer.innerHTML = '';
        const nfaCol = createAutomatonColumn('nfa', 'AFN-&epsilon;');
        const dfaCol = createAutomatonColumn('dfa', 'AFD');
        const minDfaCol = createAutomatonColumn('minDfa', 'AFD Mínimo');
        outputContainer.append(nfaCol, dfaCol, minDfaCol);

        // Dibujar autómatas
        drawAutomaton(nfa, 'nfa');
        drawAutomaton(dfa, 'dfa');
        drawAutomaton(minDfa, 'minDfa');
        
        // Hacer visibles con animación
        setTimeout(() => {
            nfaCol.classList.add('visible');
            dfaCol.classList.add('visible');
            minDfaCol.classList.add('visible');
        }, 50);

    } catch (e) {
        validationStatusEl.textContent = e.message;
        validationStatusEl.className = 'invalid visible';
        outputContainer.innerHTML = '';
    }
}

function createAutomatonColumn(id, title) {
    const col = document.createElement('div');
    col.className = 'automata-column';
    col.id = `${id}-column`;
    col.innerHTML = `
        <h2>${title}</h2>
        <div id="${id}-network" class="vis-network-container"></div>
        <div class="string-tester">
            <input type="text" id="${id}-string-input" placeholder="Probar cadena...">
            <div id="${id}-string-result" class="string-tester-result"></div>
        </div>
        <div class="table-wrapper" id="${id}-table"></div>
    `;
    // Añadir listener para la prueba de cadenas
    const input = col.querySelector(`#${id}-string-input`);
    input.addEventListener('input', debounce((e) => handleStringTest(id), 300));
    return col;
}

function handleStringTest(automatonId) {
    const input = document.getElementById(`${automatonId}-string-input`).value;
    const resultEl = document.getElementById(`${automatonId}-string-result`);
    
    if (input === '') {
        resultEl.classList.remove('visible');
        return;
    }

    const regex = document.getElementById('regex-input').value;
    const { dfa, minDfa } = logic.convert(regex); // Solo necesitamos los DFAs para evaluar
    
    let isAccepted = false;
    if (automatonId === 'dfa') {
        isAccepted = logic.evaluateDfa(dfa, input);
    } else if (automatonId === 'minDfa') {
        isAccepted = logic.evaluateDfa(minDfa, input);
    } else { // No se puede evaluar NFA directamente de forma simple
        resultEl.textContent = 'Evaluación no disponible';
        resultEl.className = 'string-tester-result visible';
        return;
    }
    
    resultEl.textContent = isAccepted ? 'Aceptada' : 'Rechazada';
    resultEl.className = `string-tester-result visible ${isAccepted ? 'accepted' : 'rejected'}`;
}

// --- FUNCIÓN DE DIBUJO ---
function drawAutomaton(automaton, id) {
    const container = document.getElementById(`${id}-network`);
    const isDarkMode = document.body.classList.contains('dark-mode');

    const nodesData = automaton.states.map(state => ({
        id: state,
        label: state,
        shape: 'circle',
        size: 25,
        font: { size: 16, face: 'Inter', color: isDarkMode ? '#f9fafb' : '#1a202c' },
        color: {
            border: state === automaton.startState ? '#22c55e' : isDarkMode ? '#4b5563' : '#cbd5e1',
            background: automaton.finalStates.includes(state) ? (isDarkMode ? '#3730a3' : '#e0e7ff') : (isDarkMode ? '#1f2937' : '#ffffff'),
            highlight: { border: 'var(--color-accent)', background: isDarkMode ? '#374151' : '#e2e8f0' }
        },
        borderWidth: 2.5
    }));
    
    const edgesData = automaton.transitions.map((t, i) => ({
        id: `${id}_e${i}`, from: t.from, to: t.to, label: t.label, arrows: 'to'
    }));

    const data = { nodes: new vis.DataSet(nodesData), edges: new vis.DataSet(edgesData) };
    const options = {
        layout: {
            hierarchical: {
                enabled: id === 'nfa',
                direction: 'LR', sortMethod: 'directed',
                levelSeparation: 200, nodeSpacing: 120
            },
        },
        physics: {
            enabled: id !== 'nfa',
            barnesHut: { gravitationalConstant: -8000, centralGravity: 0.1, springLength: 150, avoidOverlap: 0.5 },
            solver: 'barnesHut',
            stabilization: { iterations: 200 }
        },
        edges: {
            smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 },
            font: { align: 'top', color: 'var(--color-text-secondary)' },
            color: { color: 'var(--color-text-secondary)', highlight: 'var(--color-accent)' }
        },
    };

    new vis.Network(container, data, options);
    drawTransitionTable(automaton, document.getElementById(`${id}-table`), id);
}

function drawTransitionTable(automaton, tableEl) {
    const { states, transitions, startState, finalStates, alphabet } = automaton;
    const sortedAlphabet = [...alphabet].sort();
    
    let table = '<table><thead><tr><th>Estado</th>';
    sortedAlphabet.forEach(symbol => table += `<th>${symbol}</th>`);
    table += '</tr></thead><tbody>';

    const sortedStates = [...states].sort((a, b) => {
        const numA = parseInt((a.match(/\d+/) || [0])[0]);
        const numB = parseInt((b.match(/\d+/) || [0])[0]);
        const prefixA = a.match(/[a-zA-Z]+/)[0];
        const prefixB = b.match(/[a-zA-Z]+/)[0];
        if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
        return numA - numB;
    });

    sortedStates.forEach(state => {
        let stateLabel = state;
        if (state === startState) stateLabel = `→ ${stateLabel}`;
        if (finalStates.includes(state)) stateLabel = `* ${stateLabel}`;
        
        table += `<tr><td class="state-col">${stateLabel}</td>`;
        
        sortedAlphabet.forEach(symbol => {
            const targets = transitions.filter(t => t.from === state && t.label === symbol).map(t => t.to).sort();
            const cellContent = targets.length > 0 ? targets.join(', ') : '∅';
            table += `<td>${cellContent}</td>`;
        });
        table += '</tr>';
    });
    table += '</tbody></table>';
    tableEl.innerHTML = table;
}
