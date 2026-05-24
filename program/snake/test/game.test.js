const { SnakeGame } = require('../src/game');

global.requestAnimationFrame = jest.fn((cb) => setTimeout(() => cb(performance.now()), 0));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
global.performance = { now: jest.fn(() => Date.now()) };
global.Image = class { constructor() { this.src = ''; this.onload = null; } };

describe('SnakeGame', () => {
  let game;
  let canvas;

  beforeEach(() => {
    jest.clearAllMocks();
    canvas = { width: 400, height: 400, getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      fillStyle: '',
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillText: jest.fn(),
      font: '',
      textAlign: '',
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      }))
    })) };
    game = new SnakeGame(canvas);
  });

  test('should initialize with correct default values', () => {
    expect(game.score).toBe(0);
    expect(game.gameOver).toBe(false);
    expect(game.snake.length).toBe(3);
    expect(game.direction).toEqual({ x: 1, y: 0 });
  });

  test('should set direction correctly', () => {
    game.setDirection(0, -1);
    expect(game.nextDirection).toEqual({ x: 0, y: -1 });
  });

  test('should not allow reversing direction', () => {
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    game.setDirection(-1, 0);
    expect(game.nextDirection).toEqual({ x: 1, y: 0 });
  });

  test('should spawn food within bounds', () => {
    const food = game.spawnFood();
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(game.tileCount);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeLessThan(game.tileCount);
  });

  test('should move snake in current direction on update', () => {
    const initialHead = { ...game.snake[0] };
    game.update();
    expect(game.snake[0].x).toBe(initialHead.x + 1);
    expect(game.snake[0].y).toBe(initialHead.y);
  });

  test('should end game on wall collision', () => {
    game.snake[0] = { x: game.tileCount - 1, y: 0 };
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    game.update();
    expect(game.gameOver).toBe(true);
  });

  test('should restart game correctly', () => {
    game.score = 50;
    game.gameOver = true;
    game.restart();
    expect(game.score).toBe(0);
    expect(game.gameOver).toBe(false);
    expect(game.snake.length).toBe(3);
  });
});