# PsiMatrix – Suite Proyectiva Digital

Aplicación web (HTML + CSS + JavaScript, sin framework ni servidor) para administrar cuatro pruebas proyectivas en pantalla y generar un informe con las producciones del evaluado.

Consta de **dos páginas independientes**:

| Página | Para quién | Qué hace |
|---|---|---|
| `configuracion.html` | El evaluador | Define los parámetros de la evaluación, gestiona perfiles y deja una configuración activa |
| `index.html` | El evaluado / la administración de las pruebas | Registra al evaluado, administra las pruebas y genera el informe. No permite cambiar la configuración |

## Pruebas incluidas

| Prueba | Qué registra |
|---|---|
| **Test de la Casa** | Dibujo libre (lápiz fino, pincel, goma, color) |
| **Constelación Familiar / Vincular** | Elementos arrastrables en un plano (Principal, Vínculo Cercano, Periférica, Obstáculo, Refugio); se pueden renombrar y eliminar |
| **Dinámica Cromática** | Trazo continuo o manchas con el color elegido |
| **Laberinto Estructural** | Trazo desde la entrada a la salida, con tres niveles de dificultad (ver abajo) |

De cada prueba se guarda la imagen final y el tiempo total de ejecución.

## Flujo de uso

1. **El evaluador abre `configuracion.html`**, ajusta los parámetros (o carga un perfil) y pulsa "Aplicar e ir a la evaluación". Eso deja la configuración como **configuración activa** y abre `index.html`.
2. **Datos del evaluado** (`index.html`): nombre (obligatorio), documento y edad. Solo datos de la persona.
3. **Batería de pruebas:** se muestran solo las pruebas elegidas, en el orden configurado. Se pueden reabrir sin perder lo dibujado. Cada prueba se cierra con "Guardar y Continuar".
4. **Informe:** integra las pruebas guardadas, con observaciones del profesional por prueba y generales.
5. **Salida:** exportar a Word (`.docx`), imprimir / guardar como PDF, o iniciar un nuevo evaluado (la configuración activa se conserva).

La configuración activa **se conserva aunque se cierre la página**: al volver a abrir `index.html`, el registro del evaluado muestra un resumen de la configuración vigente (dispositivo, pruebas, laberinto, límites) y un botón **"Configuración (evaluador)"** que lleva a `configuracion.html` para ajustarla. Ese botón solo está en el registro; las pruebas y el menú no tienen acceso a la configuración. Si hay datos de una evaluación en curso, pide confirmar antes de salir.

Si `index.html` se abre sin una configuración activa, avisa y ofrece ir a `configuracion.html`.

### Acceso del evaluador (`js/acceso.js`)

Quién puede abrir la configuración también está detrás de una interfaz (`access.request(motivo)` devuelve si se permite). Hoy el acceso es libre (`OpenAccess`). Para exigir una contraseña más adelante se cambia solo la última línea de `acceso.js`: los dos puntos de control (el botón de `index.html` y la carga de `configuracion.html`) ya están cableados. Si no se autoriza, `configuracion.html` muestra "Acceso restringido".

Ojo: una contraseña verificada en el navegador es una **barrera de uso, no de seguridad** (quien lea el código puede saltársela). Una restricción real requiere autenticación en un servidor.

## Configuración de la evaluación

Los parámetros se definen en `configuracion.html`, aparte de las pruebas y antes de comenzar. Es responsabilidad del evaluador mantenerlos iguales cuando se necesite comparar entre evaluados.

**Generales**
- Dispositivo y forma de ingreso: computadora con mouse, pantalla táctil, tablet con dedo o lápiz, celular con dedo u otro.
- Qué pruebas incluir y en qué orden.
- Cronómetro visible u oculto para el evaluado.
- Al cumplirse el límite de tiempo de una prueba: solo avisar, o guardar y cerrar la prueba.

**Por prueba** (todas tienen consigna editable y límite de tiempo en minutos, 0 = sin límite)

| Prueba | Parámetros propios |
|---|---|
| Test de la Casa | Permitir color o solo grafito; permitir goma |
| Constelación Familiar | Paleta fija (con modelos Genérica, Familiar y Laboral, editables) o rótulos que escribe el evaluado; máximo de elementos |
| Dinámica Cromática | Paleta libre o restringida a los colores marcados; herramientas disponibles (trazo continuo, mancha) |
| Laberinto | Tipo, dificultad y número de laberinto (ver abajo) |

**Perfiles:** la configuración se puede guardar con un nombre (por ejemplo "Adultos laborales") y volver a cargar. Los perfiles guardan solo parámetros, nunca datos del evaluado ni el dispositivo. Dónde se guardan lo decide la capa de almacenamiento (ver más abajo); por defecto, en el navegador de ese equipo.

**Registro:** en el informe, cada prueba muestra la consigna y los parámetros con que se administró, tal como estaban al guardarla.

## Laberinto

- **Tipos** (se eligen en la configuración):
  - **Rectangular:** paredes finas sobre una cuadrícula fina.
  - **Pasillos anchos:** cuadrícula gruesa dibujada como pasillos anchos (fondo oscuro, pasillos blancos), más fácil de recorrer con el dedo.
- **Niveles:** cada tipo tiene tres niveles que cambian el tamaño de la cuadrícula.

  | Nivel | Rectangular | Pasillos anchos |
  |---|---|---|
  | Fácil | 16×9 | 6×4 |
  | Media | 20×11 | 8×5 |
  | Difícil | 25×14 | 10×6 |

  En la configuración se ve una vista previa del recorrido óptimo.
- **Numeración:** cada tipo y nivel tiene 9999 laberintos numerados. El mismo tipo, nivel y número dan siempre el mismo laberinto, lo que permite administrar el mismo laberinto a distintos evaluados. Con el campo vacío o con "🎲 Al azar" se elige uno cualquiera.
- **Filtro de calidad:** se descartan automáticamente los laberintos demasiado directos. Cada tipo y nivel exige que el recorrido óptimo esté dentro de una franja de largo y tenga un mínimo de bifurcaciones.
- **Pantalla completa:** botón "⛶ Pantalla completa" para usar toda la pantalla (útil con la tablet en horizontal). Se sale con el botón o con Esc.
- **Medidas del participante** (aparecen en el informe): celdas recorridas frente al óptimo, celdas distintas, si llegó a la salida y:
  - en **Rectangular**, los *cruces de pared* (veces que el trazo atraviesa una pared);
  - en **Pasillos anchos**, las *salidas del pasillo* (veces que el trazo pasa de dentro a fuera del pasillo; empezar a trazar fuera del pasillo no cuenta).

  Son medidas **descriptivas**: se calculan muestreando el trazo, por lo que en una esquina puede haber un error de una celda. **No son comparables entre tipos distintos**: para comparar entre evaluados hay que usar el mismo tipo, nivel y número.

## Informe

El informe incluye datos del evaluado, dispositivo, fecha y, por cada prueba: la imagen, el tiempo (con el límite, si se configuró), la consigna, los parámetros usados y las observaciones. Para el laberinto agrega nivel, número, recorrido óptimo y recorrido del participante.

## Privacidad y almacenamiento

Todo ocurre en el navegador y **no se envía nada a ningún servidor**. Los datos del evaluado y sus producciones viven solo en memoria: al cerrar o recargar la pestaña se pierden (la app avisa antes de salir si hay datos). Descargue el informe antes de cerrar.

Lo único que se guarda son **parámetros de configuración** (perfiles y configuración activa), y siempre a través de la capa de almacenamiento.

### Capa de almacenamiento (`js/almacenamiento.js`)

El resto del código no sabe dónde se guardan los parámetros: solo usa el objeto `store`. Cualquier implementación debe cumplir este contrato (todas las operaciones son asíncronas):

| Método | Devuelve |
|---|---|
| `listProfiles()` | nombres de los perfiles |
| `getProfile(name)` | la configuración del perfil, o `null` |
| `saveProfile(name, config)` | crea o reemplaza un perfil |
| `deleteProfile(name)` | elimina un perfil |
| `getActiveConfig()` | la configuración activa, o `null` |
| `setActiveConfig(config)` | fija la configuración activa |
| `describe()` | texto que indica dónde se guarda |

Implementaciones incluidas:
- **`LocalStorageStore`** (por defecto): `localStorage` del navegador. Los perfiles no se comparten entre navegadores ni equipos.
- **`JsonProfilesStore`**: agrega perfiles compartidos desde un archivo JSON del sitio (solo lectura) y delega los perfiles nuevos y la configuración activa en otra implementación. No está activada; para usarla se cambia la última línea de `almacenamiento.js`:

```js
const store = new JsonProfilesStore('data/perfiles.json', new LocalStorageStore());
```

Formato del archivo: `{ "perfiles": { "Adultos laborales": { ...configuración sin dispositivo... } } }`.

Para una **base de datos**, se escribe otra clase con el mismo contrato (en `almacenamiento.js` hay un ejemplo comentado de `ApiStore` sobre una API REST) y se elige en esa misma línea. Ninguna otra parte del código cambia.

## Estructura del repositorio

```
proyectivasnuevas/
├── index.html            Evaluación: registro, pruebas e informe
├── configuracion.html    Configuración de la evaluación (uso del evaluador)
├── css/
│   └── estilos.css       Estilos compartidos (incluye vista de impresión)
├── js/
│   ├── comun.js          Utilidades, modelo de configuración y generación de laberintos
│   ├── almacenamiento.js Capa de almacenamiento (contrato + implementaciones)
│   ├── acceso.js         Control de acceso del evaluador (hoy libre; contraseña a futuro)
│   ├── configuracion.js  Lógica de configuracion.html
│   └── evaluacion.js     Lógica de index.html
└── README.md
```

`index.html` conserva ese nombre porque es el archivo que los servidores (Netlify, GitHub Pages) abren por defecto al entrar a la dirección del sitio.

`evaluacion.js` se organiza en secciones: utilidades y flujo principal, Casa, Constelación, Dinámica Cromática, Laberinto (dibujo, análisis, pantalla completa y registro del recorrido), aplicación de la configuración (cronómetro y límites), guardado e informe.

## Cómo ejecutarla

- **Local:** abrir `configuracion.html` en el navegador, o servir la carpeta con cualquier servidor estático. Como las dos páginas se comunican a través del almacenamiento del navegador, con archivos abiertos desde el disco funciona en Chrome y Edge; en Firefox conviene servirlos (por ejemplo, con `python -m http.server`) o publicarlos.
- **Publicación:** sirve cualquier hosting estático (Netlify, GitHub Pages). Deben subirse juntos `index.html`, `configuracion.html`, `css/` y `js/`.
- **Conexión:** la exportación a Word carga la librería [`docx` 8.5.0](https://www.npmjs.com/package/docx) desde jsDelivr, por lo que necesita internet. Sin conexión queda disponible "Imprimir / Guardar PDF".

## Uso en tablet y celular

El dibujo usa Pointer Events, así que funciona con mouse, dedo y lápiz. Con el dedo el trazo es menos preciso que con lápiz (especialmente en el laberinto), y por eso el dispositivo queda registrado en el informe. Se recomienda usar la tablet en horizontal.

## Alcance y limitaciones

- Las pruebas son **cualitativas**: no incluyen puntuación normativa ni baremos. El laberinto es de diseño propio y no equivale a instrumentos normativos como el de Porteus.
- Los parámetros (dificultad del laberinto, consignas, límites, etc.) los define el profesional; no hay asignación automática por edad.
- Cada parámetro que se cambia afecta la estandarización: para comparar entre evaluados hay que usar la misma configuración (los perfiles ayudan a eso).
- La interpretación de las producciones es responsabilidad del profesional.
