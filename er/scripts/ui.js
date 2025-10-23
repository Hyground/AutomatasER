import { ConversorDirecto } from '../logic/directo-afd.js';

const regexInput = document.getElementById('regex-input');
const convertBtn = document.getElementById('convert-btn');
const treeContainer = document.getElementById('tree-container');
const followposTableContainer = document.getElementById('followpos-table');
const dfaContainer = document.getElementById('dfa-diagram');

const conversor = new ConversorDirecto();

convertBtn.addEventListener('click', () => {
    const regex = regexInput.value;
    treeContainer.innerHTML = '';
    followposTableContainer.innerHTML = '';
    dfaContainer.innerHTML = '';

    if (!regex) {
        treeContainer.innerHTML = 'Por favor, introduce una expresión regular.';
        return;
    }

    try {
        const { ast, followposTable, positionsToChars, dfa } = conversor.convertir(regex);
        
        dibujarArbol(ast);
        dibujarTablaFollowpos(followposTable, positionsToChars);
        dibujarAFD(dfa);

    } catch (e) {
        treeContainer.innerHTML = `<p style="color: red;">Error: ${e.message}</p>`;
        console.error(e);
    }
});

function dibujarArbol(ast) {
    const nodes = [];
    const edges = [];
    let nodeId = 0;

    function recorrer(node, parentId, level) {
        if (!node) return;
        const id = nodeId++;

        const fpText = node.firstpos ? `{${[...node.firstpos].join(',')}}` : '';
        const lpText = node.lastpos ? `{${[...node.lastpos].join(',')}}` : '';
        const typeLabel = node.type === 'char' ? node.value : (node.type === 'concat' ? '.' : (node.type === 'union' ? '+' : '*'));
        const topLine = `${fpText} ${typeLabel} ${lpText}`.trim();

        const posText = node.position ? `${node.position}` : '';
        const nullText = node.hasOwnProperty('nullable') ? (node.nullable ? 'v' : 'f') : '';
        const bottomLine = posText + nullText;

        const label = [topLine, bottomLine].filter(Boolean).join('\n');

        nodes.push({ id: id, label: label, shape: 'circle', level: level });

        if (parentId !== null) {
            edges.push({ from: parentId, to: id });
        }

        recorrer(node.child, id, level + 1);
        recorrer(node.left, id, level + 1);
        recorrer(node.right, id, level + 1);
    }

    recorrer(ast, null, 0);

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
    };
    const options = {
        layout: {
            hierarchical: {
                direction: 'UD',
                sortMethod: 'directed',
                levelSeparation: 100,
            },
        },
        nodes: {
            font: {
                multi: true,
                align: 'center',
                size: 14,
            },
            size: 60,
        },
        physics: false,
    };

    new vis.Network(treeContainer, data, options);
}

function dibujarTablaFollowpos(table, positionsToChars) {
    let html = '<table><thead><tr><th>Var</th><th>N</th><th>SigPos</th></tr></thead><tbody>';
    
    table.forEach((followSet, position) => {
        if (position === 0) return;

        const char = positionsToChars[position];
        const followString = `{${[...followSet].sort((a, b) => a - b).join(', ')}}`;
        
        html += `<tr><td>${char}</td><td>${position}</td><td>${followString}</td></tr>`;
    });

    html += '</tbody></table>';
    followposTableContainer.innerHTML = html;
}

function dibujarAFD(dfa) {
    const nodes = dfa.states.map(state => {
        const isFinal = dfa.finalStates.includes(state);
        const hasSets = dfa.stateSets && Object.prototype.hasOwnProperty.call(dfa.stateSets, state);
        const setArr = hasSets ? dfa.stateSets[state] : null;
        const label = Array.isArray(setArr) ? (setArr.length ? `{${setArr.join(',')}}` : '∅') : state;
        return {
            id: state,
            label,
            shape: 'circle',
            color: {
                border: isFinal ? '#16a34a' : '#4b5563',
                background: isFinal ? '#dcfce7' : '#ffffff',
            },
            borderWidth: 1.5,
        };
    });

    // Paralelas: no-self en aristas separadas; self-loops unificados
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
        if (isSelf) {
            const label = Array.from(new Set(g.items.map(i => i.label))).sort().join(',');
            edges.push({
                id: `e${edgeId++}`,
                from: g.from,
                to: g.to,
                label,
                arrows: { to: { enabled: true, scaleFactor: 0.9 } },
                width: 1.2,
                smooth: { type: 'self', roundness: 0.5 },
            });
        } else {
            const count = g.items.length;
            g.items.forEach((t, idx) => {
                const type = (idx % 2 === 0) ? 'curvedCW' : 'curvedCCW';
                const k = Math.floor(idx / 2);
                const roundness = 0.22 + k * 0.08;
                edges.push({
                    id: `e${edgeId++}`,
                    from: t.from,
                    to: t.to,
                    label: t.label,
                    arrows: { to: { enabled: true, scaleFactor: 0.9 } },
                    width: 1.2,
                    smooth: { type, roundness },
                });
            });
        }
    }

    // Nodo de inicio ficticio para flecha de estado inicial
    const startNodeId = '__START__';
    nodes.push({
        id: startNodeId,
        label: '',
        shape: 'circle',
        size: 6,
        color: { border: 'rgba(0,0,0,0)', background: 'rgba(0,0,0,0)' },
        physics: true
    });

    // Arista hacia el estado inicial (flecha de entrada)
    edges.unshift({
        id: 'start-edge',
        from: startNodeId,
        to: dfa.startState,
        label: '',
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        dashes: true,
        smooth: false,
        width: 1,
        length: 25,
        color: { color: '#4b5563' }
    });

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
    };

    const options = {
        layout: {
            hierarchical: false
        },
        physics: {
            solver: 'barnesHut',
            barnesHut: {
                gravitationalConstant: -3000,
                centralGravity: 0.3,
                springLength: 80,
            },
        },
        edges: {
            smooth: {
                type: 'cubicBezier',
                forceDirection: 'horizontal',
                roundness: 0.25
            }
        }
    };

    new vis.Network(dfaContainer, data, options);
}
