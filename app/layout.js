import "./globals.css";
import { Outfit, Reenie_Beanie } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const reenie = Reenie_Beanie({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-reenie",
  display: "swap",
});

export const metadata = {
  title: "Softly — A quieter way to live with your screen",
  description:
    "Softly is a digital living room — a small, intentional companion for slowing down with your devices. Built by Naman Mehra.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${reenie.variable}`}>
      <body className="font-sans bg-bg text-stone-800 antialiased">
        <div className="grain-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}
