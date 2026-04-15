/* ========================================================
   [3] プロフィールデータ  ★ここを編集
   名前・スキル・経歴などの個人情報をここに記載する
======================================================== */
var PROFILE = {
  name: "Hol1kgmg",
  nameEn: "horikawa", // プロンプトに使用
  role: "Web Application Engineer",
  dept: "株式会社マイナビ",
  joined: "2024-04-01",
  location: "新宿ミライナタワー",
  worktime: "8:00~16:30",
  quote: "知らざるを知らずと為す是知るなり(孔子)",
  x: "@Hol1kgmg",
  github: "Hol1kgmg",
  message: "Sample",
  coffee: 4,

  career: [
    {
      period: "2024.08 ~ 2025.03",
      name: "新卒配属 初PJ",
      role: "フロントエンド / バックエンド",
      stack: "TypeScript(React) / Ruby on Rails",
      desc: "新規開発案件。Webアプリ開発の経験が全くなかったので毎日ボコボコにされました",
    },
    {
      period: "2025.03 ~ 現在",
      name: "社内向け議事録生成AI Webアプリ 保守運用",
      role: "フロントエンド / バックエンド",
      stack: "TypeScript(React) / Next.js / Python(Django)",
      desc: "既存サービスの保守運用。pythonの天邪鬼なコードルールに日々翻弄です",
    },
  ],

  skills: [
    { name: "TypeScript", lv: 55, status: "ACTIVE" },
    { name: "React/Next.js", lv: 50, status: "ACTIVE" },
    { name: "Nix", lv: 30, status: "LEARNING" },
    { name: "自作キーボード", lv: 99, status: "MAX" },
  ],

  history: [
    { year: "2000", event: "誕生", current: false },
    { year: "2019", event: "高校 卒業", current: false },
    { year: "2024", event: "大学 卒業", current: false },
    { year: "2024", event: "株式会社マイナビ 入社", current: true },
  ],

  tags: [
    "コーヒー中毒",
    "neovim派",
    "ネコ派",
    "高所恐怖症",
    "自作キーボード",
    "ガジェット好き",
  ],

  hobby: [
    {
      icon: "🎥",
      name: "VTuber鑑賞",
      lv: 82,
      status: "MOURNING",
      comment: "基本は箱推し。2025年末に最推しが卒業して絶望しました。",
    },
    {
      icon: "⌨",
      name: "自作キーボード",
      lv: 99,
      status: "MAX",
      comment: "理想のキーボードにようやく辿り着いた。今はこれ一択。",
    },
    {
      icon: "🎮",
      name: "ゲーム",
      lv: 55,
      status: "HUNTING",
      comment: "2026年春セールでSwitch版モンハンライズ購入。初モンハン進行中。",
    },
  ],

  tomb: [
    { name: "デュエル エクス マキナ",  genre: "DCG",        died: "2019/10/31", age: "2年8か月" },
    { name: "アルテイルNEO",           genre: "DCG",        died: "2019/11/29", age: "11か月" },
    { name: "ドールズオーダー",         genre: "アクション", died: "2019/11/29", age: "1年8か月" },
    { name: "錬金のアストラル",         genre: "パズル型DCG",died: "2020/09/01", age: "10か月" },
    { name: "ゼノンザード",             genre: "DCG",        died: "2021/02/18", age: "1年5か月" },
    { name: "ラクガキ キングダム",      genre: "ソシャゲ",   died: "2021/11/02", age: "8か月" },
    { name: "カオスアカデミー",         genre: "DCG",        died: "2022/06/30", age: "1年7か月" },
    { name: "ツムツムスタジアム",       genre: "パズル",     died: "2022/09/30", age: "2年" },
    { name: "ロストアーカイブ",         genre: "DCG",        died: "2023/12/26", age: "4年2か月" },
    { name: "404 エラーゲームリセット", genre: "ソシャゲ",   died: "2024/01/05", age: "8か月" },
    { name: "少女キャリバーW",          genre: "ソシャゲ",   died: "2024/12/05", age: "3年10か月", memo: "旧: 少女キャリバー.io" },
  ],
};

/* ========================================================
   [4] ブート設定  ★ここを編集
   起動時に自動実行するコマンドを順番に並べる
======================================================== */
var BOOT_SEQUENCE = [
  "whoami",
  "career",
  "history",
  "hobby",
  "tags",
  "contact",
  "help",
];
var TYPING_SPEED  = 60;  // タイピング速度 (ms/文字)　小さいほど速い
var BETWEEN_DELAY = 700; // コマンド間の待機時間 (ms)
