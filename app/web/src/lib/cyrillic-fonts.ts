import { Cormorant_Garamond, Inter } from "next/font/google";

export const cyrillicDisplay = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400"],
  variable: "--font-display",
});

export const cyrillicEditorial = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["italic", "normal"],
  variable: "--font-editorial",
});
