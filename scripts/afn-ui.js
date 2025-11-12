// LÓGICA DE MODO OSCURO (Añadido)
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const body = document.body;

// 1. Cargar preferencia guardada
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️'; // Icono de sol para modo claro
} else {
    themeToggleBtn.textContent = '🌙'; // Icono de luna para modo oscuro
}

// 2. Manejar el click del botón
themeToggleBtn?.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    
    // Guardar preferencia
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    // Actualizar icono
    themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
});
// UI para visual AFN (simple) en español con epsilon y curvas externas
const regexInput = document.getElementById('afn-regex-input');
const convertBtn = document.getElementById('afn-convert-btn');
const visualContainer = document.getElementById('afn-visual');
const tableContainer = document.getElementById('afn-table');

// Construimos ε en runtime para evitar problemas de codificación
const EPS = String.fromCharCode(949);
// Layout compacto y consistente para todos los casos
// Layout por defecto (original)
const POS = { dxSimple: 120, dxUnion: 180, dyUnion: 70 };
// Paleta de colores para loops/skip (ramas con estrella) y helper
const LOOP_COLORS = ['#e63946', '#ff7f0e', '#2ca02c', '#17becf', '#d62728', '#9467bd', '#bcbd22', '#8c564b', '#1f77b4', '#ff1493'];
const loopColor = (idx) => LOOP_COLORS[idx % LOOP_COLORS.length];

function drawVisual(nodes, edges) {
  if (!visualContainer) return;

  const nodeColor = body.classList.contains('dark-mode') ? '#6ab0ff' : '#007bff';
  const nodeBgColor = body.classList.contains('dark-mode') ? '#343434' : '#f0f0f0';
  const finalBorderColor = body.classList.contains('dark-mode') ? '#4cd17a' : '#28a745';
  const finalBgColor = body.classList.contains('dark-mode') ? '#2e4f4f' : '#e6ffe6';
  const edgeColor = body.classList.contains('dark-mode') ? '#b0b0b0' : '#4b5563';
  const fontColor = body.classList.contains('dark-mode') ? '#ffffff' : '#333333';

  // Fallback si vis-network no está disponible (por bloqueo CDN)
  try {
    if (typeof vis === 'undefined' || !vis || !vis.DataSet) {
      const nodesTxt = nodes.map(n => n.id).join(', ');
      const edgesTxt = edges.map(e => `${e.from} -${e.label}-> ${e.to}`).join('<br>');
      visualContainer.innerHTML = `
        <div style="color:${fontColor}">
          <div><strong>vis-network no disponible</strong>. Mostrando fallback textual.</div>
          <div><strong>Nodos:</strong> ${nodesTxt}</div>
          <div><strong>Transiciones:</strong><br>${edgesTxt}</div>
        </div>`;
      return;
    }
  } catch(_) {}
  
  // Aplicar estilos modernos a los nodos
  const styledNodes = nodes.map(n => ({
    ...n,
    color: n.color && n.color.border === '#16a34a' 
        ? { border: finalBorderColor, background: finalBgColor }
        : { border: nodeColor, background: nodeBgColor },
    font: { color: fontColor, face: 'Inter' },
    borderWidth: 2,
    shadow: true
  }));

  // Aplicar estilos modernos a las aristas (respetar color por arista si viene definido)
  const styledEdges = edges.map(e => {
    const isEps = e.label === EPS;
    const baseFontBg = body.classList.contains('dark-mode') ? '#1e1e1e' : '#ffffff';
    const symbolColor = '#ff6b00';
    return {
      ...e,
      color: e.color || (isEps ? edgeColor : symbolColor),
      width: isEps ? 1.5 : 2.2,
      dashes: e.dashes || false,
      arrows: { to: { enabled: true, scaleFactor: 0.9 } },
      font: { size: 14, color: isEps ? edgeColor : symbolColor, background: baseFontBg, face: 'Inter' }
    };
  });

  const data = { nodes: new vis.DataSet(styledNodes), edges: new vis.DataSet(styledEdges) };
  
  const options = {
    physics: false,
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.8 } },
      arrowStrikethrough: false,
      smooth: { enabled: true },
      font: { face: 'Inter', size: 14 }
    },
    nodes: { borderWidth: 2, font: { size: 14, face: 'Inter' } }
  };
  const network = new vis.Network(visualContainer, data, options);
  try { network.fit({ animation: { duration: 0 } }); } catch(_) {}

  if (tableContainer) {
    let html = '<table class="afn-table"><thead><tr><th>De</th><th>Etiqueta</th><th>A</th></tr></thead><tbody>';
    for (const e of edges) html += `<tr><td>${e.from}</td><td>${e.label}</td><td>${e.to}</td></tr>`;
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
  }
}

function dibujarVisualUnion(x, y, leftStar = false, rightStar = false) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: -dy, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: dx, y: dy, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 2*dx, y: -dy, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 2*dx, y: dy, fixed: true },
    { id: '6', label: '6', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '7', label: '7', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '1', to: '3', label: EPS, smooth: false },
    { from: '2', to: '4', label: x, smooth: false },
    { from: '3', to: '5', label: y, smooth: false },
    { from: '4', to: '6', label: EPS, smooth: false },
    { from: '5', to: '6', label: EPS, smooth: false },
    { from: '6', to: '7', label: EPS, smooth: false },
  ];

  // Loops de Kleene curvados si aplica en cada rama
  if (leftStar) {
    edges.push({ from: '4', to: '2', label: EPS, color: loopColor(0), smooth: { enabled: true, type: 'curvedCCW', roundness: 0.65 } });
    // skip para cero repeticiones (curvo): 2 —ε→ 6
    edges.push({ from: '2', to: '6', label: EPS, color: loopColor(0), dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.65 } });
  }
  if (rightStar) {
    edges.push({ from: '5', to: '3', label: EPS, color: loopColor(1), smooth: { enabled: true, type: 'curvedCW', roundness: 0.65 } });
    // skip para cero repeticiones (curvo): 3 —ε→ 6
    edges.push({ from: '3', to: '6', label: EPS, color: loopColor(1), dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.65 } });
  }

  drawVisual(nodes, edges);
}

// Unión general entre dos secuencias (cada lado puede tener n símbolos con * opcional)
function dibujarVisualUnionSecuencias(tokensLeft, tokensRight) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [];
  const edges = [];

  // Nodo global y arranque común
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  nodes.push({ id: '2', label: '2', shape: 'circle', x: dx, y: -dy, fixed: true });
  nodes.push({ id: '3', label: '3', shape: 'circle', x: dx, y: dy, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });
  edges.push({ from: '1', to: '2', label: EPS, smooth: false });
  edges.push({ from: '1', to: '3', label: EPS, smooth: false });

  let nextId = 4;

  function buildBranch(startId, y, tokens) {
    let currentFrom = startId; // nodo epsilon previo
    // la x base para la primera columna después del bifurcador
    let xPos = dx * 2;
    for (let i = 0; i < tokens.length; i++) {
      const { sym, star } = tokens[i];
      const symId = String(nextId++);
      nodes.push({ id: symId, label: symId, shape: 'circle', x: xPos, y, fixed: true });
      edges.push({ from: String(currentFrom), to: symId, label: sym, smooth: false });
      const epsId = String(nextId++);
      nodes.push({ id: epsId, label: epsId, shape: 'circle', x: xPos + dx, y, fixed: true });
      edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
      if (star) {
        // skip (arriba/abajo según lado) y loop
        const typeSkip = (y < 0) ? 'curvedCW' : 'curvedCW';
        const typeLoop = (y < 0) ? 'curvedCCW' : 'curvedCCW';
        edges.push({ from: String(currentFrom), to: epsId, label: EPS, smooth: { enabled: true, type: typeSkip, roundness: 0.6 } });
        edges.push({ from: symId, to: String(currentFrom), label: EPS, smooth: { enabled: true, type: typeLoop, roundness: 0.6 } });
      }
      currentFrom = Number(epsId);
      xPos += 2 * dx;
    }
    return { endEps: currentFrom, lastX: xPos - dx };
  }

  const left = buildBranch(2, -dy, tokensLeft);
  const right = buildBranch(3, dy, tokensRight);

  // Nodo final colocado después de la rama más larga
  const finalX = Math.max(left.lastX, right.lastX) + dx;
  const finalId = String(nextId++);
  nodes.push({ id: finalId, label: finalId, shape: 'circle', x: finalX, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });

  edges.push({ from: String(left.endEps), to: finalId, label: EPS, smooth: false });
  edges.push({ from: String(right.endEps), to: finalId, label: EPS, smooth: false });

  drawVisual(nodes, edges);
}

// Unión general de múltiples ramas (tres o más), cada una como secuencia de símbolos con * opcional
// Ej.: a+b+c, ab+cd*+e*f, etc.
function dibujarVisualUnionMultiple(branchesTokens) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [];
  const edges = [];

  // Caso general solicitado: a+b+c+... con N>=3 ramas; cada rama es un solo símbolo, con o sin Kleene.
  // Estructura mínima: 0 k 1; 1 k (2..n+1); (2+i) sym_i (2+n+i); (2+n+i) k (2+2n); (2+2n) k (2+2n+1)
  if (
    Array.isArray(branchesTokens) &&
    branchesTokens.length >= 3 &&
    branchesTokens.every(b => Array.isArray(b) && b.length === 1 && typeof b[0].sym === 'string' && b[0].sym.length === 1)
  ) {
    const n = branchesTokens.length;
    // Nodos comunes 0 (global), 1 (inicio)
    nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
    nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
    edges.push({ from: '0', to: '1', label: EPS, smooth: false });

    // Nodos de bifurcación por rama: 2..(n+1)
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * dy;
      const startId = String(2 + i);
      nodes.push({ id: startId, label: startId, shape: 'circle', x: dx, y, fixed: true });
      edges.push({ from: '1', to: startId, label: EPS, smooth: false });
    }

    // Nodos de símbolo por rama: (2+n)..(2+2n-1)
    const endpoints = new Array(n);  // a qué nodo conecta cada rama hacia el join
    const pendingSkip = []; // para ramas con *: añadir skip start->join después
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * dy;
      const startId = String(2 + i);
      const symRaw = branchesTokens[i][0].sym;
      const star = !!branchesTokens[i][0].star;

      const symId = String(2 + n + i);
      nodes.push({ id: symId, label: symId, shape: 'circle', x: 2 * dx, y, fixed: true });
      edges.push({ from: startId, to: symId, label: symRaw, smooth: false });
      endpoints[i] = symId;
      if (star) {
        // loop: símbolo -> startId (curvo y con color por rama)
        edges.push({ from: symId, to: startId, label: EPS, color: loopColor(i), smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        // skip se añade tras crear el joinId (curvo y dashes)
        pendingSkip.push({ startId, color: loopColor(i) });
      }
    }

    // Nodo de unión común y aceptación
    const joinId = String(2 + 2 * n);
    const accId = String(2 + 2 * n + 1);
    nodes.push({ id: joinId, label: joinId, shape: 'circle', x: 3 * dx, y: 0, fixed: true });
    nodes.push({ id: accId, label: accId, shape: 'circle', x: 4 * dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });

    // Enlace de cada endpoint al join; añadir skips pendientes para ramas con *
    for (let i = 0; i < n; i++) {
      edges.push({ from: endpoints[i], to: joinId, label: EPS, smooth: false });
    }
    for (const s of pendingSkip) {
      edges.push({ from: s.startId, to: joinId, label: EPS, color: s.color, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
    }
    edges.push({ from: joinId, to: accId, label: EPS, smooth: false });

    drawVisual(nodes, edges);
    return;
  }

  // Nodo global 0 y nodo de inicio 1
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });

  // Crear un nodo de bifurcación por rama
  let nextId = 2;
  const branchStartIds = [];
  const n = branchesTokens.length;
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy; // distribuir verticalmente
    const startId = String(nextId++);
    branchStartIds.push({ id: startId, y });
    nodes.push({ id: startId, label: startId, shape: 'circle', x: dx, y, fixed: true });
    edges.push({ from: '1', to: startId, label: EPS, smooth: false });
  }

  function buildBranch(startId, y, tokens) {
    let currentFrom = startId;
    let xPos = 2 * dx;
    for (let i = 0; i < tokens.length; i++) {
      const { sym, star } = tokens[i];
      const symId = String(nextId++);
      nodes.push({ id: symId, label: symId, shape: 'circle', x: xPos, y, fixed: true });
      edges.push({ from: String(currentFrom), to: symId, label: sym, smooth: false });
      const epsId = String(nextId++);
      nodes.push({ id: epsId, label: epsId, shape: 'circle', x: xPos + dx, y, fixed: true });
      edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
      if (star) {
        edges.push({ from: String(currentFrom), to: epsId, label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
        edges.push({ from: symId, to: String(currentFrom), label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
      }
      currentFrom = Number(epsId);
      xPos += 2 * dx;
    }
    return { endEps: currentFrom, lastX: xPos - dx };
  }

  const ends = [];
  for (let i = 0; i < n; i++) {
    const { id, y } = branchStartIds[i];
    const result = buildBranch(id, y, branchesTokens[i]);
    ends.push(result);
  }

  // Nodo de aceptación común al final de la rama más larga
  const finalX = Math.max(...ends.map(e => e.lastX)) + dx;
  const finalId = String(nextId++);
  nodes.push({ id: finalId, label: finalId, shape: 'circle', x: finalX, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
  for (const e of ends) edges.push({ from: String(e.endEps), to: finalId, label: EPS, smooth: false });

  drawVisual(nodes, edges);
}

// Unión múltiple con Kleene aplicado al bloque completo: (a+b+c+...)*
function dibujarVisualUnionMultipleKleene(branchesTokens) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [];
  const edges = [];

  // Reutilizamos la estructura de dibujarVisualUnionMultiple para N>=2
  if (!Array.isArray(branchesTokens) || branchesTokens.length < 2) return;
  const n = branchesTokens.length;

  // Nodos comunes 0 (global), 1 (inicio)
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });

  // Bifurcación: 2..(n+1)
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy;
    const startId = String(2 + i);
    nodes.push({ id: startId, label: startId, shape: 'circle', x: dx, y, fixed: true });
    edges.push({ from: '1', to: startId, label: EPS, smooth: false });
  }

  // Símbolos por rama: (2+n)..(2+2n-1)
  const endpoints = new Array(n);
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy;
    const startId = String(2 + i);
    const symId = String(2 + n + i);
    const sym = branchesTokens[i][0].sym;
    nodes.push({ id: symId, label: symId, shape: 'circle', x: 2 * dx, y, fixed: true });
    edges.push({ from: startId, to: symId, label: sym, smooth: false });
    endpoints[i] = symId;
  }

  // Join y aceptación del bloque
  const joinId = String(2 + 2 * n);
  const accId = String(2 + 2 * n + 1);
  nodes.push({ id: joinId, label: joinId, shape: 'circle', x: 3 * dx, y: 0, fixed: true });
  nodes.push({ id: accId, label: accId, shape: 'circle', x: 4 * dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
  for (let i = 0; i < n; i++) edges.push({ from: endpoints[i], to: joinId, label: EPS, smooth: false });
  edges.push({ from: joinId, to: accId, label: EPS, smooth: false });

  // Kleene sobre todo el bloque: aceptación por vacío (punteado) y repetición del bloque
  edges.push({ from: '0', to: accId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.95 } });
  // Repetición desde el join hacia el inicio del bloque (más abierta y destacada)
  edges.push({ from: joinId, to: '1', label: EPS, color: '#ff1493', width: 2.2, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.88 } });

  drawVisual(nodes, edges);
}

// Unión múltiple (2+ ramas) concatenada con una cola: (a+b+c+... ) tail
function dibujarVisualUnionMultipleConCola(branchesTokens, tailTokens) {
  const dx = POS.dxUnion, dy = POS.dyUnion, dxS = POS.dxSimple;
  const nodes = [];
  const edges = [];
  const n = branchesTokens.length;
  if (!Array.isArray(branchesTokens) || n < 2) return;

  // 0 y 1
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });

  // Split: 1 -> 2..(n+1)
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy;
    const startId = String(2 + i);
    nodes.push({ id: startId, label: startId, shape: 'circle', x: dx, y, fixed: true });
    edges.push({ from: '1', to: startId, label: EPS, smooth: false });
  }

  // Símbolos por rama: (2+n)..(2+2n-1)
  const endpoints = new Array(n);
  const pendingSkip = [];
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy;
    const startId = String(2 + i);
    const symId = String(2 + n + i);
    const sym = branchesTokens[i][0].sym;
    nodes.push({ id: symId, label: symId, shape: 'circle', x: 2 * dx, y, fixed: true });
    edges.push({ from: startId, to: symId, label: sym, smooth: false });
    if (branchesTokens[i][0].star) {
      // loop (repetición)
      edges.push({ from: symId, to: startId, label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
      // skip (cero repeticiones) se agrega tras crear el join
      pendingSkip.push(startId);
    }
    endpoints[i] = symId;
  }

  // Join común
  const joinId = String(2 + 2 * n);
  nodes.push({ id: joinId, label: joinId, shape: 'circle', x: 3 * dx, y: 0, fixed: true });
  for (let i = 0; i < n; i++) edges.push({ from: endpoints[i], to: joinId, label: EPS, smooth: false });
  // agregar skips pendientes (cero repeticiones) hacia el join
  for (const s of pendingSkip) {
    edges.push({ from: s, to: joinId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
  }

  // Cola: join —ε→ startTail —s1→ ε —s2→ ε ... —ε→ accept (sin ε extra al final)
  let nextId = 2 + 2 * n + 1;
  let currentFrom = joinId;
  let lastSymId = null; let lastStar = false; let lastSkipFrom = null;
  if (tailTokens.length > 0) {
    const startTailId = String(nextId++);
    const baseX = 3 * dx + 0;
    nodes.push({ id: startTailId, label: startTailId, shape: 'circle', x: baseX, y: 0, fixed: true });
    edges.push({ from: currentFrom, to: startTailId, label: EPS, smooth: false });
    currentFrom = startTailId;

    for (let i = 0; i < tailTokens.length; i++) {
      const { sym, star } = tailTokens[i];
      const symId = String(nextId++);
      const xSym = baseX + (1 + 2 * i) * dxS;
      nodes.push({ id: symId, label: symId, shape: 'circle', x: xSym, y: 0, fixed: true });
      edges.push({ from: currentFrom, to: symId, label: sym, smooth: false });
      const isLast = (i === tailTokens.length - 1);
      if (!isLast) {
        const epsId = String(nextId++);
        nodes.push({ id: epsId, label: epsId, shape: 'circle', x: baseX + (2 + 2 * i) * dxS, y: 0, fixed: true });
        edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
        if (star) {
          // skip punteado y loop curvo coloreado
          const col = loopColor(i);
          edges.push({ from: currentFrom, to: epsId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
          edges.push({ from: symId, to: currentFrom, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
        currentFrom = epsId;
      } else {
        lastSymId = symId; lastStar = !!star; lastSkipFrom = currentFrom;
        if (star) {
          const col = loopColor(i);
          edges.push({ from: symId, to: currentFrom, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
      }
    }
  }
  const acceptId = String(nextId++);
  nodes.push({ id: acceptId, label: acceptId, shape: 'circle', x: (3 * dx) + (2 * tailTokens.length + 1) * dxS, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
  if (lastSymId) {
    edges.push({ from: lastSymId, to: acceptId, label: EPS, smooth: false });
    if (lastStar && lastSkipFrom) edges.push({ from: lastSkipFrom, to: acceptId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
  } else {
    edges.push({ from: currentFrom, to: acceptId, label: EPS, smooth: false });
  }

  drawVisual(nodes, edges);
}

// Unión múltiple con Kleene sobre el bloque y concatenación al final: (a+b+c+...)* tail
function dibujarVisualUnionMultipleKleeneConCola(branchesTokens, tailTokens) {
  const dx = POS.dxUnion, dy = POS.dyUnion, dxS = POS.dxSimple;
  const nodes = [];
  const edges = [];
  const n = branchesTokens.length;
  if (!Array.isArray(branchesTokens) || n < 2) return;

  // 0 y 1
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });

  // Split
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy;
    const startId = String(2 + i);
    nodes.push({ id: startId, label: startId, shape: 'circle', x: dx, y, fixed: true });
    edges.push({ from: '1', to: startId, label: EPS, smooth: false });
  }
  // Símbolos por rama
  const endpoints = new Array(n);
  const pendingSkip = [];
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * dy;
    const startId = String(2 + i);
    const symId = String(2 + n + i);
    const sym = branchesTokens[i][0].sym;
    nodes.push({ id: symId, label: symId, shape: 'circle', x: 2 * dx, y, fixed: true });
    edges.push({ from: startId, to: symId, label: sym, smooth: false });
    if (branchesTokens[i][0].star) {
      edges.push({ from: symId, to: startId, label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
      pendingSkip.push(startId);
    }
    endpoints[i] = symId;
  }
  // Join y aceptación del bloque
  const joinId = String(2 + 2 * n);
  const accId = String(2 + 2 * n + 1);
  nodes.push({ id: joinId, label: joinId, shape: 'circle', x: 3 * dx, y: 0, fixed: true });
  nodes.push({ id: accId, label: accId, shape: 'circle', x: 4 * dx, y: 0, fixed: true });
  for (let i = 0; i < n; i++) edges.push({ from: endpoints[i], to: joinId, label: EPS, smooth: false });
  for (const s of pendingSkip) {
    edges.push({ from: s, to: joinId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
  }
  edges.push({ from: joinId, to: accId, label: EPS, smooth: false });
  // Kleene externo
  edges.push({ from: '0', to: accId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.95 } });
  edges.push({ from: joinId, to: '1', label: EPS, color: '#ff1493', width: 2.2, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.88 } });

  // Concatenar cola desde accId (con nodos ε intermedios por símbolo)
  let nextId = 2 + 2 * n + 2;
  let currentFrom = accId;
  let lastSymId2 = null; let lastStar2 = false; let lastSkipFrom2 = null;
  if (tailTokens.length > 0) {
    const startTailId = String(nextId++);
    const baseX = 4 * dx + 0;
    nodes.push({ id: startTailId, label: startTailId, shape: 'circle', x: baseX, y: 0, fixed: true });
    // Permitir 0 repeticiones (acc -> cola) y >=1 repeticiones (join -> cola)
    edges.push({ from: currentFrom, to: startTailId, label: EPS, smooth: false });
    edges.push({ from: joinId, to: startTailId, label: EPS, smooth: false });
    currentFrom = startTailId;
    for (let i = 0; i < tailTokens.length; i++) {
      const { sym, star } = tailTokens[i];
      const symId = String(nextId++);
      const xSym = baseX + (1 + 2 * i) * dxS;
      nodes.push({ id: symId, label: symId, shape: 'circle', x: xSym, y: 0, fixed: true });
      edges.push({ from: currentFrom, to: symId, label: sym, smooth: false });
      const isLast = (i === tailTokens.length - 1);
      if (!isLast) {
        const epsId = String(nextId++);
        nodes.push({ id: epsId, label: epsId, shape: 'circle', x: baseX + (2 + 2 * i) * dxS, y: 0, fixed: true });
        edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
        if (star) {
          const col = loopColor(i);
          edges.push({ from: currentFrom, to: epsId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
          edges.push({ from: symId, to: currentFrom, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
        currentFrom = epsId;
      } else {
        lastSymId2 = symId; lastStar2 = !!star; lastSkipFrom2 = currentFrom;
        if (star) {
          const col = loopColor(i);
          edges.push({ from: symId, to: currentFrom, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
      }
    }
  }
  // Aceptación final
  const finalAcc = String(nextId++);
  nodes.push({ id: finalAcc, label: finalAcc, shape: 'circle', x: (4 * dx) + (2 * tailTokens.length + 1) * dxS, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
  if (lastSymId2) {
    edges.push({ from: lastSymId2, to: finalAcc, label: EPS, smooth: false });
    if (lastStar2 && lastSkipFrom2) edges.push({ from: lastSkipFrom2, to: finalAcc, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
  } else {
    edges.push({ from: currentFrom, to: finalAcc, label: EPS, smooth: false });
  }

  drawVisual(nodes, edges);
}
// Unión entre dos secuencias donde cada lado puede tener Cierre de Kleene aplicado al bloque completo
// Ej.: (ab)* + b, a + (bc)*, (ab)* + (cd)*
function dibujarVisualUnionSecuenciasConKleene(tokensLeft, tokensRight, leftWholeStar = false, rightWholeStar = false) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [];
  const edges = [];

  // Nodo global y bifurcación
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  nodes.push({ id: '2', label: '2', shape: 'circle', x: dx, y: -dy, fixed: true });
  nodes.push({ id: '3', label: '3', shape: 'circle', x: dx, y: dy, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });
  edges.push({ from: '1', to: '2', label: EPS, smooth: false });
  edges.push({ from: '1', to: '3', label: EPS, smooth: false });

  let nextId = 4;

  function buildBranch(startId, y, tokens) {
    let currentFrom = startId;
    let xPos = dx * 2;
    for (let i = 0; i < tokens.length; i++) {
      const { sym, star } = tokens[i];
      const symId = String(nextId++);
      nodes.push({ id: symId, label: symId, shape: 'circle', x: xPos, y, fixed: true });
      edges.push({ from: String(currentFrom), to: symId, label: sym, smooth: false });
      const epsId = String(nextId++);
      nodes.push({ id: epsId, label: epsId, shape: 'circle', x: xPos + dx, y, fixed: true });
      edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
      if (star) {
        const typeSkip = 'curvedCW';
        const typeLoop = 'curvedCCW';
        edges.push({ from: String(currentFrom), to: epsId, label: EPS, smooth: { enabled: true, type: typeSkip, roundness: 0.6 } });
        edges.push({ from: symId, to: String(currentFrom), label: EPS, smooth: { enabled: true, type: typeLoop, roundness: 0.6 } });
      }
      currentFrom = Number(epsId);
      xPos += 2 * dx;
    }
    return { endEps: currentFrom, lastX: xPos - dx };
  }

  const left = buildBranch(2, -dy, tokensLeft);
  const right = buildBranch(3, dy, tokensRight);

  // Nodo de aceptación después de la rama más larga
  const finalX = Math.max(left.lastX, right.lastX) + dx;
  const finalId = String(nextId++);
  nodes.push({ id: finalId, label: finalId, shape: 'circle', x: finalX, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });

  // Epsilon hacia aceptación desde los finales de cada rama
  edges.push({ from: String(left.endEps), to: finalId, label: EPS, smooth: false });
  edges.push({ from: String(right.endEps), to: finalId, label: EPS, smooth: false });

  // Si la rama completa es Kleene, añadir skip y loop de bloque completo
  if (leftWholeStar) {
    edges.push({ from: '2', to: String(left.endEps), label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.65 } });
    edges.push({ from: String(left.endEps), to: '2', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.65 } });
  }
  if (rightWholeStar) {
    edges.push({ from: '3', to: String(right.endEps), label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.65 } });
    edges.push({ from: String(right.endEps), to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.65 } });
  }

  drawVisual(nodes, edges);
}

// Unión básica (x+y) con una cola de secuencia concatenada al final, p. ej. a+bc
function dibujarVisualUnionConCola(x, y, tailTokens) {
  const dxU = POS.dxUnion, dy = POS.dyUnion, dx = POS.dxSimple;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dxU, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dxU, y: -dy, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: dxU, y: dy, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 2*dxU, y: -dy, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 2*dxU, y: dy, fixed: true },
    { id: '6', label: '6', shape: 'circle', x: 3*dxU, y: 0, fixed: true },
  ];
  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '1', to: '3', label: EPS, smooth: false },
    { from: '2', to: '4', label: x, smooth: false },
    { from: '3', to: '5', label: y, smooth: false },
    { from: '4', to: '6', label: EPS, smooth: false },
    { from: '5', to: '6', label: EPS, smooth: false },
  ];

  // Extender cola desde 6: 6 —ε→ n —s1→ ε —s2→ ε ... —ε→ accept
  let nextId = 7;
  let currentFrom = '6';
  if (tailTokens.length > 0) {
    // epsilon a primer nodo previo a la cola
    const startTailId = String(nextId++);
    const baseX = 3*dxU + 0;
    nodes.push({ id: startTailId, label: startTailId, shape: 'circle', x: baseX, y: 0, fixed: true });
    edges.push({ from: currentFrom, to: startTailId, label: EPS, smooth: false });
    currentFrom = startTailId;

    for (let i = 0; i < tailTokens.length; i++) {
      const { sym, star } = tailTokens[i];
      const symId = String(nextId++);
      const xSym = baseX + (1 + 2 * i) * dx;
      nodes.push({ id: symId, label: symId, shape: 'circle', x: xSym, y: 0, fixed: true });
      edges.push({ from: currentFrom, to: symId, label: sym, smooth: false });
      const isLast = (i === tailTokens.length - 1);
      if (!isLast) {
        const epsId = String(nextId++);
        nodes.push({ id: epsId, label: epsId, shape: 'circle', x: baseX + (2 + 2 * i) * dx, y: 0, fixed: true });
        edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
        if (star) {
          const col = loopColor(i);
          edges.push({ from: currentFrom, to: epsId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
          edges.push({ from: symId, to: currentFrom, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
        currentFrom = epsId;
      } else {
        lastSymId = symId; lastStar = !!star; lastSkipFrom = currentFrom;
        if (star) {
          const col = loopColor(i);
          edges.push({ from: symId, to: currentFrom, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
      }
    }
  }
  // Aceptación final
  const acceptId = String(nextId++);
  nodes.push({ id: acceptId, label: acceptId, shape: 'circle', x: (3*dxU) + (2 * tailTokens.length + 1) * dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } });
  if (lastSymId) {
    edges.push({ from: lastSymId, to: acceptId, label: EPS, smooth: false });
    if (lastStar && lastSkipFrom) edges.push({ from: lastSkipFrom, to: acceptId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
  } else {
    edges.push({ from: currentFrom, to: acceptId, label: EPS, smooth: false });
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
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: simbolo, smooth: false },
    { from: '2', to: '3', label: EPS, smooth: false },
    // Aceptación del vacío desde el estado global de inicio (curva inferior)
    { from: '0', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.85 } },
    // Loop de repetición: 2 —ε→ 1 (curva superior)
    { from: '2', to: '1', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleeneUnion(x, y) {
  const dx = POS.dxUnion, dy = POS.dyUnion;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: -dy, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: dx, y: dy, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 2*dx, y: -dy, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 2*dx, y: dy, fixed: true },
    { id: '6', label: '6', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '7', label: '7', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: EPS, smooth: false },
    { from: '1', to: '3', label: EPS, smooth: false },
    { from: '2', to: '4', label: x, smooth: false },
    { from: '3', to: '5', label: y, smooth: false },
    { from: '4', to: '6', label: EPS, smooth: false },
    { from: '5', to: '6', label: EPS, smooth: false },
    // Cierre Kleene sobre (x+y): vacío desde inicio global y repetición
    // Curvas al mismo lado para evitar enredos visuales
    { from: '0', to: '7', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.85 } },
    { from: '6', to: '1', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.55 } },
    // Salida global desde 6
    { from: '6', to: '7', label: EPS, smooth: false },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualParenConcatKleene(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    // Entrada global
    { from: '0', to: '1', label: EPS, smooth: false },
    // Secuencia ab
    { from: '1', to: '2', label: x, smooth: false },
    { from: '2', to: '3', label: EPS, smooth: false },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // Repetición: 5 —ε→ 1 (vuelta al inicio del bloque) arriba
    { from: '5', to: '1', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.55 } },
    // Aceptación por vacío desde 0 hacia el aceptador (5) abajo
    { from: '0', to: '5', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.95 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleeneLuego(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: x, smooth: false },
    { from: '2', to: '3', label: EPS, smooth: false },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // Loop de Kleene sobre x (a*): skip y repetición
    { from: '1', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } },
    { from: '2', to: '1', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualConcatKleene(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: x, smooth: false },
    { from: '2', to: '3', label: EPS, smooth: false },
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // Loop de Kleene sobre y (b*): skip y repetición
    { from: '3', to: '5', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } },
    { from: '4', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualKleeneAmbosLados(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    // Inicio global
    { from: '0', to: '1', label: EPS, smooth: false },
    // a*
    { from: '1', to: '2', label: x, smooth: false },
    { from: '2', to: '3', label: EPS, smooth: false },
    // b*
    { from: '3', to: '4', label: y, smooth: false },
    { from: '4', to: '5', label: EPS, smooth: false },
    // a* skip y loop (una arriba y otra abajo)
    { from: '1', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } },
    { from: '2', to: '1', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
    // b* skip y loop
    { from: '3', to: '5', label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } },
    { from: '4', to: '3', label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } },
  ];

  drawVisual(nodes, edges);
}

function dibujarVisualConcat(x, y) {
  const dx = POS.dxSimple;
  const nodes = [
    { id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true },
    { id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true },
    { id: '2', label: '2', shape: 'circle', x: dx, y: 0, fixed: true },
    { id: '3', label: '3', shape: 'circle', x: 2*dx, y: 0, fixed: true },
    { id: '4', label: '4', shape: 'circle', x: 3*dx, y: 0, fixed: true },
    { id: '5', label: '5', shape: 'circle', x: 4*dx, y: 0, fixed: true, color: { border: '#16a34a', background: '#dcfce7' } },
  ];

  const edges = [
    { from: '0', to: '1', label: EPS, smooth: false },
    { from: '1', to: '2', label: x, smooth: false },
    { from: '2', to: '3', label: EPS, smooth: false },
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

  // Nodo global 0 y nodo de inicio 1
  nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
  nodes.push({ id: '1', label: '1', shape: 'circle', x: 0, y: 0, fixed: true });
  edges.push({ from: '0', to: '1', label: EPS, smooth: false });

  let currentFromId = 1; // antes del primer símbolo
  let nextId = 2;

  for (let i = 0; i < tokens.length; i++) {
    const { sym, star } = tokens[i];
    // nodo para la transición con símbolo
    const symId = String(nextId++);
    const xSym = (1 + 2 * i) * dx;
    nodes.push({ id: symId, label: symId, shape: 'circle', x: xSym, y: 0, fixed: true });
    const beforeId = String(currentFromId);
    edges.push({ from: beforeId, to: symId, label: sym, smooth: false });
    // nodo epsilon intermedio entre concatenaciones
    const epsId = String(nextId++);
    const xEps = (2 + 2 * i) * dx;
    nodes.push({ id: epsId, label: epsId, shape: 'circle', x: xEps, y: 0, fixed: true });
    edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
    if (star) {
      // skip y repetición para * (punteado en skip y color en loop)
      const col = loopColor(i);
      edges.push({ from: beforeId, to: epsId, label: EPS, dashes: true, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
      edges.push({ from: symId, to: beforeId, label: EPS, color: col, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
    }
    currentFromId = Number(epsId);
  }

  // El último nodo `epsId` es el de aceptación.
  nodes[nodes.length - 1].color = { border: '#16a34a', background: '#dcfce7' };

  drawVisual(nodes, edges);
}

function dibujarVisualDesdePatron(pattern) {
  const p = (pattern || '').trim();
  const mUnion = /^([a-zA-Z])\s*(\*)?\s*\+\s*([a-zA-Z])\s*(\*)?$/.exec(p);
  // Soportar unión parentizada simple: (a+b), con * opcional en cada lado
  const mParenUnion = /^\(\s*([a-zA-Z])\s*(\*)?\s*\+\s*([a-zA-Z])\s*(\*)?\s*\)$/.exec(p);
  // Unión de secuencias con paréntesis opcionales alrededor de cada lado: (ab)+b, a+(bc*), (ab)+(cd*)
  const mUnionSeqOptParen = /^\s*\(?\s*((?:[a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\)?\s*\+\s*\(?\s*((?:[a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\)?\s*$/.exec(p);
  const mUnionSeq = /^\s*(([a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\+\s*((?:[a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*$/.exec(p);
  // Cadena de uniones con 3+ términos sin paréntesis: a+b+c, ab+cd*+e
  const isUnionChain = !/[()]/.test(p) && /\+/.test(p) && (p.split('+').length >= 3) && /^\s*(?:[a-zA-Z]\*?(?:\s*\.?\s*[a-zA-Z]\*?)*)(?:\s*\+\s*(?:[a-zA-Z]\*?(?:\s*\.?\s*[a-zA-Z]\*?)*))+\s*$/.test(p);
  const mUnionWithTail = /^\s*([a-zA-Z])\s*\+\s*([a-zA-Z])\s*((?:\s*\.?\s*[a-zA-Z]\*?\s*)+)\s*$/.exec(p);
  // (x+y) concatenado con cola: (a+b)c, (a+b)bc*, etc.
  const mParenUnionWithTail = /^\(\s*([a-zA-Z])\s*\+\s*([a-zA-Z])\s*\)\s*((?:\s*\.?\s*[a-zA-Z]\*?\s*)+)\s*$/.exec(p);
  const mParenKleene = /^\(\s*([a-zA-Z])\s*\+\s*([a-zA-Z])\s*\)\s*\*$/.exec(p);
  // Kleene sobre cadena de uniones: (a+b+c+...)*
  const mParenUnionChainK = /^\(\s*(?:[a-zA-Z]\*?\s*(?:\+\s*[a-zA-Z]\*?)+)\s*\)\s*\*$/.exec(p);
  // (a+b+c+... ) concatenado con cola: (a+b+c+...) tail
  const mParenUnionChainWithTail = /^\(\s*((?:[a-zA-Z]\*?\s*(?:\+\s*[a-zA-Z]\*?)+))\s*\)\s*((?:\s*\.?\s*[a-zA-Z]\*?\s*)+)$/.exec(p);
  // (a+b+c+...)* concatenado con cola: (a+b+c+...)* tail
  const mParenUnionChainKWithTail = /^\(\s*((?:[a-zA-Z]\*?\s*(?:\+\s*[a-zA-Z]\*?)+))\s*\)\s*\*\s*((?:\s*\.?\s*[a-zA-Z]\*?\s*)+)$/.exec(p);
  const mParenConcatKleene = /^\(\s*([a-zA-Z])\s*\.?\s*([a-zA-Z])\s*\)\s*\*$/.exec(p);
  const isParenSeqKleene = /^\(\s*(?:[a-zA-Z]\*?\s*\.?\s*)+\)\s*\*$/.test(p);
  // (secuencia)* + secuencia   o   secuencia + (secuencia)*
  const mUnionParenSeqKleeneLeft = /^\(\s*(([a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\)\s*\*\s*\+\s*((?:[a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)$/.exec(p);
  const mUnionParenSeqKleeneRight = /^((?:[a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\+\s*\(\s*(([a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\)\s*\*$/.exec(p);
  const mUnionParenSeqKleeneBoth = /^\(\s*(([a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\)\s*\*\s*\+\s*\(\s*(([a-zA-Z]\*?)(?:\s*\.?\s*[a-zA-Z]\*?)*)\s*\)\s*\*$/.exec(p);
  const mKleeneConcat = /^([a-zA-Z])\*\s*\.?\s*([a-zA-Z])$/.exec(p);
  const mConcatKleene = /^([a-zA-Z])\s*\.?\s*([a-zA-Z])\*$/.exec(p);
  const mKleeneBothSides = /^([a-zA-Z])\*\s*\.?\s*([a-zA-Z])\*$/.exec(p);
  const mConcat = /^([a-zA-Z])\s*\.?\s*([a-zA-Z])$/.exec(p);
  const mParenConcat = /^\(\s*([a-zA-Z])\s*\.?\s*([a-zA-Z])\s*\)$/.exec(p);
  const mKleene = /^([a-zA-Z])\*$/.exec(p);
  const mSimple = /^([a-zA-Z])$/.exec(p);
  const mSeq = /^(?:\s*[a-zA-Z]\*?\s*\.?\s*){3,}$/.exec(p); // 3 o más símbolos (deja casos de 1-2 a handlers previos)

  // (secuencia)*: generaliza (ab)* a cualquier longitud con regla unificada
  if (isParenSeqKleene) {
    const inner = p.replace(/^\(\s*/, '').replace(/\s*\)\s*\*$/, '');
    const tokens = [];
    const re = /([a-zA-Z])(\*|\+)?/g;
    let m;
    while ((m = re.exec(inner)) !== null) tokens.push({ sym: m[1], star: m[2] === '*' });
    if (tokens.length >= 1) {
      const dx = POS.dxSimple;
      const nodes = [];
      const edges = [];
      
      // Nodo de inicio global
      nodes.push({ id: '0', label: '0', shape: 'circle', x: -dx, y: 0, fixed: true });
      let currentFromId = 0;
      let nextId = 1;

      // Nodo de inicio de la secuencia
      const seqStartId = String(nextId++);
      nodes.push({ id: seqStartId, label: seqStartId, shape: 'circle', x: 0, y: 0, fixed: true });
      edges.push({ from: String(currentFromId), to: seqStartId, label: EPS, smooth: false });
      currentFromId = Number(seqStartId);

      // Construir la secuencia
      for (let i = 0; i < tokens.length; i++) {
        const { sym, star } = tokens[i];
        const symId = String(nextId++);
        const xSym = (1 + 2 * i) * dx;
        nodes.push({ id: symId, label: symId, shape: 'circle', x: xSym, y: 0, fixed: true });
        edges.push({ from: String(currentFromId), to: symId, label: sym, smooth: false });
        
        const epsId = String(nextId++);
        const xEps = (2 + 2 * i) * dx;
        nodes.push({ id: epsId, label: epsId, shape: 'circle', x: xEps, y: 0, fixed: true });
        edges.push({ from: symId, to: epsId, label: EPS, smooth: false });
        if (star) {
          edges.push({ from: String(currentFromId), to: epsId, label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.6 } });
          edges.push({ from: symId, to: String(currentFromId), label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.6 } });
        }
        currentFromId = Number(epsId);
      }

      // El último nodo `epsId` es el final de la secuencia
      const seqEndId = String(currentFromId);
      
      // Marcar el nodo final como aceptación
      nodes[nodes.length - 1].color = { border: '#16a34a', background: '#dcfce7' };

      // Conexiones de Kleene
      // Repetición: final de secuencia -> inicio de secuencia
      edges.push({ from: seqEndId, to: seqStartId, label: EPS, smooth: { enabled: true, type: 'curvedCCW', roundness: 0.55 } });
      // Aceptación por vacío: inicio global -> final de secuencia
      edges.push({ from: '0', to: seqEndId, label: EPS, smooth: { enabled: true, type: 'curvedCW', roundness: 0.95 } });

      return drawVisual(nodes, edges);
    }
  }

  // Unión simple (x+y) primero para casos básicos como a+b
  // También aceptar la variante parentizada equivalente: (x+y)
  if (mParenUnion) {
    const x = mParenUnion[1];
    const leftStar = !!mParenUnion[2];
    const y = mParenUnion[3];
    const rightStar = !!mParenUnion[4];
    return dibujarVisualUnion(x, y, leftStar, rightStar);
  }

  if (mUnion) {
    const x = mUnion[1];
    const leftStar = !!mUnion[2];
    const y = mUnion[3];
    const rightStar = !!mUnion[4];
    return dibujarVisualUnion(x, y, leftStar, rightStar);
  }

  // Unión general con paréntesis opcionales en cada lado, p. ej., (ab)+b, a+(bc*), (ab)+(cd*)
  // Se evalúa después del caso base a+b para respetar el layout esperado de 0..7 en ese caso.
  if (mUnionSeqOptParen) {
    const leftStr = mUnionSeqOptParen[1];
    const rightStr = mUnionSeqOptParen[2];
    const tok = s => {
      const out = [];
      const re = /([a-zA-Z])(\*)?/g; let m;
      while ((m = re.exec(s)) !== null) out.push({ sym: m[1], star: !!m[2] });
      return out;
    };
    const tokensLeft = tok(leftStr);
    const tokensRight = tok(rightStr);
    if (tokensLeft.length >= 1 && tokensRight.length >= 1) return dibujarVisualUnionSecuencias(tokensLeft, tokensRight);
  }

  // Unión general de secuencias (p. ej., a+bb, ab+cd*, etc.)
  // Caso con Kleene aplicado al bloque completo en un lado: (ab)*+b o a+(bc)*
  if (mUnionParenSeqKleeneLeft) {
    const leftStr = mUnionParenSeqKleeneLeft[1];
    const rightStr = mUnionParenSeqKleeneLeft[3];
    const tok = s => {
      const out = [];
      const re = /([a-zA-Z])(\*)?/g; let m;
      while ((m = re.exec(s)) !== null) out.push({ sym: m[1], star: !!m[2] });
      return out;
    };
    const tokensLeft = tok(leftStr);
    const tokensRight = tok(rightStr);
    if (tokensLeft.length >= 1 && tokensRight.length >= 1) return dibujarVisualUnionSecuenciasConKleene(tokensLeft, tokensRight, true, false);
  }
  if (mUnionParenSeqKleeneBoth) {
    const leftStr = mUnionParenSeqKleeneBoth[1];
    const rightStr = mUnionParenSeqKleeneBoth[3];
    const tok = s => {
      const out = [];
      const re = /([a-zA-Z])(\*)?/g; let m;
      while ((m = re.exec(s)) !== null) out.push({ sym: m[1], star: !!m[2] });
      return out;
    };
    const tokensLeft = tok(leftStr);
    const tokensRight = tok(rightStr);
    if (tokensLeft.length >= 1 && tokensRight.length >= 1) return dibujarVisualUnionSecuenciasConKleene(tokensLeft, tokensRight, true, true);
  }
  if (mUnionParenSeqKleeneRight) {
    const leftStr = mUnionParenSeqKleeneRight[1];
    const rightStr = mUnionParenSeqKleeneRight[2];
    const tok = s => {
      const out = [];
      const re = /([a-zA-Z])(\*)?/g; let m;
      while ((m = re.exec(s)) !== null) out.push({ sym: m[1], star: !!m[2] });
      return out;
    };
    const tokensLeft = tok(leftStr);
    const tokensRight = tok(rightStr);
    if (tokensLeft.length >= 1 && tokensRight.length >= 1) return dibujarVisualUnionSecuenciasConKleene(tokensLeft, tokensRight, false, true);
  }

  if (mUnionSeq && !/[()]/.test(p)) {
    const leftStr = mUnionSeq[1];
    const rightStr = mUnionSeq[3];
    const tok = s => {
      const out = [];
      const re = /([a-zA-Z])(\*)?/g; let m;
      while ((m = re.exec(s)) !== null) out.push({ sym: m[1], star: !!m[2] });
      return out;
    };
    const tokensLeft = tok(leftStr);
    const tokensRight = tok(rightStr);
    if (tokensLeft.length >= 1 && tokensRight.length >= 1) return dibujarVisualUnionSecuencias(tokensLeft, tokensRight);
  }

  // Unión de 3 o más términos (sin paréntesis): a+b+c ...
  if (isUnionChain) {
    const parts = p.split('+');
    const tok = s => {
      const out = [];
      const re = /([a-zA-Z])(\*)?/g; let m;
      while ((m = re.exec(s)) !== null) out.push({ sym: m[1], star: !!m[2] });
      return out;
    };
    const branches = parts.map(s => tok(s));
    if (branches.every(b => b.length >= 1)) return dibujarVisualUnionMultiple(branches);
  }

  // Caso específico: (x+y) concatenado con cola (p. ej., a+bc ≡ (a+b)c)
  if (mUnionWithTail && !/[()]/.test(p)) {
    const x = mUnionWithTail[1];
    const y = mUnionWithTail[2];
    const tailStr = mUnionWithTail[3];
    const tokens = [];
    const re = /([a-zA-Z])(\*)?/g; let m;
    while ((m = re.exec(tailStr)) !== null) tokens.push({ sym: m[1], star: !!m[2] });
    if (tokens.length >= 1) return dibujarVisualUnionConCola(x, y, tokens);
  }
  if (mParenUnionWithTail) {
    const x = mParenUnionWithTail[1];
    const y = mParenUnionWithTail[2];
    const tailStr = mParenUnionWithTail[3];
    const tokens = [];
    const re = /([a-zA-Z])(\*)?/g; let m;
    while ((m = re.exec(tailStr)) !== null) tokens.push({ sym: m[1], star: !!m[2] });
    if (tokens.length >= 1) return dibujarVisualUnionConCola(x, y, tokens);
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
  if (mParenConcat) {
    const x = mParenConcat[1];
    const y = mParenConcat[2];
    return dibujarVisualConcat(x, y);
  }
  if (mConcat) {
    const x = mConcat[1];
    const y = mConcat[2];
    return dibujarVisualConcat(x, y);
  }
  if (mKleene) {
    return dibujarVisualKleene(mKleene[1]);
  }
  // (a+b+c+...)* → aplicar split/join y añadir las dos epsilons del Kleene externo
  if (mParenUnionChainK) {
    const inner = p.replace(/^\(\s*/, '').replace(/\)\s*\*\s*$/, '');
    const parts = inner.split('+').map(s => s.trim()).filter(Boolean);
    const branches = parts.map(sym => [{ sym: sym.replace(/\s|\.|\*/g, ''), star: false }]);
    if (branches.length >= 2) return dibujarVisualUnionMultipleKleene(branches);
  }
  // (a+b+c+...) tail
  if (mParenUnionChainWithTail) {
    const inner = mParenUnionChainWithTail[1];
    const tailStr = mParenUnionChainWithTail[2];
    const parts = inner.split('+').map(s => s.trim()).filter(Boolean);
    const branches = parts.map(sym => [{ sym: sym.replace(/\s|\./g, '').replace(/\*/g, ''), star: /\*/.test(sym) }]);
    const tokens = []; const re = /([a-zA-Z])(\*)?/g; let m;
    while ((m = re.exec(tailStr)) !== null) tokens.push({ sym: m[1], star: !!m[2] });
    if (branches.length >= 2 && tokens.length >= 1) return dibujarVisualUnionMultipleConCola(branches, tokens);
  }
  // (a+b+c+...)* tail
  if (mParenUnionChainKWithTail) {
    const inner = mParenUnionChainKWithTail[1];
    const tailStr = mParenUnionChainKWithTail[2];
    const parts = inner.split('+').map(s => s.trim()).filter(Boolean);
    const branches = parts.map(sym => [{ sym: sym.replace(/\s|\./g, '').replace(/\*/g, ''), star: /\*/.test(sym) }]);
    const tokens = []; const re = /([a-zA-Z])(\*)?/g; let m;
    while ((m = re.exec(tailStr)) !== null) tokens.push({ sym: m[1], star: !!m[2] });
    if (branches.length >= 2 && tokens.length >= 1) return dibujarVisualUnionMultipleKleeneConCola(branches, tokens);
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
