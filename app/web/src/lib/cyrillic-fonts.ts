import { Cormorant_Garamond, Inter } from "next/font/google";

// Same configuration as the base Inter in the root layout so next/font emits
// identical font files and the browser downloads Inter only once.
export const cyrillicDisplay = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

// Editorial accent font: skip the render-blocking preload of its 16 weight ×
// style × subset files — display:swap loads it as soon as it is actually used.
export const cyrillicEditorial = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["italic", "normal"],
  variable: "--font-editorial",
  preload: false,
});
