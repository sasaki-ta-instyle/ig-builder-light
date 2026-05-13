# ig-builder-light 再開手順

このドキュメントは、Claude Code セッションを終了したり別の Mac に切り替えた後で、
`ig-builder-light` の開発・運用作業をスムーズに再開するためのチェックリスト。

> **更新ルール:** このファイルを変更したら必ず main に push して、別 Mac / 別メンバーが
> 最新を取れる状態に保つ。秘密値そのものは絶対に書かない（取得元のリンクのみ）。

---

## 0. このアプリの基本情報

| 項目 | 値 |
|---|---|
| 公開 URL | `https://app.instyle.group/ig-builder-light/` |
| GitHub | `https://github.com/sasaki-ta-instyle/ig-builder-light`（Private 想定） |
| ConoHa デプロイ先 | `/var/www/app/ig-builder-light/` |
| 共有 env | `/var/www/_shared/apps/app-ig-builder-light.env`（chmod 600） |
| PM2 名 | `app-ig-builder-light` |
| ポート | `3006` |
| Healthcheck | `/ig-builder-light/api/health` |
| USE_DB | `false` |

---

## 1. 同じ Mac で再開する

Claude Code を終了しただけなら、以下だけで OK。

```bash
claude
```

このプロジェクトのチャット履歴・memory・state はそのまま残っている。
何も入れなくても前回の文脈のまま再開できる。

---

## 2. 別の Mac（サブ機 / 新メンバー）で再開する

### 2.1 Claude Code 環境を揃える

メイン Mac の `~/.claude` 配下（settings / memory / agents / skills / plugins）は
**`instyle-claude-sasaki` リポジトリ** が同期の正本。bootstrap してメイン機と同じ状態にする。

### 2.2 ソースコードを取得

```bash
mkdir -p ~/Workspace
gh repo clone sasaki-ta-instyle/ig-builder-light ~/Workspace/ig-builder-light
cd ~/Workspace/ig-builder-light
```

### 2.3 ローカル開発に必要なツール

```bash
brew install pnpm
# Redis を使うアプリなら:
# brew install redis && brew services start redis
pnpm install
```

### 2.4 機密情報を配置（git 管理外）

#### `.env.local` — 1Password などから取得して配置

`~/Workspace/ig-builder-light/.env.local` に必要なキーを揃える（**git に入れない**）。
本番 `app-ig-builder-light.env` と概ね同じ値で動く。

このアプリで実際に使う env 一覧は **`.env.example` を見る**（ある場合）か、
`src/` 配下で `process.env.XXX` を grep する。

##### よくある取得元

| キー | 取得先 |
|---|---|
| `NEXTAUTH_SECRET` / `TOKEN_ENCRYPTION_KEY` | 1Password、または新規生成（`openssl rand -base64 48` / `openssl rand -hex 32`） |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `*_DATABASE_URL` / DB 接続情報 | 1Password、または ConoHa 上の SQLite なら不要 |
| その他 SaaS のキー | 各サービスのコンソール |

#### `~/.ssh/config` + `conoha_{root,deploy}` 鍵（ConoHa 直接操作が必要な場合）

詳細は `~/Workspace/docs/conoha-setup.md` の **0-11b** を参照。

```bash
chmod 600 ~/.ssh/conoha_root ~/.ssh/conoha_deploy

mkdir -p ~/.ssh && cat >> ~/.ssh/config <<'EOF'

Host conoha-deploy
    HostName 160.251.201.115
    User deploy
    IdentityFile ~/.ssh/conoha_deploy
    IdentitiesOnly yes
    ServerAliveInterval 30

Host conoha-root
    HostName 160.251.201.115
    User root
    IdentityFile ~/.ssh/conoha_root
    IdentitiesOnly yes
    ServerAliveInterval 30
EOF
chmod 600 ~/.ssh/config

# 疎通確認
ssh conoha-deploy 'whoami'  # → deploy
ssh conoha-root   'whoami'  # → root
```

### 2.5 起動

```bash
# DB を使うアプリなら migration を先に
# pnpm migrate

pnpm dev
# → http://localhost:3006/ig-builder-light/ にアクセス
```

---

## 3. データ・状態の永続化マッピング

| 種類 | 場所 | 引き継ぎ方法 |
|---|---|---|
| ソースコード | GitHub `sasaki-ta-instyle/ig-builder-light` | `git clone` |
| Claude Code 設定（memory / agents / skills） | `instyle-claude-sasaki` リポジトリ | bootstrap で同期 |
| 本番 Web プロセス（PM2） | ConoHa `app-ig-builder-light` | 触らない、`deploy-prod.yml` で更新 |
| 本番 env（API キー類） | ConoHa `/var/www/_shared/apps/app-ig-builder-light.env` | サーバ側永続、`ssh conoha-deploy` で参照可 |
| 本番 DB（SQLite の場合） | ConoHa `/var/www/app/ig-builder-light/data/...` | サーバ側永続 |
| ConoHa SSH 鍵 | 1Password | 別 Mac で `~/.ssh/` に配置 |
| 各 SaaS のクレジット・課金 | 各サービスのアカウント | ブラウザで確認 |
| ローカル `.env.local` | 各 Mac のローカル | 1Password 経由 or 各 Mac で再生成 |
| ローカル `data/` 配下 | 各 Mac のローカル | **同期しない**（dev 用テストデータ） |

---

## 4. よくある運用コマンド

### 本番に新コードを反映する

```bash
gh workflow run deploy-prod.yml --ref main -R sasaki-ta-instyle/ig-builder-light
gh run watch -R sasaki-ta-instyle/ig-builder-light
```

### 本番 env を 1 行だけ書き換える

```bash
ssh conoha-deploy '
sed -i "s|^KEY_NAME=.*|KEY_NAME=new_value|" /var/www/_shared/apps/app-ig-builder-light.env
cd /var/www/app/ig-builder-light/current && pm2 startOrReload ecosystem.config.cjs --update-env
'
```

### 本番 PM2 ログを覗く

```bash
ssh conoha-deploy 'pm2 logs app-ig-builder-light --nostream --lines 50 --raw'
```

### 本番 PM2 再起動

```bash
ssh conoha-deploy 'pm2 restart app-ig-builder-light --update-env'
```

### ロールバック（手動）

```bash
ssh conoha-deploy '
cd /var/www/app/ig-builder-light/releases
ls -lt | head -5
ln -sfn <previous-sha> ../current.new && mv -T ../current.new ../current
pm2 reload app-ig-builder-light --update-env
'
```

GitHub Actions 失敗時は workflow が自動ロールバックする。

---

## 5. 残タスク / 未実装の挙動

新規プロジェクトでは空。Phase が進むたびにここを埋める。

| # | 内容 | 状態 |
|---|---|---|
|  |  |  |

---

## 6. 緊急時の参考

- ConoHa 本番運用 runbook: `~/Workspace/docs/conoha-setup.md`
- ポート台帳: `~/Workspace/docs/conoha-port-registry.md`
- アプリアーカイブ手順: `~/Workspace/docs/conoha-app-archive.md`
- このアプリの `CLAUDE.md`（同階層）: 設計判断・運用ルール
