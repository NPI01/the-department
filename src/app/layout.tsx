import type { Metadata } from "next";
import "./globals.css";

/* Fonts come from Google Fonts as a stylesheet rather than next/font: the
   next/font/google loader failed under Turbopack in Vercel's build sandbox
   ("queries have exactly one entry", 2026-10-11) while working in dev. */
const FONTS = "https://fonts.googleapis.com/css2?family=Oswald:wght@300;500;700&family=Special+Elite&family=Geist+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://weird.delivery"),
  title: "Weird.Delivery presents The Department",
  description: "A play-by-mail game of secrets, bureaucracy and the impossible. October 1977. North Dakota. One letter a day. Nobody will tell you what the company makes.",
  openGraph: {
    title: "The Department — a play-by-mail game",
    description: "You've just accepted a position with Royce Industries. One letter a day. Fourteen days an episode. Nobody will tell you what the company makes.",
    images: [{ url: "/images/building-x.jpg", width: 1456, height: 816 }],
    siteName: "Weird.Delivery",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-full flex flex-col grain">{children}</body>
    </html>
  );
}
