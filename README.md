# terminal-like-profile-html

ターミナル風UIのプロフィールページ。ビルド不要の静的HTMLサイト。

## ファイル構成

| ファイル | 説明 |
|----------|------|
| `index.html` | エントリポイント |
| `style.css` | デザイン定義 |
| `profile.js` | プロフィールデータ・ブート設定 ★編集 |
| `commands.js` | コマンド定義 ★編集 |
| `game.js` | ゲームロジック |
| `terminal.js` | ターミナルエンジン |

## ローカルでの動作確認

`index.html` をブラウザで直接開くと、外部ファイル（JS/CSS）の読み込みがブラウザのセキュリティポリシー（CORS）でブロックされる場合があります。ローカルサーバーを立てて確認してください。

### Python

```bash
python3 -m http.server 8080
```

### Node.js（npx）

```bash
npx serve .
```

いずれかを実行後、ブラウザで `http://localhost:8080` を開く。
