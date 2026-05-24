const W = 800;
const H = 500;
const GRAVITY = 0.4;
const GROUND_Y = 420;

export class Bullet {
  constructor(x, y, vx, vy, dir) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.active = true;
    this.width = 6; this.height = 3; this.dir = dir;
  }
  update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.active = false; }
}

class Enemy {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.width = 30; this.height = 36; this.alive = true;
    this.type = type || 'grunt';
    this.vx = type === 'runner' ? 1.5 : 0;
    this.health = type === 'tank' ? 3 : 1;
    this.frame = 0;
  }
  update() { this.x += this.vx; this.frame++; }
}

export class ContraGame {
  constructor() {
    this.playerX = 100;
    this.playerY = GROUND_Y - 40;
    this.playerWidth = 30;
    this.playerHeight = 40;
    this.velX = 0;
    this.velY = 0;
    this.grounded = true;
    this.facingRight = true;
    this.hp = 3;
    this.score = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.bgX = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.playing = false;
    this.shootCooldown = 0;
    this.level = 1;
    this.keys = {};
    this.onStateChange = null;
    this._animFrame = null;
  }

  start() {
    this.playerX = 100;
    this.playerY = GROUND_Y - 40;
    this.velX = 0; this.velY = 0;
    this.grounded = true;
    this.hp = 3; this.score = 0;
    this.bullets = []; this.enemies = [];
    this.particles = []; this.bgX = 0;
    this.gameOver = false; this.gameWon = false;
    this.playing = true;
    this.shootCooldown = 0;
    this.spawnEnemies();
  }

  spawnEnemies() {
    this.enemies = [];
    for (let col = 0; col < 6; col++) {
      const ex = 600 + col * 120 + Math.random() * 50;
      const ey = GROUND_Y - 36;
      const type = col % 3 === 2 ? 'tank' : (col % 3 === 1 ? 'runner' : 'grunt');
      this.enemies.push(new Enemy(ex, ey, type));
    }
  }

  setKey(key, pressed) {
    this.keys[key] = pressed;
  }

  shoot() {
    if (this.shootCooldown > 0 || !this.playing || this.gameOver) return;
    const dir = this.facingRight ? 1 : -1;
    this.bullets.push(new Bullet(
      this.playerX + (dir > 0 ? this.playerWidth : 0),
      this.playerY + this.playerHeight / 2,
      dir * 7, 0, dir
    ));
    this.shootCooldown = 15;
  }

  update() {
    if (!this.playing || this.gameOver || this.gameWon) return;

    if (this.shootCooldown > 0) this.shootCooldown--;

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) { this.velX = -3; this.facingRight = false; }
    else if (this.keys['ArrowRight'] || this.keys['KeyD']) { this.velX = 3; this.facingRight = true; }
    else this.velX = 0;

    if ((this.keys['ArrowUp'] || this.keys['KeyW']) && this.grounded) {
      this.velY = -10; this.grounded = false;
    }
    if (this.keys['Space'] || this.keys['KeyJ']) this.shoot();

    this.velY += GRAVITY;
    this.playerX += this.velX;
    this.playerY += this.velY;

    if (this.playerX < 0) this.playerX = 0;
    if (this.playerX > W - this.playerWidth) this.playerX = W - this.playerWidth;
    if (this.playerY >= GROUND_Y - this.playerHeight) {
      this.playerY = GROUND_Y - this.playerHeight;
      this.velY = 0; this.grounded = true;
    }

    this.bullets.forEach(b => b.update());
    this.bullets = this.bullets.filter(b => b.active);

    this.enemies.forEach(e => e.update());

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const b = this.bullets[i];
        const e = this.enemies[j];
        if (b.x < e.x + e.width && b.x + b.width > e.x &&
            b.y < e.y + e.height && b.y + b.height > e.y) {
          b.active = false;
          e.health--;
          if (e.health <= 0) {
            e.alive = false;
            this.score += e.type === 'tank' ? 300 : 100;
            for (let k = 0; k < 8; k++) {
              this.particles.push({ x: e.x + e.width / 2, y: e.y + e.height / 2, vx: (Math.random() - 0.5) * 5, vy: Math.random() * -6 - 2, life: 20, color: '#ff8800' });
            }
          }
        }
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);
    this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    this.particles = this.particles.filter(p => p.life > 0);

    if (this.enemies.length === 0 && this.playing) {
      this.gameWon = true;
      this.playing = false;
    }

    this.notifyStateChange();
  }

  notifyStateChange() {
    if (this.onStateChange) this.onStateChange(this);
  }
}