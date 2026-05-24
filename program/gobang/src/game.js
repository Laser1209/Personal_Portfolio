export class GobangGame {
  constructor(container, boardSize = 15, cellSize = 32, padding = 16) {
    this.container = container;
    this.boardSize = boardSize;
    this.cellSize = cellSize;
    this.padding = padding;
    this.board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    this.currentPlayer = 'black';
    this.gameHistory = [];
    this.gameOver = false;
    this.onStateChange = null;
  }

  placePiece(x, y) {
    if (this.gameOver || this.board[y][x]) return false;

    this.board[y][x] = this.currentPlayer;
    this.gameHistory.push({ x, y, player: this.currentPlayer });

    if (this.checkWin(x, y, this.currentPlayer)) {
      this.gameOver = true;
      this.notifyStateChange();
      return true;
    }

    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    this.notifyStateChange();
    return true;
  }

  checkWin(x, y, player) {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) break;
        if (this.board[ny][nx] !== player) break;
        count++;
      }

      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) break;
        if (this.board[ny][nx] !== player) break;
        count++;
      }

      if (count >= 5) return true;
    }

    return false;
  }

  undoMove() {
    if (this.gameHistory.length === 0 || this.gameOver) return;

    const lastMove = this.gameHistory.pop();
    this.board[lastMove.y][lastMove.x] = null;
    this.currentPlayer = lastMove.player;
    this.notifyStateChange();
  }

  restart() {
    this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    this.currentPlayer = 'black';
    this.gameHistory = [];
    this.gameOver = false;
    this.notifyStateChange();
  }

  getCellFromPixel(px, py) {
    const x = Math.round((px - this.padding) / this.cellSize);
    const y = Math.round((py - this.padding) / this.cellSize);
    if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
      return { x, y };
    }
    return null;
  }

  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({
        board: this.board,
        currentPlayer: this.currentPlayer,
        gameOver: this.gameOver,
        lastMove: this.gameHistory.length > 0
          ? this.gameHistory[this.gameHistory.length - 1]
          : null,
        boardSize: this.boardSize,
        cellSize: this.cellSize,
        padding: this.padding
      });
    }
  }
}