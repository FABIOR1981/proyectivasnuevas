/* ============================================================================
   Acceso del evaluador

   Decide quién puede abrir la configuración. Igual que el almacenamiento, está detrás de una
   interfaz: hoy el acceso es libre, y mañana se puede exigir una contraseña cambiando SOLO la
   última línea de este archivo (los dos puntos de control ya están cableados en la aplicación:
   el botón «Configuración (evaluador)» de index.html y la carga de configuracion.html).

   Contrato:
     request(motivo)  → Promise<boolean>   true si se permite el acceso
     describe()       → string             cómo se controla el acceso (texto para mostrar)

   Importante: una contraseña verificada en el navegador es una barrera de uso, no de seguridad
   (quien lea el código puede saltársela). Una restricción real necesita autenticación en un servidor.
   ============================================================================ */

// --- Implementación actual: acceso libre ---
class OpenAccess {
    async request() { return true; }
    describe() { return 'acceso libre (sin contraseña)'; }
}

/* Ejemplo de lo que sería con contraseña (mismo contrato, otra clase):

   class PasswordAccess {
       constructor(verify) { this.verify = verify; }   // verify(clave) → Promise<boolean>, por ejemplo contra un servidor
       async request(motivo) {
           const clave = prompt('Contraseña del evaluador:');
           return clave !== null && await this.verify(clave);
       }
       describe() { return 'protegido con contraseña'; }
   }
*/

// >>> Único lugar donde se decide cómo se controla el acceso <<<
const access = new OpenAccess();
// const access = new PasswordAccess(async (clave) => (await fetch('/api/verificar', { method: 'POST', body: clave })).ok);
