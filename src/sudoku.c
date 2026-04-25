#include <stdbool.h>
#include <emscripten/emscripten.h>

#define UNASSIGNED 0
#define N 9

/*
 * Solver adaptado del ejemplo "Sudoku Solver using Backtracking" de
 * GeeksforGeeks: https://www.geeksforgeeks.org/c/sudoku-in-c/#sudoku-solver-using-backtracking
 */

int FindUnassignedLocation(int grid[N][N], int* row, int* col) {
    for (*row = 0; *row < N; (*row)++) {
        for (*col = 0; *col < N; (*col)++) {
            if (grid[*row][*col] == UNASSIGNED) {
                return 1;
            }
        }
    }

    return 0;
}

int UsedInRow(int grid[N][N], int row, int num) {
    for (int col = 0; col < N; col++) {
        if (grid[row][col] == num) {
            return 1;
        }
    }

    return 0;
}

int UsedInCol(int grid[N][N], int col, int num) {
    for (int row = 0; row < N; row++) {
        if (grid[row][col] == num) {
            return 1;
        }
    }

    return 0;
}

int UsedInBox(int grid[N][N], int boxStartRow, int boxStartCol, int num) {
    for (int row = 0; row < 3; row++) {
        for (int col = 0; col < 3; col++) {
            if (grid[row + boxStartRow][col + boxStartCol] == num) {
                return 1;
            }
        }
    }

    return 0;
}

int isSafe(int grid[N][N], int row, int col, int num) {
    return !UsedInRow(grid, row, num)
           && !UsedInCol(grid, col, num)
           && !UsedInBox(grid, row - row % 3, col - col % 3, num)
           && grid[row][col] == UNASSIGNED;
}

int SolveSudoku(int grid[N][N]) {
    int row, col;

    if (!FindUnassignedLocation(grid, &row, &col)) {
        return 1;
    }

    for (int num = 1; num <= 9; num++) {
        if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;

            if (SolveSudoku(grid)) {
                return 1;
            }

            grid[row][col] = UNASSIGNED;
        }
    }

    return 0;
}

// Función exportada a WASM
EMSCRIPTEN_KEEPALIVE
int solve_sudoku(int* flat_board) {
    int grid[N][N];

    for (int i = 0; i < 81; i++) {
        int value = flat_board[i];
        if (value < 0 || value > 9) {
            return 0;
        }

        grid[i / 9][i % 9] = value;
    }

    int solved = SolveSudoku(grid);

    if (solved) {
        for (int i = 0; i < 81; i++) {
            flat_board[i] = grid[i / 9][i % 9];
        }
    }

    return solved;
}