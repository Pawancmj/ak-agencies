import type { Metadata } from "next";
import { Jost, Cormorant_Garamond, Cinzel, Marck_Script } from "next/font/google";
import "./globals.css";
import { CartProvider, WishlistProvider, UIProvider } from "@/store";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const marck = Marck_Script({
  variable: "--font-marck",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shreeratan Furnishing Barabanki | Premium Home Furnishing Solutions",
    template: "%s | Shreeratan Furnishing",
  },
  description:
    "Shreeratan Furnishing Barabanki — Complete home furnishing solutions. Premium curtains, sofa covers, bedsheets, cushion covers, carpets, towels, and home décor. Custom stitching available. Pan India delivery.",
  keywords: [
    "home furnishing",
    "curtains",
    "sofa covers",
    "bedsheets",
    "cushion covers",
    "carpets",
    "towels",
    "home décor",
    "custom curtains",
    "Barabanki",
    "Shreeratan Furnishing",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Shreeratan Furnishing",
    title: "Shreeratan Furnishing Barabanki | Premium Home Furnishing Solutions",
    description:
      "Complete home furnishing solutions. Premium curtains, sofa covers, bedsheets, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jost.variable} ${cormorant.variable} ${cinzel.variable} ${marck.variable}`}>
      <body className="min-h-screen bg-background text-text antialiased">
        <UIProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </UIProvider>
      </body>
    </html>
  );
}
