# instyle.group Design System

グループ内のインナー制作物（Webアプリ、ダッシュボード、プレゼン、データビジュアライゼーション）のデザイン品質を統一するためのガイドライン。

---

## 1. Design Philosophy

- **Less is more** — 余白と静けさがブランドの格を上げる
- **Clarity first** — 情報の優先度を明確にし、迷わせない
- **Consistency** — 画面・媒体をまたいでも同じトーンを保つ
- **Japanese precision** — 細部への気配りと整合性を大切にする
- **Contrast over lines** — 要素の区切りはボーダーラインでなく背景色のコントラストで表現する

---

## 2. カラーパレット

### CSS Variables（全プロジェクト共通）

```css
:root {
  /* Backgrounds — instyle.group base palette (warm neutral) */
  --color-bg:          #FFFFFF;   /* ページ背景 */
  --color-surface:     #F3F1EE;   /* カード・パネル背景 */
  --color-surface-2:   #E6E2D7;   /* 入れ子パネル・タグ背景 */
  --color-surface-3:   #E1DCD0;   /* より深いネスト・強調パネル背景 */

  /* Borders */
  --color-border:      #C4C1B0;   /* デフォルトボーダー */
  --color-border-dark: #82837A;   /* 強調ボーダー */

  /* Text */
  --color-text:         #35362D;   /* プライマリテキスト（明るい背景上） */
  --color-text-muted:   #82837A;   /* セカンダリ・キャプション */
  --color-text-light:   #C4C1B0;   /* プレースホルダー・無効 */
  --color-text-inverse: #F3F1EE;   /* 暗い背景（#35362D / #82837A）上のテキスト */

  /* Accent */
  --color-accent:       #C4C1B0;   /* アクセント強調・ラベル・タグ背景 */
  --color-accent-light: #82837A;   /* アクセントバッジ・強調テキスト */
  --color-accent-dark:  #E6E2D7;   /* サイドバー・強調パネル背景 */

  /* Status */
  --color-success:     #7BB785;
  --color-warning:     #D4772C;
  --color-error:       #C6292C;
  --color-info:        #38537B;

  /* Highlight — 本文内ポイントマーキング専用（蛍光ペン風）。CTA / 面要素には使わない */
  --color-highlight:   #E2DD2A;
}
```

### ハイライト色 `#E2DD2A` の使い方

**本文中で「立たせたい語句」を蛍光ペンで線引くようにポイント的にマーキングする用途のみ**。CTA / アイコン背景 / 見出し全体 / サイドバー など面要素には使わない。1 ページに 2〜3 箇所まで。

```css
mark, .mark {
  background: linear-gradient(180deg, transparent 60%, var(--color-highlight) 60%);
  padding: 0 2px;
  color: inherit;
}
```

```html
<p>初回 <mark>必ず ./bootstrap.sh を実行</mark> してから Claude を起動してください。</p>
```

> 使ってはいけない例: `<button class="btn-highlight">`, callout のアイコン背景, ヘッダー帯の塗り, ロゴ周辺のラベル全体。

---

### Tailwind CSS カスタムカラー設定

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#F3F1EE', 2: '#E6E2D7', 3: '#E1DCD0' },
        border: { DEFAULT: '#C4C1B0', dark: '#82837A' },
        accent: {
          DEFAULT: '#C4C1B0',
          light: '#82837A',
          dark: '#E6E2D7',
        },
        muted: '#82837A',
      }
    }
  }
}
```

### チャート用カラーシーケンス

データビジュアライゼーションでは以下の順番で使用する。

| 順序 | HEX | 用途 |
|------|-----|------|
| 1 | `#E6E2D7` | メインデータ系列 |
| 2 | `#C4C1B0` | サブデータ系列 |
| 3 | `#82837A` | 第3系列 |
| 4 | `#F3F1EE` | 第4系列 |
| 5 | `#35362D` | 第5系列 |

---

## 3. タイポグラフィ

### フォントファミリー

UI / 本文は **Gen Interface JP** をベースに、見出しは **Gen Interface JP Display** を使う。和文・欧文を 1 ファミリで賄うため、従来の `Lato + Noto Sans JP` 構成は廃止した。明朝（Shippori Mincho）は**オプトイン**（明示指示時のみ別途読み込み）。

```html
<!-- HTML head -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/gen-interface-jp@0.1.2/all.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
:root {
  --font-sans:    'Gen Interface JP', sans-serif;
  --font-display: 'Gen Interface JP Display', 'Gen Interface JP', sans-serif;
  --font-mono:    'JetBrains Mono', 'Menlo', monospace;
  /* --font-serif: 'Shippori Mincho', serif;
     オプトイン時のみ <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&display=swap"> を head に追加してから利用 */
}

/* 見出しは Display を当てる */
h1, h2, h3, h4 { font-family: var(--font-display); }
```

> **明朝体（`--font-serif`）の運用ルール**: 標準では使わない（CDN にも含めない）。eyebrow / 見出し / TOC タイトル / ステップ番号 / フッタータグなどに **自動で serif italic を当てない**。ユーザーから「明朝で」「serif で」「エディトリアルっぽく」と明示指示があった時のみ Shippori Mincho を別途 Google Fonts から読み込み、`var(--font-serif)` を有効化する。代替の eyebrow パターンは `font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;` の **tracked sans**。

### タイプスケール（モジュラースケール / Major Third 1.25・base 14px）

倍率 **1.25**（Major Third）を採用。静か・ミニマル・洗練な印象でジャンプ率小さめ、ダッシュボード/UI に向く。

| 用途 | px | rem | Weight | Line-height |
|------|-----|------|--------|-------------|
| Display | 43px | 2.6875rem | 200 | 1.05 |
| H1 | 34px | 2.125rem  | 400 | 1.10 |
| H2 | 27px | 1.6875rem | 500 | 1.20 |
| H3 | 22px | 1.375rem  | 600 | 1.30 |
| H4 | 18px | 1.125rem  | 600 | 1.40 |
| Body | 14px | 0.875rem | 400 | 1.70 |
| Small | 11px | 0.6875rem | 400 | 1.50 |
| Caption | 9px | 0.5625rem | 400 | 1.40 |

> **Caption（9px）はチャート目盛り・脚注専用。本文の最小推奨は Small（11px）。**
> Liquid 版は Perfect Fourth 1.25 ではなく **1.333** を使うため、両者のスケールは別物（意図的に切り替えている）。

### 日本語テキストの注意点

- `font-feature-settings: "palt"` を有効にして字詰めを最適化
- 行長は 40〜60文字が読みやすい（全角換算）
- 見出しは `letter-spacing: -0.02em`（引き締め感）
- 本文は `letter-spacing: 0.01em`（読みやすさ）

---

## 4. 角丸（クロソイド式 / Squircle）

**角丸はすべて連続曲率（クロソイド式 = superellipse）を使う**。通常の `border-radius` の円弧角丸（曲率が 0 → 1/r に不連続にジャンプ）ではなく、曲率が滑らかに立ち上がる "Apple iOS 風" の squircle 形状で統一する。視覚的に「やや四角く、しかし柔らかく」見えるのが特徴。

### CSS 実装

CSS Borders Level 4 の `corner-shape: superellipse(<n>)` を使用。`n` は曲率指数で、`2.5` を標準とする（iOS の連続コーナーに近い値）。

```css
:root {
  --corner-shape: superellipse(2.5);   /* 標準クロソイド指数 */
  --corner-shape-soft: superellipse(2);   /* より丸寄り */
  --corner-shape-hard: superellipse(3.5); /* よりスクエア寄り（大カード・パネル向け） */
}

/* 全要素にデフォルト適用 */
* {
  corner-shape: var(--corner-shape);
}

/* 既存の border-radius と組み合わせて使う */
.card {
  border-radius: 12px;
  corner-shape: var(--corner-shape);
}
.panel {
  border-radius: 24px;
  corner-shape: var(--corner-shape-hard);  /* 大きい radius ではより四角く */
}
```

### radius スケール

| Token | 値 | 用途 |
|-------|----|------|
| `--r-sm` | 8px  | インプット・小さいタイル |
| `--r`    | 12px | 標準カード・ボタン |
| `--r-lg` | 20px | 大カード |
| `--r-xl` | 28px | セクションパネル |
| `--r-pill` | 999px | バッジ・ピル形状（stadium 形なので corner-shape は無効） |

> **Flat 版では旧 6 / 8px から 8 / 12 / 20 / 28px に移行**。クロソイド形状は radius が大きいほど効果が見えるため、従来より気持ち大きめの値で揃える。

### フォールバック

`corner-shape` 未対応ブラウザでは通常の `border-radius`（円弧）にフォールバックされる。視覚劣化のみで機能影響なし。Safari Tech Preview / Chrome（flag）で確認可能。

```css
@supports not (corner-shape: superellipse(2.5)) {
  /* 既存 border-radius がそのまま使われる。追加対応不要 */
}
```

---

## 5. スペーシングシステム

**基本は 8pt グリッド**。密度の高い UI / ダッシュボード / データテーブル等では **4pt 補助グリッド**（`space-1: 4px` をベースに 4 / 12 / 20 / 28px 等）を限定的に許可する。サイト・プレゼン・コンテンツページでは 8pt グリッドのみで揃える。

| Token | Value | 用途 |
|-------|-------|------|
| `space-1` | 4px | 4pt 補助単位（高密度 UI 専用）。アイコン・ラベル間の最小余白 |
| `space-2` | 8px | コンパクトな内部余白 |
| `space-3` | 12px | インプット・バッジなどの内部余白 |
| `space-4` | 16px | 標準的な内部余白（padding） |
| `space-6` | 24px | カード内の余白・セクション内の区切り |
| `space-8` | 32px | セクション間の余白 |
| `space-12` | 48px | 大きなセクション区切り |
| `space-16` | 64px | ページレベルの余白 |
| `space-24` | 96px | ヒーロー・大見出し周辺 |

---

## 6. コンポーネント仕様

### カード

背景色のコントラストで区切りを表現する。ボーダーは使わない。

```css
.card {
  background: var(--color-surface);   /* white背景に対してsurfaceが浮き上がる */
  border-radius: 8px;
  padding: 24px;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1),
              transform  150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  background: var(--color-surface-2); /* ホバーで1段階濃くなる */
  transform: translateY(-1px);
}

/* 強調カード — surface-2 を初期背景に使う */
.card-accent { background: var(--color-surface-2); }

/* ダークカード — テキストカラーを背景に使う */
.card-dark { background: var(--color-text); color: var(--color-text-inverse); }
```

### ボタン

```css
/* Primary — メインCTA（最高コントラスト） */
.btn-primary {
  background: var(--color-text);       /* #35362D — 最も暗い */
  color: var(--color-text-inverse);
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.82; }

/* Secondary — サブアクション */
.btn-secondary {
  background: var(--color-surface);    /* surfaceで白背景から浮かせる */
  color: var(--color-text);
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
}
.btn-secondary:hover { background: var(--color-surface-2); }

/* Accent — 特別なアクション */
.btn-accent {
  background: var(--color-surface-2);
  color: var(--color-text);
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
}
.btn-accent:hover { background: var(--color-border); }
```

### テキストリンク

本文中（段落・リスト・テーブルセル）の `<a>` には**下線を引く**。CTA ボタン（`.btn`）やカード型リンク（`.card`）は下線なしのまま、テキストフローに混じる外部 URL や内部参照だけ視覚的に区別する。

| プロパティ | 値 | 理由 |
|---|---|---|
| `text-decoration` | `underline` | リンクであることを明示 |
| `text-decoration-color` | `var(--color-text-muted)` | 主張しすぎない控えめな線色 |
| `text-decoration-thickness` | `1px` | 全体の細線トーンに合わせる |
| `text-underline-offset` | `0.22em` | 日本語のディセンダーと衝突しない余白 |
| hover 時 | 線色 → `var(--color-text)` / 太さ → `1.5px` | わずかに強調 |

```css
:where(p, li, td) a:not(.btn):not(.card) {
  text-decoration: underline;
  text-underline-offset: 0.22em;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--color-text-muted);
}
:where(p, li, td) a:not(.btn):not(.card):hover {
  text-decoration-color: var(--color-text);
  text-decoration-thickness: 1.5px;
}
```

> サイドバー TOC やヒーロー CTA など、**コンポーネント自体がクリック可能領域を持つ**ものは下線対象外（既に視覚的に分かる）。

### テーブル

行区切りはボーダーでなく背景色の交互表示で表現する。

```css
.table-wrap { border-radius: 8px; overflow: hidden; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.table th {
  background: var(--color-surface-2);  /* ヘッダーは1段濃く */
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 16px;
  text-align: left;
}
.table td {
  padding: 12px 16px;
  color: var(--color-text);
  background: var(--color-surface);
}
.table tr:nth-child(even) td {
  background: var(--color-surface-2);  /* 偶数行で濃さが交互に */
}
```

### バッジ / ステータスタグ

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.badge-default  { background: var(--color-surface-2); color: var(--color-text-muted); }
.badge-success  { background: #DCFCE7; color: #15803D; }
.badge-warning  { background: #FEF3C7; color: #B45309; }
.badge-error    { background: #FEE2E2; color: #B91C1C; }
.badge-accent   { background: var(--color-accent-light); color: #8B6914; }
```

### インプット / フォーム

フィールド背景に surface を使い、白ページ上で自然に浮かび上がらせる。

```css
.input {
  width: 100%;
  padding: 10px 14px;
  background: var(--color-surface);   /* ページ背景(白)との差でフィールドを示す */
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--color-text);
  transition: background 150ms ease, box-shadow 150ms ease;
}
.input:focus {
  outline: none;
  background: var(--color-bg);        /* フォーカス時は白に戻り、リングで強調 */
  box-shadow: 0 0 0 3px rgba(53,54,45,0.12);
}
.input::placeholder { color: var(--color-text-light); }
```

---

## 7. レイアウト

### グリッドシステム

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* よく使うグリッド */
.col-4  { grid-column: span 4; }   /* 3カラム */
.col-6  { grid-column: span 6; }   /* 2カラム */
.col-8  { grid-column: span 8; }   /* メインコンテンツ */
.col-12 { grid-column: span 12; }  /* フル幅 */
```

### 比率システム

要素の分割・比率には用途に応じて 2 つの比率を使い分ける。黄金比・青銅比は採用しない（落ち着き・編集的トーンを優先するため）。

| 比率 | 値 | 主な用途 | 印象 |
|------|----|---------|------|
| 白銀比 | 1 : √2 ≒ 1 : 1.414 | サイドバー : メイン、ダッシュボード分割、2 カラムコンテンツ、A4 比率パネル | 静か・端正・知的・整う |
| プラスチック数 | 1 : ρ ≒ 1 : 1.325 | カード比率、画像枠、モジュール、パネルの縦横感 | 柔らかい・自然・少し有機的・人間的 |

```css
/* 白銀比 √2 — 編集的・端正な分割 */
.layout-silver  { grid-template-columns: 1fr 1.414fr; } /* 41.4% : 58.6% */

/* プラスチック数 — 柔らかい・自然な分割（カード・モジュール向き） */
.layout-plastic { grid-template-columns: 1fr 1.325fr; } /* 43.0% : 57.0% */
```

### ダッシュボードレイアウト

```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr 1.414fr;  /* 白銀比 √2 — sidebar : content */
  min-height: 100vh;
}
.sidebar {
  background: var(--color-accent-dark);
  color: #FFFFFF;
  padding: 24px 0;
}
.main-content {
  background: var(--color-bg);
  padding: 32px;
  overflow-y: auto;
}
```

### プレゼンテーション

- アスペクト比: **16:9**（1920×1080px 基準）
- 安全マージン: 上下左右 80px
- タイトルスライド: ページ中央揃え + 大きな余白
- コンテンツスライド: 左上から始まるフロー、最大3〜4要素/スライド

---

## 8. アニメーション・トランジション

```css
:root {
  --transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ホバー効果 */
.interactive:hover {
  opacity: 0.8;
  transition: opacity var(--transition-fast);
}

/* カードのリフト */
.card-hover:hover {
  transform: translateY(-2px);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
```

---

## 9. データビジュアライゼーション

### チャート全般ルール

- **グリッドライン**: 薄い水平線のみ（`#E5E5E5`、opacity 0.6）。縦線は原則なし
- **軸ラベル**: `0.75rem`、`--color-text-muted`、簡潔に
- **ツールチップ**: カード仕様と同様（surface bg + 1px border + shadow）
- **凡例**: グラフの外・上部右寄せ、または下部中央
- **ゼロライン**: `1px solid --color-border-dark` で強調

### Recharts（React）設定例

```jsx
const chartColors = ['#E6E2D7', '#C4C1B0', '#82837A', '#F3F1EE', '#35362D'];

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
    <XAxis dataKey="name" tick={{ fill: '#767676', fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: '#767676', fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip
      contentStyle={{
        background: '#F8F8F8',
        border: '1px solid #E5E5E5',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        fontSize: '0.875rem',
      }}
    />
    <Bar dataKey="value" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## 10. DO / DON'T

### DO ✓

- 余白を惜しまない — 要素間は思い切って広めに
- テキスト階層は最大3段階（H2 → H3 → Body）
- データには必ずラベルと単位を付ける
- `Gen Interface JP` を本文・UI、`Gen Interface JP Display` を見出しに使う（和文・欧文を 1 ファミリで揃える）
- border-radius は `6px`（小）または `8px`（標準）で統一
- アイコンは `lucide-react` を優先使用
- **要素の区切りは背景色の段差で表現する**（bg → surface → surface-2 → text）
- **ダークヘッダー・ダークサイドバーには `var(--color-text)` を使う**（最大コントラスト）
- **関連する要素は近接でグループ化する**（ゲシュタルト「近接」）— カード内の要素間は 8〜16px、グループ間は 32px 以上で間を取る
- **ヒーロー・キービジュアルは五分割法に基づき配置する** — 縦横を 5 分割した交点（1/5 ライン）に主役を置く
- **同種の情報は同じ視覚スタイルで揃える**（ゲシュタルト「類同」）— KPI カードは色・余白・フォントを揃え、差を作る時は意図を持たせる

### DON'T ✗

- アクセントカラーを同時に3色以上使わない
- `border-radius` を `12px` 超にしない（丸すぎるとブランドイメージと乖離）
- 同一コンポーネントに `box-shadow` を2つ以上重ねない
- フォントサイズを `0.75rem (12px)` 未満にしない
- グラデーションを多用しない（単色で成立させる）
- CSSアニメーションを `300ms` 超にしない（UIが重く感じる）
- 背景に複数の色を敷かない（白 or surface のみ）
- **構造的な区切りに `border` を使わない**（コントラストで代替する）
- **`box-shadow` を枠線の代わりに使わない**（影はあくまで奥行き表現）

---

## 11. アクセシビリティ

- テキストと背景のコントラスト比: **4.5:1 以上**（WCAG AA準拠）
- フォーカス可視化: `focus-visible` スタイルを必ず設定
- インタラクティブ要素の最小サイズ: `44×44px`
- エラーメッセージは色だけでなくテキストでも伝える

---

## 12. デザイン原則（理論セクション）

定量的なルール（グリッド・スケール・比率）に加えて、配置と認知のために守る原則をまとめる。AI 出力・人手制作のどちらでも判断基準として使う。

### 11-1. ゲシュタルト原則（情報整理の四原則）

人がレイアウトを読み取るときの基礎則。最低限この 4 つだけ守れば、線で囲わなくても情報の塊と階層が伝わる。

| 原則 | 意味 | 実装ガイド（具体） |
|---|---|---|
| **近接 (Proximity)** | 近い要素は仲間に見える | カード内要素間 8〜16px、グループ間 32〜48px。グループの境界はボーダーでなく余白で示す |
| **類同 (Similarity)** | 同じ見た目の要素は同じ役割に見える | KPI カードはサイズ・色・余白を揃える。CTA ボタンは画面内で 1 種類の見た目に統一 |
| **連続 (Continuity)** | 視線は線の流れに沿って動く | 見出し → 本文 → CTA を縦軸 or Z 字に乗せる。複数カラムでは行頭を揃える |
| **図と地 (Figure / Ground)** | 前景と背景が明確だと迷わない | `--color-bg` → `--color-surface` → `--color-surface-2` の段階的なコントラストで前景を浮かせる（境界線でなく面で区切る） |

> **使用箇所**: サイト全般、ダッシュボード、プレゼン資料の情報整理。

### 11-2. 五分割法（ヒーロー・キービジュアル）

主役（写真・大見出し・KV）の配置に使う。画面を縦横それぞれ 5 等分した「**1/5 ライン**」と「**交点**」に主要素を乗せると、編集的で品のある余白が生まれる。三分割よりさらに余白寄りで、ファッション・モード・アート寄りのトーンに向く。

```css
/* ヒーローセクション — 5x5 グリッドのアンカーに主役を配置 */
.hero {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows:    repeat(5, 1fr);
  aspect-ratio: 16 / 9;
  min-height: 540px;
}
.hero-headline {
  /* 左 1/5 ラインから始め、上 2/5〜4/5 に主役テキストを置く */
  grid-column: 2 / span 3;
  grid-row:    2 / span 2;
}
.hero-image {
  /* 右下 1/5 領域に視線誘導のサブビジュアル */
  grid-column: 4 / span 2;
  grid-row:    4 / span 2;
  align-self: end;
}
```

> **使用箇所**: ヒーローセクション、キービジュアル、スライドの大見出しとビジュアルの関係、アート寄りレイアウト。
> **印象**: 洗練・余白・編集的・モード感。

### 11-3. ヴァン・デ・グラーフ・カノン / 写本比率（プレゼン・章扉）

ページ全体に対するテキストエリアの **古典的な配置比率**。中世写本に由来し、上 1/9・外 1/9・下 2/9・内 2/9 の余白で「下重心の上品な紙面」が出る。プレゼン・提案書・コンセプト説明スライドに有効。

```css
/* A4 縦比率の章扉スライド — Van de Graaf 近似 */
.canon-slide {
  aspect-ratio: 1 / 1.414;     /* 白銀比（A4） */
  padding: 11.1% 22.2% 22.2% 11.1%;  /* top / right / bottom / left = 1/9 / 2/9 / 2/9 / 1/9 */
  background: var(--color-bg);
}

/* 横長 16:9 でも比率を保ちたい場合は内側マージンを揃える */
.canon-slide-16x9 {
  aspect-ratio: 16 / 9;
  padding: 11.1% 22.2% 22.2% 11.1%;
}
```

> **使用箇所**: タイトルスライド、コンセプト説明、提案書の章扉、写真大きめのページ。
> **強み**: 余白が上品・下重心・エディトリアル感・「呼吸している紙面」になる。
> **注意**: HTML/CSS では紙面比率を厳密に守れないため `padding` の比率近似で表現する。

---

## 13. ファイル・フォルダ構成（参考）

```
project/
├── CLAUDE.md          ← Claude Code への指示（CLAUDE_template.md を基に作成）
├── design.md          ← このファイルをコピー（or 参照）
├── src/
│   ├── styles/
│   │   ├── tokens.css     ← CSS変数定義
│   │   └── components.css ← コンポーネントスタイル
│   └── components/
└── ...
```

---

*最終更新: 2026-04-20 | instyle.group Creative Team*
