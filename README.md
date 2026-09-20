# PsiMatrix – Suite Proyectiva Digital

Aplicación web (HTML + CSS + JavaScript, sin framework ni servidor) para administrar cuatro pruebas proyectivas en pantalla y generar un informe con las producciones del evaluado.

## Pruebas incluidas

| Prueba | Qué registra |
|---|---|
| **Test de la Casa** | Dibujo libre (lápiz fino, pincel, goma, color) |
| **Constelación Familiar / Vincular** | Elementos arrastrables en un plano (Principal, Vínculo Cercano, Periférica, Obstáculo, Refugio); se pueden renombrar y eliminar |
| **Dinámica Cromática** | Trazo continuo o manchas con el color elegido |
| **Laberinto Estructural** | Trazo desde la entrada a la salida, con tres niveles de dificultad (ver abajo) |

De cada prueba se guarda la imagen final y el tiempo total de ejecución.

## Flujo de uso

1. **Registro del evaluado:** nombre (obligatorio), documento, edad y **dispositivo y forma de ingreso** (obligatorio: computadora con mouse, pantalla táctil, tablet con dedo o lápiz, celular, otro).
2. **Batería de pruebas:** se pueden hacer en cualquier orden y reabrir sin perder lo dibujado. Cada prueba se cierra con "Guardar y Continuar".
3. **Informe:** integra las pruebas guardadas, con un campo de observaciones del profesional por prueba y otro general.
4. **Salida:** exportar a Word (`.docx`), imprimir / guardar como PDF, o iniciar un nuevo evaluado.

## Laberinto

- **Niveles:** Fácil (16×9), Media (20×11) y Difícil (25×14).
- **Numeración:** cada nivel tiene 9999 laberintos numerados. El mismo nivel y número dan siempre el mismo laberinto, lo que permite administrar el mismo laberinto a distintos evaluados. Con el campo vacío o con "🎲 Al azar" se elige uno cualquiera.
- **Filtro de calidad:** se descartan automáticamente los laberintos demasiado directos. Cada nivel exige que el recorrido óptimo esté dentro de una franja de largo y tenga un mínimo de bifurcaciones.
- **Pantalla completa:** botón "⛶ Pantalla completa" para usar toda la pantalla (útil con la tablet en horizontal). Se sale con el botón o con Esc.
- **Medidas del participante** (aparecen en el informe): celdas recorridas frente al óptimo, celdas distintas, cruces de pared y si llegó a la salida. Son medidas **descriptivas**: se calculan muestreando el trazo, por lo que en una esquina puede haber un error de una celda.

## Informe

El informe incluye datos del evaluado, dispositivo, fecha, la imagen de cada prueba, el tiempo, los datos del laberinto (nivel, número, recorrido óptimo y recorrido del participante) y las observaciones.

## Privacidad

Todo ocurre en el navegador. **No se envía ni se guarda nada** en ningún servidor ni en el almacenamiento del navegador: al cerrar o recargar la pestaña se pierde el protocolo (la app avisa antes de salir si hay datos). Descargue el informe antes de cerrar.

## Estructura del repositorio

```
proyectivasnuevas/
├── index.html      Estructura de las pantallas
├── css/
│   └── styles.css  Estilos (incluye vista de impresión)
├── js/
│   └── app.js      Lógica de la aplicación
└── README.md
```

`app.js` se organiza en secciones: utilidades y flujo principal, Casa, Constelación, Dinámica Cromática, Laberinto (generación, análisis, pantalla completa y registro del recorrido), guardado e informe.

## Cómo ejecutarla

- **Local:** abrir `index.html` en el navegador, o servir la carpeta con cualquier servidor estático.
- **Publicación:** sirve cualquier hosting estático (Netlify, GitHub Pages). Deben subirse juntos `index.html`, `css/` y `js/`.
- **Conexión:** la exportación a Word carga la librería [`docx` 8.5.0](https://www.npmjs.com/package/docx) desde jsDelivr, por lo que necesita internet. Sin conexión queda disponible "Imprimir / Guardar PDF".

## Uso en tablet y celular

El dibujo usa Pointer Events, así que funciona con mouse, dedo y lápiz. Con el dedo el trazo es menos preciso que con lápiz (especialmente en el laberinto), y por eso el dispositivo queda registrado en el informe. Se recomienda usar la tablet en horizontal.

## Alcance y limitaciones

- Las pruebas son **cualitativas**: no incluyen puntuación normativa ni baremos. El laberinto es de diseño propio y no equivale a instrumentos normativos como el de Porteus.
- El nivel de dificultad del laberinto lo elige el profesional; no hay asignación automática por edad.
- La interpretación de las producciones es responsabilidad del profesional.
