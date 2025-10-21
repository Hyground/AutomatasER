// --- LIBRERÍA SIMULADA ---
const RegexLibrary = {
    convert(regex) {
        // Esta es una simulación. Devuelve una estructura de datos
        // predefinida para una ER simple como (a|b)*a
        if (!regex) return { nfa: null, dfa: null, minDfa: null };
        const nfa = {
            states: ['q0', 'q1', 'q2', 'q3', 'q4'],
            startState: 'q0',
            finalStates: ['q4'],
            alphabet: ['a', 'b', 'ε'],
            transitions: [
                { from: 'q0', to: 'q1', label: 'ε' }, { from: 'q0', to: 'q3', label: 'ε' },
                { from: 'q1', to: 'q2', label: 'a' }, { from: 'q3', to: 'q1', label: 'b' },
                { from: 'q2', to: 'q4', label: 'ε' }, { from: 'q3', to: 'q3', label: 'b' },
                { from: 'q1', to: 'q4', label: 'a' }
            ]
        };
        const dfa = {
            states: ['S0', 'S1'], startState: 'S0', finalStates: ['S1'], alphabet: ['a', 'b'],
            transitions: [
                { from: 'S0', to: 'S1', label: 'a' }, { from: 'S0', to: 'S0', label: 'b' },
                { from: 'S1', to: 'S1', label: 'a' }, { from: 'S1', to: 'S0', label: 'b' }
            ]
        };
        const minDfa = dfa; // En la simulación, el AFD ya es mínimo.
        return { nfa, dfa, minDfa };
    }
};

// --- LÓGICA DE UI SIMPLIFICADA ---
const inputEl = document.getElementById('regex-input');
const validationStatusEl = document.getElementById('validation-status');
const outputContainer = document.getElementById('output-container');
const themeSwitcher = document.getElementById('theme-switcher');

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

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

function handleConversion() {
    const regex = inputEl.value;
    if (!regex.trim()) {
        outputContainer.innerHTML = '';
        validationStatusEl.classList.remove('visible');
        return;
    }
    
    validationStatusEl.textContent = 'Conversión simulada con librería.';
    validationStatusEl.className = 'valid visible';

    const { nfa, dfa, minDfa } = RegexLibrary.convert(regex);

    outputContainer.innerHTML = '';
    const nfaCol = createAutomatonColumn('nfa', 'AFN (Simulado)');
    const dfaCol = createAutomatonColumn('dfa', 'AFD (Simulado)');
    const minDfaCol = createAutomatonColumn('minDfa', 'AFD Mínimo (Simulado)');
    outputContainer.append(nfaCol, dfaCol, minDfaCol);

    drawAutomaton(nfa, 'nfa');
    drawAutomaton(dfa, 'dfa');
    drawAutomaton(minDfa, 'minDfa');
    
    setTimeout(() => {
        nfaCol.classList.add('visible');
        dfaCol.classList.add('visible');
        minDfaCol.classList.add('visible');
    }, 50);
}

function createAutomatonColumn(id, title) {
    const col = document.createElement('div');
    col.className = 'automata-column';
    col.id = `${id}-column`;
    col.innerHTML = `
        <h2>${title}</h2>
        <div id="${id}-network" class="vis-network-container"></div>
        <div class="table-wrapper" id="${id}-table"></div>
    `;
    return col;
}

function drawAutomaton(automaton, id) {
    const container = document.getElementById(`${id}-network`);
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (!automaton) return;

    const nodesData = automaton.states.map(state => ({
        id: state, label: state, shape: 'circle', size: 25,
        font: { size: 16, face: 'Inter', color: isDarkMode ? '#f9fafb' : '#1a202c' },
        color: {
            border: state === automaton.startState ? '#22c55e' : isDarkMode ? '#4b5563' : '#cbd5e1',
            background: automaton.finalStates.includes(state) ? (isDarkMode ? '#3730a3' : '#e0e7ff') : (isDarkMode ? '#1f2937' : '#ffffff'),
            highlight: { border: 'var(--color-accent)', background: isDarkMode ? '#374151' : '#e2e8f0' }
        },
        borderWidth: 2.5
    }));
    
    const edgesData = automaton.transitions.map((t, i) => ({ id: `${id}_e${i}`, from: t.from, to: t.to, label: t.label, arrows: 'to' }));
    
    const data = { nodes: new vis.DataSet(nodesData), edges: new vis.DataSet(edgesData) };
    const options = { /* Opciones de layout similares a ui.js */ };
    new vis.Network(container, data, options);
    drawTransitionTable(automaton, document.getElementById(`${id}-table`));
}

function drawTransitionTable(automaton, tableEl) {
    if (!automaton) return;
    const { states, alphabet, transitions, startState, finalStates } = automaton;
    let table = '<table><thead><tr><th>Estado</th>';
    alphabet.forEach(symbol => table += `<th>${symbol}</th>`);
    table += '</tr></thead><tbody>';
    states.forEach(state => {
        let stateLabel = state;
        if (state === startState) stateLabel = `→ ${stateLabel}`;
        if (finalStates.includes(state)) stateLabel = `* ${stateLabel}`;
        table += `<tr><td class="state-col">${stateLabel}</td>`;
        alphabet.forEach(symbol => {
            const targets = transitions.filter(t => t.from === state && t.label === symbol).map(t => t.to);
            table += `<td>${targets.join(', ') || '∅'}</td>`;
        });
        table += '</tr>';
    });
    table += '</tbody></table>';
    tableEl.innerHTML = table;
}
