import './styles.css';
import { ContraGame } from './game';

const W = 800, H = 500, GROUND_Y = 420;

function init() {
  const game = new ContraGame();
  const app = document.getElementById('app');

  app.innerHTML = `<div class="game-wrapper">
    <div class="header">
      <div class="info"><span class="info-item">❤️ <span id="hp">3</span></span><span class="info-item">⭐ <span id="score">0</span></span></div>
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:4px">魂斗罗</h1>
      <button class="btn btn-start" id="btn-start">开始游戏</button>
    </div>
    <canvas id="game-canvas" width="${W}" height="${H}"></canvas>
    <div class="controls-info"><span>← → / A D 移动</span><span>↑ / W 跳跃</span><span>空格 / J 射击</span></div>
    <div class="overlay" id="overlay"><h2 id="overlay-msg"></h2><p id="overlay-detail"></p><button class="btn btn-start" id="overlay-btn">开始游戏</button></div>
  </div>`;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  let animFrame;

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx);
    drawPlayer(ctx);
    game.bullets.forEach(b => drawBullet(ctx, b));
    game.enemies.forEach(e => drawEnemy(ctx, e));
    game.particles.forEach(p => drawParticle(ctx, p));

    document.getElementById('hp').textContent = game.hp;
    document.getElementById('score').textContent = game.score;

    if (game.gameWon) {
      overlay.classList.add('show', 'win');
      document.getElementById('overlay-msg').textContent = '胜利!';
      document.getElementById('overlay-detail').textContent = `得分: ${game.score}`;
      document.getElementById('overlay-btn').textContent = '再来一局';
    }
    if (game.gameOver) {
      overlay.classList.add('show', 'lose');
      document.getElementById('overlay-msg').textContent = '阵亡!';
      document.getElementById('overlay-detail').textContent = `得分: ${game.score}`;
      document.getElementById('overlay-btn').textContent = '再来一局';
    }
  }

  function drawBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a2e'); grad.addColorStop(0.7, '#1a0a2e'); grad.addColorStop(1, '#0d1a0a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = (game.bgX % 100); x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }

    ctx.fillStyle = 'rgba(100,200,100,0.3)';
    for (let x = 0; x < W; x += 40) {
      const h = 5 + Math.sin(x * 0.05 + game.bgX * 0.02) * 3;
      ctx.fillRect(x, GROUND_Y - h, 30, h + 2);
    }

    ctx.fillStyle = '#1a3a1a'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#2a4a2a'; ctx.fillRect(0, GROUND_Y, W, 4);
  }

  function drawPlayer(ctx) {
    const { playerX: x, playerY: y, playerWidth: pw, playerHeight: ph, facingRight } = game;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x + (facingRight ? 4 : 0), y + 4, pw - 4, ph - 8);
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(x + (facingRight ? 10 : 4), y + 12, pw - 14, ph - 20);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(x, y + 4, pw, 4);
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(x + pw / 2, y + ph / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    const gunX = x + (facingRight ? pw - 4 : 0);
    ctx.fillStyle = '#333';
    ctx.fillRect(gunX, y + ph / 2 - 2, facingRight ? 10 : -10, 4);
  }

  function drawBullet(ctx, b) {
    ctx.fillStyle = '#ffdd00';
    ctx.shadowColor = '#ffdd00'; ctx.shadowBlur = 6;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.shadowBlur = 0;
  }

  function drawEnemy(ctx, e) {
    ctx.fillStyle = e.type === 'tank' ? '#8b0000' : '#cc3333';
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);

    if (e.type === 'tank') {
      ctx.fillStyle = '#444';
      ctx.fillRect(e.x - 2, e.y + 10, 5, 10);
    }
    if (e.type === 'runner') {
      const legOffset = Math.sin(e.frame * 0.3) * 4;
      ctx.fillStyle = '#cc3333';
      ctx.fillRect(e.x + 4, e.y + e.height, 8, 6 + legOffset);
      ctx.fillRect(e.x + e.width - 12, e.y + e.height, 8, 6 - legOffset);
    }

    ctx.fillStyle = '#ff0000'; ctx.fillRect(0, e.y + e.height - 3, e.width, 3);
    ctx.fillStyle = '#00ff00'; ctx.fillRect(0, e.y + e.height - 3, e.width * (e.health / 3), 3);
  }

  function drawParticle(ctx, p) {
    ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 20;
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1;
  }

  game.onStateChange = render;

  document.addEventListener('keydown', (e) => {
    if (!game.playing) return;
    game.setKey(e.code, true);
    if (e.code === 'Space') e.preventDefault();
  });
  document.addEventListener('keyup', (e) => game.setKey(e.code, false));

  function gameLoop() {
    game.update();
    render();
    animFrame = requestAnimationFrame(gameLoop);
  }

  function startNew() {
    overlay.classList.remove('show', 'win', 'lose');
    game.start();
  }

  document.getElementById('btn-start').addEventListener('click', startNew);
  document.getElementById('overlay-btn').addEventListener('click', startNew);

  render();
  gameLoop();
}

document.addEventListener('DOMContentLoaded', init);