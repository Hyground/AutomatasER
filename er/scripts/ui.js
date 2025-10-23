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
        const isStart = state === dfa.startState;
        return {
            id: state,
            label: state,
            shape: isFinal ? 'doublecircle' : 'circle',
            color: {
                border: isStart ? '#22c55e' : '#4b5563',
                background: '#ffffff',
            },
            borderWidth: isStart ? 2.5 : 1.5,
        };
    });

    const edges = dfa.transitions.map((t, i) => ({
        id: `e${i}`,
        from: t.from,
        to: t.to,
        label: t.label,
        arrows: 'to'
    }));

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
                gravitationalConstant: -8000,
                centralGravity: 0.1,
                springLength: 150,
            },
        },
        edges: {
            smooth: {
                type: 'cubicBezier',
                forceDirection: 'horizontal',
                roundness: 0.4
            }
        }
    };

    new vis.Network(dfaContainer, data, options);
}
