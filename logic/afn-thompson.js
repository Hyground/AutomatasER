// Thompson construction for AFN from a regular expression (basic: + . * () and symbols)

function preprocesar(regex) {
  let result = '';
  const isAlphabet = (c) => /[a-z0-9#]/i.test(c);
  const needsConcatAfter = (c) => isAlphabet(c) || c === ')' || c === '*';
  const needsConcatBefore = (c) => isAlphabet(c) || c === '(';
  for (let i = 0; i < regex.length; i++) {
    const current = regex[i];
    result += current;
    if (i + 1 < regex.length) {
      const next = regex[i + 1];
      if (needsConcatAfter(current) && needsConcatBefore(next)) {
        result += '.';
      }
    }
  }
  return result;
}

function construirAST(infix) {
  const precedence = { '+': 1, '.': 2, '*': 3 };
  const operators = [];
  const nodes = [];

  const applyOperator = () => {
    const op = operators.pop();
    if (op === '*') {
      const child = nodes.pop();
      nodes.push({ type: 'kleene', child });
    } else {
      const right = nodes.pop();
      const left = nodes.pop();
      nodes.push({ type: op === '.' ? 'concat' : 'union', left, right });
    }
  };

  for (const ch of infix) {
    if (/[a-z0-9#]/i.test(ch)) {
      nodes.push({ type: 'char', value: ch });
    } else if (ch === '(') {
      operators.push(ch);
    } else if (ch === ')') {
      while (operators.length && operators[operators.length - 1] !== '(') applyOperator();
      operators.pop();
    } else if (precedence[ch]) {
      while (
        operators.length &&
        operators[operators.length - 1] !== '(' &&
        precedence[operators[operators.length - 1]] >= precedence[ch]
      ) {
        applyOperator();
      }
      operators.push(ch);
    }
  }
  while (operators.length) applyOperator();
  return nodes[0];
}

let nextId = 0;
function newState() {
  return `q${nextId++}`;
}

function thompson(node, graph) {
  const eps = 'ε';
  if (node.type === 'char') {
    const s = newState();
    const f = newState();
    graph.states.add(s); graph.states.add(f);
    graph.transitions.push({ from: s, to: f, label: node.value });
    return { start: s, accept: f };
  }
  if (node.type === 'union') {
    const L = thompson(node.left, graph);
    const R = thompson(node.right, graph);
    const s = newState();
    const f = newState();
    graph.states.add(s); graph.states.add(f);
    graph.transitions.push({ from: s, to: L.start, label: eps });
    graph.transitions.push({ from: s, to: R.start, label: eps });
    graph.transitions.push({ from: L.accept, to: f, label: eps });
    graph.transitions.push({ from: R.accept, to: f, label: eps });
    return { start: s, accept: f };
  }
  if (node.type === 'concat') {
    const L = thompson(node.left, graph);
    const R = thompson(node.right, graph);
    graph.transitions.push({ from: L.accept, to: R.start, label: 'ε' });
    return { start: L.start, accept: R.accept };
  }
  if (node.type === 'kleene') {
    const X = thompson(node.child, graph);
    const s = newState();
    const f = newState();
    graph.states.add(s); graph.states.add(f);
    graph.transitions.push({ from: s, to: X.start, label: 'ε' });
    graph.transitions.push({ from: X.accept, to: X.start, label: 'ε' });
    graph.transitions.push({ from: X.accept, to: f, label: 'ε' });
    graph.transitions.push({ from: s, to: f, label: 'ε' });
    return { start: s, accept: f };
  }
  throw new Error('Nodo AST no soportado');
}

export function construirAFNDesdeRegex(regex) {
  nextId = 0;
  const expr = preprocesar(regex.trim());
  const ast = construirAST(expr);
  const graph = { states: new Set(), transitions: [] };
  const frag = thompson(ast, graph);
  return {
    ast,
    states: [...graph.states],
    transitions: graph.transitions,
    startState: frag.start,
    acceptStates: [frag.accept],
  };
}

// Variante con pasos de construcción (para animación)
function thompsonConPasos(node, graph, steps) {
  const eps = 'ε';
  if (node.type === 'char') {
    const s = newState();
    const f = newState();
    graph.states.add(s); graph.states.add(f);
    const e = { from: s, to: f, label: node.value };
    graph.transitions.push(e);
    steps.push([e]);
    return { start: s, accept: f };
  }
  if (node.type === 'union') {
    const L = thompsonConPasos(node.left, graph, steps);
    const R = thompsonConPasos(node.right, graph, steps);
    const s = newState();
    const f = newState();
    graph.states.add(s); graph.states.add(f);
    const adds = [
      { from: s, to: L.start, label: eps },
      { from: s, to: R.start, label: eps },
      { from: L.accept, to: f, label: eps },
      { from: R.accept, to: f, label: eps },
    ];
    graph.transitions.push(...adds);
    steps.push(adds);
    return { start: s, accept: f };
  }
  if (node.type === 'concat') {
    const L = thompsonConPasos(node.left, graph, steps);
    const R = thompsonConPasos(node.right, graph, steps);
    const bridge = { from: L.accept, to: R.start, label: 'ε' };
    graph.transitions.push(bridge);
    steps.push([bridge]);
    return { start: L.start, accept: R.accept };
  }
  if (node.type === 'kleene') {
    const X = thompsonConPasos(node.child, graph, steps);
    const s = newState();
    const f = newState();
    graph.states.add(s); graph.states.add(f);
    const entry = [ { from: s, to: X.start, label: 'ε' }, { from: s, to: f, label: 'ε' } ];
    const exit  = [ { from: X.accept, to: X.start, label: 'ε' }, { from: X.accept, to: f, label: 'ε' } ];
    graph.transitions.push(...entry, ...exit);
    steps.push(entry);
    steps.push(exit);
    return { start: s, accept: f };
  }
  throw new Error('Nodo AST no soportado');
}

export function construirAFNConPasos(regex) {
  nextId = 0;
  const expr = preprocesar(regex.trim());
  const ast = construirAST(expr);
  const graph = { states: new Set(), transitions: [] };
  const steps = [];
  const frag = thompsonConPasos(ast, graph, steps);
  return {
    afn: {
      ast,
      states: [...graph.states],
      transitions: graph.transitions,
      startState: frag.start,
      acceptStates: [frag.accept],
    },
    pasos: steps,
  };
}
