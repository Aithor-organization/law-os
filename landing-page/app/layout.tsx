import type { Metadata } from "next";
import "./globals.css";

const SITE = "https://lawos.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "LAW.OS — 법률 공부, 주머니 속에서",
  description:
    "2,341개 판례와 민법 전체를 탐색하는 AI 법률 튜터. 언제 어디서나 물어보고 즉시 답을 받으세요.",
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
    title: "LAW.OS — 법률 공부, 주머니 속에서",
    description:
      "2,341개 판례와 민법 전체를 탐색하는 AI 법률 튜터. 모바일 앱으로 언제 어디서나.",
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
    title: "LAW.OS — 법률 공부, 주머니 속에서",
    description: "모바일 AI 법률 튜터 · 언제 어디서나 판례 검색",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Structured data (SoftwareApplication schema) — for SEO
// 출시 전이므로 집계 평점(aggregateRating)은 포함하지 않음. 실제 데이터 축적 후 추가.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LAW.OS",
  applicationCategory: "EducationalApplication",
  operatingSystem: "iOS, Android",
  description: "법학도를 위한 AI 법률 학습 튜터 — 민법/형법/헌법 조문과 판례를 출처와 함께 답변",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
    availability: "https://schema.org/PreOrder",
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
