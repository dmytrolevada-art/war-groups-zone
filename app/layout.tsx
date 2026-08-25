import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://war-groups-zone.dmytrolevada.chatgpt.site"),
  title: "War Groups: Зона",
  description: "Мрачная браузерная RTS о войне группировок за Чернобыльскую Зону.",
  openGraph: {
    title: "War Groups: Зона",
    description: "Захватывайте территории, управляйте отрядами и переживите войну группировок.",
    images: [{ url: "/og.png", width: 1200, height: 628, alt: "War Groups: Зона" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "War Groups: Зона",
    description: "Тактическая браузерная RTS о живой Зоне.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
