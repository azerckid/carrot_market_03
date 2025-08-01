import type { Metadata } from "next";
import { Orbit } from "next/font/google";
import "./globals.css";

const orbit = Orbit({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-orbit",
});

export const metadata: Metadata = {
  title: {
    template: "%s | GUEST HOUSE",
    default: "GUEST HOUSE",
  },
  description: "GUEST HOUSE에 어서오세요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-neutral-800">
      <body
        className={`${orbit.variable} ${orbit.className} antialiased bg-neutral-700 text-white max-w-screen-sm mx-auto min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
