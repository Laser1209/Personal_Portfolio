const { ContraGame, Bullet } = require('../src/game');

describe('ContraGame', () => {
  let game;

  beforeEach(() => { game = new ContraGame(); });

  test('should initialize with default values', () => {
    expect(game.hp).toBe(3);
    expect(game.score).toBe(0);
    expect(game.gameOver).toBe(false);
    expect(game.playing).toBe(false);
  });

  test('should start game and spawn enemies', () => {
    game.start();
    expect(game.playing).toBe(true);
    expect(game.enemies.length).toBeGreaterThan(0);
    expect(game.hp).toBe(3);
  });

  test('should shoot bullets', () => {
    game.start();
    game.shoot();
    expect(game.bullets.length).toBe(1);
    expect(game.shootCooldown).toBe(15);
  });

  test('should not shoot during cooldown', () => {
    game.start();
    game.shootCooldown = 10;
    game.shoot();
    expect(game.bullets.length).toBe(0);
  });

  test('should detect bullet-enemy collision', () => {
    game.start();
    const enemy = game.enemies[0];
    game.bullets = [new Bullet(enemy.x + 10, enemy.y + 10, 7, 0, 1)];
    game.update();
    expect(enemy.health).toBeLessThan(3);
  });

  test('should set and unset keys', () => {
    game.setKey('ArrowLeft', true);
    expect(game.keys['ArrowLeft']).toBe(true);
    game.setKey('ArrowLeft', false);
    expect(game.keys['ArrowLeft']).toBe(false);
  });
});