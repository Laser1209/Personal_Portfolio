import './styles.css';
import { SpiderSolitaire } from './game';

const SUITS = ['♠', '♥', '♦', '♣'];

function init() {
  const game = new SpiderSolitaire();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="game-wrapper">
      <div class="header">
        <div class="info">
          <span class="info-item">得分: <span id="score">${game.score}</span></span>
          <span class="info-item">步数: <span id="moves">${game.moves}</span></span>
          <span class="info-item">剩余: <span id="stock-count">5</span>叠</span>
        </div>
        <h1 style="color:#fff;margin:0">蜘蛛纸牌</h1>
        <div>
          <button class="btn btn-deal" id="btn-deal">发牌</button>
          <button class="btn btn-new" id="btn-new">新游戏</button>
        </div>
      </div>
      <div class="board" id="board"></div>
      <div class="foundations" id="foundations"></div>
      <div class="overlay" id="overlay">
        <h2>通关!</h2>
        <p id="overlay-score"></p>
        <button class="btn btn-deal" id="btn-restart">再来一局</button>
      </div>
    </div>
  `;

  function render(state) {
    const board = document.getElementById('board');
    if (!board) return;
    board.innerHTML = '';

    state.piles.forEach((pile, col) => {
      const pileDiv = document.createElement('div');
      pileDiv.className = `pile${pile.length === 0 ? ' empty' : ''}`;
      if (pile.length === 0) pileDiv.addEventListener('click', () => game.moveToPile(col));

      pile.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card${card.faceUp ? '' : ' face-down'} ${card.color}`;
        if (card.faceUp) {
          cardDiv.innerHTML = `<span class="suit">${card.suit}</span><span class="value">${card.value}</span><span class="suit-bottom">${card.suit}</span>`;
          cardDiv.addEventListener('click', (e) => { e.stopPropagation(); game.selectCard(col, idx); });
        }
        if (state.selectedPile === col && state.selectedIndex === idx) {
          cardDiv.classList.add('selected');
        }
        pileDiv.appendChild(cardDiv);
      });

      board.appendChild(pileDiv);
    });

    const foundations = document.getElementById('foundations');
    foundations.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const f = document.createElement('div');
      f.className = `foundation${state.foundations[i] === 8 ? ' complete' : ''}`;
      f.textContent = state.foundations[i] > 0 ? '♠' : SUITS[i];
      if (state.foundations[i] === 8) f.style.color = '#ffd700';
      foundations.appendChild(f);
    }

    document.getElementById('score').textContent = state.score;
    document.getElementById('moves').textContent = state.moves;
    document.getElementById('stock-count').textContent = Math.ceil(state.stock.length / 10);
    document.getElementById('btn-deal').disabled = state.stock.length === 0;

    if (state.gameOver) {
      document.getElementById('overlay-score').textContent = `得分: ${state.score} | 步数: ${state.moves}`;
      document.getElementById('overlay').classList.add('show');
    }
  }

  game.onStateChange = render;
  render({
    piles: game.piles, stock: game.stock, foundations: game.foundations,
    score: game.score, moves: game.moves, gameOver: game.gameOver,
    selectedPile: game.selectedPile, selectedIndex: game.selectedIndex
  });

  document.getElementById('btn-deal').addEventListener('click', () => game.dealCards());
  document.getElementById('btn-new').addEventListener('click', () => { document.getElementById('overlay').classList.remove('show'); game.initGame(); game.notifyStateChange(); });
  document.getElementById('btn-restart').addEventListener('click', () => { document.getElementById('overlay').classList.remove('show'); game.initGame(); game.notifyStateChange(); });
}

document.addEventListener('DOMContentLoaded', init);