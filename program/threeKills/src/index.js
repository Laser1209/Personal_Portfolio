import './styles.css';
import { JumpGame, BOARD_W, BOARD_H, PLAYER_SIZE } from './game';

const W = BOARD_W;
const H = BOARD_H;
const PS = PLAYER_SIZE;

function init() {
  const game = new JumpGame();
  const app = document.getElementById('app');

  app.innerHTML = `<div class="game-wrapper">
    <div class="header">
      <div class="info"><span class="info-item">得分: <span id="score">0</span></span><span class="info-item">最高: <span id="highscore">${game.highScore}</span></span></div>
      <h1 style="color:#fff;margin:0">跳一跳</h1>
      <button class="btn btn-start" id="btn-start">开始</button>
    </div>
    <div class="canvas-container" style="width:${W}px;height:${H}px">
      <canvas id="game-canvas" width="${W}" height="${H}"></canvas>
      <div id="power-bar"><div id="power-fill"></div></div>
      <div class="overlay" id="overlay"><h2 id="overlay-msg">开始游戏</h2><p id="overlay-detail"></p><button class="btn btn-start" id="overlay-btn">开始</button></div>
    </div>
    <div class="tip">按住鼠标/触屏蓄力，松开跳跃 | 跳到中心方块 +2分</div>
  </div>`;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const powerFill = document.getElementById('power-fill');
  const overlay = document.getElementById('overlay');
  let animFrame;

  function render(state) {
    ctx.clearRect(0, 0, W, H);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#1a1a4e');
    skyGrad.addColorStop(0.7, '#2a1a4e');
    skyGrad.addColorStop(1, '#3a1a2e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    state.platforms.forEach(p => {
      ctx.fillStyle = p.center ? '#ffd700' : '#e0e0e0';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (p.center) {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const px = state.playerX;
    const py = state.playerY;
    const grad = ctx.createLinearGradient(px, py, px, py + PS);
    grad.addColorStop(0, '#00ff88');
    grad.addColorStop(1, '#00cc6a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(px, py, PS, PS, 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('跳', px + PS / 2, py + PS / 2 + 5);

    document.getElementById('score').textContent = state.score;
    document.getElementById('highscore').textContent = state.highScore;
    powerFill.style.width = `${state.charge}%`;

    if (state.gameOver) {
      overlay.classList.add('show');
      document.getElementById('overlay-msg').textContent = '游戏结束';
      document.getElementById('overlay-detail').textContent = `得分: ${state.score} | 最高: ${state.highScore}`;
      document.getElementById('overlay-btn').textContent = '再来一局';
    }
  }

  game.onStateChange = render;
  render(game.getState());

  function gameLoop() {
    if (game.jumping && game.playing) {
      game.update();
      if (!game.gameOver) game.notifyStateChange();
    }
    animFrame = requestAnimationFrame(gameLoop);
  }

  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!game.playing) return;
    if (game.gameOver) { startNew(); return; }
    game.startCharge();
  });

  canvas.addEventListener('mousemove', () => { if (game.charging) { game.updateCharge(); game.notifyStateChange(); } });
  canvas.addEventListener('mouseup', () => { game.releaseCharge(); game.notifyStateChange(); });
  canvas.addEventListener('mouseleave', () => { game.releaseCharge(); game.notifyStateChange(); });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!game.playing) return;
    if (game.gameOver) { startNew(); return; }
    game.startCharge();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (game.charging) { game.updateCharge(); game.notifyStateChange(); }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    game.releaseCharge();
    game.notifyStateChange();
  });

  function startNew() {
    overlay.classList.remove('show');
    game.start();
    game.notifyStateChange();
    if (!animFrame) gameLoop();
  }

  document.getElementById('btn-start').addEventListener('click', () => { overlay.classList.remove('show'); game.start(); game.notifyStateChange(); if (!animFrame) gameLoop(); });
  document.getElementById('overlay-btn').addEventListener('click', startNew);

  gameLoop();
}

document.addEventListener('DOMContentLoaded', init);