# Sudoku Solver con WebAssembly

## 1. Resumen academico del encargo
El trabajo solicita integrar codigo existente en C/C++ dentro de una aplicacion web usando WebAssembly, en un problema con alta carga computacional. Se eligio Sudoku 9x9, cuyo enfoque de resolucion por backtracking presenta complejidad exponencial en el peor caso, lo que justifica el uso de WASM para la parte de calculo.

## 2. Que se implemento
Se construyo una solucion con separacion clara de responsabilidades:

- C (`src/sudoku.c`): implementa el solver por backtracking.
- WebAssembly (`wasm/sudoku.wasm`): modulo binario generado con Emscripten.
- JavaScript (`web/main.js`): puente entre interfaz y modulo WASM.
- HTML/CSS (`web/index.html`, `web/style.css`): interfaz de usuario para cargar, editar y resolver tableros.

La integracion sigue el modelo visto en clases:

1. JavaScript recopila el tablero (81 enteros).
2. Reserva memoria en el heap WASM (`_malloc`) y copia datos a `Module.HEAP32`.
3. Invoca la funcion exportada `_solve_sudoku`.
4. Lee la solucion desde memoria WASM y actualiza la interfaz.

## 3. Fuentes y fundamento tecnico
### 3.1 Codigo base del solver
El solver fue tomado y adaptado desde GeeksforGeeks:

- https://www.geeksforgeeks.org/c/sudoku-in-c/#sudoku-solver-using-backtracking

### 3.2 Fuentes de referencia para WASM/Emscripten
Se siguieron lineamientos oficiales para compilacion e interoperabilidad:

- Emscripten Tutorial:
	https://emscripten.org/docs/getting_started/Tutorial.html
- Interacting with code (JS <-> C/C++):
	https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html
- MDN, C/C++ to Wasm:
	https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/C_to_Wasm

## 4. Estructura del proyecto

- `src/sudoku.c`: solver en C exportado a WASM.
- `wasm/`: artefactos compilados (`sudoku.js`, `sudoku.wasm`).
- `web/index.html`: interfaz y carga del modulo.
- `web/main.js`: logica de integracion y flujo de memoria.
- `web/style.css`: estilos del frontend.
- `Makefile`: comandos de compilacion y ejecucion.

## 5. Ejecucion del proyecto
### 5.1 Requisitos

- Emscripten instalado y disponible en PATH (`emcc`).
- Python 3.

### 5.2 Compilacion

```bash
make build
```

Salida esperada:

- `wasm/sudoku.js`
- `wasm/sudoku.wasm`

### 5.3 Levantar servidor web

```bash
make run
```

Abrir en navegador:

- `http://localhost:8000/web/index.html`

### 5.4 Prueba funcional rapida

1. Presionar `Cargar ejemplo`.
2. Presionar `Resolver`.
3. Verificar estado de exito y tablero completo.

## 6. Cumplimiento respecto a la pauta

- Se incorpora codigo existente en C para resolver Sudoku.
- Se compila con Emscripten para generar modulo WASM.
- Se integra WASM en la pagina mediante JavaScript.
- Se entrega frontend funcional para demostrar el modulo.
- Se documenta explicitamente la fuente del algoritmo utilizado.

## 7. Conclusión
La solucion cumple el objetivo academico del encargo: demostrar, de forma simple y justificable, la integracion de C en web mediante WebAssembly para un problema computacionalmente intensivo. La arquitectura adoptada permite explicar con claridad compilacion, interoperabilidad JS-WASM y uso de memoria lineal en tiempo de ejecucion.