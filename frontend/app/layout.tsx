import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마인크래프트 인벤토리 Todo",
  description: "마인크래프트 인벤토리 스타일 Todo 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
