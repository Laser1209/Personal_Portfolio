const { GobangGame } = require('../src/game');

describe('GobangGame', () => {
  let game;

  beforeEach(() => {
    game = new GobangGame(null, 15, 32, 16);
  });

  test('should initialize with empty board', () => {
    expect(game.currentPlayer).toBe('black');
    expect(game.gameOver).toBe(false);
    expect(game.gameHistory.length).toBe(0);
  });

  test('should place piece and switch player', () => {
    game.placePiece(7, 7);
    expect(game.board[7][7]).toBe('black');
    expect(game.currentPlayer).toBe('white');
  });

  test('should not allow placing piece on occupied cell', () => {
    game.placePiece(7, 7);
    expect(game.placePiece(7, 7)).toBe(false);
  });

  test('should detect horizontal win', () => {
    game.board[7][3] = 'black';
    game.board[7][4] = 'black';
    game.board[7][5] = 'black';
    game.board[7][6] = 'black';
    game.currentPlayer = 'black';
    expect(game.placePiece(7, 7)).toBe(true);
    expect(game.gameOver).toBe(true);
  });

  test('should detect vertical win', () => {
    game.board[3][7] = 'black';
    game.board[4][7] = 'black';
    game.board[5][7] = 'black';
    game.board[6][7] = 'black';
    game.currentPlayer = 'black';
    game.placePiece(7, 7);
    expect(game.gameOver).toBe(true);
  });

  test('should detect diagonal win', () => {
    game.board[3][3] = 'black';
    game.board[4][4] = 'black';
    game.board[5][5] = 'black';
    game.board[6][6] = 'black';
    game.currentPlayer = 'black';
    game.placePiece(7, 7);
    expect(game.gameOver).toBe(true);
  });

  test('should undo last move', () => {
    game.placePiece(7, 7);
    game.undoMove();
    expect(game.board[7][7]).toBeNull();
    expect(game.currentPlayer).toBe('black');
  });

  test('should restart game', () => {
    game.placePiece(7, 7);
    game.restart();
    expect(game.board[7][7]).toBeNull();
    expect(game.gameOver).toBe(false);
    expect(game.currentPlayer).toBe('black');
  });

  test('should get correct cell from pixel coordinates', () => {
    const cell = game.getCellFromPixel(16 + 3 * 32, 16 + 5 * 32);
    expect(cell).toEqual({ x: 3, y: 5 });
  });

  test('should return null for out-of-bounds pixel', () => {
    expect(game.getCellFromPixel(-10, 100)).toBeNull();
    expect(game.getCellFromPixel(100, 1000)).toBeNull();
  });
});