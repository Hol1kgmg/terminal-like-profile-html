/* ========================================================
   [6] ターミナルエンジン（通常は編集不要）
   依存: profile.js (PROFILE, BOOT_SEQUENCE, TYPING_SPEED, BETWEEN_DELAY)
         commands.js (COMMANDS)
         game.js     (initTerminalGame)
======================================================== */

// ── DOM参照 ──
var scr        = document.getElementById("tp-screen");
var scrollArea = document.getElementById("tp-scroll-area");
var inp        = document.getElementById("tp-input");
var inputRow   = document.getElementById("tp-input-row");
var typingRow  = document.getElementById("tp-typing-row");
var typingPrompt = document.getElementById("tp-typing-prompt");
var typingText   = document.getElementById("tp-typing-text");
var page        = document.querySelector(".tp-page");
var exitOverlay = document.getElementById("tp-exit-overlay");
var HOST = PROFILE.nameEn + "@profile ~ % ";
document.getElementById("tp-prompt-label").textContent = HOST;

// ── 出力API ──
var Output = {
  _buf: null, // null = 直接描画、配列 = バッファリング中

  startBuffer: function () {
    this._buf = [];
  },

  flushBuffer: function () {
    var buf = this._buf;
    this._buf = null;
    return buf;
  },

  line: function (text, cls) {
    var el = document.createElement("span");
    if (cls) el.className = cls;
    el.textContent = text + "\n";
    if (this._buf) this._buf.push(el);
    else scr.appendChild(el);
  },

  raw: function (text, cls) {
    var el = document.createElement("span");
    if (cls) el.className = cls;
    el.textContent = text;
    if (this._buf) this._buf.push(el);
    else scr.appendChild(el);
  },

  br: function () {
    var node = document.createTextNode("\n");
    if (this._buf) this._buf.push(node);
    else scr.appendChild(node);
  },
};

// COMMANDS から直接呼べるよう短縮名をグローバルに定義
var line = Output.line.bind(Output);
var raw  = Output.raw.bind(Output);
var br   = Output.br.bind(Output);

// ── テキストユーティリティ ──
function strWidth(s) {
  var w = 0;
  for (var i = 0; i < s.length; i++) {
    w += s.charCodeAt(i) > 0xff ? 2 : 1;
  }
  return w;
}

// ── コマンドUIヘルパー ──
function renderBox(title) {
  var inner = 42;
  var titleLen = strWidth(title);
  var totalPad = inner - titleLen;
  var padLeft  = Math.floor(totalPad / 2);
  var padRight = totalPad - padLeft;
  line("  ╔" + "═".repeat(inner) + "╗", "tp-k");
  raw("  ║" + " ".repeat(padLeft) + title + " ".repeat(padRight) + "║", "tp-k");
  br();
  line("  ╚" + "═".repeat(inner) + "╝", "tp-k");
}

var STATUS_COLOR = {
  MAX:      "tp-s", // 緑
  ACTIVE:   "tp-h", // 青
  LEARNING: "tp-n", // 橙
  MOURNING: "tp-w", // 赤
  HUNTING:  "tp-h", // 青
};
function statusColor(s) {
  return STATUS_COLOR[s] || "tp-d";
}

function renderStatusScreen(title, items, footer) {
  br();
  renderBox(title);
  br();
  items.forEach(function (item) {
    raw("  ", "tp-d");
    if (item.icon) raw(item.icon + " ", "tp-h");
    raw(item.name, "tp-hl");
    raw("  ", "tp-d");
    raw("[" + item.status + "]", statusColor(item.status));
    br();
    var filled = Math.round(item.lv / 5);
    var empty  = 20 - filled;
    raw("    LV." + ("  " + item.lv).slice(-3) + "  ", "tp-n");
    raw("▓".repeat(filled), "tp-s");
    line("░".repeat(empty), "tp-d");
    if (item.comment) line("    > " + item.comment, "tp-d");
    br();
  });
  line("  " + "─".repeat(44), "tp-d");
  line("  * " + footer, "tp-d");
  br();
}

// ── コマンド実行 ──
var LINE_DELAY     = 25;  // 1行あたりの表示間隔 (ms)
var FADE_MS        = 500;
var FADE_TRANSITION = "opacity " + FADE_MS + "ms ease";
var NO_ANIM_CMDS   = { clear: true, game: true, exit: true };

function echoCmd(cmd) {
  raw(HOST, "tp-p");
  line(cmd, "tp-cm");
}

// ── 入力受付制御 ──
var inputLocked = true;
function lockInput() {
  inputLocked = true;
  inputRow.style.display = "none";
}
function unlockInput() {
  inputLocked = false;
  inputRow.style.display = "flex";
  scrollArea.scrollTop = scrollArea.scrollHeight;
  inp.focus();
}

// バッファされたノードを「視覚的な1行」単位でグループ化する
function groupByLines(nodes) {
  var groups  = [];
  var current = [];
  nodes.forEach(function (node) {
    current.push(node);
    var text = node.textContent || "";
    if (text.slice(-1) === "\n") {
      groups.push(current);
      current = [];
    }
  });
  if (current.length) groups.push(current);
  return groups;
}

function runCommand(cmd, onDone) {
  var key = cmd.toLowerCase();
  var fn  = COMMANDS[key];

  if (!fn) {
    br();
    line("bash: command not found: " + cmd, "tp-err");
    line("type 'help' to see available commands", "tp-d");
    br();
    if (onDone) onDone();
    return;
  }

  // アニメーション不要なコマンドは即時実行
  if (NO_ANIM_CMDS[key]) {
    fn();
    if (onDone) onDone();
    return;
  }

  // バッファリングモードで出力を収集
  Output.startBuffer();
  fn();
  var groups = groupByLines(Output.flushBuffer());

  // 1行ずつ表示
  var idx = 0;
  function revealNext() {
    if (idx >= groups.length) {
      if (onDone) onDone();
      return;
    }
    groups[idx].forEach(function (node) {
      scr.appendChild(node);
    });
    scrollArea.scrollTop = scrollArea.scrollHeight;
    idx++;
    setTimeout(revealNext, LINE_DELAY);
  }
  revealNext();
}

// ── 自動タイピングアニメーション ──
function autoType(cmd, done) {
  inputRow.style.display = "none";
  typingRow.style.display = "flex";
  typingPrompt.textContent = HOST;
  typingText.textContent   = "";
  scrollArea.scrollTop = scrollArea.scrollHeight;
  var i = 0;
  function tick() {
    if (i < cmd.length) {
      typingText.textContent += cmd[i++];
      scrollArea.scrollTop = scrollArea.scrollHeight;
      setTimeout(tick, TYPING_SPEED);
    } else {
      setTimeout(function () {
        typingRow.style.display = "none";
        echoCmd(cmd);
        runCommand(cmd, function () {
          scrollArea.scrollTop = scrollArea.scrollHeight;
          done();
        });
      }, 300);
    }
  }
  tick();
}

// ── ブートシーケンス ──
function runBoot(seq, idx) {
  if (idx >= seq.length) {
    typingRow.style.display = "none";
    unlockInput();
    return;
  }
  setTimeout(
    function () {
      autoType(seq[idx], function () {
        inputRow.style.display = "flex";
        scrollArea.scrollTop = scrollArea.scrollHeight;
        runBoot(seq, idx + 1);
      });
    },
    idx === 0 ? 600 : BETWEEN_DELAY
  );
}

// ── インタラクティブ入力 ──
inp.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  var cmd = inp.textContent.trim();
  inp.textContent = "";
  echoCmd(cmd);
  if (cmd === "") return;
  lockInput();
  runCommand(cmd, function () {
    unlockInput();
  });
});

// キー入力開始でフォーカス
document.addEventListener("keydown", function (e) {
  if (document.getElementById("tp-game-overlay").classList.contains("active")) return;
  if (inputLocked) return;
  if (e.target === inp) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.length !== 1) return;
  var active = document.activeElement;
  var tags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"];
  if (active && tags.indexOf(active.tagName) !== -1 && active !== inp) return;
  inp.focus();
});

// ── exit / restart ──
function exitTerminal() {
  page.style.transition = FADE_TRANSITION;
  page.style.opacity = "0";
  setTimeout(function () {
    page.style.display = "none";
    exitOverlay.classList.add("active");
  }, FADE_MS);
}

function restartTerminal() {
  exitOverlay.classList.remove("active");
  page.style.transition = "none";
  page.style.opacity = "0";
  page.style.display = "flex";
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      page.style.transition = FADE_TRANSITION;
      page.style.opacity = "1";
    });
  });
  startSession();
}

document.getElementById("tp-terminal-icon").addEventListener("click", restartTerminal);

// game: 全画面解除ボタン
document.getElementById("tp-game-exit").addEventListener("click", function () {
  document.getElementById("tp-game-overlay").classList.remove("active");
  inp.focus();
});

// game: 全画面解除 ESC
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    document.getElementById("tp-game-overlay").classList.remove("active");
    inp.focus();
  }
});

// ── ユーティリティ ──
function lastLogin() {
  var parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday:  "short",
    month:    "short",
    day:      "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    second:   "2-digit",
    hour12:   false,
    year:     "numeric",
  }).formatToParts(new Date());
  var get = function (t) {
    return parts.find(function (p) { return p.type === t; }).value;
  };
  return (
    "Last login: " +
    get("weekday") + " " +
    get("month")   + " " +
    get("day")     + " " +
    get("hour")    + ":" +
    get("minute")  + ":" +
    get("second")  + " " +
    get("year")    + " on ttys000"
  );
}

// ── 起動 ──
function startSession() {
  scr.innerHTML = "";
  lockInput();
  line(lastLogin(), "tp-d");
  br();
  runBoot(BOOT_SEQUENCE, 0);
}
startSession();
