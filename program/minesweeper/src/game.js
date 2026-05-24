export const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard:   { rows: 16, cols: 30, mines: 99 }
};

export class MinesweeperGame {
  constructor(difficulty = 'easy') {
    const config = DIFFICULTIES[difficulty];
    this.rows = config.rows;
    this.cols = config.cols;
    this.totalMines = config.mines;
    this.board = [];
    this.revealed = [];
    this.flagged = [];
    this.mines = [];
    this.gameOver = false;
    this.gameWon = false;
    this.flagCount = 0;
    this.startTime = null;
    this.elapsedTime = 0;
    this.onStateChange = null;
    this.initBoard();
  }

  initBoard() {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    this.mines = [];
    this.gameOver = false;
    this.gameWon = false;
    this.flagCount = 0;
    this.elapsedTime = 0;

    let placed = 0;
    while (placed < this.totalMines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (this.board[r][c] !== -1) {
        this.board[r][c] = -1;
        this.mines.push({ row: r, col: c });
        placed++;
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === -1) {
              count++;
            }
          }
        }
        this.board[r][c] = count;
      }
    }
  }

  clickCell(row, col) {
    if (this.gameOver || this.gameWon || this.flagged[row][col] || this.revealed[row][col]) return;

    if (!this.startTime) {
      this.startTime = Date.now();
    }

    if (this.board[row][col] === -1) {
      this.revealed[row][col] = true;
      this.gameOver = true;
      this.mines.forEach(m => { this.revealed[m.row][m.col] = true; });
      this.notifyStateChange();
      return;
    }

    this.revealCell(row, col);
    this.checkWin();
    this.notifyStateChange();
  }

  flagCell(row, col) {
    if (this.gameOver || this.gameWon || this.revealed[row][col]) return;
    this.flagged[row][col] = !this.flagged[row][col];
    this.flagCount += this.flagged[row][col] ? 1 : -1;
    this.notifyStateChange();
  }

  revealCell(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    if (this.revealed[row][col] || this.flagged[row][col]) return;
    this.revealed[row][col] = true;
    if (this.board[row][col] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          this.revealCell(row + dr, col + dc);
        }
      }
    }
  }

  checkWin() {
    let revealedCount = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.revealed[r][c]) revealedCount++;
      }
    }
    if (revealedCount === this.rows * this.cols - this.totalMines) {
      this.gameWon = true;
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.notifyStateChange();
    }
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    if (this.gameOver || this.gameWon) return this.elapsedTime;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({
        board: this.board,
        revealed: this.revealed,
        flagged: this.flagged,
        gameOver: this.gameOver,
        gameWon: this.gameWon,
        flagCount: this.flagCount,
        totalMines: this.totalMines,
        elapsedTime: this.getElapsedTime(),
        rows: this.rows,
        cols: this.cols
      });
    }
  }
}