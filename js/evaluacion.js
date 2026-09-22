// ---------- Constantes y estado ----------
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

// ---------- LABERINTO (dibujo, recorrido y pantalla completa) ----------
let COLS = 20, ROWS = 11;
let mazeCells = null, mazeSeed = 1, mazeLevel = 'media', mazeType = 'rectangular', mazeInfo = null, mazeHasPath = false;
let mazeSegs = [], mazeTube = 0;   // pasillos y senderos: polilíneas del trazo (cada una, una lista de puntos) y ancho
let mazeTrailPos = null;           // solo «senderos»: posición de cada nodo en el lienzo
// Registro del recorrido del participante, medido en celdas del laberinto
let mazeTrace = null;

function resetMazeTrace() {
    mazeTrace = { cells: 0, visited: new Set(), crossings: 0, reachedExit: false, prev: null, lastCell: null, inside: null };
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
    if (newStroke) { t.prev = null; t.inside = null; }
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const usesTube = TUBE_TYPES.has(mazeType);
    const stepLen = usesTube ? Math.min(cw, ch) / 6 : Math.min(cw, ch) / 3;
    const steps = Math.max(1, Math.ceil(dist / stepLen));
    for (let i = 0; i <= steps; i++) {
        const x = a.x + (b.x - a.x) * i / steps;
        const y = a.y + (b.y - a.y) * i / steps;
        if (usesTube) {           // salidas del camino: pasar de dentro a fuera del trazo
            const inside = insideTube(x, y);
            if (t.inside === true && !inside) t.crossings++;
            t.inside = inside;
        }
        const c = Math.floor(x / cw), r = Math.floor(y / ch);
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) { t.prev = null; continue; }
        const cell = { r, c };
        if (t.prev && t.prev.r === r && t.prev.c === c) continue;
        if (!t.prev && t.lastCell && t.lastCell.r === r && t.lastCell.c === c) { t.prev = cell; continue; }
        if (mazeType === 'rectangular' && t.prev && wallBetween(t.prev, cell)) t.crossings++;
        t.cells++;
        t.visited.add(r * COLS + c);
        if (r === ROWS - 1 && c === COLS - 1) t.reachedExit = true;
        t.prev = cell;
        t.lastCell = cell;
    }
}

// --- Pasillos anchos y Senderos: geometría y dibujo ---
// mazeSegs es una lista de polilíneas (cada una, una lista de puntos [x,y]): un tramo recto por
// pasillo, o los puntos muestreados de una curva por sendero. Sirve por igual para dibujar y medir.
function buildTubeGeometry() {
    const cw = CW / COLS, ch = CH / ROWS;
    mazeTube = Math.min(cw, ch) * 0.56;
    mazeSegs = [];
    mazeCells.forEach(cell => {
        const cx = (cell.c + 0.5) * cw, cy = (cell.r + 0.5) * ch;
        if (!cell.w.r) mazeSegs.push([[cx, cy], [cx + cw, cy]]);
        if (!cell.w.b) mazeSegs.push([[cx, cy], [cx, cy + ch]]);
    });
}

function buildTrailGeometry() {
    mazeTrailPos = trailPositions(mazeSeed, COLS, ROWS);
    mazeTube = Math.min(CW / COLS, CH / ROWS) * 0.22;
    mazeSegs = [];
    mazeCells.forEach(cell => {
        const i = cell.r * COLS + cell.c;
        if (!cell.w.r) mazeSegs.push(curvePoints(mazeTrailPos[i], mazeTrailPos[i + 1], mazeSeed, i, 'r'));
        if (!cell.w.b) mazeSegs.push(curvePoints(mazeTrailPos[i], mazeTrailPos[i + COLS], mazeSeed, i, 'b'));
    });
}

// ¿El punto está dentro de algún tramo del trazo? (distancia a la polilínea más cercana ≤ mitad del ancho)
function insideTube(x, y) {
    const h = mazeTube / 2;
    for (const poly of mazeSegs) {
        for (let k = 0; k < poly.length - 1; k++) {
            const [ax, ay] = poly[k], [bx, by] = poly[k + 1];
            const dx = bx - ax, dy = by - ay;
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
            if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) <= h) return true;
        }
    }
    return false;
}

function strokePolylines(ctx) {
    ctx.beginPath();
    mazeSegs.forEach(poly => {
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
    });
    ctx.stroke();
}

function drawTubes(ctx, cw, ch) {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = mazeTube;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokePolylines(ctx);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cw * 0.5, ch * 0.5, mazeTube * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cw * (COLS - 0.5), ch * (ROWS - 0.5), mazeTube * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawTrails(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#94a3b8';
    mazeTrailPos.forEach(([x, y], i) => {
        if (i === 0 || i === mazeTrailPos.length - 1) return;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = mazeTube;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokePolylines(ctx);
    const a = mazeTrailPos[0], b = mazeTrailPos[mazeTrailPos.length - 1];
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(a[0], a[1], 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(b[0], b[1], 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMaze() {
    const c = $('mazeCanvas');
    const ctx = c.getContext('2d');
    clearCanvas(c);
    const cw = c.width / COLS, ch = c.height / ROWS;
    if (mazeType === 'pasillos') {
        drawTubes(ctx, cw, ch);
        mazeHasPath = false;
        resetMazeTrace();
        return;
    }
    if (mazeType === 'senderos') {
        drawTrails(ctx);
        mazeHasPath = false;
        resetMazeTrace();
        return;
    }

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

function applyMaze(seed, levelKey, typeKey) {
    typeKey = typeKey || 'rectangular';
    const cfg = mazeCfg(typeKey, levelKey);
    mazeType = typeKey;
    mazeLevel = levelKey;
    mazeSeed = seed;
    COLS = cfg.cols;
    ROWS = cfg.rows;
    const g = generateMaze(seed, levelKey, typeKey);
    mazeCells = g.cells;
    mazeInfo = g.info;
    if (typeKey === 'pasillos') buildTubeGeometry();
    else if (typeKey === 'senderos') buildTrailGeometry();
    else { mazeSegs = []; mazeTube = 0; mazeTrailPos = null; }
    $('maze-info').textContent = `Tipo ${MAZE_TYPES[typeKey].label} · Dificultad ${cfg.label} · Laberinto Nº ${seed} · Recorrido óptimo: ${g.info.length} celdas · Bifurcaciones en ese recorrido: ${g.info.junctions}`;
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
    applyMaze(config.tests.maze.seed, config.tests.maze.level, config.tests.maze.type);
    const ctx = c.getContext('2d');
    bindDrawing(c, {
        draw: (a, b) => {
            traceMazeSegment(a, b, a === b);   // a === b solo al apoyar (inicio de trazo)
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = parseFloat($('maze-size').value) * 1.5;
            ctx.strokeStyle = mazeType === 'pasillos' ? '#7c3aed' : mazeType === 'senderos' ? '#ea580c' : '#2563eb';
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
    return `Recorrido del participante: ${t.cells} celdas (${diff >= 0 ? '+' : ''}${diff} respecto al óptimo de ${d.optimal}) | Celdas distintas: ${t.distinct} | ${d.exitLabel || 'Cruces de pared'}: ${t.crossings} | Llegó a la salida: ${t.reachedExit ? 'sí' : 'no'}`;
}

function mazeMeta(d) {
    return ` | Tipo ${d.type} | Dificultad ${d.level} | Laberinto Nº ${d.seed} | Recorrido óptimo: ${d.optimal} celdas`;
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

// ---------- APLICACIÓN DE LA CONFIGURACIÓN ----------
// La configuración la define el evaluador en configuracion.html y llega por la capa de almacenamiento
// (almacenamiento.js). Durante la evaluación no se puede modificar desde esta página.
let config = null;                 // configuración vigente
const limitFired = { house: false, constellation: false, color: false, maze: false };

const activeKeys = () => config.order.filter(k => config.tests[k].enabled);

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
        testData.maze.type = MAZE_TYPES[mazeType].label;
        testData.maze.typeKey = mazeType;
        testData.maze.exitLabel = MAZE_TYPES[mazeType].exitLabel;
        testData.maze.level = mazeCfg(mazeType, mazeLevel).label;
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

// ---------- Acceso a la configuración (evaluador) ----------
let leavingForConfig = false;

const hasEvaluationData = () => TEST_KEYS.some(k => testData[k] || dirty[k]);

function configSummary(cfg) {
    const names = cfg.order.filter(k => cfg.tests[k].enabled).map(k => TESTS[k].short);
    const parts = [cfg.device || 'sin dispositivo', names.join(' → ')];
    if (cfg.tests.maze.enabled) {
        const m = cfg.tests.maze;
        parts.push(`Laberinto ${MAZE_TYPES[m.type].label} · ${mazeCfg(m.type, m.level).label} Nº ${m.seed}`);
    }
    if (TEST_KEYS.some(k => cfg.tests[k].enabled && cfg.tests[k].limitMin)) parts.push('con límites de tiempo');
    return parts.join(' · ');
}

async function openEvaluatorConfig() {
    let allowed = false;
    try { allowed = await access.request('configuracion'); } catch (e) { allowed = false; }
    if (!allowed) return;
    if (hasEvaluationData() && !confirm('Hay datos de la evaluación en curso que se perderán si sale a la configuración. ¿Continuar?')) return;
    leavingForConfig = true;      // evita el aviso de "salir de la página" del navegador
    location.href = 'configuracion.html';
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
    clearCanvas($('houseCanvas'));
    clearCanvas($('colorCanvas'));
    wipeConstellation();
    applyMaze(mazeSeed, mazeLevel, mazeType);   // mismo laberinto configurado, sin trazo
    dirty.maze = false;
    ['p-name', 'p-id', 'p-age'].forEach(id => { $(id).value = ''; });
    refreshMenu();
    switchScreen('screen-patient');
}

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
    if (leavingForConfig) return;
    if (patient.name || TEST_KEYS.some(k => testData[k] || dirty[k])) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ---------- Inicialización ----------
async function init() {
    let saved = null;
    try { saved = await store.getActiveConfig(); } catch (e) { saved = null; }
    if (!saved) { switchScreen('screen-noconfig'); return; }
    config = normalizeConfig(saved);
    $('active-cfg-summary').textContent = configSummary(config);
    initHouseCanvas();
    initColorCanvas();
    initMazeCanvas();
    applyConfigToUI();
}
init();
setInterval(tickTimer, 500);
