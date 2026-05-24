const { JumpGame } = require('../src/game');

describe('JumpGame', () => {
  let game;

  beforeEach(() => { game = new JumpGame(); });

  test('should initialize with platforms', () => {
    expect(game.platforms.length).toBeGreaterThanOrEqual(11);
    expect(game.score).toBe(0);
    expect(game.playing).toBe(false);
  });

  test('should start game', () => {
    game.start();
    expect(game.playing).toBe(true);
    expect(game.gameOver).toBe(false);
    expect(game.score).toBe(0);
  });

  test('should charge power', () => {
    game.start();
    game.startCharge();
    expect(game.charging).toBe(true);
    const power = game.updateCharge();
    expect(power).toBeGreaterThan(0);
  });

  test('should cap charge at 100', () => {
    game.start();
    game.startCharge();
    game.charge = 99;
    const power = game.updateCharge();
    expect(power).toBeLessThanOrEqual(100);
  });

  test('should release charge and jump', () => {
    game.start();
    game.startCharge();
    game.charge = 50;
    game.releaseCharge();
    expect(game.charging).toBe(false);
    expect(game.jumping).toBe(true);
    expect(game.velY).not.toBe(0);
  });

  test('should end game correctly', () => {
    game.score = 10;
    game.endGame();
    expect(game.gameOver).toBe(true);
    expect(game.playing).toBe(false);
  });

  test('should save high score', () => {
    game.highScore = 5;
    game.score = 15;
    game.endGame();
    expect(game.highScore).toBe(15);
  });
});