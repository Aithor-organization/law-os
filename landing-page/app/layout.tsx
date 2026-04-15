import type { Metadata } from "next";
import "./globals.css";

const SITE = "https://lawos.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "LAW.OS — 법률 공부의 새로운 OS",
  description:
    "⌘K 하나로 2,341개 판례와 민법 전체를 탐색하는 AI 법률 튜터. Terminal for Korean Law Students.",
  keywords: [
    "법률 AI",
    "법률 챗봇",
    "변호사시험",
    "민법",
    "형법",
    "헌법",
    "로스쿨",
    "판례 검색",
  ],
  authors: [{ name: "LAW.OS inc." }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE,
    siteName: "LAW.OS",
    title: "LAW.OS — 법률 공부의 새로운 OS",
    description:
      "⌘K 하나로 2,341개 판례와 민법 전체를 탐색하는 AI 법률 튜터",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "LAW.OS — Terminal for Korean Law Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LAW.OS — 법률 공부의 새로운 OS",
    description: "⌘K 하나로 민법 전체를 탐색하는 AI 법률 튜터",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Structured data (SoftwareApplication schema) — for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LAW.OS",
  applicationCategory: "EducationalApplication",
  operatingSystem: "iOS, Android",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "2341",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
