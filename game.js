/* ========================================================
   ゲームコード
   initTerminalGame(overlay) を呼び出すことで起動する
======================================================== */
function initTerminalGame(overlay) {
  if (overlay.dataset.gameInit === "1") return;
  overlay.dataset.gameInit = "1";

  const W = 400,
    H = 500;

  const PLAYER = {
    SPEED: 3.5,
    SHOT_INTERVAL: 10,
    BULLET_SPEED: 7,
    BULLET_W: 4,
    BULLET_H: 10,
  };
  const ENEMY = {
    COLS: 7,
    BASE_ROWS: 2,
    MAX_EXTRA_ROWS: 3,
    H_SPACING: 50,
    V_SPACING: 42,
    START_X: 40,
    START_Y: 30,
    BASE_DX: 0.9,
    DX_PER_WAVE: 0.2,
    DROP_Y: 12,
    BASE_SHOOT_CD_MIN: 20,
    BASE_SHOOT_CD_MAX: 140,
    SHOOT_CD_REDUCTION: 5,
    BASE_BULLET_SPEED: 2.2,
    BULLET_SPEED_PER_WAVE: 0.25,
    SPREAD_ANGLE: 0.3,
    SPREAD_FROM_WAVE: 3,
  };
  const PARTICLE = { COUNT: 10, SPEED_MIN: 1, SPEED_MAX: 4, LIFE: 30 };
  const STARS = Array.from({ length: 60 }, (_, i) => ({
    ox: i * 137,
    oy: i * 97,
    speedX: i % 3 === 0 ? 0.5 : 0.2,
    size: i % 4 === 0 ? 2 : 1,
  }));

  // キャンバス生成
  var cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  cv.setAttribute("tabindex", "0");
  cv.style.cssText =
    "background:#0f1117;border:1px solid #23262f;outline:none;display:block;";
  cv.style.margin = "auto";

  // 操作説明
  var guide = document.createElement("div");
  guide.style.cssText =
    "color:#4ec9b0;font-family:'JetBrains Mono',monospace;font-size:12px;margin-top:10px;text-align:center;";
  guide.textContent =
    "← → ↑ ↓ で移動  |  弾は自動発射  |  Space / Enter でスタート";

  var exitBtn = document.getElementById("tp-game-exit");
  overlay.insertBefore(cv, exitBtn);
  overlay.insertBefore(guide, exitBtn);

  var ctx = cv.getContext("2d");

  // 入力
  var keys = {};
  cv.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (
      (e.key === " " || e.key === "Enter") &&
      (game.state === "title" || game.state === "gameover")
    )
      game.start();
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(
        e.key
      ) !== -1
    )
      e.preventDefault();
  });
  cv.addEventListener("keyup", function (e) {
    keys[e.key] = false;
  });
  cv.addEventListener("blur", function () {
    keys = {};
  });
  overlay.addEventListener("click", function () {
    cv.focus();
  });

  // ユーティリティ
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function rectOf(o) {
    return {
      l: o.x - o.w / 2,
      r: o.x + o.w / 2,
      t: o.y - o.h / 2,
      b: o.y + o.h / 2,
    };
  }
  function rectsOverlap(a, b) {
    var ra = rectOf(a),
      rb = rectOf(b);
    return ra.l < rb.r && ra.r > rb.l && ra.t < rb.b && ra.b > rb.t;
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // パーティクル
  var particles = [];
  function spawnParticles(x, y, color) {
    for (var i = 0; i < PARTICLE.COUNT; i++) {
      var a = rand(0, Math.PI * 2),
        spd = rand(PARTICLE.SPEED_MIN, PARTICLE.SPEED_MAX);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: PARTICLE.LIFE,
        color: color,
      });
    }
  }

  // プレイヤー
  var player = {
    x: W / 2,
    y: H - 60,
    w: 28,
    h: 28,
    bullets: [],
    shotCd: 0,
    reset: function () {
      this.x = W / 2;
      this.y = H - 60;
      this.bullets = [];
      this.shotCd = 0;
    },
    update: function () {
      if (keys["ArrowLeft"])
        this.x = clamp(this.x - PLAYER.SPEED, this.w / 2, W - this.w / 2);
      if (keys["ArrowRight"])
        this.x = clamp(this.x + PLAYER.SPEED, this.w / 2, W - this.w / 2);
      if (keys["ArrowUp"])
        this.y = clamp(this.y - PLAYER.SPEED, this.h / 2, H - this.h / 2);
      if (keys["ArrowDown"])
        this.y = clamp(this.y + PLAYER.SPEED, this.h / 2, H - this.h / 2);
      this.shotCd--;
      if (this.shotCd <= 0) {
        this.bullets.push({
          x: this.x,
          y: this.y - 14,
          w: PLAYER.BULLET_W,
          h: PLAYER.BULLET_H,
        });
        this.shotCd = PLAYER.SHOT_INTERVAL;
      }
      this.bullets = this.bullets.filter(function (b) {
        b.y -= PLAYER.BULLET_SPEED;
        return b.y > -10;
      });
    },
  };

  // 敵
  var enemies = [];
  function spawnEnemies(wave) {
    var rows = ENEMY.BASE_ROWS + Math.min(wave, ENEMY.MAX_EXTRA_ROWS);
    enemies = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < ENEMY.COLS; c++) {
        enemies.push({
          x: ENEMY.START_X + c * ENEMY.H_SPACING,
          y: ENEMY.START_Y + r * ENEMY.V_SPACING,
          w: 22,
          h: 22,
          dx: ENEMY.BASE_DX + wave * ENEMY.DX_PER_WAVE,
          hp: 1 + Math.floor(wave / 3),
          shootCd: Math.floor(rand(0, 120)),
          color: "hsl(" + (r * 40 + wave * 20) + ",100%,60%)",
        });
      }
    }
  }

  function updateEnemies(wave, enemyBullets) {
    enemies.forEach(function (e) {
      e.x += e.dx;
    });
    if (
      enemies.some(function (e) {
        return e.x > W - 15 || e.x < 15;
      })
    ) {
      enemies.forEach(function (e) {
        e.dx *= -1;
        e.y += ENEMY.DROP_Y;
      });
    }
    var bSpd = ENEMY.BASE_BULLET_SPEED + wave * ENEMY.BULLET_SPEED_PER_WAVE;
    enemies.forEach(function (e) {
      e.shootCd--;
      if (e.shootCd > 0) return;
      e.shootCd = Math.max(
        ENEMY.BASE_SHOOT_CD_MIN,
        Math.floor(
          rand(60, 60 + ENEMY.BASE_SHOOT_CD_MAX - ENEMY.BASE_SHOOT_CD_MIN)
        ) -
          wave * ENEMY.SHOOT_CD_REDUCTION
      );
      var dx = player.x - e.x,
        dy = player.y - e.y,
        dist = Math.sqrt(dx * dx + dy * dy) || 1;
      enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: (dx / dist) * bSpd,
        vy: (dy / dist) * bSpd,
        w: 6,
        h: 6,
      });
      if (wave >= ENEMY.SPREAD_FROM_WAVE) {
        var base = Math.atan2(dy, dx);
        [-ENEMY.SPREAD_ANGLE, ENEMY.SPREAD_ANGLE].forEach(function (off) {
          var a = base + off;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * bSpd,
            vy: Math.sin(a) * bSpd,
            w: 5,
            h: 5,
          });
        });
      }
    });
  }

  // 衝突判定
  function resolvePlayerVsEnemies(wave) {
    var score = 0;
    player.bullets = player.bullets.filter(function (pb) {
      var hit = false;
      enemies = enemies.filter(function (e) {
        if (hit || !rectsOverlap(pb, e)) return true;
        hit = true;
        e.hp--;
        if (e.hp <= 0) {
          spawnParticles(e.x, e.y, e.color);
          score += 10 * wave;
          return false;
        }
        return true;
      });
      return !hit;
    });
    return score;
  }

  function resolveEnemyVsPlayer(enemyBullets) {
    var hit = false;
    var remaining = enemyBullets.filter(function (eb) {
      if (rectsOverlap(eb, player)) {
        spawnParticles(player.x, player.y, "#4ec9b0");
        hit = true;
        return false;
      }
      return true;
    });
    return { remaining: remaining, hit: hit };
  }

  // ゲーム状態
  var game = {
    state: "title",
    score: 0,
    lives: 3,
    wave: 1,
    frameCount: 0,
    enemyBullets: [],
    start: function () {
      keys = {};
      this.score = 0;
      this.lives = 3;
      this.wave = 1;
      this.frameCount = 0;
      this.enemyBullets = [];
      particles = [];
      player.reset();
      spawnEnemies(this.wave);
      this.state = "play";
      cv.focus();
    },
    update: function () {
      if (this.state !== "play") return;
      this.frameCount++;
      player.update();
      updateEnemies(this.wave, this.enemyBullets);
      this.enemyBullets = this.enemyBullets.filter(function (b) {
        b.x += b.vx;
        b.y += b.vy;
        return b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10;
      });
      this.score += resolvePlayerVsEnemies(this.wave);
      var res = resolveEnemyVsPlayer(this.enemyBullets);
      this.enemyBullets = res.remaining;
      if (res.hit) {
        this.lives--;
        if (this.lives <= 0) {
          this.state = "gameover";
          return;
        }
      }
      if (
        enemies.some(function (e) {
          return e.y > H - 60;
        })
      ) {
        this.lives = 0;
        this.state = "gameover";
        return;
      }
      if (enemies.length === 0) {
        this.wave++;
        spawnEnemies(this.wave);
      }
      particles = particles.filter(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
      });
    },
  };

  // 描画
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 星
    ctx.fillStyle = "#3a3f50";
    STARS.forEach(function (s) {
      ctx.fillRect(
        (s.ox + game.frameCount * s.speedX) % W,
        (s.oy + game.frameCount * 0.4) % H,
        s.size,
        s.size
      );
    });

    if (game.state === "title") {
      ctx.fillStyle = "#4ec9b0";
      ctx.font = "bold 28px 'JetBrains Mono',monospace";
      ctx.textAlign = "center";
      ctx.fillText("> TYPING INVADER", W / 2, 170);
      ctx.fillStyle = "#b8bcc8";
      ctx.font = "13px 'JetBrains Mono',monospace";
      ctx.fillText("← → ↑ ↓  move", W / 2, 230);
      ctx.fillText("auto fire", W / 2, 255);
      ctx.fillStyle = "#c0a060";
      ctx.font = "bold 15px 'JetBrains Mono',monospace";
      ctx.fillText("[ Space / Enter ]  START", W / 2, 310);
      return;
    }

    // パーティクル
    particles.forEach(function (p) {
      ctx.globalAlpha = p.life / PARTICLE.LIFE;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // プレイヤー
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = "#4ec9b0";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 自機弾
    ctx.fillStyle = "#7dbb6e";
    player.bullets.forEach(function (b) {
      ctx.fillRect(b.x - 2, b.y - 5, PLAYER.BULLET_W, PLAYER.BULLET_H);
    });

    // 敵
    enemies.forEach(function (e) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(11, -6);
      ctx.lineTo(0, -2);
      ctx.lineTo(-11, -6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // 敵弾
    game.enemyBullets.forEach(function (eb) {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.w / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#e06c75";
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = "#b8bcc8";
    ctx.font = "13px 'JetBrains Mono',monospace";
    ctx.textAlign = "left";
    ctx.fillText("SCORE: " + game.score, 8, 18);
    ctx.textAlign = "right";
    ctx.fillText("WAVE:  " + game.wave, W - 8, 18);
    ctx.textAlign = "center";
    var hearts = "";
    for (var i = 0; i < game.lives; i++) hearts += "♥ ";
    ctx.fillStyle = "#e06c75";
    ctx.fillText(hearts.trim(), W / 2, 18);

    if (game.state === "gameover") {
      ctx.fillStyle = "rgba(15,17,23,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e06c75";
      ctx.font = "bold 32px 'JetBrains Mono',monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", W / 2, 200);
      ctx.fillStyle = "#b8bcc8";
      ctx.font = "14px 'JetBrains Mono',monospace";
      ctx.fillText("SCORE: " + game.score, W / 2, 240);
      ctx.fillStyle = "#c0a060";
      ctx.font = "bold 15px 'JetBrains Mono',monospace";
      ctx.fillText("[ Space / Enter ]  RETRY", W / 2, 295);
    }
  }

  // メインループ
  (function loop() {
    game.update();
    draw();
    requestAnimationFrame(loop);
  })();

  cv.focus();
}
