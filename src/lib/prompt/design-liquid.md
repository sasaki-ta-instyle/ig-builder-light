# instyle.group Design System — Liquid Glass

instyle.group の "Liquid Glass" 系デザインガイド。ベースの instyle.group ブランド（warm neutral）を保ちつつ、半透明・blur・スペキュラハイライトで奥行きと光沢を表現する。

> このドキュメントは **liquid 系プロジェクト専用**。フラット版は `../design-system/design.md` を参照。

---

## 1. Design Philosophy

- **Less is more** — 余白と静けさがブランドの格を上げる（共通）
- **Depth through translucency** — 区切りは「色の段差」ではなく「半透明レイヤー＋blur」で表現する
- **Specular highlights** — ガラス特有の上端ハイライト（白 1px インセット）を要素の輪郭に必ず入れる
- **Warm ambient base** — ページ背景は単色塗りではなく、`#EDE9E0` の上に楕円グラデーションを重ねた "scene" として扱う
- **Soft motion** — 標準は ease-out、特別な瞬間にだけ spring イージング

> Flat 版との違い：Flat は「背景色のコントラストで区切る」。Liquid は「**半透明のガラスを重ねて、blur と highlight で区切る**」。

---

## 2. カラーパレット

### CSS Variables — ベース

```css
:root {
  /* Backgrounds — warm neutral base */
  --color-bg:          #EDE9E0;   /* ページ背景（scene-bg ベース） */
  --color-surface:     #F3F1EE;
  --color-surface-2:   #E6E2D7;
  --color-surface-3:   #E1DCD0;

  /* Text */
  --color-text:         #35362D;
  --color-text-muted:   #82837A;
  --color-text-light:   #C4C1B0;
  --color-text-inv:     #F3F1EE;   /* dark glass 上のテキスト */

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

**本文中で「立たせたい語句」を蛍光ペンで線引くようにポイント的にマーキングする用途のみ**。CTA / アイコン背景 / 見出し全体 / glass-panel の塗り など面要素には使わない。1 ページに 2〜3 箇所まで。

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

> Liquid 文脈では glass の半透明と相性が悪いので、`mark` は **glass-panel の中の本文段落の中**で使う。glass 自体の塗りや border に黄色を使うのは禁止。

### CSS Variables — Glass トークン（Liquid の核）

```css
:root {
  /* Material fills — 4 種類のガラス */
  --glass-light:    rgba(255, 255, 255, 0.55);   /* 純白ガラス・最も明るい */
  --glass-warm:     rgba(243, 241, 238, 0.58);   /* 暖色ガラス・標準 */
  --glass-tinted:   rgba(196, 193, 176, 0.42);   /* アクセント色のガラス */
  --glass-dark:     rgba( 32,  33,  26, 0.78);   /* ダークガラス・サイドバー/ヘッダー用 */

  /* Borders — 白に近いほど"明るい"ガラス */
  --glass-border-l: rgba(255, 255, 255, 0.80);   /* light */
  --glass-border-w: rgba(255, 255, 255, 0.62);   /* warm */
  --glass-border-d: rgba(255, 255, 255, 0.13);   /* dark glass 用 */

  /* Backdrop blur 強度 */
  --glass-blur-sm:  saturate(180%) blur(16px);
  --glass-blur:     saturate(200%) blur(24px);
  --glass-blur-lg:  saturate(220%) blur(40px);

  /* Drop shadow（多層） */
  --glass-shadow-sm: 0 2px 12px  rgba(53,54,45,.09), 0 1px 4px  rgba(53,54,45,.07);
  --glass-shadow:    0 8px 32px  rgba(53,54,45,.11), 0 2px 8px  rgba(53,54,45,.08);
  --glass-shadow-lg: 0 20px 64px rgba(53,54,45,.16), 0 4px 16px rgba(53,54,45,.10);

  /* Specular highlight（上下の白/黒インセット） */
  --glass-hl:    inset 0 1px 0 rgba(255,255,255,.90), inset 0 -1px 0 rgba(0,0,0,.055);
  --glass-hl-d:  inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.22);
}
```

### Ambient scene 背景（必須）

ページ全体の "下地" として、固定の楕円グラデーション層を入れる。これがないと glass の透過効果が貧弱に見える。

```html
<div class="scene-bg"></div>
```

```css
.scene-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #EDE9E0;
  overflow: hidden;
  pointer-events: none;
}
.scene-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 72% 65% at  8%  6%, rgba(196,193,176,.58) 0%, transparent 55%),
    radial-gradient(ellipse 55% 55% at 94% 10%, rgba(230,226,215,.65) 0%, transparent 52%),
    radial-gradient(ellipse 52% 68% at 78% 88%, rgba(196,193,176,.42) 0%, transparent 55%),
    radial-gradient(ellipse 66% 46% at 18% 92%, rgba(230,226,215,.52) 0%, transparent 55%),
    radial-gradient(ellipse 42% 42% at 50% 48%, rgba(243,241,238,.32) 0%, transparent 52%);
}
/* 本体コンテンツは z-index:1 以上で scene-bg の上に重ねる */
.page-header, .nav-wrap, .container, footer { position: relative; z-index: 1; }
```

### チャート用カラーシーケンス

| 順序 | HEX | 用途 |
|------|-----|------|
| 1 | `#E6E2D7` | メインデータ系列 |
| 2 | `#C4C1B0` | サブデータ系列 |
| 3 | `#82837A` | 第3系列 |
| 4 | `#F3F1EE` | 第4系列 |
| 5 | `#35362D` | 第5系列 |

> Liquid の場合、棒グラフ等にも `border: 1px solid rgba(255,255,255,.45)` と `backdrop-filter: blur(4px)` を入れて軽くガラス化する。

---

## 3. タイポグラフィ

### フォントファミリー

UI / 本文は **Gen Interface JP**、見出しは **Gen Interface JP Display** を使う。和文・欧文を 1 ファミリで賄うため、従来の `Lato + Noto Sans JP` 構成は廃止した。Liquid Glass の繊細なエッジや光沢演出と Gen Interface JP の落ち着いた字面が相性がよい。明朝（Shippori Mincho）は**オプトイン**で、glass パネル内の本文段落で明示指示があったときのみ別途読み込む。

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

### タイプスケール（モジュラースケール / Perfect Fourth 1.333・base 14px）

倍率 **1.333**（Perfect Fourth）を採用。Flat 版（1.25）よりジャンプ率が大きく、エディトリアル・少しドラマのある印象。Liquid Glass の光沢・演出感と整合する。

| 用途 | px | rem | Weight | Line-height | Letter-spacing |
|------|-----|------|--------|-------------|----------------|
| Display | 59px | 3.6875rem | 100 | 1.00 | -0.03em |
| H1 | 44px | 2.75rem    | 300 | 1.05 | -0.02em |
| H2 | 33px | 2.0625rem  | 500 | 1.15 | -0.01em |
| H3 | 25px | 1.5625rem  | 600 | 1.25 | 0 |
| H4 | 19px | 1.1875rem  | 600 | 1.40 | 0 |
| Body | 14px | 0.875rem  | 400 | 1.70 | 0 |
| Small | 11px | 0.6875rem | 400 | 1.50 | 0 |
| Caption | 8px | 0.5rem    | 400 | 1.40 | 0 |

> **Flat 版とは別スケール**（Flat = 1.25 / Liquid = 1.333）。両方の design.md を取り違えないこと。
> Caption（8px）はチャート目盛り・脚注専用、本文の最小推奨は Small（11px）。

### 日本語テキストの注意点

- `font-feature-settings: "palt"` を有効にして字詰めを最適化
- 行長は 40〜60文字（全角換算）
- 見出し `letter-spacing: -0.02em` / 本文 `letter-spacing: 0.01em`

---

## 4. スペーシングシステム（Flat と共通）

**基本は 8pt グリッド**。密度の高い UI / ダッシュボード / データテーブル等では **4pt 補助グリッド**（`space-1: 4px` をベースに 4 / 12 / 20 / 28px 等）を限定的に許可。サイト・プレゼン・コンテンツページでは 8pt のみで揃える。

| Token | Value | 用途 |
|-------|-------|------|
| `space-1` | 4px | 4pt 補助単位（高密度 UI 専用）。アイコンとラベルの間 |
| `space-2` | 8px | コンパクトな内部余白 |
| `space-3` | 12px | インプット・バッジ |
| `space-4` | 16px | 標準的な内部余白 |
| `space-6` | 24px | カード内の余白 |
| `space-8` | 32px | セクション間 |
| `space-12` | 48px | 大きなセクション区切り |
| `space-16` | 64px | ページレベル余白 |
| `space-24` | 96px | ヒーロー周辺 |

### Border radius — Liquid 専用スケール（クロソイド式 / Squircle）

**角丸はすべて連続曲率（クロソイド式 = superellipse）を使う**。通常の円弧角丸（曲率が 0 → 1/r に不連続にジャンプ）ではなく、曲率が滑らかに立ち上がる "Apple iOS 風" の squircle 形状で統一する。Liquid の柔らかい光沢と整合する。

```css
:root {
  --r-sm:   10px;   /* インプット・小さいタイル */
  --r:      16px;   /* カード標準 */
  --r-lg:   24px;   /* 大カード・パネル */
  --r-xl:   32px;   /* セクションラッパー（glass-panel） */
  --r-pill: 999px;  /* ボタン・バッジ・ナビ */

  /* クロソイド指数（CSS Borders Level 4 / corner-shape） */
  --corner-shape:      superellipse(2.5);  /* 標準 — iOS 連続コーナー相当 */
  --corner-shape-soft: superellipse(2);    /* 丸寄り */
  --corner-shape-hard: superellipse(3.5);  /* スクエア寄り（大カード・パネル） */
}

/* 全要素にデフォルト適用 */
* { corner-shape: var(--corner-shape); }

/* 大きめ radius（glass-panel 等）はやや角張った曲率を使うと iOS 感が増す */
.glass-panel,
.dashboard,
.canon-slide {
  corner-shape: var(--corner-shape-hard);
}
```

> Flat 版（8/12/20/28px）より大きめの radius を使う。glass の柔らかさと整合させる。
> `corner-shape` 未対応ブラウザでは通常の円弧 `border-radius` にフォールバックされる（視覚劣化のみ）。Safari Tech Preview / Chrome（flag）で確認可能。

---

## 5. コンポーネント仕様

### Glass Panel（セクションラッパー）

セクションを囲うガラスの板。`glass-panel` で全セクションを統一感のある "薄い板" に揃える。

```css
.glass-panel {
  background: rgba(243,241,238,.50);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-w);
  box-shadow: var(--glass-hl), var(--glass-shadow);
  border-radius: var(--r-xl);
  padding: 36px;
  position: relative;
  overflow: hidden;
}
/* 上端のスペキュラ・ライン（必須） */
.glass-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.85) 50%, transparent);
  pointer-events: none;
}
```

### カード

```css
.card {
  background: rgba(243,241,238,.56);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid rgba(255,255,255,.72);
  box-shadow: var(--glass-hl), var(--glass-shadow-sm);
  border-radius: var(--r);
  padding: 24px;
  transition: all var(--ease-out);
  position: relative;
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.88) 50%, transparent);
}
.card:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,.66);
  box-shadow: var(--glass-hl), 0 16px 40px rgba(53,54,45,.13);
}

/* 強調カード — tinted ガラス */
.card-accent { background: rgba(196,193,176,.42); border-color: rgba(255,255,255,.65); }
.card-accent:hover { background: rgba(196,193,176,.60); }

/* ダークカード — dark ガラス */
.card-dark {
  background: var(--glass-dark);
  border: 1px solid var(--glass-border-d);
  box-shadow: var(--glass-hl-d), 0 8px 28px rgba(53,54,45,.22);
  color: var(--color-text-inv);
}
.card-dark::before { background: linear-gradient(90deg, transparent, rgba(255,255,255,.20) 50%, transparent); }
```

### ボタン（Pill 形状）

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: var(--r-pill);
  font-size: .875rem;
  font-weight: 500;
  letter-spacing: .01em;
  cursor: pointer;
  border: none;
  transition: all var(--ease-out);
}

/* Primary — dark ガラス */
.btn-primary {
  background: rgba(32,33,26,.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--color-text-inv);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: var(--glass-hl-d), 0 4px 16px rgba(53,54,45,.28);
}
.btn-primary:hover {
  background: rgba(53,54,45,.90);
  transform: translateY(-1px);
  box-shadow: var(--glass-hl-d), 0 8px 24px rgba(53,54,45,.34);
}

/* Secondary — warm ガラス */
.btn-secondary {
  background: rgba(243,241,238,.65);
  backdrop-filter: blur(16px);
  color: var(--color-text);
  border: 1px solid rgba(255,255,255,.78);
  box-shadow: var(--glass-hl), var(--glass-shadow-sm);
}
.btn-secondary:hover {
  background: rgba(255,255,255,.82);
  transform: translateY(-1px);
}

/* Accent — tinted ガラス */
.btn-accent {
  background: rgba(196,193,176,.48);
  backdrop-filter: blur(16px);
  color: var(--color-text);
  border: 1px solid rgba(255,255,255,.68);
  box-shadow: var(--glass-hl), var(--glass-shadow-sm);
}

/* Ghost — 透明 */
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid transparent;
}
.btn-ghost:hover {
  background: rgba(243,241,238,.52);
  color: var(--color-text);
  border-color: rgba(255,255,255,.62);
  backdrop-filter: blur(12px);
}

.btn-sm { padding: 6px 16px; font-size: .8125rem; }
.btn-lg { padding: 14px 30px; font-size: 1rem; }
```

### テキストリンク

本文中（段落・リスト・テーブルセル）の `<a>` には**下線を引く**。CTA ボタン（`.btn`）やカード型リンク（`.card`）、Pill Nav は下線なしのまま、glass パネル内の本文テキストに混じる外部 URL や内部参照だけ視覚的に区別する。

| プロパティ | 値 | 理由 |
|---|---|---|
| `text-decoration` | `underline` | リンクであることを明示 |
| `text-decoration-color` | `var(--color-text-muted)` | glass の半透明背景と相性が良い控えめな線色 |
| `text-decoration-thickness` | `1px` | Liquid 全体の繊細なエッジ表現と調和 |
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

> Floating Pill Nav やヒーロー CTA、glass card など**コンポーネント自体がクリック可能領域を持つ**ものは下線対象外。下線は **glass パネル内の本文インラインリンク専用**として運用する。

### Floating Pill Nav

ナビゲーションは「ページ上部に浮いている薬カプセル状のガラス」として実装する。

```css
.nav-wrap {
  display: flex;
  justify-content: center;
  padding: 0 24px;
  margin: 20px 0;
  position: sticky;
  top: 16px;
  z-index: 100;
}
.nav {
  display: inline-flex;
  gap: 2px;
  padding: 6px;
  background: rgba(243,241,238,.68);
  backdrop-filter: saturate(220%) blur(32px);
  border: 1px solid rgba(255,255,255,.80);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.92), inset 0 -1px 0 rgba(0,0,0,.05),
              0 8px 32px rgba(53,54,45,.14);
  border-radius: var(--r-pill);
}
.nav a {
  display: block;
  padding: 8px 18px;
  font-size: .8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--r-pill);
  transition: all var(--ease-out);
}
.nav a:hover {
  color: var(--color-text);
  background: rgba(255,255,255,.60);
}
```

### バッジ

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--r-pill);
  font-size: .75rem;
  font-weight: 500;
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
}
.badge-default { background: rgba(196,193,176,.38); color: var(--color-text-muted); border-color: rgba(255,255,255,.58); }
.badge-success { background: rgba( 22,163, 74,.14); color: #15803D; border-color: rgba(22,163,74,.24); }
.badge-warning { background: rgba(217,119,  6,.14); color: #B45309; border-color: rgba(217,119,6,.24); }
.badge-error   { background: rgba(198, 41, 44,.12); color: #B91C1C; border-color: rgba(198,41,44,.22); }
.badge-info    { background: rgba( 37, 99,235,.12); color: #1D4ED8; border-color: rgba(37,99,235,.22); }
.badge-accent  { background: rgba(130,131,122,.28); color: var(--color-text); border-color: rgba(255,255,255,.52); }
```

### テーブル

```css
.table-wrap {
  border-radius: var(--r);
  overflow: hidden;
  background: rgba(243,241,238,.50);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,.68);
  box-shadow: var(--glass-hl), var(--glass-shadow);
}
table { width: 100%; border-collapse: collapse; font-size: .875rem; }
th {
  background: rgba(230,226,215,.60);
  color: var(--color-text-muted);
  font-size: .6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  padding: 12px 16px;
  text-align: left;
}
td { padding: 12px 16px; color: var(--color-text); background: transparent; }
tr:nth-child(even) td { background: rgba(230,226,215,.28); }
tr:not(:last-child) td { border-bottom: 1px solid rgba(255,255,255,.42); }
```

### インプット

```css
.input {
  width: 100%;
  padding: 10px 16px;
  background: rgba(255,255,255,.55);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.78);
  border-radius: var(--r-sm);
  font-size: .875rem;
  color: var(--color-text);
  transition: all 150ms ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 2px 8px rgba(53,54,45,.06);
}
.input:focus {
  outline: none;
  background: rgba(255,255,255,.78);
  border-color: rgba(255,255,255,.92);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95),
              0 0 0 3px rgba(196,193,176,.38),
              0 2px 8px rgba(53,54,45,.08);
}
.input::placeholder { color: var(--color-text-light); }
```

---

## 6. レイアウト

### コンテナ・グリッド

```css
.container { max-width: 1100px; margin: 0 auto; padding: 48px 32px 80px; }

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}
.col-4  { grid-column: span 4; }
.col-6  { grid-column: span 6; }
.col-8  { grid-column: span 8; }
.col-12 { grid-column: span 12; }
```

### 比率システム

要素の分割・比率には用途に応じて 2 つの比率を使い分ける。黄金比・青銅比は採用しない。

| 比率 | 値 | 主な用途 | 印象 |
|------|----|---------|------|
| 白銀比 | 1 : √2 ≒ 1 : 1.414 | サイドバー : メイン、ダッシュボード分割、2 カラム、A4 比率パネル | 静か・端正・知的・整う |
| プラスチック数 | 1 : ρ ≒ 1 : 1.325 | カード比率、画像枠、glass-panel の縦横感、モジュール | 柔らかい・自然・少し有機的 |

```css
.layout-silver  { grid-template-columns: 1fr 1.414fr; } /* 白銀比 */
.layout-plastic { grid-template-columns: 1fr 1.325fr; } /* プラスチック数 */
```

### Dashboard レイアウト（Glass）

```css
.dashboard {
  border-radius: var(--r-xl);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1.414fr;  /* 白銀比 √2 */
  border: 1px solid rgba(255,255,255,.55);
  box-shadow: 0 24px 72px rgba(53,54,45,.18);
}
.sidebar {
  background: rgba(28, 29, 22, .84);
  backdrop-filter: var(--glass-blur-lg);
  border-right: 1px solid rgba(255,255,255,.10);
  padding: 24px 0;
}
.main {
  background: rgba(237,233,224,.68);
  backdrop-filter: saturate(180%) blur(24px);
  padding: 24px;
}
```

### プレゼンテーション

- アスペクト比 16:9（1920×1080px 基準）
- 安全マージン 上下左右 80px
- スライド本体に `glass-panel` を 1 枚敷くと統一感が出る

---

## 7. アニメーション・トランジション

```css
:root {
  --ease-out:    250ms cubic-bezier(.4, 0, .2, 1);    /* 標準 */
  --ease-spring: 380ms cubic-bezier(.34, 1.56, .64, 1); /* 特別な瞬間（モーダル登場・成功演出） */
}
```

- ホバー: `translateY(-1px)` + shadow 強調が定番
- デフォルトは `var(--ease-out)`、ぴょこっと跳ねさせたい時だけ `var(--ease-spring)`
- アニメ Duration は **400ms 以下** に収める

---

## 8. データビジュアライゼーション

チャートエリアも glass-panel と同じ素材で囲う。

```css
.chart-area {
  background: rgba(243,241,238,.48);
  backdrop-filter: var(--glass-blur-sm);
  border: 1px solid rgba(255,255,255,.66);
  box-shadow: var(--glass-hl), 0 4px 20px rgba(53,54,45,.08);
  border-radius: var(--r);
  padding: 24px;
}
```

棒グラフ自体にも軽くガラス感を：

```css
.bar {
  border-radius: 6px 6px 0 0;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.45);
  transition: opacity 150ms ease;
}
.bar:hover { opacity: .72; }
```

Recharts なら `Tooltip` の contentStyle に `backdropFilter: 'blur(12px)'` と `background: 'rgba(255,255,255,0.85)'` を入れるとガラス感が出る。

---

## 9. DO / DON'T

### DO ✓

- **すべてのガラス要素に `backdrop-filter` と上端のスペキュラ・ハイライトをセットで入れる**
- `--glass-light` / `--glass-warm` / `--glass-tinted` / `--glass-dark` の **4 種類だけ**を使い分ける
- ボタン・バッジ・ナビは `--r-pill`、カード類は `--r:16px`、セクションラッパーは `--r-xl:32px` で統一
- ホバーは `translateY(-1px)` ＋ shadow を 1 段強くする
- `scene-bg` を **必ず**ページ最下層に敷く（無いと glass がのっぺり見える）
- ダーク面（`--glass-dark`）には `--glass-hl-d`、ライト面には `--glass-hl` を使い分ける
- iridescent prismatic strip（虹色グラデ）はヒーロー・ダークパネルの上層にだけ使う
- **関連する要素は近接でグループ化**（ゲシュタルト「近接」）— カード内 8〜16px、グループ間 32〜48px
- **ヒーロー・キービジュアルは五分割法に基づき配置**（縦横を 5 分割した交点 / 1/5 ラインに主役）
- **同種の情報は同じ glass material で揃える**（ゲシュタルト「類同」）— KPI カードは glass-warm で統一、強調だけ glass-tinted に切り替える

### DON'T ✗

- 不透明 1 色のカードを使わない（必ず alpha < 1.0 と `backdrop-filter`）
- `border: 1px solid var(--color-border)` のような **不透明ボーダー**を使わない（ガラスの輪郭は `rgba(255,255,255,.x)`）
- glass の透明度を `.30` 未満にしない（読みづらくなる）
- 同一画面で 4 種以上の glass material を使わない
- `box-shadow` を使わずに blur だけで済ませない（スペキュラハイライトと shadow がセット）
- フォント・タイポスケールを Flat と変えない（ブランド統一）
- アニメ Duration を 400ms 超にしない

---

## 10. アクセシビリティ

- 半透明背景の上でもテキスト/背景のコントラスト比 **4.5:1 以上** を確保（必要なら glass の opacity を上げる）
- `backdrop-filter` 非対応ブラウザ用に **fallback として不透明色**を `background-color` に指定
- フォーカス可視化: `focus-visible` で `box-shadow` リング（`0 0 0 3px rgba(196,193,176,.38)` など）
- インタラクティブ要素の最小サイズ `44×44px`
- iridescent strip 等の装飾は意味を持たせない（情報伝達はテキスト・コントラスト・色名で）

### `backdrop-filter` 非対応の fallback

```css
@supports not (backdrop-filter: blur(1px)) {
  .card, .btn-primary, .btn-secondary, .glass-panel {
    background: var(--color-surface);  /* 不透明色に置き換え */
  }
}
```

---

## 11. デザイン原則（理論セクション）

定量的なルール（グリッド・スケール・比率・ガラス材質）に加えて、配置と認知のために守る原則をまとめる。AI 出力・人手制作のどちらでも判断基準として使う。

### 11-1. ゲシュタルト原則（情報整理の四原則）

| 原則 | 意味 | Liquid 流の実装ガイド |
|---|---|---|
| **近接 (Proximity)** | 近い要素は仲間に見える | カード内要素間 8〜16px、グループ間 32〜48px。同じ glass-panel の中に入れることで「仲間」を強化 |
| **類同 (Similarity)** | 同じ見た目は同じ役割に見える | 同列の要素は同じ glass material（warm / tinted / dark / light）で揃える。混在させると認知負荷が上がる |
| **連続 (Continuity)** | 視線は流れに沿って動く | 上端のスペキュラ・ハイライトを各 panel で揃えると視線が水平に滑る |
| **図と地 (Figure / Ground)** | 前景と背景が明確だと迷わない | scene-bg の楕円グラデ＋上層 glass の二層構造で、ガラス（前景）とアンビエント（地）を分離する |

> **使用箇所**: サイト全般、ダッシュボード、プレゼン資料の情報整理。

### 11-2. 五分割法（ヒーロー・キービジュアル）

主役（写真・大見出し・KV）の配置に使う。画面を縦横それぞれ 5 等分した「**1/5 ライン**」と「**交点**」に主要素を乗せると、編集的で品のある余白が生まれる。Liquid では glass-panel やヒーロー上の iridescent strip と組み合わせて使う。

```css
.hero {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows:    repeat(5, 1fr);
  aspect-ratio: 16 / 9;
  min-height: 540px;
  border-radius: var(--r-xl);
  background: var(--glass-warm);
  backdrop-filter: var(--glass-blur-lg);
  border: 1px solid var(--glass-border-w);
  box-shadow: var(--glass-hl), var(--glass-shadow-lg);
  overflow: hidden;
}
.hero-headline { grid-column: 2 / span 3; grid-row: 2 / span 2; }
.hero-image    { grid-column: 4 / span 2; grid-row: 4 / span 2; align-self: end; }
```

> **印象**: 洗練・余白・編集的・モード感。Liquid Glass の演出感とよく合う。

### 11-3. ヴァン・デ・グラーフ・カノン / 写本比率（プレゼン・章扉）

ページ全体に対するテキストエリアの古典的配置比率。Liquid では「**glass-panel をスライドに敷いた上で、内側マージンに Van de Graaf 近似比率を適用**」する。

```css
/* A4 縦比率の章扉スライド（Liquid 流） */
.canon-slide {
  aspect-ratio: 1 / 1.414;
  position: relative;
  background: var(--glass-warm);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-w);
  box-shadow: var(--glass-hl), var(--glass-shadow-lg);
  border-radius: var(--r-xl);
  padding: 11.1% 22.2% 22.2% 11.1%;  /* top / right / bottom / left */
  overflow: hidden;
}
.canon-slide::before {           /* 上端スペキュラ */
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.85) 50%, transparent);
}
```

> **使用箇所**: タイトルスライド、コンセプト説明、提案書の章扉、写真大きめのページ。
> **強み**: 余白が上品・下重心・エディトリアル感・「呼吸している紙面」になる。

---

## 12. ファイル・フォルダ構成（参考）

```
project/
├── CLAUDE.md          ← Claude Code への指示（CLAUDE_template.md を基に作成）
├── design.md          ← このファイルをコピー（or 参照）
├── src/
│   ├── styles/
│   │   ├── tokens.css       ← 全 CSS 変数（color + glass + radius + ease）
│   │   ├── glass.css        ← glass-panel / card / btn / nav 等
│   │   └── components.css   ← その他コンポーネント
│   └── components/
└── ...
```

---

*最終更新: 2026-04-30 | instyle.group Creative Team — Liquid Glass Edition*
