/* ========================================================
   [5] コマンド定義  ★ここを編集
   コマンドを追加・変更する場合はこのブロックを編集する。
   書き方：
     コマンド名: function() {
       // print系関数を使って出力を組み立てる
       // line(テキスト, 色クラス) … 1行出力（改行付き）
       // raw(テキスト, 色クラス)  … 改行なしで出力
       // br()                     … 空行
     },
======================================================== */

var COMMANDS = {
  help: function () {
    br();
    line("利用可能なコマンド:", "tp-k");
    line("  whoami      プロフィール概要", "tp-d");
    line("  career      参画プロジェクト一覧", "tp-d");
    line("  skills      スキル一覧", "tp-d");
    line("  history     経歴", "tp-d");
    line("  contact     連絡先", "tp-d");
    line("  tags        タグ一覧", "tp-d");
    line("  quote       座右の銘", "tp-d");
    line("  hobby       趣味・プライベート", "tp-d");
    line("  tomb        見送ったゲーム・サービス一覧", "tp-d");
    line("  game        ゲームを起動する", "tp-d");
    line("  clear       画面クリア", "tp-d");
    br();
  },

  whoami: function () {
    var P = PROFILE;
    br();
    var inner = 42;
    line("  ╔══════════════════════════════════════════╗", "tp-k");
    var l1 = "  " + P.name + "  ·  " + P.nameEn;
    raw("  ║", "tp-k");
    raw("  ", "tp-k");
    raw(P.name, "tp-hl");
    raw("  ·  ", "tp-d");
    raw(P.nameEn, "tp-d");
    raw(" ".repeat(Math.max(0, inner - strWidth(l1))), "tp-k");
    line("║", "tp-k");
    var l2 = "  " + P.role;
    raw("  ║", "tp-k");
    raw("  ", "tp-k");
    raw(P.role, "tp-s");
    raw(" ".repeat(Math.max(0, inner - strWidth(l2))), "tp-k");
    line("║", "tp-k");
    line("  ╚══════════════════════════════════════════╝", "tp-k");
    br();
    raw("  ├─  ", "tp-d");
    raw("dept      ", "tp-k");
    line(P.dept);
    raw("  ├─  ", "tp-d");
    raw("joined    ", "tp-k");
    line(P.joined, "tp-s");
    raw("  ├─  ", "tp-d");
    raw("location  ", "tp-k");
    line(P.location);
    raw("  ├─  ", "tp-d");
    raw("worktime  ", "tp-k");
    line(P.worktime);
    raw("  └─  ", "tp-d");
    raw("coffee    ", "tp-k");
    raw("☕".repeat(P.coffee) + "  ", "tp-n");
    line("# WARNING: 過剰摂取", "tp-w");
    br();
  },

  // --------------------------------------------------
  // career : 参画プロジェクト一覧（タイムライン風）
  // --------------------------------------------------
  career: function () {
    var projects = PROFILE.career;
    br();
    line("  ◆  PROJECT TIMELINE", "tp-k");
    br();
    projects.forEach(function (p, i) {
      var isCurrent = p.period.indexOf("現在") !== -1;
      var isLast = i === projects.length - 1;
      raw("  ", "tp-d");
      raw(isCurrent ? "◉" : "◎", isCurrent ? "tp-s" : "tp-h");
      raw("  ", "tp-d");
      raw(p.period, "tp-n");
      if (isCurrent) {
        raw("  ← 現在参画中 🚩", "tp-w");
      }
      br();
      raw("  │", "tp-d");
      line("  " + p.name, "tp-hl");
      raw("  │", "tp-d");
      raw("     ROLE   ", "tp-k");
      line(p.role);
      raw("  │", "tp-d");
      raw("     STACK  ", "tp-k");
      line(p.stack, "tp-h");
      raw("  │", "tp-d");
      raw("     NOTE   ", "tp-k");
      line(p.desc, "tp-d");
      if (!isLast) {
        line("  │", "tp-d");
        line("  │", "tp-d");
      }
    });
    br();
  },

  // --------------------------------------------------
  // skills : RPG ステータス画面風
  // --------------------------------------------------
  skills: function () {
    renderStatusScreen(
      "SKILL  STATUS  SCREEN",
      PROFILE.skills.map(function (s) {
        return { name: s.name, lv: s.lv, status: s.status };
      }),
      "自作キーボードは職業スキルではありません"
    );
  },

  // --------------------------------------------------
  // history : タイムライン風（縦線でつなぐ）
  // --------------------------------------------------
  history: function () {
    var records = PROFILE.history;
    br();
    line("  ◆  TIMELINE", "tp-k");
    br();
    records.forEach(function (r, i) {
      var isLast = i === records.length - 1;
      raw("  ", "tp-d");
      raw(r.year, "tp-n");
      raw("  ", "tp-d");
      raw(r.current ? "◉" : "◎", r.current ? "tp-s" : "tp-h");
      raw("  ", "tp-d");
      raw(r.event, r.current ? "tp-hl" : "tp-s");
      if (r.current) {
        raw("  ← 今ここ 🚩", "tp-w");
      }
      br();
      if (!isLast) {
        line("        │", "tp-d");
        line("        │", "tp-d");
      }
    });
    br();
  },

  contact: function () {
    var P = PROFILE;
    br();
    renderBox("CONTACT");
    br();
    raw("  ├─  ", "tp-d");
    raw("X          ", "tp-k");
    line(P.x, "tp-s");
    raw("  └─  ", "tp-d");
    raw("GitHub     ", "tp-k");
    line("github.com/" + P.github, "tp-s");
    br();
  },

  tags: function () {
    br();
    line(
      "  " +
        PROFILE.tags
          .map(function (t) {
            return "#" + t + " ";
          })
          .join("  "),
      "tp-h"
    );
    br();
  },

  quote: function () {
    br();
    line('  "' + PROFILE.quote + '"', "tp-hl");
    br();
  },

  // --------------------------------------------------
  // hobby : RPG ステータス画面風
  // --------------------------------------------------
  hobby: function () {
    renderStatusScreen(
      "PLAYER  STATUS  SCREEN",
      PROFILE.hobby,
      "ステータス異常は仕様です"
    );
  },

  // --------------------------------------------------
  // tomb : 死亡診断書風
  // --------------------------------------------------
  tomb: function () {
    var graves = PROFILE.tomb;
    var cause = "運営終了による自然死";
    br();
    line("  †  DIGITAL GRAVEYARD  ―  死亡診断書  †", "tp-w");
    br();
    graves.forEach(function (g, i) {
      line("  ┌─────────────────────────────────────────", "tp-d");
      raw("  │  ", "tp-d");
      raw("No." + ("  " + (i + 1)).slice(-2), "tp-d");
      br();
      raw("  │  ", "tp-d");
      raw("【 ", "tp-d");
      raw(g.name, "tp-hl");
      line(" 】", "tp-d");
      raw("  │  ", "tp-d");
      raw("ジャンル  ", "tp-k");
      line(g.genre, "tp-h");
      raw("  │  ", "tp-d");
      raw("没年月日  ", "tp-k");
      line(g.died, "tp-n");
      raw("  │  ", "tp-d");
      raw("享年      ", "tp-k");
      line(g.age, "tp-s");
      raw("  │  ", "tp-d");
      raw("死因      ", "tp-k");
      line(cause, "tp-d");
      if (g.memo) {
        raw("  │  ", "tp-d");
        raw("備考      ", "tp-k");
        line(g.memo, "tp-d");
      }
      line("  └─────────────────────────────────────────", "tp-d");
      br();
    });
    line("  total: " + graves.length + " titles  †  安らかに眠れ", "tp-w");
    br();
  },

  // --------------------------------------------------
  // game: 弾幕ゲーム
  // --------------------------------------------------
  game: function () {
    br();
    line("  Launching game...", "tp-s");
    br();
    setTimeout(function () {
      var overlay = document.getElementById("tp-game-overlay");
      overlay.classList.add("active");
      initTerminalGame(overlay);
    }, 400);
  },

  // --------------------------------------------------
  // clear: ログ削除
  // --------------------------------------------------
  clear: function () {
    document.getElementById("tp-screen").innerHTML = "";
    line(lastLogin(), "tp-d");
    br();
  },
};
