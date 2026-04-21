let ModuleReady = false;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const filledCountEl = document.getElementById("filledCount");
const difficultyLevelEl = document.getElementById("difficultyLevel");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status status--${type}`;
}

if (typeof Module === "undefined") {
  setStatus("Error: sudoku.js no cargado", "error");
} else {
  Module.onRuntimeInitialized = () => {
    ModuleReady = true;
    setStatus("WASM cargado. Puedes resolver el Sudoku.", "ok");
  };
}

function getCells() {
  return [...document.querySelectorAll(".cell")];
}

function getDifficultyLabel(filledCount) {
  if (filledCount <= 24) return "Avanzada";
  if (filledCount <= 34) return "Intermedia";
  return "Basica";
}

function updateDashboard(board, duplicateCount) {
  const filledCount = board.filter(value => value !== 0).length;

  if (filledCountEl) filledCountEl.textContent = String(filledCount);
  if (difficultyLevelEl) {
    const baseLabel = getDifficultyLabel(filledCount);
    difficultyLevelEl.textContent = duplicateCount > 0 ? `${baseLabel} (conflictos)` : baseLabel;
  }
}

function focusCell(row, col) {
  if (row < 0 || row > 8 || col < 0 || col > 8) return;
  const target = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (target) target.focus();
}

function handleCellNavigation(event, row, col) {
  const key = event.key;

  if (key === "ArrowUp") {
    event.preventDefault();
    focusCell(row - 1, col);
  }

  if (key === "ArrowDown") {
    event.preventDefault();
    focusCell(row + 1, col);
  }

  if (key === "ArrowLeft") {
    event.preventDefault();
    focusCell(row, col - 1);
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    focusCell(row, col + 1);
  }

  if (key === "Enter") {
    event.preventDefault();
    focusCell(row + 1, col);
  }

  if (key === "Backspace" && event.target.value === "") {
    event.preventDefault();
    focusCell(row, col - 1);
  }
}

function createBoard() {
  for (let i = 0; i < 81; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 1;
    input.placeholder = "";
    input.className = "cell";

    const row = Math.floor(i / 9);
    const col = i % 9;

    input.dataset.index = String(i);
    input.dataset.row = String(row);
    input.dataset.col = String(col);
    input.setAttribute("aria-label", `Celda fila ${row + 1}, columna ${col + 1}`);

    input.addEventListener("input", () => {
      const cleaned = input.value.replace(/[^1-9]/g, "").slice(0, 1);
      input.value = cleaned;

      if (cleaned && col < 8) {
        focusCell(row, col + 1);
      }

      validateBoardVisual();
    });

    input.addEventListener("keydown", event => {
      handleCellNavigation(event, row, col);
    });

    input.addEventListener("focus", () => {
      input.select();
    });

    if ((col + 1) % 3 === 0 && col !== 8) input.classList.add("bold-right");
    if ((row + 1) % 3 === 0 && row !== 8) input.classList.add("bold-bottom");

    boardEl.appendChild(input);
  }
}

function getBoard() {
  return getCells().map(cell => Number(cell.value) || 0);
}

function setBoard(arr) {
  const cells = getCells();
  cells.forEach((cell, i) => {
    cell.value = arr[i] === 0 ? "" : String(arr[i]);
  });
  validateBoardVisual();
}

function markDuplicates(indexes, hasCompleteBoard) {
  const cells = getCells();
  cells.forEach((cell, i) => {
    cell.classList.toggle("is-error", indexes.has(i));
    cell.classList.toggle("is-correct", hasCompleteBoard && !indexes.has(i));
  });
}

function collectDuplicates(board) {
  const dupes = new Set();

  const markUnit = indices => {
    const seen = new Map();
    for (const index of indices) {
      const value = board[index];
      if (!value) continue;
      if (!seen.has(value)) seen.set(value, []);
      seen.get(value).push(index);
    }

    for (const indexList of seen.values()) {
      if (indexList.length > 1) {
        indexList.forEach(index => dupes.add(index));
      }
    }
  };

  for (let row = 0; row < 9; row++) {
    const indices = [];
    for (let col = 0; col < 9; col++) indices.push(row * 9 + col);
    markUnit(indices);
  }

  for (let col = 0; col < 9; col++) {
    const indices = [];
    for (let row = 0; row < 9; row++) indices.push(row * 9 + col);
    markUnit(indices);
  }

  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const indices = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          indices.push((boxRow + row) * 9 + boxCol + col);
        }
      }
      markUnit(indices);
    }
  }

  return dupes;
}

function validateBoardVisual() {
  const board = getBoard();
  const duplicates = collectDuplicates(board);
  const hasZeros = board.some(value => value === 0);
  const completeAndValid = !hasZeros && duplicates.size === 0;

  markDuplicates(duplicates, completeAndValid);
  updateDashboard(board, duplicates.size);
  return duplicates.size === 0;
}

function solve() {
  if (!ModuleReady) {
    setStatus("WASM aun no esta listo.", "info");
    return;
  }

  if (!validateBoardVisual()) {
    setStatus("Corrige los conflictos marcados antes de resolver.", "error");
    return;
  }

  const board = getBoard();
  const ptr = Module._malloc(board.length * 4);
  Module.HEAP32.set(board, ptr / 4);

  const solved = Module._solve_sudoku(ptr);

  if (solved) {
    const result = Array.from(Module.HEAP32.subarray(ptr / 4, ptr / 4 + 81));
    setBoard(result);
    validateBoardVisual();
    setStatus("Sudoku resuelto correctamente.", "ok");
  } else {
    setStatus("Sin solucion para este tablero.", "error");
  }

  Module._free(ptr);
}

function clearBoard() {
  setBoard(Array(81).fill(0));
  setStatus("Tablero limpio.", "info");
}

function loadExample() {
  setBoard([
    3, 2, 1, 7, 0, 4, 0, 0, 0,
    6, 4, 0, 0, 9, 0, 0, 0, 7,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 4, 5, 9, 0, 0,
    0, 0, 5, 1, 8, 7, 4, 0, 0,
    0, 0, 4, 9, 6, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, 7, 0, 0, 1, 9,
    0, 0, 0, 6, 0, 9, 5, 8, 2
  ]);
  setStatus("Ejemplo cargado.", "info");
}

document.getElementById("solveBtn").onclick = solve;
document.getElementById("clearBtn").onclick = clearBoard;
document.getElementById("exampleBtn").onclick = loadExample;

createBoard();
