// ---------- Constantes y estado ----------
const CW = 1080, CH = 630;           // resolución interna de todos los lienzos
const TEST_KEYS = ['house', 'constellation', 'color', 'maze'];
const TESTS = {
    house:         { title: 'Test de la Casa (Espacio Habitable)',        short: 'Test de la Casa' },
    constellation: { title: 'Constelación Familiar / Vincular',           short: 'Constelación Familiar' },
    color:         { title: 'Dinámica Cromática y Expresión Emocional',   short: 'Dinámica Cromática' },
    maze:          { title: 'Laberinto Estructural Complejo (Adultos)',   short: 'Laberinto Estructural' }
};

const $ = (id) => document.getElementById(id);

let patient = { name: '', id: '', age: '' };
let testData = { house: null, constellation: null, color: null, maze: null };
let elapsedMs = { house: 0, constellation: 0, color: 0, maze: 0 };
let dirty = { house: false, constellation: false, color: false, maze: false };
let obs = { house: '', constellation: '', color: '', maze: '', general: '' };
let activeTest = null, startTime = 0;

// ---------- Utilidades ----------
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

function clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Coordenadas del puntero en el espacio interno del lienzo (funciona aunque el lienzo se escale por CSS)
function canvasPoint(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) * canvas.width / r.width,
        y: (e.clientY - r.top) * canvas.height / r.height
    };
}

// Dibujo con Pointer Events: mouse, táctil y lápiz
function bindDrawing(canvas, h) {
    let drawing = false, last = null;
    canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        drawing = true;
        last = canvasPoint(canvas, e);
        h.draw(last, last);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        const p = canvasPoint(canvas, e);
        h.draw(last, p);
        last = p;
    });
    const stop = () => { drawing = false; last = null; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
}

function setActiveTool(btn) {
    btn.parentElement.querySelectorAll('button[data-tool]').forEach(b => b.classList.toggle('active', b === btn));
}

function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

// ---------- Flujo principal ----------
function startEvaluation() {
    const name = $('p-name').value.trim();
    const age = $('p-age').value.trim();
    if (!name) {
        alert('Por favor ingrese al menos el nombre del evaluado.');
        $('p-name').focus();
        return;
    }
    if (age !== '' && (isNaN(age) || Number(age) < 0 || Number(age) > 120)) {
        alert('La edad debe ser un número entre 0 y 120.');
        $('p-age').focus();
        return;
    }
    patient.name = name;
    patient.id = $('p-id').value.trim() || 'S/D';
    patient.age = age || 'S/D';
    $('lbl-patient-name').textContent = patient.name;
    if (evaluationStarted) {          // solo se estaban corrigiendo los datos
        refreshMenu();
        switchScreen('screen-menu');
    } else {
        showConfig(false);
    }
}

function refreshMenu() {
    TEST_KEYS.forEach(k => $('card-' + k).classList.toggle('completed', !!testData[k]));
}

function enterTest(type) { activeTest = type; startTime = Date.now(); }
function leaveTest() {
    if (activeTest) elapsedMs[activeTest] += Date.now() - startTime;
    activeTest = null;
}

function loadTest(type) {
    enterTest(type);
    switchScreen('screen-' + type);
}

function backToMenu(force) {
    if (!force && activeTest && dirty[activeTest] &&
        !confirm('Hay cambios sin guardar en esta prueba. ¿Regresar al menú de todos modos?\n(El informe usará la última versión guardada.)')) {
        return;
    }
    leaveTest();
    refreshMenu();
    switchScreen('screen-menu');
}

function confirmClear(canvasId, type) {
    if (!confirm('¿Limpiar el lienzo? Se perderá lo dibujado.')) return;
    clearCanvas($(canvasId));
    dirty[type] = true;
}

// ---------- CASA ----------
let houseTool = 'pen';
function setHouseTool(t, btn) { houseTool = t; setActiveTool(btn); }

function initHouseCanvas() {
    const c = $('houseCanvas');
    c.width = CW; c.height = CH;
    clearCanvas(c);
    const ctx = c.getContext('2d');
    const widths = { pen: 4, brush: 15, eraser: 30 };
    bindDrawing(c, {
        draw: (a, b) => {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = widths[houseTool];
            ctx.strokeStyle = houseTool === 'eraser' ? '#FFFFFF' : $('house-color').value;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
            dirty.house = true;
        }
    });
}

// ---------- CONSTELACIÓN FAMILIAR ----------
let selectedItem = null;

function selectItem(div) {
    if (selectedItem) selectedItem.classList.remove('selected');
    selectedItem = div;
    if (div) div.classList.add('selected');
}

function placeItem(div, fx, fy) {
    div.dataset.fx = fx;
    div.dataset.fy = fy;
    div.style.left = (fx * 100) + '%';
    div.style.top = (fy * 100) + '%';
}

function addConstellationItem(label, isCircle) {
    const ws = $('constellation-workspace');
    const max = config.tests.constellation.maxItems;
    if (max && ws.children.length >= max) {
        alert(`Se alcanzó el máximo de ${max} elementos.`);
        return;
    }
    const div = document.createElement('div');
    div.className = 'placed-item ' + (isCircle ? 'circle' : 'rect');
    div.dataset.circle = isCircle ? '1' : '0';
    div.textContent = label;

    const n = ws.children.length;                       // posición inicial escalonada
    placeItem(div, 0.04 + ((n * 0.07) % 0.55), 0.06 + ((n * 0.09) % 0.6));
    ws.appendChild(div);

    div.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectItem(div);
        div.setPointerCapture(e.pointerId);
        const er = div.getBoundingClientRect();
        const ox = e.clientX - er.left, oy = e.clientY - er.top;
        const move = (ev) => {
            const wr = ws.getBoundingClientRect();
            const x = Math.max(0, Math.min(wr.width - div.offsetWidth, ev.clientX - wr.left - ox));
            const y = Math.max(0, Math.min(wr.height - div.offsetHeight, ev.clientY - wr.top - oy));
            placeItem(div, x / wr.width, y / wr.height);
            dirty.constellation = true;
        };
        const up = () => {
            div.removeEventListener('pointermove', move);
            div.removeEventListener('pointerup', up);
            div.removeEventListener('pointercancel', up);
        };
        div.addEventListener('pointermove', move);
        div.addEventListener('pointerup', up);
        div.addEventListener('pointercancel', up);
    });
    div.addEventListener('dblclick', () => { selectItem(div); renameSelected(); });

    selectItem(div);
    dirty.constellation = true;
}

function renameSelected() {
    if (!selectedItem) { alert('Seleccione primero un elemento del plano.'); return; }
    const t = prompt('Rótulo del elemento:', selectedItem.textContent);
    if (t !== null && t.trim()) {
        selectedItem.textContent = t.trim().slice(0, 24);
        dirty.constellation = true;
    }
}

function deleteSelected() {
    if (!selectedItem) { alert('Seleccione primero un elemento del plano.'); return; }
    selectedItem.remove();
    selectedItem = null;
    dirty.constellation = true;
}

function wipeConstellation() {
    $('constellation-workspace').innerHTML = '';
    selectedItem = null;
}

function clearConstellation() {
    if ($('constellation-workspace').children.length && !confirm('¿Limpiar el plano? Se quitarán todos los elementos.')) return;
    wipeConstellation();
    dirty.constellation = true;
}

function wrapText(ctx, text, cx, cy, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = w; }
        else line = test;
    });
    if (line) lines.push(line);
    const y0 = cy - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx, y0 + i * lineHeight));
}

// Genera la imagen de la constelación reproduciendo lo que se ve en pantalla
function renderConstellationImage() {
    const ws = $('constellation-workspace');
    const wr = ws.getBoundingClientRect();
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CW, CH);
    const k = CW / wr.width;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ws.querySelectorAll('.placed-item').forEach(el => {
        const er = el.getBoundingClientRect();
        const x = (er.left - wr.left) * k, y = (er.top - wr.top) * k;
        const w = er.width * k, h = er.height * k;
        const fs = parseFloat(getComputedStyle(el).fontSize) * k;
        ctx.font = `bold ${fs}px system-ui, sans-serif`;
        if (el.dataset.circle === '1') {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            wrapText(ctx, el.textContent, x + w / 2, y + h / 2, w * 0.85, fs * 1.1);
        } else {
            ctx.fillStyle = '#14b8a6';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#0f172a';
            ctx.fillText(el.textContent, x + w / 2, y + h / 2);
        }
    });
    return c;
}

// ---------- DINÁMICA CROMÁTICA ----------
let colorTool = 'fluid';
function setColorTool(t, btn) { colorTool = t; setActiveTool(btn); }

function initColorCanvas() {
    const c = $('colorCanvas');
    c.width = CW; c.height = CH;
    clearCanvas(c);
    const ctx = c.getContext('2d');
    bindDrawing(c, {
        draw: (a, b) => {
            const col = $('paint-color').value;   // se lee siempre al dibujar
            ctx.save();
            if (colorTool === 'fluid') {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 14;
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            } else {
                ctx.fillStyle = col;
                ctx.globalAlpha = 0.35;
                for (let i = 0; i < 5; i++) {
                    const ang = Math.random() * Math.PI * 2, d = Math.random() * 26;
                    ctx.beginPath();
                    ctx.arc(b.x + Math.cos(ang) * d, b.y + Math.sin(ang) * d, 10 + Math.random() * 22, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
            dirty.color = true;
        }
    });
}

// ---------- LABERINTO ----------
// Cada nivel tiene su propia cuadrícula y una franja de dificultad aceptable, medida sobre el
// recorrido óptimo (celdas de la entrada a la salida vs. el mínimo posible) y las bifurcaciones
// que hay en ese recorrido. Los laberintos demasiado directos se descartan de forma
// determinista: el mismo nivel + el mismo número dan siempre el mismo laberinto.
const MAZE_MAX = 9999;   // por nivel: laberintos numerados del 1 al MAZE_MAX
const MAZE_LEVELS = {
    facil:   { label: 'Fácil',   cols: 16, rows: 9,  loops: 3, ratio: [2.0, 3.0], minJunctions: 6 },
    media:   { label: 'Media',   cols: 20, rows: 11, loops: 3, ratio: [2.8, 3.8], minJunctions: 9 },
    dificil: { label: 'Difícil', cols: 25, rows: 14, loops: 2, ratio: [3.6, 5.0], minJunctions: 13 }
};
let COLS = 20, ROWS = 11;
let mazeCells = null, mazeSeed = 1, mazeLevel = 'media', mazeInfo = null, mazeHasPath = false;
const randomMazeSeed = () => 1 + Math.floor(Math.random() * MAZE_MAX);

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function buildMaze(rnd, cols, rows, loops) {
    const cells = [];
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            cells.push({ r, c, w: { t: true, r: true, b: true, l: true }, v: false });
    const at = (r, c) => cells[r * cols + c];

    // Recorrido en profundidad (backtracker): laberinto perfecto
    const stack = [at(0, 0)];
    at(0, 0).v = true;
    while (stack.length) {
        const cur = stack[stack.length - 1];
        const nb = [];
        if (cur.r > 0 && !at(cur.r - 1, cur.c).v) nb.push([at(cur.r - 1, cur.c), 't', 'b']);
        if (cur.c < cols - 1 && !at(cur.r, cur.c + 1).v) nb.push([at(cur.r, cur.c + 1), 'r', 'l']);
        if (cur.r < rows - 1 && !at(cur.r + 1, cur.c).v) nb.push([at(cur.r + 1, cur.c), 'b', 't']);
        if (cur.c > 0 && !at(cur.r, cur.c - 1).v) nb.push([at(cur.r, cur.c - 1), 'l', 'r']);
        if (!nb.length) { stack.pop(); continue; }
        const [n, a, b] = nb[Math.floor(rnd() * nb.length)];
        cur.w[a] = false; n.w[b] = false; n.v = true;
        stack.push(n);
    }

    // Pasillos alternativos: solo paredes interiores, abriendo ambos lados
    let opened = 0, tries = 0;
    while (opened < loops && tries < 1000) {
        tries++;
        const cell = cells[Math.floor(rnd() * cells.length)];
        if (rnd() < 0.5) {
            if (cell.c < cols - 1 && cell.w.r) { cell.w.r = false; at(cell.r, cell.c + 1).w.l = false; opened++; }
        } else {
            if (cell.r < rows - 1 && cell.w.b) { cell.w.b = false; at(cell.r + 1, cell.c).w.t = false; opened++; }
        }
    }
    return cells;
}

// Recorrido óptimo (BFS) y bifurcaciones a lo largo de ese recorrido
function analyzeMaze(cells, cols, rows) {
    const prev = new Array(cells.length).fill(-1);
    const queue = [0];
    prev[0] = 0;
    for (let q = 0; q < queue.length; q++) {
        const i = queue[q], c = cells[i];
        const ns = [];
        if (!c.w.t) ns.push(i - cols);
        if (!c.w.b) ns.push(i + cols);
        if (!c.w.l) ns.push(i - 1);
        if (!c.w.r) ns.push(i + 1);
        ns.forEach(n => { if (prev[n] < 0) { prev[n] = i; queue.push(n); } });
    }
    const path = [];
    for (let i = cells.length - 1; i !== 0; i = prev[i]) path.push(i);
    path.push(0);
    let junctions = 0;
    path.slice(1, -1).forEach(i => {
        const open = Object.values(cells[i].w).filter(x => !x).length;
        if (open >= 3) junctions++;
    });
    return { length: path.length, junctions, ratio: path.length / (cols + rows - 1) };
}

function generateMaze(seed, levelKey) {
    const cfg = MAZE_LEVELS[levelKey];
    let best = null, bestDev = Infinity;
    for (let attempt = 0; attempt < 600; attempt++) {
        const rnd = mulberry32((Math.imul(seed, 2654435761) + Math.imul(attempt, 40503)) >>> 0);
        const cells = buildMaze(rnd, cfg.cols, cfg.rows, cfg.loops);
        const info = analyzeMaze(cells, cfg.cols, cfg.rows);
        const dev = Math.max(0, cfg.ratio[0] - info.ratio, info.ratio - cfg.ratio[1]) +
                    Math.max(0, cfg.minJunctions - info.junctions) / 10;
        if (dev === 0) return { cells, info };
        if (dev < bestDev) { bestDev = dev; best = { cells, info }; }
    }
    return best;   // no debería ocurrir: se devuelve el más cercano a la franja
}

// Registro del recorrido del participante, medido en celdas del laberinto
let mazeTrace = null;

function resetMazeTrace() {
    mazeTrace = { cells: 0, visited: new Set(), crossings: 0, reachedExit: false, prev: null, lastCell: null };
}

// ¿Pasar de la celda a a la celda b atraviesa una pared?
function wallBetween(a, b) {
    const dr = b.r - a.r, dc = b.c - a.c;
    const cellAt = (r, c) => mazeCells[r * COLS + c];
    if (Math.abs(dr) + Math.abs(dc) === 1) {
        const w = cellAt(a.r, a.c).w;
        return dr === -1 ? w.t : dr === 1 ? w.b : dc === -1 ? w.l : w.r;
    }
    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {   // paso diagonal por una esquina
        const v1 = { r: a.r, c: b.c }, v2 = { r: b.r, c: a.c };
        return (wallBetween(a, v1) || wallBetween(v1, b)) && (wallBetween(a, v2) || wallBetween(v2, b));
    }
    return true;
}

// Recorre el segmento a→b en pasos cortos para no saltarse ninguna celda
function traceMazeSegment(a, b, newStroke) {
    const t = mazeTrace, cw = CW / COLS, ch = CH / ROWS;
    if (newStroke) t.prev = null;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (Math.min(cw, ch) / 3)));
    for (let i = 0; i <= steps; i++) {
        const x = a.x + (b.x - a.x) * i / steps;
        const y = a.y + (b.y - a.y) * i / steps;
        const c = Math.floor(x / cw), r = Math.floor(y / ch);
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) { t.prev = null; continue; }
        const cell = { r, c };
        if (t.prev && t.prev.r === r && t.prev.c === c) continue;
        if (!t.prev && t.lastCell && t.lastCell.r === r && t.lastCell.c === c) { t.prev = cell; continue; }
        if (t.prev && wallBetween(t.prev, cell)) t.crossings++;
        t.cells++;
        t.visited.add(r * COLS + c);
        if (r === ROWS - 1 && c === COLS - 1) t.reachedExit = true;
        t.prev = cell;
        t.lastCell = cell;
    }
}

function drawMaze() {
    const c = $('mazeCanvas');
    const ctx = c.getContext('2d');
    clearCanvas(c);
    const cw = c.width / COLS, ch = c.height / ROWS;

    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    mazeCells.forEach(cell => {
        const x = cell.c * cw, y = cell.r * ch;
        if (cell.w.t) { ctx.moveTo(x, y); ctx.lineTo(x + cw, y); }
        if (cell.w.l) { ctx.moveTo(x, y); ctx.lineTo(x, y + ch); }
        if (cell.c === COLS - 1 && cell.w.r) { ctx.moveTo(x + cw, y); ctx.lineTo(x + cw, y + ch); }
        if (cell.r === ROWS - 1 && cell.w.b) { ctx.moveTo(x, y + ch); ctx.lineTo(x + cw, y + ch); }
    });
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cw * 0.15, ch * 0.15, cw * 0.7, ch * 0.7);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(cw * (COLS - 1) + cw * 0.15, ch * (ROWS - 1) + ch * 0.15, cw * 0.7, ch * 0.7);
    ctx.restore();
    mazeHasPath = false;
    resetMazeTrace();
}

function applyMaze(seed, levelKey) {
    const cfg = MAZE_LEVELS[levelKey];
    mazeLevel = levelKey;
    mazeSeed = seed;
    COLS = cfg.cols;
    ROWS = cfg.rows;
    const g = generateMaze(seed, levelKey);
    mazeCells = g.cells;
    mazeInfo = g.info;
    $('maze-info').textContent = `Dificultad ${cfg.label} · Laberinto Nº ${seed} · Recorrido óptimo: ${g.info.length} celdas · Bifurcaciones en ese recorrido: ${g.info.junctions}`;
    drawMaze();
}

function clearMazePath() {
    if (mazeHasPath && !confirm('¿Borrar el trazo del laberinto?')) return;
    drawMaze();
    dirty.maze = true;
}

function initMazeCanvas() {
    const c = $('mazeCanvas');
    c.width = CW; c.height = CH;
    applyMaze(config.tests.maze.seed, config.tests.maze.level);
    const ctx = c.getContext('2d');
    bindDrawing(c, {
        draw: (a, b) => {
            traceMazeSegment(a, b, a === b);   // a === b solo al apoyar (inicio de trazo)
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = parseFloat($('maze-size').value) * 1.5;
            ctx.strokeStyle = '#2563eb';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
            mazeHasPath = true;
            dirty.maze = true;
        }
    });
}

function mazeTraceMeta(d) {
    const t = d.trace;
    if (!t || !t.cells) return 'Recorrido del participante: sin trazo registrado';
    const diff = t.cells - d.optimal;
    return `Recorrido del participante: ${t.cells} celdas (${diff >= 0 ? '+' : ''}${diff} respecto al óptimo de ${d.optimal}) | Celdas distintas: ${t.distinct} | Cruces de pared: ${t.crossings} | Llegó a la salida: ${t.reachedExit ? 'sí' : 'no'}`;
}

function mazeMeta(d) {
    return ` | Dificultad ${d.level} | Laberinto Nº ${d.seed} | Recorrido óptimo: ${d.optimal} celdas`;
}

// Pantalla completa del laberinto: modo fijo por CSS (funciona en cualquier navegador)
// + Fullscreen API cuando existe, para ocultar las barras del navegador
let mazeNativeFs = false;

function fitMazeCanvas() {
    const stage = $('maze-stage'), c = $('mazeCanvas');
    if (!stage.classList.contains('fs')) { c.style.width = ''; c.style.height = ''; return; }
    const aw = stage.clientWidth - 8;
    const ah = stage.clientHeight - $('maze-fs-bar').offsetHeight - 8;
    if (aw <= 0 || ah <= 0) return;
    const k = Math.min(aw / CW, ah / CH);
    c.style.width = Math.floor(CW * k) + 'px';
    c.style.height = Math.floor(CH * k) + 'px';
}

function setMazeFullscreen(on) {
    const stage = $('maze-stage');
    stage.classList.toggle('fs', on);
    document.body.style.overflow = on ? 'hidden' : '';
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (on) {
        const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
        if (req && !fsEl) {
            try { const r = req.call(stage); if (r && r.catch) r.catch(() => {}); } catch (err) { /* sin API: queda el modo CSS */ }
        }
    } else {
        mazeNativeFs = false;
        if (fsEl) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            try { const r = exit.call(document); if (r && r.catch) r.catch(() => {}); } catch (err) {}
        }
    }
    fitMazeCanvas();
    setTimeout(fitMazeCanvas, 150);
}

function toggleMazeFullscreen() {
    setMazeFullscreen(!$('maze-stage').classList.contains('fs'));
}

function onFullscreenChange() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl === $('maze-stage')) mazeNativeFs = true;
    else if (mazeNativeFs) setMazeFullscreen(false);   // salió con gesto o Esc del sistema
    setTimeout(fitMazeCanvas, 150);
}

// ---------- CONFIGURACIÓN DE LA EVALUACIÓN ----------
// Los parámetros se definen antes de comenzar (pantalla de configuración), vienen con valores por
// defecto y lo que efectivamente se usó en cada prueba queda registrado en el informe.
const COLOR_PALETTE = [
    { id: 'rojo',     name: 'Rojo',     hex: '#dc2626' },
    { id: 'naranja',  name: 'Naranja',  hex: '#ea580c' },
    { id: 'amarillo', name: 'Amarillo', hex: '#facc15' },
    { id: 'verde',    name: 'Verde',    hex: '#16a34a' },
    { id: 'celeste',  name: 'Celeste',  hex: '#0ea5e9' },
    { id: 'azul',     name: 'Azul',     hex: '#1d4ed8' },
    { id: 'violeta',  name: 'Violeta',  hex: '#7c3aed' },
    { id: 'marron',   name: 'Marrón',   hex: '#78350f' },
    { id: 'negro',    name: 'Negro',    hex: '#0f172a' }
];
const CONST_PRESETS = {
    generica: { circles: ['Principal', 'Vínculo Cercano', 'F. Periférica'], rects: ['Obstáculo', 'Refugio'] },
    familiar: { circles: ['Yo', 'Madre', 'Padre', 'Hermano/a', 'Pareja', 'Hijo/a', 'Otro'], rects: ['Obstáculo', 'Refugio'] },
    laboral:  { circles: ['Yo', 'Jefe/a', 'Compañero/a', 'Equipo', 'Cliente'], rects: ['Obstáculo', 'Refugio'] }
};
const PROFILE_KEY = 'psimatrix_perfiles_v1';

function defaultConfig() {
    return {
        device: '',
        timerVisible: false,
        limitAction: 'avisar',
        order: TEST_KEYS.slice(),
        tests: {
            house: {
                enabled: true, limitMin: 0, color: true, eraser: true,
                consigna: 'Dibuje una casa o espacio habitable utilizando las herramientas provistas.'
            },
            constellation: {
                enabled: true, limitMin: 0, mode: 'fija', maxItems: 0,
                circles: CONST_PRESETS.generica.circles.slice(), rects: CONST_PRESETS.generica.rects.slice(),
                consigna: 'Seleccione elementos de la paleta y ubíquelos libremente en el plano.'
            },
            color: {
                enabled: true, limitMin: 0, paletteMode: 'libre', colors: COLOR_PALETTE.map(c => c.id),
                tools: { fluid: true, splash: true },
                consigna: 'Exprese libremente un estado afectivo o vivencia mediante el color y el trazo fluido.'
            },
            maze: {
                enabled: true, limitMin: 0, level: 'media', seed: randomMazeSeed(),
                consigna: 'Trace un recorrido continuo desde la Entrada (Verde) hasta la Salida (Roja).'
            }
        }
    };
}

let config = null;                 // configuración vigente
let cfgFromMenu = false;           // la pantalla de configuración se abrió desde el menú
let evaluationStarted = false;     // ya se confirmó la configuración para este evaluado
const limitFired = { house: false, constellation: false, color: false, maze: false };

const activeKeys = () => config.order.filter(k => config.tests[k].enabled);

// --- Formulario de configuración ---
function buildConfigUI() {
    const box = $('cfg-color-swatches');
    COLOR_PALETTE.forEach(c => {
        const cb = el('input', { type: 'checkbox', value: c.id });
        const dot = el('span', { className: 'dot' });
        dot.style.background = c.hex;
        box.appendChild(el('label', { className: 'cfg-swatch' }, [cb, dot, c.name]));
    });
}

function fillConfigForm(cfg) {
    $('cfg-device').value = cfg.device;
    $('cfg-timer-visible').checked = cfg.timerVisible;
    $('cfg-limit-action').value = cfg.limitAction;
    cfg.order.forEach(k => $('cfg-tests').appendChild($('cfg-card-' + k)));
    TEST_KEYS.forEach(k => {
        $('cfg-' + k + '-enabled').checked = cfg.tests[k].enabled;
        $('cfg-' + k + '-consigna').value = cfg.tests[k].consigna;
        $('cfg-' + k + '-limit').value = cfg.tests[k].limitMin;
    });
    const h = cfg.tests.house;
    $('cfg-house-color').checked = h.color;
    $('cfg-house-eraser').checked = h.eraser;
    const c = cfg.tests.constellation;
    $('cfg-const-mode').value = c.mode;
    $('cfg-const-circles').value = c.circles.join('\n');
    $('cfg-const-rects').value = c.rects.join('\n');
    $('cfg-const-max').value = c.maxItems;
    const cc = cfg.tests.color;
    $('cfg-color-mode').value = cc.paletteMode;
    $('cfg-color-swatches').querySelectorAll('input').forEach(i => { i.checked = cc.colors.includes(i.value); });
    $('cfg-color-fluid').checked = cc.tools.fluid;
    $('cfg-color-splash').checked = cc.tools.splash;
    $('cfg-maze-level').value = cfg.tests.maze.level;
    $('cfg-maze-seed').value = cfg.tests.maze.seed;
    updateCfgVisibility();
    updateMazePreview();
}

function updateCfgVisibility() {
    TEST_KEYS.forEach(k => $('cfg-card-' + k).classList.toggle('off', !$('cfg-' + k + '-enabled').checked));
    $('cfg-const-fixed').style.display = $('cfg-const-mode').value === 'fija' ? '' : 'none';
    $('cfg-color-swatches-wrap').style.display = $('cfg-color-mode').value === 'fija' ? '' : 'none';
}

function moveCfgCard(k, dir) {
    const card = $('cfg-card-' + k), box = card.parentElement;
    if (dir < 0 && card.previousElementSibling) box.insertBefore(card, card.previousElementSibling);
    if (dir > 0 && card.nextElementSibling) box.insertBefore(card.nextElementSibling, card);
}

function applyConstPreset() {
    const sel = $('cfg-const-preset'), p = CONST_PRESETS[sel.value];
    if (p) {
        $('cfg-const-circles').value = p.circles.join('\n');
        $('cfg-const-rects').value = p.rects.join('\n');
    }
    sel.value = '';
}

function cfgRandomMazeSeed() {
    $('cfg-maze-seed').value = randomMazeSeed();
    updateMazePreview();
}

function updateMazePreview() {
    const level = $('cfg-maze-level').value, raw = $('cfg-maze-seed').value.trim(), box = $('cfg-maze-preview');
    if (raw === '') { box.textContent = 'Campo vacío: se elegirá un laberinto al azar al confirmar.'; return; }
    const seed = Number(raw);
    if (!Number.isInteger(seed) || seed < 1 || seed > MAZE_MAX) {
        box.textContent = `Ingrese un número entero entre 1 y ${MAZE_MAX}.`;
        return;
    }
    const cfg = MAZE_LEVELS[level], g = generateMaze(seed, level);
    box.textContent = `Cuadrícula ${cfg.cols}×${cfg.rows} · Recorrido óptimo: ${g.info.length} celdas · Bifurcaciones en ese recorrido: ${g.info.junctions}`;
}

// Lee y valida el formulario; devuelve la configuración o null (mostrando el motivo)
function readConfigForm() {
    const fail = (msg, id) => { alert(msg); if (id && $(id)) $(id).focus(); return null; };
    const cfg = {
        device: $('cfg-device').value,
        timerVisible: $('cfg-timer-visible').checked,
        limitAction: $('cfg-limit-action').value,
        order: [...$('cfg-tests').children].map(c => c.dataset.test),
        tests: {}
    };
    if (!cfg.device) return fail('Seleccione el dispositivo y la forma de ingreso con que se realizarán las pruebas.', 'cfg-device');

    TEST_KEYS.forEach(k => {
        cfg.tests[k] = {
            enabled: $('cfg-' + k + '-enabled').checked,
            consigna: $('cfg-' + k + '-consigna').value.trim(),
            limitMin: Number($('cfg-' + k + '-limit').value || 0)
        };
    });
    if (!TEST_KEYS.some(k => cfg.tests[k].enabled)) return fail('Seleccione al menos una prueba para la batería.');

    for (const k of TEST_KEYS) {
        const lim = cfg.tests[k].limitMin;
        if (cfg.tests[k].enabled && (!Number.isInteger(lim) || lim < 0 || lim > 240)) {
            return fail(`Límite de tiempo de «${TESTS[k].short}»: ingrese un número entero de minutos entre 0 y 240 (0 = sin límite).`, 'cfg-' + k + '-limit');
        }
    }

    Object.assign(cfg.tests.house, { color: $('cfg-house-color').checked, eraser: $('cfg-house-eraser').checked });

    const lines = (id) => $(id).value.split('\n').map(s => s.trim().slice(0, 24)).filter(Boolean);
    const maxItems = Number($('cfg-const-max').value || 0);
    Object.assign(cfg.tests.constellation, {
        mode: $('cfg-const-mode').value, circles: lines('cfg-const-circles'), rects: lines('cfg-const-rects'), maxItems
    });
    if (cfg.tests.constellation.enabled) {
        if (!Number.isInteger(maxItems) || maxItems < 0 || maxItems > 50) return fail('Máximo de elementos de la Constelación: ingrese un entero entre 0 y 50 (0 = sin límite).', 'cfg-const-max');
        if (cfg.tests.constellation.mode === 'fija' && !cfg.tests.constellation.circles.length && !cfg.tests.constellation.rects.length) {
            return fail('La paleta fija de la Constelación necesita al menos un elemento.', 'cfg-const-circles');
        }
    }

    Object.assign(cfg.tests.color, {
        paletteMode: $('cfg-color-mode').value,
        colors: [...$('cfg-color-swatches').querySelectorAll('input')].filter(i => i.checked).map(i => i.value),
        tools: { fluid: $('cfg-color-fluid').checked, splash: $('cfg-color-splash').checked }
    });
    if (cfg.tests.color.enabled) {
        if (!cfg.tests.color.tools.fluid && !cfg.tests.color.tools.splash) return fail('Dinámica Cromática: habilite al menos una herramienta.');
        if (cfg.tests.color.paletteMode === 'fija' && !cfg.tests.color.colors.length) return fail('Dinámica Cromática: marque al menos un color disponible.');
    }

    const raw = $('cfg-maze-seed').value.trim();
    let seed = randomMazeSeed();
    if (raw !== '') {
        seed = Number(raw);
        if (cfg.tests.maze.enabled && (!Number.isInteger(seed) || seed < 1 || seed > MAZE_MAX)) {
            return fail(`Número de laberinto: ingrese un entero entre 1 y ${MAZE_MAX}, o deje el campo vacío para elegir uno al azar.`, 'cfg-maze-seed');
        }
        if (!Number.isInteger(seed) || seed < 1 || seed > MAZE_MAX) seed = randomMazeSeed();
    }
    Object.assign(cfg.tests.maze, { level: $('cfg-maze-level').value, seed });
    return cfg;
}

// Aplica una configuración ya validada a toda la aplicación. Devuelve false si el evaluador cancela.
function applyConfig(cfg) {
    const conDatos = TEST_KEYS.filter(k => !cfg.tests[k].enabled && testData[k]).map(k => TESTS[k].short);
    if (conDatos.length && !confirm(`Ya hay datos guardados de: ${conDatos.join(', ')}.\nSi la quita de la batería, quedará fuera del menú y del informe (los datos no se borran). ¿Continuar?`)) return false;

    const m = cfg.tests.maze;
    if (cfg.tests.maze.enabled && (m.level !== mazeLevel || m.seed !== mazeSeed)) {
        if (mazeHasPath && !confirm('Cambió el laberinto: se generará uno nuevo y se perderá el trazo actual. ¿Continuar?')) return false;
        applyMaze(m.seed, m.level);
        if (testData.maze) dirty.maze = true;
    } else if (!cfg.tests.maze.enabled) {
        // sin cambios en el laberinto vigente
        m.level = mazeLevel; m.seed = mazeSeed;
    }

    TEST_KEYS.forEach(k => {
        if (config && config.tests[k].limitMin !== cfg.tests[k].limitMin) {
            limitFired[k] = false;
            $('limit-note-' + k).textContent = '';
        }
    });
    config = cfg;
    applyConfigToUI();
    return true;
}

function setConsigna(k) {
    const p = $('consigna-' + k), t = config.tests[k].consigna;
    p.textContent = '';
    if (!t) { p.style.display = 'none'; return; }
    p.style.display = '';
    p.appendChild(document.createTextNode('Consigna: '));
    p.appendChild(el('em', { textContent: `"${t}"` }));
}

function buildPalette() {
    const box = $('palette-items'), c = config.tests.constellation;
    box.innerHTML = '';
    const addBtn = (text, fn) => {
        const d = el('div', { className: 'palette-item', textContent: text });
        d.setAttribute('role', 'button');
        d.tabIndex = 0;
        d.addEventListener('click', fn);
        box.appendChild(d);
    };
    if (c.mode === 'fija') {
        c.circles.forEach(l => addBtn('+ ' + l, () => addConstellationItem(l, true)));
        c.rects.forEach(l => addBtn('+ ' + l, () => addConstellationItem(l, false)));
    } else {
        addBtn('+ Círculo (persona / vínculo)', () => addFreeItem(true));
        addBtn('+ Rectángulo (obstáculo / refugio)', () => addFreeItem(false));
    }
}

function addFreeItem(isCircle) {
    const t = prompt('Rótulo del elemento:');
    if (t && t.trim()) addConstellationItem(t.trim().slice(0, 24), isCircle);
}

function buildPaintSwatches() {
    const cc = config.tests.color, box = $('paint-swatches'), input = $('paint-color'), lbl = $('lbl-paint-color');
    box.innerHTML = '';
    if (cc.paletteMode === 'fija') {
        lbl.style.display = 'none';
        box.style.display = 'flex';
        COLOR_PALETTE.filter(c => cc.colors.includes(c.id)).forEach(c => {
            const b = el('button', { type: 'button', className: 'swatch', title: c.name });
            b.style.background = c.hex;
            b.addEventListener('click', () => {
                input.value = c.hex;
                box.querySelectorAll('.swatch').forEach(x => x.classList.toggle('active', x === b));
            });
            box.appendChild(b);
        });
        if (box.firstChild) box.firstChild.click();
    } else {
        lbl.style.display = '';
        box.style.display = 'none';
    }
}

function applyConfigToUI() {
    const grid = $('test-grid');
    config.order.forEach(k => {
        const card = $('card-' + k);
        grid.appendChild(card);
        card.style.display = config.tests[k].enabled ? '' : 'none';
        setConsigna(k);
    });

    const h = config.tests.house;
    $('btn-house-eraser').style.display = h.eraser ? '' : 'none';
    $('lbl-house-color').style.display = h.color ? '' : 'none';
    if (!h.color) $('house-color').value = '#0f172a';
    if (!h.eraser && houseTool === 'eraser') { houseTool = 'pen'; setActiveTool($('btn-house-pen')); }

    buildPalette();

    const cc = config.tests.color;
    $('btn-color-fluid').style.display = cc.tools.fluid ? '' : 'none';
    $('btn-color-splash').style.display = cc.tools.splash ? '' : 'none';
    if (!cc.tools[colorTool]) colorTool = cc.tools.fluid ? 'fluid' : 'splash';
    setActiveTool($('btn-color-' + colorTool));
    buildPaintSwatches();

    if (!config.timerVisible) TEST_KEYS.forEach(k => { $('timer-' + k).style.display = 'none'; });
}

// --- Flujo de pantallas ---
function showConfig(fromMenu) {
    cfgFromMenu = fromMenu;
    fillConfigForm(config);
    refreshProfileSelect();
    $('cfg-confirm-btn').textContent = fromMenu ? 'Aplicar y volver a la batería' : 'Comenzar la batería';
    switchScreen('screen-config');
}

function cfgBack() {
    switchScreen(cfgFromMenu ? 'screen-menu' : 'screen-patient');
}

function confirmConfig() {
    const cfg = readConfigForm();
    if (!cfg || !applyConfig(cfg)) return;
    evaluationStarted = true;
    $('lbl-patient-name').textContent = patient.name;
    refreshMenu();
    switchScreen('screen-menu');
}

// --- Perfiles (solo parámetros; se guardan en este navegador) ---
function loadProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch (e) { return {}; }
}

function storeProfiles(p) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); return true; }
    catch (e) { alert('No se pudo guardar el perfil en este navegador.'); return false; }
}

function refreshProfileSelect(selected) {
    const sel = $('cfg-profile');
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', textContent: 'Valores por defecto' }));
    Object.keys(loadProfiles()).sort().forEach(n => sel.appendChild(el('option', { value: n, textContent: n })));
    sel.value = selected || '';
}

function mergeDeep(def, src) {
    if (!src || typeof src !== 'object') return def;
    Object.keys(def).forEach(k => {
        if (!(k in src)) return;
        if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) def[k] = mergeDeep(def[k], src[k]);
        else if (typeof src[k] === typeof def[k] && Array.isArray(src[k]) === Array.isArray(def[k])) def[k] = src[k];
    });
    return def;
}

function saveProfile() {
    const cfg = readConfigForm();
    if (!cfg) return;
    const name = (prompt('Nombre del perfil (por ejemplo «Adultos laborales»):') || '').trim();
    if (!name) return;
    const all = loadProfiles();
    if (all[name] && !confirm('Ya existe un perfil con ese nombre. ¿Reemplazarlo?')) return;
    const copy = JSON.parse(JSON.stringify(cfg));
    delete copy.device;
    all[name] = copy;
    if (storeProfiles(all)) refreshProfileSelect(name);
}

function loadProfile() {
    const name = $('cfg-profile').value;
    const device = $('cfg-device').value;
    let cfg = defaultConfig();
    if (name) {
        const saved = loadProfiles()[name];
        if (!saved) { alert('No se encontró el perfil.'); return; }
        cfg = mergeDeep(cfg, saved);
        if (!Array.isArray(cfg.order) || cfg.order.length !== TEST_KEYS.length || !TEST_KEYS.every(k => cfg.order.includes(k))) cfg.order = TEST_KEYS.slice();
    }
    cfg.device = device;
    fillConfigForm(cfg);
}

function deleteProfile() {
    const name = $('cfg-profile').value;
    if (!name) { alert('Elija primero un perfil para eliminarlo.'); return; }
    if (!confirm(`¿Eliminar el perfil «${name}»?`)) return;
    const all = loadProfiles();
    delete all[name];
    if (storeProfiles(all)) refreshProfileSelect();
}

// --- Cronómetro y límite de tiempo ---
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function tickTimer() {
    if (!activeTest || !config) return;
    const k = activeTest, tc = config.tests[k];
    const total = elapsedMs[k] + (Date.now() - startTime);
    const limitMs = tc.limitMin * 60000;
    const timerEl = $('timer-' + k);
    if (config.timerVisible) {
        const secs = limitMs ? Math.max(0, Math.ceil((limitMs - total) / 1000)) : Math.floor(total / 1000);
        timerEl.textContent = (limitMs ? '⏱ Tiempo restante ' : '⏱ Tiempo ') + mmss(secs);
        timerEl.style.display = '';
    } else {
        timerEl.style.display = 'none';
    }
    if (limitMs && total >= limitMs && !limitFired[k]) {
        limitFired[k] = true;
        onLimitReached(k);
    }
}

function onLimitReached(k) {
    const min = config.tests[k].limitMin;
    if (config.limitAction === 'cerrar') {
        saveTestResult(k);   // guarda lo realizado y vuelve al menú
        alert(`Se cumplió el tiempo límite (${min} min) de «${TESTS[k].short}». Se guardó lo realizado.`);
    } else {
        $('limit-note-' + k).textContent = `⏰ Se cumplió el tiempo límite (${min} min).`;
    }
}

// --- Parámetros usados, para el informe ---
function paramLines(k) {
    const t = config.tests[k], lines = [];
    if (k === 'house') {
        lines.push(`Color: ${t.color ? 'permitido' : 'solo grafito'}`, `Goma: ${t.eraser ? 'permitida' : 'no permitida'}`);
    } else if (k === 'constellation') {
        lines.push(t.mode === 'fija'
            ? `Elementos: paleta fija (círculos: ${t.circles.join(', ') || '—'}; rectángulos: ${t.rects.join(', ') || '—'})`
            : 'Elementos: rótulos escritos por el evaluado');
        lines.push(`Máximo de elementos: ${t.maxItems || 'sin límite'}`);
    } else if (k === 'color') {
        lines.push(t.paletteMode === 'fija'
            ? `Paleta: restringida (${COLOR_PALETTE.filter(c => t.colors.includes(c.id)).map(c => c.name).join(', ')})`
            : 'Paleta: libre');
        lines.push('Herramientas: ' + [t.tools.fluid && 'trazo continuo', t.tools.splash && 'mancha / textura'].filter(Boolean).join(', '));
    }
    lines.push(`Cronómetro visible para el evaluado: ${config.timerVisible ? 'sí' : 'no'}`);
    return lines;
}

function timeMeta(d) {
    let s = `Tiempo de ejecución: ${fmtTime(d.time)}`;
    if (d.limitMin) s += ` (límite ${d.limitMin} min: ${d.limitReached ? 'alcanzado' : 'no alcanzado'})`;
    return s;
}

// ---------- GUARDADO ----------
function saveTestResult(type) {
    leaveTest();
    let img;
    if (type === 'house') img = $('houseCanvas').toDataURL('image/png');
    else if (type === 'constellation') img = renderConstellationImage().toDataURL('image/png');
    else if (type === 'color') img = $('colorCanvas').toDataURL('image/png');
    else img = $('mazeCanvas').toDataURL('image/png');

    testData[type] = {
        img,
        time: Math.round(elapsedMs[type] / 1000),
        limitMin: config.tests[type].limitMin,
        limitReached: limitFired[type],
        consigna: config.tests[type].consigna,
        params: paramLines(type)
    };
    if (type === 'maze') {
        testData.maze.seed = mazeSeed;
        testData.maze.level = MAZE_LEVELS[mazeLevel].label;
        testData.maze.optimal = mazeInfo.length;
        testData.maze.trace = {
            cells: mazeTrace.cells,
            distinct: mazeTrace.visited.size,
            crossings: mazeTrace.crossings,
            reachedExit: mazeTrace.reachedExit
        };
    }
    dirty[type] = false;
    backToMenu(true);
}

// ---------- INFORME ----------
function el(tag, props, children) {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    (children || []).forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
}

function obsBlock(key) {
    const wrap = el('div');
    const ta = el('textarea', { className: 'obs', value: obs[key], placeholder: 'Escriba aquí observaciones clínicas (conducta durante la prueba, indicadores relevantes, etc.)' });
    const pr = el('div', { className: 'obs-print', textContent: obs[key] });
    ta.addEventListener('input', () => { obs[key] = ta.value; pr.textContent = ta.value; });
    wrap.appendChild(el('label', { className: 'obs-label', textContent: 'Observaciones del profesional:' }));
    wrap.appendChild(ta);
    wrap.appendChild(pr);
    return wrap;
}

function finishAll() {
    const keys = activeKeys();
    const done = keys.filter(k => testData[k]);
    if (!done.length) {
        alert('Guarde al menos una prueba antes de generar el informe.');
        return;
    }
    const missing = keys.filter(k => !testData[k]).map(k => TESTS[k].short);
    const unsaved = keys.filter(k => dirty[k]).map(k => TESTS[k].short);
    let msg = '';
    if (missing.length) msg += 'Pruebas sin realizar: ' + missing.join(', ') + '.\n';
    if (unsaved.length) msg += 'Cambios sin guardar en: ' + unsaved.join(', ') + ' (el informe usará la última versión guardada).\n';
    if (msg && !confirm(msg + '¿Generar el informe igualmente?')) return;

    $('rep-name').textContent = patient.name;
    $('rep-id').textContent = patient.id;
    $('rep-age').textContent = patient.age;
    $('rep-device').textContent = config.device;
    $('rep-date').textContent = new Date().toLocaleDateString('es-UY');

    const container = $('rep-results-container');
    container.innerHTML = '';
    let num = 0;
    keys.forEach(k => {
        const d = testData[k];
        if (!d) return;
        num++;
        const sec = el('div', { className: 'report-section' });
        sec.appendChild(el('h4', { textContent: `${num}. ${TESTS[k].title}` }));
        let meta = timeMeta(d);
        if (k === 'maze') meta += mazeMeta(d);
        sec.appendChild(el('p', { className: 'report-meta', textContent: meta }));
        if (k === 'maze') sec.appendChild(el('p', { className: 'report-meta', textContent: mazeTraceMeta(d) }));
        sec.appendChild(el('p', { className: 'report-meta', textContent: 'Consigna: ' + (d.consigna ? `"${d.consigna}"` : '(sin consigna en pantalla)') }));
        if (d.params.length) sec.appendChild(el('p', { className: 'report-meta', textContent: 'Parámetros: ' + d.params.join(' | ') }));
        sec.appendChild(el('img', { className: 'img-result', src: d.img, alt: TESTS[k].short }));
        sec.appendChild(obsBlock(k));
        container.appendChild(sec);
    });
    const gen = el('div', { className: 'report-section' });
    gen.appendChild(el('h4', { textContent: 'Observaciones generales' }));
    gen.appendChild(obsBlock('general'));
    container.appendChild(gen);

    switchScreen('screen-report');
}

// Bytes de una imagen (data: URL) leídos por el propio navegador, sin decodificar base64 a mano
async function dataUrlToBytes(dataUrl) {
    const res = await fetch(dataUrl);
    return new Uint8Array(await res.arrayBuffer());
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportToWord() {
    if (!window.docx) {
        alert('No se pudo cargar la librería de Word (¿sin conexión?). Use "Imprimir / Guardar PDF" o vuelva a intentarlo con conexión.');
        return;
    }
    const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = window.docx;

    const multiline = (text) => {
        const lines = (text || '').split('\n');
        return new Paragraph({
            spacing: { after: 200 },
            children: lines.map((l, i) => new TextRun({ text: l, break: i ? 1 : 0 }))
        });
    };
    const children = [
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('PsiMatrix - Reporte Proyectivo Digital')] }),
        new Paragraph({ children: [
            new TextRun({ text: 'Evaluado: ', bold: true }), new TextRun(patient.name + '   '),
            new TextRun({ text: 'ID: ', bold: true }), new TextRun(patient.id + '   '),
            new TextRun({ text: 'Edad: ', bold: true }), new TextRun(String(patient.age))
        ] }),
        new Paragraph({ children: [
            new TextRun({ text: 'Dispositivo de administración: ', bold: true }),
            new TextRun(config.device)
        ] }),
        new Paragraph({ spacing: { after: 300 }, children: [
            new TextRun({ text: 'Fecha de Evaluación: ', bold: true }),
            new TextRun(new Date().toLocaleDateString('es-UY'))
        ] })
    ];

    const note = (text) => new Paragraph({ children: [new TextRun({ text, italics: true, color: '64748B' })] });
    const imgBytes = {};
    for (const k of activeKeys()) if (testData[k]) imgBytes[k] = await dataUrlToBytes(testData[k].img);
    let num = 0;
    activeKeys().forEach(k => {
        const d = testData[k];
        if (!d) return;
        num++;
        let meta = timeMeta(d);
        if (k === 'maze') meta += mazeMeta(d);
        children.push(
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${num}. ${TESTS[k].title}`)] }),
            note(meta),
            ...(k === 'maze' ? [note(mazeTraceMeta(d))] : []),
            note('Consigna: ' + (d.consigna ? `"${d.consigna}"` : '(sin consigna en pantalla)')),
            ...(d.params.length ? [note('Parámetros: ' + d.params.join(' | '))] : []),
            new Paragraph({
                spacing: { before: 120, after: 160 },
                children: [new ImageRun({ data: imgBytes[k], transformation: { width: 580, height: 338 } })]
            })
        );
        if (obs[k].trim()) {
            children.push(new Paragraph({ children: [new TextRun({ text: 'Observaciones del profesional:', bold: true })] }), multiline(obs[k]));
        }
    });
    if (obs.general.trim()) {
        children.push(
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Observaciones generales')] }),
            multiline(obs.general)
        );
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const slug = patient.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Evaluado';
    downloadBlob(blob, `PsiMatrix_Informe_${slug}.docx`);
}

// ---------- Nuevo evaluado ----------
function resetAll() {
    if (!confirm('Se borrarán todos los datos y producciones del evaluado actual. La configuración se conserva. ¿Iniciar un nuevo evaluado?')) return;
    patient = { name: '', id: '', age: '' };
    TEST_KEYS.forEach(k => {
        testData[k] = null; elapsedMs[k] = 0; dirty[k] = false; obs[k] = '';
        limitFired[k] = false;
        $('limit-note-' + k).textContent = '';
    });
    obs.general = '';
    activeTest = null;
    evaluationStarted = false;
    clearCanvas($('houseCanvas'));
    clearCanvas($('colorCanvas'));
    wipeConstellation();
    applyMaze(mazeSeed, mazeLevel);   // mismo laberinto configurado, sin trazo
    dirty.maze = false;
    ['p-name', 'p-id', 'p-age'].forEach(id => { $(id).value = ''; });
    refreshMenu();
    switchScreen('screen-patient');
}

// ---------- Inicialización ----------
config = defaultConfig();
buildConfigUI();
initHouseCanvas();
initColorCanvas();
initMazeCanvas();
applyConfigToUI();
setInterval(tickTimer, 500);

$('constellation-workspace').addEventListener('pointerdown', (e) => {
    if (e.target === e.currentTarget) selectItem(null);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('maze-stage').classList.contains('fs')) setMazeFullscreen(false);
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[role="button"]')) {
        e.preventDefault();
        e.target.click();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem &&
        $('screen-constellation').classList.contains('active') &&
        !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
        e.preventDefault();
        deleteSelected();
    }
});

document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);
window.addEventListener('resize', fitMazeCanvas);
window.addEventListener('orientationchange', () => setTimeout(fitMazeCanvas, 200));

window.addEventListener('beforeunload', (e) => {
    if (patient.name || TEST_KEYS.some(k => testData[k] || dirty[k])) {
        e.preventDefault();
        e.returnValue = '';
    }
});