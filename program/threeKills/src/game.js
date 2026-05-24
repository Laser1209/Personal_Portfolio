const GRAVITY = 0.4;
const JUMP_POWER = 12;
export const BOARD_W = 400;
export const BOARD_H = 500;
export const PLAYER_SIZE = 36;

const safeStorage = {
  getItem(key) { try { return (typeof localStorage !== 'undefined' && localStorage.getItem(key)) || '0'; } catch (e) { return '0'; } },
  setItem(key, val) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); } catch (e) { /* ignore */ } }
};

export class JumpGame {
  constructor() {
    this.platforms = [];
    this.playerX = 100;
    this.playerY = 380;
    this.velX = 0;
    this.velY = 0;
    this.charge = 0;
    this.charging = false;
    this.jumping = false;
    this.score = 0;
    this.highScore = parseInt(safeStorage.getItem('jumpHighScore'), 10);
    this.playing = false;
    this.gameOver = false;
    this.onStateChange = null;
    this._animFrame = null;
    this.initPlatforms();
  }

  initPlatforms() {
    this.platforms = [{ x: 50, y: 420, w: 80, h: 20, center: true }];
    let lastX = 150, lastY = 420;
    for (let i = 0; i < 10; i++) {
      const w = 40 + Math.random() * 50;
      const gap = 60 + Math.random() * 80;
      const yOff = -30 + Math.random() * 60;
      const nx = lastX + gap;
      const ny = Math.max(150, Math.min(450, lastY + yOff));
      this.platforms.push({ x: nx, y: ny, w, h: 20, center: Math.random() < 0.3 });
      lastX = nx + w;
      lastY = ny;
    }
  }

  startCharge() {
    if (!this.playing || this.jumping || this.gameOver) return;
    this.charging = true;
    this.charge = 0;
  }

  updateCharge() {
    if (this.charging) {
      this.charge = Math.min(this.charge + 2, 100);
    }
    return this.charge;
  }

  releaseCharge() {
    if (!this.charging) return;
    this.charging = false;
    const power = this.charge / 100;
    const angle = -Math.PI / 4;
    this.velY = JUMP_POWER * power * Math.sin(angle);
    this.velX = -JUMP_POWER * power * Math.cos(angle) * 0.5;
    this.jumping = true;
    this.charge = 0;
  }

  update() {
    if (!this.jumping || this.gameOver || !this.playing) return;

    this.velY -= GRAVITY;
    this.playerY += this.velY;
    this.playerX += this.velX;

    if (this.playerX < -PLAYER_SIZE) {
      this.playerX = BOARD_W;
      this.platforms.shift();
      this.generateMore();
    }

    if (this.playerY < -PLAYER_SIZE || this.playerY > BOARD_H + PLAYER_SIZE) {
      this.endGame();
      return;
    }

    this.checkLanding();
  }

  checkLanding() {
    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      if (this.playerX + PLAYER_SIZE > p.x && this.playerX < p.x + p.w &&
          this.playerY <= p.y + p.h && this.playerY + PLAYER_SIZE >= p.y && this.velY < 0) {
        this.playerY = p.y + p.h;
        this.velX = 0; this.velY = 0; this.jumping = false;

        if (i > 0) {
          this.score += p.center ? 2 : 1;
        }
        return;
      }
    }
  }

  generateMore() {
    const last = this.platforms[this.platforms.length - 1];
    for (let i = 0; i < 3; i++) {
      const w = 40 + Math.random() * 50;
      const nx = last.x + last.w + 60 + Math.random() * 80;
      const ny = Math.max(150, Math.min(450, last.y - 30 + Math.random() * 60));
      this.platforms.push({ x: nx, y: ny, w, h: 20, center: Math.random() < 0.3 });
    }
  }

  start() {
    this.playing = true;
    this.gameOver = false;
    this.score = 0;
    this.playerX = 100;
    this.playerY = 380;
    this.velX = 0; this.velY = 0;
    this.jumping = false;
    this.platforms = [];
    this.initPlatforms();
  }

  endGame() {
    this.gameOver = true;
    this.playing = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      safeStorage.setItem('jumpHighScore', String(this.highScore));
    }
    this.notifyStateChange();
  }

  getState() {
    return {
      playerX: this.playerX, playerY: this.playerY,
      platforms: this.platforms, charge: this.charge,
      jumping: this.jumping, score: this.score,
      highScore: this.highScore, playing: this.playing,
      gameOver: this.gameOver
    };
  }

  notifyStateChange() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }
}