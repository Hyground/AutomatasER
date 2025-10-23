// UI para visual AFN (simple) en español con epsilon y curvas externas
const regexInput = document.getElementById('afn-regex-input');
const convertBtn = document.getElementById('afn-convert-btn');
const visualContainer = document.getElementById('afn-visual');
const tableContainer = document.getElementById('afn-table');

// Construimos ε en runtime para evitar problemas de codificación
const EPS = String.fromCharCode(949);
// Layout compacto y consistente para todos los casos
const POS = { dxSimple: 120, dxUnion: 180, dyUnion: 70 };

function drawVisual(nodes, edges) {
  if (!visualContainer) return;
  const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  const options = {
    physics: false,
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      arrowStrikethrough: false,
      smooth: { enabled: true },
      font: { face: 'Segoe UI Symbol, Arial Unicode MS, Noto Sans, Segoe UI, sans-serif' }
    },
    nodes: { borderWidth: 1.5 }
  };
  new vis.Network(visualContainer, data, options);

  if (tableContainer) {
    let html = '<table><thead><tr><th>De</th><th>Etiqueta</th><th>A</th></tr></thead><tbody>';
    for (const e of edges) html += `<tr><td>${e.from}</td><td>${e.label}</td><td>${e.to}</td></tr>`;
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
  }
}

function dibujarVisualUnion(x, y, leftStar = false, rightStar = false) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: -dy, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: dx, y: dy, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 2*dx, y: -dy, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 2*dx, y: dy, fixed: true },
    { id: '6', label: '6', shape: 'circle', x: 3*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '1', to: '3', label: EPS, smooth: false },
    { from: '2', to: '4', label: x, smooth: false },
    { from: '3', to: '5', label: y, smooth: false },
    { from: '4', to: '6', label: EPS, smooth: false },
    { from: '5', to: '6', label: EPS, smooth: false },
  ];

  // Loops de Kleene curvados si aplica en cada rama
  if (leftStar) {
    edges.push({ from: '4', to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.65 } });
  }
  if (rightStar) {
    edges.push({ from: '5', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.65 } });
  }

  drawVisual(nodes, edges);
}

function dibujarVisualSimple(simbolo) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: simbolo, smooth: false },
    { from: '3', to: '4', label: EPS, smooth: false },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleene(simbolo) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: simbolo, smooth: false },
    { from: '3', to: '4', label: EPS, smooth: false },
    // Loop: 3 —ε→ 2 curvado (sin mover nodos)
    { from: '3', to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleeneUnion(x, y) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: -dy, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: dx, y: dy, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 2*dx, y: -dy, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 2*dx, y: dy, fixed: true },
    { id: '6', label: '6', shape: 'circle', x: 3*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '1', to: '3', label: EPS, smooth: false },
    { from: '2', to: '4', label: x, smooth: false },
    { from: '3', to: '5', label: y, smooth: false },
    { from: '4', to: '6', label: EPS, smooth: false },
    { from: '5', to: '6', label: EPS, smooth: false },
    // Cierre Kleene sobre (x+y): vacío y repetición
    // Curvas al mismo lado para evitar enredos visuales
    { from: '1', to: '6', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.85 } },
    { from: '6', to: '1', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.55 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualParenConcatKleene(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: x, smooth: false },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // Bucles internos entre 4 y 2 para repetir (ab)
    { from: '4', to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.7 } },
    { from: '2', to: '4', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.45 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleeneLuego(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: x, smooth: false },
    // Loop de Kleene sobre x: mismo estilo que a* (curvedCCW 0.6)
    { from: '3', to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
    // Continuación con y
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualConcatKleene(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: x, smooth: false },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // Loop de Kleene sobre y: mismo estilo que a* (curvedCCW 0.6)
    { from: '4', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleeneAmbosLados(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: x, smooth: false },
    // Loop sobre x (igual que a*)
    { from: '3', to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // Loop sobre y (igual que b*)
    { from: '4', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualConcat(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '2', to: '3', label: x, smooth: false },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
  ];

  drawVisual(nodes, edges);
}

// Secuencias generales: letras con estrella opcional, concatenadas n veces (abc, ab*c*, a*b*c, etc.)
function dibujarVisualSecuencia(tokens) {
  const dx = POS.dxSimple;
  const nodes = [];
  const edges = [];

  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  nodes.push({ id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true });
  edges.push({ from: '1', to: '2', label: EPS, smooth: false });

  let currentFromId = 2;
  let nextId = 3;

  for (let i = 0; i < tokens.length; i++) {
    const { sym, star } = tokens[i];
    const toId = nextId++;
    const xPos = (i + 2) * dx;
    nodes.push({ id: String(toId), label: String(toId), shape: 'circle', x: xPos, y: 0, fixed: true });
    edges.push({ from: String(currentFromId), to: String(toId), label: sym, smooth: false });
    if (star) {
      edges.push({ from: String(toId), to: String(currentFromId), label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
    }
    currentFromId = toId;
  }

  const acceptId = nextId++;
  nodes.push({ id: String(acceptId), label: String(acceptId), shape: 'circle', x: (tokens.length + 2) * dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
  edges.push({ from: String(currentFromId), to: String(acceptId), label: EPS, smooth: false });

  drawVisual(nodes, edges);
}

function dibujarVisualDesdePatron(pattern) {
  const p = (pattern || '').trim();
  const mUnion = /^([a-zA-Z])\s*(\*)?\s*\+\s*([a-zA-Z])\s*(\*)?$/.exec(p);
  const mParenKleene = /^\(\s*([a-zA-Z])\s*\+\s*([a-zA-Z])\s*\)\s*\*$/.exec(p);
  const mParenConcatKleene = /^\(\s*([a-zA-Z])\s*\.?\s*([a-zA-Z])\s*\)\s*\*$/.exec(p);
  const isParenSeqKleene = /^\(\s*(?:[a-zA-Z]\*?\s*\.?\s*)+\)\s*\*$/.test(p);
  const mKleeneConcat = /^([a-zA-Z])\*\s*\.?\s*([a-zA-Z])$/.exec(p);
  const mConcatKleene = /^([a-zA-Z])\s*\.?\s*([a-zA-Z])\*$/.exec(p);
  const mKleeneBothSides = /^([a-zA-Z])\*\s*\.?\s*([a-zA-Z])\*$/.exec(p);
  const mConcat = /^([a-zA-Z])\s*\.?\s*([a-zA-Z])$/.exec(p);
  const mKleene = /^([a-zA-Z])\*$/.exec(p);
  const mSimple = /^([a-zA-Z])$/.exec(p);
  const mSeq = /^(?:\s*[a-zA-Z]\*?\s*\.?\s*){3,}$/.exec(p); // 3 o más símbolos (deja casos de 1-2 a handlers previos)

  // (secuencia)*: generaliza (ab)* a cualquier longitud, con posibles * internos
  if (isParenSeqKleene) {
    const inner = p.replace(/^\(\s*/, '').replace(/\s*\)\s*\*$/, '');
    const tokens = [];
    const re = /([a-zA-Z])(\*)?/g;
    let m;
    while ((m = re.exec(inner)) !== null) tokens.push({ sym: m[1], star: !!m[2] });
    if (tokens.length >= 1) {
      // Reutiliza el constructor de secuencia y añade loop entre extremos internos (2 <-> ultimo)
      const dx = POS.dxSimple;
      const nodes = [];
      const edges = [];
      nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
      nodes.push({ id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true });
      edges.push({ from: '1', to: '2', label: EPS, smooth: false });
      let currentFromId = 2;
      let nextId = 3;
      for (let i = 0; i < tokens.length; i++) {
        const { sym, star } = tokens[i];
        const toId = nextId++;
        const xPos = (i + 2) * dx;
        nodes.push({ id: String(toId), label: String(toId), shape: 'circle', x: xPos, y: 0, fixed: true });
        edges.push({ from: String(currentFromId), to: String(toId), label: sym, smooth: false });
        if (star) edges.push({ from: String(toId), to: String(currentFromId), label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        currentFromId = toId;
      }
      const acceptId = nextId++;
      nodes.push({ id: String(acceptId), label: String(acceptId), shape: 'circle', x: (tokens.length + 2) * dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
      edges.push({ from: String(currentFromId), to: String(acceptId), label: EPS, smooth: false });
      // Loop del bloque entre extremos internos: ultimo -> 2 y 2 -> ultimo
      edges.push({ from: String(currentFromId), to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.7 } });
      edges.push({ from: '2', to: String(currentFromId), label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.45 } });
      return drawVisual(nodes, edges);
    }
  }

  if (mParenKleene) {
    const x = mParenKleene[1];
    const y = mParenKleene[2];
    return dibujarVisualKleeneUnion(x, y);
  }
  if (mParenConcatKleene) {
    const x = mParenConcatKleene[1];
    const y = mParenConcatKleene[2];
    return dibujarVisualParenConcatKleene(x, y);
  }
  if (mUnion) {
    const x = mUnion[1];
    const leftStar = !!mUnion[2];
    const y = mUnion[3];
    const rightStar = !!mUnion[4];
    return dibujarVisualUnion(x, y, leftStar, rightStar);
  }
  if (mKleeneConcat) {
    const x = mKleeneConcat[1];
    const y = mKleeneConcat[2];
    return dibujarVisualKleeneLuego(x, y);
  }
  if (mConcatKleene) {
    const x = mConcatKleene[1];
    const y = mConcatKleene[2];
    return dibujarVisualConcatKleene(x, y);
  }
  if (mKleeneBothSides) {
    const x = mKleeneBothSides[1];
    const y = mKleeneBothSides[2];
    return dibujarVisualKleeneAmbosLados(x, y);
  }
  if (mSeq && !/[()+]/.test(p) && !/\+/.test(p)) {
    const tokens = [];
    const re = /([a-zA-Z])(\*)?/g;
    let m;
    while ((m = re.exec(p)) !== null) tokens.push({ sym: m[1], star: !!m[2] });
    if (tokens.length >= 3) return dibujarVisualSecuencia(tokens);
  }
  if (mConcat) {
    const x = mConcat[1];
    const y = mConcat[2];
    return dibujarVisualConcat(x, y);
  }
  if (mKleene) {
    return dibujarVisualKleene(mKleene[1]);
  }
  if (mSimple) {
    return dibujarVisualSimple(mSimple[1]);
  }

  if (visualContainer) {
    visualContainer.innerHTML = '<div style="color:#666">Ingresa: secuencias como abcdef, ab*c*, a*b*c o (abc)*; además letra, letra*, letra+letra, (letra+letra)*, (letra.letra)*, letra*letra, letra letra* o letra*letra*</div>';
  }
}

// Eventos: solo dibujar cuando el usuario ingrese algo
window.addEventListener('DOMContentLoaded', () => {
  if (visualContainer) visualContainer.innerHTML = '';
});

convertBtn?.addEventListener('click', () => {
  const pattern = (regexInput?.value || '').trim();
  if (pattern) {
    dibujarVisualDesdePatron(pattern);
  } else if (visualContainer) {
    visualContainer.innerHTML = '';
  }
});

regexInput?.addEventListener('input', () => {
  const pattern = (regexInput.value || '').trim();
  if (pattern) {
    dibujarVisualDesdePatron(pattern);
  } else if (visualContainer) {
    visualContainer.innerHTML = '';
  }
});
