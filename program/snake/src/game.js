const safeStorage = {
  getItem(key) { try { return (typeof localStorage !== 'undefined' && localStorage.getItem(key)) || '0'; } catch (e) { return '0'; } },
  setItem(key, val) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); } catch (e) { /* ignore */ } }
};

export class SnakeGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 20;
    this.tileCount = canvas.width / this.gridSize;
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.highScore = parseInt(safeStorage.getItem('snakeHighScore'), 10);
    this.gameOver = false;
    this.speed = 100;
    this.gameLoopId = null;
    this.lastUpdateTime = 0;
  }

  spawnFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
    } while (this.snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    return pos;
  }

  setDirection(dx, dy) {
    if (dx !== 0 && this.direction.x === -dx) return;
    if (dy !== 0 && this.direction.y === -dy) return;
    this.nextDirection = { x: dx, y: dy };
  }

  update() {
    if (this.gameOver) return;

    this.direction = { ...this.nextDirection };
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    if (head.x < 0 || head.x >= this.tileCount ||
        head.y < 0 || head.y >= this.tileCount) {
      this.endGame();
      return;
    }

    if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.food = this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  draw() {
    const { ctx, gridSize, tileCount } = this;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < tileCount; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#16213e' : '#1a1a2e';
      for (let j = 0; j < tileCount; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
        }
      }
    }

    this.snake.forEach((seg, i) => {
      const gradient = ctx.createLinearGradient(
        seg.x * gridSize, seg.y * gridSize,
        (seg.x + 1) * gridSize, (seg.y + 1) * gridSize
      );
      gradient.addColorStop(0, '#00ff88');
      gradient.addColorStop(1, '#00cc6a');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        seg.x * gridSize + 1,
        seg.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );
    });

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
      this.food.x * gridSize + gridSize / 2,
      this.food.y * gridSize + gridSize / 2,
      gridSize / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${this.score}`, 10, 30);
    ctx.fillText(`Best: ${this.highScore}`, 10, 55);
  }

  gameStep(timestamp) {
    if (timestamp - this.lastUpdateTime >= this.speed) {
      this.update();
      this.draw();
      this.lastUpdateTime = timestamp;
    }
    this.gameLoopId = requestAnimationFrame((t) => this.gameStep(t));
  }

  start() {
    this.lastUpdateTime = performance.now();
    this.gameLoopId = requestAnimationFrame((t) => this.gameStep(t));
  }

  endGame() {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      safeStorage.setItem('snakeHighScore', String(this.highScore));
    }
    cancelAnimationFrame(this.gameLoopId);

    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
    this.ctx.textAlign = 'left';
  }

  restart() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.gameOver = false;
    this.draw();
    this.start();
  }

  destroy() {
    cancelAnimationFrame(this.gameLoopId);
  }
}