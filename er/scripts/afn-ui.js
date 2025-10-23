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

function dibujarVisualDesdePatron(pattern) {
  const p = (pattern || '').trim();
  const mUnion = /^([a-zA-Z])\s*(\*)?\s*\+\s*([a-zA-Z])\s*(\*)?$/.exec(p);
  const mKleene = /^([a-zA-Z])\*$/.exec(p);
  const mSimple = /^([a-zA-Z])$/.exec(p);

  if (mUnion) {
    const x = mUnion[1];
    const leftStar = !!mUnion[2];
    const y = mUnion[3];
    const rightStar = !!mUnion[4];
    return dibujarVisualUnion(x, y, leftStar, rightStar);
  }
  if (mKleene) {
    return dibujarVisualKleene(mKleene[1]);
  }
  if (mSimple) {
    return dibujarVisualSimple(mSimple[1]);
  }

  if (visualContainer) {
    visualContainer.innerHTML = '<div style="color:#666">Ingresa: letra, letra*, letra+letra, letra*+letra o letra+letra*</div>';
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
