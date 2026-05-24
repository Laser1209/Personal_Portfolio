const { SpiderSolitaire } = require('../src/game');

describe('SpiderSolitaire', () => {
  let game;

  beforeEach(() => { game = new SpiderSolitaire(); });

  test('should initialize with 10 piles', () => {
    expect(game.piles.length).toBe(10);
  });

  test('should initialize with 50 stock cards', () => {
    expect(game.stock.length).toBe(50);
  });

  test('should have correct initial score', () => {
    expect(game.score).toBe(500);
    expect(game.moves).toBe(0);
  });

  test('should select a face-up card', () => {
    for (let i = 0; i < 10; i++) {
      if (game.piles[i].length > 0) {
        const lastIdx = game.piles[i].length - 1;
        game.selectCard(i, lastIdx);
        expect(game.selectedPile).toBe(i);
        expect(game.selectedIndex).toBe(lastIdx);
        break;
      }
    }
  });

  test('should deselect when clicking same card', () => {
    for (let i = 0; i < 10; i++) {
      if (game.piles[i].length > 0) {
        const lastIdx = game.piles[i].length - 1;
        game.selectCard(i, lastIdx);
        game.selectCard(i, lastIdx);
        expect(game.selectedPile).toBeNull();
        break;
      }
    }
  });

  test('should deal cards from stock', () => {
    const initialStockLen = game.stock.length;
    game.dealCards();
    expect(game.stock.length).toBe(initialStockLen - 10);
    expect(game.moves).toBe(1);
  });

  test('should not deal when stock is empty', () => {
    game.stock = [];
    expect(game.dealCards()).toBe(false);
  });

  test('should restart game', () => {
    game.score = 200;
    game.moves = 10;
    game.initGame();
    expect(game.score).toBe(500);
    expect(game.moves).toBe(0);
    expect(game.gameOver).toBe(false);
  });
});