# Student Voice Platform / 学生ボイスプラットフォーム

A bilingual (Japanese/English) anonymous student opinion platform with voting, post-moderation, and analytics — built for universities and educational institutions.

匿名で学生の意見を投稿・集計・可視化できる、日本語/英語対応のプラットフォームです。大学・教育機関向けに設計されており、投稿前コンテンツフィルター・事後モデレーション・分析ダッシュボードを備えています。

---

## Features / 機能

| English | 日本語 |
|---------|--------|
| **Anonymous posting** — students post problems and proposed solutions without accounts | **匿名投稿** — アカウント不要で問題・解決策を投稿できます |
| **Agree / Disagree / Pass voting** — vote on opinions and solution proposals | **賛成・反対・パス投票** — 意見と解決策の両方に投票できます |
| **Content filter** — rule-based (not AI) pre-submission filter blocks personal info and harmful language | **コンテンツフィルター** — 投稿前に個人情報・有害表現をルールベースで自動ブロック（AIは使用していません） |
| **Post-moderation** — posts publish instantly; admins hide or delete problematic content after the fact | **事後モデレーション** — 投稿は即時公開。管理者が事後確認し、問題投稿を非表示または削除 |
| **Analytics dashboard** — real-time vote stats, category breakdown, top opinions | **分析ダッシュボード** — リアルタイムの投票統計、カテゴリー別集計、上位意見を表示 |
| **Bilingual UI** — Japanese / English toggle, persisted in localStorage | **日英バイリンガルUI** — 日本語/英語の切り替えに対応（localStorage に保存） |
| **Solution proposals** — community members can propose solutions; best solution is highlighted | **解決策提案** — コミュニティメンバーが解決策を提案でき、最も支持された案が強調表示されます |
| **Rate limiting & XSS protection** — built-in security on all endpoints | **レート制限・XSS対策** — 全エンドポイントにセキュリティ対策を実装済み |
| **CSV export** — export all opinions from the admin panel | **CSVエクスポート** — 管理パネルから全意見をエクスポートできます |
| **Mobile-friendly** — responsive layout for all screen sizes | **モバイル対応** — あらゆる画面サイズに対応したレスポンシブレイアウト |

---

## Tech Stack / 技術構成

| Layer / レイヤー | Technology / 技術 |
|-------|-----------|
| Frontend / フロントエンド | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Routing / ルーティング | Wouter |
| State / Data / 状態管理・データ取得 | tRPC, TanStack Query |
| Backend / バックエンド | Node.js, Express |
| Database / データベース | MySQL (Drizzle ORM) |
| Auth / 認証 | JWT (HTTP-only cookie) |
| Deployment / デプロイ | Railway (推奨) |

---

## Quick Start (Local Development) / ローカル開発の始め方

### Prerequisites / 必要な環境

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MySQL database (local or cloud) / MySQLデータベース（ローカルまたはクラウド）

### 1. Clone the repository / リポジトリをクローン

```bash
git clone https://github.com/masa-hare/ekvoie-platoform.git
cd ekvoie-platoform
```

### 2. Install dependencies / 依存パッケージをインストール

```bash
pnpm install
```

### 3. Set up environment variables / 環境変数を設定

```bash
cp .env.example .env
```

Edit `.env` / `.env` を編集:

```env
DATABASE_URL=mysql://user:password@localhost:3306/student_voice
JWT_SECRET=your-random-secret-at-least-64-chars
ADMIN_PASSWORD=your-admin-password
NODE_ENV=development
```

### 4. Run database migrations / データベースのマイグレーションを実行

```bash
pnpm db:push
```

### 5. Start the development server / 開発サーバーを起動

```bash
pnpm dev
```

Open / ブラウザで開く: [http://localhost:5000](http://localhost:5000)

---

## Customization / カスタマイズ

All institution-specific values are in one file:
機関固有の設定はすべて1つのファイルにまとめられています：

**`client/src/siteConfig.ts`**

```typescript
export const siteConfig = {
  orgName: {
    ja: "叡啓大学",         // ← 自分の機関名（日本語）に変更
    en: "Eikei University", // ← 自分の機関名（英語）に変更
  },
  memberTerm: {
    ja: "叡啓生",           // ← 学生の呼称（日本語）に変更
    en: "Eikei students",   // ← 学生の呼称（英語）に変更
  },
  siteName: {
    ja: "叡啓ボイス",       // ← プラットフォーム名（日本語）に変更
    en: "Eikei Voice",      // ← プラットフォーム名（英語）に変更
  },
  contactEmail: "your@email.com",        // ← 連絡先メールアドレス
  githubUrl: "https://github.com/...",   // ← あなたのGitHubリポジトリURL
};
```

Edit this file and rebuild — everything else updates automatically.
このファイルを編集してリビルドするだけで、全ページに反映されます。

---

## Deployment (Railway) / デプロイ方法（Railway）

### 1. Create a new Railway project / Railwayプロジェクトを作成

1. Go to / アクセス: [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your forked repository / フォークしたリポジトリを選択

### 2. Add a MySQL database / MySQLデータベースを追加

In your project: **+ New** → **Database** → **Add MySQL**
プロジェクト画面で **+ New** → **Database** → **Add MySQL** を選択します。
`DATABASE_URL` は自動的に設定されます。

### 3. Set environment variables / 環境変数を設定

| Variable / 変数名 | Value / 値 |
|----------|-------|
| `ADMIN_PASSWORD` | 管理パネルのパスワード |
| `JWT_SECRET` | ランダムな秘密文字列（64文字以上） |

Generate a secret / シークレットの生成:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Done / 完了

Railway auto-deploys on every push to `main`. Database migrations run automatically on startup.
`main` ブランチにプッシュするたびに自動デプロイされます。データベースのマイグレーションは起動時に自動実行されます。

---

## Admin Panel / 管理パネル

Access the admin panel at `/admin-login`.
管理パネルへは `/admin-login` からアクセスしてください。

From the admin panel you can / 管理パネルでできること:
- Hide or delete opinions / 意見の非表示・削除
- Hide or delete solution proposals / 解決策提案の非表示・削除
- Export all data as CSV / 全データをCSVでエクスポート

---

## Environment Variables Reference / 環境変数一覧

| Variable / 変数名 | Required / 必須 | Description / 説明 |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL接続文字列 |
| `JWT_SECRET` | ✅ | セッショントークン署名用のシークレット |
| `ADMIN_PASSWORD` | ✅ | 管理パネルのログインパスワード |
| `NODE_ENV` | 自動 | Railwayが `production` に自動設定 |
| `PORT` | 自動 | Railwayが自動設定 |

---

## Project Structure / プロジェクト構成

```
student-voice-platform/
├── client/src/
│   ├── siteConfig.ts        # ← 機関情報のカスタマイズはここを編集
│   ├── pages/               # Reactページ
│   ├── components/          # 共通UIコンポーネント
│   ├── contexts/            # 言語コンテキスト（i18n）
│   └── hooks/               # カスタムフック
├── server/
│   ├── _core/               # Expressアプリ、tRPCセットアップ、認証
│   ├── routers.ts           # 全APIエンドポイント
│   ├── db.ts                # データベースクエリ
│   └── security.ts          # 入力サニタイズ・コンテンツフィルター
├── drizzle/
│   └── schema.ts            # データベーススキーマ
├── .env.example             # 環境変数テンプレート
└── railway.toml             # Railwayデプロイ設定
```

---

## Contributing / コントリビューション

Pull requests and issues are welcome. If you're using this for your institution and want to share improvements, feel free to open a PR.

プルリクエストやIssueは歓迎します。自分の機関で使っていて改善点があれば、ぜひPRを送ってください。

---

## License / ライセンス

MIT — see [LICENSE](./LICENSE)
