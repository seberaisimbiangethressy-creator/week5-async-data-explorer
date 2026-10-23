import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  // "./" makes asset paths relative so the built site works on GitHub Pages
  // (which serves from /repo-name/) as well as on Netlify/Vercel.
  base: "./",
  plugins: [tailwindcss()],
})
