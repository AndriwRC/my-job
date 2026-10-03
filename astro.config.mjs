// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Space Grotesk",
      cssVariable: "--font-display",
      weights: ["300 700"],
      styles: ["normal"],
      subsets: ["latin"],
      display: "swap",
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
