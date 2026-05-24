import './styles.css';
import { SnakeGame } from './game';

function init() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="game-wrapper">
      <canvas id="snake-canvas" width="400" height="400"></canvas>
      <div class="controls">
        方向键 / WASD 控制移动 | 空格键重新开始
      </div>
    </div>
  `;

  const canvas = document.getElementById('snake-canvas');
  const game = new SnakeGame(canvas);
  game.draw();

  document.addEventListener('keydown', (e) => {
    const keyMap = {
      ArrowUp:    [ 0, -1],
      ArrowDown:  [ 0,  1],
      ArrowLeft:  [-1,  0],
      ArrowRight: [ 1,  0],
      KeyW: [ 0, -1],
      KeyS: [ 0,  1],
      KeyA: [-1,  0],
      KeyD: [ 1,  0]
    };

    if (keyMap[e.code]) {
      e.preventDefault();
      if (game.snake.length === 3 && game.score === 0 && !game.gameOver) {
        game.start();
      }
      game.setDirection(keyMap[e.code][0], keyMap[e.code][1]);
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (game.gameOver) {
        game.restart();
      }
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      game.setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      game.setDirection(0, dy > 0 ? 1 : -1);
    }

    if (game.snake.length === 3 && game.score === 0 && !game.gameOver) {
      game.start();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);