import { ConversorDirecto } from '../logic/directo-afd.js';

// === FUNCIÓN DE DIBUJO DE AFD (Mantenida) ===
function dibujarAFD(dfa, containerId) {
    const dfaContainer = document.getElementById(containerId);
    if (!dfaContainer) return;

    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');
    const nodeColor = isDarkMode ? '#6ab0ff' : '#007bff';
    const nodeBgColor = isDarkMode ? '#343434' : '#f0f0f0';
    const finalBorderColor = isDarkMode ? '#4cd17a' : '#28a745';
    const finalBgColor = isDarkMode ? '#2e4f4f' : '#e6ffe6';
    const edgeColor = isDarkMode ? '#b0b0b0' : '#4b5563';
    const fontColor = isDarkMode ? '#ffffff' : '#333333';
    
    // 1. Crear Nodos
    const nodes = dfa.states.map(state => {
        const isFinal = dfa.finalStates.includes(state);
        const hasSets = dfa.stateSets && Object.prototype.hasOwnProperty.call(dfa.stateSets, state);
        const setArr = hasSets ? dfa.stateSets[state] : null;
        const label = Array.isArray(setArr) ? (setArr.length ? `${state}\n{${setArr.join(',')}}` : `${state}\n∅`) : state; 
        
        return {
            id: state,
            label: label,
            shape: 'circle',
            font: { color: fontColor, multi: true, align: 'center', size: 14, face: 'Inter' },
            color: {
                border: isFinal ? finalBorderColor : nodeColor,
                background: isFinal ? finalBgColor : nodeBgColor,
                highlight: { border: isFinal ? finalBorderColor : nodeColor, background: isFinal ? finalBgColor : nodeBgColor }
            },
            borderWidth: 2,
            shadow: true,
        };
    });

    // 2. Crear Aristas
    const grouped = new Map();
    for (const t of dfa.transitions) {
        const key = `${t.from}->${t.to}`;
        if (!grouped.has(key)) grouped.set(key, { from: t.from, to: t.to, items: [] });
        grouped.get(key).items.push(t);
    }

    const edges = [];
    let edgeId = 0;
    for (const g of grouped.values()) {
        const isSelf = g.from === g.to;
        const labels = Array.from(new Set(g.items.map(i => i.label))).sort().join(',');
        
        edges.push({
            id: `e${edgeId++}`,
            from: g.from,
            to: g.to,
            label: labels,
            arrows: { to: { enabled: true, scaleFactor: 0.8 } },
            width: 1.5,
            color: { color: edgeColor },
            font: { size: 14, color: edgeColor, background: isDarkMode ? '#1e1e1e' : '#ffffff', face: 'Inter' },
            smooth: isSelf ? { type: 'self', roundness: 0.5 } : { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.25 },
        });
    }

    // 3. Nodo de inicio ficticio para flecha de estado inicial
    const startNodeId = '__START__';
    nodes.push({
        id: startNodeId, label: '', shape: 'box', size: 0.1,
        color: { border: 'rgba(0,0,0,0)', background: 'rgba(0,0,0,0)' },
        physics: true
    });

    // 4. Arista hacia el estado inicial (flecha de entrada)
    edges.unshift({
        id: 'start-edge', from: startNodeId, to: dfa.startState, label: '',
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        dashes: true, smooth: false, width: 1.5, length: 25,
        color: { color: edgeColor }
    });

    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };

    const options = {
        layout: { hierarchical: false },
        physics: {
            solver: 'barnesHut',
            barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 100 },
        },
        edges: { font: { face: 'Inter' } },
        nodes: { font: { face: 'Inter' } }
    };

    new vis.Network(dfaContainer, data, options);
}

// === LÓGICA DE VALIDACIÓN PRINCIPAL ===

document.addEventListener('DOMContentLoaded', () => {
    // Lógica del modo oscuro/claro (Mantenida)
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️'; 
    } else {
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙'; 
    }

    // CORRECCIÓN: Se añade comprobación explícita para asegurar que el listener se adjunte.
    if (themeToggleBtn) { 
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDarkMode = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
        });
    }
    // --- Fin Lógica de Tema ---

    // Elementos del DOM
    const regexInput = document.getElementById('regex-input');
    const inputTextarea = document.getElementById('input-text');
    const validateButton = document.getElementById('validate-btn');
    const validationResult = document.getElementById('validation-result');
    const resultsContainer = document.getElementById('results-container');
    const validationPathContainer = document.getElementById('validation-path');
    const dfaDiagramContainer = document.getElementById('dfa-diagram');
    const exampleChainAnalysisContainer = document.getElementById('example-chain-analysis'); // Nuevo contenedor

    resultsContainer.style.display = 'none';

    // Instancia del conversor
    const conversor = new ConversorDirecto();

    /**
     * Simula el recorrido de una cadena en un AFD generado.
     */
    function validateStringWithAFD(dfa, inputString) {
        let currentState = dfa.startState;
        
        // CORRECCIÓN: El paso inicial va del estado inicial (S0) al estado inicial (S0)
        const path = [{ step: 0, char: 'Inicio', currentState: currentState, nextState: currentState }];

        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];
            const transition = dfa.transitions.find(t => t.from === currentState && t.label === char);

            let nextState = 'RECHAZADO';

            if (transition) {
                nextState = transition.to;
            }

            path.push({
                step: i + 1,
                char: char,
                currentState: currentState,
                nextState: nextState
            });

            if (nextState === 'RECHAZADO') {
                return { isValid: false, path };
            }
            currentState = nextState;
        }

        const isValid = dfa.finalStates.includes(currentState);
        
        // El último "nextState" se ajusta para indicar si es aceptado o rechazado
        if (path.length > 1) {
            path[path.length - 1].nextState = isValid ? 'ACEPTADO' : 'RECHAZADO';
        }

        return { isValid, path };
    }


    /**
     * Dibuja la tabla de recorrido del validador.
     */
    function renderValidationPath(path, isValid, isDarkMode) {
        let html = '<table class="detail-table"><thead><tr><th>Paso</th><th>Símbolo</th><th>Estado Actual</th><th>Próximo Estado</th></tr></thead><tbody>';
        
        path.forEach((p, index) => {
            let rowClass = '';
            
            if (index === path.length - 1) {
                // Último paso (Resultado final)
                rowClass = isValid ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
            }

            html += `
                <tr class="${rowClass}">
                    <td>${p.step}</td>
                    <td>${p.char}</td>
                    <td>${p.currentState}</td>
                    <td>${p.nextState}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        validationPathContainer.innerHTML = html;
        
        // Añadir estilo CSS para resaltar (usando clases Tailwind simuladas)
        const style = document.createElement('style');
        style.innerHTML = `
            .bg-green-100 { background-color: #d4edda; }
            .bg-red-100 { background-color: #f8d7da; }
            .dark .bg-green-900 { background-color: #064e3b; }
            .dark .bg-red-900 { background-color: #7f1d1d; }
        `;
        document.head.appendChild(style);
    }


    /**
     * Dibuja el resultado de la validación VÁLIDO/INVÁLIDO.
     */
    function renderValidationResult(isValid, isError, message) {
        validationResult.style.display = 'block';
        const body = document.body;
        const isDarkMode = body.classList.contains('dark-mode');
        
        let bgColor, color;

        if (isError) {
            bgColor = isDarkMode ? 'rgba(114, 28, 36, 0.3)' : '#f8d7da';
            color = isDarkMode ? '#f5c6cb' : '#721c24';
        } else if (isValid) {
            bgColor = isDarkMode ? 'rgba(21, 87, 36, 0.3)' : '#d4edda';
            color = isDarkMode ? '#c3e6cb' : '#155724';
        } else {
            bgColor = isDarkMode ? 'rgba(133, 100, 4, 0.3)' : '#fff3cd';
            color = isDarkMode ? '#ffeeba' : '#856404';
        }

        validationResult.innerHTML = `<p style="margin: 0; font-weight: bold;">${message}</p>`;
        validationResult.style.backgroundColor = bgColor;
        validationResult.style.color = color;
        validationResult.style.border = `1px solid ${color}`;
        validationResult.style.fontWeight = 'bold';
    }
    
    // --- FUNCIÓN ADICIONAL: GENERACIÓN Y ANÁLISIS DE CADENAS DE EJEMPLO ---
    
    /**
     * Genera cadenas de ejemplo (simples) basadas en el alfabeto de la ER.
     */
    function generateExampleChains(alphabet) {
        // Aseguramos que el alfabeto no incluya el símbolo de fin de cadena '#'
        const chars = alphabet.filter(c => c !== '#'); 
        if (chars.length === 0) return [];

        const examples = [];
        
        // Ejemplo 1: Cadena mínima (si existe) o un símbolo repetido 3 veces
        const minLengthChain = chars[0].repeat(Math.min(3, chars.length));
        examples.push(minLengthChain);

        // Ejemplo 2: Una mezcla simple de símbolos
        let mixedChain = '';
        for (let i = 0; i < 4; i++) {
            mixedChain += chars[i % chars.length];
        }
        examples.push(mixedChain);

        // Ejemplo 3: Cadena larga para probar iteración
        let longChain = '';
        for (let i = 0; i < 6; i++) {
            longChain += chars[Math.floor(Math.random() * chars.length)];
        }
        examples.push(longChain);

        // Si la ER es simple, añadir la cadena vacía para probar (ε)
        if (chars.length <= 2) examples.unshift('ε (cadena vacía)');
        
        return Array.from(new Set(examples)).slice(0, 3);
    }
    
    /**
     * Dibuja la tabla con la validación de cadenas de ejemplo.
     */
    function renderExampleChainAnalysis(dfa, regexText) {
        const alphabet = dfa.alphabet;
        const examples = generateExampleChains(alphabet);
        
        let html = '<table class="detail-table"><thead><tr><th>Cadena de Ejemplo</th><th>Resultado de Validación</th><th>Observación</th></tr></thead><tbody>';

        examples.forEach(chain => {
            const input = (chain === 'ε (cadena vacía)') ? '' : chain; // La cadena vacía es una cadena de longitud 0
            const validation = validateStringWithAFD(dfa, input);
            const isValid = validation.isValid;
            
            let resultText = isValid ? 'ACEPTADA' : 'RECHAZADA';
            let rowClass = isValid ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
            let observation = isValid ? 'Pertenece al lenguaje' : 'No pertenece al lenguaje';

            if (chain === 'ε (cadena vacía)') {
                observation = `Evalúa si la longitud cero es aceptada por ${regexText}`;
            }

            html += `
                <tr class="${rowClass}">
                    <td>${chain}</td>
                    <td>${resultText}</td>
                    <td>${observation}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        exampleChainAnalysisContainer.innerHTML = html;
    }
    // -----------------------------------------------------------


    // --- MANEJADOR DE EVENTO PRINCIPAL ---
    validateButton?.addEventListener('click', () => {
        const regexText = regexInput.value.trim();
        const inputText = inputTextarea.value;
        const body = document.body;
        const isDarkMode = body.classList.contains('dark-mode');
        
        resultsContainer.style.display = 'grid';
        
        // 1. Validación de entradas
        if (!regexText) {
            renderValidationResult(false, true, 'Por favor, ingresa una Expresión Regular.');
            dfaDiagramContainer.innerHTML = '';
            validationPathContainer.innerHTML = '';
            exampleChainAnalysisContainer.innerHTML = '';
            return;
        }

        try {
            // 2. Generación del AFD (Conversión Directa)
            const { dfa } = conversor.convertir(regexText);
            
            // 3. Dibujar el AFD
            dibujarAFD(dfa, 'dfa-diagram');

            // 4. Validar la cadena de entrada usando el AFD generado
            const validation = validateStringWithAFD(dfa, inputText);

            // 5. Renderizar Resultado Final
            const resultMessage = validation.isValid
                ? `✅ ¡VALIDACIÓN EXITOSA! La cadena **"${inputText}"** es aceptada por el AFD.`
                : `❌ ¡VALIDACIÓN FALLIDA! La cadena **"${inputText}"** NO es aceptada por el AFD.`;
            
            renderValidationResult(validation.isValid, false, resultMessage);

            // 6. Renderizar Recorrido
            renderValidationPath(validation.path, validation.isValid, isDarkMode);
            
            // 7. Renderizar Análisis de Cadenas de Ejemplo
            renderExampleChainAnalysis(dfa, regexText);

        } catch (e) {
            console.error("Error al construir AFD o validar:", e);
            renderValidationResult(false, true, `⚠️ Error al procesar la ER: ${e.message}. Verifica la sintaxis. (Ej: a|b, a*, (ab)*)`);
            dfaDiagramContainer.innerHTML = 'Hubo un error al construir el AFD.';
            validationPathContainer.innerHTML = '';
            exampleChainAnalysisContainer.innerHTML = '';
        }
    });

    // Añadir estilos para que los nuevos contenedores se vean bien
    const style = document.createElement('style');
    style.innerHTML = `
        .validator-controls {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .input-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: var(--color-text-default);
        }
        .validator-controls input[type="text"], .validator-controls textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            font-size: 1em;
            background-color: var(--color-background);
            color: var(--color-text-default);
            box-sizing: border-box;
        }
        .result-box {
            padding: 15px;
            border-radius: var(--border-radius);
            font-size: 1.1em;
            margin-bottom: 20px;
            text-align: center;
        }
        #dfa-diagram {
            height: 350px;
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            margin-bottom: 20px;
            background-color: var(--color-surface);
        }
        .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .detail-table th, .detail-table td {
            padding: 12px;
            text-align: left;
            border: 1px solid var(--color-border);
        }
        .detail-table th {
            background-color: var(--color-primary);
            color: white;
            text-transform: uppercase;
        }
        .detail-table tr:nth-child(even) {
            background-color: var(--color-surface-hover);
        }
    `;
    document.head.appendChild(style);
});