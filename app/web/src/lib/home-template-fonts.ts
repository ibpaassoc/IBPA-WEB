import { Cormorant_Garamond, Marck_Script } from "next/font/google";

export const homeTemplateDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal"],
  variable: "--font-home-template-display",
});

export const homeTemplateAccent = Marck_Script({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-home-template-accent",
});
