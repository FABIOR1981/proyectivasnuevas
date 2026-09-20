:root {
    --bg-body: #0f172a;
    --bg-container: #1e293b;
    --surface: #334155;
    --brand-primary: #38bdf8;
    --brand-primary-hover: #0ea5e9;
    --brand-accent: #14b8a6;
    --text-main: #f1f5f9;
    --text-muted: #94a3b8;
    --border-color: #475569;
    --radius: 12px;
    --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
}

* { box-sizing: border-box; }

body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--bg-body);
    color: var(--text-main);
    margin: 0;
    padding: 30px 20px;
}

.container {
    max-width: 1000px;
    margin: 0 auto;
    background: var(--bg-container);
    padding: 40px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

header {
    text-align: center;
    margin-bottom: 35px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 20px;
}

h1 {
    color: #ffffff;
    font-size: 1.8rem;
    margin: 0 0 8px 0;
    font-weight: 700;
    letter-spacing: -0.025em;
}

p.subtitle {
    color: var(--text-muted);
    font-size: 1rem;
    margin: 0;
}

.screen { display: none; }
.screen.active { display: block; animation: fadeIn 0.3s ease-in-out; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Formularios */
.form-group { margin-bottom: 20px; }
label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-main);
    font-size: 0.95rem;
}
input[type="text"], input[type="number"], select {
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
    background-color: #0f172a;
    color: #ffffff;
    transition: all 0.2s;
}
.form-group input, .form-group select { width: 100%; }
input:focus-visible, button:focus-visible, [role="button"]:focus-visible, textarea:focus-visible {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.35);
}

/* Botones */
button {
    background-color: var(--brand-primary);
    color: #0f172a;
    border: none;
    padding: 12px 24px;
    font-size: 0.95rem;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
button:hover { background-color: var(--brand-primary-hover); transform: translateY(-1px); }
button.secondary { background-color: var(--surface); color: var(--text-main); }
button.secondary:hover { background-color: #475569; }

/* Menú de pruebas */
.test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin: 25px 0;
}
.test-card {
    border: 1px solid var(--border-color);
    padding: 24px;
    border-radius: var(--radius);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface);
    position: relative;
    overflow: hidden;
}
.test-card:hover {
    border-color: var(--brand-primary);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
}
.test-card h3 { margin: 0 0 8px 0; color: #ffffff; font-size: 1.1rem; }
.test-card p { margin: 0; color: var(--text-muted); font-size: 0.85rem; line-height: 1.4; }
.test-card.completed::after {
    content: '✓ Completado';
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(20, 184, 166, 0.2);
    color: #2dd4bf;
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 600;
}

/* Lienzos */
.canvas-container {
    border: 2px solid var(--border-color);
    background: #ffffff;
    border-radius: var(--radius);
    position: relative;
    display: block;
    width: 100%;
    overflow: hidden;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
canvas { display: block; width: 100%; height: auto; cursor: crosshair; touch-action: none; }

.toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
    background: var(--surface);
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}
.toolbar label { margin: 0; font-size: 0.85rem; color: var(--text-main); display: flex; align-items: center; gap: 8px; }
.toolbar button { padding: 8px 16px; font-size: 0.85rem; background: var(--bg-body); color: var(--text-main); }
.toolbar button:hover { background: var(--border-color); }
.toolbar button.active { background: var(--brand-primary); color: #0f172a; }
.toolbar button.accent { background: var(--brand-accent); color: #0f172a; }
.toolbar button.accent:hover { background: #2dd4bf; }
.toolbar input[type="color"] { width: 38px; height: 34px; padding: 0; border: none; background: none; cursor: pointer; }
.toolbar select { padding: 6px 10px; font-size: 0.85rem; }
.toolbar input[type="range"] { width: 120px; padding: 0; }
.toolbar input[type="number"] { width: 110px; padding: 6px 10px; font-size: 0.85rem; }

/* Laberinto a pantalla completa */
#maze-fs-bar { display: none; }
#maze-stage.fs {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: var(--bg-body);
    display: flex;
    flex-direction: column;
    align-items: center;
}
#maze-stage.fs #maze-fs-bar {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
    padding: 6px 10px;
    flex-shrink: 0;
}
#maze-stage.fs #maze-fs-bar button { padding: 8px 16px; font-size: 0.85rem; }
#maze-stage.fs .canvas-container {
    width: auto;
    border: none;
    border-radius: 0;
    box-shadow: none;
    margin: auto 0;
}

/* Constelación */
.constellation-layout { display: flex; gap: 20px; align-items: flex-start; }
.constellation-layout .canvas-container { flex: 1; min-width: 0; }
.constellation-palette {
    width: 220px;
    flex-shrink: 0;
    border: 1px solid var(--border-color);
    padding: 16px;
    border-radius: var(--radius);
    background: var(--surface);
}
.palette-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 0 0 10px 0; }
.palette-item {
    background: var(--brand-accent);
    color: #0f172a;
    padding: 10px 12px;
    margin-bottom: 10px;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 700;
    transition: background 0.2s;
}
.palette-item:hover { background: #2dd4bf; }
.palette-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.palette-actions button { width: 100%; font-size: 0.8rem; padding: 9px 12px; }
.hint { font-size: 0.75rem; color: var(--text-muted); margin: 12px 0 0 0; line-height: 1.4; }

#constellation-workspace {
    width: 100%;
    aspect-ratio: 1080 / 630;
    position: relative;
    background: #ffffff;
    overflow: hidden;
    touch-action: none;
}
.placed-item {
    position: absolute;
    cursor: move;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    font-size: 0.8rem;
    font-weight: bold;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    z-index: 10;
}
.placed-item.rect {
    padding: 8px 14px;
    background: var(--brand-accent);
    color: #0f172a;
    border-radius: 6px;
    white-space: nowrap;
}
.placed-item.circle {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4px;
    font-size: 0.7rem;
    line-height: 1.1;
    overflow: hidden;
    word-break: break-word;
}
.placed-item.selected { outline: 3px solid var(--brand-primary); outline-offset: 2px; }

/* Informe */
.report-preview {
    border: 1px solid var(--border-color);
    padding: 30px;
    border-radius: var(--radius);
    background: #ffffff;
    color: #334155;
    margin-bottom: 25px;
}
.report-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
.report-header h3 { margin: 0 0 5px 0; color: #0f172a; }
.report-section { margin-bottom: 30px; }
.report-section h4 { color: #0f172a; margin: 0 0 5px 0; }
.report-meta { margin: 0 0 10px 0; font-size: 0.85rem; color: #64748b; }
.img-result {
    max-width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    margin-top: 10px;
    background: #fff;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.obs-label { display: block; margin: 14px 0 6px 0; font-size: 0.85rem; color: #0f172a; }
.obs {
    width: 100%;
    min-height: 72px;
    padding: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #f8fafc;
    color: #0f172a;
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
}
.obs-print { display: none; white-space: pre-wrap; font-size: 0.9rem; color: #0f172a; }
.actions-bar {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
}
.actions-group { display: flex; gap: 10px; flex-wrap: wrap; }

@media (max-width: 720px) {
    body { padding: 12px 8px; }
    .container { padding: 20px 14px; }
    .constellation-layout { flex-direction: column; }
    .constellation-palette { width: 100%; }
    .report-preview { padding: 16px; }
}

@media print {
    body { background: #fff; padding: 0; }
    .container { background: #fff; border: none; box-shadow: none; padding: 0; max-width: none; }
    header, .actions-bar, .screen > h2, .screen > p.subtitle { display: none !important; }
    .report-preview { border: none; padding: 0; }
    .obs { display: none; }
    .obs-print { display: block; }
    .report-section { break-inside: avoid; }
}

/* ---------- Configuración de la evaluación ---------- */
.cfg-block {
    border: 1px solid var(--border-color);
    background: var(--surface);
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 18px;
}
.cfg-block h3, .cfg-section-title { margin: 0 0 10px 0; font-size: 1rem; color: #ffffff; }
.cfg-section-title { margin-top: 24px; }
.cfg-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.cfg-row select { flex: 1; min-width: 180px; }
.cfg-row button { padding: 9px 14px; font-size: 0.85rem; }

.cfg-card {
    border: 1px solid var(--border-color);
    background: var(--surface);
    border-radius: var(--radius);
    margin-bottom: 14px;
}
.cfg-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}
.cfg-card-head strong { color: #ffffff; }
.cfg-move { display: flex; gap: 6px; }
.cfg-move button { padding: 4px 12px; font-size: 0.95rem; background: var(--bg-body); color: var(--text-main); }
.cfg-move button:hover { background: var(--border-color); }
.cfg-body { padding: 14px 16px; }
.cfg-card.off .cfg-body { opacity: 0.4; pointer-events: none; }

.cfg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.cfg-field > label { margin: 0; font-size: 0.85rem; }
.cfg-field select, .cfg-field textarea { width: 100%; }
.cfg-field textarea, .cfg-block textarea {
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #0f172a;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.95rem;
    resize: vertical;
}
.cfg-grid { display: flex; flex-wrap: wrap; gap: 10px 24px; align-items: center; }
.cfg-check { display: flex !important; align-items: center; gap: 8px; margin: 0 !important; font-weight: 600; cursor: pointer; }
.cfg-check input { width: auto !important; margin: 0; }
.cfg-inline { display: flex !important; align-items: center; gap: 8px; margin: 0 !important; font-size: 0.85rem; flex-wrap: wrap; }
.cfg-inline select { padding: 8px 10px; font-size: 0.85rem; }
.cfg-num { width: 90px; padding: 8px 10px; font-size: 0.9rem; }
.cfg-swatches { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.cfg-swatch { display: flex !important; align-items: center; gap: 6px; margin: 0 !important; font-weight: 500; font-size: 0.85rem; cursor: pointer; }
.cfg-swatch input { width: auto !important; margin: 0; }
.cfg-swatch .dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.5); display: inline-block; }

/* Cronómetro y avisos dentro de cada prueba */
.subtitle.consigna { margin: 0 0 14px 0; }
.test-status { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin: -6px 0 14px 0; }
.test-status:empty { display: none; }
.test-timer { font-weight: 700; color: var(--brand-primary); font-variant-numeric: tabular-nums; }
.limit-note { color: #fbbf24; font-weight: 600; }

/* Paleta de colores restringida (Dinámica Cromática) */
#paint-swatches { display: none; gap: 8px; align-items: center; flex-wrap: wrap; }
.toolbar button.swatch {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
}
.toolbar button.swatch.active { outline: 3px solid var(--brand-primary); outline-offset: 2px; }

/* ---------- Enlaces con aspecto de botón y avisos de la página de configuración ---------- */
.btn-link {
    display: inline-block;
    background-color: var(--brand-primary);
    color: #0f172a;
    padding: 12px 24px;
    font-size: 0.95rem;
    font-weight: 700;
    border-radius: 8px;
    text-decoration: none;
}
.btn-link:hover { background-color: var(--brand-primary-hover); }
.btn-link.secondary { background-color: var(--surface); color: var(--text-main); }
.btn-link.secondary:hover { background-color: #475569; }

.cfg-status { padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; font-weight: 600; }
.cfg-status.ok { background: rgba(20, 184, 166, 0.15); color: #2dd4bf; border: 1px solid #14b8a6; }
.cfg-status.error { background: rgba(244, 63, 94, 0.15); color: #fda4af; border: 1px solid #f43f5e; }

/* ---------- Configuración activa en el registro del evaluado ---------- */
.active-cfg {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    border: 1px solid var(--border-color);
    background: var(--surface);
    border-radius: var(--radius);
    padding: 12px 16px;
    margin-bottom: 25px;
    font-size: 0.85rem;
    color: var(--text-muted);
}
.active-cfg strong { color: var(--text-main); }
.active-cfg button { padding: 8px 14px; font-size: 0.8rem; }
