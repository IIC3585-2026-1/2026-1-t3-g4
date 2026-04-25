EMCC ?= emcc
SRC := src/sudoku.c
OUT_DIR := wasm
OUT_JS := $(OUT_DIR)/sudoku.js
OUT_WASM := $(OUT_DIR)/sudoku.wasm

.PHONY: build run clean check

check:
	@command -v $(EMCC) >/dev/null 2>&1 || { \
		echo "Error: emcc no esta disponible. Instala y activa Emscripten."; \
		exit 1; \
	}

build: check
	@mkdir -p $(OUT_DIR)
	$(EMCC) $(SRC) -O3 -o $(OUT_JS) \
		-s WASM=1 \
		-s EXPORTED_FUNCTIONS='["_solve_sudoku","_malloc","_free"]' \
		-s ALLOW_MEMORY_GROWTH=1

run:
	python3 -m http.server 8000

clean:
	rm -f $(OUT_JS) $(OUT_WASM)
