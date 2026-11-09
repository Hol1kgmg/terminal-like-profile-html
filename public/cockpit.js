/* ========================================================
   [7] コックピット（通常は編集不要）
   情報パネルを PROFILE から組み立て、HTML in Canvas + WebGL で
   円弧上に並べた 3D 表示にする。使えない環境では同じ DOM を 2D で表示する。
   依存: profile.js (PROFILE), terminal.js (statusColor, scrollArea)
======================================================== */
(function () {
  // ── 情報パネルの中身 ──
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function row(parent, key, value, cls) {
    var r = el("div", "tp-kv");
    r.appendChild(el("span", "tp-k", key));
    var v = el("span", cls || "", value);
    r.appendChild(v);
    parent.appendChild(r);
    return v;
  }
  function info(id) {
    return document.getElementById("tp-info-" + id);
  }

  var P = PROFILE;

  var prof = info("profile");
  prof.appendChild(el("div", "tp-hl tp-info-title", P.name));
  prof.appendChild(el("div", "tp-s", P.role));
  row(prof, "dept", P.dept);
  row(prof, "location", P.location);
  row(prof, "worktime", P.worktime);
  var coffee = row(prof, "coffee", "☕".repeat(P.coffee), "tp-n");
  coffee.parentNode.appendChild(el("span", "tp-w", "# WARNING: 過剰摂取"));

  var sys = info("system");
  var brand =
    navigator.userAgentData &&
    navigator.userAgentData.brands.filter(function (b) { return !/Not/.test(b.brand); }).pop();
  row(sys, "browser", brand ? brand.brand + " " + brand.version : navigator.userAgent.split(" ").pop());
  var screenEl = row(sys, "screen", "", "tp-n");
  var clockEl = row(sys, "local", "", "tp-s");
  var modeEl = row(sys, "render", "", "tp-h");
  function updateScreen() {
    screenEl.textContent = innerWidth + "×" + innerHeight + " @" + devicePixelRatio + "x";
  }
  function tick() {
    clockEl.textContent = new Date().toLocaleTimeString();
  }
  updateScreen();
  tick();
  setInterval(tick, 1000);
  addEventListener("resize", updateScreen);

  // 右上2枚: GitHub の公開リポジトリから REPOS / LANGUAGES を表示する。
  // 取得できるまで（失敗時はそのまま）PROFILE の career / skills を表示する
  var proj = info("projects");
  var skills = info("skills");
  function bar(ratio) {
    var filled = Math.round(ratio * 10);
    return "▓".repeat(filled) + "░".repeat(10 - filled);
  }
  P.career.forEach(function (c) {
    var item = el("div", "tp-info-item");
    item.appendChild(el("div", "tp-hl", c.name));
    item.appendChild(el("div", "tp-d", c.period));
    proj.appendChild(item);
  });
  P.skills.forEach(function (s) {
    var r = el("div", "tp-kv");
    r.appendChild(el("span", "tp-k", s.name));
    r.appendChild(el("span", "tp-s", bar(s.lv / 100)));
    r.appendChild(el("span", statusColor(s.status), s.status));
    skills.appendChild(r);
  });

  function renderGitHub(all) {
    var list = all.filter(function (r) { return !r.fork; });
    var pinned = P.pinned
      .map(function (name) { return all.filter(function (r) { return r.name === name; })[0]; })
      .filter(Boolean);
    if (!list.length || !pinned.length) return;
    document.getElementById("tp-t-projects").textContent = "◈ PINNED · github";
    document.getElementById("tp-t-skills").textContent = "◈ LANGUAGES · github";
    // パネル内でスクロールしないよう、1件2行（名前 / 言語 · 更新日）に絞る
    proj.textContent = "";
    pinned.forEach(function (r) {
      var item = el("div", "tp-info-item");
      var a = el("a", "tp-link", r.name);
      a.href = r.html_url;
      a.target = "_blank";
      a.rel = "noopener";
      item.appendChild(a);
      item.appendChild(el("div", "tp-h", (r.language || "—") + "  ·  " + r.pushed_at.slice(0, 10)));
      proj.appendChild(item);
    });
    // 言語の割合はリポジトリ数で数える（バイト数は repo ごとに API が要るため）
    var counts = {};
    list.forEach(function (r) { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    var total = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0);
    skills.textContent = "";
    Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, 5)
      .forEach(function (k) {
        var r = el("div", "tp-kv");
        r.appendChild(el("span", "tp-k", k));
        r.appendChild(el("span", "tp-s", bar(counts[k] / total)));
        r.appendChild(el("span", "tp-n", Math.round((counts[k] / total) * 100) + "%"));
        skills.appendChild(r);
      });
  }

  // 未認証 API は 60回/時/IP のため、タブを開いている間は sessionStorage に保存する
  var GH_KEY = "tp-gh-repos";
  var cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(GH_KEY)); } catch (e) {}
  if (cached) renderGitHub(cached);
  else
    fetch("https://api.github.com/users/" + encodeURIComponent(P.github) + "/repos?sort=pushed&per_page=100")
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (list) {
        try { sessionStorage.setItem(GH_KEY, JSON.stringify(list.map(function (r) {
          return { name: r.name, html_url: r.html_url, language: r.language, pushed_at: r.pushed_at, description: r.description, fork: r.fork };
        }))); } catch (e) {}
        renderGitHub(list);
      })
      .catch(function () {}); // 取得できなければ PROFILE の内容のまま

  var links = info("links");
  [
    ["X", P.x, "https://x.com/" + P.x.replace(/^@/, "")],
    ["GitHub", "github.com/" + P.github, "https://github.com/" + P.github],
  ].forEach(function (l) {
    var r = el("div", "tp-kv");
    r.appendChild(el("span", "tp-k", l[0]));
    var a = el("a", "tp-link", l[1]);
    a.href = l[2];
    a.target = "_blank";
    a.rel = "noopener";
    r.appendChild(a);
    links.appendChild(r);
  });

  // ── 3D / 2D の切り替え ──
  var block = document.getElementById("tp-cockpit");
  var canvas = document.getElementById("tp-canvas");
  var cols = {
    left: block.querySelector(".tp-col-left"),
    main: block.querySelector(".tp-col-main"),
    right: block.querySelector(".tp-col-right"),
  };
  var panels = [
    ["profile", "left"], ["system", "left"], ["main", "main"],
    ["projects", "right"], ["skills", "right"], ["links", "right"],
  ].map(function (d) {
    return { el: document.getElementById("tp-panel-" + d[0]), col: d[1] };
  });

  canvas.setAttribute("content", "drawable");
  var gl = canvas.content === "drawable" ? canvas.getContext("webgl2", { premultipliedAlpha: true }) : null;
  var supported = !!(gl && gl.texElementSubImage2D && canvas.updateElementGeometry);
  function panelOf(node) {
    return panels.filter(function (p) { return p.el.contains(node); })[0];
  }

  // カーソルが乗ったパネルをアクティブにする（2D / 3D 共通）
  var hoverFocus = false; // ホバーによるフォーカスではカメラを動かさない
  var pressed = false; // テキスト選択中は切り替えない
  block.addEventListener("pointerdown", function () { pressed = true; });
  addEventListener("pointerup", function () { pressed = false; });
  block.addEventListener("pointerover", function (e) {
    if (pressed || e.pointerType === "touch") return;
    var p = panelOf(e.target);
    if (!p || p.el.contains(document.activeElement)) return;
    if (p.col === "main" && inputLocked) return; // ブート中は入力欄が非表示
    hoverFocus = true;
    (p.col === "main" ? inp : p.el).focus({ preventScroll: true });
    hoverFocus = false;
  });

  var wide = matchMedia("(min-width: 1000px) and (min-height: 600px)");
  var still = matchMedia("(prefers-reduced-motion: reduce)");
  var is3D = false;

  function apply() {
    var want = supported && wide.matches && !still.matches;
    modeEl.textContent = want ? "3D (HTML in Canvas)" : supported ? "2D" : "2D (HTML in Canvas 非対応)";
    if (want === is3D) return;
    is3D = want;
    var active = document.activeElement;
    panels.forEach(function (p) {
      if (want) {
        p.el.setAttribute("drawable", "");
        canvas.appendChild(p.el);
      } else {
        p.el.removeAttribute("drawable");
        cols[p.col].appendChild(p.el);
      }
    });
    block.classList.toggle("tp-3d", want);
    if (active && active !== document.body) active.focus({ preventScroll: true });
    scrollArea.scrollTop = scrollArea.scrollHeight;
    if (want) resize();
  }

  if (!supported) {
    apply();
    return;
  }

  // ── WebGL ──
  function program(vs, fs) {
    var pr = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, "#version 300 es\nprecision mediump float;\n" + s[1]);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(pr, sh);
    });
    gl.linkProgram(pr);
    pr.u = function (name) { return gl.getUniformLocation(pr, name); };
    return pr;
  }

  // 背景: 暗いグラデーション + 地平線の発光 + 床グリッド
  var bg = program(
    "in vec2 a; out vec2 v; void main(){ v = a * 2.0 - 1.0; gl_Position = vec4(v, 0.0, 1.0); }",
    "in vec2 v; uniform float aspect; uniform float off; out vec4 o;" +
    "void main(){" +
    "  vec3 c = mix(vec3(0.01,0.03,0.07), vec3(0.03,0.10,0.18), smoothstep(1.0, -0.4, v.y));" +
    "  float hz = -0.45;" +
    "  c += vec3(0.10,0.45,0.75) * exp(-abs(v.y - hz) * 18.0) * 0.6;" +
    "  if (v.y < hz) {" +
    "    float z = 1.0 / (hz - v.y);" +
    "    vec2 g = vec2(v.x * aspect * z + off, z * 2.0);" +
    "    vec2 f = abs(fract(g) - 0.5);" +
    "    float line = smoothstep(0.47, 0.5, max(f.x, f.y));" +
    "    c += vec3(0.15,0.75,0.95) * line * 0.35 / (z * 0.6);" +
    "  }" +
    "  o = vec4(c, 1.0);" +
    "}"
  );

  // パネル: 要素の px 座標の四角形にテクスチャを貼り、外側に発光枠を描く
  var panelProg = program(
    "in vec2 a; uniform mat4 m; uniform vec2 size; uniform float pad; out vec2 px;" +
    "void main(){ px = a * (size + 2.0 * pad) - pad; gl_Position = m * vec4(px, 0.0, 1.0); }",
    "in vec2 px; uniform sampler2D t; uniform vec2 size; uniform float pad; uniform float glow; out vec4 o;" +
    "void main(){" +
    "  vec3 cyan = vec3(0.25, 0.9, 1.0);" +
    "  float d = length(max(max(-px, px - size), 0.0));" +
    "  if (d > 0.0) { float g = exp(-d / (pad * 0.3)) * glow * 0.8; o = vec4(cyan * g, g); return; }" +
    "  o = texture(t, px / size);" +
    "  float e = min(min(px.x, px.y), min(size.x - px.x, size.y - px.y));" +
    "  o = mix(o, vec4(cyan, 1.0), (1.0 - smoothstep(0.0, 1.5, e)) * glow);" +
    "}"
  );

  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  [bg, panelProg].forEach(function (pr) {
    gl.bindAttribLocation(pr, 0, "a");
    gl.linkProgram(pr);
  });
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  panels.forEach(function (p) {
    p.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, p.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  });

  // ── 配置（ワールド座標の単位は CSS px。カメラは +Z 側から -Z を見る） ──
  var R = 1000; // 円弧の半径
  var SIDE = 36; // 左右カラムの角度 (deg)
  var GAP = 24;
  var FOV = (40 * Math.PI) / 180;
  var NEAR = 50, FAR = 5000;
  var home = [0, 0, 0]; // 全体が見える視点。resize で決まる
  var eye = null, look = [0, 0, -R];
  var focused = null; // キーボードでフォーカスした周辺パネル
  var mouse = [0, 0];

  function layout() {
    ["left", "main", "right"].forEach(function (col) {
      var list = panels.filter(function (p) { return p.col === col; });
      list.forEach(function (p) {
        p.w = p.el.offsetWidth;
        p.h = p.el.offsetHeight;
      });
      var y = (list.reduce(function (s, p) { return s + p.h; }, 0) + GAP * (list.length - 1)) / 2;
      var deg = col === "left" ? -SIDE : col === "right" ? SIDE : 0;
      var rad = (deg * Math.PI) / 180;
      list.forEach(function (p) {
        var cy = y - p.h / 2;
        y -= p.h + GAP;
        p.center = [R * Math.sin(rad), cy, -R * Math.cos(rad)];
        p.normal = [-Math.sin(rad), 0, Math.cos(rad)];
        // 要素の px 座標 (左上原点, y 下向き) → パネル中心原点のワールド座標
        p.model = new DOMMatrix()
          .translate(p.center[0], p.center[1], p.center[2])
          .rotate(0, -deg, 0)
          .scale(1, -1)
          .translate(-p.w / 2, -p.h / 2);
      });
    });
  }

  // 全パネルの角が画面に収まるカメラ位置 (z) を求める
  function fitHome(aspect) {
    var tv = Math.tan(FOV / 2) * 0.9, th = tv * aspect;
    var z = 0;
    panels.forEach(function (p) {
      [[0, 0], [p.w, 0], [0, p.h], [p.w, p.h]].forEach(function (c) {
        var q = p.model.transformPoint(new DOMPoint(c[0], c[1]));
        z = Math.max(z, Math.abs(q.x) / th + q.z, Math.abs(q.y) / tv + q.z);
      });
    });
    home = [0, 0, z];
  }

  function perspective(aspect) {
    var t = 1 / Math.tan(FOV / 2);
    return DOMMatrix.fromFloat32Array(new Float32Array([
      t / aspect, 0, 0, 0, 0, t, 0, 0,
      0, 0, (FAR + NEAR) / (NEAR - FAR), -1, 0, 0, (2 * FAR * NEAR) / (NEAR - FAR), 0,
    ]));
  }

  function lookAt(e, c) {
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    var z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]);
    var x = norm(cross([0, 1, 0], z));
    var y = cross(z, x);
    return DOMMatrix.fromFloat32Array(new Float32Array([
      x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -dot(x, e), -dot(y, e), -dot(z, e), 1,
    ]));
  }

  // 目標の視点。周辺パネルにフォーカス中はそのパネルの正面に寄る
  function goal() {
    if (focused) {
      var p = focused;
      var d = Math.max(p.h / 2 / (Math.tan(FOV / 2) * 0.7), p.w / 2 / (Math.tan(FOV / 2) * 0.7 * aspectNow()));
      return {
        eye: [p.center[0] + p.normal[0] * d, p.center[1], p.center[2] + p.normal[2] * d],
        look: p.center,
      };
    }
    var k = pressed ? 0 : 1; // テキスト選択中にパネルが動かないよう視差を止める
    return { eye: [home[0] + mouse[0] * 40 * k, home[1] - mouse[1] * 24 * k, home[2]], look: [0, 0, -R] };
  }

  function aspectNow() {
    return canvas.clientWidth / Math.max(1, canvas.clientHeight);
  }

  // 目標へ近づける。まだ動いていれば true
  function step() {
    var g = goal();
    if (!eye) eye = g.eye.slice();
    var moving = false;
    [[eye, g.eye], [look, g.look]].forEach(function (pair) {
      for (var i = 0; i < 3; i++) {
        var diff = pair[1][i] - pair[0][i];
        if (Math.abs(diff) > 0.3) moving = true;
        pair[0][i] += diff * 0.12;
      }
    });
    return moving;
  }

  function draw() {
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    var moving = step();
    var view = lookAt(eye, look);
    var pv = perspective(cw / ch).multiply(view);
    // クリップ座標 → canvas の CSS px（y 下向き）
    var toCss = new DOMMatrix().translate(cw / 2, ch / 2).scale(cw / 2, -ch / 2);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(bg);
    gl.uniform1f(bg.u("aspect"), cw / ch);
    gl.uniform1f(bg.u("off"), (look[0] - eye[0]) / 600);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(panelProg);
    gl.uniform1f(panelProg.u("pad"), 28);
    panels
      .map(function (p) {
        return { p: p, z: view.transformPoint(new DOMPoint(p.center[0], p.center[1], p.center[2])).z };
      })
      .sort(function (a, b) { return a.z - b.z; }) // 奥から描く
      .forEach(function (o) {
        var p = o.p;
        var m = pv.multiply(p.model);
        gl.uniformMatrix4fv(panelProg.u("m"), false, m.toFloat32Array());
        gl.uniform2f(panelProg.u("size"), p.w, p.h);
        gl.uniform1f(panelProg.u("glow"), p.el.contains(document.activeElement) ? 1 : 0.45);
        gl.bindTexture(gl.TEXTURE_2D, p.tex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // 描画位置とヒットテスト・フォーカスリング・選択の位置を一致させる
        canvas.updateElementGeometry(p.el, { canvasTransform: toCss.multiply(m) });
      });
    if (moving) canvas.requestPaint();
  }

  canvas.addEventListener("paint", function (e) {
    if (!is3D) return;
    (e.changedElements || []).forEach(function (c) {
      panels.forEach(function (p) { if (p.el === c) p.dirty = true; });
    });
    panels.forEach(function (p) {
      if (!p.dirty) return;
      gl.bindTexture(gl.TEXTURE_2D, p.tex);
      if (p.alloc) {
        // paint 中でないと要素の描画結果がなく、サイズを取れない
        var s = canvas.getElementImageDefaultSize(p.el);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, Math.ceil(s.width), Math.ceil(s.height), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        p.alloc = false;
      }
      gl.texElementSubImage2D(gl.TEXTURE_2D, 0, 0, 0, p.el);
      p.dirty = false;
    });
    draw();
  });

  function resize() {
    if (!is3D || !canvas.clientWidth) return; // exit 中は非表示
    var dpr = devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    layout();
    fitHome(aspectNow());
    panels.forEach(function (p) { p.alloc = p.dirty = true; });
    canvas.requestPaint();
  }
  new ResizeObserver(resize).observe(canvas);

  // ── 操作 ──
  block.addEventListener("pointermove", function (e) {
    if (!is3D || pressed) return;
    var r = canvas.getBoundingClientRect();
    mouse = [((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1];
    canvas.requestPaint();
  });

  // Tab で周辺パネルに入ったらそのパネルに寄る。ターミナルに戻ったら全体表示
  block.addEventListener("focusin", function (e) {
    if (!is3D) return;
    var p = panelOf(e.target);
    if (!p) return;
    if (p.col === "main") focused = null;
    else if (!hoverFocus && e.target.matches(":focus-visible")) focused = p;
    canvas.requestPaint();
  });
  block.addEventListener("focusout", function () {
    if (is3D) canvas.requestPaint(); // 発光枠を更新
  });

  apply();
  wide.addEventListener("change", apply);
  still.addEventListener("change", apply);
})();
