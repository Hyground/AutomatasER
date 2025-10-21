/**
 * Contiene toda la lógica pura para la conversión de ER,
 * minimización y evaluación de cadenas. No interactúa con el DOM.
 */
export class AutomatonLogic {
    constructor() {
        this.stateCounter = 0;
    }

    // --- 1. VALIDACIÓN ---
    validate(regex) {
        if (!regex.trim()) return { valid: false, message: 'La expresión está vacía.' };
        let balance = 0;
        for (const char of regex) {
            if (char === '(') balance++;
            else if (char === ')') balance--;
            if (balance < 0) return { valid: false, message: 'Paréntesis desbalanceados (sobra `)`).' };
        }
        if (balance !== 0) return { valid: false, message: 'Paréntesis desbalanceados (falta `)`).' };
        if (/[\.\|*+]{2,}/.test(regex)) return { valid: false, message: 'Operadores consecutivos inválidos.' };
        if (/[\.\|]\*|[\.\|]\?|[\.\|]\+|[\.\|]\)|[\(][\.\|*?+]/.test(regex)) return { valid: false, message: 'Secuencia de operadores inválida.' };
        if (/\|$/.test(regex) || /^[*?+]/.test(regex) || /^\./.test(regex) || /\|\)/.test(regex)) return { valid: false, message: 'Uso incorrecto de operadores.' };
        return { valid: true, message: 'Expresión Regular Válida' };
    }

    // --- 2. PREPROCESAMIENTO ---
    _preprocess(regex) {
        let result = '';
        for (let i = 0; i < regex.length; i++) {
            result += regex[i];
            if (i + 1 < regex.length) {
                const current = regex[i];
                const next = regex[i + 1];
                if (this._isConcatNeeded(current, next)) {
                    result += '.';
                }
            }
        }
        return result;
    }

    _isConcatNeeded(char, nextChar) {
        const alphabet = (c) => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');
        const needsConcatAfter = (c) => alphabet(c) || c === ')' || c === '*' || c === '+' || c === '?';
        const needsConcatBefore = (c) => alphabet(c) || c === '(';
        return needsConcatAfter(char) && needsConcatBefore(nextChar);
    }

    // --- 3. INFIX A POSTFIX (SHUNTING-YARD) ---
    _toPostfix(infix) {
        const precedence = { '|': 1, '.': 2, '?': 3, '*': 3, '+': 3 };
        let output = '';
        const operators = [];
        for (const char of infix) {
            if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
                output += char;
            } else if (char === '(') {
                operators.push(char);
            } else if (char === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output += operators.pop();
                }
                if (!operators.length) throw new Error("Error de sintaxis: Paréntesis desbalanceados.");
                operators.pop();
            } else {
                while (
                    operators.length &&
                    operators[operators.length - 1] !== '(' &&
                    precedence[operators[operators.length - 1]] >= precedence[char]
                ) {
                    output += operators.pop();
                }
                operators.push(char);
            }
        }
        while (operators.length) {
            output += operators.pop();
        }
        return output;
    }

    // --- 4. POSTFIX A AFN (THOMPSON) ---
    _postfixToNfa(postfix) {
        this.stateCounter = 0;
        const stack = [];
        const newS = () => `q${this.stateCounter++}`;

        if (postfix.length === 0) return { states: [], startState: null, finalStates: [], transitions: [], alphabet: [] };

        for (const char of postfix) {
            if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
                const start = newS(), end = newS();
                stack.push({ states: [start, end], startState: start, finalStates: [end], transitions: [{ from: start, to: end, label: char }] });
            } else if (char === '.') {
                if (stack.length < 2) throw new Error("Error de sintaxis: Operador de concatenación inválido.");
                const nfa2 = stack.pop(), nfa1 = stack.pop();
                nfa1.finalStates.forEach(s => nfa1.transitions.push({ from: s, to: nfa2.startState, label: 'ε' }));
                stack.push({ states: [...new Set([...nfa1.states, ...nfa2.states])], startState: nfa1.startState, finalStates: nfa2.finalStates, transitions: [...nfa1.transitions, ...nfa2.transitions] });
            } else if (char === '|') {
                if (stack.length < 2) throw new Error("Error de sintaxis: Operador de unión inválido.");
                const nfa2 = stack.pop(), nfa1 = stack.pop();
                const start = newS(), end = newS();
                nfa1.finalStates.forEach(s => nfa1.transitions.push({ from: s, to: end, label: 'ε' }));
                nfa2.finalStates.forEach(s => nfa2.transitions.push({ from: s, to: end, label: 'ε' }));
                stack.push({ states: [start, end, ...nfa1.states, ...nfa2.states], startState: start, finalStates: [end], transitions: [...nfa1.transitions, ...nfa2.transitions, { from: start, to: nfa1.startState, label: 'ε' }, { from: start, to: nfa2.startState, label: 'ε' }] });
            } else if (char === '*') {
                 if (stack.length < 1) throw new Error("Error de sintaxis: Operador Kleene (*) inválido.");
                const nfa = stack.pop(); const start = newS(), end = newS();
                nfa.finalStates.forEach(s => {
                    nfa.transitions.push({ from: s, to: nfa.startState, label: 'ε' });
                    nfa.transitions.push({ from: s, to: end, label: 'ε' });
                });
                stack.push({ states: [start, end, ...nfa.states], startState: start, finalStates: [end], transitions: [...nfa.transitions, { from: start, to: nfa.startState, label: 'ε' }, { from: start, to: end, label: 'ε' }] });
            }
        }
        if (stack.length !== 1) throw new Error("Error de sintaxis: La expresión está mal formada.");
        
        const resultNfa = stack.pop();
        resultNfa.alphabet = [...new Set(resultNfa.transitions.map(t => t.label))];
        return resultNfa;
    }

    // --- 5. AFN A AFD (SUBSET CONSTRUCTION) ---
    _nfaToDfa(nfa) {
        const alphabet = [...new Set(nfa.transitions.map(t => t.label).filter(l => l !== 'ε'))];
        const epsilonClosure = (states) => {
            let closure = new Set(states), stack = [...states];
            while (stack.length) {
                const s = stack.pop();
                nfa.transitions.filter(t => t.from === s && t.label === 'ε' && !closure.has(t.to)).forEach(t => { closure.add(t.to); stack.push(t.to); });
            }
            return Array.from(closure).sort();
        };
        const move = (states, symbol) => {
            const reachable = new Set();
            states.forEach(s => { nfa.transitions.filter(t => t.from === s && t.label === symbol).forEach(t => reachable.add(t.to)); });
            return Array.from(reachable);
        };

        if (!nfa.startState) return { states: [], startState: null, finalStates: [], transitions: [], alphabet: [] };

        const dfaStates = new Map();
        const dfaTransitions = [];
        const initialDfaStateSet = epsilonClosure([nfa.startState]);
        const dfaStateQueue = [initialDfaStateSet];
        const initialDfaStateName = "S0";
        dfaStates.set(initialDfaStateSet.join(','), { name: initialDfaStateName, nfaStates: initialDfaStateSet });
        let dfaStateCounter = 1;

        while (dfaStateQueue.length > 0) {
            const currentNfaStates = dfaStateQueue.shift();
            const currentDfaState = dfaStates.get(currentNfaStates.join(','));

            alphabet.forEach(symbol => {
                const nextNfaStatesSet = epsilonClosure(move(currentNfaStates, symbol));
                if (nextNfaStatesSet.length === 0) return;

                const nextNfaStatesKey = nextNfaStatesSet.join(',');
                let nextDfaState = dfaStates.get(nextNfaStatesKey);

                if (!nextDfaState) {
                    const newDfaStateName = `S${dfaStateCounter++}`;
                    nextDfaState = { name: newDfaStateName, nfaStates: nextNfaStatesSet };
                    dfaStates.set(nextNfaStatesKey, nextDfaState);
                    dfaStateQueue.push(nextNfaStatesSet);
                }
                dfaTransitions.push({ from: currentDfaState.name, to: nextDfaState.name, label: symbol });
            });
        }
        const finalDfaStates = [];
        dfaStates.forEach(dfaState => {
             if (dfaState.nfaStates.some(nfaState => nfa.finalStates.includes(nfaState))) {
                finalDfaStates.push(dfaState.name);
            }
        });

        return {
            states: Array.from(dfaStates.values()).map(s => s.name),
            startState: initialDfaStateName,
            finalStates: finalDfaStates,
            transitions: dfaTransitions,
            alphabet: alphabet
        };
    }
    
    // --- 6. MINIMIZACIÓN DE AFD (TABLE-FILLING) ---
    _minimizeDfa(dfa) {
        let P = [
            dfa.states.filter(s => dfa.finalStates.includes(s)),
            dfa.states.filter(s => !dfa.finalStates.includes(s))
        ].filter(group => group.length > 0);
        
        let W = [...P];
        
        while (W.length > 0) {
            const A = W.shift();
            for (const symbol of dfa.alphabet) {
                const X = dfa.transitions
                    .filter(t => t.label === symbol && A.includes(t.to))
                    .map(t => t.from);

                for (let i = P.length - 1; i >= 0; i--) {
                    const Y = P[i];
                    const I1 = Y.filter(y => X.includes(y));
                    const I2 = Y.filter(y => !X.includes(y));
                    
                    if (I1.length > 0 && I2.length > 0) {
                        P.splice(i, 1, I1, I2);
                        const Y_index = W.findIndex(group => group.every(val => Y.includes(val)) && group.length === Y.length);
                        if (Y_index > -1) {
                            W.splice(Y_index, 1, I1, I2);
                        } else {
                            if (I1.length <= I2.length) {
                                W.push(I1);
                            } else {
                                W.push(I2);
                            }
                        }
                    }
                }
            }
        }
        
        const stateMap = {};
        const newStates = P.map((group, i) => {
            const newStateName = `M${i}`;
            group.forEach(oldState => { stateMap[oldState] = newStateName; });
            return newStateName;
        });

        const newTransitions = [];
        dfa.transitions.forEach(t => {
            const newFrom = stateMap[t.from];
            const newTo = stateMap[t.to];
            if (!newTransitions.some(nt => nt.from === newFrom && nt.to === newTo && nt.label === t.label)) {
                newTransitions.push({ from: newFrom, to: newTo, label: t.label });
            }
        });
        
        return {
            states: newStates,
            startState: stateMap[dfa.startState],
            finalStates: dfa.finalStates.map(s => stateMap[s]).filter((v, i, a) => a.indexOf(v) === i),
            transitions: newTransitions,
            alphabet: dfa.alphabet
        };
    }
    
    // --- 7. EVALUACIÓN DE CADENAS ---
    evaluateDfa(dfa, inputString) {
        if (!dfa.startState) return false;
        let currentState = dfa.startState;
        for (const symbol of inputString) {
            if (!dfa.alphabet.includes(symbol)) return false;
            const transition = dfa.transitions.find(t => t.from === currentState && t.label === symbol);
            if (!transition) return false;
            currentState = transition.to;
        }
        return dfa.finalStates.includes(currentState);
    }

    // --- PUNTO DE ENTRADA PRINCIPAL ---
    convert(regex) {
        const validation = this.validate(regex);
        if (!validation.valid) throw new Error(validation.message);
        
        const processed = this._preprocess(regex);
        const postfix = this._toPostfix(processed);
        const nfa = this._postfixToNfa(postfix);
        const dfa = this._nfaToDfa(nfa);
        const minDfa = this._minimizeDfa(dfa);
        
        return { nfa, dfa, minDfa };
    }
}

