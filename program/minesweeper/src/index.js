import './styles.css';
import { MinesweeperGame, DIFFICULTIES } from './game';

const NUMBER_COLORS = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];

let game;
let timerInterval;

function init(level = 'easy') {
  if (timerInterval) clearInterval(timerInterval);
  game = new MinesweeperGame(level);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="game-wrapper">
      <div class="header">
        <div class="info">
          <span class="info-item">🚩 <span id="flag-count">0</span></span>
          <span class="info-item">💣 <span id="mine-count">${game.totalMines}</span></span>
          <span class="info-item">⏱ <span id="time">0</span></span>
        </div>
        <h1 style="color:#fff;margin:0">扫雷</h1>
        <div class="diff-btns">
          <button class="diff-btn${level==='easy'?' active':''}" data-level="easy">简单</button>
          <button class="diff-btn${level==='medium'?' active':''}" data-level="medium">中等</button>
          <button class="diff-btn${level==='hard'?' active':''}" data-level="hard">困难</button>
          <button class="btn btn-restart" id="btn-restart">重新开始</button>
        </div>
      </div>
      <div class="board" id="board" style="grid-template-columns:repeat(${game.cols},28px)"></div>
      <div class="overlay" id="overlay">
        <h2></h2><p></p>
        <button class="btn btn-restart" id="btn-restart2">再来一局</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => init(btn.dataset.level));
  });

  document.getElementById('btn-restart').addEventListener('click', () => init(level));
  document.getElementById('btn-restart2').addEventListener('click', () => init(level));

  game.onStateChange = (state) => {
    renderBoard(state);
    document.getElementById('flag-count').textContent = state.flagCount;
    document.getElementById('time').textContent = state.elapsedTime;

    const overlay = document.getElementById('overlay');
    if (state.gameOver) {
      overlay.classList.add('show', 'lose');
      overlay.querySelector('h2').textContent = '💥 踩到雷了!';
      overlay.querySelector('p').textContent = '游戏结束';
    }
    if (state.gameWon) {
      overlay.classList.add('show', 'win');
      overlay.querySelector('h2').textContent = '🎉 恭喜获胜!';
      overlay.querySelector('p').textContent = `用时: ${state.elapsedTime} 秒`;
    }
  };

  renderBoard({
    board: game.board, revealed: game.revealed, flagged: game.flagged,
    gameOver: false, gameWon: false, flagCount: 0, totalMines: game.totalMines,
    elapsedTime: 0, rows: game.rows, cols: game.cols
  });

  timerInterval = setInterval(() => {
    if (game.startTime && !game.gameOver && !game.gameWon) {
      document.getElementById('time').textContent = game.getElapsedTime();
    }
  }, 1000);
}

function renderBoard(state) {
  const board = document.getElementById('board');
  if (!board) return;
  board.style.gridTemplateColumns = `repeat(${state.cols},28px)`;
  board.innerHTML = '';

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = document.createElement('button');
      cell.className = 'cell';

      if (state.revealed[r][c]) {
        cell.classList.add('revealed');
        if (state.board[r][c] === -1) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else if (state.board[r][c] > 0) {
          cell.textContent = state.board[r][c];
          cell.style.color = NUMBER_COLORS[state.board[r][c]];
        }
      } else if (state.flagged[r][c]) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      }

      cell.addEventListener('click', () => game.clickCell(r, c));
      cell.addEventListener('contextmenu', (e) => { e.preventDefault(); game.flagCell(r, c); });

      board.appendChild(cell);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => init());