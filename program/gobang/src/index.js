import './styles.css';
import { GobangGame } from './game';

function init() {
  const BOARD_SIZE = 15;
  const CELL_SIZE = 32;
  const PADDING = 16;
  const canvasSize = PADDING * 2 + CELL_SIZE * BOARD_SIZE;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="game-wrapper">
      <div class="header">
        <div class="current-player" id="player-info">当前玩家: 黑方</div>
        <h1 style="margin:0">五子棋</h1>
        <div>
          <button class="btn btn-undo" id="btn-undo">悔棋</button>
          <button class="btn btn-restart" id="btn-restart">重新开始</button>
        </div>
      </div>
      <div class="board-container" style="width:${canvasSize}px;height:${canvasSize}px">
        <canvas id="board-canvas" width="${canvasSize}" height="${canvasSize}"></canvas>
        <div class="overlay" id="overlay">
          <h2 id="winner-text"></h2>
          <button class="btn btn-restart" id="btn-restart2">再来一局</button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('board-canvas');
  const ctx = canvas.getContext('2d');
  const game = new GobangGame(null, BOARD_SIZE, CELL_SIZE, PADDING);
  const playerInfo = document.getElementById('player-info');
  const overlay = document.getElementById('overlay');
  const winnerText = document.getElementById('winner-text');

  function drawBoard() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, w, h);

    const boardGrad = ctx.createLinearGradient(0, 0, w, h);
    boardGrad.addColorStop(0, '#deb887');
    boardGrad.addColorStop(1, '#d2a679');
    ctx.fillStyle = boardGrad;
    ctx.beginPath();
    ctx.roundRect(PADDING, PADDING, CELL_SIZE * BOARD_SIZE, CELL_SIZE * BOARD_SIZE, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      const pos = PADDING + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(PADDING + BOARD_SIZE * CELL_SIZE, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, PADDING + BOARD_SIZE * CELL_SIZE);
      ctx.stroke();
    }

    const dotPositions = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];
    ctx.fillStyle = '#333';
    for (const [cx, cy] of dotPositions) {
      ctx.beginPath();
      ctx.arc(PADDING + cx * CELL_SIZE, PADDING + cy * CELL_SIZE, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function render(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();

    for (let y = 0; y < state.boardSize; y++) {
      for (let x = 0; x < state.boardSize; x++) {
        if (state.board[y][x]) {
          const px = state.padding + x * state.cellSize;
          const py = state.padding + y * state.cellSize;
          const r = state.cellSize / 2 - 2;

          if (state.board[y][x] === 'black') {
            const grad = ctx.createRadialGradient(px - 3, py - 3, r * 0.3, px, py, r);
            grad.addColorStop(0, '#555');
            grad.addColorStop(1, '#000');
            ctx.fillStyle = grad;
          } else {
            const grad = ctx.createRadialGradient(px - 3, py - 3, r * 0.3, px, py, r);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(1, '#ddd');
            ctx.fillStyle = grad;
          }

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (state.lastMove && !state.gameOver) {
      const lx = state.padding + state.lastMove.x * state.cellSize;
      const ly = state.padding + state.lastMove.y * state.cellSize;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, ly, state.cellSize / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.gameOver) {
      const winner = state.currentPlayer === 'black' ? '白方' : '黑方';
      winnerText.textContent = `${winner}获胜!`;
      overlay.classList.add('show');
    }

    const playerName = state.currentPlayer === 'black' ? '黑方' : '白方';
    playerInfo.textContent = `当前玩家: ${playerName}`;
  }

  game.onStateChange = render;
  drawBoard();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cell = game.getCellFromPixel(e.clientX - rect.left, e.clientY - rect.top);
    if (cell) game.placePiece(cell.x, cell.y);
  });

  document.getElementById('btn-undo').addEventListener('click', () => game.undoMove());
  document.getElementById('btn-restart').addEventListener('click', () => {
    overlay.classList.remove('show');
    game.restart();
    drawBoard();
  });
  document.getElementById('btn-restart2').addEventListener('click', () => {
    overlay.classList.remove('show');
    game.restart();
    drawBoard();
  });
}

document.addEventListener('DOMContentLoaded', init);