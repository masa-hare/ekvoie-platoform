/**
 * Self-contained (no external assets) HTML page for the site-wide access gate.
 * Rendered server-side so the gate holds even before any SPA JS would load.
 */
export function renderSiteAccessPage(opts: { error?: boolean } = {}): string {
  const errorBlock = opts.error
    ? `<p class="error">パスワードが違います。もう一度お試しください。</p>`
    : "";

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>叡啓ボイス — アクセス確認</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    color: #000;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif;
    padding: 24px;
  }
  main {
    width: 100%;
    max-width: 360px;
    border: 4px solid #000;
    padding: 32px 24px;
  }
  h1 {
    font-size: 22px;
    font-weight: 900;
    margin: 0 0 8px;
  }
  p.lead {
    font-size: 14px;
    font-weight: 600;
    color: #444;
    margin: 0 0 24px;
  }
  label {
    display: block;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  input[type="password"] {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border: 3px solid #000;
    margin-bottom: 16px;
  }
  button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    font-weight: 900;
    text-transform: uppercase;
    background: #000;
    color: #fff;
    border: 3px solid #000;
    cursor: pointer;
  }
  button:hover { background: #222; }
  p.error {
    color: #b91c1c;
    font-weight: 700;
    font-size: 14px;
    margin: 0 0 16px;
  }
</style>
</head>
<body>
<main>
  <h1>叡啓ボイス</h1>
  <p class="lead">学内チャットで配布されたパスワードを入力してください。</p>
  ${errorBlock}
  <form method="POST" action="/api/site-access/login">
    <label for="password">パスワード</label>
    <input type="password" id="password" name="password" autofocus required />
    <button type="submit">入る</button>
  </form>
</main>
</body>
</html>`;
}
