import type { Metadata } from "next";
import { Geist_Mono, Oswald, Special_Elite } from "next/font/google";
import "./globals.css";

const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["300", "500", "700"] });
const elite = Special_Elite({ variable: "--font-special-elite", subsets: ["latin"], weight: "400" });

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
    <html lang="en" className={`${mono.variable} ${oswald.variable} ${elite.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col grain">{children}</body>
    </html>
  );
}
