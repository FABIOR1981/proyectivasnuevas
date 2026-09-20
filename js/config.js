// Página de configuración de la evaluación (uso del evaluador).
// Depende de common.js (modelo y utilidades) y storage.js (dónde se guardan perfiles y configuración activa).

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


// --- Mensajes en pantalla ---
function showStatus(msg, isError) {
    const box = $('cfg-status');
    box.textContent = msg || '';
    box.className = 'cfg-status ' + (isError ? 'error' : 'ok');
    box.style.display = msg ? '' : 'none';
}

// --- Perfiles (a través de la capa de almacenamiento: no importa dónde se guarden) ---
async function refreshProfileSelect(selected) {
    const sel = $('cfg-profile');
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', textContent: 'Valores por defecto' }));
    let names = [];
    try { names = await store.listProfiles(); }
    catch (e) { showStatus('No se pudieron leer los perfiles: ' + e.message, true); }
    names.forEach(n => sel.appendChild(el('option', { value: n, textContent: n })));
    sel.value = names.includes(selected) ? selected : '';
}

async function saveProfile() {
    const cfg = readConfigForm();
    if (!cfg) return;
    const name = (prompt('Nombre del perfil (por ejemplo «Adultos laborales»):') || '').trim();
    if (!name) return;
    try {
        if ((await store.listProfiles()).includes(name) && !confirm('Ya existe un perfil con ese nombre. ¿Reemplazarlo?')) return;
        const copy = JSON.parse(JSON.stringify(cfg));
        delete copy.device;                       // el dispositivo no forma parte del perfil
        await store.saveProfile(name, copy);
    } catch (e) { showStatus(e.message, true); return; }
    await refreshProfileSelect(name);
    showStatus(`Perfil «${name}» guardado.`);
}

async function loadProfile() {
    const name = $('cfg-profile').value;
    const device = $('cfg-device').value;
    let cfg = defaultConfig();
    if (name) {
        let saved = null;
        try { saved = await store.getProfile(name); }
        catch (e) { showStatus(e.message, true); return; }
        if (!saved) { showStatus('No se encontró el perfil.', true); return; }
        cfg = normalizeConfig(saved);
    }
    cfg.device = device;
    fillConfigForm(cfg);
    showStatus(name ? `Perfil «${name}» cargado en el formulario. Falta aplicarlo.` : 'Valores por defecto cargados en el formulario. Falta aplicarlos.');
}

async function deleteProfile() {
    const name = $('cfg-profile').value;
    if (!name) { alert('Elija primero un perfil para eliminarlo.'); return; }
    if (!confirm(`¿Eliminar el perfil «${name}»?`)) return;
    try { await store.deleteProfile(name); }
    catch (e) { showStatus(e.message, true); return; }
    await refreshProfileSelect();
    showStatus(`Perfil «${name}» eliminado.`);
}

// --- Aplicar la configuración: queda como configuración activa para las evaluaciones ---
async function applyConfigAndGo(go) {
    const cfg = readConfigForm();
    if (!cfg) return;
    try { await store.setActiveConfig(cfg); }
    catch (e) { showStatus('No se pudo aplicar la configuración: ' + e.message, true); return; }
    if (go) location.href = 'index.html';
    else showStatus('Configuración aplicada. Las evaluaciones que se abran desde ahora usarán estos parámetros.');
}

// --- Inicio de la página ---
async function initConfigPage() {
    buildConfigUI();
    $('cfg-storage-info').textContent = store.describe();
    let active = null;
    try { active = await store.getActiveConfig(); }
    catch (e) { showStatus('No se pudo leer la configuración activa: ' + e.message, true); }
    fillConfigForm(active ? normalizeConfig(active) : defaultConfig());
    await refreshProfileSelect();
}
initConfigPage();
