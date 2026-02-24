# セキュリティ通知

## 重大な漏洩リスクの除去（2026-02-08）

### 実施した対策

1. **`.manus/` 配下のファイルをリポジトリから削除**
   - `.manus/db/db-query-*.json` ファイルにはデータベースクエリ結果が含まれていた可能性があります
   - これらのファイルは `.gitignore` に追加され、今後はリポジトリに含まれません

2. **`client/public/__manus__/` 配下のデバッグファイルを削除**
   - `debug-collector.js` は本番配信から除外されました
   - これらのファイルは `.gitignore` に追加され、今後はリポジトリに含まれません

### 外部公開している場合の対応（重要）

**もし既にGitHub等の外部リポジトリに公開している場合は、以下の対応を直ちに実施してください：**

1. **データベース資格情報のローテーション（最優先）**
   - データベースのパスワードを変更
   - 環境変数 `DATABASE_URL` を更新
   - アプリケーションを再起動

2. **Gitリポジトリの履歴から機密情報を完全削除**
   ```bash
   # BFG Repo-Cleanerを使用（推奨）
   brew install bfg  # または apt-get install bfg
   bfg --delete-folders .manus --no-blob-protection
   bfg --delete-folders __manus__ --no-blob-protection
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **公開リポジトリの確認**
   - GitHub等で `.manus/` や `__manus__/` が履歴に残っていないか確認
   - 残っている場合は、上記の手順で完全削除

### 今後の予防策

- `.gitignore` に以下が追加されました：
  - `.manus/`
  - `client/public/__manus__/`
  - `**/__manus__/`
- これらのディレクトリは今後自動的に除外されます
- ビルド成果物（dist/build）にも__manus__が含まれないことを確認済み

### 確認事項

- [ ] 外部リポジトリに公開していない（ローカルのみ）
- [ ] 外部リポジトリに公開している場合、DB資格情報をローテーション済み
- [ ] 外部リポジトリに公開している場合、Git履歴から機密情報を削除済み

---

**注意**: このファイルは内部管理用です。外部には公開しないでください。
