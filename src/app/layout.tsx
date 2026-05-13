import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://app.instyle.group/ig-builder-light";
const ASSETS = "https://app.instyle.group/_shared/static";

const TITLE = "IGビルダーライト | INSTYLE GROUP";
const DESCRIPTION =
  "PDF / 画像 / Word / PowerPoint / HTML を入れると、instyle.group デザインシステムに沿って美しい HTML にリデザインします。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: `${ASSETS}/favicon.png`, apple: `${ASSETS}/favicon.png` },
  openGraph: {
    type: "website",
    siteName: "INSTYLE GROUP",
    locale: "ja_JP",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${ASSETS}/ogp.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${ASSETS}/ogp.jpg`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="scene-bg" aria-hidden="true" />
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
