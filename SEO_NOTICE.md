# 検索エンジン対策通知

## 実施した対策（2026-02-08）

本プラットフォームは学内専用であり、通常の検索エンジンに出てこないように以下の設定を実施しました。

### 1. robots.txt（全クローラを拒否）

**ファイル**: `client/public/robots.txt`

```
User-agent: *
Disallow: /
```

- すべての検索エンジンクローラに対して、サイト全体のクロールを拒否
- Google、Bing、Yahoo等の主要な検索エンジンに対応

### 2. noindex meta タグ

**ファイル**: `client/index.html`

```html
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
```

- `noindex`: 検索結果にページを表示しない
- `nofollow`: ページ内のリンクをたどらない
- `noarchive`: キャッシュを保存しない
- `nosnippet`: 検索結果にスニペット（説明文）を表示しない

### 3. X-Robots-Tag HTTPヘッダー

**ファイル**: `client/public/_headers`

```
/*
  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
```

- HTTPヘッダーレベルで検索エンジンに指示
- meta タグと同じ効果を、サーバー側から送信
- Netlify、Vercel等の静的ホスティングで自動的に適用

### 重要な注意事項

#### すでに検索に載ってしまった可能性がある場合

1. **検索結果から消えるまでタイムラグがある**
   - noindex設定後も、検索エンジンが再クロールするまで数日〜数週間かかる場合があります
   - Google Search Consoleで「削除リクエスト」を送信すると、より早く削除できます

2. **Google Search Consoleでの削除手順**
   ```
   1. Google Search Console（https://search.google.com/search-console）にアクセス
   2. 対象のプロパティを選択
   3. 左メニューから「削除」を選択
   4. 「新しいリクエスト」をクリック
   5. URLを入力して「次へ」
   6. 「このURLを一時的に削除する」を選択
   ```

3. **確認方法**
   - Google検索で `site:あなたのドメイン` を検索
   - 結果が表示されなくなれば、インデックスから削除されています

### 今後の予防策

- 上記3つの設定により、新たに検索エンジンにインデックスされることはありません
- 定期的に `site:あなたのドメイン` で検索して、インデックス状況を確認してください

---

**注意**: このファイルは内部管理用です。外部には公開しないでください。
