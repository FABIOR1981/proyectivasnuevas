/* ============================================================================
   Capa de almacenamiento (patrón repositorio)

   El resto de la aplicación NO sabe dónde se guardan los datos: solo usa el objeto `store`
   que se crea al final de este archivo. Para cambiar el destino (archivo JSON, base de datos)
   basta con escribir otra clase con el mismo contrato y elegirla en la última línea.

   Contrato (todas las operaciones devuelven Promesas, para que una implementación remota
   pueda ser asíncrona sin tocar el resto del código):

     listProfiles()             → Promise<string[]>        nombres de los perfiles
     getProfile(name)           → Promise<object|null>     configuración del perfil
     saveProfile(name, config)  → Promise<void>            crea o reemplaza un perfil
     deleteProfile(name)        → Promise<void>
     getActiveConfig()          → Promise<object|null>     configuración vigente para las evaluaciones
     setActiveConfig(config)    → Promise<void>
     describe()                 → string                   dónde se guarda (para mostrarlo al evaluador)

   Si una operación no es posible (por ejemplo, modificar un perfil de solo lectura) la
   implementación debe lanzar un Error con un mensaje entendible: la interfaz lo muestra tal cual.

   Solo se guardan parámetros de configuración. Los datos del evaluado y sus producciones
   nunca pasan por esta capa.
   ============================================================================ */

// --- Implementación por defecto: localStorage del navegador ---
class LocalStorageStore {
    constructor(prefix = 'psimatrix_') {
        this.profilesKey = prefix + 'perfiles_v1';
        this.activeKey = prefix + 'config_activa_v1';
    }
    _read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
    }
    _write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { throw new Error('No se pudo escribir en el almacenamiento del navegador.'); }
    }
    async listProfiles() { return Object.keys(this._read(this.profilesKey, {})).sort(); }
    async getProfile(name) { return this._read(this.profilesKey, {})[name] || null; }
    async saveProfile(name, config) {
        const all = this._read(this.profilesKey, {});
        all[name] = config;
        this._write(this.profilesKey, all);
    }
    async deleteProfile(name) {
        const all = this._read(this.profilesKey, {});
        delete all[name];
        this._write(this.profilesKey, all);
    }
    async getActiveConfig() { return this._read(this.activeKey, null); }
    async setActiveConfig(config) { this._write(this.activeKey, config); }
    describe() { return 'este navegador (localStorage)'; }
}

// --- Perfiles compartidos desde un archivo JSON externo (solo lectura) ---
// Formato del archivo:  { "perfiles": { "Adultos laborales": { ...configuración sin dispositivo... } } }
// Los perfiles nuevos y la configuración activa se delegan en otra implementación (`base`).
class JsonProfilesStore {
    constructor(url, base) {
        this.url = url;
        this.base = base;
        this._cache = null;
    }
    async _remote() {
        if (this._cache) return this._cache;
        try {
            const res = await fetch(this.url, { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            this._cache = data && typeof data.perfiles === 'object' && data.perfiles ? data.perfiles : {};
        } catch (e) { this._cache = {}; }   // sin archivo o sin conexión: solo se ven los perfiles locales
        return this._cache;
    }
    async listProfiles() {
        const remote = Object.keys(await this._remote());
        const local = await this.base.listProfiles();
        return [...new Set([...remote, ...local])].sort();
    }
    async getProfile(name) {
        const remote = await this._remote();
        return remote[name] || this.base.getProfile(name);
    }
    async _assertEditable(name) {
        if ((await this._remote())[name]) {
            throw new Error(`«${name}» es un perfil del archivo compartido y no se puede modificar desde la aplicación.`);
        }
    }
    async saveProfile(name, config) { await this._assertEditable(name); return this.base.saveProfile(name, config); }
    async deleteProfile(name) { await this._assertEditable(name); return this.base.deleteProfile(name); }
    getActiveConfig() { return this.base.getActiveConfig(); }
    setActiveConfig(config) { return this.base.setActiveConfig(config); }
    describe() { return `archivo ${this.url} (solo lectura) y ${this.base.describe()}`; }
}

/* Ejemplo de cómo sería una base de datos detrás de una API (mismo contrato, otra clase):

   class ApiStore {
       constructor(baseUrl) { this.baseUrl = baseUrl; }
       async _json(path, options) {
           const res = await fetch(this.baseUrl + path, { headers: { 'Content-Type': 'application/json' }, ...options });
           if (!res.ok) throw new Error('El servidor respondió ' + res.status);
           return res.status === 204 ? null : res.json();
       }
       listProfiles()            { return this._json('/perfiles'); }
       getProfile(name)          { return this._json('/perfiles/' + encodeURIComponent(name)); }
       saveProfile(name, config) { return this._json('/perfiles/' + encodeURIComponent(name), { method: 'PUT', body: JSON.stringify(config) }); }
       deleteProfile(name)       { return this._json('/perfiles/' + encodeURIComponent(name), { method: 'DELETE' }); }
       getActiveConfig()         { return this._json('/configuracion-activa'); }
       setActiveConfig(config)   { return this._json('/configuracion-activa', { method: 'PUT', body: JSON.stringify(config) }); }
       describe()                { return 'el servidor ' + this.baseUrl; }
   }
*/

// >>> Único lugar donde se decide dónde se guardan los datos <<<
const store = new LocalStorageStore();
// Perfiles compartidos desde un JSON del sitio (solo lectura) además de los locales:
// const store = new JsonProfilesStore('data/perfiles.json', new LocalStorageStore());
