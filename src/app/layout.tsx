import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "こころ寄り添いアニメ処方箋 | 静久",
  description: "落ち込んだ夜、親身な友達が選んでくれる、傷つかないアニメ提案",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" style={{ colorScheme: "light" }}>
      <body className="antialiased text-[#2B2319] bg-[#FAF7F2] min-h-screen">
        {children}
      </body>
    </html>
  );
}
