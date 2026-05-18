# ig-builder-light

> **「資料を入れると、instyle.group デザインで一枚の HTML に。」**
>
> PDF / 画像 / Word / PowerPoint / HTML / TXT を 1 ファイル投入すると、`design-system` または `design-system_liquid` の仕様に沿った self-contained な HTML を Claude がストリーミングで返す軽量アプリ。
>
> 重量版 `ig-builder` がエージェント・DB・ジョブキュー・GitHub/Vercel 自動公開まで持つのに対し、こちらは **Anthropic SDK を 1 回呼ぶだけのステートレス Web**。DB・認証なし。生成された HTML はブラウザに留まり、ダウンロード or コピー or `/html/<name>.html` への scp で配布する。

## アーキテクチャ要点

- **Next.js 16 App Router**（Node runtime）。Web 1 プロセスのみ、Runner なし
- 入力: `multipart/form-data` で 1 ファイル（〜25MB）+ `designSystem` (`flat` | `liquid`)
- 抽出層: `src/lib/attachments/` に PDF=pdf-parse / DOCX=mammoth / PPTX=adm-zip / 画像=base64 直送 / PDF=Claude native document block 優先
- 生成: `anthropic.messages.stream`（system に design.md 全文 + prompt cache）
- 応答: SSE（`progress` / `html_delta` / `done` / `error`）。`X-Accel-Buffering: no` で Nginx バッファ回避
- 出力: `<iframe srcdoc>` に流し込みライブプレビュー。`sandbox` は `allow-same-origin` のみ（scripts 無効、`<script>` 後処理除去）

## デザインシステム

- 本体 UI は **Liquid Glass**（`~/Workspace/design-system_liquid/design.md` に準拠）
- 生成出力はユーザーがリキッド／フラットを画面上でトグル
- 仕様書は build/dev 開始時に Workspace 直下から `src/lib/prompt/design-{flat,liquid}.md` に sync（`pnpm sync:design`）。git 管理に乗せて CI でも追従。**正本変更を反映するときは `pnpm sync:design && git commit` を意図的に走らせる**

## デプロイ設定（Claude Code 用）

このプロジェクトは ConoHa VPS にデプロイされる。本番反映は「本番にあげて」の指示で起動する（ワークスペース CLAUDE.md の「ConoHa 本番デプロイ」節を参照）。

| キー | 値 |
|---|---|
| CATEGORY | `app` |
| APP_NAME | `ig-builder-light` |
| PORT | `3006` |
| 公開URL | `https://app.instyle.group/ig-builder-light/` |
| HEALTHCHECK_PATH | `/ig-builder-light/api/health` |
| USE_DB | `false` |
| PM2名 | `app-ig-builder-light` |
| サーバ側パス | `/var/www/app/ig-builder-light/` |
| アプリ固有 env | `/var/www/_shared/apps/app-ig-builder-light.env` |

## 共通アセット (favicon / logo / OGP)

`https://app.instyle.group/_shared/static/{favicon.png, logo.svg, ogp.jpg}` で配信。`app/layout.tsx` の metadata に絶対 URL で指定する（詳細: `~/Workspace/docs/conoha-shared-assets.md`）。

```ts
const SITE_URL = "https://app.instyle.group/ig-builder-light";
const ASSETS   = "https://app.instyle.group/_shared/static";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: `${ASSETS}/favicon.png`, apple: `${ASSETS}/favicon.png` },
  openGraph: {
    type: "website", siteName: "INSTYLE GROUP", locale: "ja_JP",
    url: SITE_URL, title: TITLE, description: DESCRIPTION,
    images: [{ url: `${ASSETS}/ogp.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image", title: TITLE, description: DESCRIPTION,
    images: [`${ASSETS}/ogp.jpg`],
  },
};
```

## ローカル開発

```bash
pnpm install
pnpm dev
# http://localhost:3000/ig-builder-light/ でアクセス（basePath 込み）
```

> **初回コミット前に必ず `pnpm install` を実行**してください。生成された `pnpm-lock.yaml` をコミットに含めないと、GitHub Actions の `actions/setup-node@v4` (`cache: pnpm`) が `Dependencies lock file is not found` で失敗します。

## 本番デプロイ

「本番にあげて」と Claude Code に指示すると、`gh workflow run deploy-prod.yml --ref main` で GitHub Actions が走り、ConoHa VPS にデプロイされる。

手動で起動する場合:
```bash
gh workflow run deploy-prod.yml --ref main
gh run watch
```

## 必要な env

`/var/www/_shared/apps/app-ig-builder-light.env`（chmod 600）に最低 1 つ:

```
ANTHROPIC_API_KEY=...
# 任意（モデル切替したいときだけ）
# ANTHROPIC_MODEL=claude-sonnet-4-6

# 「4. 公開する」機能を有効にするときだけ設定（本番のみ）
# /var/www/<cpc|crhr>/html/<name>.html に書き出す。未設定なら 503 で機能無効
PUBLISH_BASE_DIR=/var/www
```

## 初回 ConoHa セットアップ手順（このアプリ用）

```bash
# 1. アプリディレクトリ
ssh conoha-deploy 'mkdir -p /var/www/app/ig-builder-light/{releases,shared} \
  && touch /var/www/_shared/apps/app-ig-builder-light.env \
  && chmod 600 /var/www/_shared/apps/app-ig-builder-light.env'

# 2. Nginx location（exact + ^~ prefix の 2 段で trailing-slash 308 ループ回避）
#    + SSE 用に proxy_buffering off / proxy_read_timeout 引き上げ
ssh conoha-root 'cat > /etc/nginx/conf.d/proxy-apps/app/ig-builder-light.conf <<"EOF"
location = /ig-builder-light {
  include snippets/proxy-next.conf;
  proxy_pass http://127.0.0.1:3006;
}
location ^~ /ig-builder-light/ {
  include snippets/proxy-next.conf;
  proxy_pass http://127.0.0.1:3006;
}
location = /ig-builder-light/api/generate {
  include snippets/proxy-next.conf;
  proxy_pass http://127.0.0.1:3006;
  proxy_buffering off;
  proxy_cache off;
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_read_timeout 300s;
  proxy_send_timeout 300s;
}
EOF
nginx -t && systemctl reload nginx'

# 3. 「4. 公開する」機能を使うなら、共有 /html/ への deploy 書き込み権限を確認
ssh conoha-root 'stat -c "%U %G %a" /var/www/cpc/html /var/www/crhr/html'
ssh conoha-root 'sudo -u deploy touch /var/www/cpc/html/.write_probe && rm /var/www/cpc/html/.write_probe'
ssh conoha-root 'sudo -u deploy touch /var/www/crhr/html/.write_probe && rm /var/www/crhr/html/.write_probe'
# 書けない場合の例:
# ssh conoha-root 'chown -R deploy:www-data /var/www/cpc/html /var/www/crhr/html && chmod 2775 /var/www/cpc/html /var/www/crhr/html'

# 4. env に PUBLISH_BASE_DIR を追加
ssh conoha-root 'echo "PUBLISH_BASE_DIR=/var/www" >> /var/www/_shared/apps/app-ig-builder-light.env'
```

## ロールバック

GitHub Actions 側のヘルスチェック失敗時は自動で前 release に戻る。手動で戻す場合:

```bash
ssh deploy@160.251.201.115
cd /var/www/app/ig-builder-light/releases
ls -lt   # 直前の release ディレクトリを確認
ln -sfn <previous-sha> ../current.new && mv -T ../current.new ../current
pm2 reload app-ig-builder-light --update-env
```

## デザインシステム

ワークスペース CLAUDE.md のルールに従い、`design-system` または `design-system_liquid` を選択して適用済み。詳細は実装ファイルを参照。
