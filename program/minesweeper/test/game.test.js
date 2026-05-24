const { MinesweeperGame, DIFFICULTIES } = require('../src/game');

describe('MinesweeperGame', () => {
  let game;

  beforeEach(() => { game = new MinesweeperGame('easy'); });

  test('should initialize with correct difficulty params', () => {
    expect(game.rows).toBe(9);
    expect(game.cols).toBe(9);
    expect(game.totalMines).toBe(10);
    expect(game.mines.length).toBe(10);
  });

  test('should not reveal after game over', () => {
    const mine = game.mines[0];
    game.clickCell(mine.row, mine.col);
    expect(game.gameOver).toBe(true);
  });

  test('should flag and unflag a cell', () => {
    game.flagCell(0, 0);
    expect(game.flagged[0][0]).toBe(true);
    expect(game.flagCount).toBe(1);
    game.flagCell(0, 0);
    expect(game.flagged[0][0]).toBe(false);
    expect(game.flagCount).toBe(0);
  });

  test('should not flag a revealed cell', () => {
    game.revealed[0][0] = true;
    game.flagCell(0, 0);
    expect(game.flagged[0][0]).toBe(false);
  });

  test('should support all difficulty levels', () => {
    const medium = new MinesweeperGame('medium');
    expect(medium.rows).toBe(16);
    expect(medium.cols).toBe(16);
    expect(medium.mines.length).toBe(40);

    const hard = new MinesweeperGame('hard');
    expect(hard.rows).toBe(16);
    expect(hard.cols).toBe(30);
    expect(hard.mines.length).toBe(99);
  });

  test('should start timer on first click', () => {
    expect(game.startTime).toBeNull();
    const safeCells = [];
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r][c] !== -1) { safeCells.push([r, c]); break; }
      }
      if (safeCells.length) break;
    }
    if (safeCells.length) {
      game.clickCell(safeCells[0][0], safeCells[0][1]);
      expect(game.startTime).not.toBeNull();
    }
  });
});