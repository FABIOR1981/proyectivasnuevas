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

let patient = { name: '', id: '', age: '', device: '' };
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
    const device = $('p-device').value;
    if (!device) {
        alert('Seleccione el dispositivo y la forma de ingreso con que se realizarán las pruebas.');
        $('p-device').focus();
        return;
    }
    patient.name = name;
    patient.device = device;
    patient.id = $('p-id').value.trim() || 'S/D';
    patient.age = age || 'S/D';
    $('lbl-patient-name').textContent = patient.name;
    refreshMenu();
    switchScreen('screen-menu');
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
    $('maze-level').value = levelKey;
    $('maze-seed').value = seed;
    $('maze-info').textContent = `Dificultad ${cfg.label} · Laberinto Nº ${seed} · Recorrido óptimo: ${g.info.length} celdas · Bifurcaciones en ese recorrido: ${g.info.junctions}`;
    drawMaze();
}

function randomMaze() {
    $('maze-seed').value = '';
    newMaze();
}

function newMaze() {
    const level = $('maze-level').value;
    const raw = $('maze-seed').value.trim();
    let seed;
    if (raw === '') {
        seed = randomMazeSeed();
    } else {
        seed = Number(raw);
        if (!Number.isInteger(seed) || seed < 1 || seed > MAZE_MAX) {
            alert(`Ingrese un número de laberinto entero entre 1 y ${MAZE_MAX}, o deje el campo vacío para elegir uno al azar.`);
            $('maze-level').value = mazeLevel;
            $('maze-seed').focus();
            return;
        }
    }
    if (mazeHasPath && !confirm('Se generará un laberinto nuevo y se perderá el trazo actual. ¿Continuar?')) {
        $('maze-level').value = mazeLevel;
        return;
    }
    applyMaze(seed, level);
    if (testData.maze) dirty.maze = true;
}

function clearMazePath() {
    if (mazeHasPath && !confirm('¿Borrar el trazo del laberinto?')) return;
    drawMaze();
    dirty.maze = true;
}

function initMazeCanvas() {
    const c = $('mazeCanvas');
    c.width = CW; c.height = CH;
    applyMaze(randomMazeSeed(), $('maze-level').value);
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

// ---------- GUARDADO ----------
function saveTestResult(type) {
    leaveTest();
    let img;
    if (type === 'house') img = $('houseCanvas').toDataURL('image/png');
    else if (type === 'constellation') img = renderConstellationImage().toDataURL('image/png');
    else if (type === 'color') img = $('colorCanvas').toDataURL('image/png');
    else img = $('mazeCanvas').toDataURL('image/png');

    testData[type] = { img, time: Math.round(elapsedMs[type] / 1000) };
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
    const done = TEST_KEYS.filter(k => testData[k]);
    if (!done.length) {
        alert('Guarde al menos una prueba antes de generar el informe.');
        return;
    }
    const missing = TEST_KEYS.filter(k => !testData[k]).map(k => TESTS[k].short);
    const unsaved = TEST_KEYS.filter(k => dirty[k]).map(k => TESTS[k].short);
    let msg = '';
    if (missing.length) msg += 'Pruebas sin realizar: ' + missing.join(', ') + '.\n';
    if (unsaved.length) msg += 'Cambios sin guardar en: ' + unsaved.join(', ') + ' (el informe usará la última versión guardada).\n';
    if (msg && !confirm(msg + '¿Generar el informe igualmente?')) return;

    $('rep-name').textContent = patient.name;
    $('rep-id').textContent = patient.id;
    $('rep-age').textContent = patient.age;
    $('rep-device').textContent = patient.device;
    $('rep-date').textContent = new Date().toLocaleDateString('es-UY');

    const container = $('rep-results-container');
    container.innerHTML = '';
    TEST_KEYS.forEach((k, i) => {
        const d = testData[k];
        if (!d) return;
        const sec = el('div', { className: 'report-section' });
        sec.appendChild(el('h4', { textContent: `${i + 1}. ${TESTS[k].title}` }));
        let meta = `Tiempo de ejecución: ${fmtTime(d.time)}`;
        if (k === 'maze') meta += mazeMeta(d);
        sec.appendChild(el('p', { className: 'report-meta', textContent: meta }));
        if (k === 'maze') sec.appendChild(el('p', { className: 'report-meta', textContent: mazeTraceMeta(d) }));
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

function dataUrlToBytes(dataUrl) {
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
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
            new TextRun(patient.device)
        ] }),
        new Paragraph({ spacing: { after: 300 }, children: [
            new TextRun({ text: 'Fecha de Evaluación: ', bold: true }),
            new TextRun(new Date().toLocaleDateString('es-UY'))
        ] })
    ];

    TEST_KEYS.forEach((k, i) => {
        const d = testData[k];
        if (!d) return;
        let meta = `Tiempo de ejecución: ${fmtTime(d.time)}`;
        if (k === 'maze') meta += mazeMeta(d);
        children.push(
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${i + 1}. ${TESTS[k].title}`)] }),
            new Paragraph({ children: [new TextRun({ text: meta, italics: true, color: '64748B' })] }),
            ...(k === 'maze' ? [new Paragraph({ children: [new TextRun({ text: mazeTraceMeta(d), italics: true, color: '64748B' })] })] : []),
            new Paragraph({
                spacing: { before: 120, after: 160 },
                children: [new ImageRun({ data: dataUrlToBytes(d.img), transformation: { width: 580, height: 338 } })]
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
    if (!confirm('Se borrarán todos los datos y producciones del evaluado actual. ¿Iniciar un nuevo evaluado?')) return;
    patient = { name: '', id: '', age: '', device: '' };
    TEST_KEYS.forEach(k => { testData[k] = null; elapsedMs[k] = 0; dirty[k] = false; obs[k] = ''; });
    obs.general = '';
    activeTest = null;
    clearCanvas($('houseCanvas'));
    clearCanvas($('colorCanvas'));
    wipeConstellation();
    $('maze-seed').value = '';
    mazeHasPath = false;
    newMaze();
    dirty.maze = false;
    ['p-name', 'p-id', 'p-age', 'p-device'].forEach(id => { $(id).value = ''; });
    refreshMenu();
    switchScreen('screen-patient');
}

// ---------- Inicialización ----------
initHouseCanvas();
initColorCanvas();
initMazeCanvas();

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
