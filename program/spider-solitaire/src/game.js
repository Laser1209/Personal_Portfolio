const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const COLORS = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' };
const NUM_PILES = 10;
const CARDS_PER_SUIT = 13;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let i = 0; i < VALUES.length; i++) {
      deck.push({ suit, value: VALUES[i], numericValue: i + 1, color: COLORS[suit], faceUp: false });
    }
  }
  return shuffle([...deck, ...deck]);
}

export class SpiderSolitaire {
  constructor() {
    this.piles = [];
    this.stock = [];
    this.foundations = [0, 0, 0, 0];
    this.score = 500;
    this.moves = 0;
    this.gameOver = false;
    this.selectedPile = null;
    this.selectedIndex = null;
    this.onStateChange = null;
    this.initGame();
  }

  initGame() {
    const deck = createDeck();
    this.stock = deck.slice(0, 50);
    this.piles = Array(NUM_PILES).fill(null).map(() => []);

    let cardIdx = 50;
    for (let col = 0; col < NUM_PILES; col++) {
      const count = col < 4 ? 6 : 5;
      for (let row = 0; row < count; row++) {
        const card = deck[cardIdx++];
        card.faceUp = row === count - 1;
        this.piles[col].push(card);
      }
    }
    this.foundations = [0, 0, 0, 0];
    this.score = 500;
    this.moves = 0;
    this.gameOver = false;
  }

  dealCards() {
    if (this.stock.length === 0 || this.gameOver) return false;
    for (let i = 0; i < NUM_PILES; i++) {
      if (this.stock.length > 0) {
        const card = this.stock.pop();
        card.faceUp = true;
        this.piles[i].push(card);
      }
    }
    this.score -= 10;
    this.moves++;
    this.checkCompleted();
    this.notifyStateChange();
    return true;
  }

  selectCard(col, idx) {
    if (this.gameOver) return;
    const pile = this.piles[col];
    if (!pile[idx] || !pile[idx].faceUp) return;

    if (this.selectedPile === col && this.selectedIndex === idx) {
      this.selectedPile = null;
      this.selectedIndex = null;
    } else {
      this.selectedPile = col;
      this.selectedIndex = idx;
    }
    this.notifyStateChange();
  }

  moveToPile(toCol) {
    if (this.selectedPile === null || this.selectedPile === toCol) return false;

    const card = this.piles[this.selectedPile][this.selectedIndex];
    const targetPile = this.piles[toCol];

    if (targetPile.length === 0 || 
        (targetPile[targetPile.length - 1].faceUp &&
         targetPile[targetPile.length - 1].numericValue === card.numericValue + 1)) {
      const cardsToMove = this.piles[this.selectedPile].splice(this.selectedIndex);
      this.piles[toCol].push(...cardsToMove);

      const fromPile = this.piles[this.selectedPile];
      if (fromPile.length > 0 && !fromPile[fromPile.length - 1].faceUp) {
        fromPile[fromPile.length - 1].faceUp = true;
      }

      this.selectedPile = null;
      this.selectedIndex = null;
      this.score -= 5;
      this.moves++;
      this.checkCompleted();
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  checkCompleted() {
    for (let col = 0; col < NUM_PILES; col++) {
      const pile = this.piles[col];
      if (pile.length < CARDS_PER_SUIT) continue;

      const top13 = pile.slice(-CARDS_PER_SUIT);
      const isSequence = top13.every((c, i) => c.numericValue === CARDS_PER_SUIT - i);

      if (isSequence) {
        this.piles[col] = pile.slice(0, -CARDS_PER_SUIT);
        if (this.piles[col].length > 0 && !this.piles[col][this.piles[col].length - 1].faceUp) {
          this.piles[col][this.piles[col].length - 1].faceUp = true;
        }
        this.foundations[0]++;
        this.score += 100;

        if (this.foundations.every(f => f === 8)) {
          this.gameOver = true;
        }
      }
    }
  }

  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({
        piles: this.piles,
        stock: this.stock,
        foundations: this.foundations,
        score: this.score,
        moves: this.moves,
        gameOver: this.gameOver,
        selectedPile: this.selectedPile,
        selectedIndex: this.selectedIndex
      });
    }
  }
}