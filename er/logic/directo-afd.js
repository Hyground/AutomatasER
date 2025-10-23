import { calcularFollowpos } from './followpos.js';

/**
 * Contiene la lógica para la conversión directa de una expresión regular a un AFD
 * utilizando el método del árbol de sintaxis y followpos.
 */
export class ConversorDirecto {
    constructor() {}

    convertir(regex) {
        const wrappedRegex = '(' + regex + ')';
        const augmentedRegex = wrappedRegex + '#';
        const preprocessedRegex = this._preprocesar(augmentedRegex);
        const ast = this._construirAST(preprocessedRegex);
        const { annotatedTree, numPositions, positionsToChars } = this._anotarArbol(ast);
        const followposTable = calcularFollowpos(annotatedTree, numPositions);
        const dfa = this._construirAFD(annotatedTree, followposTable, positionsToChars);

        // Log final results to the console
        const replacer = (key, value) => value instanceof Set ? [...value] : value;
        console.log("Tabla Followpos:", JSON.stringify(followposTable, replacer, 2));
        console.log("AFD Resultante:", dfa);

        return { ast: annotatedTree, followposTable, positionsToChars, dfa };
    }

    _preprocesar(regex) {
        let result = '';
        for (let i = 0; i < regex.length; i++) {
            result += regex[i];
            if (i + 1 < regex.length) {
                const current = regex[i];
                const next = regex[i + 1];
                const isAlphabet = (c) => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '#';
                const needsConcatAfter = (c) => isAlphabet(c) || c === ')' || c === '*';
                const needsConcatBefore = (c) => isAlphabet(c) || c === '(';
                if (needsConcatAfter(current) && needsConcatBefore(next)) {
                    result += '.';
                }
            }
        }
        return result;
    }

    _construirAST(infix) {
        const precedence = { '+': 1, '.': 2, '*': 3 };
        const operators = [];
        const nodes = [];

        const applyOperator = () => {
            const op = operators.pop();
            if (op === '*') {
                const child = nodes.pop();
                nodes.push({ type: 'kleene', child: child });
            } else {
                const right = nodes.pop();
                const left = nodes.pop();
                nodes.push({ type: op === '.' ? 'concat' : 'union', left, right });
            }
        };

        for (const char of infix) {
            if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char === '#') {
                nodes.push({ type: 'char', value: char });
            } else if (char === '(') {
                operators.push(char);
            } else if (char === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    applyOperator();
                }
                operators.pop();
            } else if (precedence[char]) {
                while (
                    operators.length &&
                    operators[operators.length - 1] !== '(' &&
                    precedence[operators[operators.length - 1]] >= precedence[char]
                ) {
                    applyOperator();
                }
                operators.push(char);
            }
        }

        while (operators.length > 0) {
            applyOperator();
        }

        return nodes[0];
    }

    _anotarArbol(ast) {
        let position = 0;
        const positionsToChars = {};
        
        const numerar = (node) => {
            if (!node) return;
            if (node.type === 'char') {
                position++;
                node.position = position;
                positionsToChars[position] = node.value;
            }
            numerar(node.left);
            numerar(node.right);
            numerar(node.child);
        };
        numerar(ast);

        const anotar = (node) => {
            if (!node) return;
            anotar(node.left);
            anotar(node.right);
            anotar(node.child);

            switch (node.type) {
                case 'char':
                    node.nullable = false;
                    node.firstpos = new Set([node.position]);
                    node.lastpos = new Set([node.position]);
                    break;
                case 'union':
                    node.nullable = node.left.nullable || node.right.nullable;
                    node.firstpos = new Set([...node.left.firstpos, ...node.right.firstpos]);
                    node.lastpos = new Set([...node.left.lastpos, ...node.right.lastpos]);
                    break;
                case 'concat':
                    node.nullable = node.left.nullable && node.right.nullable;
                    node.firstpos = node.left.nullable ? new Set([...node.left.firstpos, ...node.right.firstpos]) : node.left.firstpos;
                    node.lastpos = node.right.nullable ? new Set([...node.left.lastpos, ...node.right.lastpos]) : node.right.lastpos;
                    break;
                case 'kleene':
                    node.nullable = true;
                    node.firstpos = node.child.firstpos;
                    node.lastpos = node.child.lastpos;
                    break;
            }
        };

        anotar(ast);
        return { annotatedTree: ast, numPositions: position, positionsToChars };
    }

    _construirAFD(ast, followposTable, positionsToChars) {
        const initialState = ast.firstpos;
        const dStates = [initialState];
        const dTran = [];
        
        const unmarkedStates = [initialState];
        const stateNameMap = new Map();
        stateNameMap.set(JSON.stringify([...initialState].sort()), 'S0');
        let stateCounter = 1;

        const alphabet = [...new Set(Object.values(positionsToChars).filter(c => c !== '#'))];

        while (unmarkedStates.length > 0) {
            const S = unmarkedStates.shift();
            const sName = stateNameMap.get(JSON.stringify([...S].sort()));

            for (const char of alphabet) {
                let U = new Set();
                for (const pos of S) {
                    if (positionsToChars[pos] === char) {
                        followposTable[pos].forEach(p => U.add(p));
                    }
                }

                if (U.size > 0) {
                    const uKey = JSON.stringify([...U].sort());
                    if (!stateNameMap.has(uKey)) {
                        unmarkedStates.push(U);
                        const uName = `S${stateCounter++}`;
                        stateNameMap.set(uKey, uName);
                        dStates.push(U);
                    }
                    dTran.push({ from: sName, to: stateNameMap.get(uKey), label: char });
                }
            }
        }

        const finalStateCharPosition = parseInt(Object.keys(positionsToChars).find(k => positionsToChars[k] === '#'));
        const finalStates = [];
        for (const stateSet of dStates) {
            if (stateSet.has(finalStateCharPosition)) {
                finalStates.push(stateNameMap.get(JSON.stringify([...stateSet].sort())));
            }
        }

        return {
            states: Array.from(stateNameMap.values()),
            alphabet: alphabet,
            transitions: dTran,
            startState: 'S0',
            finalStates: finalStates,
        };
    }
}
