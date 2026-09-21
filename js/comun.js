// Utilidades, constantes, modelo de configuración y generación de laberintos.
// Se comparte entre la página de la evaluación (index.html) y la de configuración (configuracion.html).

const $ = (id) => document.getElementById(id);

// Crea un elemento DOM: el('div', { className: 'x' }, [hijos])
function el(tag, props, children) {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    (children || []).forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
}

const TEST_KEYS = ['house', 'constellation', 'color', 'maze'];
const TESTS = {
    house:         { title: 'Test de la Casa (Espacio Habitable)',        short: 'Test de la Casa' },
    constellation: { title: 'Constelación Familiar / Vincular',           short: 'Constelación Familiar' },
    color:         { title: 'Dinámica Cromática y Expresión Emocional',   short: 'Dinámica Cromática' },
    maze:          { title: 'Laberinto Estructural Complejo (Adultos)',   short: 'Laberinto Estructural' }
};

// ---------- LABERINTO ----------
// Cada nivel tiene su propia cuadrícula y una franja de dificultad aceptable, medida sobre el
// recorrido óptimo (celdas de la entrada a la salida vs. el mínimo posible) y las bifurcaciones
// que hay en ese recorrido. Los laberintos demasiado directos se descartan de forma
// determinista: el mismo tipo + nivel + número dan siempre el mismo laberinto.
const MAZE_MAX = 9999;   // por tipo y nivel: laberintos numerados del 1 al MAZE_MAX
// Tipos de laberinto. Comparten el mismo modelo (celdas y pasajes); cambian la cuadrícula y el dibujo.
//   rectangular: paredes finas sobre una cuadrícula fina.
//   pasillos:    cuadrícula gruesa dibujada como pasillos anchos (más fácil de trazar con el dedo).
const MAZE_TYPES = {
    rectangular: {
        label: 'Rectangular',
        levels: {
            facil:   { label: 'Fácil',   cols: 16, rows: 9,  loops: 3, ratio: [2.0, 3.0], minJunctions: 6 },
            media:   { label: 'Media',   cols: 20, rows: 11, loops: 3, ratio: [2.8, 3.8], minJunctions: 9 },
            dificil: { label: 'Difícil', cols: 25, rows: 14, loops: 2, ratio: [3.6, 5.0], minJunctions: 13 }
        }
    },
    pasillos: {
        label: 'Pasillos anchos',
        levels: {
            facil:   { label: 'Fácil',   cols: 6,  rows: 4, loops: 0, ratio: [1.4, 2.4], minJunctions: 1 },
            media:   { label: 'Media',   cols: 8,  rows: 5, loops: 0, ratio: [1.7, 2.7], minJunctions: 2 },
            dificil: { label: 'Difícil', cols: 10, rows: 6, loops: 0, ratio: [2.0, 3.0], minJunctions: 3 }
        }
    }
};
const mazeCfg = (type, level) => MAZE_TYPES[type].levels[level];
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

function generateMaze(seed, levelKey, typeKey = 'rectangular') {
    const cfg = mazeCfg(typeKey, levelKey);
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
                enabled: true, limitMin: 0, type: 'rectangular', level: 'media', seed: randomMazeSeed(),
                consigna: 'Trace un recorrido continuo desde la Entrada (Verde) hasta la Salida (Roja).'
            }
        }
    };
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


// Deja una configuración (venga de donde venga: perfil, JSON, base de datos) completa y con valores válidos
function normalizeConfig(src) {
    const cfg = mergeDeep(defaultConfig(), src);
    if (!Array.isArray(cfg.order) || cfg.order.length !== TEST_KEYS.length || !TEST_KEYS.every(k => cfg.order.includes(k))) cfg.order = TEST_KEYS.slice();
    if (!['avisar', 'cerrar'].includes(cfg.limitAction)) cfg.limitAction = 'avisar';
    TEST_KEYS.forEach(k => {
        const l = cfg.tests[k].limitMin;
        if (!Number.isInteger(l) || l < 0 || l > 240) cfg.tests[k].limitMin = 0;
    });
    if (!TEST_KEYS.some(k => cfg.tests[k].enabled)) TEST_KEYS.forEach(k => { cfg.tests[k].enabled = true; });

    const c = cfg.tests.constellation;
    if (!['fija', 'libre'].includes(c.mode)) c.mode = 'fija';
    if (!Number.isInteger(c.maxItems) || c.maxItems < 0 || c.maxItems > 50) c.maxItems = 0;
    const labels = (a) => a.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 24));
    c.circles = labels(c.circles);
    c.rects = labels(c.rects);
    if (c.mode === 'fija' && !c.circles.length && !c.rects.length) { c.mode = 'libre'; }

    const cc = cfg.tests.color;
    if (!['libre', 'fija'].includes(cc.paletteMode)) cc.paletteMode = 'libre';
    cc.colors = cc.colors.filter(id => COLOR_PALETTE.some(p => p.id === id));
    if (cc.paletteMode === 'fija' && !cc.colors.length) cc.paletteMode = 'libre';
    if (!cc.tools.fluid && !cc.tools.splash) cc.tools.fluid = true;

    const m = cfg.tests.maze;
    if (!MAZE_TYPES[m.type]) m.type = 'rectangular';
    if (!mazeCfg(m.type, m.level)) m.level = 'media';
    if (!Number.isInteger(m.seed) || m.seed < 1 || m.seed > MAZE_MAX) m.seed = randomMazeSeed();
    return cfg;
}
