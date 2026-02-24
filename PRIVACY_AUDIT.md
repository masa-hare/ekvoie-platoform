# 個人情報（PII）棚卸しレポート

## 1. DBスキーマの個人情報一覧

### 1.1 usersテーブル
| カラム | 個人情報該当 | 用途 | 表示箇所 | 対応方針 |
|--------|------------|------|---------|---------|
| openId | ○ | Manus OAuth識別子 | 管理画面のみ | **削除不可**（OAuth認証に必須） |
| name | ○ | ユーザー名 | 管理画面のみ | **削除検討**（要件上不要なら削除） |
| email | ○ | メールアドレス | 管理画面のみ | **削除検討**（要件上不要なら削除） |
| loginMethod | △ | ログイン方法 | 表示なし | 保持（個人特定には使えない） |
| role | × | ユーザー権限 | 表示なし | 保持（個人情報ではない） |

**判定**: name/emailは管理者のみが使用し、一般ユーザーには表示されない。要件上不要なら削除を推奨。

### 1.2 anonymousUsersテーブル
| カラム | 個人情報該当 | 用途 | 表示箇所 | 対応方針 |
|--------|------------|------|---------|---------|
| uuid | ○ | Cookie識別子 | 表示なし | **有効期限追加**（30日または90日） |
| createdAt | △ | 作成日時 | 表示なし | 保持（追跡性を下げるため短期削除） |
| lastSeenAt | △ | 最終アクセス日時 | 表示なし | 保持（追跡性を下げるため短期削除） |

**判定**: uuidは多重投票防止に使用。長期永続を避け、30日または90日で自動削除する仕組みを追加。

### 1.3 opinionsテーブル
| カラム | 個人情報該当 | 用途 | 表示箇所 | 対応方針 |
|--------|------------|------|---------|---------|
| transcription | ○ | 音声文字起こし | 公開ページ | **個人情報検出機能追加**（メール・電話・学籍番号を検出） |
| audioUrl | △ | 音声ファイルURL | 表示なし | 保持（個人特定には使えない） |
| problemStatement | △ | 問題文 | 公開ページ | 保持（個人情報が入らないよう注意書き強化） |

**判定**: transcriptionはユーザー入力で個人情報が入り得る。投稿フォームに注意書きを強化し、サーバー側で検出機能を追加。

### 1.4 その他のテーブル
- **categories**: 個人情報なし
- **votes**: anonymousUserIdのみ（上記1.2と同じ対応）
- **opinionGroups**: 個人情報なし
- **solutions**: anonymousUserIdのみ（上記1.2と同じ対応）
- **solutionVotes**: anonymousUserIdのみ（上記1.2と同じ対応）

## 2. APIの個人情報読み書き一覧

### 2.1 認証関連API
- `auth.me`: openId/name/emailを返す（管理者のみ）
- `auth.logout`: 個人情報の読み書きなし

### 2.2 意見関連API
- `opinions.list`: transcription/problemStatementを返す（公開）
- `opinions.getById`: transcription/problemStatementを返す（公開）
- `opinions.submit`: transcription/problemStatementを受け取る（公開）
- `opinions.vote`: anonymousUserIdを使用（公開）

### 2.3 管理者API
- `admin.getOpinions`: 全ての個人情報を返す（管理者のみ）
- `admin.updateOpinion`: transcriptionを更新（管理者のみ）

## 3. クライアント計測（Umami）

**現状**: `client/src/main.tsx`でUmamiスクリプトを読み込んでいる。

**対応方針**:
- 環境変数`VITE_ANALYTICS_WEBSITE_ID`がない場合はスクリプトを挿入しない
- 有効化する場合でも、個人データ送信が起きない設定にする（IPアドレス匿名化、Cookie無効化）

## 4. 対応優先順位

### 優先度A（必須）
1. anonymous_usersテーブルにuuid有効期限を追加（30日または90日）
2. opinions.transcriptionに個人情報検出機能を追加
3. 投稿フォームに「個人特定情報を書かない」注意を強化
4. Umami計測を本番で無効化（または個人データ送信を防止）

### 優先度B（推奨）
1. usersテーブルのname/emailを削除（要件上不要な場合）
2. 古いanonymous_usersレコードを自動削除する仕組みを追加

### 優先度C（検討）
1. openIdの代わりに匿名UUIDのみに統一（OAuth認証を完全に廃止する場合）

## 5. 次のステップ

1. Phase 2で優先度Aの対応を実施
2. Phase 3で重大漏洩リスクを除去
3. Phase 4で検索エンジン対策を実施
4. Phase 5でテストとチェックポイント作成
