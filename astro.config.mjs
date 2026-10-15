import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from '@tailwindcss/vite';

import icon from "astro-icon";

// bejamas:astro-fonts:start
/** @type {NonNullable<import("astro").AstroUserConfig["fonts"]>} */
const BEJAMAS_ASTRO_FONTS = [
  {
    provider: fontProviders.google(),
    name: "Inter",
    cssVariable: "--site-font",
    subsets: ["latin"],
  },
];
// bejamas:astro-fonts:end

export default defineConfig({
  fonts: BEJAMAS_ASTRO_FONTS,

  // Adicione esta linha:
  scopedStyleStrategy: 'class',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [icon()]
});
